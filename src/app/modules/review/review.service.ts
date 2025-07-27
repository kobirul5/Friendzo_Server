// // review.service.ts

// import { PrismaClient } from '@prisma/client';
// import { CreateReviewInput } from './review.interface';

// const prisma = new PrismaClient();

// export const createReview = async (data: CreateReviewInput) => {
//   const project = await prisma.createProduct.findUnique({
//     where: { id: data.createProjectId },
//     include: { review: true },
//   });

//   if (!project) throw new Error('Project not found');
//   if (project.status !== 'COMPLETED') throw new Error('Project not COMPLETED');
//   if (project.review) throw new Error('Review already exists');

//   const review = await prisma.review.create({
//     data: {
//       rating: data.rating,
//       comment: data.comment,
//       createProjectId: data.createProjectId,
//       providerId: project.providerId,
//       customerId: data.customerId,
//     },
//   });

//   return review;
// };

// export const getAllReviews = async () => {
//   return prisma.review.findMany();
// };

// export const getReviewById = async (id: string) => {
//   return prisma.review.findUnique({
//     where: { id },
//   });
// };

// export const updateReview = async (id: string, data: Partial<CreateReviewInput>) => {
//   return prisma.review.update({
//     where: { id },
//     data,
//   });
// };

// export const deleteReview = async (id: string) => {
//   return prisma.review.delete({
//     where: { id },
//   });
// };
