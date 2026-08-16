'use client'

import { useMemo, useState } from 'react'
import { Answers, evaluate } from '../lib/rules'

const initial: Answers = { name: '', city: '', date: '', attendees: 0, publicSpace: false, roadImpact: false, alcohol: false, music: false, food: false, insurance: false }
const levels = { obligatoire: ['À traiter', 'danger'], verifier: ['À vérifier', 'warning'], recommande: ['Recommandé', 'info'] } as const

export default function Home() {
  const [step, setStep] = useState(0)
  const [a, setA] = useState<Answers>(initial)
  const results = useMemo(() => evaluate(a), [a])
  const set = <K extends keyof Answers>(key: K, value: Answers[K]) => setA(v => ({ ...v, [key]: value }))

  if (step === 0) return <main className="shell"><section className="hero"><div className="brand">MANIF<span>’</span></div><p className="tag">L’assistant des manifestations locales</p><h1>Organisez votre événement<br/><em>sans rien oublier.</em></h1><p className="lead">Quelques questions simples. MANIF’ identifie les démarches et points à vérifier pour votre manifestation.</p><button className="primary" onClick={() => setStep(1)}>Préparer ma manifestation →</button><p className="fine">Prototype V0.1 · Fête / kermesse</p></section></main>

  if (step === 3) return <main className="shell results"><header><button className="back" onClick={() => setStep(2)}>← Modifier</button><div className="brand small">MANIF<span>’</span></div></header><section><p className="eyebrow">VOTRE CHECKLIST</p><h1>{a.name || 'Votre manifestation'}</h1><p className="meta">{a.city} · {a.date || 'Date à préciser'} · ~{a.attendees || '?'} personnes</p><div className="summary"><strong>{results.length}</strong><span>points identifiés</span><div>{results.filter(r=>r.level==='obligatoire').length} à traiter · {results.filter(r=>r.level==='verifier').length} à vérifier</div></div>{results.map(r => <article className={`card ${levels[r.level][1]}`} key={r.id}><div className="cardtop"><span className="icon">{r.icon}</span><span className="badge">{levels[r.level][0]}</span></div><h2>{r.title}</h2><p>{r.summary}</p><details><summary>Pourquoi ?</summary><p>{r.why}</p>{r.contact && <p><b>Interlocuteur :</b> {r.contact}</p>}{r.source && <a href={r.source} target="_blank">Voir la source officielle ↗</a>}</details><label className="done"><input type="checkbox"/> Démarche traitée</label></article>)}</section></main>

  return <main className="shell form"><header><button className="back" onClick={() => setStep(step-1)}>← Retour</button><div className="brand small">MANIF<span>’</span></div><span>{step}/2</span></header>{step === 1 ? <section><p className="eyebrow">ÉTAPE 1 · L’ÉVÉNEMENT</p><h1>Parlez-nous de votre fête.</h1><label>Nom de l’événement<input value={a.name} onChange={e=>set('name',e.target.value)} placeholder="Fête de l’été"/></label><div className="grid"><label>Commune<input value={a.city} onChange={e=>set('city',e.target.value)} placeholder="Cambrai"/></label><label>Date<input type="date" value={a.date} onChange={e=>set('date',e.target.value)}/></label></div><label>Public attendu<input type="number" min="0" value={a.attendees || ''} onChange={e=>set('attendees',Number(e.target.value))} placeholder="500"/></label><button className="primary" onClick={()=>setStep(2)}>Continuer →</button></section> : <section><p className="eyebrow">ÉTAPE 2 · CE QUI EST PRÉVU</p><h1>Que comportera l’événement ?</h1><div className="choices"><Choice label="📍 Espace public" checked={a.publicSpace} onChange={v=>set('publicSpace',v)}/><Choice label="🚧 Circulation modifiée" checked={a.roadImpact} onChange={v=>set('roadImpact',v)}/><Choice label="🍺 Buvette avec alcool" checked={a.alcohol} onChange={v=>set('alcohol',v)}/><Choice label="🎵 DJ / musique" checked={a.music} onChange={v=>set('music',v)}/><Choice label="🍔 Restauration" checked={a.food} onChange={v=>set('food',v)}/><Choice label="🛡️ Attestation RC déjà vérifiée" checked={a.insurance} onChange={v=>set('insurance',v)}/></div><button className="primary" onClick={()=>setStep(3)}>Analyser ma manifestation →</button></section>}</main>
}

function Choice({label, checked, onChange}:{label:string,checked:boolean,onChange:(v:boolean)=>void}) { return <button className={`choice ${checked?'selected':''}`} onClick={()=>onChange(!checked)}><span>{label}</span><b>{checked?'✓':'+'}</b></button> }
