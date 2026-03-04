
import httpStatus from 'http-status';
import prisma from '../../../../shared/prisma';
import ApiError from '../../../../errors/ApiErrors';



const coinsCreate = async ({ data, userId}: any) => { 

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found!");

  if (user.role !== "ADMIN")
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      "Unauthorized! Only Admin can create!"
    );


  if(!data.price && data.coinAmount){
    throw new ApiError(httpStatus.BAD_REQUEST, "price and totalAmount is required.");
  }
  
  const dataToSave: any = {
    ...data,
    price: parseFloat(data.price),
  };

  const created = await prisma.coins.create({ data: dataToSave });

  return created;
};


const getListFromDb = async (id: string) => {

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  
    const result = await prisma.coins.findMany();
    if(result.length === 0){
      throw new ApiError(httpStatus.NOT_FOUND, 'Coins not found');
    }
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
coinsCreate,
getListFromDb,
getByIdFromDb,
updateIntoDb,
deleteItemFromDb,
};