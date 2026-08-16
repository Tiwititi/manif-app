export type RiskLevel=0.25|0.30|0.35|0.40
export type RisInput={publicCount:number;p2:RiskLevel;e1:RiskLevel;e2:RiskLevel;coverPublic?:boolean;coverActors?:boolean;actorsCount?:number;actorsRisk?:'faible'|'modere'|'eleve'}
export type RisResult={weightedPublic:number;riskIndex:number;ris:number;dpsType:string;interveners:number|null;note:string;actorsNote?:string}
export function calculateRis(input:RisInput):RisResult{
 const p1=Math.max(0,input.publicCount||0),weightedPublic=p1<=100000?p1:100000+(p1-100000)/2,riskIndex=input.p2+input.e1+input.e2,ris=(input.coverPublic===false?0:riskIndex*weightedPublic/1000)
 let dpsType='À la diligence de l’autorité de police compétente',interveners:number|null=null,note='Le RIS public ne rend pas automatiquement un DPS obligatoire dans cette tranche.'
 if(ris>0.25&&ris<=1.125){dpsType='PAPS — Point d’alerte et de premiers secours';interveners=2;note='Dispositif minimal dans cette tranche de RIS.'}
 else if(ris>1.125&&ris<=12){dpsType='DPS de petite envergure';interveners=ris<=4?4:Math.ceil(ris);if(interveners%2)interveners++;note='Effectif arrondi au nombre pair immédiatement supérieur.'}
 else if(ris>12&&ris<=36){dpsType='DPS de moyenne envergure';interveners=Math.ceil(ris);if(interveners%2)interveners++;note='Effectif arrondi au nombre pair immédiatement supérieur.'}
 else if(ris>36){dpsType='DPS de grande envergure';interveners=Math.ceil(ris);if(interveners%2)interveners++;note='Effectif arrondi au nombre pair immédiatement supérieur.'}
 if(input.e2===0.40&&ris>0.25&&ris<=1.125){dpsType='DPS de petite envergure au minimum';interveners=4;note='Secours publics à plus de 30 minutes : petite envergure au minimum selon le référentiel.'}
 let actorsNote:string|undefined
 if(input.coverActors&&Number(input.actorsCount)>0){actorsNote=`${input.actorsCount} acteur(s) déclarés — risque ${input.actorsRisk||'à préciser'}. Les acteurs font l’objet d’une analyse spécifique indépendante du RIS public, à valider avec l’AASC et/ou l’autorité compétente.`}
 return{weightedPublic,riskIndex,ris,dpsType,interveners,note,actorsNote}
}
