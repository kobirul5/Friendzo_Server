import httpStatus from "http-status";
import prisma from "../../../../shared/prisma";
import ApiError from "../../../../errors/ApiErrors";
import { Gender, GiftCategory } from "@prisma/client";
import {
  INotificationPayload,
  notificationServices,
} from "../../notification/notification.service";

const buyGiftCard = async ({ data, userId }: any) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found!");

  if (
    data.giftCategory !== GiftCategory.ESSENTIAL &&
    data.giftCategory !== GiftCategory.EXCLUSIVE &&
    data.giftCategory !== GiftCategory.MAJESTIC
  ) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Invalid category. category must be one of: ESSENTIAL, EXCLUSIVE, MAJESTIC"
    );
  }

  const giftCard = await prisma.giftCard.findUnique({
    where: { id: data.giftCardId, category: data.giftCategory },
  });
  if (!giftCard)
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "GiftCard not found! With this Id and giftCategory"
    );

  if (user.totalCoins < giftCard.price)
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You don't have enough coins to buy this gift card!"
    );

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      totalCoins: user.totalCoins - giftCard.price,
    },
  });

  const result = await prisma.giftPurchase.create({
    data: {
      userId: user.id,
      giftCardId: giftCard.id,
      giftCategory: giftCard.category,
    },
    select: {
      giftCard: true,
    },
  });

  // -----------------------------
  // Notification
  // -----------------------------
  const notifPayload: INotificationPayload = {
    title: "Gift Card Purchased!",
    message: `You successfully purchased a ${giftCard.category} gift card!`,
    type: "PURCHASE",
    senderId: userId,
    receiverId: userId, // self notification
    targetId: result.giftCard.id,
    targetType: "GIFT_CARD",
    followStatus: "REJECTED",
  };

  // Save notification to DB
  await notificationServices.saveNotification(notifPayload, userId);

  // Push notification if token exists
  if (updatedUser.fcmToken) {
    await notificationServices.sendNotification(
      updatedUser.fcmToken,
      notifPayload,
      userId
    );
  }

  return result;
};

const getGiftCardList = async ({
  userId,
  gender,
}: {
  userId: string;
  gender: Gender;
}) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user)
    throw new ApiError(httpStatus.NOT_FOUND, "Unauthorized!, User not found!");
  if (!gender) {
    gender = (user.interestedGender as Gender) || Gender.EVERYONE;
  }

  if (
    gender !== Gender.HIM &&
    gender !== Gender.HER &&
    gender !== Gender.EVERYONE
  )
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Invalid gender. gender must be one of: HIM, HER, EVERYONE"
    );

  const Essential = await prisma.giftCard.findMany({
    where: {
      gender: gender,
      category: GiftCategory.ESSENTIAL,
    },
    orderBy: { createdAt: "desc" },
  });

  const Exclusive = await prisma.giftCard.findMany({
    where: {
      gender: gender,
      category: GiftCategory.EXCLUSIVE,
    },
    orderBy: { createdAt: "desc" },
  });

  const Majestic = await prisma.giftCard.findMany({
    where: {
      gender: gender,
      category: GiftCategory.MAJESTIC,
    },
    orderBy: { createdAt: "desc" },
  });

  const result = {
    Essential,
    Exclusive,
    Majestic,
  };

  return result;
};

// get my purchases and received gifts

// const getMyPurchasesAndReceivedGifts = async (userId: string) => {
//   // 1. Purchases groupBy
//   const purchases = await prisma.giftPurchase.groupBy({
//     by: ["giftCardId"],
//     where: { userId },
//     _count: { giftCardId: true },
//   });

//   // Purchases giftCard details
//   const purchaseGiftCards = await prisma.giftCard.findMany({
//     where: { id: { in: purchases.map((p) => p.giftCardId) } },
//   });

//   const purchasesData = purchases.map((p) => {
//     const giftCard = purchaseGiftCards.find((gc) => gc.id === p.giftCardId);
//     return {
//       giftCardId: p.giftCardId,
//       count: p._count.giftCardId,
//       giftCard,
//     };
//   });

//   // 2. Received groupBy
//   const received = await prisma.giftSend.groupBy({
//     by: ["giftCardId"],
//     where: { receiverId: userId },
//     _count: { giftCardId: true },
//   });

//   // Received giftCard details
//   const receivedGiftCards = await prisma.giftCard.findMany({
//     where: { id: { in: received.map((r) => r.giftCardId) } },
//   });

//   const receivedData = received.map((r) => {
//     const giftCard = receivedGiftCards.find((gc) => gc.id === r.giftCardId);
//     return {
//       giftCardId: r.giftCardId,
//       count: r._count.giftCardId,
//       giftCard,
//     };
//   });

//   // 3. Final response
//   return{
//      purchases: purchasesData,
//       received: receivedData,
//   }
// };

