import { UserRole } from "@prisma/client";
import prisma from "../../shared/prisma";
import * as bcrypt from "bcrypt";
import config from "../../config";
import { getRefferId } from "../../helpars/generateRefferId";


export const initiateSuperAdmin = async () => {
  try {
    const hashedPassword = await bcrypt.hash(
      '123456789',
      Number(config.bcrypt_salt_rounds)
    );
 
    // Generate unique referral code using getRefferId()
    let referralCode = getRefferId();
    // Check if referral code exists
    const existingRef = await prisma.user.findFirst({
      where: { referralCode }
    });
    if (existingRef) {
      referralCode = getRefferId();
    }
 
    const payload: any = {
      email: "admin@gmail.com",
      password: hashedPassword,
      role: UserRole.ADMIN,
      lat: 23.8103,
      lng: 90.4125,
      referralCode,
    };
 
    const isExistUser = await prisma.user.findFirst({
      where: { email: payload.email },
    });
 
    if (isExistUser) return;
 
    await prisma.user.create({
      data: payload,
    });
    console.log("✅ Super admin created successfully!");
  } catch (error) {
    console.error("❌ Super admin init failed:", error);
  }
};