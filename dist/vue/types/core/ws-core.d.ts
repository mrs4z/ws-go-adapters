import { WebSocketEventMap, WebSocketResponse } from '../types';
export declare class WebSocketCore {
    #private;
    private url;
    constructor(url: string);
    connect(): void;
    sendMessage(command: string, data: any, files?: Record<string, Uint8Array>, timeout?: number): Promise<WebSocketResponse>;
    on<K extends keyof WebSocketEventMap>(event: K, handler: WebSocketEventMap[K]): () => void;
    off<K extends keyof WebSocketEventMap>(event: K, handler: WebSocketEventMap[K]): void;
    get isConnected(): boolean;
    destroy(): void;
}
