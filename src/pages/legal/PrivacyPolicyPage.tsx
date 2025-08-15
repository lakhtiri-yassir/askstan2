// src/pages/legal/PrivacyPolicyPage.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Header */}
          <div className="mb-8">
            <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
            <p className="text-gray-600">Effective Date: January 15, 2025</p>
          </div>

          {/* Content */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-700 leading-relaxed mb-6">
                AskStan.io ("we," "our," or "us") respects your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you use our website and services.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Information We Collect</h2>
              <p className="text-gray-700 leading-relaxed mb-4">We may collect the following types of information:</p>
              <ul className="list-disc pl-6 text-gray-700 leading-relaxed mb-6 space-y-2">
                <li><strong>Personal Information</strong> you provide directly (e.g., name, email address) when you sign up or contact us.</li>
                <li><strong>Usage Data</strong> such as IP address, browser type, pages visited, and time spent on our site.</li>
                <li><strong>Cookies and Tracking Technologies</strong> to enhance your browsing experience and analyze site usage.</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. How We Use Your Information</h2>
              <p className="text-gray-700 leading-relaxed mb-4">We use your information to:</p>
              <ul className="list-disc pl-6 text-gray-700 leading-relaxed mb-6 space-y-2">
                <li>Provide and improve our services.</li>
                <li>Respond to your inquiries and requests.</li>
                <li>Send you updates, newsletters, or marketing communications (only if you opt-in).</li>
                <li>Analyze site usage to improve user experience.</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. How We Share Your Information</h2>
              <p className="text-gray-700 leading-relaxed mb-4">We do not sell or rent your personal information.</p>
              <p className="text-gray-700 leading-relaxed mb-4">We may share data with:</p>
              <ul className="list-disc pl-6 text-gray-700 leading-relaxed mb-6 space-y-2">
                <li>Trusted service providers who help us operate the site (e.g., hosting, analytics).</li>
                <li>Legal authorities if required by law or to protect our rights.</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Your Choices</h2>
              <p className="text-gray-700 leading-relaxed mb-4">You can:</p>
              <ul className="list-disc pl-6 text-gray-700 leading-relaxed mb-6 space-y-2">
                <li>Opt out of marketing emails by clicking the "unsubscribe" link.</li>
                <li>Disable cookies in your browser settings (note: this may affect site functionality).</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Data Security</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                We use industry-standard security measures to protect your data, but no online service can guarantee complete security.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Third-Party Links</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Our site may contain links to third-party websites. We are not responsible for the privacy practices of those sites.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">7. Contact Us</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                If you have questions about this Privacy Policy or your data, contact us at:
                <br />
                <strong>Email:</strong> <a href="mailto:reply@askstan.io" className="text-blue-600 hover:text-blue-700">reply@askstan.io</a>
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">8. Changes to This Policy</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                We may update this Privacy Policy from time to time. Any changes will be posted on this page with the updated effective date.
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-8 text-center">
            <Link to="/signup">
              <Button size="lg" className="mr-4">
                I Accept - Create Account
              </Button>
            </Link>
            <Link to="/" className="text-gray-600 hover:text-gray-700">
              Back to Home
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};