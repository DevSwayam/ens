import { supabase, NODES_TABLE, RELATIONSHIPS_TABLE } from '../lib/supabase';
import {
  Node,
  AddRelationshipInput,
  DeleteRelationshipInput,
  GraphEdge,
  GraphNode,
  GraphData,
  FriendRelationship,
} from '../types/database';
import { ConflictError, DatabaseError } from '../utils/errors';
import { logger } from '../middleware/logger';

/**
 * Service for managing graph nodes and relationships (normalized schema)
 */
export class FriendService {
  /**
   * Get or create a node by ENS name
   */
  private static async getOrCreateNode(ensName: string): Promise<Node> {
    const { data, error } = await supabase
      .from(NODES_TABLE)
      .upsert({ ens_name: ensName }, { onConflict: 'ens_name' })
      .select()
      .single();

    if (error) {
      throw new DatabaseError('Failed to get/create node', error);
    }
    return data;
  }

  /**
   * Get node by ENS name
   */
  private static async getNodeByEnsName(ensName: string): Promise<Node | null> {
    const { data, error } = await supabase
      .from(NODES_TABLE)
      .select('*')
      .eq('ens_name', ensName)
      .maybeSingle();

    if (error) {
      throw new DatabaseError('Failed to fetch node', error);
    }
    return data;
  }

