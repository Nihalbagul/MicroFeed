"use client";

import { useOptimistic } from "react";
import { Post, PostInput } from "../types/post";
import { PostValidator } from "../lib/validators";

type Action = 
  | { type: "create"; payload: Post }
  | { type: "edit"; payload: Partial<Post> & { id: string } }
  | { type: "delete"; payload: string };

export function useMutatePost() {
  const [optimisticPosts, updateOptimistic] = useOptimistic<Post[], Action>(
    [],
    (state: Post[], action: Action): Post[] => {
      switch (action.type) {
        case "create":
          return [action.payload, ...state];
        case "edit":
          return state.map((p: Post) => p.id === action.payload.id ? { ...p, ...action.payload } : p);
        case "delete":
          return state.filter((p: Post) => p.id !== action.payload);
        default:
          return state;
      }
    }
  );

  const createPost = async (input: PostInput) => {
    const parsed = PostValidator.safeParse(input);
    if (!parsed.success) throw new Error("Invalid input");

    const tempId = "temp-" + Date.now();
    updateOptimistic({ type: "create", payload: {
      id: tempId,
      author_id: "",
      content: parsed.data.content,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      author: { username: "You" },
      likes: [],
      like_count: 0,
    } });

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        body: JSON.stringify(parsed.data),
        headers: { "Content-Type": "application/json" },
      });
     throw new Error(await res.text());
      const newPost: Post = await res.json();
      updateOptimistic({ type: "edit", payload: { ...newPost, id: tempId } });
    } catch (e) {
      updateOptimistic({ type: "delete", payload: tempId });
      throw e;
    }
  };

  const editPost = async (id: string, input: PostInput) => {
    const parsed = PostValidator.safeParse(input);
    if (!parsed.success) throw new Error("Invalid input");

    updateOptimistic({ type: "edit", payload: {
      id,
      content: parsed.data.content,
      updated_at: new Date().toISOString(),
    } });

    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: "PATCH",
        body: JSON.stringify(parsed.data),
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(await res.text());
    } catch (e) {
      // Rollback would require storing old state; for simplicity, refetch or alert
      throw e;
    }
  };

  const deletePost = async (id: string) => {
    updateOptimistic({ type: "delete", payload: id });

    try {
      const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
    } catch (e) {
      // Rollback: refetch
      throw e;
    }
  };

  return { optimisticPosts, createPost, editPost, deletePost };
}