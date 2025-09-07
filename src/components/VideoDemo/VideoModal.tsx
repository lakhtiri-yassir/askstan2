/**
 * VIDEO MODAL COMPONENT - FIXED AUTO-HIDE CONTROLS
 * Full-screen video player modal with proper control auto-hiding
 * Matches AskStan! design system with glass morphism and gradients
 */

import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward } from 'lucide-react';
import { VideoModalProps } from './types';
import useVideoPlayer from './useVideoPlayer'; // Default import

export const VideoModal: React.FC<VideoModalProps> = ({
  isOpen,
  onClose,
  videoSrc,
  title,
  poster
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { state, actions, isSupported } = useVideoPlayer({ videoRef });
  const [showControls, setShowControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null);

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

  // Auto-play when modal opens
  useEffect(() => {
    if (isOpen && videoRef.current && !state.isPlaying) {
      const timer = setTimeout(() => {
        actions.play();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, actions, state.isPlaying]);

  // Pause when modal closes
  useEffect(() => {
    if (!isOpen && state.isPlaying) {
      actions.pause();
    }
  }, [isOpen, state.isPlaying, actions]);

  // FIXED: Improved auto-hide controls logic
  useEffect(() => {
    // Clear any existing timeout
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
      setControlsTimeout(null);
    }

    if (state.isPlaying) {
      // Hide controls after 3 seconds when playing
      const timeout = setTimeout(() => {
        setShowControls(false);
      }, 3000);
      setControlsTimeout(timeout);
    } else {
      // Always show controls when paused
      setShowControls(true);
    }

    return () => {
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }
    };
  }, [state.isPlaying]); // Only depend on isPlaying, not showControls

  // FIXED: Show controls on mouse move and reset timer
  const handleMouseMove = () => {
    setShowControls(true);
    
    // Clear existing timeout
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
      setControlsTimeout(null);
    }

    // Set new timeout only if playing
    if (state.isPlaying) {
      const timeout = setTimeout(() => {
        setShowControls(false);
      }, 3000);
      setControlsTimeout(timeout);
    }
  };

  // Format time display
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Progress bar click handler
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * state.duration;
    actions.seek(newTime);
  };

  // Skip forward/backward
  const handleSkipBackward = () => {
    const newTime = Math.max(0, state.currentTime - 10);
    actions.seek(newTime);
  };

  const handleSkipForward = () => {
    const newTime = Math.min(state.duration, state.currentTime + 10);
    actions.seek(newTime);
  };

  if (!isSupported) {
    return null;
  }

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
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute top-6 right-6 z-60 w-12 h-12 bg-white/10 backdrop-blur-lg border border-white/20 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
            aria-label="Close video"
          >
            <X className="w-6 h-6 text-white" />
          </motion.button>

          {/* Video Container */}
          <div 
            className="w-full h-full flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => {
              // Hide controls faster when mouse leaves if playing
              if (state.isPlaying) {
                if (controlsTimeout) {
                  clearTimeout(controlsTimeout);
                }
                const timeout = setTimeout(() => {
                  setShowControls(false);
                }, 1000);
                setControlsTimeout(timeout);
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="relative w-full max-w-6xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl"
            >
              {/* Video Element */}
              <video
                ref={videoRef}
                className="w-full h-full object-contain cursor-pointer"
                poster={poster}
                onClick={actions.togglePlay}
                onDoubleClick={actions.toggleFullscreen}
              >
                <source src={videoSrc} type="video/mp4" />
                Your browser does not support the video tag.
              </video>

              {/* Loading Overlay */}
              {state.isLoading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                </div>
              )}

              {/* Error Overlay */}
              {state.error && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <X className="w-8 h-8 text-red-400" />
                    </div>
                    <h3 className="text-white text-xl font-semibold mb-2">Video Error</h3>
                    <p className="text-white/80">{state.error}</p>
                  </div>
                </div>
              )}

              {/* Center Play/Pause Button - Only when paused or controls visible */}
              <AnimatePresence>
                {(showControls && !state.isLoading) && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <button
                      onClick={actions.togglePlay}
                      className="w-20 h-20 bg-white/10 backdrop-blur-lg border border-white/20 rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-300 group"
                      aria-label={state.isPlaying ? "Pause video" : "Play video"}
                    >
                      {state.isPlaying ? (
                        <Pause className="w-10 h-10 text-white group-hover:scale-110 transition-transform" />
                      ) : (
                        <Play className="w-10 h-10 text-white ml-1 group-hover:scale-110 transition-transform" fill="currentColor" />
                      )}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Bottom Controls Bar */}
              <AnimatePresence>
                {(showControls && !state.isLoading) && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.3 }}
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"
                  >
                    {/* Progress Bar */}
                    <div 
                      className="w-full h-2 bg-white/20 cursor-pointer mb-4 group mx-6"
                      onClick={handleProgressClick}
                    >
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-150 group-hover:from-blue-400 group-hover:to-blue-500"
                        style={{ width: `${(state.currentTime / state.duration) * 100 || 0}%` }}
                      />
                    </div>

                    {/* Control Buttons */}
                    <div className="flex items-center justify-between px-6 pb-6">
                      {/* Left Controls */}
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={actions.togglePlay}
                          className="p-2 hover:bg-white/20 rounded-full transition-colors"
                          aria-label={state.isPlaying ? "Pause" : "Play"}
                        >
                          {state.isPlaying ? (
                            <Pause className="w-6 h-6 text-white" />
                          ) : (
                            <Play className="w-6 h-6 text-white" fill="currentColor" />
                          )}
                        </button>

                        <button
                          onClick={handleSkipBackward}
                          className="p-2 hover:bg-white/20 rounded-full transition-colors"
                          title="Skip backward 10s"
                        >
                          <SkipBack className="w-5 h-5 text-white" />
                        </button>

                        <button
                          onClick={handleSkipForward}
                          className="p-2 hover:bg-white/20 rounded-full transition-colors"
                          title="Skip forward 10s"
                        >
                          <SkipForward className="w-5 h-5 text-white" />
                        </button>

                        {/* Volume Controls */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={actions.toggleMute}
                            className="p-2 hover:bg-white/20 rounded-full transition-colors"
                            title={state.muted ? "Unmute" : "Mute"}
                          >
                            {state.muted ? (
                              <VolumeX className="w-5 h-5" />
                            ) : (
                              <Volume2 className="w-5 h-5" />
                            )}
                          </button>

                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={state.muted ? 0 : state.volume}
                            onChange={(e) => {
                              const newVolume = parseFloat(e.target.value);
                              actions.setVolume(newVolume);
                              if (newVolume > 0 && state.muted) {
                                actions.toggleMute();
                              }
                            }}
                            className="w-20 accent-blue-500"
                          />
                        </div>

                        {/* Time Display */}
                        <div className="text-sm text-white/80">
                          {formatTime(state.currentTime)} / {formatTime(state.duration)}
                        </div>
                      </div>

                      {/* Right Controls */}
                      <div className="flex items-center space-x-4">
                        <div className="text-sm text-white/80 font-medium">
                          {title}
                        </div>

                        <button
                          onClick={actions.toggleFullscreen}
                          className="p-2 hover:bg-white/20 rounded-full transition-colors"
                          title="Fullscreen"
                        >
                          <Maximize className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// CRITICAL FIX: Add default export
export default VideoModal;