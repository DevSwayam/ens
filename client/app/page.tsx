import { Suspense } from 'react'
import ENSLookup from './components/ENSLookup'
import Link from 'next/link'

export default function Home() {
  return (
    <main className="container">
      <header className="header">
        <h1>ENS Playground</h1>
        <p className="subtitle">Explore ENS names and view profile data from the Ethereum blockchain</p>
        <Link href="/graph" className="nav-link">
          View Network Graph →
        </Link>
      </header>
      <Suspense fallback={<div className="loading">Loading...</div>}>
        <ENSLookup />
      </Suspense>
    </main>
  )
}
