import { api } from '../api/client'

export const CHUNK_SIZE = 4 * 1024 * 1024
export const HARD_MAX = 25 * 1024 * 1024

const randomId = () => {
  const c = globalThis.crypto as { randomUUID?: () => string } | undefined
  const base = c?.randomUUID ? c.randomUUID() : `${Date.now()}${Math.random()}`
  return base.replace(/[^a-zA-Z0-9]/g, '').slice(0, 64)
}

export async function uploadInChunks(file: File, onProgress?: (fraction: number) => void): Promise<string> {
  const uploadId = randomId()
  const totalChunks = Math.max(1, Math.ceil(file.size / CHUNK_SIZE))
  let finalName = ''

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE
    const blob = file.slice(start, start + CHUNK_SIZE)
    const fd = new FormData()
    fd.append('uploadId', uploadId)
    fd.append('chunkIndex', String(i))
    fd.append('totalChunks', String(totalChunks))
    fd.append('originalName', file.name)
    fd.append('chunk', blob, file.name)

    const { data } = await api.post('/tada-media-chunk', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (!onProgress) return
        const chunkFraction = e.total ? e.loaded / e.total : 0
        onProgress(Math.min(1, (i + chunkFraction) / totalChunks))
      },
    })
    if (!data?.success) throw new Error(data?.error || 'Chunk upload failed')
    if (data.done && data.filename) finalName = data.filename
    onProgress?.((i + 1) / totalChunks)
  }

  if (!finalName) throw new Error('Chunk upload did not finalize')
  return finalName
}
