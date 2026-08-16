import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export const runtime = 'nodejs'

const dataDir = path.join(process.cwd(), 'data')
const dbFile = path.join(dataDir, 'manif-events.json')

async function ensureDb() {
  await fs.mkdir(dataDir, { recursive: true })
  try { await fs.access(dbFile) } catch { await fs.writeFile(dbFile, '[]', 'utf8') }
}

export async function GET() {
  await ensureDb()
  try {
    const raw = await fs.readFile(dbFile, 'utf8')
    return NextResponse.json(JSON.parse(raw || '[]'))
  } catch {
    return NextResponse.json([])
  }
}

export async function PUT(request: Request) {
  const events = await request.json()
  if (!Array.isArray(events)) return NextResponse.json({ error: 'Format invalide' }, { status: 400 })
  await ensureDb()
  await fs.writeFile(dbFile, JSON.stringify(events, null, 2), 'utf8')
  return NextResponse.json({ ok: true, count: events.length })
}
