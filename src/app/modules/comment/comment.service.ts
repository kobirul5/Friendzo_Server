
import httpStatus from 'http-status';
import prisma from '../../../shared/prisma';
import ApiError from '../../../errors/ApiErrors';
import { INotificationPayload, notificationServices } from '../notification/notification.service';


const createCommentService = async (
  content: string,
  userId: string,
  memoryId: string
) => {

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found.');
  }

  const memory = await prisma.memory.findUnique({ where: { id: memoryId }, include: { user: true } });

  if (!memory) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Memory not found.');
  }

  const comment = await prisma.comment.create({
    data: {
      content,
      userId,
      memoryId,
    },
  });


  const notifPayload: INotificationPayload = {
    title: "New Comment",
    message: `${user?.firstName + " " + user?.lastName || "Someone"} commented on your memory`,
    type: 'COMMENT',
    senderId: userId,
    receiverId: memory.userId,
    targetId: memoryId,
    targetType: "MEMORY",
    followStatus: 'REJECTED',
  };

  // notification save db
  await notificationServices.saveNotification(notifPayload, memory.userId);

  //  push notification 
  if (memory.user.fcmToken) {
    await notificationServices.sendNotification(
      memory.user.fcmToken,
      notifPayload,
      memory.userId
    );
  }

  return comment;
};

const getCommentsByMemoryService = async (memoryId: string) => {

  const memory = await prisma.memory.findUnique({ where: { id: memoryId } });

  if (!memory) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Memory not found.');
  }

  const comments = await prisma.comment.findMany({
    where: { memoryId },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          profileImage: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return comments;
};



const deleteCommentService = async (commentId: string, userId: string) => {
  // Check if comment exists
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
  });

  if (!comment) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Comment not found.');
  }

  if (comment.userId !== userId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'You are not authorized. You cannot delete this comment.');
  }

  // Delete comment
  const deletedComment = await prisma.comment.delete({
    where: { id: commentId },
  });

  return deletedComment;
};

export const commentService = {
createCommentService,
getCommentsByMemoryService,
deleteCommentService,
};