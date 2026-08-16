export type Answers = {
  name:string; eventType?:string; city:string; address?:string; date:string; attendees:number; actorsCount?:number;
  venueType?:'public'|'private'|'erp'|'road'|''; outdoor?:boolean; publicSpace:boolean; roadImpact:boolean;
  alcohol:boolean; music:boolean; food:boolean; foodProvider?:'association'|'traiteur'|'foodtruck'|'exposants'|''; animalFood?:boolean;
  structures?:boolean; insurance:boolean;
}
export type ActionLink={label:string;url:string}
export type Result={id:string;level:'obligatoire'|'verifier'|'recommande';icon:string;title:string;summary:string;why:string;contact?:string;source?:string;sourceLabel?:string;verifiedAt?:string;actions?:ActionLink[]}
const VERIFIED='16/08/2026'
const mairieSearch=(city:string)=>`https://lannuaire.service-public.gouv.fr/navigation/mairie?where=${encodeURIComponent(city)}`
export function evaluate(a:Answers):Result[]{
 const r:Result[]=[]
 if(a.publicSpace||a.venueType==='public'||a.venueType==='road')r.push({id:'public-space',level:'obligatoire',icon:'📍',title:'Occupation de l’espace public',summary:'Une démarche auprès de la commune est à prévoir.',why:'Le lieu déclaré utilise l’espace public.',contact:`Mairie de ${a.city||'votre commune'}`,source:'https://www.service-public.gouv.fr/associations/vosdroits/F31613',sourceLabel:'Service-Public.gouv.fr',verifiedAt:VERIFIED,actions:[{label:'Coordonnées officielles de la mairie',url:mairieSearch(a.city)}]})
 if(a.roadImpact||a.venueType==='road')r.push({id:'traffic',level:'verifier',icon:'🚧',title:'Circulation / stationnement',summary:'Vérifiez l’arrêté ou les mesures de circulation nécessaires.',why:'Votre événement utilise ou modifie une voie de circulation.',contact:`Mairie de ${a.city||'votre commune'}`,verifiedAt:VERIFIED})
 if(a.alcohol)r.push({id:'bar',level:'obligatoire',icon:'🍺',title:'Buvette temporaire',summary:'Préparez la demande d’autorisation temporaire auprès du maire.',why:'Une buvette avec alcool est prévue.',contact:`Mairie de ${a.city||'votre commune'}`,source:'https://www.service-public.gouv.fr/associations/vosdroits/F24345',sourceLabel:'Service-Public.gouv.fr',verifiedAt:VERIFIED})
 if(a.music)r.push({id:'music',level:'obligatoire',icon:'🎵',title:'Diffusion musicale',summary:'Préparez la démarche de diffusion publique de musique.',why:'Vous avez indiqué DJ ou musique.',source:'https://entreprendre.service-public.gouv.fr/vosdroits/F3094',sourceLabel:'Service-Public Entreprendre',verifiedAt:VERIFIED,actions:[{label:'Faire la démarche SACEM',url:'https://clients.sacem.fr/'}]})
 if(a.food)r.push({id:'food',level:'verifier',icon:'🍔',title:'Restauration / hygiène',summary:a.animalFood?'Une déclaration sanitaire peut être nécessaire : le formulaire est disponible directement ci-dessous.':'Vérifiez les règles adaptées au mode de préparation et de vente.',why:`Restauration prévue${a.foodProvider?` — intervenant : ${a.foodProvider}`:''}.`,source:'https://entreprendre.service-public.gouv.fr/vosdroits/F33822',sourceLabel:'Service-Public Entreprendre',verifiedAt:VERIFIED,actions:a.animalFood?[{label:'Déclaration en ligne — denrées d’origine animale',url:'https://entreprendre.service-public.gouv.fr/vosdroits/R44572'},{label:'CERFA 13984*06',url:'https://entreprendre.service-public.gouv.fr/vosdroits/R17520'}]:[]})
 if(a.structures)r.push({id:'structures',level:'verifier',icon:'🎪',title:'Structures temporaires',summary:'Vérifiez les règles de sécurité applicables aux barnums, scènes ou installations temporaires.',why:'Vous avez indiqué des structures temporaires.',verifiedAt:VERIFIED})
 if(!a.insurance)r.push({id:'insurance',level:'verifier',icon:'🛡️',title:'Assurance responsabilité civile',summary:'Vérifiez que votre attestation couvre bien la manifestation.',why:'Vous n’avez pas confirmé l’attestation RC.',source:'https://www.service-public.gouv.fr/associations/vosdroits/F1124',sourceLabel:'Service-Public.gouv.fr',verifiedAt:VERIFIED})
 if(a.attendees>0||Number(a.actorsCount)>0)r.push({id:'rescue',level:'verifier',icon:'🏥',title:'Secours et sécurité',summary:'Calculez séparément le besoin pour le public et analysez le risque propre aux acteurs.',why:'Le référentiel distingue le public et les acteurs.',source:'https://www.securite-civile.interieur.gouv.fr/documentation/secourisme-et-associations/textes-reglementaires-secourisme.html',sourceLabel:'Sécurité civile',verifiedAt:VERIFIED})
 const m=a.date?new Date(a.date+'T12:00:00').getMonth()+1:0
 if((m>=6&&m<=9)||a.outdoor)r.push({id:'weather',level:'recommande',icon:'☀️',title:'Météo / fortes chaleurs',summary:'Surveillez la vigilance du département et préparez des mesures adaptées.',why:'Événement extérieur ou en période estivale.',sourceLabel:'Météo-France / Sécurité civile',verifiedAt:VERIFIED})
 return r
}
