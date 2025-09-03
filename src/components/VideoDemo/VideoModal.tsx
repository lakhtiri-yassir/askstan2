/**
 * VIDEO MODAL COMPONENT
 * Full-screen video player modal with custom controls
 * Matches AskStan! design system with glass morphism and gradients
 */

import React, { useRef, useEffect } from 'react';
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
      // Small delay to ensure video is ready
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
  }, [isOpen, actions, state.isPlaying]);

  // Format time for display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle progress bar click
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * state.duration;
    actions.seek(newTime);
  };

  // Handle volume slider change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    actions.setVolume(newVolume);
    if (newVolume > 0 && state.muted) {
      actions.toggleMute();
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal Content */}
          <motion.div
            className="relative w-full max-w-6xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Close Button */}
            <motion.button
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/30"
              onClick={onClose}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Close video"
            >
              <X className="w-5 h-5" />
            </motion.button>

            {/* Video Player */}
            <div className="relative w-full h-full group">
              <video
                ref={videoRef}
                className="w-full h-full object-contain bg-black"
                poster={poster}
                preload="metadata"
                aria-label={title}
              >
                <source src={videoSrc} type="video/mp4" />
                Your browser does not support the video tag.
              </video>

              {/* Video Controls Overlay */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto"
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
              >
                {/* Top Controls */}
                <div className="absolute top-0 left-0 right-0 p-6">
                  <h3 className="text-white text-xl font-semibold mb-2">{title}</h3>
                </div>

                {/* Center Play/Pause Button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.button
                    className="w-20 h-20 bg-white/10 backdrop-blur-md border-2 border-white/30 rounded-full flex items-center justify-center text-white hover:bg-white/20 hover:border-white/50 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-white/30"
                    onClick={actions.togglePlay}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label={state.isPlaying ? "Pause video" : "Play video"}
                  >
                    {state.isPlaying ? (
                      <Pause className="w-8 h-8" />
                    ) : (
                      <Play className="w-8 h-8 ml-1" fill="currentColor" />
                    )}
                  </motion.button>
                </div>

                {/* Bottom Controls */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div
                      className="relative h-2 bg-white/20 rounded-full cursor-pointer group/progress"
                      onClick={handleProgressClick}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-yellow-500 rounded-full origin-left transform-gpu transition-transform duration-75"
                        style={{ 
                          transform: `scaleX(${state.duration > 0 ? state.currentTime / state.duration : 0})`
                        }}
                      />
                      <div 
                        className="absolute w-4 h-4 bg-white rounded-full shadow-lg transform -translate-y-1 opacity-0 group-hover/progress:opacity-100 transition-opacity"
                        style={{ 
                          left: `${state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0}%`,
                          transform: 'translateX(-50%) translateY(-25%)'
                        }}
                      />
                    </div>
                  </div>

                  {/* Control Bar */}
                  <div className="flex items-center justify-between">
                    {/* Left Controls */}
                    <div className="flex items-center space-x-4">
                      {/* Play/Pause */}
                      <button
                        className="w-10 h-10 flex items-center justify-center text-white hover:text-blue-400 transition-colors focus:outline-none focus:text-blue-400"
                        onClick={actions.togglePlay}
                        aria-label={state.isPlaying ? "Pause" : "Play"}
                      >
                        {state.isPlaying ? (
                          <Pause className="w-6 h-6" />
                        ) : (
                          <Play className="w-6 h-6 ml-0.5" fill="currentColor" />
                        )}
                      </button>

                      {/* Skip Controls */}
                      <button
                        className="w-8 h-8 flex items-center justify-center text-white hover:text-blue-400 transition-colors focus:outline-none focus:text-blue-400"
                        onClick={() => actions.seek(Math.max(0, state.currentTime - 10))}
                        aria-label="Skip back 10 seconds"
                      >
                        <SkipBack className="w-5 h-5" />
                      </button>

                      <button
                        className="w-8 h-8 flex items-center justify-center text-white hover:text-blue-400 transition-colors focus:outline-none focus:text-blue-400"
                        onClick={() => actions.seek(Math.min(state.duration, state.currentTime + 10))}
                        aria-label="Skip forward 10 seconds"
                      >
                        <SkipForward className="w-5 h-5" />
                      </button>

                      {/* Volume Controls */}
                      <div className="flex items-center space-x-2">
                        <button
                          className="w-8 h-8 flex items-center justify-center text-white hover:text-blue-400 transition-colors focus:outline-none focus:text-blue-400"
                          onClick={actions.toggleMute}
                          aria-label={state.muted ? "Unmute" : "Mute"}
                        >
                          {state.muted || state.volume === 0 ? (
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
                          onChange={handleVolumeChange}
                          className="w-20 h-1 bg-white/20 rounded-full appearance-none cursor-pointer slider"
                          aria-label="Volume"
                        />
                      </div>

                      {/* Time Display */}
                      <div className="text-white text-sm font-mono">
                        {formatTime(state.currentTime)} / {formatTime(state.duration)}
                      </div>
                    </div>

                    {/* Right Controls */}
                    <div className="flex items-center space-x-4">
                      {/* Fullscreen */}
                      <button
                        className="w-8 h-8 flex items-center justify-center text-white hover:text-blue-400 transition-colors focus:outline-none focus:text-blue-400"
                        onClick={actions.toggleFullscreen}
                        aria-label={state.isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                      >
                        <Maximize className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Loading Overlay */}
              {state.isLoading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="w-12 h-12 border-4 border-white/20 border-t-blue-500 rounded-full animate-spin" />
                </div>
              )}

              {/* Error State */}
              {state.error && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white p-8">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                      <X className="w-8 h-8 text-red-400" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Video Unavailable</h3>
                    <p className="text-gray-300 mb-4">{state.error}</p>
                    <button
                      onClick={onClose}
                      className="px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};