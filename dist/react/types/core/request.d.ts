export interface RequestFile {
    name: string;
    data: Uint8Array;
}
export interface RequestData {
    [key: string]: any;
}
export declare class Request {
    static readonly TypeRequest = 0;
    static readonly TypeAnswer = 1;
    static readonly TypeEvent = 2;
    ID: number;
    Timeout: number;
    Command: string;
    Data: RequestData;
    Files: Record<string, Uint8Array>;
    Type: number;
    constructor(command?: string, data?: RequestData, files?: Record<string, Uint8Array>, type?: number, timeout?: number, id?: number);
    ByteArray(): Uint8Array;
    static Read(data: ArrayBuffer): Request;
}
