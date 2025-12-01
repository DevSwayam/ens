/**
 * Database types for normalized graph schema
 */

// Node (vertex) in the graph
export interface Node {
  id: string;
  ens_name: string;
  created_at: string;
  updated_at: string;
}

export interface NodeInsert {
  ens_name: string;
}

// Relationship (edge) between nodes
export interface Relationship {
  id: string;
  from_node_id: string;
  to_node_id: string;
  created_at: string;
}

export interface RelationshipInsert {
  from_node_id: string;
  to_node_id: string;
}

// Input types for API (using ENS names, not UUIDs)
export interface AddRelationshipInput {
  user_id: string;  // ENS name
  friend_id: string; // ENS name
}

export interface DeleteRelationshipInput {
  user_id: string;  // ENS name
  friend_id: string; // ENS name
}

// Legacy aliases for backwards compatibility
export type FriendRelationship = Relationship & { user_id: string; friend_id: string };
export type FriendRelationshipInsert = AddRelationshipInput;
export type FriendRelationshipDelete = DeleteRelationshipInput;

// Graph data types for visualization
export interface GraphEdge {
  from: string;
  to: string;
  id?: string;
  created_at?: string;
}

export interface GraphNode {
  id: string;
  label?: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/**
 * Database response types
 */
export interface DatabaseResponse<T> {
  data: T | null;
  error: string | null;
}
