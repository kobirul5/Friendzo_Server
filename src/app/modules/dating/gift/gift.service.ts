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
    gender = Gender.EVERYONE;
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
      status: "ACTIVE",
    },
    orderBy: { createdAt: "desc" },
  });

  const Exclusive = await prisma.giftCard.findMany({
    where: {
      gender: gender,
      category: GiftCategory.EXCLUSIVE,
      status: "ACTIVE",
    },
    orderBy: { createdAt: "desc" },
  });

  const Majestic = await prisma.giftCard.findMany({
    where: {
      gender: gender,
      category: GiftCategory.MAJESTIC,
      status: "ACTIVE",
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


const sendGiftToFriends = async ({
  senderId,
  receiverIds,
  giftCardId,
}: SendGiftInput) => {
  const result = await prisma.$transaction(async (tx) => {
    const sender = await tx.user.findUnique({
      where: { id: senderId },
      select: { firstName: true, lastName: true },
    });
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
              name: true,
              category: true,
  
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
        title: `Send you an ${giftCategory} ${giftPopup?.giftCard.name ? giftPopup?.giftCard.name : ""} gift`,
        message: `You received a ${giftCategory} gift from ${sender?.firstName} ${sender?.lastName}!`,
        type: "GIFT",
        image: giftPopup?.giftCard?.image || "",
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

// sendMultipleGifts
const sendMultipleGifts = async ({
  senderId,
  receiverId,
  giftCardIds, // array of giftCardId
}: any) => {
  const user = await prisma.user.findUnique({ where: { id: senderId } });

  const result = await prisma.$transaction(async (tx) => {
    if (!giftCardIds || giftCardIds.length === 0) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No gifts selected to send");
    }

    // 1. Check if receiver exists
    const receiver = await tx.user.findUnique({
      where: { id: receiverId },
      select: { id: true, firstName: true, lastName: true, fcmToken: true },
    });

    if (!receiver) {
      throw new ApiError(httpStatus.NOT_FOUND, "Receiver not found");
    }

    // 2. Check if sender has enough purchased gifts for each giftCardId
    const purchasedGifts = await tx.giftPurchase.findMany({
      where: {
        userId: senderId,
        giftCardId: { in: giftCardIds },
      },
      select: { id: true, giftCardId: true, giftCategory: true , giftCard:{
        select:{
          image:true
        }
      }},
    });

    if (purchasedGifts.length < giftCardIds.length) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Not enough purchased gifts to send"
      );
    }

    // Match gifts by giftCardId (1 gift for each giftCardId)
    const selectedGifts: any[] = [];
    const usedGiftIds = new Set<string>();

    for (const gcId of giftCardIds) {
      const gift = purchasedGifts.find(
        (g) => g.giftCardId === gcId && !usedGiftIds.has(g.id)
      );

      if (!gift) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          `You don't have the gift for giftCardId: ${gcId}`
        );
      }

      usedGiftIds.add(gift.id);
      selectedGifts.push(gift);
    }

    // 3. Delete selected gifts from purchase
    await tx.giftPurchase.deleteMany({
      where: { id: { in: selectedGifts.map((g) => g.id) } },
    });

    let image: string  = ""
    // 4. Send all gifts to receiver
    for (const gift of selectedGifts) {
      const giftSend = await tx.giftSend.create({
        data: {
          senderId,
          receiverId,
          giftCardId: gift.giftCardId,
          giftCategory: gift.giftCategory,
        },
        select: {
          id: true,
          giftCard: {
            select: {
              image: true,
              name: true,
              category: true,
            },
          },
        },
      });

      image = giftSend?.giftCard?.image || ""
      // Popup info
      const giftPopup = await tx.giftCard.findUnique({
        where: { id: gift.giftCardId },
        select: { image: true },
      });

      await tx.gitPopUp.create({
        data: {
          senderId,
          receiverId,
          giftImage: giftPopup?.image || "",
          type: "GIFT",
          isSeen: false,
        },
      });
    
    
    
    
      const notifPayload: INotificationPayload = {
        title: `Send you an ${gift.giftCategory} ${gift.giftCard.name ? gift.giftCard.name : ""} gift`,
        message: `You received a ${gift.giftCategory} gift from ${user?.firstName} ${user?.lastName}!`,
        type: "GIFT",
        image: purchasedGifts[0].giftCard.image,
        senderId,
        receiverId,
        followStatus: "REJECTED",
      };
  
      // Save notification
      await notificationServices.saveNotification(notifPayload, receiver.id);
  
      // Push notification
      if (receiver.fcmToken) {
        await notificationServices.sendNotification(
          receiver.fcmToken,
          notifPayload,
          receiver.id
        );
      }
    }

    // 5. Notification

    return { message: "Gifts sent successfully!" };
  });

  return result;
};

export const giftService = {
  buyGiftCard,
  getGiftCardList,
  getMyPurchasesAndReceivedGifts,
  sendGiftToFriends,
  sendMultipleGifts,
};

