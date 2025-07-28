
import prisma from "../../../shared/prisma";


const getAllPostForProfileService = async (userId: string) => {

  const event = await prisma.event.count({
    where: {
      userId,
    },
  });
  const result = await prisma.memory.count({
    where: {
      userId,
    },
  });

  return result + event;
};



export const profileService = {
  getAllPostForProfileService,

};