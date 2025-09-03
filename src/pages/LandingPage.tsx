/**
 * COMPLETE LANDING PAGE WITHOUT TESTIMONIALS
 * Full LandingPage.tsx with seamless banner integration, video demo placeholder,
 * and all sections except testimonials (removed as requested)
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, TrendingUp, Users, Sparkles, CheckCircle, Zap, Play } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import askstanBanner from '../assets/images/hero-image.jpg';
import demoThumbnail from '../assets/videos/demo-thumbnail.mp4';
import demoThumbnailWebM from '../assets/videos/demo-thumbnail.webm'; // if you have this
import fullDemo from '../assets/videos/full-demo.mp4';
import videoFallback from '../assets/images/video-fallback.jpg';

export const LandingPage: React.FC = () => {
  const { user, clearSession } = useAuth();

  const handleClearSession = () => {
    clearSession();
    window.location.reload();
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
            Logged in as: {user.email} | Status: {user.email_confirmed_at ? 'Confirmed' : 'Unconfirmed'}
          </p>
          <Button
            onClick={handleClearSession}
            variant="outline"
            size="sm"
            className="mt-2"
          >
            <span>Clear Session</span>
          </Button>
        </motion.div>
      )}

      {/* HERO SECTION - Split Layout with Seamless Banner Integration */}
      <section className="min-h-screen flex items-center relative overflow-hidden">
        {/* Enhanced Background Elements for Seamless Integration */}
        <div className="absolute inset-0">
          {/* Base gradient matching the page background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-yellow-50" />
          
          {/* Subtle overlay gradients for depth */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-50/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-transparent" />
          
          {/* Radial gradients for banner area integration */}
          <div className="absolute top-1/2 right-0 w-1/2 h-1/2 bg-gradient-radial from-blue-100/40 via-transparent to-transparent transform -translate-y-1/2 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-1/3 h-1/3 bg-gradient-radial from-yellow-100/30 via-transparent to-transparent blur-2xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-screen py-20">
            
            {/* LEFT SIDE - Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              {/* Main Heading with Gradient */}
              <div>
                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="text-6xl md:text-7xl lg:text-8xl font-black mb-6 tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-yellow-500 bg-clip-text text-transparent"
                >
                  AskStan!
                </motion.h1>

                {/* Tagline */}
                <motion.h2
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 mb-8"
                >
                  Your On-Demand Social Media Growth Coach
                </motion.h2>
              </div>

              {/* Description */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="space-y-6"
              >
                <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
                  Meet Stan, your AI-powered social media strategist who delivers personalized insights and proven growth tactics 24/7. 
                  Specializing in LinkedIn optimization, content strategy, and audience engagement.
                </p>
              </motion.div>

              {/* Key Features */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="space-y-4"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">LinkedIn Mastery</h3>
                    <p className="text-gray-600">Unlock LinkedIn's potential with AI-driven content strategies and networking tactics.</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-yellow-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Content Intelligence</h3>
                    <p className="text-gray-600">Get instant content ideas, optimization tips, and engagement strategies.</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Growth Analytics</h3>
                    <p className="text-gray-600">Track your progress with detailed insights and performance metrics.</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* RIGHT SIDE - AskStan Banner with Seamless Integration */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative flex justify-center lg:justify-end"
            >
              {/* Seamless Background Integration Elements */}
              <div className="absolute inset-0 -m-8">
                {/* Matching background that extends beyond the image */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-white/60 to-yellow-50/80 rounded-3xl blur-xl" />
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-blue-100/20 to-yellow-100/20 rounded-2xl blur-lg" />
              </div>

              {/* Banner Image with Enhanced Integration */}
              <div className="relative z-10">
                <img
                  src={askstanBanner}
                  alt="AskStan! AI Social Media Coach"
                  className="w-full max-w-lg h-auto object-contain drop-shadow-2xl"
                  style={{
                    filter: 'drop-shadow(0 20px 40px rgba(0, 0, 0, 0.1))'
                  }}
                />
                
                {/* Subtle overlay to blend edges */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-50/10 via-transparent to-yellow-50/10 rounded-lg pointer-events-none" />
              </div>

              {/* Floating Elements for Extra Integration */}
              <motion.div
                className="absolute top-1/4 -left-4 w-16 h-16 bg-gradient-to-br from-blue-200/60 to-purple-200/60 rounded-2xl blur-sm opacity-70"
                animate={{ 
                  y: [0, -10, 0],
                  rotate: [0, 5, 0]
                }}
                transition={{ 
                  duration: 6, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
              />
              
              <motion.div
                className="absolute bottom-1/4 -right-2 w-12 h-12 bg-gradient-to-br from-yellow-200/60 to-orange-200/60 rounded-xl blur-sm opacity-60"
                animate={{ 
                  y: [0, 15, 0],
                  rotate: [0, -3, 0]
                }}
                transition={{ 
                  duration: 8, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
              />
            </motion.div>
          </div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.0 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center pb-20"
          >
            <Button
              as={Link}
              to={user ? "/dashboard" : "/signup"}
              size="lg"
              className="group relative px-12 py-4 bg-gradient-to-r from-blue-500 to-yellow-500 hover:from-blue-600 hover:to-yellow-600 text-white font-bold rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 focus:scale-105"
            >
              <span className="flex items-center">
                {user ? "Go to Dashboard" : "Start Growing Today"}
                <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
              </span>
            </Button>

            <Button
              as={Link}
              to="/plans"
              variant="outline"
              size="lg"
              className="px-12 py-4 border-2 border-gray-300 hover:border-blue-400 bg-white/80 backdrop-blur-sm text-gray-700 hover:text-blue-600 font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              View Pricing
            </Button>
          </motion.div>
        </div>
      </section>

      {/* VIDEO DEMO SECTION - Fixed Implementation */}
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
                  Watch how our AI coach transforms your social media strategy in real-time
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
                  onClick={() => {
                    // For now, just scroll to features since we don't have actual video
                    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                  }}
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

            {/* RIGHT SIDE - Working Video Container */}
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
  
  {/* Working Video Container */}
  <div className="relative z-10 aspect-video rounded-2xl overflow-hidden bg-white/80 backdrop-blur-lg border border-white/20 shadow-2xl group cursor-pointer"
    onClick={() => {
      // You can add modal functionality here later
      console.log('Video clicked - open full demo');
    }}
  >
    {/* Actual Video Element */}
    <video
      className="w-full h-full object-cover"
      autoPlay
      muted
      loop
      playsInline
      poster={videoFallback}
      onError={(e) => {
        console.log('Video failed to load, showing fallback');
        // Fallback to image if video fails
        const target = e.currentTarget as HTMLVideoElement;
        target.style.display = 'none';
        const fallbackImg = target.nextElementSibling as HTMLImageElement;
        if (fallbackImg) fallbackImg.style.display = 'block';
      }}
    >
      {/* WebM version for better compression (if you have it) */}
      {demoThumbnailWebM && <source src={demoThumbnailWebM} type="video/webm" />}
      {/* MP4 fallback */}
      <source src={demoThumbnail} type="video/mp4" />
      Your browser does not support the video tag.
    </video>

    {/* Fallback Image (hidden by default, shown if video fails) */}
    <img
      src={videoFallback || askstanBanner} // Use your existing banner as fallback if no video-fallback.jpg
      alt="AskStan! Product Demo"
      className="w-full h-full object-cover"
      style={{ display: 'none' }}
    />

    {/* Video Overlay Elements */}
    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

    {/* Play Button Overlay */}
    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
      <motion.button
        className="w-16 h-16 bg-white/20 backdrop-blur-md border-2 border-white/30 rounded-full flex items-center justify-center group/button hover:bg-white/30 hover:border-white/50 transition-all duration-300"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={(e) => {
          e.stopPropagation();
          // Add full video modal functionality here
          console.log('Play full demo clicked');
        }}
      >
        <Play className="w-6 h-6 text-white ml-1" fill="currentColor" />
      </motion.button>
    </div>

    {/* Video Duration Badge */}
    <div className="absolute top-4 right-4 px-3 py-1 bg-black/70 backdrop-blur-md text-white text-sm font-medium rounded-lg">
      2:30
    </div>

    {/* Quality Badge */}
    <div className="absolute top-4 left-4 px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-lg">
      HD
    </div>

    {/* AskStan! Product Demo Badge */}
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex items-center px-3 py-1 bg-green-500/90 backdrop-blur-md text-white text-sm font-medium rounded-lg">
      <CheckCircle className="w-4 h-4 mr-1" />
      <span>AskStan! Product Demo</span>
    </div>

    {/* Gradient Border Effect on Hover */}
    <div className="absolute inset-0 rounded-2xl p-1 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-yellow-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10">
      <div className="w-full h-full rounded-xl bg-transparent" />
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

      {/* FEATURES SECTION */}
      <section id="features" className="py-20 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">
              Everything You Need to <span className="bg-gradient-to-r from-blue-600 to-yellow-500 bg-clip-text text-transparent">Grow</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              AskStan! provides comprehensive tools and insights to transform your social media presence
            </p>
          </motion.div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Instant AI Coaching</h3>
              <p className="text-gray-600 leading-relaxed">
                Get personalized advice and strategies in real-time. Stan analyzes your content and provides actionable insights instantly.
              </p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-yellow-500 rounded-2xl flex items-center justify-center mb-6">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Growth Analytics</h3>
              <p className="text-gray-600 leading-relaxed">
                Track your progress with detailed analytics and insights. See what works and optimize your strategy for maximum growth.
              </p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              viewport={{ once: true }}
              className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-blue-500 rounded-2xl flex items-center justify-center mb-6">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Multi-Platform Support</h3>
              <p className="text-gray-600 leading-relaxed">
                Optimize your presence across LinkedIn, Twitter, Instagram, and more. One platform, all your social media needs.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-yellow-500">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
              Ready to Transform Your Social Media?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Join thousands of professionals who've already accelerated their growth with AskStan!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                as={Link}
                to={user ? "/dashboard" : "/signup"}
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100 font-bold px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                {user ? "Go to Dashboard" : "Start Free Trial"}
                </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-yellow-400 bg-clip-text text-transparent">
                AskStan!
              </h3>
              <p className="text-gray-400 mb-6 max-w-md">
                Your AI-powered social media growth coach. Transform your online presence with personalized strategies and 24/7 support.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/plans" className="hover:text-white transition-colors">Pricing</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
                <li><Link to="/terms" className="hover:text-white transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 AskStan!. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;