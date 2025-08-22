// src/pages/legal/TermsOfServicePage.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';

export const TermsOfServicePage: React.FC = () => {
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
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
            <p className="text-gray-600">Effective Date: January 15, 2025</p>
          </div>

          {/* Content */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-700 leading-relaxed mb-6">
                Welcome to AskStan.io ("we," "our," or "us"). By using our website, services, and tools, you agree to the following terms. Please read them carefully.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Services Provided</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                AskStan.io offers an AI-powered social media growth assistant designed to help users with LinkedIn growth strategies, content creation, monetization guidance, and profile optimization.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Free Trial and Subscription</h2>
              <ul className="list-disc pl-6 text-gray-700 leading-relaxed mb-6 space-y-2">
                <li><strong>Free Trial:</strong> New users receive a 3-day free trial upon signing up.</li>
                <li><strong>Subscription Fees:</strong> If you do not cancel before the end of the trial period, you will be billed automatically at $19.95 USD per month.</li>
                <li><strong>Annual Plan:</strong> You may choose an annual subscription at a 40% discount, billed at $143.95 USD per year.</li>
                <li>Subscription fees are non-refundable once billed, except where required by law.</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Cancellation Policy</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                You may cancel your subscription at any time by following the cancellation process in your account settings or by contacting us at reply@askstan.io. Cancellations take effect at the end of your current billing cycle.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. User Responsibilities</h2>
              <p className="text-gray-700 leading-relaxed mb-4">By using AskStan.io, you agree to:</p>
              <ul className="list-disc pl-6 text-gray-700 leading-relaxed mb-6 space-y-2">
                <li>Use the service only for lawful purposes.</li>
                <li>Not attempt to copy, resell, or distribute our proprietary technology or content.</li>
                <li>Refrain from using the service for spam, harassment, or misleading activity.</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Disclaimer of Warranties</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                We provide the service "as is" without warranties of any kind. We make no guarantees about specific results, revenue generation, or audience growth.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Limitation of Liability</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                To the maximum extent permitted by law, AskStan.io shall not be liable for any indirect, incidental, or consequential damages arising from your use of the service.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">7. Changes to the Service or Terms</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                We may update or modify these terms and our services at any time. Any changes will be posted here with the updated effective date. Continued use after changes means you accept the revised terms.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">8. Governing Law</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                These terms are governed by and construed under the laws of the State of Texas, without regard to its conflict of law principles.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">9. Contact Us</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                If you have any questions about these Terms, contact us at:
                <br />
                <strong>Email:</strong> <a href="mailto:reply@askstan.io" className="text-blue-600 hover:text-blue-700">reply@askstan.io</a>
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
export default TermsOfServicePage;