const getMyPurchasesAndReceivedGifts = async (userId: string) => {
  // 1️⃣ Purchases groupBy
  const purchases = await prisma.giftPurchase.groupBy({
    by: ["giftCardId"],
    where: { userId },
    _count: { giftCardId: true },
  });

  // Purchases giftCard details
  const purchaseGiftCards = await prisma.giftCard.findMany({
    where: { id: { in: purchases.map((p) => p.giftCardId) } },
  });

  const purchasesData = purchases.map((p) => {
    const giftCard = purchaseGiftCards.find((gc) => gc.id === p.giftCardId);
    return {
      ...giftCard,
      count: p._count.giftCardId,
    };
  });

  // Group by category
  const purchasesByCategory = purchasesData.reduce((acc: any, item) => {
    const category = item.category || "UNKNOWN";
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {});

  // 2️⃣ Received gifts groupBy
  const received = await prisma.giftSend.groupBy({
    by: ["giftCardId"],
    where: { receiverId: userId },
    _count: { giftCardId: true },
  });

  const receivedGiftCards = await prisma.giftCard.findMany({
    where: { id: { in: received.map((r) => r.giftCardId) } },
  });

  const receivedData = received.map((r) => {
    const giftCard = receivedGiftCards.find((gc) => gc.id === r.giftCardId);
    return {
      ...giftCard,
      count: r._count.giftCardId,
    };
  });

  const receivedByCategory = receivedData.reduce((acc: any, item) => {
    const category = item.category || "UNKNOWN";
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {});

  // 3️⃣ Final response
  return {
    purchases: purchasesByCategory,
    received: receivedByCategory,
  };
};

// Send gift for my friends

interface SendGiftInput {
  senderId: string;
  receiverIds: string[]; // multiple friends
  giftCardId: string;
}

//  const sendGiftToFriends = async ({
//   senderId,
//   receiverIds,
//   giftCardId,
// }: SendGiftInput) => {
//  const result = await prisma.$transaction(async (tx) => {
//     // 1. Check if sender has enough gifts
//     const purchasedCount = await tx.giftPurchase.count({
//       where: { userId: senderId, giftCardId },
//     });

//     if (purchasedCount < receiverIds.length) {
//       throw new ApiError(httpStatus.BAD_REQUEST, "Not enough gifts purchased to send");
//     }

//     if(receiverIds.length === 0){
//       throw new ApiError(httpStatus.BAD_REQUEST,"No friends selected to send gift");
//     }

//     receiverIds.forEach(async (id) => {
//       const user = await prisma.user.findUnique({ where: { id } });
//       console.log(user);
//       if (!user) throw new ApiError(httpStatus.NOT_FOUND, `receiver not found! with id: ${id}`);
//     });

//     // 2. Pick gifts to delete
//     const giftsToDelete = await tx.giftPurchase.findMany({
//       where: { userId: senderId, giftCardId },
//       take: receiverIds.length,
//       select: { id: true, giftCategory: true },
//     });

//     if (giftsToDelete.length < receiverIds.length) {
//       throw new ApiError(httpStatus.BAD_REQUEST,"Not enough gifts available to send.");
//     }

//     // 3. Delete from purchases
//     await tx.giftPurchase.deleteMany({
//       where: { id: { in: giftsToDelete.map((g) => g.id) } },
//     });

//     // 4. Create GiftSend records for each receiver
//     const giftSends = receiverIds.map((receiverId, i) =>
//       tx.giftSend.create({
//         data: {
//           senderId,
//           receiverId,
//           giftCardId,
//           giftCategory: giftsToDelete[i].giftCategory, // same category
//         },
//       })
//     );

//     await Promise.all(giftSends);

//     return { message: "Gifts sent successfully!" };
//   });

//   return result
// };

const sendGiftToFriends = async ({
  senderId,
  receiverIds,
  giftCardId,
}: SendGiftInput) => {
  const result = await prisma.$transaction(async (tx) => {
    // 1. Check if sender has enough gifts
    const purchasedCount = await tx.giftPurchase.count({
      where: { userId: senderId, giftCardId },
    });

    if (purchasedCount < receiverIds.length) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Not enough gifts purchased to send"
      );
    }

    if (receiverIds.length === 0) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "No friends selected to send gift"
      );
    }

    // 2. Verify all receivers exist
    const receiverUsers = await prisma.user.findMany({
      where: { id: { in: receiverIds } },
      select: { id: true, firstName: true, lastName: true, fcmToken: true },
    });

    if (receiverUsers.length !== receiverIds.length) {
      const foundIds = receiverUsers.map((u) => u.id);
      const missing = receiverIds.filter((id) => !foundIds.includes(id));
      throw new ApiError(
        httpStatus.NOT_FOUND,
        `Receiver(s) not found: ${missing.join(", ")}`
      );
    }

    // 3. Pick gifts to delete
    const giftsToDelete = await tx.giftPurchase.findMany({
      where: { userId: senderId, giftCardId },
      take: receiverIds.length,
      select: { id: true, giftCategory: true },
    });

    if (giftsToDelete.length < receiverIds.length) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Not enough gifts available to send."
      );
    }

    // 4. Delete from purchases
    await tx.giftPurchase.deleteMany({
      where: { id: { in: giftsToDelete.map((g) => g.id) } },
    });

    // 5. Create GiftSend records & notifications for each receiver
    for (let i = 0; i < receiverUsers.length; i++) {
      const receiver = receiverUsers[i];
      const giftCategory = giftsToDelete[i].giftCategory;

      // Create GiftSend record
      await tx.giftSend.create({
        data: {
          senderId,
          receiverId: receiver.id,
          giftCardId,
          giftCategory,
        },
      });

      // -----------------------------
      // Popup
      // -----------------------------
      const giftPopup = await tx.giftPurchase.findFirst({
        where: {
          userId: senderId,
          giftCardId,
        },
        include: {
          giftCard: {
            select: {
              image: true,
            },
          },
        },
      });
      await tx.gitPopUp.create({
        data: {
          senderId,
          receiverId: receiver.id,
          giftImage: giftPopup?.giftCard?.image || "",
          type: "GIFT",
          isSeen: false, // default false (to show popup once)
        },
      });

      // -----------------------------
      // Notification
      // -----------------------------
      const notifPayload: INotificationPayload = {
        title: "You received a gift!",
        message: `${
          receiver.firstName || "Someone"
        } received a ${giftCategory} gift from a friend!`,
        type: "GIFT",
        senderId,
        receiverId: receiver.id,
        followStatus: "REJECTED",
      };

      // Save to DB
      await notificationServices.saveNotification(notifPayload, receiver.id);

      // Push notification if token exists
      if (receiver.fcmToken) {
        await notificationServices.sendNotification(
          receiver.fcmToken,
          notifPayload,
          receiver.id
        );
      }
    }

    return { message: "Gifts sent successfully!" };
  });

  return result;
};

