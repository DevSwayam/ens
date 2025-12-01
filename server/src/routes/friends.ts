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

const batchAddSchema = z.object({
  relationships: z.array(z.object({
    user_id: z.string().min(1),
    friend_id: z.string().min(1),
  })).min(1, 'At least one relationship required'),
});

const deleteRelationshipSchema = z.object({
  user_id: z.string().min(1, 'User ID is required'),
  friend_id: z.string().min(1, 'Friend ID is required'),
});

const addNodeSchema = z.object({
  ens_name: z.string().min(1, 'ENS name is required'),
});

const addNodesBatchSchema = z.object({
  ens_names: z.array(z.string().min(1)).min(1, 'At least one ENS name required'),
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
 * POST /api/friends/batch
 * Add multiple relationships in a single request
 */
router.post(
  '/batch',
  validateRequest(batchAddSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const validatedReq = req as Request & { validatedBody: { relationships: { user_id: string; friend_id: string }[] } };
    const result = await FriendService.addRelationshipsBatch(validatedReq.validatedBody.relationships);
    sendSuccess(res, result, HttpStatus.CREATED, `Created ${result.created.length} relationships, skipped ${result.skipped} duplicates`);
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

/**
 * POST /api/friends/nodes
 * Add a standalone node (single ENS name)
 */
router.post(
  '/nodes',
  validateRequest(addNodeSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const validatedReq = req as Request & { validatedBody: { ens_name: string } };
    const node = await FriendService.addNode(validatedReq.validatedBody.ens_name);
    sendSuccess(res, node, HttpStatus.CREATED, 'Node added successfully');
  })
);

/**
 * POST /api/friends/nodes/batch
 * Add multiple standalone nodes in batch
 */
router.post(
  '/nodes/batch',
  validateRequest(addNodesBatchSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const validatedReq = req as Request & { validatedBody: { ens_names: string[] } };
    const result = await FriendService.addNodesBatch(validatedReq.validatedBody.ens_names);
    sendSuccess(res, result, HttpStatus.CREATED, `Added ${result.created} nodes`);
  })
);

/**
 * DELETE /api/friends/nodes/:ensName
 * Delete a standalone node
 */
router.delete(
  '/nodes/:ensName',
  asyncHandler(async (req: Request, res: Response) => {
    const { ensName } = req.params;
    await FriendService.deleteNode(ensName);
    sendSuccess(res, null, HttpStatus.OK, 'Node deleted successfully');
  })
);

export default router;
