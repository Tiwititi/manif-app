export type Answers = {
  name: string
  city: string
  date: string
  attendees: number
  publicSpace: boolean
  roadImpact: boolean
  alcohol: boolean
  music: boolean
  food: boolean
  insurance: boolean
}

export type Result = {
  id: string
  level: 'obligatoire' | 'verifier' | 'recommande'
  icon: string
  title: string
  summary: string
  why: string
  contact?: string
  source?: string
}

export function evaluate(a: Answers): Result[] {
  const results: Result[] = []

  if (a.publicSpace) results.push({
    id: 'public-space', level: 'obligatoire', icon: '📍', title: "Occupation de l’espace public",
    summary: "Une démarche auprès de la commune est à prévoir.",
    why: "Vous avez indiqué que la manifestation utilise un espace public.", contact: `Mairie de ${a.city || 'votre commune'}`,
    source: 'https://www.service-public.fr/particuliers/vosdroits/F31613'
  })

  if (a.roadImpact) results.push({
    id: 'traffic', level: 'verifier', icon: '🚧', title: 'Circulation / stationnement',
    summary: "Vérifiez les mesures et autorisations nécessaires avec la commune.",
    why: "Votre événement modifie la circulation ou le stationnement.", contact: `Mairie de ${a.city || 'votre commune'}`
  })

  if (a.alcohol) results.push({
    id: 'bar', level: 'obligatoire', icon: '🍺', title: 'Buvette temporaire',
    summary: "Demandez l’autorisation temporaire auprès du maire.",
    why: "Vous avez indiqué qu’une buvette servira de l’alcool.", contact: `Mairie de ${a.city || 'votre commune'}`,
    source: 'https://www.service-public.fr/particuliers/vosdroits/F24345'
  })

  if (a.music) results.push({
    id: 'music', level: 'obligatoire', icon: '🎵', title: 'Diffusion musicale',
    summary: "Vérifiez et effectuez les démarches liées à la diffusion publique de musique.",
    why: "Vous avez indiqué de la musique ou un DJ.", source: 'https://www.service-public.fr/entreprendre/vosdroits/F3094'
  })

  if (a.food) results.push({
    id: 'food', level: 'verifier', icon: '🍔', title: 'Restauration / hygiène',
    summary: "Précisez qui prépare et vend les aliments pour déterminer les règles applicables.",
    why: "Vous avez indiqué une activité de restauration.", source: 'https://entreprendre.service-public.fr/vosdroits/F33822'
  })

  if (!a.insurance) results.push({
    id: 'insurance', level: 'verifier', icon: '🛡️', title: 'Assurance responsabilité civile',
    summary: "Vérifiez que votre couverture et votre attestation couvrent cette manifestation.",
    why: "Vous n’avez pas confirmé disposer d’une attestation couvrant l’événement.", source: 'https://www.service-public.fr/associations/vosdroits/F1124'
  })

  if (a.attendees > 0) results.push({
    id: 'rescue', level: 'verifier', icon: '🏥', title: 'Secours et sécurité',
    summary: "Une évaluation du besoin en dispositif prévisionnel de secours doit être faite selon les risques.",
    why: `Vous prévoyez environ ${a.attendees} personnes. L’effectif seul ne suffit pas à conclure.`,
    source: 'https://www.securite-civile.interieur.gouv.fr/documentation/secourisme-et-associations/textes-reglementaires-secourisme.html'
  })

  const month = a.date ? new Date(a.date + 'T12:00:00').getMonth() + 1 : 0
  if (month >= 6 && month <= 9) results.push({
    id: 'heat', level: 'recommande', icon: '☀️', title: 'Fortes chaleurs',
    summary: "Préparez eau, zones d’ombre, surveillance météo et adaptations possibles.",
    why: "Votre manifestation est prévue pendant la période estivale."
  })

  return results
}
