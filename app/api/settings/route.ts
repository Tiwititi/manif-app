import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export const runtime = 'nodejs'

const dataDir = path.join(process.cwd(), 'data')
const dbFile = path.join(dataDir, 'manif-settings.json')
const defaults = {
  municipalityName: 'Commune pilote',
  submissionDays: 60,
  stock: { barriers: 80, tables: 30, chairs: 120 },
  procedures: [
    'Tout dossier doit être transmis au moins 60 jours avant la manifestation.',
    'Un plan est obligatoire pour toute demande de circulation ou de stationnement.',
    'Toute demande de matériel communal reste soumise à disponibilité.'
  ]
}

async function ensureDb() {
  await fs.mkdir(dataDir, { recursive: true })
  try { await fs.access(dbFile) } catch { await fs.writeFile(dbFile, JSON.stringify(defaults, null, 2), 'utf8') }
}

export async function GET() {
  await ensureDb()
  try {
    const raw = await fs.readFile(dbFile, 'utf8')
    return NextResponse.json(JSON.parse(raw || JSON.stringify(defaults)))
  } catch {
    return NextResponse.json(defaults)
  }
}

export async function PUT(request: Request) {
  const settings = await request.json()
  await ensureDb()
  await fs.writeFile(dbFile, JSON.stringify(settings, null, 2), 'utf8')
  return NextResponse.json({ ok: true })
}
