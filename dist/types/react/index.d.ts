import React from 'react';
import { WebSocketMessage, WebSocketResponse } from '../types';
interface WebSocketContextValue {
    isConnected: boolean;
    sendMessage: (command: string, data: any, files?: Record<string, Uint8Array>, timeout?: number) => Promise<WebSocketResponse>;
    lastMessage: WebSocketMessage | null;
}
interface WebSocketProviderProps {
    url: string;
    children: React.ReactNode;
}
export declare const WebSocketProvider: React.FC<WebSocketProviderProps>;
export declare const useWebSocket: () => WebSocketContextValue;
export {};
