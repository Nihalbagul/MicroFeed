"use client";

import { useState, useRef, useEffect } from 'react';

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

interface PostCardProps {
  post: Post;
  currentUserId?: string;
  onPostUpdate?: (updatedPost: Post) => void;
  onPostDelete?: (postId: string) => void;
  index?: number;
}

export default function PostCard({ 
  post, 
  currentUserId, 
  onPostUpdate,
  onPostDelete,
  index = 0
}: PostCardProps) {
  const [isLiked, setIsLiked] = useState(post.is_liked || false);
  const [likeCount, setLikeCount] = useState(post.like_count || 0);
  const [isLiking, setIsLiking] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const cardRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Cleanup function
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const updateGlow = (mouseX: number, mouseY: number, rect: DOMRect) => {
    const card = cardRef.current;
    if (!card) return;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const relativeX = mouseX - centerX;
    const relativeY = mouseY - centerY;

    let angle = Math.atan2(relativeY, relativeX) * (180 / Math.PI);
    angle = (angle + 360) % 360;

    // Use requestAnimationFrame for smooth updates
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    animationRef.current = requestAnimationFrame(() => {
      card.style.setProperty('--start', `${angle + 60}`);
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile) return; // Skip mouse events on mobile
    
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    updateGlow(mouseX, mouseY, rect);
    
    if (!isHovered) {
      setIsHovered(true);
    }
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile) return;
    setIsHovered(true);
    handleMouseMove(e);
  };

  const handleMouseLeave = () => {
    if (isMobile) return;
    setIsHovered(false);
    
    // Clear any pending animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  // Touch event handlers for mobile
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isMobile) return;
    
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const touch = e.touches[0];
    const touchX = touch.clientX - rect.left;
    const touchY = touch.clientY - rect.top;

    updateGlow(touchX, touchY, rect);
    setIsHovered(true);

    // Auto-hide glow effect on mobile after 2 seconds
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 2000);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isMobile) return;
    
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const touch = e.touches[0];
    const touchX = touch.clientX - rect.left;
    const touchY = touch.clientY - rect.top;

    updateGlow(touchX, touchY, rect);
  };

  const handleTouchEnd = () => {
    if (!isMobile) return;
    
    // Keep glow for a moment then fade
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 1500);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown date';
    }
  };

  const getAuthorName = () => {
    if (post.profile?.username) return post.profile.username;
    if (post.profile?.email) return post.profile.email.split('@')[0];
    return 'Anonymous';
  };

  const isOwnPost = currentUserId && post.user_id === currentUserId;

  const handleLike = async () => {
    if (isLiking) return;
    
    if (!currentUserId) {
      setError('Please sign in to like posts');
      return;
    }
    
    setError(null);
    setIsLiking(true);
    
    const newIsLiked = !isLiked;
    const newLikeCount = newIsLiked ? likeCount + 1 : likeCount - 1;
    
    // Optimistic update
    setIsLiked(newIsLiked);
    setLikeCount(newLikeCount);

    try {
      const response = await fetch(`/api/posts/${post.id}/like`, {
        method: newIsLiked ? 'POST' : 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setLikeCount(data.like_count);
      setIsLiked(data.is_liked);
      
    } catch (error) {
      setError('Failed to update like');
      
      // Revert optimistic update
      setIsLiked(!newIsLiked);
      setLikeCount(newIsLiked ? newLikeCount - 1 : newLikeCount + 1);
    } finally {
      setIsLiking(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(post.content);
    setError(null);
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    setError(null);
    setIsUpdating(true);

    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editContent.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const updatedPost = await response.json();
      
      if (onPostUpdate) {
        onPostUpdate(updatedPost);
      }
      
      setIsEditing(false);
    } catch (error) {
      setError('Failed to update post');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    setError(null);
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      if (onPostDelete) {
        onPostDelete(post.id);
      }
    } catch (error) {
      setError('Failed to delete post');
      setIsDeleting(false);
    }
  };

  const commonProps = {
    ref: cardRef,
    onMouseMove: handleMouseMove,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    className: `glow-card w-full max-w-full mx-auto relative rounded-2xl p-4 sm:p-6 shadow-2xl shadow-black/50 overflow-hidden ${
      isMobile ? 'transform-gpu' : 'transition-all duration-300 hover:scale-[1.02]'
    }`,
    style: {
      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      border: '1px solid #475569',
      // Better performance on mobile
      ...(isMobile && {
        WebkitTransform: 'translateZ(0)',
        transform: 'translateZ(0)',
        WebkitBackfaceVisibility: 'hidden',
        backfaceVisibility: 'hidden'
      })
    }
  };

  if (isEditing) {
    return (
      <div {...commonProps}>
        {/* Glow effect */}
        <div 
          className="glow absolute inset-0 pointer-events-none transition-opacity duration-500"
          style={{
            background: `conic-gradient(from calc(var(--start, 0) * 1deg), transparent, #3b82f6, #8b5cf6, #ec4899, transparent)`,
            borderRadius: 'inherit',
            filter: 'blur(2px)',
            opacity: isHovered ? (isMobile ? 0.8 : 1) : 0,
            // Better performance on mobile
            ...(isMobile && {
              WebkitTransform: 'translateZ(0)',
              transform: 'translateZ(0)'
            })
          }}
        />
        
        {/* Content overlay */}
        <div className="relative z-10 bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl p-4 sm:p-6 backdrop-blur-sm">
          <div className="space-y-4">
            {error && (
              <div className="bg-gradient-to-r from-red-600/30 to-red-500/30 border border-red-400/50 text-red-100 px-4 py-3 rounded-xl text-sm shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{error}</span>
                  <button 
                    onClick={() => setError(null)}
                    className="ml-3 text-red-200 hover:text-white transition-colors text-lg leading-none font-bold"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}
            
            <div>
              <textarea
                placeholder="What's on your mind?"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={4}
                className="w-full p-4 bg-slate-700/70 border border-slate-500/50 rounded-xl text-white placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 resize-none text-sm sm:text-base transition-all"
                disabled={isUpdating}
                required
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button
                onClick={handleCancelEdit}
                disabled={isUpdating}
                className="w-full sm:w-auto px-6 py-3 text-slate-200 hover:text-white transition-all disabled:opacity-50 rounded-xl hover:bg-slate-600/50 border border-slate-500/30 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isUpdating || !editContent.trim()}
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl transition-all hover:scale-105 shadow-lg shadow-blue-500/25 font-semibold"
              >
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div {...commonProps}>
      {/* Glow effect */}
      <div 
        className="glow absolute inset-0 pointer-events-none transition-opacity duration-500"
        style={{
          background: `conic-gradient(from calc(var(--start, 0) * 1deg), transparent, #3b82f6, #8b5cf6, #ec4899, transparent)`,
          borderRadius: 'inherit',
          filter: 'blur(2px)',
          opacity: isHovered ? (isMobile ? 0.8 : 1) : 0,
          // Better performance on mobile
          ...(isMobile && {
            WebkitTransform: 'translateZ(0)',
            transform: 'translateZ(0)'
          })
        }}
      />
      
      {/* Content overlay */}
      <div className="relative z-10 bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl p-4 sm:p-6 backdrop-blur-sm">
        {error && (
          <div className="bg-gradient-to-r from-red-600/30 to-red-500/30 border border-red-400/50 text-red-100 px-4 py-3 rounded-xl mb-4 text-sm shadow-lg">
            <div className="flex items-center justify-between">
              <span className="font-medium">{error}</span>
              <button 
                onClick={() => setError(null)}
                className="ml-3 text-red-200 hover:text-white transition-colors text-lg leading-none font-bold"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Header with author info */}
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-lg shadow-purple-500/25 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
            <span className="relative z-10">{getAuthorName().charAt(0).toUpperCase()}</span>
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <h3 className="text-white font-semibold text-sm sm:text-base truncate">
              {getAuthorName()}
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm">
              {formatDate(post.created_at)}
            </p>
          </div>
        </div>

        {/* Post title */}
        {post.title && (
          <h2 className="text-lg sm:text-xl font-bold text-white mb-3 break-words bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
            {post.title}
          </h2>
        )}
        
        {/* Post content */}
        <p className="text-slate-100 mb-6 whitespace-pre-wrap text-sm sm:text-base leading-relaxed break-words">
          {post.content}
        </p>
        
        {/* Actions bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t border-slate-600/50">
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            <button
              onClick={handleLike}
              disabled={isLiking || !currentUserId}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all disabled:opacity-50 text-sm ${
                isMobile ? 'active:scale-95' : 'hover:scale-105'
              } font-medium shadow-lg relative overflow-hidden group ${
                isLiked
                  ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-400 hover:to-pink-400 shadow-red-500/25'
                  : 'text-slate-300 hover:text-red-400 hover:bg-slate-700/50 border border-slate-600/30'
              }`}
              title={!currentUserId ? 'Sign in to like posts' : ''}
            >
              {isLiked && (
                <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-pink-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              )}
              <svg 
                className={`w-4 h-4 sm:w-5 sm:h-5 relative z-10 ${isLiked ? 'fill-current animate-pulse' : 'fill-none stroke-current'}`} 
                viewBox="0 0 24 24" 
                strokeWidth="2"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              <span className="relative z-10">{likeCount}</span>
            </button>

            {isOwnPost && (
              <>
                <button
                  onClick={handleEdit}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all text-slate-300 hover:text-blue-400 hover:bg-slate-700/50 text-sm ${
                    isMobile ? 'active:scale-95' : 'hover:scale-105'
                  } border border-slate-600/30 font-medium shadow-lg relative overflow-hidden group`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span className="hidden sm:inline relative z-10">Edit</span>
                </button>
                
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all disabled:opacity-50 text-slate-300 hover:text-red-400 hover:bg-slate-700/50 text-sm ${
                    isMobile ? 'active:scale-95' : 'hover:scale-105'
                  } border border-slate-600/30 font-medium shadow-lg relative overflow-hidden group`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-orange-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1v3M4 7h16" />
                  </svg>
                  <span className="hidden sm:inline relative z-10">{isDeleting ? 'Deleting...' : 'Delete'}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}