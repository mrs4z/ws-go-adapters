// src/core/bufferRead.ts
export class BufferRead {
	#offset = 0
	#buf: Uint8Array

	constructor(buf: Uint8Array | ArrayBuffer) {
		this.#buf = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
	}

	static #bton(bytes: Uint8Array): number {
		let num = 0
		for (let i = 0; i < bytes.length; i++) {
			num = (num << 8) | bytes[i]
		}
		return num
	}

	ReadByte(): number {
		if (this.#offset >= this.#buf.length) {
			throw new Error('Buffer overflow while reading byte')
		}
		return this.#buf[this.#offset++]
	}

	ReadBytes(count: number): Uint8Array {
		if (this.#offset + count > this.#buf.length) {
			throw new Error('Buffer overflow while reading bytes')
		}
		const res = this.#buf.slice(this.#offset, this.#offset + count)
		this.#offset += count
		return res
	}

	ReadNum(size: number): number {
		const data = this.ReadBytes(size)
		return BufferRead.#bton(data)
	}

	ReadString(lenSize: number): string {
		const strLen = this.ReadNum(lenSize)
		if (strLen < 0 || this.#offset + strLen > this.#buf.length) {
			throw new Error('Invalid string length or buffer overflow')
		}
		const data = this.ReadBytes(strLen)
		const decoder = new TextDecoder('utf-8')
		return decoder.decode(data)
	}
}
