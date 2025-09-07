/**
 * VIDEO DEMO COMPONENT - FIXED EXPORT ISSUE
 * Main container for video demo section on AskStan! landing page
 * Integrates seamlessly with existing design system and animations
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Sparkles, TrendingUp, Zap, CheckCircle } from 'lucide-react';
import VideoThumbnail from './VideoThumbnail'; // Default import
import VideoModal from './VideoModal'; // Default import
import { VideoProps } from './types';
import askstanBanner from '../../assets/images/hero-image.jpg';

// Updated video sources with correct paths matching your existing setup
const DEFAULT_VIDEO_PROPS: VideoProps = {
  thumbnailSrc: '/demo-thumbnail.mp4', // Short preview video in public folder
  thumbnailWebM: '/demo-thumbnail.webm', // WebM version if available
  fullVideoSrc: '/full-demo.mp4', // Your existing 13-minute demo video
  fallbackImage: askstanBanner, // Use existing hero image as fallback
  title: 'AskStan! Demo Video',
  description: 'Watch our complete 13-minute demo to see exactly how AskStan! transforms your customer support with AI-powered assistance.'
};

interface VideoDemoProps extends Partial<VideoProps> {
  className?: string;
}

export const VideoDemo: React.FC<VideoDemoProps> = ({ 
  className = '',
  ...customProps 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Merge default props with custom props
  const videoProps = { ...DEFAULT_VIDEO_PROPS, ...customProps };

  const handleThumbnailPlay = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Video Demo Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16">
            {/* Section Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500/10 to-yellow-500/10 backdrop-blur-lg border border-white/20 rounded-full px-6 py-3 mb-6">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <span className="text-blue-700 font-semibold">Live Demo</span>
              </div>
              
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900 bg-clip-text text-transparent mb-6">
                See AskStan! in Action
              </h2>
              
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                {videoProps.description}
              </p>
            </motion.div>
          </div>

          {/* Video Container */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative max-w-4xl mx-auto"
          >
            {/* Decorative Background */}
            <div className="absolute -inset-4 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-yellow-500/10 rounded-3xl blur-xl" />
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-transparent rounded-full blur-2xl" />
            <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-gradient-to-br from-yellow-400/20 to-transparent rounded-full blur-2xl" />

            {/* Video Thumbnail */}
            <div className="relative z-10">
              <VideoThumbnail
                thumbnailSrc={videoProps.thumbnailSrc}
                thumbnailWebM={videoProps.thumbnailWebM}
                fallbackImage={videoProps.fallbackImage}
                alt={videoProps.title}
                onPlay={handleThumbnailPlay}
                autoplay={videoProps.autoplay !== false}
                lazyLoad={videoProps.lazyLoad !== false}
              />
            </div>

            {/* Feature Highlights */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12"
            >
              {/* Feature 1 */}
              <div className="flex items-center space-x-3 bg-white/80 backdrop-blur-lg border border-white/20 rounded-xl p-6 shadow-lg">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Real-time Responses</h3>
                  <p className="text-sm text-gray-600">Instant AI-powered answers</p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex items-center space-x-3 bg-white/80 backdrop-blur-lg border border-white/20 rounded-xl p-6 shadow-lg">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Smart Integration</h3>
                  <p className="text-sm text-gray-600">Seamless workflow automation</p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex items-center space-x-3 bg-white/80 backdrop-blur-lg border border-white/20 rounded-xl p-6 shadow-lg">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Proven Results</h3>
                  <p className="text-sm text-gray-600">300% efficiency improvement</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Video Modal */}
      <VideoModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        videoSrc={videoProps.fullVideoSrc}
        title={videoProps.title}
        poster={videoProps.poster}
      />
    </div>
  );
};

// CRITICAL FIX: Add default export
export default VideoDemo;