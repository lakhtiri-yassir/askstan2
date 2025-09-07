/**
 * CLEAN VIDEO MODAL - Final Version
 * Fixed pause button and removed debug panel completely
 * Proper control auto-hide logic
 */

import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward } from 'lucide-react';
import { VideoModalProps } from './types';

export const VideoModal: React.FC<VideoModalProps> = ({
  isOpen,
  onClose,
  videoSrc,
  title,
  poster
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Simplified state management
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [hideTimeout, setHideTimeout] = useState<NodeJS.Timeout | null>(null);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isOpen) return;

    const handleLoadedData = () => {
      setIsLoading(false);
      setHasError(false);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      setHasError(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    const handleError = () => {
      setHasError(true);
      setIsLoading(false);
    };

    const handleWaiting = () => {
      setIsLoading(true);
    };

    const handleLoadStart = () => {
      setIsLoading(true);
      setHasError(false);
    };

    // Add event listeners
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('error', handleError);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('loadstart', handleLoadStart);

    // Force load
    video.load();

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('volumechange', handleVolumeChange);
      video.removeEventListener('error', handleError);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('loadstart', handleLoadStart);
    };
  }, [isOpen, videoSrc]);

  // Auto-play when ready
  useEffect(() => {
    if (isOpen && !isLoading && !hasError && !isPlaying && duration > 0) {
      const timer = setTimeout(() => {
        const video = videoRef.current;
        if (video) {
          video.play().catch(console.error);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isLoading, hasError, isPlaying, duration]);

  // FIXED: Control auto-hide logic
  const startHideTimer = () => {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
    }
    
    // Only hide if video is actually playing
    if (isPlaying) {
      const timeout = setTimeout(() => {
        setShowControls(false);
      }, 3000);
      setHideTimeout(timeout);
    }
  };

  const stopHideTimer = () => {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      setHideTimeout(null);
    }
  };

  // Show controls and manage auto-hide
  const showControlsTemporarily = () => {
    setShowControls(true);
    stopHideTimer();
    startHideTimer();
  };

  // Handle mouse movement
  const handleMouseMove = () => {
    showControlsTemporarily();
  };

  // FIXED: Video controls with proper state management
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      // When pausing, show controls and stop auto-hide timer
      setShowControls(true);
      stopHideTimer();
    } else {
      video.play().catch(console.error);
      // When playing, start the auto-hide timer
      startHideTimer();
    }
  };

  // Keep controls visible when paused
  useEffect(() => {
    if (!isPlaying) {
      setShowControls(true);
      stopHideTimer();
    }
  }, [isPlaying]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    video.currentTime = percentage * duration;
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
  };

  const changeVolume = (newVolume: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = newVolume;
    if (newVolume > 0 && isMuted) {
      video.muted = false;
    }
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(console.error);
    } else {
      video.requestFullscreen().catch(console.error);
    }
  };

  const formatTime = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm"
          onClick={onClose}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-[60] w-12 h-12 bg-white/10 backdrop-blur-lg border border-white/20 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
            aria-label="Close video"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Video Container */}
          <div 
            className="w-full h-full flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
            onMouseMove={handleMouseMove}
            onMouseEnter={showControlsTemporarily}
          >
            <div className="relative w-full max-w-6xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl">
              {/* Video Element */}
              <video
                ref={videoRef}
                className="w-full h-full object-contain cursor-pointer"
                poster={poster}
                onClick={togglePlay}
                onDoubleClick={toggleFullscreen}
                preload="metadata"
                playsInline
                controls={false}
              >
                <source src={videoSrc} type="video/mp4" />
                Your browser does not support the video tag.
              </video>

              {/* Loading Overlay */}
              {isLoading && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mb-4"></div>
                    <p className="text-lg">Loading video...</p>
                  </div>
                </div>
              )}

              {/* Error Overlay */}
              {hasError && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                  <div className="text-center text-white">
                    <h3 className="text-xl font-semibold mb-2">Video Error</h3>
                    <p className="text-white/80 mb-4">Failed to load video</p>
                    <button 
                      onClick={() => {
                        setHasError(false);
                        setIsLoading(true);
                        videoRef.current?.load();
                      }}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg mr-2"
                    >
                      Retry
                    </button>
                    <button 
                      onClick={onClose}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

              {/* Center Play Button */}
              <AnimatePresence>
                {showControls && !isLoading && !hasError && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  >
                    <button
                      onClick={togglePlay}
                      className="w-20 h-20 bg-white/10 backdrop-blur-lg border border-white/20 rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-300 group pointer-events-auto"
                      aria-label={isPlaying ? "Pause video" : "Play video"}
                    >
                      {isPlaying ? (
                        <Pause className="w-10 h-10 text-white group-hover:scale-110 transition-transform" />
                      ) : (
                        <Play className="w-10 h-10 text-white ml-1 group-hover:scale-110 transition-transform" fill="currentColor" />
                      )}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Bottom Controls */}
              <AnimatePresence>
                {showControls && !isLoading && !hasError && duration > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.3 }}
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent"
                    onMouseEnter={showControlsTemporarily}
                  >
                    {/* Progress Bar */}
                    <div className="px-6 pt-4">
                      <div 
                        className="w-full h-2 bg-white/20 rounded-full cursor-pointer group"
                        onClick={handleSeek}
                      >
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-150"
                          style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Control Buttons */}
                    <div className="flex items-center justify-between px-6 py-4">
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={togglePlay}
                          className="p-2 hover:bg-white/20 rounded-full transition-colors"
                        >
                          {isPlaying ? (
                            <Pause className="w-6 h-6 text-white" />
                          ) : (
                            <Play className="w-6 h-6 text-white" fill="currentColor" />
                          )}
                        </button>

                        <button
                          onClick={() => {
                            const video = videoRef.current;
                            if (video) video.currentTime = Math.max(0, video.currentTime - 10);
                          }}
                          className="p-2 hover:bg-white/20 rounded-full transition-colors"
                          title="Skip backward 10s"
                        >
                          <SkipBack className="w-5 h-5 text-white" />
                        </button>

                        <button
                          onClick={() => {
                            const video = videoRef.current;
                            if (video) video.currentTime = Math.min(duration, video.currentTime + 10);
                          }}
                          className="p-2 hover:bg-white/20 rounded-full transition-colors"
                          title="Skip forward 10s"
                        >
                          <SkipForward className="w-5 h-5 text-white" />
                        </button>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={toggleMute}
                            className="p-2 hover:bg-white/20 rounded-full transition-colors"
                          >
                            {isMuted ? (
                              <VolumeX className="w-5 h-5 text-white" />
                            ) : (
                              <Volume2 className="w-5 h-5 text-white" />
                            )}
                          </button>

                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={isMuted ? 0 : volume}
                            onChange={(e) => changeVolume(parseFloat(e.target.value))}
                            className="w-20 accent-blue-500"
                          />
                        </div>

                        <div className="text-sm text-white/80 font-mono">
                          {formatTime(currentTime)} / {formatTime(duration)}
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="text-sm text-white/80 font-medium">
                          {title}
                        </div>

                        <button
                          onClick={toggleFullscreen}
                          className="p-2 hover:bg-white/20 rounded-full transition-colors"
                          title="Fullscreen"
                        >
                          <Maximize className="w-5 h-5 text-white" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VideoModal;