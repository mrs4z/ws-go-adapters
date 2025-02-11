import { BufferRead } from './buffer-read'
import { BufferWrite } from './buffer-write'

export interface RequestFile {
	name: string
	data: Uint8Array
}

export interface RequestData {
	[key: string]: any
}

export class Request {
	static readonly TypeRequest = 0
	static readonly TypeAnswer = 1
	static readonly TypeEvent = 2

	ID: number
	Timeout: number
	Command: string
	Data: RequestData
	Files: Record<string, Uint8Array>
	Type: number

	constructor(
		command: string = '',
		data: RequestData = {},
		files: Record<string, Uint8Array> = {},
		type: number = Request.TypeRequest,
		timeout: number = 0,
		id: number = 0
	) {
		this.ID = id
		this.Timeout = timeout
		this.Command = command
		this.Data = data
		this.Files = files
		this.Type = type
	}

	ByteArray(): Uint8Array {
		const buf = new BufferWrite()

		// type
		buf.PushByte(this.Type)

		if (this.Type === Request.TypeRequest || this.Type === Request.TypeEvent) {
			// id (2)
			buf.PushNum(this.ID, 2)
			if (this.Type === Request.TypeRequest) {
				// timeout (8)
				buf.PushNum(this.Timeout, 8)
			}
		}

		// command (2)
		buf.PushString(this.Command, 2)

		// data (8)
		buf.PushString(JSON.stringify(this.Data), 8)

		// files_count (2)
		const filesCount = Object.keys(this.Files).length
		buf.PushNum(filesCount, 2)

		// files
		if (filesCount > 0) {
			for (const [name, data] of Object.entries(this.Files)) {
				// file_name (2)
				buf.PushString(name, 2)
				// file_body_size (8)
				buf.PushNum(data.length, 8)
				// file body
				buf.Push(data)
			}
		}

		return buf.ByteArray()
	}

	static Read(data: ArrayBuffer): Request {
		const buf = new BufferRead(data)
		const req = new Request()

		// type
		req.Type = buf.ReadByte()

		if (req.Type === Request.TypeRequest || req.Type === Request.TypeAnswer) {
			// id (2)
			req.ID = buf.ReadNum(2)
			if (req.Type === Request.TypeRequest) {
				// timeout (8)
				req.Timeout = buf.ReadNum(8)
			}
		}

		// command (2)
		req.Command = buf.ReadString(2)

		// data (8)
		const jsonStr = buf.ReadString(8)
		try {
			req.Data = JSON.parse(jsonStr)
		} catch (e) {
			throw new Error(`Failed to parse request data: ${e}`)
		}

		// files_count (2)
		const filesCount = buf.ReadNum(2)

		// files
		req.Files = {}
		for (let i = 0; i < filesCount; i++) {
			const name = buf.ReadString(2)
			const fileSize = buf.ReadNum(8)
			const fileData = buf.ReadBytes(fileSize)
			req.Files[name] = fileData
		}

		return req
	}
}
