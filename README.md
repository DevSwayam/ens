# NS Monorepo

A minimal monorepo setup with Next.js client and Express server, both using TypeScript.

## Structure

```
ns/
├── client/       # Next.js app with TypeScript and App Router
├── server/       # Express server with TypeScript
├── docs/         # Project documentation
└── package.json  # Root workspace configuration
```

## Quick Start

1. Install dependencies:
```bash
pnpm install
```

2. Start development servers:
```bash
pnpm dev
```

This will start:
- Client on http://localhost:3000
- Server on http://localhost:3001

## Available Scripts

- `pnpm dev` - Run both client and server in development mode
- `pnpm build` - Build all packages
- `pnpm lint` - Lint all packages

## Tech Stack

- **Client**: Next.js 14, React, TypeScript, App Router
- **Server**: Express, TypeScript
- **Package Manager**: pnpm workspaces
- **Language**: TypeScript

For more details, see the [docs](./docs/README.md) folder.
