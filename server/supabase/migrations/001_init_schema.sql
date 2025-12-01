-- Schema: Normalized graph structure with nodes and relationships

-- Nodes table (vertices)
CREATE TABLE IF NOT EXISTS public.nodes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ens_name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Relationships table (edges) with foreign keys
CREATE TABLE IF NOT EXISTS public.relationships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    from_node_id UUID NOT NULL REFERENCES public.nodes(id) ON DELETE CASCADE,
    to_node_id UUID NOT NULL REFERENCES public.nodes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(from_node_id, to_node_id),
    CHECK (from_node_id != to_node_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_nodes_ens_name ON public.nodes(ens_name);
CREATE INDEX IF NOT EXISTS idx_relationships_from ON public.relationships(from_node_id);
CREATE INDEX IF NOT EXISTS idx_relationships_to ON public.relationships(to_node_id);

-- Enable RLS
ALTER TABLE public.nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationships ENABLE ROW LEVEL SECURITY;

-- Policies (permissive for development)
CREATE POLICY "Allow all on nodes" ON public.nodes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on relationships" ON public.relationships FOR ALL USING (true) WITH CHECK (true);
