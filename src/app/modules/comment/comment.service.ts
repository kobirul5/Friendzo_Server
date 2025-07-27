
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
    throw new ApiError(404, 'Memory not found.');
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

const getListFromDb = async () => {
  
    const result = await prisma.comment.findMany();
    return result;
};


const deleteItemFromDb = async (id: string) => {
  const transaction = await prisma.$transaction(async (prisma) => {
    const deletedItem = await prisma.comment.delete({
      where: { id },
    });

    // Add any additional logic if necessary, e.g., cascading deletes
    return deletedItem;
  });

  return transaction;
};
;

export const commentService = {
createCommentService,
getListFromDb,
deleteItemFromDb,
};