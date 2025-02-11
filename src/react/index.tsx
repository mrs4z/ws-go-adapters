import React, {
	createContext,
	useContext,
	useEffect,
	useState,
	useCallback,
} from 'react'
import { WebSocketCore } from '../core/ws-core'
import { WebSocketMessage, WebSocketResponse } from '../types'

interface WebSocketContextValue {
	isConnected: boolean
	sendMessage: (
		command: string,
		data: any,
		files?: Record<string, Uint8Array>,
		timeout?: number
	) => Promise<WebSocketResponse>
	lastMessage: WebSocketMessage | null
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null)

interface WebSocketProviderProps {
	url: string
	children: React.ReactNode
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
	url,
	children,
}) => {
	const [socket] = useState(() => new WebSocketCore(url))
	const [isConnected, setIsConnected] = useState(false)
	const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)

	useEffect(() => {
		socket.on('connected', () => setIsConnected(true))
		socket.on('disconnected', () => setIsConnected(false))
		socket.on('message', setLastMessage)

		return () => socket.destroy()
	}, [socket])

	const sendMessage = useCallback(
		(
			command: string,
			data: any,
			files?: Record<string, Uint8Array>,
			timeout?: number
		) => {
			return socket.sendMessage(command, data, files, timeout)
		},
		[socket]
	)

	return (
		<WebSocketContext.Provider
			value={{ isConnected, sendMessage, lastMessage }}
		>
			{children}
		</WebSocketContext.Provider>
	)
}

export const useWebSocket = () => {
	const context = useContext(WebSocketContext)
	if (!context) {
		throw new Error('useWebSocket must be used within WebSocketProvider')
	}
	return context
}
