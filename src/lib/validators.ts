import { z } from "zod";

export const PostValidator = z.object({
  content: z.string().min(1).max(280),
});

export const SearchValidator = z.object({
  query: z.string().optional(),
  cursor: z.string().optional(),
  filter: z.enum(["all", "mine"]).default("all"),
});