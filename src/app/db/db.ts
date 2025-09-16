import { UserRole } from "@prisma/client";
import prisma from "../../shared/prisma";
import * as bcrypt from "bcrypt";
import config from "../../config";
import { getRefferId } from "../../helpars/generateRefferId";


export const initiateSuperAdmin = async () => {
  const hashedPassword = await bcrypt.hash(
    '123456789',
    Number(config.bcrypt_salt_rounds)
  );

  // Generate unique referral code using getRefferId()
  let referralCode = getRefferId();
  while (await prisma.user.findUnique({ where: { referralCode } })) {
    referralCode = getRefferId();
  }

  const payload: any = {
    email: "admin@gmail.com",
    password: hashedPassword,
    role: UserRole.ADMIN,
    lat: 23.8103,
    lng: 90.4125,
    referralCode, // <-- attach unique referral code
  };

  const isExistUser = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (isExistUser) return;

  await prisma.user.create({
    data: payload,
  });
};
