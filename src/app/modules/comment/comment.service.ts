
import httpStatus from 'http-status';
import prisma from '../../../shared/prisma';
import ApiError from '../../../errors/ApiErrors';


const createCommentService = async (
  content: string,
  userId: string,
  memoryId: string
) => {

  const memory = await prisma.memory.findUnique({ where: { id: memoryId } });

  if (!memory) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Memory not found.');
  }

  const comment = await prisma.comment.create({
    data: {
      content,
      userId,
      memoryId,
    },
  });

  return comment;
};

const getCommentsByMemoryService = async (memoryId: string) => {

  const memory = await prisma.memory.findUnique({ where: { id: memoryId } });

  if (!memory) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Memory not found.');
  }

  const comments = await prisma.comment.findMany({
    where: { memoryId },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          profileImage: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return comments;
};



const deleteCommentService = async (commentId: string) => {
  // Check if comment exists
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
  });

  if (!comment) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Comment not found.');
  }

  // Delete comment
  const deletedComment = await prisma.comment.delete({
    where: { id: commentId },
  });

  return deletedComment;
};

export const commentService = {
createCommentService,
getCommentsByMemoryService,
deleteCommentService,
};