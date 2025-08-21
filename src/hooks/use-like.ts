"use client";

import { useState } from "react";
import { Post } from "../types/post";

export function useLike(post: Post, userId: string | null) {
  const isLiked = post.likes.some((l) => l.user_id === userId);
  const [liked, setLiked] = useState(isLiked);
  const [likeCount, setLikeCount] = useState(post.like_count);

  const toggleLike = async () => {
    if (!userId) return;

    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount((prev) => newLiked ? prev + 1 : prev - 1);

    try {
      const res = await fetch(`/api/posts/${post.id}/like`, {
        method: newLiked ? "POST" : "DELETE",
      });
      if (!res.ok) throw new Error(await res.text());
    } catch (e) {
      setLiked(!newLiked);
      setLikeCount((prev) => newLiked ? prev - 1 : prev + 1);
      console.error(e);
    }
  };

  return { liked, likeCount, toggleLike };
}