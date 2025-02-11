/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise, SuppressedError, Symbol, Iterator */


function __classPrivateFieldGet(receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
}

function __classPrivateFieldSet(receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

var _a$1, _BufferRead_offset, _BufferRead_buf, _BufferRead_bton;
// src/core/bufferRead.ts
class BufferRead {
    constructor(buf) {
        _BufferRead_offset.set(this, 0);
        _BufferRead_buf.set(this, void 0);
        __classPrivateFieldSet(this, _BufferRead_buf, buf instanceof Uint8Array ? buf : new Uint8Array(buf), "f");
    }
    ReadByte() {
        var _b, _c;
        if (__classPrivateFieldGet(this, _BufferRead_offset, "f") >= __classPrivateFieldGet(this, _BufferRead_buf, "f").length) {
            throw new Error('Buffer overflow while reading byte');
        }
        return __classPrivateFieldGet(this, _BufferRead_buf, "f")[__classPrivateFieldSet(this, _BufferRead_offset, (_c = __classPrivateFieldGet(this, _BufferRead_offset, "f"), _b = _c++, _c), "f"), _b];
    }
    ReadBytes(count) {
        if (__classPrivateFieldGet(this, _BufferRead_offset, "f") + count > __classPrivateFieldGet(this, _BufferRead_buf, "f").length) {
            throw new Error('Buffer overflow while reading bytes');
        }
        const res = __classPrivateFieldGet(this, _BufferRead_buf, "f").slice(__classPrivateFieldGet(this, _BufferRead_offset, "f"), __classPrivateFieldGet(this, _BufferRead_offset, "f") + count);
        __classPrivateFieldSet(this, _BufferRead_offset, __classPrivateFieldGet(this, _BufferRead_offset, "f") + count, "f");
        return res;
    }
    ReadNum(size) {
        const data = this.ReadBytes(size);
        return __classPrivateFieldGet(_a$1, _a$1, "m", _BufferRead_bton).call(_a$1, data);
    }
    ReadString(lenSize) {
        const strLen = this.ReadNum(lenSize);
        if (strLen < 0 || __classPrivateFieldGet(this, _BufferRead_offset, "f") + strLen > __classPrivateFieldGet(this, _BufferRead_buf, "f").length) {
            throw new Error('Invalid string length or buffer overflow');
        }
        const data = this.ReadBytes(strLen);
        const decoder = new TextDecoder('utf-8');
        return decoder.decode(data);
    }
}
_a$1 = BufferRead, _BufferRead_offset = new WeakMap(), _BufferRead_buf = new WeakMap(), _BufferRead_bton = function _BufferRead_bton(bytes) {
    let num = 0;
    for (let i = 0; i < bytes.length; i++) {
        num = (num << 8) | bytes[i];
    }
    return num;
};

var _a, _BufferWrite_ntob;
class BufferWrite {
    constructor() {
        this.buf = [];
    }
    Push(data) {
        this.buf = this.buf.concat(Array.from(data));
    }
    PushArray(arr) {
        this.Push(Array.from(arr));
    }
    PushByte(val) {
        if (val < 0 || val > 255) {
            throw new Error('Byte value must be between 0 and 255');
        }
        this.buf.push(val);
    }
    PushNum(val, size) {
        const data = __classPrivateFieldGet(_a, _a, "m", _BufferWrite_ntob).call(_a, val, size);
        this.Push(data);
    }
    PushString(val, lenSize) {
        const encoder = new TextEncoder();
        const bArr = encoder.encode(val);
        if (bArr.length > Math.pow(2, lenSize * 8) - 1) {
            throw new Error('String is too long for specified length size');
        }
        // length
        this.PushNum(bArr.length, lenSize);
        // string
        this.Push(Array.from(bArr));
    }
    ByteArray() {
        return new Uint8Array(this.buf);
    }
}
_a = BufferWrite, _BufferWrite_ntob = function _BufferWrite_ntob(num, size) {
    if (num < 0) {
        throw new Error('Negative numbers are not supported');
    }
    const bytes = new Array(size);
    for (let i = size - 1; i >= 0; i--) {
        bytes[i] = num & 0xff;
        num = num >> 8;
    }
    if (num > 0) {
        throw new Error('Number is too large for specified size');
    }
    return bytes;
};

class Request {
    constructor(command = '', data = {}, files = {}, type = Request.TypeRequest, timeout = 0, id = 0) {
        this.ID = id;
        this.Timeout = timeout;
        this.Command = command;
        this.Data = data;
        this.Files = files;
        this.Type = type;
    }
    ByteArray() {
        const buf = new BufferWrite();
        // type
        buf.PushByte(this.Type);
        if (this.Type === Request.TypeRequest || this.Type === Request.TypeEvent) {
            // id (2)
            buf.PushNum(this.ID, 2);
            if (this.Type === Request.TypeRequest) {
                // timeout (8)
                buf.PushNum(this.Timeout, 8);
            }
        }
        // command (2)
        buf.PushString(this.Command, 2);
        // data (8)
        buf.PushString(JSON.stringify(this.Data), 8);
        // files_count (2)
        const filesCount = Object.keys(this.Files).length;
        buf.PushNum(filesCount, 2);
        // files
        if (filesCount > 0) {
            for (const [name, data] of Object.entries(this.Files)) {
                // file_name (2)
                buf.PushString(name, 2);
                // file_body_size (8)
                buf.PushNum(data.length, 8);
                // file body
                buf.Push(data);
            }
        }
        return buf.ByteArray();
    }
    static Read(data) {
        const buf = new BufferRead(data);
        const req = new Request();
        // type
        req.Type = buf.ReadByte();
        if (req.Type === Request.TypeRequest || req.Type === Request.TypeAnswer) {
            // id (2)
            req.ID = buf.ReadNum(2);
            if (req.Type === Request.TypeRequest) {
                // timeout (8)
                req.Timeout = buf.ReadNum(8);
            }
        }
        // command (2)
        req.Command = buf.ReadString(2);
        // data (8)
        const jsonStr = buf.ReadString(8);
        try {
            req.Data = JSON.parse(jsonStr);
        }
        catch (e) {
            throw new Error(`Failed to parse request data: ${e}`);
        }
        // files_count (2)
        const filesCount = buf.ReadNum(2);
        // files
        req.Files = {};
        for (let i = 0; i < filesCount; i++) {
            const name = buf.ReadString(2);
            const fileSize = buf.ReadNum(8);
            const fileData = buf.ReadBytes(fileSize);
            req.Files[name] = fileData;
        }
        return req;
    }
}
Request.TypeRequest = 0;
Request.TypeAnswer = 1;
Request.TypeEvent = 2;

var _WebSocketCore_instances, _WebSocketCore_connected, _WebSocketCore_idCounter, _WebSocketCore_waitMap, _WebSocketCore_handlers, _WebSocketCore_ws, _WebSocketCore_emit;
class WebSocketCore {
    constructor(url) {
        _WebSocketCore_instances.add(this);
        this.url = url;
        _WebSocketCore_connected.set(this, false);
        _WebSocketCore_idCounter.set(this, 0);
        _WebSocketCore_waitMap.set(this, new Map());
        _WebSocketCore_handlers.set(this, new Map());
        _WebSocketCore_ws.set(this, null);
        this.connect();
    }
    connect() {
        __classPrivateFieldSet(this, _WebSocketCore_ws, new WebSocket(this.url), "f");
        __classPrivateFieldGet(this, _WebSocketCore_ws, "f").binaryType = 'arraybuffer';
        __classPrivateFieldGet(this, _WebSocketCore_ws, "f").onopen = () => {
            __classPrivateFieldSet(this, _WebSocketCore_connected, true, "f");
            __classPrivateFieldGet(this, _WebSocketCore_instances, "m", _WebSocketCore_emit).call(this, 'connected');
        };
        __classPrivateFieldGet(this, _WebSocketCore_ws, "f").onclose = () => {
            if (__classPrivateFieldGet(this, _WebSocketCore_connected, "f")) {
                __classPrivateFieldGet(this, _WebSocketCore_instances, "m", _WebSocketCore_emit).call(this, 'disconnected');
            }
            __classPrivateFieldSet(this, _WebSocketCore_connected, false, "f");
            setTimeout(() => this.connect(), 3000);
        };
        __classPrivateFieldGet(this, _WebSocketCore_ws, "f").onerror = error => {
            __classPrivateFieldGet(this, _WebSocketCore_instances, "m", _WebSocketCore_emit).call(this, 'error', error instanceof Error ? error : new Error('WebSocket error'));
            __classPrivateFieldGet(this, _WebSocketCore_ws, "f")?.close();
        };
        __classPrivateFieldGet(this, _WebSocketCore_ws, "f").onmessage = event => {
            const req = Request.Read(event.data);
            if (req.Type === Request.TypeAnswer) {
                const waitItem = __classPrivateFieldGet(this, _WebSocketCore_waitMap, "f").get(req.ID);
                if (waitItem) {
                    clearTimeout(waitItem.timerId);
                    waitItem.resolve({ data: req.Data, files: req.Files });
                    __classPrivateFieldGet(this, _WebSocketCore_waitMap, "f").delete(req.ID);
                }
            }
            else if (req.Type === Request.TypeEvent) {
                __classPrivateFieldGet(this, _WebSocketCore_instances, "m", _WebSocketCore_emit).call(this, 'message', req);
            }
        };
    }
    async sendMessage(command, data, files = {}, timeout = 5) {
        var _a;
        if (!__classPrivateFieldGet(this, _WebSocketCore_ws, "f") || __classPrivateFieldGet(this, _WebSocketCore_ws, "f").readyState !== WebSocket.OPEN) {
            throw new Error('WebSocket is not connected');
        }
        const id = __classPrivateFieldSet(this, _WebSocketCore_idCounter, (_a = __classPrivateFieldGet(this, _WebSocketCore_idCounter, "f"), ++_a), "f");
        const timeoutTs = Date.now() / 1000 + timeout;
        return new Promise((resolve, reject) => {
            const req = new Request(command, data, files, Request.TypeRequest, timeoutTs, id);
            const timerId = window.setTimeout(() => {
                __classPrivateFieldGet(this, _WebSocketCore_waitMap, "f").delete(id);
                reject(new Error('Request timeout'));
            }, timeout * 1000);
            __classPrivateFieldGet(this, _WebSocketCore_waitMap, "f").set(id, { resolve, reject, timerId });
            __classPrivateFieldGet(this, _WebSocketCore_ws, "f").send(req.ByteArray());
        });
    }
    on(event, handler) {
        if (!__classPrivateFieldGet(this, _WebSocketCore_handlers, "f").has(event)) {
            __classPrivateFieldGet(this, _WebSocketCore_handlers, "f").set(event, new Set());
        }
        __classPrivateFieldGet(this, _WebSocketCore_handlers, "f").get(event).add(handler);
        return () => this.off(event, handler);
    }
    off(event, handler) {
        const handlers = __classPrivateFieldGet(this, _WebSocketCore_handlers, "f").get(event);
        if (handlers) {
            handlers.delete(handler);
        }
    }
    get isConnected() {
        return __classPrivateFieldGet(this, _WebSocketCore_connected, "f");
    }
    destroy() {
        __classPrivateFieldGet(this, _WebSocketCore_ws, "f")?.close();
        __classPrivateFieldGet(this, _WebSocketCore_handlers, "f").clear();
        __classPrivateFieldGet(this, _WebSocketCore_waitMap, "f").clear();
    }
}
_WebSocketCore_connected = new WeakMap(), _WebSocketCore_idCounter = new WeakMap(), _WebSocketCore_waitMap = new WeakMap(), _WebSocketCore_handlers = new WeakMap(), _WebSocketCore_ws = new WeakMap(), _WebSocketCore_instances = new WeakSet(), _WebSocketCore_emit = function _WebSocketCore_emit(event, ...args) {
    const handlers = __classPrivateFieldGet(this, _WebSocketCore_handlers, "f").get(event);
    if (handlers) {
        handlers.forEach(handler => handler(...args));
    }
};

export { BufferRead, BufferWrite, Request, WebSocketCore };
//# sourceMappingURL=index.esm.js.map
