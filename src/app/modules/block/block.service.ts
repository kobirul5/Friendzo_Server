
import httpStatus from 'http-status';
import prisma from '../../../shared/prisma';
import ApiError from '../../../errors/ApiErrors';


const createBlockBetweenUsers  = async ({blockedUserId, blockerId}: {blockedUserId: string, blockerId: string}) => {

  const findBlockedUser = await prisma.user.findUnique({
    where: { id: blockedUserId },
  });


  if (!findBlockedUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "Blocked user not found");
  }
  
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
  createBlockBetweenUsers ,
};