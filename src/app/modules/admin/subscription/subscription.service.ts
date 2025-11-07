import httpStatus from "http-status";
import prisma from "../../../../shared/prisma";
import ApiError from "../../../../errors/ApiErrors";
import { UserRole } from "@prisma/client";
import {
  INotificationPayload,
  notificationServices,
} from "../../notification/notification.service";
import stripe from "../../../../shared/stripe";
import { ObjectId } from "mongodb";

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
        mode: "insensitive", // case-insensitive comparison
      },
    },
  });

  if (existingPlan.length > 0) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "A subscription plan with this name already exists"
    );
  }

  const {
    name,
    subtitle,
    discount,
    price,
    currency = "USD",
    interval = "MONTH",
    trialDays,
    features,
  } = data;

  if (interval !== "MONTH" && interval !== "YEAR") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Interval must be either 'MONTH' or 'YEAR'"
    );
  }

  const plan = await prisma.subscriptionPlan.create({
    data: {
      name,
      price,
      currency,
      interval,
      trialDays,
      features,
      subtitle,
      discount,
    },
  });

  return plan;
};

const getSubscriptionPlanList = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found!");

  const result = await prisma.subscriptionPlan.findMany();

  return result;
};

const updateSubscriptionPlan = async (data: any, userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found!");

  // if (user.role !== UserRole.ADMIN  && user.role !== UserRole.MANAGER) {
  //   throw new ApiError(httpStatus.FORBIDDEN, "You don't have permission to update a subscription plan");
  // }

  const {
    id,
    name,
    price,
    currency,
    interval,
    trialDays,
    features,
    subtitle,
    discount,
  } = data;

  const existingPlan = await prisma.subscriptionPlan.findUnique({
    where: { id },
  });
  if (!existingPlan)
    throw new ApiError(httpStatus.NOT_FOUND, "Subscription plan not found");

  if (name && name !== existingPlan.name) {
    const duplicatePlan = await prisma.subscriptionPlan.findMany({
      where: {
        name: {
          equals: name,
          mode: "insensitive", // case-insensitive comparison
        },
        id: { not: id }, // Exclude the current plan
      },
    });

    if (duplicatePlan.length > 0) {
      throw new ApiError(
        httpStatus.CONFLICT,
        "A subscription plan with this name already exists"
      );
    }
  }

  // Validate features: only accept key, value, isActive
  // let sanitizedFeatures;
  // if (features && Array.isArray(features)) {
  //   sanitizedFeatures = features.map(f => ({
  //     key: f.key,
  //     value: f.value,
  //     isActive: !!f.isActive, // force boolean
  //   }));
  // }

  const updatedPlan = await prisma.subscriptionPlan.update({
    where: { id },
    data: { name, price, currency, interval, trialDays, features, subtitle, discount },
  });

  return updatedPlan;
};

const deleteSubscriptionPlan = async (id: string, userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found!");

  // if (user.role !== UserRole.ADMIN  && user.role !== UserRole.MANAGER) {
  //   throw new ApiError(httpStatus.FORBIDDEN, "You don't have permission to delete a subscription plan");
  // }

  const existingPlan = await prisma.subscriptionPlan.findUnique({
    where: { id },
  });
  if (!existingPlan)
    throw new ApiError(httpStatus.NOT_FOUND, "Subscription plan not found");

  await prisma.subscriptionPlan.delete({ where: { id } });

  return;
};

// const purchaseSubscription = async (data: any, userId: string) => {
//   const user = await prisma.user.findUnique({ where: { id: userId } });
//   if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found!");

//   const { planId, paymentMethod } = data;

//   const plan = await prisma.subscriptionPlan.findUnique({
//     where: { id: planId },
//   });
//   if (!plan)
//     throw new ApiError(httpStatus.NOT_FOUND, "Subscription plan not found");

//   // Generate transaction ID
//   const transactionId = `sub_${Date.now()}`;

//   const amountInCents = Math.round(plan.price * 100); // 5.5 → 550

//   try {
//     // Create Stripe PaymentIntent
//     const paymentIntent = await stripe.paymentIntents.create({
//       amount: amountInCents,
//       currency: plan.currency,
//       payment_method: paymentMethod,
//       confirm: true,
//       automatic_payment_methods: { enabled: true, allow_redirects: "never" },
//       metadata: {
//         transactionId,
//         planId,
//         userId,
//         amount: plan.price.toString(),
//       },
//     });

//     if (paymentIntent.status !== "succeeded") {
//       throw new ApiError(
//         httpStatus.BAD_REQUEST,
//         "Payment failed. Please try again."
//       );
//     }

//     // Payment succeeded → create subscription
//     const subscription = await prisma.$transaction(async (tx) => {
//       // Create payment record
//       const payment = await tx.payment.create({
//         data: {
//           transactionId,
//           amount: plan.price, // convert back to float
//           status: "COMPLETED",
//           senderId: userId,
//           method: "CARD",
//           paymentMethodId: paymentIntent.payment_method as string,
//         },
//       });

