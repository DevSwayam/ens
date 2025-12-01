import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { FriendService } from '../services/friendService';
import {
  FriendRelationshipInsert,
  FriendRelationshipDelete,
} from '../types/database';

const router: Router = Router();

/**
 * Validation schemas using Zod
 */
const addRelationshipSchema = z.object({
  user_id: z.string().min(1, 'User ID is required'),
  friend_id: z.string().min(1, 'Friend ID is required'),
});

const deleteRelationshipSchema = z.object({
  user_id: z.string().min(1, 'User ID is required'),
  friend_id: z.string().min(1, 'Friend ID is required'),
});

/**
 * GET /api/friends/graph
 * Get all relationships as graph data (nodes and edges)
 */
router.get('/graph', async (_req: Request, res: Response) => {
  try {
    const result = await FriendService.getGraphData();

    if (result.error) {
      return res.status(500).json({
        success: false,
        error: result.error,
      });
    }

    return res.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/friends/relationships
 * Get all friend relationships
 */
router.get('/relationships', async (_req: Request, res: Response) => {
  try {
    const result = await FriendService.getAllRelationships();

    if (result.error) {
      return res.status(500).json({
        success: false,
        error: result.error,
      });
    }

    return res.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/friends/add
 * Add a new friend relationship (edge)
 */
router.post('/add', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validationResult = addRelationshipSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: validationResult.error.errors,
      });
    }

    const relationship: FriendRelationshipInsert = validationResult.data;
    const result = await FriendService.addRelationship(relationship);

    if (result.error) {
      return res.status(400).json({
        success: false,
        error: result.error,
      });
    }

    return res.status(201).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * DELETE /api/friends/delete
 * Delete a friend relationship (edge)
 */
router.delete('/delete', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validationResult = deleteRelationshipSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: validationResult.error.errors,
      });
    }

    const relationship: FriendRelationshipDelete = validationResult.data;
    const result = await FriendService.deleteRelationship(relationship);

    if (result.error) {
      return res.status(400).json({
        success: false,
        error: result.error,
      });
    }

    return res.json({
      success: true,
      message: 'Friendship relationship deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;

