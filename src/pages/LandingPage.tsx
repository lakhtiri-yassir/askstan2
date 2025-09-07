/**
 * SIMPLIFIED 13-MINUTE VIDEO DEMO SYSTEM
 * Optimized for single 28MB full-demo.mp4 file
 * Clean, professional video player without complexity
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, TrendingUp, Users, Sparkles, CheckCircle, Zap, Play, Pause,
  SkipForward, Volume2, VolumeX, Maximize, X, Clock, 
  FastForward, RotateCcw
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import askstanBanner from '../assets/images/hero-image.jpg';

interface VideoPlayerProps {
  videoSrc: string;
  onClose: () => void;
}

const SimpleVideoPlayer: React.FC<VideoPlayerProps> = ({ videoSrc, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  
  // Video state management
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [buffered, setBuffered] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);

  // Initialize video and event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedData = () => {
      setLoading(false);
      setDuration(video.duration);
      console.log(`✅ Video loaded successfully (${Math.round(video.duration / 60)}:${Math.round(video.duration % 60).toString().padStart(2, '0')})`);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleProgress = () => {
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        setBuffered((bufferedEnd / video.duration) * 100);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    // Attach event listeners
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('progress', handleProgress);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('volumechange', handleVolumeChange);

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('progress', handleProgress);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('volumechange', handleVolumeChange);
    };
  }, []);

  // Auto-hide controls
  useEffect(() => {
    let hideTimer: NodeJS.Timeout;
    if (isPlaying && showControls) {
      hideTimer = setTimeout(() => setShowControls(false), 3000);
    }
    return () => clearTimeout(hideTimer);
  }, [isPlaying, showControls]);

  // Video control functions
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    
    if (video.paused) {
      video.play().catch(console.error);
    } else {
      video.pause();
    }
  }, []);

  const seek = useCallback((time: number) => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = Math.max(0, Math.min(time, duration));
    }
  }, [duration]);

  const skip = useCallback((seconds: number) => {
    seek(currentTime + seconds);
  }, [currentTime, seek]);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = !video.muted;
    }
  }, []);

  const changeVolume = useCallback((newVolume: number) => {
    const video = videoRef.current;
    if (video) {
      video.volume = Math.max(0, Math.min(1, newVolume));
    }
  }, []);

  const changePlaybackRate = useCallback((rate: number) => {
    const video = videoRef.current;
    if (video) {
      video.playbackRate = rate;
      setPlaybackRate(rate);
    }
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (!document.fullscreenElement) {
        await video.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Fullscreen failed:', error);
    }
  }, []);

  // Handle click on progress bar
  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const progressBar = progressRef.current;
    if (!progressBar) return;

    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const progressWidth = rect.width;
    const clickTime = (clickX / progressWidth) * duration;
    
    seek(clickTime);
  }, [duration, seek]);

  // Format time display
  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black z-50 flex flex-col"
      onMouseMove={() => setShowControls(true)}
      onClick={() => setShowControls(true)}
    >
      {/* Video Element */}
      <div className="flex-1 relative bg-black flex items-center justify-center">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin" />
            <p className="text-white ml-4 text-lg">Loading demo video...</p>
          </div>
        )}
        
        <video
          ref={videoRef}
          className="max-w-full max-h-full object-contain"
          src={videoSrc}
          preload="metadata"
          onLoadStart={() => setLoading(true)}
          onClick={togglePlay}
        >
          Your browser does not support the video tag.
        </video>

        {/* Close Button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Enhanced Controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="bg-gradient-to-t from-black/90 via-black/70 to-transparent p-4"
          >
            {/* Progress Bar */}
            <div className="mb-4">
              <div 
                ref={progressRef}
                onClick={handleProgressClick}
                className="relative h-2 bg-white/20 rounded-full cursor-pointer group"
              >
                {/* Buffered Progress */}
                <div 
                  className="absolute h-full bg-white/30 rounded-full transition-all"
                  style={{ width: `${buffered}%` }}
                />
                {/* Played Progress */}
                <div 
                  className="absolute h-full bg-gradient-to-r from-blue-500 to-yellow-500 rounded-full transition-all"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
                {/* Progress Thumb */}
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ left: `${(currentTime / duration) * 100}%`, marginLeft: '-8px' }}
                />
              </div>
              
              {/* Time Display */}
              <div className="flex justify-between items-center mt-2 text-sm text-white/80">
                <span>{formatTime(currentTime)}</span>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>{formatTime(duration - currentTime)} remaining</span>
                </div>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              {/* Left Controls */}
              <div className="flex items-center space-x-3">
                {/* Play/Pause */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={togglePlay}
                  className="w-12 h-12 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 rounded-full flex items-center justify-center text-white transition-colors"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5 ml-1" fill="currentColor" />
                  )}
                </motion.button>

                {/* Skip Controls */}
                <button
                  onClick={() => skip(-10)}
                  className="p-2 text-white/70 hover:text-white transition-colors"
                  title="Rewind 10s"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
                <button
                  onClick={() => skip(30)}
                  className="p-2 text-white/70 hover:text-white transition-colors"
                  title="Skip 30s"
                >
                  <FastForward className="w-5 h-5" />
                </button>

                {/* Volume Controls */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={toggleMute}
                    className="p-2 text-white/70 hover:text-white transition-colors"
                  >
                    {isMuted || volume === 0 ? (
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
                    value={isMuted ? 0 : volume}
                    onChange={(e) => {
                      const newVolume = parseFloat(e.target.value);
                      changeVolume(newVolume);
                      if (newVolume > 0 && isMuted) {
                        toggleMute();
                      }
                    }}
                    className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
              </div>

              {/* Center Info */}
              <div className="hidden sm:flex items-center text-white/80 text-sm">
                <span>AskStan! Complete Demo</span>
              </div>

              {/* Right Controls */}
              <div className="flex items-center space-x-3">
                {/* Playback Speed */}
                <select
                  value={playbackRate}
                  onChange={(e) => changePlaybackRate(parseFloat(e.target.value))}
                  className="bg-black/50 text-white border border-white/20 rounded px-2 py-1 text-sm"
                >
                  <option value={0.5}>0.5×</option>
                  <option value={0.75}>0.75×</option>
                  <option value={1}>1×</option>
                  <option value={1.25}>1.25×</option>
                  <option value={1.5}>1.5×</option>
                  <option value={2}>2×</option>
                </select>

                {/* Fullscreen */}
                <button
                  onClick={toggleFullscreen}
                  className="p-2 text-white/70 hover:text-white transition-colors"
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
  );
};

export const LandingPage: React.FC = () => {
  const { user, clearSession } = useAuth();
  const [showVideoModal, setShowVideoModal] = useState(false);

  // Your video file path - update this to match your file location
  const DEMO_VIDEO_URL = "/full-demo.mp4"; // Assuming it's in public folder

  const handleClearSession = () => {
    clearSession();
    window.location.reload();
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const createVideoPreview = () => {
    return (
      <div className="w-full h-full bg-gradient-to-br from-blue-500 via-purple-500 to-yellow-500 flex flex-col justify-between p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Play className="w-6 h-6" />
            <span className="font-bold text-lg">Complete Demo</span>
          </div>
          <div className="bg-black/30 px-3 py-1 rounded-lg text-sm">
            13:00
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="font-bold text-xl mb-4">See AskStan! In Action:</h3>
          <div className="grid grid-cols-1 gap-3 text-sm">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>Complete platform walkthrough</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>AI coach generating real strategies</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>Live content creation process</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>Analytics and growth tracking</span>
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-sm opacity-90">13 minutes • 28MB • HD Quality</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50">
      {/* Debug Session Info - Remove in production */}
      {user && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-100 border border-blue-300 text-blue-800 p-3 text-center"
        >
          <p className="text-sm">
            Logged in as: {user.email} | Status: {user.email_confirmed_at ? 'Confirmed' : 'Pending Confirmation'}
            <button 
              onClick={handleClearSession}
              className="ml-4 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
            >
              Clear Session
            </button>
          </p>
        </motion.div>
      )}

      {/* Video Modal */}
      <AnimatePresence>
        {showVideoModal && (
          <SimpleVideoPlayer
            videoSrc={DEMO_VIDEO_URL}
            onClose={() => setShowVideoModal(false)}
          />
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-yellow-50/50" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1)_0%,transparent_50%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(245,158,11,0.1)_0%,transparent_50%)] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-16 items-center">
            
            {/* LEFT SIDE - Hero Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              {/* Hero Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-yellow-100 rounded-full border border-blue-200/50"
              >
                <Sparkles className="w-4 h-4 text-blue-600 mr-2" />
                <span className="text-blue-800 font-medium text-sm">AI-Powered Growth</span>
              </motion.div>

              {/* Main Heading */}
              <div>
                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 tracking-tight"
                >
                  <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-yellow-500 bg-clip-text text-transparent">
                    Grow Your Social Media
                  </span>
                  <br />
                  <span className="text-gray-900">With AI Coach</span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed"
                >
                  Get personalized strategies, content ideas, and growth tips from your AI-powered social media coach. Watch our complete 13-minute demo to see exactly how it works.
                </motion.p>
              </div>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Link to="/auth">
                  <Button 
                    size="lg" 
                    className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 to-yellow-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <span>Start Growing Today</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600 to-yellow-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
                  </Button>
                </Link>

                <motion.button
                  onClick={() => setShowVideoModal(true)}
                  className="px-8 py-4 bg-white/80 backdrop-blur-lg border border-gray-200 text-gray-700 font-semibold rounded-xl shadow-lg hover:shadow-xl hover:bg-white transition-all duration-300 text-center"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Play className="w-5 h-5" />
                    <span>Watch Full Demo</span>
                  </div>
                </motion.button>
              </motion.div>

              {/* Social Proof */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="flex items-center space-x-6 pt-4"
              >
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-600 font-medium">1000+ Users</span>
                </div>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span className="text-gray-600 font-medium">300% Growth</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-purple-600" />
                  <span className="text-gray-600 font-medium">13-Min Demo</span>
                </div>
              </motion.div>
            </motion.div>

            {/* RIGHT SIDE - Video Preview */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              {/* Decorative Background Elements */}
              <div className="absolute -inset-4 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-yellow-500/10 rounded-3xl blur-xl" />
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-transparent rounded-full blur-2xl" />
              <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-gradient-to-br from-yellow-400/20 to-transparent rounded-full blur-2xl" />
              
              {/* Video Preview Container */}
              <div 
                className="relative z-10 aspect-video rounded-2xl overflow-hidden bg-white/80 backdrop-blur-lg border border-white/20 shadow-2xl group cursor-pointer"
                onClick={() => setShowVideoModal(true)}
              >
                {/* Video Preview Content */}
                <div className="relative w-full h-full">
                  {createVideoPreview()}

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Central Play Button */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <motion.button
                      className="w-20 h-20 bg-white/20 backdrop-blur-md border-2 border-white/30 rounded-full flex items-center justify-center group/button hover:bg-white/30 hover:border-white/50 transition-all duration-300"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowVideoModal(true);
                      }}
                    >
                      <Play className="w-8 h-8 text-white ml-1" fill="currentColor" />
                    </motion.button>
                  </div>

                  {/* Duration Badge */}
                  <div className="absolute top-4 right-4 px-3 py-1 bg-black/70 backdrop-blur-md text-white text-sm font-medium rounded-lg">
                    13:00
                  </div>

                  {/* Quality Badge */}
                  <div className="absolute top-4 left-4 px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-lg">
                    HD
                  </div>

                  {/* File Size Badge */}
                  <div className="absolute bottom-4 right-4 flex items-center px-3 py-1 bg-purple-500/90 backdrop-blur-md text-white text-sm font-medium rounded-lg">
                    <span>28MB</span>
                  </div>

                  {/* Complete Demo Badge */}
                  <div className="absolute bottom-4 left-4 flex items-center px-3 py-1 bg-green-500/90 backdrop-blur-md text-white text-sm font-medium rounded-lg">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    <span>Complete Demo</span>
                  </div>
                </div>
              </div>

              {/* Video Description */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="mt-6 text-center"
              >
                <p className="text-gray-600 font-medium mb-2">
                  Complete AskStan! platform demonstration
                </p>
                <p className="text-sm text-gray-500">
                  See real AI coaching, content creation, and growth strategies
                </p>
              </motion.div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-50">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(59,130,246,0.1)_0%,transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_75%,rgba(245,158,11,0.1)_0%,transparent_50%)]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-blue-600 to-yellow-500 bg-clip-text text-transparent">
                Powerful AI Features
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to dominate social media, powered by cutting-edge AI technology
            </p>
          </motion.div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Sparkles,
                title: "Content Generation",
                description: "AI creates engaging posts tailored to your brand and audience",
                color: "from-blue-500 to-purple-500"
              },
              {
                icon: TrendingUp,
                title: "Growth Analytics",
                description: "Real-time insights and recommendations for exponential growth",
                color: "from-purple-500 to-pink-500"
              },
              {
                icon: Zap,
                title: "Smart Scheduling",
                description: "Optimal posting times based on your audience's behavior",
                color: "from-yellow-500 to-red-500"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group relative"
              >
                <div className="h-full p-8 bg-white/80 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mb-6`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Features Highlight Section */}
      <section className="py-20 relative overflow-hidden bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                What's in the Complete Demo?
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              A comprehensive 13-minute walkthrough showing every feature, strategy, and result that makes AskStan! your ultimate growth partner
            </p>
            
            {/* Demo Stats */}
            <div className="flex flex-wrap justify-center gap-6 mb-8">
              <div className="bg-white/60 backdrop-blur-lg border border-white/20 rounded-xl px-6 py-3">
                <div className="text-2xl font-bold text-blue-600">13:00</div>
                <div className="text-sm text-gray-600">Duration</div>
              </div>
              <div className="bg-white/60 backdrop-blur-lg border border-white/20 rounded-xl px-6 py-3">
                <div className="text-2xl font-bold text-purple-600">28MB</div>
                <div className="text-sm text-gray-600">File Size</div>
              </div>
              <div className="bg-white/60 backdrop-blur-lg border border-white/20 rounded-xl px-6 py-3">
                <div className="text-2xl font-bold text-green-600">HD</div>
                <div className="text-sm text-gray-600">Quality</div>
              </div>
            </div>
          </motion.div>

          {/* What You'll See Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Platform Overview",
                description: "Complete walkthrough of the AskStan! interface and navigation",
                duration: "2-3 minutes",
                icon: "🎯"
              },
              {
                title: "AI Coach in Action",
                description: "Watch real AI-generated strategies and content recommendations",
                duration: "4-5 minutes", 
                icon: "🤖"
              },
              {
                title: "Content Creation",
                description: "See how AI creates posts, captions, and hashtag strategies",
                duration: "3-4 minutes",
                icon: "✨"
              },
              {
                title: "Growth Analytics",
                description: "Real-time metrics, insights, and performance tracking",
                duration: "2-3 minutes",
                icon: "📈"
              },
              {
                title: "Success Stories",
                description: "Actual user results and transformation examples",
                duration: "1-2 minutes",
                icon: "🏆"
              },
              {
                title: "Getting Started",
                description: "How to begin your growth journey with AskStan!",
                duration: "1 minute",
                icon: "🚀"
              }
            ].map((section, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group cursor-pointer"
                onClick={() => setShowVideoModal(true)}
              >
                <div className="h-full p-6 bg-white/80 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="text-3xl mb-4">{section.icon}</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {section.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">
                    {section.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-blue-600 font-medium">{section.duration}</span>
                    <div className="flex items-center text-blue-600 text-sm group-hover:translate-x-1 transition-transform">
                      <Play className="w-4 h-4 mr-1" />
                      <span>Watch now</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Watch Now CTA */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <motion.button
              onClick={() => setShowVideoModal(true)}
              className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-center space-x-2">
                <Play className="w-6 h-6" fill="currentColor" />
                <span>Watch Complete Demo Now</span>
              </div>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-yellow-500" />
        <div className="absolute inset-0 bg-black/20" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Transform Your Social Media?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Join thousands of creators who've accelerated their growth with AI
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button 
                  size="lg" 
                  className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl shadow-lg hover:shadow-xl hover:bg-gray-50 transition-all duration-300 w-full sm:w-auto"
                >
                  Get Started Free
                </Button>
              </Link>
              <motion.button
                onClick={() => setShowVideoModal(true)}
                className="px-8 py-4 bg-white/10 backdrop-blur-md border-2 border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-all duration-300"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Play className="w-5 h-5" />
                  <span>Watch Demo Again</span>
                </div>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};