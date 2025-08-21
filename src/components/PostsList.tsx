"use client";

import { useState, useEffect } from 'react';
import PostCard from './post-card';

interface Post {
  id: string;
  title?: string;
  content: string;
  created_at: string;
  user_id?: string;
  like_count?: number;
  is_liked?: boolean;
  profile?: {
    id: string;
    email?: string;
    username?: string;
  };
}

interface User {
  id: string;
  email?: string;
  username?: string;
}

interface PostsListProps {
  filter?: "all" | "mine";
  query?: string;
}

export default function PostsList({ filter = "all", query = "" }: PostsListProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/user');
      if (response.ok) {
        const userData = await response.json();
        setCurrentUser(userData);
        return userData;
      } else {
        setCurrentUser(null);
        return null;
      }
    } catch (error) {
      setCurrentUser(null);
      return null;
    }
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters based on filter and search
      const params = new URLSearchParams();
      if (query) {
        params.append('search', query);
      }
      if (filter === 'mine') {
        params.append('filter', 'mine');
      }

      const url = `/api/posts${params.toString() ? `?${params.toString()}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      // Handle both formats: { posts: [...] } or just [...]
      const postsArray = data.posts || data;
      const userData = data.user || null;
      
      // If user data came with posts, use it
      if (userData && !currentUser) {
        setCurrentUser(userData);
      }

      // Ensure posts have default values
      const postsWithDefaults = postsArray.map((post: any) => ({
        ...post,
        like_count: post.like_count ?? 0,
        is_liked: post.is_liked ?? false,
      }));
      
      // Apply client-side filtering if API doesn't handle it
      let filteredPosts = postsWithDefaults;
      
      // Filter by user if "mine" is selected
      if (filter === 'mine' && currentUser) {
        filteredPosts = filteredPosts.filter(post => post.user_id === currentUser.id);
      }
      
      // Filter by search query
      if (query) {
        const searchLower = query.toLowerCase();
        filteredPosts = filteredPosts.filter(post => {
          const titleMatch = post.title?.toLowerCase().includes(searchLower);
          const contentMatch = post.content?.toLowerCase().includes(searchLower);
          return titleMatch || contentMatch;
        });
      }

      setPosts(filteredPosts);
    } catch (error) {
      setError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      await fetchCurrentUser();
    };
    
    initializeData();
  }, []);

  // Refetch posts when filter, query, or currentUser changes
  useEffect(() => {
    if (currentUser !== undefined) {
      fetchPosts();
    }
  }, [filter, query, currentUser]);

  const handlePostUpdate = (updatedPost: Post) => {
    setPosts(posts.map(post => 
      post.id === updatedPost.id ? updatedPost : post
    ));
  };

  const handlePostDelete = (postId: string) => {
    setPosts(posts.filter(post => post.id !== postId));
  };

  if (loading) {
    return (
      <div className="text-center text-gray-400 py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
        <p className="mt-2">Loading posts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-400 py-8">
        <p className="mb-4">{error}</p>
        <button 
          onClick={fetchPosts}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts.length === 0 ? (
        <div className="text-center text-gray-400 py-8">
          <p>No posts found</p>
          {query && <p className="text-sm mt-2">Try adjusting your search or create a new post.</p>}
          {filter === 'mine' && <p className="text-sm mt-2">You haven't created any posts yet.</p>}
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={currentUser?.id}
              onPostUpdate={handlePostUpdate}
              onPostDelete={handlePostDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}