/**
 * VIDEO MODAL COMPONENT - FIXED LOADING AND CONTROLS
 * Full-screen video player modal with proper loading states and control visibility
 * Ensures controls are always accessible when needed
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
  const [userInteracted, setUserInteracted] = useState(false);

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
    if (isOpen && videoRef.current && !state.isPlaying && !state.isLoading) {
      const timer = setTimeout(() => {
        actions.play();
        setUserInteracted(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, actions, state.isPlaying, state.isLoading]);

  // Pause when modal closes
  useEffect(() => {
    if (!isOpen && state.isPlaying) {
      actions.pause();
    }
  }, [isOpen, state.isPlaying, actions]);

  // IMPROVED: Auto-hide controls logic with better conditions
  useEffect(() => {
    // Clear any existing timeout
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
      setControlsTimeout(null);
    }

    // Always show controls when:
    // - Video is loading
    // - Video is paused
    // - User hasn't interacted yet
    // - Video has error
    if (state.isLoading || !state.isPlaying || !userInteracted || state.error) {
      setShowControls(true);
      return;
    }

    // Only hide controls when video is actually playing and user has interacted
    if (state.isPlaying && userInteracted && !state.isLoading) {
      const timeout = setTimeout(() => {
        setShowControls(false);
      }, 4000); // Longer delay for better UX
      setControlsTimeout(timeout);
    }

    return () => {
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }
    };
  }, [state.isPlaying, state.isLoading, userInteracted, state.error]);

  // IMPROVED: Show controls on mouse move
  const handleMouseMove = () => {
    setUserInteracted(true);
    setShowControls(true);
    
    // Clear existing timeout
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
      setControlsTimeout(null);
    }

    // Set new timeout only if playing and loaded
    if (state.isPlaying && !state.isLoading) {
      const timeout = setTimeout(() => {
        setShowControls(false);
      }, 4000);
      setControlsTimeout(timeout);
    }
  };

  // Format time display
  const formatTime = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Progress bar click handler
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (state.isLoading || !state.duration) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * state.duration;
    actions.seek(newTime);
    setUserInteracted(true);
  };

  // Skip forward/backward
  const handleSkipBackward = () => {
    const newTime = Math.max(0, state.currentTime - 10);
    actions.seek(newTime);
    setUserInteracted(true);
  };

  const handleSkipForward = () => {
    const newTime = Math.min(state.duration, state.currentTime + 10);
    actions.seek(newTime);
    setUserInteracted(true);
  };

  // Handle play/pause toggle
  const handleTogglePlay = () => {
    actions.togglePlay();
    setUserInteracted(true);
    setShowControls(true);
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
          {/* Close Button - Always Visible */}
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute top-6 right-6 z-[60] w-12 h-12 bg-white/10 backdrop-blur-lg border border-white/20 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
            aria-label="Close video"
          >
            <X className="w-6 h-6 text-white" />
          </motion.button>

          {/* Video Container */}
          <div 
            className="w-full h-full flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => {
              setShowControls(true);
              setUserInteracted(true);
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
                onClick={handleTogglePlay}
                onDoubleClick={actions.toggleFullscreen}
                preload="metadata"
              >
                <source src={videoSrc} type="video/mp4" />
                Your browser does not support the video tag.
              </video>

              {/* Loading Overlay - Only show when actually loading */}
              {state.isLoading && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mb-4"></div>
                    <p className="text-white text-lg">Loading video...</p>
                  </div>
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
                    <button 
                      onClick={onClose}
                      className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

              {/* Center Play/Pause Button - Show when paused or controls visible */}
              <AnimatePresence>
                {(showControls && !state.isLoading && !state.error) && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  >
                    <button
                      onClick={handleTogglePlay}
                      className="w-20 h-20 bg-white/10 backdrop-blur-lg border border-white/20 rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-300 group pointer-events-auto"
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

              {/* Bottom Controls Bar - Always show when controls are visible */}
              <AnimatePresence>
                {(showControls && !state.isLoading && !state.error) && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.3 }}
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent"
                    onMouseEnter={() => setShowControls(true)}
                  >
                    {/* Progress Bar */}
                    <div className="px-6 pt-4">
                      <div 
                        className="w-full h-2 bg-white/20 rounded-full cursor-pointer group"
                        onClick={handleProgressClick}
                      >
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-150 group-hover:from-blue-400 group-hover:to-blue-500"
                          style={{ width: `${(state.currentTime / state.duration) * 100 || 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Control Buttons */}
                    <div className="flex items-center justify-between px-6 py-4">
                      {/* Left Controls */}
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={handleTogglePlay}
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
                            onClick={() => {
                              actions.toggleMute();
                              setUserInteracted(true);
                            }}
                            className="p-2 hover:bg-white/20 rounded-full transition-colors"
                            title={state.muted ? "Unmute" : "Mute"}
                          >
                            {state.muted ? (
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
                            value={state.muted ? 0 : state.volume}
                            onChange={(e) => {
                              const newVolume = parseFloat(e.target.value);
                              actions.setVolume(newVolume);
                              if (newVolume > 0 && state.muted) {
                                actions.toggleMute();
                              }
                              setUserInteracted(true);
                            }}
                            className="w-20 accent-blue-500"
                          />
                        </div>

                        {/* Time Display */}
                        <div className="text-sm text-white/80 font-mono">
                          {formatTime(state.currentTime)} / {formatTime(state.duration)}
                        </div>
                      </div>

                      {/* Right Controls */}
                      <div className="flex items-center space-x-4">
                        <div className="text-sm text-white/80 font-medium max-w-xs truncate">
                          {title}
                        </div>

                        <button
                          onClick={() => {
                            actions.toggleFullscreen();
                            setUserInteracted(true);
                          }}
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

              {/* Emergency Controls Overlay - Shows on long press or when video is stuck */}
              {(state.isLoading && userInteracted) && (
                <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-lg rounded-lg p-3">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={handleTogglePlay}
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                      title="Toggle Play/Pause"
                    >
                      {state.isPlaying ? (
                        <Pause className="w-4 h-4 text-white" />
                      ) : (
                        <Play className="w-4 h-4 text-white" fill="currentColor" />
                      )}
                    </button>
                    <span className="text-white text-sm">Loading...</span>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// CRITICAL FIX: Add default export
export default VideoModal;