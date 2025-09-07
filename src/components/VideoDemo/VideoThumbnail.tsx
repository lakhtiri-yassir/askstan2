/**
 * VIDEO THUMBNAIL COMPONENT - COMPLETE IMPLEMENTATION
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

// Default export for VideoThumbnail component
export default VideoThumbnail;
    
    const handleLoadedData = () => {
      setHasError(false);
      if (autoplay && video.paused) {
        video.play().catch(() => {
          console.warn('Autoplay prevented by browser');
          setIsPlaying(false);
        });
      }
    };

    const handleCanPlay = () => {
      if (autoplay) {
        video.play().catch(() => {
          console.warn('Autoplay prevented');
        });
      }
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('error', handleError);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('canplay', handleCanPlay);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('error', handleError);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [autoplay, isInView, thumbnailSrc]);

  // Handle thumbnail click
  const handleThumbnailClick = () => {
    const video = videoRef.current;
    if (hasError) {
      onPlay(); // Open full video even if thumbnail failed
      return;
    }

    if (video) {
      if (isPlaying) {
        video.pause();
      } else {
        video.play().catch(() => {
          console.warn('Play prevented by browser');
        });
      }
    }
  };

  // Handle play button click
  const handlePlayClick = (e: React.MouseEvent) => {
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
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.button
            className="w-16 h-16 bg-white/20 backdrop-blur-md border-2 border-white/30 rounded-full flex items-center justify-center group/button hover:bg-white/30 hover:border-white/50 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500/30"
            onClick={handlePlayClick}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Watch full demo"
          >
            <Play className="w-6 h-6 text-white ml-1" fill="currentColor" />
          </motion.button>
        </motion.div>

        {/* Error State */}
        {hasError && (
          <div className="absolute inset-0 bg-gray-900/80 flex flex-col items-center justify-center text-white p-4">
            <AlertCircle className="w-12 h-12 mb-4 text-yellow-500" />
            <p className="text-sm text-center mb-2">Video preview unavailable</p>
            <button
              onClick={handlePlayClick}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Watch Full Demo
            </button>
          </div>
        )}

        {/* Video Status Indicators */}
        {!hasError && (
          <>
            {/* Thumbnail Controls Indicator */}
            <div className="absolute bottom-4 left-4 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleThumbnailClick();
                }}
                className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/30 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
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