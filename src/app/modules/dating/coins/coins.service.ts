
import httpStatus from 'http-status';
import ApiError from '../../../../errors/ApiErrors';
import prisma from '../../../../shared/prisma';

const getCoinList = async ({userId}: any) => { 

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, "Unsuthorized!, User not found!");


  const result = await prisma.coins.findMany();
  return result;
};


const buyCoin = async ({ data, userId }: any) => {
 
  return "result";
};

export const coinsService = { 
  getCoinList,
  buyCoin
};