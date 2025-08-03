// import ApiError from "../../../errors/ApiErrors";
// import prisma from "../../../shared/prisma";
// import admin from "./firebaseAdmin";

// // 🔔 Send a notification to a single user
// const sendSingleNotification = async (req: any) => {
//   try {
//     const { userId } = req.params;
//     const { title, body } = req.body;

//     if (!title || !body) {
//       throw new ApiError(400, "Title and body are required");
//     }

//     const user = await prisma.user.findUnique({
//       where: { id: userId },
//     });

//     if (!user || !user.fcmToken) {
//       return;
//     }

//     const message = {
//       notification: { title, body },
//       token: user.fcmToken,
//     };

//     await prisma.notification.create({
//       data: {
//         recipientId: userId,
//         senderId: req.user.id,
//         title,
//         message: body,
//         isRead: false,
//         type: "MESSAGE", // Optional: adjust based on your needs
//       },
//     });

//     const response = await admin.messaging().send(message);
//     return response;
//   } catch (error: any) {
//     console.error("Error sending notification:", error);

//     if (error.code === "messaging/invalid-registration-token") {
//       throw new ApiError(400, "Invalid FCM registration token");
//     } else if (error.code === "messaging/registration-token-not-registered") {
//       throw new ApiError(404, "FCM token is no longer registered");
//     } else {
//       throw new ApiError(500, error.message || "Failed to send notification");
//     }
//   }
// };

// // 🔔 Send notifications to all users with valid FCM tokens
// const sendNotifications = async (req: any) => {
//   try {
//     const { title, body } = req.body;

//     if (!title || !body) {
//       throw new ApiError(400, "Title and body are required");
//     }

//     const users = await prisma.user.findMany({
//       where: { fcmToken: { not: null } },
//       select: { id: true, fcmToken: true },
//     });

//     if (!users.length) return;

//     const fcmTokens = users.map((user) => user.fcmToken!);

//     const message = {
//       notification: { title, body },
//       tokens: fcmTokens,
//     };

//     const response = await admin.messaging().sendEachForMulticast(message as any);

//     const successIndices = response.responses
//       .map((res: any, idx: number) => (res.success ? idx : null))
//       .filter((idx:number): idx is number => idx !== null);

//     const successfulUsers = successIndices.map((idx:number) => users[idx]);

//     const notificationData = successfulUsers.map((user:any) => ({
//       recipientId: user.id,
//       senderId: req.user.id,
//       title,
//       message: body,
//       isRead: false,
//       type: "MESSAGE", // Optional: change if sending specific types
//     }));

//     await prisma.notification.createMany({ data: notificationData });

//     const failedTokens = response.responses
//       .map((res: any, idx: number) => (!res.success ? fcmTokens[idx] : null))
//       .filter((token:string): token is string => token !== null);

//     return {
//       successCount: response.successCount,
//       failureCount: response.failureCount,
//       failedTokens,
//     };
//   } catch (error: any) {
//     throw new ApiError(500, error.message || "Failed to send notifications");
//   }
// };

// // 📥 Get all notifications for current user
// const getNotificationsFromDB = async (req: any) => {
//   try {
//     const userId = req.user.id;
//     if (!userId) {
//       throw new ApiError(400, "User ID is required");
//     }

//     const notifications = await prisma.notification.findMany({
//       where: { recipientId: userId },
//       include: {
//         sender: {
//           select: {
//             id: true,
//             email: true,
//             firstName: true,
//             lastName: true,
//             profileImage: true,
//           },
//         },
//       },
//       orderBy: {
//         createdAt: "desc",
//       },
//     });

//     return notifications.map((n) => ({
//       id: n.id,
//       title: n.title,
//       body: n.message,
//       isRead: n.isRead,
//       createdAt: n.createdAt,
//       sender: n.sender
//         ? {
//             id: n.sender.id,
//             email: n.sender.email,
//             name: n.sender.firstName + " " + n.sender.lastName,
//             images: n.sender.profileImage || null,
//           }
//         : null,
//     }));
//   } catch (error: any) {
//     throw new ApiError(500, error.message || "Failed to fetch notifications");
//   }
// };

// // 📥 Get a single notification and mark as read
// const getSingleNotificationFromDB = async (req: any, notificationId: string) => {
//   try {
//     const userId = req.user.id;

//     if (!userId) {
//       throw new ApiError(400, "User ID is required");
//     }

//     if (!notificationId) {
//       throw new ApiError(400, "Notification ID is required");
//     }

//     const notification = await prisma.notification.findFirst({
//       where: {
//         id: notificationId,
//         recipientId: userId,
//       },
//       include: {
//         sender: {
//           select: {
//             id: true,
//             email: true,
//             firstName: true,
//             lastName: true,
//             profileImage: true,
//           },
//         },
//       },
//     });

//     if (!notification) {
//       throw new ApiError(404, "Notification not found");
//     }

//     const updated = await prisma.notification.update({
//       where: { id: notificationId },
//       data: { isRead: true },
//       include: {
//         sender: {
//           select: {
//             id: true,
//             email: true,
//             firstName: true,
//             lastName: true,
//             profileImage: true,
//           },
//         },
//       },
//     });

//     return {
//       id: updated.id,
//       title: updated.title,
//       body: updated.message,
//       isRead: updated.isRead,
//       createdAt: updated.createdAt,
//       sender: updated.sender
//         ? {
//             id: updated.sender.id,
//             email: updated.sender.email,
//             name: updated.sender.firstName + " " + updated.sender.lastName,
//             images: updated.sender.profileImage || null,
//           }
//         : null,
//     };
//   } catch (error: any) {
//     throw new ApiError(500, error.message || "Failed to fetch notification");
//   }
// };

// // 🚀 Export services
// export const notificationServices = {
//   sendSingleNotification,
//   sendNotifications,
//   getNotificationsFromDB,
//   getSingleNotificationFromDB,
// };
