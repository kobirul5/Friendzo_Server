import httpStatus from "http-status";
import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import { getTransactionId } from "../../../helpars/getTransactionId";
import stripe from "../../../shared/stripe";
import { PaymentStatus } from "@prisma/client";

const createCoinPurchase = async ({
  paymentMethod,
  coinId,
  userId,
  currency = "USD",
}: {
  paymentMethod: string;
  coinId: string;
  userId: string;
  currency?: string;
}) => {
  const transactionId = getTransactionId();

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const coinPackage = await prisma.coins.findUnique({
    where: { id: coinId },
  });

  if (!coinPackage) {
    throw new ApiError(httpStatus.NOT_FOUND, "Coin package not found");
  }

  try {
    // Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(coinPackage.price * 100), // cents
      currency,
      payment_method: paymentMethod,
      confirm: true,
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
      metadata: {
        transactionId,
        coinId,
        userId,
        coinAmount: coinPackage.coinAmount,
        amount: coinPackage.price.toString(),
      },
    });

    // Final transaction

    if (paymentIntent.status !== "succeeded") {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Payment failed. Please try again."
      );
    }


    const result = await prisma.$transaction(async (tx) => {
      // Create payment record
      const payment = await tx.payment.create({
        data: {
          transactionId,
          amount: coinPackage.price,
          status: PaymentStatus.COMPLETED,
          senderId: userId,
          method: "CARD",
          paymentMethodId: paymentIntent.payment_method as string,
        },
      });

      // Update user coin balance
      await tx.user.update({
        where: { id: userId },
        data: {
        totalCoins: {
            increment: parseInt(coinPackage.coinAmount),
          },
        },
      });

      return payment;
    });

    return result;
  } catch (error: any) {
    console.error("Coin purchase error:", error);
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      error.message || "Coin purchase failed"
    );
  }
};

export const paymentsService = {
  createCoinPurchase,
};