//       // Create subscription
//       const newSubscription = await tx.subscription.create({
//         data: {
//           userId,
//           planId,
//           startedAt: new Date(),
//           amount: plan.price,
//           endedAt: new Date(
//             new Date().setMonth(
//               new Date().getMonth() + (plan.interval === "MONTH" ? 1 : 12)
//             )
//           ),
//           status: "ACTIVE",
//         },
//       });

//       type Feature = { key: string; value: string; isActive: boolean };

//       // features safe cast
//       const featuresArray: Feature[] = Array.isArray(plan.features)
//         ? (plan.features as Feature[])
//         : [];

//       // find aiMessage feature
//       const aiFeature = Array.isArray(featuresArray)
//         ? featuresArray.find((f) => f?.key === "aiMessage" && f?.isActive)
//         : undefined;

//       console.log("AI Feature:", aiFeature);

//       if (aiFeature && aiFeature.value) {
//         // only update if value exists
//         await tx.user.update({
//           where: { id: userId },
//           data: {
//             aiMessage: {
//               increment: parseInt(aiFeature.value),
//             },
//           },
//         });
//       } else {
//         console.log("No aiMessage feature found, skipping update.");
//       }

//       // Notification payload
//       const notifPayload: INotificationPayload = {
//         title: "Subscription Purchased",
//         message: `You have successfully purchased the ${plan.name} plan!`,
//         type: "PURCHASE",
//         senderId: userId,
//         receiverId: userId,
//         targetId: transactionId,
//         targetType: "SUBSCRIPTION",
//         followStatus: "REJECTED",
//       };

//       // Save notification
//       await notificationServices.saveNotification(notifPayload, userId);

//       // Push notification if user has token
//       if (user.fcmToken) {
//         await notificationServices.sendNotification(
//           user.fcmToken,
//           notifPayload,
//           userId
//         );
//       }

//       return newSubscription;
//     });

//     return { ...subscription, planDetails: plan };
//   } catch (error: any) {
//     console.error("Subscription purchase error:", error);
//     throw new ApiError(
//       httpStatus.BAD_REQUEST,
//       error.message || "Subscription purchase failed"
//     );
//   }
// };

