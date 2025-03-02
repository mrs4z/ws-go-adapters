// src/core/ws-core.ts
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
	#messageQueue: Array<{
		command: string
		data: any
		files: Record<string, Uint8Array>
		timeout: number
		resolver: {
			resolve: (value: WebSocketResponse) => void
			reject: (reason: any) => void
		}
	}> = []
	#topicSubscribers = new Map<
		string,
		Set<(data: any, files?: Record<string, Uint8Array>) => void>
	>()

	constructor(private url: string) {
		this.connect()
	}

	connect(): void {
		this.#ws = new WebSocket(this.url)
		this.#ws.binaryType = 'arraybuffer'

		this.#ws.onopen = () => {
			this.#connected = true
			this.#emit('connected')
			this.#processQueue()
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
			try {
				const req = Request.Read(event.data)

				if (req.Type === Request.TypeAnswer) {
					const waitItem = this.#waitMap.get(req.ID)
					if (waitItem) {
						clearTimeout(waitItem.timerId)
						waitItem.resolve({ data: req.Data, files: req.Files })
						this.#waitMap.delete(req.ID)
					}
				} else if (req.Type === Request.TypeEvent) {
					// Handle topic-based subscriptions
					if (req.Command && this.#topicSubscribers.has(req.Command)) {
						const subscribers = this.#topicSubscribers.get(req.Command)
						if (subscribers) {
							subscribers.forEach(callback => {
								try {
									callback(req.Data, req.Files)
								} catch (err) {
									console.error('Error in topic subscriber callback:', err)
								}
							})
						}
					}

					// General message event
					this.#emit('message', {
						command: req.Command,
						data: req.Data,
						files: req.Files,
					})
				}
			} catch (err) {
				console.error('Error processing WebSocket message:', err)
				this.#emit(
					'error',
					err instanceof Error
						? err
						: new Error('Error processing WebSocket message')
				)
			}
		}
	}

	#processQueue(): void {
		if (
			!this.#connected ||
			!this.#ws ||
			this.#ws.readyState !== WebSocket.OPEN
		) {
			return
		}

		// Process any queued messages
		while (this.#messageQueue.length > 0) {
			const msg = this.#messageQueue.shift()
			if (msg) {
				// Вместо рекурсивного вызова sendMessage, отправляем сообщение напрямую
				const id = ++this.#idCounter
				const timeoutTs = Date.now() / 1000 + msg.timeout

				const req = new Request(
					msg.command,
					msg.data,
					msg.files,
					Request.TypeRequest,
					timeoutTs,
					id
				)

				const timerId = window.setTimeout(() => {
					this.#waitMap.delete(id)
					msg.resolver.reject(new Error('Request timeout'))
				}, msg.timeout * 1000)

				this.#waitMap.set(id, {
					resolve: msg.resolver.resolve,
					reject: msg.resolver.reject,
					timerId,
				})

				this.#ws!.send(req.ByteArray())
			}
		}
	}

	async sendMessage(
		command: string,
		data: any,
		files: Record<string, Uint8Array> = {},
		timeout = 5
	): Promise<WebSocketResponse> {
		// Всегда возвращаем Promise, который либо отправит сообщение немедленно,
		// либо добавит его в очередь для отправки после установления соединения
		return new Promise((resolve, reject) => {
			// Если соединение открыто, отправляем сразу
			if (
				this.#connected &&
				this.#ws &&
				this.#ws.readyState === WebSocket.OPEN
			) {
				const id = ++this.#idCounter
				const timeoutTs = Date.now() / 1000 + timeout

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
				this.#ws.send(req.ByteArray())
			} else {
				// Иначе добавляем в очередь для последующей отправки
				this.#messageQueue.push({
					command,
					data,
					files,
					timeout,
					resolver: { resolve, reject },
				})

				// Устанавливаем тайм-аут на случай, если соединение не будет установлено
				const queueTimerId = window.setTimeout(() => {
					// Находим и удаляем сообщение из очереди
					const index = this.#messageQueue.findIndex(
						msg => msg.command === command && msg.resolver.resolve === resolve
					)

					if (index !== -1) {
						this.#messageQueue.splice(index, 1)
						reject(new Error('WebSocket connection timed out'))
					}
				}, Math.max(timeout * 1000, 10000)) // Используем максимальное значение - либо тайм-аут сообщения, либо 10 секунд

				// Если соединение отсутствует, но не было попытки соединения, пробуем соединиться
				if (!this.#ws || this.#ws.readyState === WebSocket.CLOSED) {
					this.connect()
				}
			}
		})
	}

	// Subscribe to a specific topic/command
	subscribe(
		topic: string,
		callback: (data: any, files?: Record<string, Uint8Array>) => void
	): () => void {
		if (!this.#topicSubscribers.has(topic)) {
			this.#topicSubscribers.set(topic, new Set())
		}

		this.#topicSubscribers.get(topic)!.add(callback)

		// Return unsubscribe function
		return () => {
			const subscribers = this.#topicSubscribers.get(topic)
			if (subscribers) {
				subscribers.delete(callback)
				if (subscribers.size === 0) {
					this.#topicSubscribers.delete(topic)
				}
			}
		}
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
		this.#topicSubscribers.clear()
		this.#messageQueue = []
	}
}
