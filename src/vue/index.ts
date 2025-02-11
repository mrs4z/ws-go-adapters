import { App, inject, InjectionKey, Plugin, ref } from 'vue'
import { WebSocketCore } from '../core/ws-core'
import { WebSocketMessage, WebSocketResponse } from '../types'

interface WebSocketState {
	isConnected: boolean
	lastMessage: WebSocketMessage | null
}

export const WebSocketSymbol: InjectionKey<{
	state: WebSocketState
	sendMessage: (
		command: string,
		data: any,
		files?: Record<string, Uint8Array>,
		timeout?: number
	) => Promise<WebSocketResponse>
}> = Symbol('WebSocket')

export const createWebSocketPlugin = (url: string): Plugin => {
	return {
		install: (app: App) => {
			const socket = new WebSocketCore(url)
			const state = {
				isConnected: ref(false),
				lastMessage: ref<WebSocketMessage | null>(null),
			}

			socket.on('connected', () => (state.isConnected.value = true))
			socket.on('disconnected', () => (state.isConnected.value = false))
			socket.on('message', message => (state.lastMessage.value = message))

			const websocket = {
				state,
				sendMessage: (
					command: string,
					data: any,
					files?: Record<string, Uint8Array>,
					timeout?: number
				) => {
					return socket.sendMessage(command, data, files, timeout)
				},
			}

			app.provide(WebSocketSymbol, websocket)
			app.config.globalProperties.$websocket = websocket
		},
	}
}

// Vue composable
export const useWebSocket = () => {
	const websocket = inject(WebSocketSymbol)
	if (!websocket) {
		throw new Error('WebSocket plugin not installed')
	}
	return websocket
}
