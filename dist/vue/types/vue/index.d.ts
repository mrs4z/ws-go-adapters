import { InjectionKey, Plugin, Ref } from 'vue';
import { WebSocketMessage, WebSocketResponse } from '../types';
interface WebSocketState {
    isConnected: Ref<boolean>;
    lastMessage: Ref<WebSocketMessage | null>;
}
interface WebSocketAPI {
    state: WebSocketState;
    sendMessage: (command: string, data: any, files?: Record<string, Uint8Array>, timeout?: number) => Promise<WebSocketResponse>;
    subscribe: (topic: string, callback: (data: any, files?: Record<string, Uint8Array>) => void) => () => void;
}
export declare const WebSocketSymbol: InjectionKey<WebSocketAPI>;
export declare const createWebSocketPlugin: (url: string) => Plugin;
export declare const useWebSocket: () => WebSocketAPI;
export declare const useWebSocketTopic: <T = any>(topic: string) => {
    data: [T | null] extends [Ref<any, any>] ? import("@vue/shared").IfAny<Ref<any, any> & T, Ref<Ref<any, any> & T, Ref<any, any> & T>, Ref<any, any> & T> : Ref<import("vue").UnwrapRef<T> | null, T | import("vue").UnwrapRef<T> | null>;
    files: Ref<Record<string, Uint8Array<ArrayBufferLike>> | undefined, Record<string, Uint8Array<ArrayBufferLike>> | undefined>;
    isConnected: Ref<boolean, boolean>;
    cleanup: () => void;
};
export {};
