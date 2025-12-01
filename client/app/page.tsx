import ENSLookup from './components/ENSLookup'

export default function Home() {
  return (
    <main className="container">
      <header className="header">
        <h1>ENS Playground</h1>
        <p className="subtitle">Explore ENS names and view profile data from the Ethereum blockchain</p>
      </header>
      <ENSLookup />
    </main>
  )
}
