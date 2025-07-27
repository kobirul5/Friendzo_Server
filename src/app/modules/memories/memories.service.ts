import { PrismaClient, Memory } from '@prisma/client';
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
const getSingleMemory = async (id: string): Promise<Memory | null> => {
  return await prisma.memory.findUnique({ where: { id } });
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
  return await prisma.memory.delete({ where: { id } });
};

// Export all
export const memoriesService = {
  createMemory,
  getMemoriesByUser,
  getSingleMemory,
  updateMemory,
  deleteMemory,
};
