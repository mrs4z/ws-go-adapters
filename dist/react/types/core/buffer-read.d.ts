export declare class BufferRead {
    #private;
    constructor(buf: Uint8Array | ArrayBuffer);
    ReadByte(): number;
    ReadBytes(count: number): Uint8Array;
    ReadNum(size: number): number;
    ReadString(lenSize: number): string;
}
