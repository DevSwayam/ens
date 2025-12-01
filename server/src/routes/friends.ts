import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { FriendService } from '../services/friendService';
import {
  FriendRelationshipInsert,
  FriendRelationshipDelete,
} from '../types/database';
import { validateRequest } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { sendSuccess } from '../utils/response';
import { HttpStatus } from '../types/api';

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
router.get(
  '/graph',
  asyncHandler(async (_req: Request, res: Response) => {
    const graphData = await FriendService.getGraphData();
    sendSuccess(res, graphData, HttpStatus.OK);
  })
);

/**
 * GET /api/friends/relationships
 * Get all friend relationships
 */
router.get(
  '/relationships',
  asyncHandler(async (_req: Request, res: Response) => {
    const relationships = await FriendService.getAllRelationships();
    sendSuccess(res, relationships, HttpStatus.OK);
  })
);

/**
 * POST /api/friends/add
 * Add a new friend relationship (edge)
 */
router.post(
  '/add',
  validateRequest(addRelationshipSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const validatedReq = req as Request & { validatedBody: FriendRelationshipInsert };
    const relationship = await FriendService.addRelationship(validatedReq.validatedBody);
    sendSuccess(res, relationship, HttpStatus.CREATED, 'Friendship relationship created successfully');
  })
);

/**
 * DELETE /api/friends/delete
 * Delete a friend relationship (edge)
 */
router.delete(
  '/delete',
  validateRequest(deleteRelationshipSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const validatedReq = req as Request & { validatedBody: FriendRelationshipDelete };
    await FriendService.deleteRelationship(validatedReq.validatedBody);
    sendSuccess(res, null, HttpStatus.OK, 'Friendship relationship deleted successfully');
  })
);

export default router;
