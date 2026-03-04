import { UserRole, UserStatus } from "@prisma/client";

export interface IUser {
  id?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  referralCode?: string;
  phoneNumber?: string;
  fcmToken?: string;
  profileImage?: string;
  role: UserRole;
  status: UserStatus;
  isVerified?: boolean;
  otp?: number;
  expirationOtp?: Date;
  gender?: string;
  dob?: Date;
  lat?: number;
  lng?: number;
  isNotificationOn?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
