import { WebSocketEventMap, WebSocketResponse } from '../types'
import { Request } from './request'

export class WebSocketCore {
	#connected = false
	#idCounter = 0
	#waitMap = new Map<
		number,
		{
			resolve: (value: WebSocketResponse) => void
			reject: (reason: any) => void
			timerId: number
		}
	>()
	#handlers = new Map<keyof WebSocketEventMap, Set<any>>()
	#ws: WebSocket | null = null

	constructor(private url: string) {
		this.connect()
	}

	connect(): void {
		this.#ws = new WebSocket(this.url)
		this.#ws.binaryType = 'arraybuffer'

		this.#ws.onopen = () => {
			this.#connected = true
			this.#emit('connected')
		}

		this.#ws.onclose = () => {
			if (this.#connected) {
				this.#emit('disconnected')
			}
			this.#connected = false
			setTimeout(() => this.connect(), 3000)
		}

		this.#ws.onerror = error => {
			this.#emit(
				'error',
				error instanceof Error ? error : new Error('WebSocket error')
			)
			this.#ws?.close()
		}

		this.#ws.onmessage = event => {
			const req = Request.Read(event.data)

			if (req.Type === Request.TypeAnswer) {
				const waitItem = this.#waitMap.get(req.ID)
				if (waitItem) {
					clearTimeout(waitItem.timerId)
					waitItem.resolve({ data: req.Data, files: req.Files })
					this.#waitMap.delete(req.ID)
				}
			} else if (req.Type === Request.TypeEvent) {
				this.#emit('message', req)
			}
		}
	}

	async sendMessage(
		command: string,
		data: any,
		files: Record<string, Uint8Array> = {},
		timeout = 5
	): Promise<WebSocketResponse> {
		if (!this.#ws || this.#ws.readyState !== WebSocket.OPEN) {
			throw new Error('WebSocket is not connected')
		}

		const id = ++this.#idCounter
		const timeoutTs = Date.now() / 1000 + timeout

		return new Promise((resolve, reject) => {
			const req = new Request(
				command,
				data,
				files,
				Request.TypeRequest,
				timeoutTs,
				id
			)

			const timerId = window.setTimeout(() => {
				this.#waitMap.delete(id)
				reject(new Error('Request timeout'))
			}, timeout * 1000)

			this.#waitMap.set(id, { resolve, reject, timerId })
			this.#ws!.send(req.ByteArray())
		})
	}

	on<K extends keyof WebSocketEventMap>(
		event: K,
		handler: WebSocketEventMap[K]
	): () => void {
		if (!this.#handlers.has(event)) {
			this.#handlers.set(event, new Set())
		}
		this.#handlers.get(event)!.add(handler)
		return () => this.off(event, handler)
	}

	off<K extends keyof WebSocketEventMap>(
		event: K,
		handler: WebSocketEventMap[K]
	): void {
		const handlers = this.#handlers.get(event)
		if (handlers) {
			handlers.delete(handler)
		}
	}

	#emit<K extends keyof WebSocketEventMap>(
		event: K,
		...args: Parameters<WebSocketEventMap[K]>
	): void {
		const handlers = this.#handlers.get(event)
		if (handlers) {
			handlers.forEach(handler => handler(...args))
		}
	}

	get isConnected(): boolean {
		return this.#connected
	}

	destroy(): void {
		this.#ws?.close()
		this.#handlers.clear()
		this.#waitMap.clear()
	}
}
