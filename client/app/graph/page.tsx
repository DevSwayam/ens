import { Suspense } from 'react'
import ENSGraph from '../components/ENSGraph'
import Link from 'next/link'

export default function GraphPage() {
  return (
    <main className="container">
      <header className="header">
        <Link href="/" className="back-link">
          ← Back to Lookup
        </Link>
        <h1>ENS Network</h1>
        <p className="subtitle">Visualize connections between ENS names</p>
      </header>
      <Suspense fallback={<div className="loading">Loading graph...</div>}>
        <ENSGraph />
      </Suspense>
    </main>
  )
}
