# Server API - Social Network Visualizer

Backend API for managing friend relationships (edges) in a social network graph visualization.

## Features

- ✅ **Strong TypeScript Types** - Full type safety throughout
- ✅ **Supabase Integration** - PostgreSQL database via Supabase
- ✅ **RESTful API** - Clean REST endpoints for CRUD operations
- ✅ **Input Validation** - Zod schema validation
- ✅ **Bidirectional Friendships** - Handles relationships in both directions
- ✅ **Graph Data Format** - Converts relationships to graph nodes/edges format

## Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Supabase

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL schema from `src/database/schema.sql` in Supabase SQL Editor
3. Get your project URL and anon key from Supabase dashboard

### 3. Configure Environment Variables

Create a `.env` file in the `server` directory:

```env
PORT=3001
NODE_ENV=development
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run Development Server

```bash
pnpm dev
```

Server will run on `http://localhost:3001`

## Project Structure

```
server/
├── src/
│   ├── api/
│   │   └── README.md          # API documentation
│   ├── database/
│   │   ├── schema.sql         # Database schema
│   │   └── README.md          # Database setup guide
│   ├── lib/
│   │   └── supabase.ts        # Supabase client
│   ├── routes/
│   │   └── friends.ts         # Friend relationship routes
│   ├── services/
│   │   └── friendService.ts    # Business logic
│   ├── types/
│   │   └── database.ts        # TypeScript types
│   └── index.ts               # Local dev server
├── api/
│   └── index.ts               # Vercel serverless handler
└── package.json
```

## API Endpoints

See [src/api/README.md](./src/api/README.md) for complete API documentation.

### Quick Reference

- `GET /api/friends/graph` - Get graph data (nodes & edges)
- `GET /api/friends/relationships` - Get all relationships
- `POST /api/friends/add` - Add a friendship
- `DELETE /api/friends/delete` - Delete a friendship

## TypeScript Types

All types are in `src/types/database.ts`:

```typescript
interface FriendRelationship {
  id: string;
  user_id: string;
  friend_id: string;
  created_at: string;
  updated_at: string;
}

interface GraphEdge {
  from: string;
  to: string;
  id?: string;
}

interface GraphNode {
  id: string;
  label?: string;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
```

## Database Schema

The `friend_relationships` table stores bidirectional friendships:

- Unique constraint prevents duplicates
- Self-friendship check prevents users from befriending themselves
- Automatic timestamp updates
- Indexed for fast lookups

## Development

```bash
# Run in development mode with hot reload
pnpm dev

# Build for production
pnpm build

# Run production build
pnpm start

# Lint code
pnpm lint
```

## Production Deployment

The server is configured for Vercel deployment:

1. Set environment variables in Vercel dashboard:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `NODE_ENV=production`

2. Deploy via Vercel dashboard or CLI

See root [README.md](../README.md) for deployment details.

