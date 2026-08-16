export type RiskLevel = 0.25 | 0.30 | 0.35 | 0.40

export type RisInput = {
  publicCount: number
  p2: RiskLevel
  e1: RiskLevel
  e2: RiskLevel
}

export type RisResult = {
  weightedPublic: number
  riskIndex: number
  ris: number
  dpsType: string
  interveners: number | null
  note: string
}

export function calculateRis(input: RisInput): RisResult {
  const p1 = Math.max(0, input.publicCount || 0)
  const weightedPublic = p1 <= 100000 ? p1 : 100000 + (p1 - 100000) / 2
  const riskIndex = input.p2 + input.e1 + input.e2
  const ris = riskIndex * weightedPublic / 1000

  let dpsType = "À la diligence de l’autorité de police compétente"
  let interveners: number | null = null
  let note = "Le RIS ne rend pas automatiquement un DPS obligatoire. L’autorité de police peut toutefois imposer un dispositif."

  if (ris > 0.25 && ris <= 1.125) {
    dpsType = "PAPS — Point d’alerte et de premiers secours"
    interveners = 2
    note = "Le PAPS constitue le dispositif minimal dans cette tranche de RIS."
  } else if (ris > 1.125 && ris <= 12) {
    dpsType = "DPS de petite envergure"
    interveners = ris <= 4 ? 4 : Math.ceil(ris)
    if (interveners % 2 !== 0) interveners += 1
    note = "Entre 1,125 et 4, l’effectif est fixé à 4 IS ; au-delà, l’effectif retenu est arrondi au nombre pair immédiatement supérieur."
  } else if (ris > 12 && ris <= 36) {
    dpsType = "DPS de moyenne envergure"
    interveners = Math.ceil(ris)
    if (interveners % 2 !== 0) interveners += 1
    note = "L’effectif d’IS est arrondi au nombre pair immédiatement supérieur."
  } else if (ris > 36) {
    dpsType = "DPS de grande envergure"
    interveners = Math.ceil(ris)
    if (interveners % 2 !== 0) interveners += 1
    note = "L’effectif d’IS est arrondi au nombre pair immédiatement supérieur."
  }

  if (input.e2 === 0.40 && ris > 0.25 && ris <= 1.125) {
    dpsType = "DPS de petite envergure au minimum"
    interveners = 4
    note = "Le référentiel prévoit qu’avec des secours publics situés à plus de 30 minutes, un DPS de petite envergure est obligatoire au minimum."
  }

  return { weightedPublic, riskIndex, ris, dpsType, interveners, note }
}
