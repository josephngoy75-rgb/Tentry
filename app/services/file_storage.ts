import { randomUUID } from 'node:crypto'
import { copyFile, mkdir, open, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import app from '@adonisjs/core/services/app'

export const uploadDir = () => app.makePath('storage/uploads')

/**
 * Lit les premiers octets d'un fichier, de quoi reconnaître son vrai format.
 */
export async function readHead(path: string, length = 12): Promise<Uint8Array> {
  const handle = await open(path, 'r')
  try {
    const buffer = Buffer.alloc(length)
    const { bytesRead } = await handle.read(buffer, 0, length, 0)
    return buffer.subarray(0, bytesRead)
  } finally {
    await handle.close()
  }
}

/**
 * Copie un fichier téléversé dans storage/uploads sous un nom aléatoire
 * (jamais le nom fourni par l'utilisateur). Retourne le nom du fichier créé.
 */
export async function saveUpload(tmpPath: string, extension: string): Promise<string> {
  const filename = `${randomUUID()}.${extension}`
  await mkdir(uploadDir(), { recursive: true })
  await copyFile(tmpPath, join(uploadDir(), filename))
  return filename
}

export async function deleteUpload(filename: string): Promise<void> {
  await unlink(join(uploadDir(), filename)).catch(() => {})
}
