'use client'

import { useEffect, useMemo, useState } from 'react'
import { Answers, evaluate } from '../lib/rules'
import { calculateRis, RiskLevel, RisInput } from '../lib/ris'

const initial: Answers = { name: '', city: '', date: '', attendees: 0, publicSpace: false, roadImpact: false, alcohol: false, music: false, food: false, insurance: false }
const initialRisk: RisInput = { publicCount:0, p2:0.25, e1:0.25, e2:0.25 }
const levels = { obligatoire: ['À traiter', 'danger'], verifier: ['À vérifier', 'warning'], recommande: ['Recommandé', 'info'] } as const
const STORAGE = 'manif-events-v04'
const PREVIOUS = 'manif-events-v03'

type Screen = 'dashboard' | 'form1' | 'form2' | 'results'
type EventRecord = { id:string; answers:Answers; done:string[]; ris?:RisInput; createdAt:string; updatedAt:string }
type MairieData = { commune?:{nom:string;code:string;departement?:{code:string;nom:string}}; mairie?:{name:string;email:string;phones:string[];websites:string[];officialUrl:string;address:string;hours:any[];source:string;refreshedAt:string}; error?:string }

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2,8)}`
const formatDate = (value:string) => value ? new Intl.DateTimeFormat('fr-FR',{day:'numeric',month:'long',year:'numeric'}).format(new Date(value+'T12:00:00')) : 'Date à préciser'
const publicLabel = (n:number) => n > 0 ? `Environ ${n} personnes` : 'Public non renseigné'
const time = (v:string) => v ? v.slice(0,5) : ''

export default function Home() {
  const [loaded,setLoaded] = useState(false)
  const [mode,setMode] = useState<'asso'|'mairie'>('asso')
  const [screen,setScreen] = useState<Screen>('dashboard')
  const [events,setEvents] = useState<EventRecord[]>([])
  const [activeId,setActiveId] = useState<string | null>(null)
  const [a,setA] = useState<Answers>(initial)
  const [done,setDone] = useState<string[]>([])
  const [risk,setRisk] = useState<RisInput>(initialRisk)
  const [mairie,setMairie] = useState<MairieData | null>(null)
  const [mairieLoading,setMairieLoading] = useState(false)
  const results = useMemo(()=>evaluate(a),[a])
  const risResult = useMemo(()=>calculateRis({...risk,publicCount:a.attendees || risk.publicCount}),[risk,a.attendees])
  const set = <K extends keyof Answers>(key:K,value:Answers[K]) => setA(v=>({...v,[key]:value}))

  useEffect(()=>{
    try {
      const raw = localStorage.getItem(STORAGE) || localStorage.getItem(PREVIOUS)
      if(raw){ const parsed:EventRecord[]=JSON.parse(raw); setEvents(parsed); if(!localStorage.getItem(STORAGE)) localStorage.setItem(STORAGE,JSON.stringify(parsed)) }
    } catch {}
    setLoaded(true)
  },[])
  useEffect(()=>{ if(loaded) localStorage.setItem(STORAGE,JSON.stringify(events)) },[events,loaded])
  useEffect(()=>{
    if(!loaded || !activeId || screen==='dashboard') return
    setEvents(current=>current.map(e=>e.id===activeId?{...e,answers:a,done,ris:risk,updatedAt:new Date().toISOString()}:e))
  },[a,done,risk,activeId,screen,loaded])
  useEffect(()=>{
    if(screen!=='results' || !a.city.trim()){ setMairie(null); return }
    let cancelled=false
    setMairieLoading(true)
    fetch(`/api/mairie?city=${encodeURIComponent(a.city)}`).then(r=>r.json()).then(data=>{if(!cancelled)setMairie(data)}).catch(()=>{if(!cancelled)setMairie({error:'Coordonnées indisponibles'})}).finally(()=>{if(!cancelled)setMairieLoading(false)})
    return ()=>{cancelled=true}
  },[screen,a.city])

  const newEvent=()=>{const id=uid(),now=new Date().toISOString();const ev:EventRecord={id,answers:initial,done:[],ris:initialRisk,createdAt:now,updatedAt:now};setEvents(v=>[ev,...v]);setActiveId(id);setA(initial);setDone([]);setRisk(initialRisk);setScreen('form1');setMode('asso')}
  const openEvent=(ev:EventRecord)=>{setActiveId(ev.id);setA(ev.answers);setDone(ev.done);setRisk(ev.ris||{...initialRisk,publicCount:ev.answers.attendees});setScreen('results');setMode('asso')}
  const editEvent=(ev:EventRecord)=>{setActiveId(ev.id);setA(ev.answers);setDone(ev.done);setRisk(ev.ris||initialRisk);setScreen('form1');setMode('asso')}
  const deleteEvent=(id:string)=>{if(confirm('Supprimer cet événement ?'))setEvents(v=>v.filter(e=>e.id!==id))}
  const toggleDone=(id:string)=>setDone(v=>v.includes(id)?v.filter(x=>x!==id):[...v,id])
  const backDashboard=()=>{setScreen('dashboard');setActiveId(null);setA(initial);setDone([]);setRisk(initialRisk)}

  if(!loaded)return null
  if(screen==='dashboard'){
    const allResults=events.map(e=>({e,r:evaluate(e.answers)})),totalActions=allResults.reduce((s,x)=>s+x.r.length,0),totalDone=events.reduce((s,e)=>s+e.done.length,0)
    return <main className="shell dashboard"><header className="topbar"><div className="brand small">MANIF<span>’</span></div><div className="roleSwitch"><button className={mode==='asso'?'active':''} onClick={()=>setMode('asso')}>Association</button><button className={mode==='mairie'?'active':''} onClick={()=>setMode('mairie')}>Mairie · démo</button></div></header>{mode==='asso'?<><div className="dashHead"><div><p className="eyebrow">ESPACE ASSOCIATION</p><h1>Mes événements</h1><p className="lead">Tous vos dossiers, leur avancement et les démarches à traiter.</p></div><button className="primary compact" onClick={newEvent}>+ Nouvel événement</button></div>{events.length===0?<div className="empty"><h2>Aucun événement pour le moment</h2><p>Créez votre première manifestation pour obtenir une checklist personnalisée.</p><button className="primary" onClick={newEvent}>Créer mon premier événement</button></div>:<div className="eventList">{events.map(ev=>{const r=evaluate(ev.answers),pct=r.length?Math.min(100,Math.round((ev.done.length/r.length)*100)):0;return <article className="eventCard" key={ev.id}><div className="eventMain" onClick={()=>openEvent(ev)}><div><p className="eventDate">{formatDate(ev.answers.date)}</p><h2>{ev.answers.name||'Manifestation sans nom'}</h2><p>{ev.answers.city||'Commune non renseignée'} · {publicLabel(ev.answers.attendees)}</p></div><div className="progressRing">{pct}%</div></div><div className="bar"><span style={{width:`${pct}%`}}/></div><div className="eventFoot"><span>{ev.done.length}/{r.length} points traités</span><div><button onClick={()=>editEvent(ev)}>Modifier</button><button onClick={()=>deleteEvent(ev.id)}>Supprimer</button></div></div></article>})}</div>}</>:<><div className="dashHead"><div><p className="eyebrow">TABLEAU DE BORD MAIRIE · PROTOTYPE</p><h1>Manifestations de la commune</h1><p className="lead">Agenda, avancement des dossiers et statistiques. Les vrais comptes mairie arriveront avec la base de données partagée.</p></div></div><div className="stats"><div><strong>{events.length}</strong><span>événements</span></div><div><strong>{totalActions}</strong><span>points identifiés</span></div><div><strong>{totalDone}</strong><span>traités</span></div></div><div className="agenda">{[...events].sort((x,y)=>(x.answers.date||'9999').localeCompare(y.answers.date||'9999')).map(ev=>{const r=evaluate(ev.answers),pct=r.length?Math.round((ev.done.length/r.length)*100):0;return <article key={ev.id}><div className="agendaDate">{ev.answers.date?new Intl.DateTimeFormat('fr-FR',{day:'2-digit',month:'short'}).format(new Date(ev.answers.date+'T12:00:00')):'—'}</div><div><h3>{ev.answers.name||'Manifestation sans nom'}</h3><p>{ev.answers.city||'Commune non renseignée'} · {publicLabel(ev.answers.attendees)}</p></div><span className="agendaStatus">{pct}% prêt</span></article>})}</div></>}</main>
  }

  if(screen==='results') return <main className="shell results"><header><button className="back" onClick={backDashboard}>← Mes événements</button><div className="brand small">MANIF<span>’</span></div><button className="back" onClick={()=>setScreen('form1')}>Modifier</button></header><section><p className="eyebrow">VOTRE DOSSIER · SAUVEGARDE AUTOMATIQUE</p><h1>{a.name||'Votre manifestation'}</h1><p className="meta">{a.city||'Commune non renseignée'} · {formatDate(a.date)} · {publicLabel(a.attendees)}</p>

    <div className="summary"><strong>{results.length}</strong><span>points identifiés</span><div>{results.filter(r=>r.level==='obligatoire').length} à traiter · {results.filter(r=>r.level==='verifier').length} à vérifier · {done.length} terminés</div></div>

    <MairiePanel loading={mairieLoading} data={mairie}/>

    {results.map(r=><article className={`card ${levels[r.level][1]} ${done.includes(r.id)?'completed':''}`} key={r.id}><div className="cardtop"><span className="icon">{r.icon}</span><span className="badge">{done.includes(r.id)?'✓ Traité':levels[r.level][0]}</span></div><h2>{r.title}</h2><p>{r.summary}</p>{r.id==='rescue'&&<RisCalculator risk={risk} setRisk={setRisk} publicCount={a.attendees} result={risResult} department={mairie?.commune?.departement?.nom}/>} {r.contact&&<p className="contact"><b>Interlocuteur :</b> {r.contact}</p>}{r.actions?.map(x=><a className="action" key={x.url} href={x.url} target="_blank" rel="noreferrer">{x.label} ↗</a>)}<details><summary>Pourquoi ?</summary><p>{r.why}</p>{r.source&&<a href={r.source} target="_blank" rel="noreferrer">Voir la source officielle ↗</a>}{r.verifiedAt&&<p className="verified">Source vérifiée le {r.verifiedAt} · {r.sourceLabel}</p>}</details><label className="done"><input type="checkbox" checked={done.includes(r.id)} onChange={()=>toggleDone(r.id)}/> Démarche traitée</label></article>)}
  </section></main>

  return <main className="shell form"><header><button className="back" onClick={()=>screen==='form1'?backDashboard():setScreen('form1')}>← Retour</button><div className="brand small">MANIF<span>’</span></div><span>{screen==='form1'?'1':'2'}/2</span></header>{screen==='form1'?<section><p className="eyebrow">ÉTAPE 1 · L’ÉVÉNEMENT</p><h1>Parlez-nous de votre fête.</h1><label>Nom de l’événement<input value={a.name} onChange={e=>set('name',e.target.value)} placeholder="Fête de l’été"/></label><div className="grid"><label>Commune<input value={a.city} onChange={e=>set('city',e.target.value)} placeholder="Cambrai"/></label><label>Date<input type="date" value={a.date} onChange={e=>set('date',e.target.value)}/></label></div><label>Public maximal présent simultanément<input type="number" min="0" value={a.attendees||''} onChange={e=>set('attendees',Number(e.target.value))} placeholder="500"/></label><button className="primary" onClick={()=>setScreen('form2')}>Continuer →</button></section>:<section><p className="eyebrow">ÉTAPE 2 · CE QUI EST PRÉVU</p><h1>Que comportera l’événement ?</h1><div className="choices"><Choice label="📍 Espace public" checked={a.publicSpace} onChange={v=>set('publicSpace',v)}/><Choice label="🚧 Circulation modifiée" checked={a.roadImpact} onChange={v=>set('roadImpact',v)}/><Choice label="🍺 Buvette avec alcool" checked={a.alcohol} onChange={v=>set('alcohol',v)}/><Choice label="🎵 DJ / musique" checked={a.music} onChange={v=>set('music',v)}/><Choice label="🍔 Restauration" checked={a.food} onChange={v=>set('food',v)}/><Choice label="🛡️ Attestation RC déjà vérifiée" checked={a.insurance} onChange={v=>set('insurance',v)}/></div><button className="primary" onClick={()=>setScreen('results')}>Enregistrer et analyser →</button></section>}</main>
}

function Choice({label,checked,onChange}:{label:string;checked:boolean;onChange:(v:boolean)=>void}){return <button type="button" className={`choice ${checked?'selected':''}`} onClick={()=>onChange(!checked)}><span>{label}</span><b>{checked?'✓':'+'}</b></button>}

function MairiePanel({loading,data}:{loading:boolean;data:MairieData|null}){
  if(loading)return <section className="mairiePanel"><p>🏛️ Recherche des coordonnées officielles de la mairie…</p></section>
  if(!data?.mairie)return data?.error?<section className="mairiePanel"><b>🏛️ Mairie</b><p>{data.error}</p></section>:null
  const m=data.mairie
  return <section className="mairiePanel"><div className="panelHead"><div><p className="eyebrow">CONTACT AUTOMATIQUE</p><h2>{m.name}</h2></div><span className="official">Données officielles</span></div>{m.address&&<p>📍 {m.address}</p>}{m.phones?.map(p=><p key={p}>☎️ <a href={`tel:${p.replace(/\s/g,'')}`}>{p}</a></p>)}{m.email&&<p>✉️ <a href={`mailto:${m.email}`}>{m.email}</a></p>}{m.websites?.[0]&&<p>🌐 <a href={m.websites[0]} target="_blank" rel="noreferrer">Site de la mairie ↗</a></p>}{m.hours?.length>0&&<details><summary>Horaires d’ouverture</summary><div className="hours">{m.hours.map((h:any,i:number)=><div key={i}><b>{h.nom_jour_debut}{h.nom_jour_fin&&h.nom_jour_fin!==h.nom_jour_debut?` → ${h.nom_jour_fin}`:''}</b><span>{time(h.valeur_heure_debut_1)}–{time(h.valeur_heure_fin_1)}{h.valeur_heure_debut_2?` / ${time(h.valeur_heure_debut_2)}–${time(h.valeur_heure_fin_2)}`:''}</span></div>)}</div></details>}<p className="verified">Source : {m.source} · mise à jour API quotidienne les jours ouvrés</p></section>
}

function RisCalculator({risk,setRisk,publicCount,result,department}:{risk:RisInput;setRisk:(v:RisInput)=>void;publicCount:number;result:ReturnType<typeof calculateRis>;department?:string}){
  const update=(key:'p2'|'e1'|'e2',value:string)=>setRisk({...risk,[key]:Number(value) as RiskLevel,publicCount})
  return <div className="risBox"><div className="panelHead"><div><p className="eyebrow">CALCULATEUR RIS</p><h3>Dimensionnement secours</h3></div><span className="official">Référentiel national</span></div><p className="smallText">Public maximal simultané : <b>{publicCount||'non renseigné'}</b>. Sélectionnez le niveau le plus défavorable applicable.</p><label>Comportement du public (P2)<select value={risk.p2} onChange={e=>update('p2',e.target.value)}><option value="0.25">Faible — public assis</option><option value="0.30">Modéré — public debout calme / exposition / foire</option><option value="0.35">Moyen — spectacle statique / fête foraine</option><option value="0.40">Élevé — danse / carnaval / public dynamique</option></select></label><label>Environnement / accessibilité (E1)<select value={risk.e1} onChange={e=>update('e1',e.target.value)}><option value="0.25">Faible — bâtiment / rue avec accès aisés</option><option value="0.30">Modéré — structure temporaire / accès plus long</option><option value="0.35">Moyen — accès difficile</option><option value="0.40">Élevé — accès très difficile / secours gênés</option></select></label><label>Délai secours publics (E2)<select value={risk.e2} onChange={e=>update('e2',e.target.value)}><option value="0.25">≤ 10 min</option><option value="0.30">10 à 20 min</option><option value="0.35">20 à 30 min</option><option value="0.40">&gt; 30 min</option></select></label><div className="risResult"><div><span>RIS</span><strong>{publicCount?result.ris.toFixed(2):'—'}</strong></div><div><span>Dispositif indicatif</span><strong>{publicCount?result.dpsType:'Renseignez le public'}</strong></div>{publicCount&&<div><span>Intervenants secouristes</span><strong>{result.interveners===null?'Selon autorité':result.interveners}</strong></div>}</div>{publicCount&&<p className="smallText">{result.note}</p>}<p className="warningText">⚠️ Cette grille est une aide au dimensionnement. L’évaluation doit être cosignée avec l’AASC assurant le DPS et l’autorité compétente peut imposer un dispositif différent.</p><a className="action secondary" href="https://www.securite-civile.interieur.gouv.fr/documentation/secourisme-et-associations/associations-agreees-par-securite-civile.html" target="_blank" rel="noreferrer">Voir les AASC agréées{department?` — ${department}`:''} ↗</a></div>
}
