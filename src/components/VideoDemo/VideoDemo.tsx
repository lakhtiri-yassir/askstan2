/**
 * VIDEO DEMO COMPONENT
 * Main container for video demo section on AskStan! landing page
 * Integrates seamlessly with existing design system and animations
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Sparkles, TrendingUp } from 'lucide-react';
import { VideoThumbnail } from './VideoThumbnail';
import { VideoModal } from './VideoModal';
import { VideoProps } from './types';

// Default video sources - replace these paths with your actual video files
const DEFAULT_VIDEO_PROPS: VideoProps = {
  thumbnailSrc: '../../assets/videos/demo-thumbnail.mp4',
  thumbnailWebM: '../../assets/videos/demo-thumbnail.webm',
  fullVideoSrc: '../../assets/videos/full-demo.mp4',
  fallbackImage: '../../assets/images/video-fallback.jpg',
  title: 'AskStan! Product Demo',
  description: 'Watch how our AI coach transforms your social media strategy in real-time',
  autoplay: true,
  muted: true,
  loop: true,
  lazyLoad: true
};

export const VideoDemo: React.FC<Partial<VideoProps>> = (props) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const videoProps = { ...DEFAULT_VIDEO_PROPS, ...props };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <>
      {/* Video Demo Section */}
      <section className="py-20 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-yellow-50/50" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1)_0%,transparent_50%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(245,158,11,0.1)_0%,transparent_50%)] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-16 items-center">
            
            {/* LEFT SIDE - Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              {/* Section Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-yellow-100 rounded-full border border-blue-200/50"
              >
                <Play className="w-4 h-4 text-blue-600 mr-2" />
                <span className="text-blue-800 font-medium text-sm">Live Demo</span>
              </motion.div>

              {/* Main Heading */}
              <div>
                <motion.h2
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  viewport={{ once: true }}
                  className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 tracking-tight"
                >
                  <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-yellow-500 bg-clip-text text-transparent">
                    See AskStan!
                  </span>
                  <br />
                  <span className="text-gray-900">in Action</span>
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  viewport={{ once: true }}
                  className="text-xl md:text-2xl text-gray-600 leading-relaxed"
                >
                  {videoProps.description}
                </motion.p>
              </div>

              {/* Feature Highlights */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                viewport={{ once: true }}
                className="space-y-4"
              >
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">AI-Powered Insights</h3>
                    <p className="text-gray-600">See how Stan analyzes your content and provides personalized recommendations.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-yellow-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Real-Time Strategy</h3>
                    <p className="text-gray-600">Watch the platform adapt and evolve strategies based on your goals.</p>
                  </div>
                </div>
              </motion.div>

              {/* Call-to-Action */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                viewport={{ once: true }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <motion.button
                  onClick={openModal}
                  className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 to-yellow-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500/30"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Play className="w-5 h-5" fill="currentColor" />
                    <span>Watch Full Demo</span>
                  </div>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600 to-yellow-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
                </motion.button>

                <motion.a
                  href="#features"
                  className="px-8 py-4 bg-white/80 backdrop-blur-lg border border-gray-200 text-gray-700 font-semibold rounded-xl shadow-lg hover:shadow-xl hover:bg-white transition-all duration-300 text-center focus:outline-none focus:ring-4 focus:ring-gray-200"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Learn More
                </motion.a>
              </motion.div>
            </motion.div>

            {/* RIGHT SIDE - Video Thumbnail */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="relative"
            >
              {/* Decorative Background Elements */}
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
                  onPlay={openModal}
                  autoplay={videoProps.autoplay}
                  lazyLoad={videoProps.lazyLoad}
                />

                {/* Video Duration Badge */}
                <div className="absolute top-4 right-4 px-3 py-1 bg-black/70 backdrop-blur-md text-white text-sm font-medium rounded-lg">
                  2:30
                </div>

                {/* Quality Badge */}
                <div className="absolute top-4 left-4 px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-lg">
                  HD
                </div>
              </div>

              {/* Floating Elements */}
              <motion.div
                className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-white/80 backdrop-blur-lg rounded-full border border-white/20 shadow-lg flex items-center justify-center"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <Play className="w-6 h-6 text-blue-600 ml-0.5" fill="currentColor" />
              </motion.div>

              <motion.div
                className="absolute -bottom-6 -right-6 w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl rotate-12 shadow-lg opacity-80"
                animate={{ rotate: [12, 18, 12] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="w-full h-full flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Bottom Stats/Social Proof */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            viewport={{ once: true }}
            className="mt-20 text-center"
          >
            <div className="inline-flex items-center space-x-8 px-8 py-4 bg-white/60 backdrop-blur-lg rounded-2xl border border-white/20 shadow-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">2K+</div>
                <div className="text-sm text-gray-600">Active Users</div>
              </div>
              <div className="w-px h-8 bg-gray-300" />
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">98%</div>
                <div className="text-sm text-gray-600">Success Rate</div>
              </div>
              <div className="w-px h-8 bg-gray-300" />
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">24/7</div>
                <div className="text-sm text-gray-600">AI Support</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Video Modal */}
      <VideoModal
        isOpen={isModalOpen}
        onClose={closeModal}
        videoSrc={videoProps.fullVideoSrc}
        title={videoProps.title}
        poster={videoProps.fallbackImage}
      />
    </>
  );
};