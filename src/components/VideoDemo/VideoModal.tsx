/**
 * VIDEO MODAL COMPONENT - COMPLETE IMPLEMENTATION
 * Full-screen video player modal with custom controls
 * Matches AskStan! design system with glass morphism and gradients
 */

import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward } from 'lucide-react';
import { VideoModalProps } from './types';
import { useVideoPlayer } from './useVideoPlayer';

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

  // Auto-hide controls
  const resetControlsTimeout = () => {
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }
    setShowControls(true);
    const timeout = setTimeout(() => {
      if (state.isPlaying) {
        setShowControls(false);
      }
    }, 3000);
    setControlsTimeout(timeout);
  };

  // Show controls on mouse move
  const handleMouseMove = () => {
    resetControlsTimeout();
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

  if (!isSupported) {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
            onClick={onClose}
          >
            <div className="bg-white rounded-lg p-8 text-center">
              <h3 className="text-xl font-bold mb-4">Video Not Supported</h3>
              <p className="text-gray-600 mb-4">Your browser doesn't support video playback.</p>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black"
          onMouseMove={handleMouseMove}
        >
          {/* Close Button */}
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: showControls ? 1 : 0, scale: 1 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute top-6 right-6 z-10 w-12 h-12 bg-black/50 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="Close video"
          >
            <X className="w-6 h-6" />
          </motion.button>

          {/* Video Container */}
          <div className="relative w-full h-full flex items-center justify-center">
            <video
              ref={videoRef}
              className="max-w-full max-h-full"
              poster={poster}
              onClick={() => actions.togglePlay()}
              onError={() => console.error('Video failed to load:', videoSrc)}
            >
              <source src={videoSrc} type="video/mp4" />
              Your browser does not support the video tag.
            </video>

            {/* Loading Spinner */}
            {state.isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
              </div>
            )}

            {/* Error Message */}
            {state.error && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-black/80 backdrop-blur-md rounded-lg p-8 text-center text-white">
                  <h3 className="text-xl font-bold mb-4">Playback Error</h3>
                  <p className="text-gray-300 mb-4">{state.error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
                  >
                    Refresh Page
                  </button>
                </div>
              </div>
            )}

            {/* Play/Pause Overlay */}
            {!state.isPlaying && !state.isLoading && !state.error && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => actions.play()}
                className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer group"
              >
                <div className="w-24 h-24 bg-white/20 backdrop-blur-md border-2 border-white/30 rounded-full flex items-center justify-center group-hover:bg-white/30 group-hover:border-white/50 transition-all duration-300">
                  <Play className="w-10 h-10 text-white ml-2" fill="currentColor" />
                </div>
              </motion.button>
            )}

            {/* Video Controls */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: showControls ? 1 : 0, y: showControls ? 0 : 20 }}
              transition={{ duration: 0.3 }}
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6"
            >
              {/* Progress Bar */}
              <div className="mb-4">
                <div
                  className="w-full h-2 bg-white/20 rounded-full cursor-pointer group"
                  onClick={handleProgressClick}
                >
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-yellow-500 rounded-full relative group-hover:h-3 transition-all duration-200"
                    style={{ width: `${(state.currentTime / state.duration) * 100 || 0}%` }}
                  >
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                  </div>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-between text-white">
                {/* Left Controls */}
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => actions.seek(Math.max(0, state.currentTime - 10))}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                    title="Skip back 10s"
                  >
                    <SkipBack className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => actions.togglePlay()}
                    className="p-3 hover:bg-white/20 rounded-full transition-colors"
                    title={state.isPlaying ? "Pause" : "Play"}
                  >
                    {state.isPlaying ? (
                      <Pause className="w-6 h-6" />
                    ) : (
                      <Play className="w-6 h-6 ml-1" fill="currentColor" />
                    )}
                  </button>

                  <button
                    onClick={() => actions.seek(Math.min(state.duration, state.currentTime + 10))}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                    title="Skip forward 10s"
                  >
                    <SkipForward className="w-5 h-5" />
                  </button>

                  {/* Volume Control */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => actions.toggleMute()}
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
                    onClick={() => actions.toggleFullscreen()}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                    title="Fullscreen"
                  >
                    <Maximize className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};