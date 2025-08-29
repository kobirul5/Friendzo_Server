import { PrismaClient, Memory } from '@prisma/client';
import ApiError from '../../../errors/ApiErrors';
const prisma = new PrismaClient();

// Create Memory
const createMemory = async (data: {
  image: string;
  description: string;
  address?: string;
  lat: number;
  lng: number;
  userId: string;
}): Promise<Memory> => {
  return await prisma.memory.create({ data });
};

// Get all memories by user
const getMemoriesByUser = async (userId: string): Promise<Memory[]> => {
  return await prisma.memory.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
};

// Get single memory by ID
const getMemoryById = async (id: string): Promise<Memory | null> => {
  return await prisma.memory.findUnique({
    where: { id },
  });
};


// Update memory
const updateMemory = async (
  id: string,
  data: Partial<Pick<Memory, 'image' | 'description' | 'address' | 'lat' | 'lng'>>
): Promise<Memory> => {
  return await prisma.memory.update({
    where: { id },
    data,
  });
};

// Delete memory
const deleteMemory = async (id: string): Promise<Memory> => {
  return await prisma.memory.delete({
    where: { id },
  });
};

// Get all memories
const getMemoriesAllUsers = async (userId: string): Promise<Memory[]> => {

  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new ApiError(404, "User Not authorized");
  }
  const result = await prisma.memory.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          profileImage: true
        },
      }
    }
  });

  return result
};


// Export all
export const memoriesService = {
  createMemory,
  getMemoriesByUser,
  getMemoryById,
  updateMemory,
  deleteMemory,
  getMemoriesAllUsers
};
