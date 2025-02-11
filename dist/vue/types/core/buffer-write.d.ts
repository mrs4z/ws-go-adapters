export declare class BufferWrite {
    #private;
    private buf;
    Push(data: number[] | Uint8Array): void;
    PushArray(arr: number[] | Uint8Array): void;
    PushByte(val: number): void;
    PushNum(val: number, size: number): void;
    PushString(val: string, lenSize: number): void;
    ByteArray(): Uint8Array;
}