const featureFieldMap: Record<string, string> = {
  aiMessage: "aiMessage",
  boost: "boosts",
  coin: "totalCoins",
  priorityLikes: "priorityLikes",
};
 const purchaseSubscription = async (data: any, userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found!");

  const { planId, paymentMethod } = data;

  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: planId },
  });
  if (!plan)
    throw new ApiError(httpStatus.NOT_FOUND, "Subscription plan not found");

  // Generate transaction ID
  const transactionId = `sub_${Date.now()}`;
  const amountInCents = Math.round(plan.price * 100);

  try {
    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: plan.currency,
      payment_method: paymentMethod,
      confirm: true,
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
      metadata: {
        transactionId,
        planId,
        userId,
        amount: plan.price.toString(),
      },
    });

    if (paymentIntent.status !== "succeeded") {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Payment failed. Please try again."
      );
    }

    // Payment succeeded → create subscription & update features
    const subscription = await prisma.$transaction(async (tx) => {
      // Create payment record
      await tx.payment.create({
        data: {
          transactionId,
          amount: plan.price,
          status: "COMPLETED",
          senderId: userId,
          method: "CARD",
          paymentMethodId: paymentIntent.payment_method as string,
        },
      });

      // Create subscription
      const newSubscription = await tx.subscription.create({
        data: {
          userId,
          planId,
          startedAt: new Date(),
          amount: plan.price,
          endedAt: new Date(
            new Date().setMonth(
              new Date().getMonth() + (plan.interval === "MONTH" ? 1 : 12)
            )
          ),
          status: "ACTIVE",
        },
      });

      // Handle plan features (safe check if key missing)
      const featuresArray: any[] = Array.isArray(plan.features)
        ? plan.features
        : [];

      for (const feature of featuresArray) {
        if (feature?.isActive && feature?.value) {
          const userField = featureFieldMap[feature.key];
          if (!userField) {
            console.log(`⚠️ Feature key "${feature.key}" not mapped, skipping`);
            continue;
          }

          console.log(userField);

          const incrementValue =
            userField === "totalCoins"
              ? parseFloat(feature.value)
              : parseInt(feature.value, 10);

          await tx.user.update({
            where: { id: userId },
            data: { [userField]: { increment: incrementValue } },
          });

          console.log(`✅ ${feature.key} incremented by ${incrementValue}`);
        }
      }

      // Send notification
      const notifPayload: INotificationPayload = {
        title: "Subscription Purchased",
        message: `You have successfully purchased the ${plan.name} plan!`,
        type: "PURCHASE",
        senderId: userId,
        receiverId: userId,
        targetId: transactionId,
        targetType: "SUBSCRIPTION",
        followStatus: "REJECTED",
      };

      await notificationServices.saveNotification(notifPayload, userId);

      if (user.fcmToken) {
        await notificationServices.sendNotification(
          user.fcmToken,
          notifPayload,
          userId
        );
      }

      return newSubscription;
    });

    return { ...subscription, planDetails: plan };
  } catch (error: any) {
    console.error("Subscription purchase error:", error);
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      error.message || "Subscription purchase failed"
    );
  }
};
const purchaseSubscriptionStatic = async (data: any, userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found!");

  const { planName, planPrice } = data;

  // const plan = await prisma.subscriptionPlan.findUnique({
  //   where: { id: planId },
  // });
  // if (!plan)
  //   throw new ApiError(httpStatus.NOT_FOUND, "Subscription plan not found");

  // Generate transaction ID
  const transactionId = `sub_${Date.now()}`;

  // Define static feature values based on plan
  let bootsValue = 0;
  let priorityLikesValue = 0;
  let aiMessageValue = 0;
  let coinValue = 0;


  switch (planName.toLowerCase()) {
    case "plan1":
      bootsValue = 15;
      priorityLikesValue = 15;
      break;
    case "plan2":
      bootsValue = 25;
      priorityLikesValue = 25;
      aiMessageValue = 20;
      coinValue = 100;
      break;
    case "plan3":
      bootsValue = 30;
      priorityLikesValue = 30;
      aiMessageValue = 30;
      coinValue = 200;
      break;
    default:
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid plan type, please choose plan1, plan2, or plan3.");
  }

  // Create subscription & update features
  const subscription = await prisma.$transaction(async (tx) => {
    // Create payment record
    await tx.payment.create({
      data: {
        transactionId,
        amount: planPrice,
        status: "COMPLETED",
        senderId: userId,
        method: "BANK_TRANSFER",
        paymentMethodId: "",
      },
    });

    // Create subscription
    const newSubscription = await tx.subscription.create({
      data: {
        userId,
 // No specific plan ID for static plans
        startedAt: new Date(),
        amount: planPrice,
        status: "ACTIVE",
      },
    });

    // Update user's static subscription features
    await tx.user.update({
      where: { id: userId },
      data: {
        boost: { increment: bootsValue },
        priorityLikes: { increment: priorityLikesValue },
        aiMessage: { increment: aiMessageValue },
        totalCoins: { increment: coinValue },
      },
    });

    // (Optional) Send notification
    // const notifPayload: INotificationPayload = {
    //   title: "Subscription Purchased",
    //   message: `You have successfully purchased the ${plan.name} plan!`,
    //   type: "PURCHASE",
    //   senderId: userId,
    //   receiverId: userId,
    //   targetId: transactionId,
    //   targetType: "SUBSCRIPTION",
    //   followStatus: "REJECTED",
    // };
    // await notificationServices.saveNotification(notifPayload, userId);
    // if (user.fcmToken) {
    //   await notificationServices.sendNotification(
    //     user.fcmToken,
    //     notifPayload,
    //     userId
    //   );
    // }

    return newSubscription;
  });

  const userPlanDetails =  await prisma.user.findFirst({
    where: { id: userId },
    select: {
      boost: true,
      priorityLikes: true,
      aiMessage: true,
      totalCoins: true,
    },
  });


  return { ...subscription, planDetails: userPlanDetails };
};


// const getUserSubscriptions = async (userId: string) => {
//   // check user first
//   const user = await prisma.user.findUnique({ where: { id: userId } });
//   if (!user) {
//     throw new ApiError(httpStatus.NOT_FOUND, "User not found!");
//   }

//   // Fetch directly from MongoDB to avoid Prisma type enforcement
//   const raw = await prisma.$runCommandRaw({
//     find: "Subscription",
//     filter: { userId: new ObjectId(userId) },
//     sort: { startedAt: -1 },
//   });

//   // Normalize amount field to always be a number
//   let subscriptions: any[] = [];
//   if (
//     raw &&
//     typeof raw === "object" &&
//     raw.cursor &&
//     typeof raw.cursor === "object" &&
//     Array.isArray((raw.cursor as any).firstBatch)
//   ) {
//     subscriptions = (raw.cursor as any).firstBatch.map((sub: any) => ({
//       ...sub,
//       amount: sub.amount ?? 0, // replace null/undefined with 0
//     }));
//   }

//   return subscriptions;
// };

const getUserSubscriptions = async (userId: string) => {
  // check user first
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found!");
  }

  const subscriptions = await prisma.subscription.findMany({
    where: { userId },
    orderBy: { startedAt: "desc" },
    select: {
      id: true,
      planId: true,
      startedAt: true,
      endedAt: true,
      status: true,
      amount: true,
      plan: true,
    },
  });

  return subscriptions;
};

export const subscriptionService = {
  getSubscriptionPlanList,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
  //subscription
  purchaseSubscription,
  getUserSubscriptions,
  purchaseSubscriptionStatic
};
