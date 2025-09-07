/**
 * CUSTOMIZED LANDING PAGE - Updated UI per requirements
 * - AskStan banner on right with white background
 * - Title and hook on left
 * - "Get Started" instead of "Start Free Trial"
 * - Updated pricing: Monthly $19.95, Yearly $143.95
 * - Removed ratings and satisfied creators numbers
 * - Single video demo section only
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
    video.currentTime = percentage * video.duration;
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
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6"
          >
            {/* Progress Bar */}
            <div 
              ref={progressRef}
              className="w-full h-2 bg-white/20 rounded-full cursor-pointer mb-6 group"
              onClick={handleSeek}
            >
              <div 
                className="h-full bg-white rounded-full transition-all duration-150"
                style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
              />
            </div>

            {/* Controls Row */}
            <div className="flex items-center justify-between text-white">
              {/* Left Controls */}
              <div className="flex items-center space-x-4">
                {/* Play/Pause */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePlay();
                  }}
                  className="p-2 text-white/70 hover:text-white transition-colors"
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                </button>

                {/* Skip Back */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const video = videoRef.current;
                    if (video) video.currentTime = Math.max(0, video.currentTime - 10);
                  }}
                  className="p-2 text-white/70 hover:text-white transition-colors"
                  title="Skip back 10s"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>

                {/* Skip Forward */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const video = videoRef.current;
                    if (video) video.currentTime = Math.min(duration, video.currentTime + 10);
                  }}
                  className="p-2 text-white/70 hover:text-white transition-colors"
                  title="Skip forward 10s"
                >
                  <FastForward className="w-5 h-5" />
                </button>

                {/* Volume Controls */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMute();
                    }}
                    className="p-2 text-white/70 hover:text-white transition-colors"
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

const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const [showVideoModal, setShowVideoModal] = useState(false);

  // Your video file path - update this to match your file location
  const DEMO_VIDEO_URL = "/full-demo.mp4"; // Assuming it's in public folder

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - UPDATED LAYOUT */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-screen py-20">
            
            {/* LEFT SIDE - Title and Hook */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500/10 to-yellow-500/10 backdrop-blur-lg border border-gray-200 rounded-full px-6 py-3"
              >
                <Sparkles className="w-5 h-5 text-blue-600" />
                <span className="text-blue-700 font-semibold">AI-Powered Growth</span>
              </motion.div>

              {/* Main Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight"
              >
                <span className="bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900 bg-clip-text text-transparent">
                  Transform Your
                </span>
                <br />
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-yellow-500 bg-clip-text text-transparent">
                  Social Media
                </span>
                <br />
                <span className="bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900 bg-clip-text text-transparent">
                  Growth
                </span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-xl md:text-2xl text-gray-600 leading-relaxed max-w-xl"
              >
                Get personalized AI coaching, proven strategies, and automated workflows that help you grow your social media presence 10x faster.
              </motion.p>

              {/* CTA Button - UPDATED TEXT */}
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
                    Get Started
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>

                <motion.button
                  onClick={() => setShowVideoModal(true)}
                  className="px-8 py-4 bg-gray-100 border border-gray-200 text-gray-700 font-semibold rounded-xl shadow-lg hover:shadow-xl hover:bg-gray-50 transition-all duration-300"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Play className="w-5 h-5" />
                    <span>Watch Demo</span>
                  </div>
                </motion.button>
              </motion.div>
            </motion.div>

            {/* RIGHT SIDE - AskStan Banner with Clean Design */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative flex items-center justify-center"
            >
              {/* Clean Single Background Container */}
              <div className="relative bg-white rounded-3xl shadow-xl p-12 border border-gray-200">
                <img
                  src={askstanBanner}
                  alt="AskStan! AI Social Media Growth Platform"
                  className="w-full h-auto max-w-lg"
                />
                
                {/* Subtle Decorative Elements */}
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-xl" />
                <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-gradient-to-br from-yellow-500/10 to-transparent rounded-full blur-xl" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Single Video Demo Section */}
      <div id="video-demo" className="bg-gray-50">
        <VideoDemo />
      </div>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900 bg-clip-text text-transparent mb-6">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our AI-powered platform provides personalized strategies, automated workflows, and real-time analytics to accelerate your social media growth.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">AI-Powered Coaching</h3>
              <p className="text-gray-600 leading-relaxed">
                Get personalized advice and strategies from our advanced AI that learns your unique style and audience preferences.
              </p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Growth Analytics</h3>
              <p className="text-gray-600 leading-relaxed">
                Track your progress with detailed analytics and insights that help you understand what's working and optimize your strategy.
              </p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center mb-6">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Automated Workflows</h3>
              <p className="text-gray-600 leading-relaxed">
                Streamline your social media management with automated posting, engagement tracking, and response suggestions.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing Section - UPDATED PRICES */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
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
            {/* Monthly Plan - UPDATED PRICE */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Monthly</h3>
                <div className="text-4xl font-black text-gray-900 mb-2">
                  $19.95<span className="text-lg font-normal text-gray-600">/month</span>
                </div>
                <p className="text-gray-600">Perfect for getting started</p>
              </div>

              <ul className="space-y-4 mb-8">
                {[
                  '24/7 AI coaching with Stan',
                  'LinkedIn optimization strategies',
                  'Content creation guidance',
                  'Growth analytics dashboard',
                  'Multi-platform support',
                  'Unlimited AI conversations'
                ].map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link to="/signup" className="block">
                <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold py-3 rounded-xl hover:shadow-lg transition-all duration-300">
                  Get Started - Monthly
                </Button>
              </Link>
            </motion.div>

            {/* Yearly Plan - UPDATED PRICE */}
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
                  $143.95<span className="text-lg font-normal">/year</span>
                </div>
                <p className="text-white/90">Save $95.45 per year!</p>
              </div>

              <ul className="space-y-4 mb-8 text-white">
                {[
                  '24/7 AI coaching with Stan',
                  'LinkedIn optimization strategies',
                  'Content creation guidance',
                  'Growth analytics dashboard',
                  'Multi-platform support',
                  'Unlimited AI conversations'
                ].map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-white/90 mr-3 flex-shrink-0" />
                    <span className="text-white/90">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link to="/signup" className="block">
                <Button className="w-full bg-white text-blue-600 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-all duration-300">
                  Get Started - Yearly
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-r from-blue-500 to-yellow-500 rounded-3xl p-12 shadow-2xl"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Transform Your Social Media?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Join creators and businesses who are already using AskStan! to accelerate their social media growth.
            </p>
            <Link to="/signup">
              <Button
                size="lg"
                className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                Get Started Today
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

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

export default LandingPage;