import './styles.css'

export const metadata = {
  title: "MANIF' — Assistant manifestation",
  description: "Décrivez votre manifestation, obtenez votre checklist personnalisée."
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body>{children}</body></html>
}
