"use client";

import { useState, useRef, useEffect } from 'react';

export default function Composer() {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const cardRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const animationRef = useRef<number>();

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [content]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
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

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    animationRef.current = requestAnimationFrame(() => {
      card.style.setProperty('--start', `${angle + 60}`);
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile) return;
    
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
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

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
    
    setTimeout(() => setIsHovered(false), 2000);
  };

  const handleFocus = () => {
    setIsFocused(true);
    setIsExpanded(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (!content.trim()) {
      setIsExpanded(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
        
    if (!content.trim()) {
      setError('Content is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create post');
      }

      // Success - clear the form with animation
      setContent('');
      setIsExpanded(false);
      
      // Show success feedback
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.style.transform = 'scale(1.05)';
        textarea.style.background = 'linear-gradient(135deg, #059669, #047857)';
        setTimeout(() => {
          textarea.style.transform = '';
          textarea.style.background = '';
        }, 300);
      }
            
      // Refresh the page to show the new post
      setTimeout(() => {
        window.location.reload();
      }, 500);
          
    } catch (err) {
      console.error('Error creating post:', err);
      setError(err instanceof Error ? err.message : 'Failed to create post');
      
      // Shake animation on error
      const card = cardRef.current;
      if (card) {
        card.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
          card.style.animation = '';
        }, 500);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCharacterCount = () => content.length;
  const getCharacterColor = () => {
    const count = getCharacterCount();
    if (count > 250) return 'text-red-400';
    if (count > 200) return 'text-yellow-400';
    return 'text-slate-400';
  };

  const getProgressWidth = () => {
    return Math.min((getCharacterCount() / 280) * 100, 100);
  };

  const getProgressColor = () => {
    const progress = getProgressWidth();
    if (progress > 90) return 'bg-gradient-to-r from-red-500 to-red-600';
    if (progress > 70) return 'bg-gradient-to-r from-yellow-500 to-orange-500';
    return 'bg-gradient-to-r from-blue-500 to-purple-600';
  };

  return (
    <div 
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      className={`glow-card mb-8 relative rounded-2xl p-1 shadow-2xl shadow-black/50 overflow-hidden transition-all duration-500 ${
        isExpanded ? 'transform scale-[1.02]' : ''
      } ${isMobile ? 'transform-gpu' : ''}`}
      style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        border: '1px solid #475569',
        ...(isMobile && {
          WebkitTransform: 'translateZ(0)',
          transform: 'translateZ(0)',
          WebkitBackfaceVisibility: 'hidden',
          backfaceVisibility: 'hidden'
        })
      }}
    >
      {/* Animated glow effect */}
      <div 
        className="glow absolute inset-0 pointer-events-none transition-all duration-500"
        style={{
          background: `conic-gradient(from calc(var(--start, 0) * 1deg), transparent, #3b82f6, #8b5cf6, #ec4899, transparent)`,
          borderRadius: 'inherit',
          filter: 'blur(3px)',
          opacity: (isHovered || isFocused) ? (isMobile ? 0.7 : 1) : 0,
          transform: isExpanded ? 'scale(1.1)' : 'scale(1)',
          ...(isMobile && {
            WebkitTransform: 'translateZ(0)',
            transform: 'translateZ(0)'
          })
        }}
      />
      
      {/* Content container */}
      <div className="relative z-10 bg-gradient-to-br from-slate-800/95 to-slate-900/95 rounded-2xl p-6 backdrop-blur-sm">
        {/* Header */}
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-purple-500/25 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            <svg className="w-6 h-6 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div className="ml-4">
            <h2 className="text-xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
              Create a Post
            </h2>
            <p className="text-slate-400 text-sm">Share your thoughts with the world</p>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-gradient-to-r from-red-600/30 to-red-500/30 border border-red-400/50 text-red-100 px-6 py-4 rounded-xl mb-6 shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-red-500/10 animate-pulse"></div>
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="font-medium">{error}</span>
              </div>
              <button 
                onClick={() => setError(null)}
                className="text-red-200 hover:text-white transition-colors text-xl leading-none font-bold hover:scale-110 transform"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Textarea container */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              placeholder="What's on your mind? Share something amazing..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              rows={isExpanded ? 6 : 3}
              maxLength={280}
              className={`w-full p-4 bg-slate-700/70 border-2 rounded-xl text-white placeholder-slate-300 focus:outline-none resize-none text-base transition-all duration-300 ${
                isFocused 
                  ? 'border-blue-400 ring-4 ring-blue-400/20 shadow-lg shadow-blue-500/25' 
                  : 'border-slate-500/50 hover:border-slate-400/70'
              } ${isExpanded ? 'min-h-[120px]' : ''}`}
              disabled={isSubmitting}
              required
              style={{
                background: isFocused 
                  ? 'linear-gradient(135deg, rgba(51, 65, 85, 0.8), rgba(30, 41, 59, 0.9))' 
                  : undefined
              }}
            />
            
            {/* Floating label effect */}
            {content && (
              <div className="absolute top-2 right-3 text-xs font-medium text-slate-400 bg-slate-800/80 px-2 py-1 rounded">
                Draft
              </div>
            )}
          </div>

          {/* Character count and progress bar */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className={`text-sm font-medium transition-colors ${getCharacterColor()}`}>
                  {getCharacterCount()}/280
                </span>
                {getCharacterCount() > 0 && (
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Ready to post</span>
                  </div>
                )}
              </div>
            </div>

            {/* Progress bar */}
            {getCharacterCount() > 0 && (
              <div className="w-full bg-slate-600/30 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 rounded-full ${getProgressColor()}`}
                  style={{ width: `${getProgressWidth()}%` }}
                />
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-600/30">
            <div className="flex items-center gap-3 text-slate-400">
              <button
                type="button"
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-700/50 transition-colors text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4V2C7 1.45 7.45 1 8 1H16C16.55 1 17 1.45 17 2V4M7 4H17M7 4L5 6M17 4L19 6M5 6V20C5 21.1 5.9 22 7 22H17C17 21.1 16.1 20 15 20H9C7.9 20 7 21.1 7 22C5.9 22 5 21.1 5 20V6Z" />
                </svg>
                <span className="hidden sm:inline">Add media</span>
              </button>
              
              <button
                type="button"
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-700/50 transition-colors text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.01M15 10h1.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="hidden sm:inline">Emoji</span>
              </button>
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting || !content.trim() || getCharacterCount() > 280}
              className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg relative overflow-hidden group ${
                isSubmitting || !content.trim() || getCharacterCount() > 280
                  ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white hover:scale-105 shadow-blue-500/25 active:scale-95'
              }`}
            >
              {/* Button glow effect */}
              {!isSubmitting && content.trim() && getCharacterCount() <= 280 && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-xl"></div>
              )}
              
              <span className="relative z-10 flex items-center gap-2">
                {isSubmitting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Posting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Post
                  </>
                )}
              </span>
            </button>
          </div>
        </form>
      </div>


    </div>
  );
}