// import httpStatus from 'http-status';
// import prisma from '../../../shared/prisma';

// interface InotificationData {
//   title: string;
//   message?: string;
//   isRead?: boolean;
//   recipientId: string;
//   senderId?: string;
// }

// const createNotificationService = async (notificationData: InotificationData) => {


//   const notification = await prisma.notification.create({
//     data: {
//       title: notificationData.title,
//       message: notificationData.message,
//       isRead: notificationData.isRead ?? false,
//       recipientId: notificationData.recipientId,
//       senderId: notificationData.senderId,
//     },
//   });
//   return notification;
// };




// export const notificationService = {
//   createNotificationService
// };