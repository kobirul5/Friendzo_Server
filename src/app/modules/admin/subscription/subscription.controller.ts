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

const deleteSubscriptionPlan = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const result = await subscriptionService.deleteSubscriptionPlan(id, userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subscription plan deleted successfully',
    data: null,
  });
});


const updateSubscriptionPlan = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const data = req.body;
  const result = await subscriptionService.updateSubscriptionPlan(data, userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subscription plan updated successfully',
    data: result,
  });
  
});

// subscription controller

const purchaseSubscription = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const data = req.body;
  const result = await subscriptionService.purchaseSubscription(data, userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subscription plan updated successfully',
    data: result,
  });
  
});
const purchaseSubscriptionStatic = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const data = req.body;
  const result = await subscriptionService.purchaseSubscriptionStatic(data, userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subscription plan updated successfully',
    data: result,
  });
  
});

const getUserSubscriptions = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const result = await subscriptionService.getUserSubscriptions(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User subscriptions retrieved successfully",
    data: result,
  });
});



export const subscriptionController = {
  getSubscriptionPlanList,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
  // subscription
  purchaseSubscription,
getUserSubscriptions,
purchaseSubscriptionStatic

}