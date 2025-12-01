/**
 * Database types for friend relationships (edges in the social network graph)
 */

export interface FriendRelationship {
  id: string;
  user_id: string;
  friend_id: string;
  created_at: string;
  updated_at: string;
}

export interface FriendRelationshipInsert {
  user_id: string;
  friend_id: string;
}

export interface FriendRelationshipDelete {
  user_id: string;
  friend_id: string;
}

export interface GraphEdge {
  from: string;
  to: string;
  id?: string;
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

