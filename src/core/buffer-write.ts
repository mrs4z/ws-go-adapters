export class BufferWrite {
	private buf: number[] = []

	static #ntob(num: number, size: number): number[] {
		if (num < 0) {
			throw new Error('Negative numbers are not supported')
		}

		const bytes = new Array<number>(size)
		for (let i = size - 1; i >= 0; i--) {
			bytes[i] = num & 0xff
			num = num >> 8
		}

		if (num > 0) {
			throw new Error('Number is too large for specified size')
		}

		return bytes
	}

	Push(data: number[] | Uint8Array): void {
		this.buf = this.buf.concat(Array.from(data))
	}

	PushArray(arr: number[] | Uint8Array): void {
		this.Push(Array.from(arr))
	}

	PushByte(val: number): void {
		if (val < 0 || val > 255) {
			throw new Error('Byte value must be between 0 and 255')
		}
		this.buf.push(val)
	}

	PushNum(val: number, size: number): void {
		const data = BufferWrite.#ntob(val, size)
		this.Push(data)
	}

	PushString(val: string, lenSize: number): void {
		const encoder = new TextEncoder()
		const bArr = encoder.encode(val)

		if (bArr.length > Math.pow(2, lenSize * 8) - 1) {
			throw new Error('String is too long for specified length size')
		}

		// length
		this.PushNum(bArr.length, lenSize)
		// string
		this.Push(Array.from(bArr))
	}

	ByteArray(): Uint8Array {
		return new Uint8Array(this.buf)
	}
}
