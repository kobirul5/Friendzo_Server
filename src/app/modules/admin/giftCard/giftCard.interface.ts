import { GiftCategory } from "@prisma/client";


export type GiftCardType = GiftCategory | "ALL";

export interface IGetGiftCardList {
  userId: string;
  type?: GiftCardType; // optional
}