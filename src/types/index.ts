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
