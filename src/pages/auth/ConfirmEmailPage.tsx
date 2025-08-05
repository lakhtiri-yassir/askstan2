import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, CheckCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';

export const ConfirmEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [error, setError] = useState('');
  
  const { user, confirmEmail } = useAuth();
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      handleConfirmEmail(token);
    }
  }, [token]);

  const handleConfirmEmail = async (confirmToken: string) => {
    setIsConfirming(true);
    setError('');
    
    try {
      await confirmEmail(confirmToken);
      setIsConfirmed(true);
    } catch (error) {
      setError('Failed to confirm email. The link may be expired or invalid.');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleResendEmail = async () => {
    // TODO: Implement resend email functionality
    console.log('Resending confirmation email...');
  };

  if (isConfirmed || (user && user.isEmailConfirmed)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-md w-full"
        >
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-white/20 text-center">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-xl mb-4"
            >
              <CheckCircle className="w-8 h-8 text-green-600" />
            </motion.div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Email Confirmed!
            </h2>
            
            <p className="text-gray-600 mb-6">
              Your email has been successfully confirmed. You can now access all features of AskStan!
            </p>
            
            <Link to="/plans">
              <Button className="w-full">
                Continue to Plans
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-md w-full"
      >
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-white/20 text-center">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-yellow-500 rounded-xl mb-4"
          >
            <Mail className="w-8 h-8 text-white" />
          </motion.div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Confirm Your Email
          </h2>
          
          {isConfirming ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
              </div>
              <p className="text-gray-600">
                Confirming your email...
              </p>
            </div>
          ) : (
            <>
              <p className="text-gray-600 mb-6">
                We've sent a confirmation link to <strong>{user?.email}</strong>. 
                Please check your email and click the link to confirm your account.
              </p>
              
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              
              <div className="space-y-4">
                <Button
                  onClick={handleResendEmail}
                  variant="outline"
                  className="w-full"
                >
                  Resend Confirmation Email
                </Button>
                
                <Link to="/signin">
                  <Button variant="ghost" className="w-full">
                    Back to Sign In
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};