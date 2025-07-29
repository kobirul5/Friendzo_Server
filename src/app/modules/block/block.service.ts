
import httpStatus from 'http-status';
import prisma from '../../../shared/prisma';
import ApiError from '../../../errors/ApiErrors';


const createIntoDb = async (blockedUserId: string, blockerId: string) => {
  console.log(blockedUserId, blockerId)
  if (blockerId === blockedUserId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "You cannot block yourself");
  }

  const exists = await prisma.block.findFirst({
    where: { blockerId, blockedUserId },
  });

  if (exists) {
    throw new ApiError(httpStatus.CONFLICT, "User already blocked");
  }

  const result = await prisma.block.create({
    data: { blockerId, blockedUserId },
  });

  return result;
};


export const blockService = {
  createIntoDb,
};