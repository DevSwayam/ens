import { apiClient } from './client'

export interface GraphNode {
  id: string
  label?: string
}

export interface GraphEdge {
  from: string
  to: string
  id?: string
  created_at?: string
}

export interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export interface FriendRelationship {
  id: string
  user_id: string
  friend_id: string
  created_at: string
}

export interface AddRelationshipInput {
  user_id: string
  friend_id: string
}

export interface DeleteRelationshipInput {
  user_id: string
  friend_id: string
}

export interface BatchAddInput {
  relationships: AddRelationshipInput[]
}

export interface BatchAddResult {
  created: FriendRelationship[]
  skipped: number
}

export const friendsApi = {
  // Get graph data (nodes and edges)
  getGraph: async (): Promise<GraphData> => {
    return apiClient.get<GraphData>('/api/friends/graph')
  },

  // Get all relationships
  getRelationships: async (): Promise<FriendRelationship[]> => {
    return apiClient.get<FriendRelationship[]>('/api/friends/relationships')
  },

  // Add a friendship relationship
  addRelationship: async (input: AddRelationshipInput): Promise<FriendRelationship> => {
    return apiClient.post<FriendRelationship>('/api/friends/add', input)
  },

  // Add multiple relationships in a single batch request
  addRelationshipsBatch: async (relationships: AddRelationshipInput[]): Promise<BatchAddResult> => {
    return apiClient.post<BatchAddResult>('/api/friends/batch', { relationships })
  },

  // Delete a friendship relationship
  deleteRelationship: async (input: DeleteRelationshipInput): Promise<void> => {
    return apiClient.delete<void>('/api/friends/delete', input)
  },

  // Add a standalone node (single ENS name)
  addNode: async (ensName: string): Promise<{ id: string; ens_name: string }> => {
    return apiClient.post<{ id: string; ens_name: string }>('/api/friends/nodes', { ens_name: ensName })
  },

  // Add multiple standalone nodes in batch
  addNodesBatch: async (ensNames: string[]): Promise<{ created: number }> => {
    return apiClient.post<{ created: number }>('/api/friends/nodes/batch', { ens_names: ensNames })
  },
}