export const giftService = {
  buyGiftCard,
  getGiftCardList,
  getMyPurchasesAndReceivedGifts,
  sendGiftToFriends,
};

// const sendGiftToFriends = async ({
//   senderId,
//   receiverIds,
//   giftCardId,
// }: SendGiftInput) => {
//   return await prisma.$transaction(async (tx) => {
//     const totalNeeded = receiverIds.length;

//     // 1. Count available in purchases
//     const purchasedCount = await tx.giftPurchase.count({
//       where: { userId: senderId, giftCardId },
//     });

//     // 2. Count available in received
//     const receivedCount = await tx.giftSend.count({
//       where: { receiverId: senderId, giftCardId },
//     });

//     const totalAvailable = purchasedCount + receivedCount;

//     if (totalAvailable < totalNeeded) {
//       throw new Error("Not enough gifts (purchase + received) to send");
//     }

//     let giftsToDelete: { id: string; giftCategory: any; source: "purchase" | "received" }[] = [];

//     // 3. Take from purchases first
//     if (purchasedCount > 0) {
//       const purchaseDelete = await tx.giftPurchase.findMany({
//         where: { userId: senderId, giftCardId },
//         take: Math.min(totalNeeded, purchasedCount),
//         select: { id: true, giftCategory: true },
//       });

//       giftsToDelete.push(
//         ...purchaseDelete.map((g) => ({ ...g, source: "purchase" as const }))
//       );
//     }

//     // 4. If still need more, take from received
//     if (giftsToDelete.length < totalNeeded) {
//       const remain = totalNeeded - giftsToDelete.length;

//       const receivedDelete = await tx.giftSend.findMany({
//         where: { receiverId: senderId, giftCardId },
//         take: remain,
//         select: { id: true, giftCategory: true },
//       });

//       giftsToDelete.push(
//         ...receivedDelete.map((g) => ({ ...g, source: "received" as const }))
//       );
//     }

//     // 5. Delete from both sources
//     const purchaseIds = giftsToDelete.filter((g) => g.source === "purchase").map((g) => g.id);
//     const receivedIds = giftsToDelete.filter((g) => g.source === "received").map((g) => g.id);

//     if (purchaseIds.length > 0) {
//       await tx.giftPurchase.deleteMany({ where: { id: { in: purchaseIds } } });
//     }
//     if (receivedIds.length > 0) {
//       await tx.giftSend.deleteMany({ where: { id: { in: receivedIds } } });
//     }

//     // 6. Create GiftSend for receivers
//     const giftSends = receiverIds.map((receiverId, i) =>
//       tx.giftSend.create({
//         data: {
//           senderId,
//           receiverId,
//           giftCardId,
//           giftCategory: giftsToDelete[i].giftCategory,
//         },
//       })
//     );

//     await Promise.all(giftSends);

//     return { message: "Gifts sent successfully!" };
//   });
// };
