// hooks/use-posts.ts
import { useState, useEffect, useCallback } from 'react';

interface Post {
  id: string;
  title?: string;
  content: string;
  created_at: string;
  user_id?: string;
  profile?: {
    id: string;
    email?: string;
    username?: string;
  };
}

interface UsePostsParams {
  query: string;
  filter: 'all' | 'mine';
}

interface UsePostsReturn {
  posts: Post[];
  isLoading: boolean;
  error: string | null;
  fetchNextPage: () => void;
  hasNextPage: boolean;
}

export default function usePosts({ query, filter }: UsePostsParams): UsePostsReturn {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasNextPage] = useState(false); // For now, no pagination

  // removed misplaced import

  const fetchPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (query) params.append('query', query);
      params.append('filter', filter);

      const response = await fetch(`/api/posts?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Ensure we always get an array
      const postsArray = Array.isArray(data.posts) ? data.posts : [];
      setPosts(postsArray);
      
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch posts');
      setPosts([]); // Ensure posts is always an array on error
    } finally {
      setIsLoading(false);
    }
  }, [query, filter]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const fetchNextPage = () => {
    // Placeholder for pagination
    console.log('Fetch next page');
  };

  return {
    posts,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
  };
}