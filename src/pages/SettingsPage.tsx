import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, CreditCard, Bell, Shield, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { subscriptionService } from '../lib/subscriptionService';

export const SettingsPage: React.FC = () => {
  const { user, profile, subscription, signOut, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    display_name: profile?.display_name || '',
    email: profile?.email || user?.email || ''
  });

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'billing', name: 'Billing', icon: CreditCard },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'security', name: 'Security', icon: Shield }
  ];

  const handleProfileUpdate = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      await updateProfile({
        display_name: profileData.display_name
      });
    } catch (error) {
      console.error('Profile update error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const portalUrl = await subscriptionService.createCustomerPortalSession();
      window.location.href = portalUrl;
    } catch (error) {
      console.error('Portal session error:', error);
      // Fallback to plans page if portal fails
      window.location.href = '/plans';
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900">Profile Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Email Address"
                type="email"
                value={profileData.email}
                readOnly
                className="bg-gray-50"
              />
              <Input
                label="Display Name"
                type="text"
                placeholder="Enter your display name"
                value={profileData.display_name}
                onChange={(e) => setProfileData(prev => ({ ...prev, display_name: e.target.value }))}
              />
            </div>
            <Button onClick={handleProfileUpdate} isLoading={isLoading}>
              Save Changes
            </Button>
          </div>
        );
      
      case 'billing':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900">Billing & Subscription</h3>
            {subscription ? (
              <div className="bg-gradient-to-r from-blue-50 to-yellow-50 p-6 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {subscription.plan_type === 'yearly' ? 'Yearly Plan' : 'Monthly Plan'}
                    </h4>
                    <p className="text-gray-600">
                      {subscription.plan_type === 'yearly' ? '$49.99/year' : '$4.99/month'}
                    </p>
                    <p className={`text-sm mt-1 capitalize ${
                      subscription.status === 'active' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {subscription.status}
                    </p>
                  </div>
                  <Button variant="outline" onClick={handleManageSubscription}>
                    Manage Subscription
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <div className="text-center">
                  <h4 className="font-semibold text-gray-900 mb-2">No Active Subscription</h4>
                  <p className="text-gray-600 mb-4">Upgrade to unlock premium features</p>
                  <Button onClick={() => window.location.href = '/plans'}>
                    View Plans
                  </Button>
                </div>
              </div>
            )}
            <div className="border-t pt-6">
              <h4 className="font-semibold text-gray-900 mb-4">Payment Methods</h4>
              {subscription ? (
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-gray-600">Managed via Stripe Customer Portal</p>
                  <p className="text-sm text-gray-500">Click "Manage Subscription" to update payment methods</p>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-gray-600">No payment methods on file</p>
                </div>
              )}
            </div>
          </div>
        );
      
      case 'notifications':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900">Notification Preferences</h3>
            <div className="space-y-4">
              {[
                'Email notifications for new features',
                'Growth tips and insights',
                'Weekly progress reports',
                'Marketing communications'
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-gray-700">{item}</span>
                  <input
                    type="checkbox"
                    defaultChecked={index < 2}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
            <Button>Save Preferences</Button>
          </div>
        );
      
      case 'security':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900">Security Settings</h3>
            <div className="space-y-4">
              <Button variant="outline" className="w-full justify-start">
                Change Password
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Two-Factor Authentication
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Download Account Data
              </Button>
            </div>
            <div className="border-t pt-6">
              <Button
                variant="outline"
                onClick={signOut}
                className="w-full justify-center text-red-600 border-red-300 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your account and preferences</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
        >
          <div className="flex">
            {/* Sidebar */}
            <div className="w-64 bg-gray-50 p-6">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-royal-blue text-white'
                          : 'text-gray-600 hover:bg-white'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.name}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 p-8">
              {renderTabContent()}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};