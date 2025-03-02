// Это файл src/types/index.ts
// Импорт для Vue типов (нужен только для определения типов)
import { Ref } from 'vue'

export interface WebSocketMessage {
	command: string
	data: any
	files?: Record<string, Uint8Array>
}

export interface WebSocketResponse {
	data: any
	files?: Record<string, Uint8Array>
}

export interface WebSocketHandler {
	(message: WebSocketMessage): void
}

export interface WebSocketEventMap {
	connected: () => void
	disconnected: () => void
	message: (message: WebSocketMessage) => void
	error: (error: Error) => void
}

export interface TopicSubscriber<T = any> {
	(data: T, files?: Record<string, Uint8Array>): void
}

// Type for Vue's global properties
declare module '@vue/runtime-core' {
	interface ComponentCustomProperties {
		$websocket: {
			state: {
				isConnected: Ref<boolean>
				lastMessage: Ref<WebSocketMessage | null>
			}
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
	}
}
