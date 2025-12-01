import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ENS Playground',
  description: 'Explore ENS names and view profile data from the Ethereum blockchain',
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

