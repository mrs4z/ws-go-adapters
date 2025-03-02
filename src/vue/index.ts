import { App, inject, InjectionKey, Plugin, ref, Ref } from 'vue'
import { WebSocketCore } from '../core/ws-core'
import { WebSocketMessage, WebSocketResponse } from '../types'

interface WebSocketState {
	isConnected: Ref<boolean>
	lastMessage: Ref<WebSocketMessage | null>
}

interface WebSocketAPI {
	state: WebSocketState
	sendMessage: (
		command: string,
		data: any,
		files?: Record<string, Uint8Array>,
		timeout?: number
	) => Promise<WebSocketResponse>
	subscribe: (
		topic: string,
		callback: (data: any, files?: Record<string, Uint8Array>) => void
	) => () => void
}

export const WebSocketSymbol: InjectionKey<WebSocketAPI> = Symbol('WebSocket')

export const createWebSocketPlugin = (url: string): Plugin => {
	return {
		install: (app: App) => {
			const socket = new WebSocketCore(url)
			const state: WebSocketState = {
				isConnected: ref(false),
				lastMessage: ref<WebSocketMessage | null>(null),
			}

			socket.on('connected', () => (state.isConnected.value = true))
			socket.on('disconnected', () => (state.isConnected.value = false))
			socket.on('message', message => (state.lastMessage.value = message))

			const websocket: WebSocketAPI = {
				state,
				sendMessage: (
					command: string,
					data: any,
					files?: Record<string, Uint8Array>,
					timeout?: number
				) => {
					return socket.sendMessage(command, data, files, timeout)
				},
				subscribe: (
					topic: string,
					callback: (data: any, files?: Record<string, Uint8Array>) => void
				) => {
					return socket.subscribe(topic, callback)
				},
			}

			app.provide(WebSocketSymbol, websocket)
			app.config.globalProperties.$websocket = websocket
		},
	}
}

// Vue composable
export const useWebSocket = (): WebSocketAPI => {
	const websocket = inject(WebSocketSymbol)
	if (!websocket) {
		throw new Error('WebSocket plugin not installed')
	}
	return websocket
}

// Topic-specific composable
export const useWebSocketTopic = <T = any>(topic: string) => {
	const { subscribe, state } = useWebSocket()
	const data = ref<T | null>(null)
	const files = ref<Record<string, Uint8Array> | undefined>(undefined)

	const unsubscribe = subscribe(topic, (newData, newFiles) => {
		data.value = newData as T
		if (newFiles) {
			files.value = newFiles
		}
	})

	// Cleanup function
	const cleanup = () => {
		unsubscribe()
	}

	return {
		data,
		files,
		isConnected: state.isConnected,
		cleanup,
	}
}
