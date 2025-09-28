import { NotificationType, RequestStatus } from "@prisma/client";
import ApiError from "../../../errors/ApiErrors";
import prisma from "../../../shared/prisma";
import admin from "./firebaseService";


//  Send a notification to a single user
export interface INotificationPayload {
  title: string;                        // Notification title
  message?: string;                     // Optional message/body
  type: NotificationType;               // Enum (must match model)
  followStatus?: RequestStatus;
  image?: string;                       // Default: REJECTED

  receiverId: string;                   // Required (who gets the notification)
  senderId?: string;                    // Optional (who triggered it)

  targetType?: string;                  // e.g., "event", "memory", "comment"
  targetId?: string;                    // The ID of the target item

  fcmToken?: string;                    // Optional push notification token
}

const sendNotification = async (
  deviceToken: string,
  payload: INotificationPayload,
  userId: string
) => {
  // Ensure that deviceToken is a single string and not an array
  if (!deviceToken || typeof deviceToken !== "string") {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid device token");
  }

  // Create the message object for FCM
  const message = {
    notification: {
      title: payload.title,
      body: payload.message || "", // use message instead of body
    },
    data: {
      type: payload.type,
      targetId: payload.targetId || "",
      targetType: payload.targetType || "",
      senderId: payload.senderId || "",
      receiverId: userId,
    },
    token: deviceToken,
  };

  try {
    console.log(
      "📲 Sending notification:",
      JSON.stringify(message, null, 2)
    );

    // Send notification using Firebase Admin SDK
    const response = await admin.messaging().send(message);

    console.log(" Notification sent successfully:", response);

    return response;
  } catch (error) {
    console.error(" Firebase send error:", error);
    // throw new ApiError(
    //   httpStatus.INTERNAL_SERVER_ERROR, //not need to throw err , if fcm token not valid than server will crash
    //   "Failed to send notification"
    // );
  }
};

// save notification to db
export const saveNotification = async (
  payload: INotificationPayload,
  userId: string // receiverId
) => {
  try {
    await prisma.notification.create({
      data: {
        title: payload.title,
        message: payload.message,
        type: payload.type,
        followStatus: payload.followStatus ?? "REJECTED", // default if not passed
        image: payload.image || "",

        receiverId: userId,                // from function param
        senderId: payload.senderId ?? null, // optional

        targetType: payload.targetType ?? null,
        targetId: payload.targetId ?? null,
      },
    });

    console.log(" Notification saved successfully");
  } catch (error) {
    console.error(" Error saving notification:", error);
  }
};

//  Get all notifications for current user
const getMyNotifications = async (req: any) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      throw new ApiError(400, "User ID is required");
    }
    console.log(userId);

    const notifications = await prisma.notification.findMany({
      where: { receiverId: userId },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            profileImage: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    await prisma.notification.updateMany({
      where: { receiverId: userId },
      data: { isRead: true },
    });

    // const targetDetails : any = [];

    // for (const notification of notifications) {
    //   if(notification.targetId && notification.type === "LIKE") {
    //     const memories = await prisma.memory.findMany({
    //       where: { id: notification.targetId }
    //     })

    //     if(memories) {
    //      console.log(memories);
    //     }
    //   }
    // }

    return notifications;
  } catch (error: any) {
    throw new ApiError(500, error.message || "Failed to fetch notifications");
  }
};

//  Get a single notification and mark as read
const getSingleNotificationFromDB = async (req: any, notificationId: string) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      throw new ApiError(400, "User ID is required");
    }

    if (!notificationId) {
      throw new ApiError(400, "Notification ID is required");
    }

    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        receiverId: userId,
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            profileImage: true,
          },
        },
      },
    });

    if (!notification) {
      throw new ApiError(404, "Notification not found");
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            profileImage: true,
          },
        },
      },
    });

    return {
      id: updated.id,
      title: updated.title,
      body: updated.message,
      isRead: updated.isRead,
      createdAt: updated.createdAt,
      sender: updated.sender
        ? {
            id: updated.sender.id,
            email: updated.sender.email,
            name: updated.sender.firstName + " " + updated.sender.lastName,
            images: updated.sender.profileImage || null,
          }
        : null,
    };
  } catch (error: any) {
    throw new ApiError(500, error.message || "Failed to fetch notification");
  }
};

//  Export services
export const notificationServices = {
  sendNotification,
  saveNotification,
  getMyNotifications,
  getSingleNotificationFromDB,
};
