/**
 * VIDEO THUMBNAIL COMPONENT - FIXED EXPORT ISSUE
 * Displays 3-second looping video with play overlay
 * Integrates with AskStan! design system and accessibility standards
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, AlertCircle } from 'lucide-react';
import { VideoThumbnailProps } from './types';

export const VideoThumbnail: React.FC<VideoThumbnailProps> = ({
  thumbnailSrc,
  thumbnailWebM,
  fallbackImage,
  alt,
  onPlay,
  isLoading = false,
  autoplay = true,
  lazyLoad = true
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(!lazyLoad);
  const [showFallback, setShowFallback] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazyLoad || isInView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [lazyLoad, isInView]);

  // Handle video events
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isInView) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleError = () => {
      console.error('Video thumbnail failed to load:', thumbnailSrc);
      setHasError(true);
      setShowFallback(true);
    };

    const handleCanPlay = () => {
      setHasError(false);
      if (autoplay && !isPlaying) {
        video.play().catch(() => {
          console.warn('Autoplay failed - user interaction required');
        });
      }
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('error', handleError);
    video.addEventListener('canplay', handleCanPlay);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('error', handleError);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [thumbnailSrc, autoplay, isInView, isPlaying]);

  // Handle thumbnail click
  const handleThumbnailClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPlay();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onPlay();
    }
  };

  if (isLoading) {
    return (
      <div 
        ref={containerRef}
        className="relative aspect-video rounded-2xl bg-gray-200 animate-pulse overflow-hidden"
      >
        {/* Loading shimmer effect */}
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className="relative group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Video Container with Glass Morphism */}
      <motion.div
        className="relative aspect-video rounded-2xl overflow-hidden bg-white/80 backdrop-blur-lg border border-white/20 shadow-2xl"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2 }}
        onClick={handleThumbnailClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={`Play video: ${alt}`}
      >
        {/* Video Element or Fallback Image */}
        {isInView && !showFallback ? (
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            muted
            loop
            playsInline
            poster={fallbackImage}
            aria-label={alt}
            onError={() => setShowFallback(true)}
            style={{ filter: hasError ? 'grayscale(100%)' : 'none' }}
          >
            {/* WebM source for better compression */}
            {thumbnailWebM && (
              <source src={thumbnailWebM} type="video/webm" />
            )}
            {/* MP4 fallback */}
            <source src={thumbnailSrc} type="video/mp4" />
            {/* Text fallback for very old browsers */}
            Your browser does not support the video tag.
          </video>
        ) : (
          <img
            src={fallbackImage}
            alt={alt}
            className="w-full h-full object-cover"
            loading={lazyLoad ? "lazy" : "eager"}
          />
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Play Button Overlay */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0.8 }}
          transition={{ duration: 0.2 }}
        >
          <motion.button
            className="w-20 h-20 bg-white/90 backdrop-blur-lg border border-white/20 rounded-full flex items-center justify-center shadow-2xl hover:bg-white transition-all duration-300 group"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleThumbnailClick}
            aria-label="Play full video"
          >
            <Play 
              className="w-8 h-8 text-blue-600 ml-1 group-hover:text-blue-700 transition-colors" 
              fill="currentColor" 
            />
          </motion.button>
        </motion.div>

        {/* Error State */}
        {hasError && (
          <div className="absolute top-4 right-4 flex items-center space-x-2 bg-red-500/90 backdrop-blur-lg rounded-lg px-3 py-2">
            <AlertCircle className="w-4 h-4 text-white" />
            <span className="text-white text-sm">Video unavailable</span>
          </div>
        )}

        {/* Video Controls Overlay (only shown when video is playing) */}
        {isInView && !showFallback && (
          <>
            {/* Mini play/pause control */}
            <div className="absolute bottom-4 right-4 flex items-center space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const video = videoRef.current;
                  if (video) {
                    if (isPlaying) {
                      video.pause();
                    } else {
                      video.play().catch(() => {
                        console.warn('Play failed - user interaction required');
                      });
                    }
                  }
                }}
                className="w-8 h-8 bg-black/50 backdrop-blur-lg rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
                aria-label={isPlaying ? "Pause preview" : "Play preview"}
              >
                {isPlaying ? (
                  <Pause className="w-3 h-3 text-white" />
                ) : (
                  <Play className="w-3 h-3 text-white ml-0.5" fill="currentColor" />
                )}
              </button>
              <span className="text-white text-xs bg-black/50 px-2 py-1 rounded">
                Preview
              </span>
            </div>

            {/* Live indicator for playing video */}
            {isPlaying && (
              <div className="absolute top-4 left-4 flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-white text-xs bg-black/50 px-2 py-1 rounded">
                  Live Preview
                </span>
              </div>
            )}
          </>
        )}

        {/* Accessibility: Focus ring */}
        <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-focus-within:border-blue-500 transition-colors duration-200 pointer-events-none" />
      </motion.div>

      {/* Decorative glow effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-yellow-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
    </div>
  );
};

// CRITICAL FIX: Add default export
export default VideoThumbnail;