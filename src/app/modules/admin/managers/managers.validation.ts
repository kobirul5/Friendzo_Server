import { z } from "zod";

const baseAccessList = [
  "dashboardView",
  "allUserView",
  "blockUser",
  "giftCardView",
  "postView",
  "coinsManage",
  "managersView",
  "reportView",
  "reportManage",
  "blockPost",
  "paymentView",
  "fullAccess",
] as const;

export const userValidation = {
  createSchema: z
    .object({
      firstName: z.string().min(1, "First name is required"),
      email: z.string().email("Invalid email address"),
      phoneNumber: z
        .string()
        .min(7, "Phone number must be at least 7 characters")
        .max(15, "Phone number too long"),
      role: z.enum(["MANAGER"]), 
      setAccess: z
        .array(z.enum(baseAccessList))
        .nonempty("At least one access must be selected"),
      password: z.string().min(6, "Password must be at least 6 characters")
    }),
  updateSchema: z
    .object({
      firstName: z.string().optional(),
      email: z.string().email("Invalid email").optional(),
      phoneNumber: z.string().optional(),
      role: z.enum(["MANAGER"]).optional(),
      setAccess: z.array(z.enum(baseAccessList)).optional(),
      password: z.string().min(6, "Password must be at least 6 characters").optional(),
    })
    
};
