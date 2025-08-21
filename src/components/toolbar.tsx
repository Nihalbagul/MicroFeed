"use client";

import { useState, useRef, useEffect } from 'react';

export default function Toolbar({
  filter,
  onFilterChange,
}: {
  filter: "all" | "mine";
  onFilterChange: (filter: "all" | "mine") => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  
  const toolbarRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);

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
    const toolbar = toolbarRef.current;
    if (!toolbar) return;

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
      toolbar.style.setProperty('--start', `${angle + 60}`);
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile) return;
    
    const toolbar = toolbarRef.current;
    if (!toolbar) return;

    const rect = toolbar.getBoundingClientRect();
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
    setHoveredButton(null);
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isMobile) return;
    
    const toolbar = toolbarRef.current;
    if (!toolbar) return;

    const rect = toolbar.getBoundingClientRect();
    const touch = e.touches[0];
    const touchX = touch.clientX - rect.left;
    const touchY = touch.clientY - rect.top;

    updateGlow(touchX, touchY, rect);
    setIsHovered(true);
    
    setTimeout(() => setIsHovered(false), 1500);
  };

  const handleButtonHover = (buttonType: string) => {
    setHoveredButton(buttonType);
  };

  const handleButtonLeave = () => {
    setHoveredButton(null);
  };

  const handleFilterChange = (e: React.MouseEvent<HTMLButtonElement>, newFilter: "all" | "mine") => {
    e.preventDefault(); // Prevent default button behavior to avoid scrolling
    onFilterChange(newFilter);
    
    // Add a subtle success animation
    const toolbar = toolbarRef.current;
    if (toolbar) {
      toolbar.style.transform = 'scale(1.02)';
      setTimeout(() => {
        toolbar.style.transform = '';
      }, 150);
    }
  };

  return (
    <div className="mb-6">
      <div 
        ref={toolbarRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        className={`glow-toolbar relative rounded-2xl p-1 shadow-2xl shadow-black/30 overflow-hidden transition-all duration-300 ${
          isMobile ? 'transform-gpu' : ''
        }`}
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
            background: `conic-gradient(from calc(var(--start, 0) * 1deg), transparent, #f59e0b, #3b82f6, #8b5cf6, transparent)`,
            borderRadius: 'inherit',
            filter: 'blur(2px)',
            opacity: isHovered ? (isMobile ? 0.6 : 0.8) : 0,
            ...(isMobile && {
              WebkitTransform: 'translateZ(0)',
              transform: 'translateZ(0)'
            })
          }}
        />
        
        {/* Content container */}
        <div className="relative z-10 bg-gradient-to-br from-slate-800/95 to-slate-900/95 rounded-2xl p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            {/* Filter label */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-orange-500/25 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-orange-400 to-red-400 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                <svg className="w-5 h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                  Filter Posts
                </h3>
                <p className="text-slate-400 text-sm">Choose your view</p>
              </div>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center bg-slate-700/30 rounded-xl p-1 border border-slate-600/30">
              <button
                onClick={(e) => handleFilterChange(e, "all")}
                onMouseEnter={() => handleButtonHover("all")}
                onMouseLeave={handleButtonLeave}
                className={`relative px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-300 overflow-hidden group ${
                  filter === "all"
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25 scale-105'
                    : 'text-slate-300 hover:text-white hover:bg-slate-600/50'
                } ${isMobile ? 'active:scale-95' : 'hover:scale-105'}`}
              >
                {/* Button glow effect */}
                {filter !== "all" && hoveredButton === "all" && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 transition-opacity duration-300 rounded-lg"></div>
                )}
                
                {/* Active indicator */}
                {filter === "all" && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-lg"></div>
                )}
                
                <span className="relative z-10 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4" />
                  </svg>
                  All Posts
                </span>
                
                {/* Active pulse */}
                {filter === "all" && (
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-30 group-hover:opacity-50 transition-opacity animate-pulse"></div>
                )}
              </button>

              <button
                onClick={(e) => handleFilterChange(e, "mine")}
                onMouseEnter={() => handleButtonHover("mine")}
                onMouseLeave={handleButtonLeave}
                className={`relative px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-300 overflow-hidden group ${
                  filter === "mine"
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/25 scale-105'
                    : 'text-slate-300 hover:text-white hover:bg-slate-600/50'
                } ${isMobile ? 'active:scale-95' : 'hover:scale-105'}`}
              >
                {/* Button glow effect */}
                {filter !== "mine" && hoveredButton === "mine" && (
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 transition-opacity duration-300 rounded-lg"></div>
                )}
                
                {/* Active indicator */}
                {filter === "mine" && (
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-lg"></div>
                )}
                
                <span className="relative z-10 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  My Posts
                </span>
                
                {/* Active pulse */}
                {filter === "mine" && (
                  <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg blur opacity-30 group-hover:opacity-50 transition-opacity animate-pulse"></div>
                )}
              </button>
            </div>
          </div>

          {/* Filter info */}
          <div className="mt-4 flex items-center justify-between text-xs text-slate-400 border-t border-slate-600/30 pt-3">
            <div className="flex items-center gap-2">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>
                {filter === "all" 
                  ? "Showing all posts from everyone" 
                  : "Showing only your posts"
                }
              </span>
            </div>
            
            {/* Active filter indicator */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full animate-pulse ${
                filter === "all" ? "bg-blue-400" : "bg-emerald-400"
              }`}></div>
              <span className="font-medium capitalize text-white">
                {filter === "all" ? "All" : "Mine"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}