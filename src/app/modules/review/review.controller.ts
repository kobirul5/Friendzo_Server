// // review.controller.ts

// import { Request, Response } from 'express';
// import {
//   createReview,
//   getAllReviews,
//   getReviewById,
//   updateReview,
//   deleteReview,
// } from './review.service';
// import { createReviewSchema } from './review.validation';

// export const createReviewController = async (req: Request, res: Response) => {
//   try {
//     const parseResult = createReviewSchema.safeParse(req.body);
//     if (!parseResult.success) {
//       return res.status(400).json({ error: parseResult.error.format() });
//     }

//     const review  = await createReview(parseResult.data);
//     return res.status(201).json(review);
//   } catch (err: any) {
//     return res.status(500).json({ error: err.message });
//   }
// };

// export const getAllReviewsController = async (req: Request, res: Response) => {
//   try {
//     const reviews = await getAllReviews();
//     return res.status(200).json(reviews);
//   } catch (err: any) {
//     return res.status(500).json({ error: err.message });
//   }
// };

// export const getReviewByIdController = async (req: Request, res: Response) => {
//   try {
//     const review = await getReviewById(req.params.id);
//     if (!review) return res.status(404).json({ message: 'Review not found' });

//     return res.status(200).json(review);
//   } catch (err: any) {
//     return res.status(500).json({ error: err.message });
//   }
// };

// export const updateReviewController = async (req: Request, res: Response) => {
//   try {
//     const review = await updateReview(req.params.id, req.body);
//     return res.status(200).json(review);
//   } catch (err: any) {
//     return res.status(500).json({ error: err.message });
//   }
// };

// export const deleteReviewController = async (req: Request, res: Response) => {
//   try {
//     await deleteReview(req.params.id);
//     return res.status(200).json({ message: 'Review deleted successfully' });
//   } catch (err: any) {
//     return res.status(500).json({ error: err.message });
//   }
// };

