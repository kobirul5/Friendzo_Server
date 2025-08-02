// import httpStatus from 'http-status';
// import { notificationService } from './notification.service';
// import catchAsync from '../../../shared/catchAsync';
// import sendResponse from '../../../shared/sendResponse';

// const createNotification = catchAsync(async (req, res) => {
//   const result = await notificationService.createIntoDb(req.body);
//   sendResponse(res, {
//     statusCode: httpStatus.CREATED,
//     success: true,
//     message: 'Notification created successfully',
//     data: result,
//   });
// });

// const getNotificationList = catchAsync(async (req, res) => {
//   const result = await notificationService.getListFromDb();
//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: 'Notification list retrieved successfully',
//     data: result,
//   });
// });

// const getNotificationById = catchAsync(async (req, res) => {
//   const result = await notificationService.getByIdFromDb(req.params.id);
//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: 'Notification details retrieved successfully',
//     data: result,
//   });
// });



// const deleteNotification = catchAsync(async (req, res) => {
//   const result = await notificationService.deleteItemFromDb(req.params.id);
//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: 'Notification deleted successfully',
//     data: result,
//   });
// });

// export const notificationController = {
//   createNotification,
//   getNotificationList,
//   getNotificationById,
//   deleteNotification,
// };