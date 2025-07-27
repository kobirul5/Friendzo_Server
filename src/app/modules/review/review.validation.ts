import { z } from 'zod';

export const createReviewSchema = z.object({
  createProjectId: z.string().min(1, { message: 'Project ID is required' }),
  rating: z.number().min(1).max(5),
  comment: z.string().max(500),
  customerId: z.string().min(1, { message: 'Customer ID is required' }),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
