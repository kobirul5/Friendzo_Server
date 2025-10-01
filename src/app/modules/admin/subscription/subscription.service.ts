
import httpStatus from 'http-status';
import prisma from '../../../../shared/prisma';
import ApiError from '../../../../errors/ApiErrors';
import { UserRole } from '@prisma/client';


const createSubscriptionPlan = async (data: any, userId: string) => {

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found!");

  // if (user.role !== UserRole.ADMIN  && user.role !== UserRole.MANAGER) {
  //   throw new ApiError(httpStatus.FORBIDDEN, "You don't have permission to create a subscription plan");
  // }

const existingPlan = await prisma.subscriptionPlan.findMany({
  where: {
    name: {
      equals: data.name,
      mode: 'insensitive', // case-insensitive comparison
    },
  },
});

if (existingPlan.length > 0) {
  throw new ApiError(httpStatus.CONFLICT, "A subscription plan with this name already exists");
}

  const { name,  price, currency = 'USD', interval = 'MONTH', trialDays, features } = data;

  const plan = await prisma.subscriptionPlan.create({
    data: { name, price, currency, interval, trialDays, features },
  });

  return plan;
};


const getSubscriptionPlanList = async (userId: string) => {
  
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found!");

    const result = await prisma.subscriptionPlan.findMany();

    return result;
};




export const subscriptionService = {
getSubscriptionPlanList,
createSubscriptionPlan,

};