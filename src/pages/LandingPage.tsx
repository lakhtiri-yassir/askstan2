/**
 * COMPLETE LANDING PAGE - ORIGINAL RESTORED WITH VIDEODEMO INTEGRATION
 * Full LandingPage.tsx preserving all original content (890+ lines)
 * Only replaced the video section with VideoDemo component
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
import { VideoDemo } from '../components/VideoDemo';
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
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (video.buffered.length > 0) {
        setBuffered((video.buffered.end(0) / video.duration) * 100);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('volumechange', handleVolumeChange);

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('volumechange', handleVolumeChange);
    };
  }, []);

  // Auto-hide controls
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setTimeout(() => {
      setShowControls(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [isPlaying, showControls]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    const progressBar = progressRef.current;
    if (!video || !progressBar) return;

    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    video.currentTime = percentage * duration;
  };

  const changeVolume = (newVolume: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.volume = newVolume;
    if (newVolume === 0) {
      video.muted = true;
    } else if (isMuted) {
      video.muted = false;
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
  };

  const changePlaybackRate = (rate: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const toggleFullscreen = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (isFullscreen) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } else {
        await video.requestFullscreen();
        setIsFullscreen(true);
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center"
      onMouseMove={() => setShowControls(true)}
      onClick={togglePlay}
    >
      {/* Close Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: showControls ? 1 : 0, scale: 1 }}
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-6 right-6 z-10 w-12 h-12 bg-black/50 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
      >
        <X className="w-6 h-6" />
      </motion.button>

      {/* Video Element */}
      <video
        ref={videoRef}
        className="max-w-full max-h-full"
        src={videoSrc}
        onLoadStart={() => setLoading(true)}
        onClick={(e) => e.stopPropagation()}
      />

      {/* Loading Spinner */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
        </div>
      )}

      {/* Video Controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Progress Bar */}
            <div className="mb-4">
              <div
                ref={progressRef}
                className="w-full h-2 bg-white/20 rounded-full cursor-pointer group"
                onClick={handleSeek}
              >
                {/* Buffered Progress */}
                <div
                  className="absolute h-full bg-white/30 rounded-full"
                  style={{ width: `${buffered}%` }}
                />
                {/* Current Progress */}
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-yellow-500 rounded-full relative group-hover:h-3 transition-all duration-200"
                  style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
                >
                  <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between text-white">
              {/* Left Controls */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => {
                    const video = videoRef.current;
                    if (video) video.currentTime = Math.max(0, currentTime - 10);
                  }}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>

                <button
                  onClick={togglePlay}
                  className="p-3 hover:bg-white/20 rounded-full transition-colors"
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                </button>

                <button
                  onClick={() => {
                    const video = videoRef.current;
                    if (video) video.currentTime = Math.min(duration, currentTime + 10);
                  }}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <FastForward className="w-5 h-5" />
                </button>

                {/* Volume Control */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={toggleMute}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
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

                {/* Time Display */}
                <div className="text-sm text-white/80">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>

              {/* Center Title */}
              <div className="absolute left-1/2 transform -translate-x-1/2 text-lg font-semibold">
                AskStan! Complete Demo
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
          <h3 className="font-bold text-xl mb-4">See AskStan! in Action</h3>
          <ul className="space-y-2 text-sm opacity-90">
            <li>• AI coaching and strategy development</li>
            <li>• Real-time content optimization</li>
            <li>• Analytics and growth insights</li>
            <li>• Platform walkthrough and setup</li>
          </ul>
        </div>
        
        <div className="text-center">
          <p className="text-xs opacity-75">
            Complete 13-minute platform demonstration
          </p>
          <p className="text-sm text-gray-500">
            See real AI coaching, content creation, and growth strategies
          </p>
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
            Logged in as: {user.email} | Status: {user.email_confirmed_at ? 'Verified' : 'Unverified'} | 
            <button 
              onClick={handleClearSession}
              className="ml-2 text-blue-600 hover:text-blue-800 underline"
            >
              Clear Session
            </button>
          </p>
        </motion.div>
      )}

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={askstanBanner}
            alt="AskStan! Hero Background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/70 via-purple-900/50 to-yellow-900/70" />
          <div className="absolute inset-0 bg-black/20" />
        </div>

        {/* Animated Background Elements */}
        <div className="absolute inset-0 z-10">
          <div className="absolute top-20 left-20 w-32 h-32 bg-blue-500/20 rounded-full blur-xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-40 h-40 bg-yellow-500/20 rounded-full blur-xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/10 rounded-full blur-2xl animate-pulse delay-2000" />
        </div>

        {/* Hero Content */}
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="space-y-8"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="inline-flex items-center px-6 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-full text-white"
            >
              <Sparkles className="w-5 h-5 mr-2 text-yellow-400" />
              <span className="font-medium">AI-Powered Social Media Growth</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="text-5xl md:text-7xl lg:text-8xl font-black leading-tight"
            >
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-yellow-400 bg-clip-text text-transparent">
                Meet AskStan!
              </span>
              <br />
              <span className="text-white">Your AI Coach</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed"
            >
              Transform your social media presence with personalized AI coaching. 
              Get real-time feedback, content strategies, and growth insights that actually work.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.7 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8"
            >
              <Link to="/signup">
                <Button
                  size="lg"
                  className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 to-yellow-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-0 text-lg"
                >
                  <span className="flex items-center">
                    Start Free Trial
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Button>
              </Link>

              <motion.button
                onClick={() => setShowVideoModal(true)}
                className="px-8 py-4 bg-white/10 backdrop-blur-lg border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-all duration-300 text-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="flex items-center space-x-2">
                  <Play className="w-5 h-5" />
                  <span>Watch Demo</span>
                </div>
              </motion.button>
            </motion.div>

            {/* Social Proof */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.9 }}
              className="pt-12 flex items-center justify-center space-x-8 text-white/70"
            >
              <div className="flex items-center">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="w-5 h-5 bg-yellow-400 rounded-full" />
                  ))}
                </div>
                <span className="ml-2 text-sm">5.0 rating</span>
              </div>
              <div className="w-px h-6 bg-white/20" />
              <span className="text-sm">1000+ satisfied creators</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ORIGINAL HERO SECTION WITH EMBEDDED VIDEO - NOW REPLACED WITH VIDEODEMO */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-yellow-50">
        {/* Background decorations */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(59,130,246,0.1)_0%,transparent_50%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_75%,rgba(245,158,11,0.1)_0%,transparent_50%)] pointer-events-none" />

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
                <Link to="/signup">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-500 to-yellow-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-0"
                  >
                    Start Free Trial
                  </Button>
                </Link>

                <motion.button
                  onClick={() => setShowVideoModal(true)}
                  className="px-8 py-4 bg-white/80 backdrop-blur-lg border border-gray-200 text-gray-700 font-semibold rounded-xl shadow-lg hover:shadow-xl hover:bg-white transition-all duration-300"
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
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Video Demo Section - ENHANCED WITH VIDEODEMO COMPONENT */}
      <div id="video-demo">
        <VideoDemo />
      </div>

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
              },
              {
                icon: Users,
                title: "Audience Insights",
                description: "Deep understanding of your followers and engagement patterns",
                color: "from-green-500 to-blue-500"
              },
              {
                icon: CheckCircle,
                title: "Content Optimization",
                description: "AI-powered recommendations to maximize reach and engagement",
                color: "from-pink-500 to-purple-500"
              },
              {
                icon: Clock,
                title: "24/7 Coaching",
                description: "Round-the-clock AI guidance for consistent growth",
                color: "from-orange-500 to-red-500"
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

      {/* Pricing Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-yellow-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black mb-6">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-yellow-500 bg-clip-text text-transparent">
                Simple Pricing
              </span>
              <br />
              <span className="text-gray-900">That Grows With You</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose the plan that fits your needs. Upgrade or downgrade anytime.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Monthly Plan */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Monthly</h3>
                <div className="text-4xl font-black text-gray-900 mb-2">
                  $4.99<span className="text-lg font-normal text-gray-600">/month</span>
                </div>
                <p className="text-gray-600">Perfect for getting started</p>
              </div>

              <ul className="space-y-4 mb-8">
                {[
                  'AI-powered content recommendations',
                  'Basic analytics and insights',
                  'Community access',
                  'Email support'
                ].map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link to="/signup" className="block">
                <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold py-3 rounded-xl hover:shadow-lg transition-all duration-300">
                  Start Monthly Plan
                </Button>
              </Link>
            </motion.div>

            {/* Yearly Plan */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-blue-500 to-yellow-500 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden"
            >
              {/* Popular Badge */}
              <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md text-white text-sm font-bold px-3 py-1 rounded-full">
                Most Popular
              </div>

              <div className="text-center mb-8 text-white">
                <h3 className="text-2xl font-bold mb-2">Yearly</h3>
                <div className="text-4xl font-black mb-2">
                  $49.99<span className="text-lg font-normal">/year</span>
                </div>
                <p className="text-white/90">Save $10 per year!</p>
              </div>

              <ul className="space-y-4 mb-8 text-white">
                {[
                  'Everything in Monthly',
                  'Advanced analytics dashboard',
                  'Priority support',
                  'Custom AI training',
                  'Exclusive community features'
                ].map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-yellow-300 mr-3 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link to="/signup" className="block">
                <Button className="w-full bg-white text-blue-600 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-all duration-300">
                  Start Yearly Plan
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-blue-600 to-yellow-500 bg-clip-text text-transparent">
                Success Stories
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See how AskStan! has transformed social media growth for creators worldwide
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Johnson",
                role: "Content Creator",
                avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b3de?w=150&h=150&fit=crop&crop=face",
                testimonial: "AskStan! helped me grow from 500 to 15K followers in just 3 months. The AI insights were game-changing!",
                metrics: "2900% growth"
              },
              {
                name: "Mike Chen",
                role: "Small Business Owner",
                avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
                testimonial: "The personalized strategies saved me hours of planning. My engagement rate increased by 400%.",
                metrics: "400% engagement"
              },
              {
                name: "Emma Rodriguez",
                role: "Lifestyle Blogger",
                avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
                testimonial: "Finally, an AI tool that understands my brand voice. My content performance has never been better.",
                metrics: "300% reach"
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-center mb-6">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <div>
                    <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                    <p className="text-gray-600 text-sm">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-700 mb-4 leading-relaxed">"{testimonial.testimonial}"</p>
                <div className="text-blue-600 font-bold text-lg">{testimonial.metrics}</div>
              </motion.div>
            ))}
          </div>
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
              <Link to="/signup">
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

            {/* Trust Indicators */}
            <div className="pt-12 flex items-center justify-center space-x-8 text-white/70">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                <span className="text-sm">Secure & Private</span>
              </div>
              <div className="w-px h-6 bg-white/20" />
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                <span className="text-sm">No Setup Required</span>
              </div>
              <div className="w-px h-6 bg-white/20" />
              <div className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                <span className="text-sm">Cancel Anytime</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-2xl font-bold mb-4">
                <span className="bg-gradient-to-r from-blue-400 to-yellow-400 bg-clip-text text-transparent">
                  AskStan!
                </span>
              </h3>
              <p className="text-gray-400 mb-4 max-w-md">
                Your AI-powered social media coach. Transform your online presence with personalized insights and strategies.
              </p>
              <div className="flex space-x-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="w-4 h-4 bg-yellow-400 rounded-full" />
                  ))}
                </div>
                <span className="text-sm text-gray-400">Trusted by 1000+ creators</span>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#video-demo" className="hover:text-white transition-colors">Demo</a></li>
                <li><Link to="/plans" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link to="/signup" className="hover:text-white transition-colors">Sign Up</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><a href="mailto:support@askstan.ai" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 AskStan! All rights reserved. Built with ❤️ for creators.</p>
          </div>
        </div>
      </footer>

      {/* Video Modal */}
      <AnimatePresence>
        {showVideoModal && (
          <SimpleVideoPlayer
            videoSrc={DEMO_VIDEO_URL}
            onClose={() => setShowVideoModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};