# Documentation

This folder contains project documentation.

## Structure

- `client/` - Next.js application with TypeScript and App Router
- `server/` - Express server with TypeScript
- `docs/` - Project documentation

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Installation

```bash
pnpm install
```

### Development

Run both client and server in development mode:

```bash
pnpm dev
```

Or run them separately:

```bash
# Client (runs on http://localhost:3000)
pnpm --filter client dev

# Server (runs on http://localhost:3001)
pnpm --filter server dev
```

### Build

Build all packages:

```bash
pnpm build
```

### Lint

Lint all packages:

```bash
pnpm lint
```

