import { z } from "zod";

export const loginRequestSchema = z.object({
  email: z.string().trim().email(),
  next: z.string().optional(),
});
