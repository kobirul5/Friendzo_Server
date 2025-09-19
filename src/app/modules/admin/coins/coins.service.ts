
import httpStatus from 'http-status';
import prisma from '../../../../shared/prisma';
import ApiError from '../../../../errors/ApiErrors';


const createIntoDb = async (data: any, userId: string) => {
  const {coinAmount,price} = data;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found')
  }

  if (user.role !== 'ADMIN') {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Unauthorized! Only Admin can create!')
  }

if (!coinAmount || !price) {
  throw new ApiError(httpStatus.BAD_REQUEST, 'coinAmount and price are required');
}
  
  const result = await prisma.coins.create({
    data: {
      coinAmount,
      price,
    },
  });
  return result;


};

const getListFromDb = async () => {
  
    const result = await prisma.coins.findMany();
    return result;
};

const getByIdFromDb = async (id: string) => {
  
    const result = await prisma.coins.findUnique({ where: { id } });
    if (!result) {
      throw new Error('Coins not found');
    }
    return result;
  };



const updateIntoDb = async (id: string, data: any) => {
  const transaction = await prisma.$transaction(async (prisma) => {
    const result = await prisma.coins.update({
      where: { id },
      data,
    });
    return result;
  });

  return transaction;
};

const deleteItemFromDb = async (id: string) => {
  const transaction = await prisma.$transaction(async (prisma) => {
    const deletedItem = await prisma.coins.delete({
      where: { id },
    });

    // Add any additional logic if necessary, e.g., cascading deletes
    return deletedItem;
  });

  return transaction;
};
;

export const coinsService = {
createIntoDb,
getListFromDb,
getByIdFromDb,
updateIntoDb,
deleteItemFromDb,
};