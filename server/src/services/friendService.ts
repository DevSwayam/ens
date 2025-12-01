import { supabase, FRIENDS_TABLE } from '../lib/supabase';
import {
  FriendRelationship,
  FriendRelationshipInsert,
  FriendRelationshipDelete,
  GraphEdge,
  GraphNode,
  GraphData,
  DatabaseResponse,
} from '../types/database';

/**
 * Service for managing friend relationships (edges) in the social network
 */
export class FriendService {
  /**
   * Get all friend relationships
   */
  static async getAllRelationships(): Promise<DatabaseResponse<FriendRelationship[]>> {
    try {
      const { data, error } = await supabase
        .from(FRIENDS_TABLE)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data || [], error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Add a new friend relationship (edge)
   */
  static async addRelationship(
    relationship: FriendRelationshipInsert
  ): Promise<DatabaseResponse<FriendRelationship>> {
    try {
      // Validate that user_id and friend_id are different
      if (relationship.user_id === relationship.friend_id) {
        return {
          data: null,
          error: 'User cannot be friends with themselves',
        };
      }

      // Check if relationship already exists (in either direction)
      const { data: existing } = await supabase
        .from(FRIENDS_TABLE)
        .select('*')
        .or(
          `and(user_id.eq.${relationship.user_id},friend_id.eq.${relationship.friend_id}),and(user_id.eq.${relationship.friend_id},friend_id.eq.${relationship.user_id})`
        )
        .single();

      if (existing) {
        return {
          data: null,
          error: 'Friendship relationship already exists',
        };
      }

      const { data, error } = await supabase
        .from(FRIENDS_TABLE)
        .insert({
          user_id: relationship.user_id,
          friend_id: relationship.friend_id,
        })
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Delete a friend relationship (edge)
   */
  static async deleteRelationship(
    relationship: FriendRelationshipDelete
  ): Promise<DatabaseResponse<boolean>> {
    try {
      // Delete relationship in both directions (bidirectional friendship)
      const { error } = await supabase
        .from(FRIENDS_TABLE)
        .delete()
        .or(
          `and(user_id.eq.${relationship.user_id},friend_id.eq.${relationship.friend_id}),and(user_id.eq.${relationship.friend_id},friend_id.eq.${relationship.user_id})`
        );

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: true, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Convert friend relationships to graph format (nodes and edges)
   */
  static relationshipsToGraph(
    relationships: FriendRelationship[]
  ): GraphData {
    const nodeSet = new Set<string>();
    const edges: GraphEdge[] = [];

    // Extract all unique user IDs and create edges
    relationships.forEach((rel) => {
      nodeSet.add(rel.user_id);
      nodeSet.add(rel.friend_id);
      edges.push({
        from: rel.user_id,
        to: rel.friend_id,
        id: rel.id,
      });
    });

    // Create nodes from unique user IDs
    const nodes: GraphNode[] = Array.from(nodeSet).map((id) => ({
      id,
      label: id,
    }));

    return { nodes, edges };
  }

  /**
   * Get graph data (all relationships converted to graph format)
   */
  static async getGraphData(): Promise<DatabaseResponse<GraphData>> {
    const relationshipsResponse = await this.getAllRelationships();

    if (relationshipsResponse.error || !relationshipsResponse.data) {
      return {
        data: null,
        error: relationshipsResponse.error || 'Failed to fetch relationships',
      };
    }

    const graphData = this.relationshipsToGraph(relationshipsResponse.data);
    return { data: graphData, error: null };
  }
}

