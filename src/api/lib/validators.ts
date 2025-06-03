import { z } from "zod";


export const ideaSchema = z.object({
  title: z.string().min(1).max(100),
  content: z.string().min(1),
  tags: z
    .array(z.string().min(1).max(30))
    .optional()
    .refine((arr) => (arr ? arr.length <= 5 : true), {
      message: "Cannot have more than 5 tags",
    }),
});


export const userProfileSchema = z.object({
  displayName: z.string().min(1).max(50),
  bio: z.string().max(300).optional(),
  website: z.string().url().optional(),
});
