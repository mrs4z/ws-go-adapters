import React, {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
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
	subscribe: (
		topic: string,
		callback: (data: any, files?: Record<string, Uint8Array>) => void
	) => () => void
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
		const connectedHandler = () => setIsConnected(true)
		const disconnectedHandler = () => setIsConnected(false)
		const messageHandler = (message: WebSocketMessage) =>
			setLastMessage(message)

		socket.on('connected', connectedHandler)
		socket.on('disconnected', disconnectedHandler)
		socket.on('message', messageHandler)

		return () => {
			socket.off('connected', connectedHandler)
			socket.off('disconnected', disconnectedHandler)
			socket.off('message', messageHandler)
			socket.destroy()
		}
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

	const subscribe = useCallback(
		(
			topic: string,
			callback: (data: any, files?: Record<string, Uint8Array>) => void
		) => {
			return socket.subscribe(topic, callback)
		},
		[socket]
	)

	const contextValue = useMemo(
		() => ({
			isConnected,
			sendMessage,
			lastMessage,
			subscribe,
		}),
		[isConnected, sendMessage, lastMessage, subscribe]
	)

	return (
		<WebSocketContext.Provider value={contextValue}>
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

// Custom hook for topic-based subscriptions
export const useWebSocketTopic = <T = any,>(topic: string) => {
	const { subscribe, isConnected } = useWebSocket()
	const [data, setData] = useState<T | null>(null)
	const [files, setFiles] = useState<Record<string, Uint8Array> | undefined>(
		undefined
	)

	useEffect(() => {
		const unsubscribe = subscribe(topic, (newData, newFiles) => {
			setData(newData as T)
			if (newFiles) {
				setFiles(newFiles)
			}
		})

		return unsubscribe
	}, [topic, subscribe])

	return {
		data,
		files,
		isConnected,
	}
}
