import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'NS Monorepo',
  description: 'Minimal monorepo with Next.js frontend',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