  /**
   * Get all nodes
   */
  static async getAllNodes(): Promise<Node[]> {
    const { data, error } = await supabase
      .from(NODES_TABLE)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      if (error.message.includes('does not exist') || error.code === 'PGRST116') {
        return [];
      }
      throw new DatabaseError('Failed to fetch nodes', error);
    }
    return data || [];
  }

  /**
   * Add a standalone node
   */
  static async addNode(ensName: string): Promise<{ id: string; ens_name: string }> {
    const node = await this.getOrCreateNode(ensName);
    logger.info('Node added/updated', { ensName });
    return { id: node.id, ens_name: node.ens_name };
  }

  /**
   * Add multiple nodes in batch
   */
  static async addNodesBatch(ensNames: string[]): Promise<{ created: number }> {
    const uniqueNames = [...new Set(ensNames)];
    const toInsert = uniqueNames.map((ens_name) => ({ ens_name }));

    const { error } = await supabase
      .from(NODES_TABLE)
      .upsert(toInsert, { onConflict: 'ens_name' });

    if (error) {
      logger.error('Failed to batch add nodes', { error: error.message });
      throw new DatabaseError('Failed to add nodes', error);
    }

    logger.info('Batch nodes added', { count: uniqueNames.length });
    return { created: uniqueNames.length };
  }

  /**
   * Delete a node (cascades to relationships)
   */
  static async deleteNode(ensName: string): Promise<void> {
    const { error } = await supabase
      .from(NODES_TABLE)
      .delete()
      .eq('ens_name', ensName);

    if (error) {
      logger.error('Failed to delete node', { error: error.message, ensName });
      throw new DatabaseError('Failed to delete node', error);
    }
    logger.info('Node deleted', { ensName });
  }

  /**
   * Get all relationships with ENS names resolved
   */
  static async getAllRelationships(): Promise<FriendRelationship[]> {
    const { data, error } = await supabase
      .from(RELATIONSHIPS_TABLE)
      .select(`
        id,
        from_node_id,
        to_node_id,
        created_at,
        from_node:nodes!relationships_from_node_id_fkey(ens_name),
        to_node:nodes!relationships_to_node_id_fkey(ens_name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      if (error.message.includes('does not exist') || error.code === 'PGRST116') {
        return [];
      }
      logger.error('Failed to fetch relationships', { error: error.message });
      throw new DatabaseError('Failed to fetch relationships', error);
    }

    // Transform to include user_id/friend_id for backwards compatibility
    return (data || []).map((rel: any) => ({
      id: rel.id,
      from_node_id: rel.from_node_id,
      to_node_id: rel.to_node_id,
      created_at: rel.created_at,
      user_id: rel.from_node?.ens_name || '',
      friend_id: rel.to_node?.ens_name || '',
    }));
  }

  /**
   * Add a relationship between two ENS names
   */
  static async addRelationship(input: AddRelationshipInput): Promise<FriendRelationship> {
    const { user_id, friend_id } = input;

    if (user_id === friend_id) {
      throw new ConflictError('Cannot create self-relationship');
    }

    // Get or create both nodes
    const [fromNode, toNode] = await Promise.all([
      this.getOrCreateNode(user_id),
      this.getOrCreateNode(friend_id),
    ]);

    // Check if relationship already exists (either direction)
    const { data: existing } = await supabase
      .from(RELATIONSHIPS_TABLE)
      .select('id')
      .or(`and(from_node_id.eq.${fromNode.id},to_node_id.eq.${toNode.id}),and(from_node_id.eq.${toNode.id},to_node_id.eq.${fromNode.id})`)
      .maybeSingle();

    if (existing) {
      throw new ConflictError('Relationship already exists');
    }

    // Create the relationship
    const { data, error } = await supabase
      .from(RELATIONSHIPS_TABLE)
      .insert({ from_node_id: fromNode.id, to_node_id: toNode.id })
      .select()
      .single();

    if (error) {
      logger.error('Failed to add relationship', { error: error.message, input });
      throw new DatabaseError('Failed to create relationship', error);
    }

    logger.info('Relationship created', { relationshipId: data.id });
    return {
      ...data,
      user_id,
      friend_id,
    };
  }

  /**
   * Add multiple relationships in batch
   */
  static async addRelationshipsBatch(
    inputs: AddRelationshipInput[]
  ): Promise<{ created: FriendRelationship[]; skipped: number }> {
    let skipped = 0;

    // Filter self-relationships
    const validInputs = inputs.filter((rel) => rel.user_id !== rel.friend_id);

    // Collect all unique ENS names
    const allNames = new Set<string>();
    validInputs.forEach((rel) => {
      allNames.add(rel.user_id);
      allNames.add(rel.friend_id);
    });

    // Batch create/get all nodes
    const toInsert = Array.from(allNames).map((ens_name) => ({ ens_name }));
    await supabase.from(NODES_TABLE).upsert(toInsert, { onConflict: 'ens_name' });

    // Fetch all nodes to get their IDs
    const { data: nodes } = await supabase
      .from(NODES_TABLE)
      .select('id, ens_name')
      .in('ens_name', Array.from(allNames));

    const nodeMap = new Map((nodes || []).map((n) => [n.ens_name, n.id]));

    // Get existing relationships
    const { data: existingRels } = await supabase
      .from(RELATIONSHIPS_TABLE)
      .select('from_node_id, to_node_id');

    const existingSet = new Set(
      (existingRels || []).flatMap((rel) => [
        `${rel.from_node_id}|${rel.to_node_id}`,
        `${rel.to_node_id}|${rel.from_node_id}`,
      ])
    );

    // Filter to only new relationships
    const toInsertRels: { from_node_id: string; to_node_id: string }[] = [];
    const insertedInputs: AddRelationshipInput[] = [];

    for (const input of validInputs) {
      const fromId = nodeMap.get(input.user_id);
      const toId = nodeMap.get(input.friend_id);

      if (!fromId || !toId) continue;

      const key1 = `${fromId}|${toId}`;
      const key2 = `${toId}|${fromId}`;

      if (existingSet.has(key1) || existingSet.has(key2)) {
        skipped++;
        continue;
      }

      existingSet.add(key1);
      toInsertRels.push({ from_node_id: fromId, to_node_id: toId });
      insertedInputs.push(input);
    }

    if (toInsertRels.length === 0) {
      return { created: [], skipped };
    }

    // Batch insert relationships
    const { data, error } = await supabase
      .from(RELATIONSHIPS_TABLE)
      .insert(toInsertRels)
      .select();

    if (error) {
      logger.error('Failed to batch add relationships', { error: error.message });
      throw new DatabaseError('Failed to create relationships', error);
    }

    // Map back to FriendRelationship format
    const created: FriendRelationship[] = (data || []).map((rel, i) => ({
      ...rel,
      user_id: insertedInputs[i]?.user_id || '',
      friend_id: insertedInputs[i]?.friend_id || '',
    }));

    logger.info('Batch relationships created', { count: created.length, skipped });
    return { created, skipped };
  }

  /**
   * Delete a relationship between two ENS names
   */
  static async deleteRelationship(input: DeleteRelationshipInput): Promise<void> {
    const { user_id, friend_id } = input;

    // Get node IDs
    const [fromNode, toNode] = await Promise.all([
      this.getNodeByEnsName(user_id),
      this.getNodeByEnsName(friend_id),
    ]);

    if (!fromNode || !toNode) {
      logger.warn('Nodes not found for deletion', { user_id, friend_id });
      return;
    }

    // Delete relationship in both directions
    const { error } = await supabase
      .from(RELATIONSHIPS_TABLE)
      .delete()
      .or(`and(from_node_id.eq.${fromNode.id},to_node_id.eq.${toNode.id}),and(from_node_id.eq.${toNode.id},to_node_id.eq.${fromNode.id})`);

    if (error) {
      logger.error('Failed to delete relationship', { error: error.message, input });
      throw new DatabaseError('Failed to delete relationship', error);
    }

    logger.info('Relationship deleted', { user_id, friend_id });
  }

  /**
   * Get graph data for visualization
   */
  static async getGraphData(): Promise<GraphData> {
    const [nodes, relationships] = await Promise.all([
      this.getAllNodes(),
      this.getAllRelationships(),
    ]);

    // Build graph nodes from all nodes in the table
    const graphNodes: GraphNode[] = nodes.map((n) => ({
      id: n.ens_name,
      label: n.ens_name,
    }));

    // Build graph edges from relationships
    const graphEdges: GraphEdge[] = relationships.map((rel) => ({
      from: rel.user_id,
      to: rel.friend_id,
      id: rel.id,
      created_at: rel.created_at,
    }));

    return { nodes: graphNodes, edges: graphEdges };
  }
}
