import { z } from "zod";

export type Post = {
  id: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author: { username: string };
  likes: { user_id: string }[];
  like_count: number;
};

export const PostSchema = z.object({
  content: z.string().max(280).min(1),
});

export type PostInput = z.infer<typeof PostSchema>;