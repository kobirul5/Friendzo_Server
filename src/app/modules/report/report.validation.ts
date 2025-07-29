import { z } from 'zod';

const createSchema = z.object({
    reportedUserId: z
    .string({
      required_error: "Reported user ID is required",
      invalid_type_error: "Reported user ID must be a string"
    })
    .min(1, "Reported user ID cannot be empty"),

  description: z
    .string({
      invalid_type_error: "Description must be a string"
    })
    .optional(),
   
});



export const reportValidation = {
createSchema,
};