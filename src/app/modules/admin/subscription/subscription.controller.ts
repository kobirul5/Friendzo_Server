import httpStatus from 'http-status';
import { subscriptionService } from './subscription.service';
import catchAsync from '../../../../shared/catchAsync';
import sendResponse from '../../../../shared/sendResponse';



const createSubscriptionPlan = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const data = req.body;
  const result = await subscriptionService.createSubscriptionPlan(data, userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subscription plan created successfully',
    data: result,
  });
});

const getSubscriptionPlanList = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const result = await subscriptionService.getSubscriptionPlanList(userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subscription list retrieved successfully',
    data: result,
  });
});


const updateSubscriptionPlan = catchAsync(async (req, res) => {
  
  
});

export const subscriptionController = {
  getSubscriptionPlanList,
  createSubscriptionPlan,
  updateSubscriptionPlan

};