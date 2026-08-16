'use client'

import { useEffect, useMemo, useState } from 'react'
import { Answers, evaluate } from '../lib/rules'

const initial: Answers = { name: '', city: '', date: '', attendees: 0, publicSpace: false, roadImpact: false, alcohol: false, music: false, food: false, insurance: false }
const levels = { obligatoire: ['À traiter', 'danger'], verifier: ['À vérifier', 'warning'], recommande: ['Recommandé', 'info'] } as const
const STORAGE = 'manif-events-v03'
const LEGACY = 'manif-event-v01'

type Screen = 'dashboard' | 'form1' | 'form2' | 'results'
type EventRecord = { id:string; answers:Answers; done:string[]; createdAt:string; updatedAt:string }

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2,8)}`
const formatDate = (value:string) => value ? new Intl.DateTimeFormat('fr-FR',{day:'numeric',month:'long',year:'numeric'}).format(new Date(value+'T12:00:00')) : 'Date à préciser'
const publicLabel = (n:number) => n > 0 ? `Environ ${n} personnes` : 'Public non renseigné'

export default function Home() {
  const [loaded,setLoaded] = useState(false)
  const [mode,setMode] = useState<'asso'|'mairie'>('asso')
  const [screen,setScreen] = useState<Screen>('dashboard')
  const [events,setEvents] = useState<EventRecord[]>([])
  const [activeId,setActiveId] = useState<string | null>(null)
  const [a,setA] = useState<Answers>(initial)
  const [done,setDone] = useState<string[]>([])
  const results = useMemo(()=>evaluate(a),[a])
  const set = <K extends keyof Answers>(key:K,value:Answers[K]) => setA(v=>({...v,[key]:value}))

  useEffect(()=>{
    try {
      const raw = localStorage.getItem(STORAGE)
      if (raw) setEvents(JSON.parse(raw))
      else {
        const legacy = localStorage.getItem(LEGACY)
        if (legacy) {
          const old = JSON.parse(legacy)
          if (old.answers) {
            const now = new Date().toISOString()
            const migrated:EventRecord = {id:uid(),answers:old.answers,done:old.done||[],createdAt:now,updatedAt:now}
            setEvents([migrated]); localStorage.setItem(STORAGE,JSON.stringify([migrated]))
          }
        }
      }
    } catch {}
    setLoaded(true)
  },[])

  useEffect(()=>{ if(loaded) localStorage.setItem(STORAGE,JSON.stringify(events)) },[events,loaded])

  useEffect(()=>{
    if(!loaded || !activeId || screen==='dashboard') return
    setEvents(current=>current.map(e=>e.id===activeId?{...e,answers:a,done,updatedAt:new Date().toISOString()}:e))
  },[a,done,activeId,screen,loaded])

  const newEvent = () => { const id=uid(); const now=new Date().toISOString(); const ev:EventRecord={id,answers:initial,done:[],createdAt:now,updatedAt:now}; setEvents(v=>[ev,...v]); setActiveId(id); setA(initial); setDone([]); setScreen('form1'); setMode('asso') }
  const openEvent = (ev:EventRecord) => { setActiveId(ev.id); setA(ev.answers); setDone(ev.done); setScreen('results'); setMode('asso') }
  const editEvent = (ev:EventRecord) => { setActiveId(ev.id); setA(ev.answers); setDone(ev.done); setScreen('form1'); setMode('asso') }
  const deleteEvent = (id:string) => { if(confirm('Supprimer cet événement ?')) setEvents(v=>v.filter(e=>e.id!==id)) }
  const toggleDone = (id:string) => setDone(v=>v.includes(id)?v.filter(x=>x!==id):[...v,id])
  const backDashboard = () => { setScreen('dashboard'); setActiveId(null); setA(initial); setDone([]) }

  if(!loaded) return null

  if(screen==='dashboard') {
    const allResults = events.map(e=>({e,r:evaluate(e.answers)}))
    const totalActions = allResults.reduce((s,x)=>s+x.r.length,0)
    const totalDone = events.reduce((s,e)=>s+e.done.length,0)
    return <main className="shell dashboard">
      <header className="topbar"><div className="brand small">MANIF<span>’</span></div><div className="roleSwitch"><button className={mode==='asso'?'active':''} onClick={()=>setMode('asso')}>Association</button><button className={mode==='mairie'?'active':''} onClick={()=>setMode('mairie')}>Mairie · démo</button></div></header>
      {mode==='asso' ? <>
        <div className="dashHead"><div><p className="eyebrow">ESPACE ASSOCIATION</p><h1>Mes événements</h1><p className="lead">Tous vos dossiers, leur avancement et les démarches à traiter.</p></div><button className="primary compact" onClick={newEvent}>+ Nouvel événement</button></div>
        {events.length===0 ? <div className="empty"><h2>Aucun événement pour le moment</h2><p>Créez votre première manifestation pour obtenir une checklist personnalisée.</p><button className="primary" onClick={newEvent}>Créer mon premier événement</button></div> : <div className="eventList">{events.map(ev=>{
          const r=evaluate(ev.answers); const pct=r.length?Math.min(100,Math.round((ev.done.length/r.length)*100)):0
          return <article className="eventCard" key={ev.id}><div className="eventMain" onClick={()=>openEvent(ev)}><div><p className="eventDate">{formatDate(ev.answers.date)}</p><h2>{ev.answers.name||'Manifestation sans nom'}</h2><p>{ev.answers.city||'Commune non renseignée'} · {publicLabel(ev.answers.attendees)}</p></div><div className="progressRing">{pct}%</div></div><div className="bar"><span style={{width:`${pct}%`}}/></div><div className="eventFoot"><span>{ev.done.length}/{r.length} points traités</span><div><button onClick={()=>editEvent(ev)}>Modifier</button><button onClick={()=>deleteEvent(ev.id)}>Supprimer</button></div></div></article>
        })}</div>}
      </> : <>
        <div className="dashHead"><div><p className="eyebrow">TABLEAU DE BORD MAIRIE · PROTOTYPE</p><h1>Manifestations de la commune</h1><p className="lead">Cette vue préfigure l’espace mairie : agenda, avancement des dossiers et statistiques.</p></div></div>
        <div className="stats"><div><strong>{events.length}</strong><span>événements</span></div><div><strong>{totalActions}</strong><span>points identifiés</span></div><div><strong>{totalDone}</strong><span>traités</span></div></div>
        <div className="agenda">{[...events].sort((x,y)=>(x.answers.date||'9999').localeCompare(y.answers.date||'9999')).map(ev=>{const r=evaluate(ev.answers); const pct=r.length?Math.round((ev.done.length/r.length)*100):0;return <article key={ev.id}><div className="agendaDate">{ev.answers.date?new Intl.DateTimeFormat('fr-FR',{day:'2-digit',month:'short'}).format(new Date(ev.answers.date+'T12:00:00')):'—'}</div><div><h3>{ev.answers.name||'Manifestation sans nom'}</h3><p>{ev.answers.city||'Commune non renseignée'} · {publicLabel(ev.answers.attendees)}</p></div><span className="agendaStatus">{pct}% prêt</span></article>})}</div>
        <p className="prototypeNote">La vraie version mairie nécessitera des comptes, une base de données sécurisée et le partage explicite des dossiers par les associations.</p>
      </>}
    </main>
  }

  if(screen==='results') return <main className="shell results"><header><button className="back" onClick={backDashboard}>← Mes événements</button><div className="brand small">MANIF<span>’</span></div><button className="back" onClick={()=>setScreen('form1')}>Modifier</button></header><section><p className="eyebrow">VOTRE DOSSIER · SAUVEGARDE AUTOMATIQUE</p><h1>{a.name||'Votre manifestation'}</h1><p className="meta">{a.city||'Commune non renseignée'} · {formatDate(a.date)} · {publicLabel(a.attendees)}</p><div className="summary"><strong>{results.length}</strong><span>points identifiés</span><div>{results.filter(r=>r.level==='obligatoire').length} à traiter · {results.filter(r=>r.level==='verifier').length} à vérifier · {done.length} terminés</div></div>{results.map(r=><article className={`card ${levels[r.level][1]} ${done.includes(r.id)?'completed':''}`} key={r.id}><div className="cardtop"><span className="icon">{r.icon}</span><span className="badge">{done.includes(r.id)?'✓ Traité':levels[r.level][0]}</span></div><h2>{r.title}</h2><p>{r.summary}</p>{r.contact&&<p className="contact"><b>Interlocuteur :</b> {r.contact}</p>}{r.actions?.map(x=><a className="action" key={x.url} href={x.url} target="_blank" rel="noreferrer">{x.label} ↗</a>)}<details><summary>Pourquoi ?</summary><p>{r.why}</p>{r.source&&<a href={r.source} target="_blank" rel="noreferrer">Voir la source officielle ↗</a>}</details><label className="done"><input type="checkbox" checked={done.includes(r.id)} onChange={()=>toggleDone(r.id)}/> Démarche traitée</label></article>)}</section></main>

  return <main className="shell form"><header><button className="back" onClick={()=>screen==='form1'?backDashboard():setScreen('form1')}>← Retour</button><div className="brand small">MANIF<span>’</span></div><span>{screen==='form1'?'1':'2'}/2</span></header>{screen==='form1'?<section><p className="eyebrow">ÉTAPE 1 · L’ÉVÉNEMENT</p><h1>Parlez-nous de votre fête.</h1><label>Nom de l’événement<input value={a.name} onChange={e=>set('name',e.target.value)} placeholder="Fête de l’été"/></label><div className="grid"><label>Commune<input value={a.city} onChange={e=>set('city',e.target.value)} placeholder="Cambrai"/></label><label>Date<input type="date" value={a.date} onChange={e=>set('date',e.target.value)}/></label></div><label>Public attendu<input type="number" min="0" value={a.attendees||''} onChange={e=>set('attendees',Number(e.target.value))} placeholder="500"/></label><button className="primary" onClick={()=>setScreen('form2')}>Continuer →</button></section>:<section><p className="eyebrow">ÉTAPE 2 · CE QUI EST PRÉVU</p><h1>Que comportera l’événement ?</h1><div className="choices"><Choice label="📍 Espace public" checked={a.publicSpace} onChange={v=>set('publicSpace',v)}/><Choice label="🚧 Circulation modifiée" checked={a.roadImpact} onChange={v=>set('roadImpact',v)}/><Choice label="🍺 Buvette avec alcool" checked={a.alcohol} onChange={v=>set('alcohol',v)}/><Choice label="🎵 DJ / musique" checked={a.music} onChange={v=>set('music',v)}/><Choice label="🍔 Restauration" checked={a.food} onChange={v=>set('food',v)}/><Choice label="🛡️ Attestation RC déjà vérifiée" checked={a.insurance} onChange={v=>set('insurance',v)}/></div><button className="primary" onClick={()=>setScreen('results')}>Enregistrer et analyser →</button></section>}</main>
}

function Choice({label,checked,onChange}:{label:string;checked:boolean;onChange:(v:boolean)=>void}){return <button type="button" className={`choice ${checked?'selected':''}`} onClick={()=>onChange(!checked)}><span>{label}</span><b>{checked?'✓':'+'}</b></button>}
