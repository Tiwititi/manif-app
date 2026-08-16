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

export type ActionLink = { label: string; url: string }
export type Result = {
  id: string
  level: 'obligatoire' | 'verifier' | 'recommande'
  icon: string
  title: string
  summary: string
  why: string
  contact?: string
  source?: string
  sourceLabel?: string
  verifiedAt?: string
  actions?: ActionLink[]
}

const VERIFIED = '16/08/2026'
const mairieSearch = (city: string) => `https://lannuaire.service-public.gouv.fr/navigation/mairie?where=${encodeURIComponent(city)}`

export function evaluate(a: Answers): Result[] {
  const results: Result[] = []

  if (a.publicSpace) results.push({
    id: 'public-space', level: 'obligatoire', icon: '📍', title: "Occupation de l’espace public",
    summary: "Une démarche auprès de la commune est à prévoir.",
    why: "Vous avez indiqué que la manifestation utilise un espace public.", contact: `Mairie de ${a.city || 'votre commune'}`,
    source: 'https://www.service-public.gouv.fr/associations/vosdroits/F31613', sourceLabel:'Service-Public.gouv.fr', verifiedAt:VERIFIED,
    actions: [{label:'Trouver les coordonnées de la mairie', url: mairieSearch(a.city)}]
  })

  if (a.roadImpact) results.push({
    id: 'traffic', level: 'verifier', icon: '🚧', title: 'Circulation / stationnement',
    summary: "Vérifiez les mesures et autorisations nécessaires avec la commune.",
    why: "Votre événement modifie la circulation ou le stationnement.", contact: `Mairie de ${a.city || 'votre commune'}`,
    sourceLabel:'Mairie / autorité de police locale', verifiedAt:VERIFIED,
    actions: [{label:'Contacter la mairie', url: mairieSearch(a.city)}]
  })

  if (a.alcohol) results.push({
    id: 'bar', level: 'obligatoire', icon: '🍺', title: 'Buvette temporaire',
    summary: "Demandez l’autorisation temporaire auprès du maire.",
    why: "Vous avez indiqué qu’une buvette servira de l’alcool.", contact: `Mairie de ${a.city || 'votre commune'}`,
    source: 'https://www.service-public.gouv.fr/associations/vosdroits/F24345', sourceLabel:'Service-Public.gouv.fr', verifiedAt:VERIFIED,
    actions: [{label:'Trouver les coordonnées de la mairie', url: mairieSearch(a.city)}]
  })

  if (a.music) results.push({
    id: 'music', level: 'obligatoire', icon: '🎵', title: 'Diffusion musicale',
    summary: "Vérifiez et effectuez les démarches liées à la diffusion publique de musique.",
    why: "Vous avez indiqué de la musique ou un DJ.", source: 'https://entreprendre.service-public.gouv.fr/vosdroits/F3094', sourceLabel:'Service-Public Entreprendre', verifiedAt:VERIFIED,
    actions: [{label:'Faire la démarche auprès de la SACEM', url:'https://clients.sacem.fr/'}]
  })

  if (a.food) results.push({
    id: 'food', level: 'verifier', icon: '🍔', title: 'Restauration / hygiène',
    summary: "Vérifiez si l’activité implique une déclaration sanitaire et préparez directement le formulaire adapté.",
    why: "Vous avez indiqué une activité de restauration. Les obligations dépendent notamment de la préparation, manipulation ou vente de denrées d’origine animale.",
    source: 'https://entreprendre.service-public.gouv.fr/vosdroits/F33822', sourceLabel:'Service-Public Entreprendre', verifiedAt:VERIFIED,
    actions: [
      {label:'Faire la déclaration en ligne — denrées d’origine animale',url:'https://entreprendre.service-public.gouv.fr/vosdroits/R44572'},
      {label:'Télécharger le CERFA 13984*06',url:'https://entreprendre.service-public.gouv.fr/vosdroits/R17520'}
    ]
  })

  if (!a.insurance) results.push({
    id: 'insurance', level: 'verifier', icon: '🛡️', title: 'Assurance responsabilité civile',
    summary: "Vérifiez que votre couverture et votre attestation couvrent cette manifestation.",
    why: "Vous n’avez pas confirmé disposer d’une attestation couvrant l’événement.", source: 'https://www.service-public.gouv.fr/associations/vosdroits/F1124', sourceLabel:'Service-Public.gouv.fr', verifiedAt:VERIFIED
  })

  if (a.attendees > 0) results.push({
    id: 'rescue', level: 'verifier', icon: '🏥', title: 'Secours et sécurité',
    summary: "Calculez le RIS avec les critères officiels pour estimer le type de DPS et le nombre d’intervenants secouristes.",
    why: `Vous prévoyez environ ${a.attendees} personnes. L’effectif seul ne suffit pas : le comportement du public, l’environnement et le délai des secours publics entrent aussi dans le calcul.`,
    source: 'https://www.securite-civile.interieur.gouv.fr/documentation/secourisme-et-associations/textes-reglementaires-secourisme.html', sourceLabel:'Sécurité civile', verifiedAt:VERIFIED
  })

  const month = a.date ? new Date(a.date + 'T12:00:00').getMonth() + 1 : 0
  if (month >= 6 && month <= 9) results.push({
    id: 'heat', level: 'recommande', icon: '☀️', title: 'Fortes chaleurs',
    summary: "Préparez eau, zones d’ombre, surveillance météo et adaptations possibles.",
    why: "Votre manifestation est prévue pendant la période estivale.", sourceLabel:'Sécurité civile / Météo-France', verifiedAt:VERIFIED,
    actions: [{label:'Voir la vigilance Météo-France',url:'https://vigilance.meteofrance.fr/fr'}]
  })

  return results
}
