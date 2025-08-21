"use client";

import { useState, useRef, useEffect } from 'react';

export default function SearchBar({ onSearch }: { onSearch: (query: string) => void }) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
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

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const updateGlow = (mouseX: number, mouseY: number, rect: DOMRect) => {
    const search = searchRef.current;
    if (!search) return;

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
      search.style.setProperty('--start', `${angle + 60}`);
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile) return;
    
    const search = searchRef.current;
    if (!search) return;

    const rect = search.getBoundingClientRect();
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
    
    const search = searchRef.current;
    if (!search) return;

    const rect = search.getBoundingClientRect();
    const touch = e.touches[0];
    const touchX = touch.clientX - rect.left;
    const touchY = touch.clientY - rect.top;

    updateGlow(touchX, touchY, rect);
    setIsHovered(true);
    
    setTimeout(() => setIsHovered(false), 2000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const clearSearch = () => {
    setQuery('');
    onSearch('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="mb-6">
      <div 
        ref={searchRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        className={`glow-search relative rounded-2xl p-1 shadow-2xl shadow-black/30 overflow-hidden transition-all duration-300 ${
          isFocused ? 'transform scale-[1.02]' : ''
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
            background: `conic-gradient(from calc(var(--start, 0) * 1deg), transparent, #10b981, #3b82f6, #8b5cf6, transparent)`,
            borderRadius: 'inherit',
            filter: 'blur(2px)',
            opacity: (isHovered || isFocused) ? (isMobile ? 0.7 : 1) : 0,
            transform: isFocused ? 'scale(1.05)' : 'scale(1)',
            ...(isMobile && {
              WebkitTransform: 'translateZ(0)',
              transform: 'translateZ(0)'
            })
          }}
        />
        
        {/* Content container */}
        <div className="relative z-10 bg-gradient-to-br from-slate-800/95 to-slate-900/95 rounded-2xl backdrop-blur-sm">
          <div className="relative">
            {/* Search icon */}
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg 
                className={`w-5 h-5 transition-all duration-300 ${
                  isFocused || query 
                    ? 'text-blue-400 scale-110' 
                    : 'text-slate-400'
                }`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                />
              </svg>
            </div>

            {/* Input field */}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleInputChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder="Search posts, topics, or users..."
              className={`w-full pl-12 pr-12 py-4 bg-transparent text-white placeholder-slate-300 focus:outline-none text-base transition-all duration-300 ${
                isFocused ? 'placeholder-slate-400' : ''
              }`}
              style={{
                background: isFocused 
                  ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.3), rgba(15, 23, 42, 0.5))' 
                  : 'transparent'
              }}
            />

            {/* Clear button */}
            {query && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                <button
                  onClick={clearSearch}
                  className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200 hover:scale-110 active:scale-95"
                  aria-label="Clear search"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Search suggestions or status */}
          {isFocused && (
            <div className="px-4 pb-3">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>
                  {query 
                    ? `Searching for "${query}"...` 
                    : 'Type to search posts, topics, or users'
                  }
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Floating search indicator */}
        {query && (
          <div className="absolute top-2 right-2 z-20">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs px-2 py-1 rounded-full font-medium shadow-lg animate-pulse">
              {query.length}
            </div>
          </div>
        )}
      </div>

      {/* Search shortcuts */}
      {isFocused && !query && (
        <div className="mt-4 px-2">
          <div className="flex flex-wrap gap-2">
            {['trending', 'recent', 'popular', 'tech', 'design'].map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  setQuery(tag);
                  onSearch(tag);
                }}
                className="px-3 py-1.5 text-xs bg-slate-700/50 hover:bg-slate-600/60 text-slate-300 hover:text-white rounded-full border border-slate-600/30 hover:border-slate-500/50 transition-all duration-200 hover:scale-105"
              >
                #{tag}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-2">Popular search tags</p>
        </div>
      )}
    </div>
  );
}