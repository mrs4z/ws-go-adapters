import { InjectionKey, Plugin } from 'vue';
import { WebSocketMessage, WebSocketResponse } from '../types';
interface WebSocketState {
    isConnected: boolean;
    lastMessage: WebSocketMessage | null;
}
export declare const WebSocketSymbol: InjectionKey<{
    state: WebSocketState;
    sendMessage: (command: string, data: any, files?: Record<string, Uint8Array>, timeout?: number) => Promise<WebSocketResponse>;
}>;
export declare const createWebSocketPlugin: (url: string) => Plugin;
export declare const useWebSocket: () => {
    state: WebSocketState;
    sendMessage: (command: string, data: any, files?: Record<string, Uint8Array>, timeout?: number) => Promise<WebSocketResponse>;
};
export {};
