import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

type GeoCommune = { nom:string; code:string; departement?:{code:string;nom:string} }

export async function GET(req:NextRequest) {
  const city = (req.nextUrl.searchParams.get('city') || '').trim()
  if (!city) return NextResponse.json({error:'Commune manquante'},{status:400})

  try {
    const geoUrl = `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(city)}&fields=nom,code,departement,codesPostaux&boost=population&limit=5`
    const geoRes = await fetch(geoUrl,{next:{revalidate:86400}})
    if (!geoRes.ok) throw new Error('geo api unavailable')
    const communes:GeoCommune[] = await geoRes.json()
    const exact = communes.find(c=>c.nom.localeCompare(city,'fr',{sensitivity:'base'})===0) || communes[0]
    if (!exact) return NextResponse.json({error:'Commune introuvable'},{status:404})

    const where = `code_insee_commune LIKE "${exact.code}"`
    const dilaUrl = `https://api-lannuaire.service-public.gouv.fr/api/explore/v2.1/catalog/datasets/api-lannuaire-administration/records?where=${encodeURIComponent(where)}&limit=100`
    const dilaRes = await fetch(dilaUrl,{next:{revalidate:86400}})
    if (!dilaRes.ok) throw new Error('DILA api unavailable')
    const payload = await dilaRes.json()
    const records:any[] = payload.results || []
    const mairie = records.find(r => String(r.nom || '').toLocaleLowerCase('fr').startsWith('mairie')) || records.find(r => JSON.stringify(r).includes('"type_service_local":"mairie"'))
    if (!mairie) return NextResponse.json({error:'Mairie non trouvée dans l’annuaire officiel',commune:exact},{status:404})

    const address = Array.isArray(mairie.adresse) ? mairie.adresse.find((x:any)=>x.type_adresse==='Adresse') || mairie.adresse[0] : undefined
    const phones = Array.isArray(mairie.telephone) ? mairie.telephone.map((x:any)=>x.valeur).filter(Boolean) : []
    const websites = Array.isArray(mairie.site_internet) ? mairie.site_internet.map((x:any)=>x.valeur).filter(Boolean) : []
    const hours = Array.isArray(mairie.plage_ouverture) ? mairie.plage_ouverture : []

    return NextResponse.json({
      commune: exact,
      mairie: {
        name: mairie.nom,
        email: mairie.adresse_courriel || '',
        phones,
        websites,
        officialUrl: mairie.url_service_public || '',
        address: address ? [address.numero_voie,address.code_postal,address.nom_commune].filter(Boolean).join(', ') : '',
        hours,
        source: 'Service-Public.gouv.fr / DILA',
        refreshedAt: new Date().toISOString()
      }
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({error:'Impossible de récupérer les coordonnées officielles pour le moment.'},{status:502})
  }
}
