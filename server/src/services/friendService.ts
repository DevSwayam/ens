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
import { ConflictError, DatabaseError } from '../utils/errors';
import { logger } from '../middleware/logger';

/**
 * Service for managing friend relationships (edges) in the social network
 */
export class FriendService {
  /**
   * Get all friend relationships
   */
  static async getAllRelationships(): Promise<FriendRelationship[]> {
    try {
      const { data, error } = await supabase
        .from(FRIENDS_TABLE)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Failed to fetch relationships', { error: error.message });
        throw new DatabaseError('Failed to fetch friend relationships', error);
      }

      return data || [];
    } catch (err) {
      if (err instanceof DatabaseError) {
        throw err;
      }
      logger.error('Unexpected error fetching relationships', { error: err });
      throw new DatabaseError('Unexpected error occurred while fetching relationships');
    }
  }

  /**
   * Add a new friend relationship (edge)
   */
  static async addRelationship(
    relationship: FriendRelationshipInsert
  ): Promise<FriendRelationship> {
    try {
      // Validate that user_id and friend_id are different
      if (relationship.user_id === relationship.friend_id) {
        throw new ConflictError('User cannot be friends with themselves');
      }

      // Check if relationship already exists (in either direction)
      const { data: existing } = await supabase
        .from(FRIENDS_TABLE)
        .select('*')
        .or(
          `and(user_id.eq.${relationship.user_id},friend_id.eq.${relationship.friend_id}),and(user_id.eq.${relationship.friend_id},friend_id.eq.${relationship.user_id})`
        )
        .maybeSingle();

      if (existing) {
        throw new ConflictError('Friendship relationship already exists');
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
        logger.error('Failed to add relationship', { error: error.message, relationship });
        throw new DatabaseError('Failed to create friend relationship', error);
      }

      if (!data) {
        throw new DatabaseError('Failed to create friend relationship: no data returned');
      }

      logger.info('Friend relationship created', { relationshipId: data.id });
      return data;
    } catch (err) {
      if (err instanceof ConflictError || err instanceof DatabaseError) {
        throw err;
      }
      logger.error('Unexpected error adding relationship', { error: err });
      throw new DatabaseError('Unexpected error occurred while creating relationship');
    }
  }

  /**
   * Delete a friend relationship (edge)
   */
  static async deleteRelationship(
    relationship: FriendRelationshipDelete
  ): Promise<void> {
    try {
      // Delete relationship in both directions (bidirectional friendship)
      const { error } = await supabase
        .from(FRIENDS_TABLE)
        .delete()
        .or(
          `and(user_id.eq.${relationship.user_id},friend_id.eq.${relationship.friend_id}),and(user_id.eq.${relationship.friend_id},friend_id.eq.${relationship.user_id})`
        );

      if (error) {
        logger.error('Failed to delete relationship', { error: error.message, relationship });
        throw new DatabaseError('Failed to delete friend relationship', error);
      }

      logger.info('Friend relationship deleted', { relationship });
    } catch (err) {
      if (err instanceof DatabaseError) {
        throw err;
      }
      logger.error('Unexpected error deleting relationship', { error: err });
      throw new DatabaseError('Unexpected error occurred while deleting relationship');
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
  static async getGraphData(): Promise<GraphData> {
    const relationships = await this.getAllRelationships();
    return this.relationshipsToGraph(relationships);
  }
}

