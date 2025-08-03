
import prisma from "../../../shared/prisma";


const getAllPostForProfileService = async (userId: string) => {

  const posts = await prisma.memory.findMany({
    where: {
      userId,
    },
  });
  const result = await prisma.memory.count({
    where: {
      userId,
    },
  });

  return { totalPost:  result,
    posts: posts
  };
};



export const profileService = {
  getAllPostForProfileService,

};