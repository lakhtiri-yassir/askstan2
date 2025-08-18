// src/pages/admin/AdminDashboard.tsx - Complete Working Version with Settings
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  CreditCard, 
  UserPlus, 
  UserMinus, 
  Settings as SettingsIcon, 
  LogOut, 
  Search,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  XCircle,
  BarChart3,
  DollarSign,
  Shield,
  User,
  Lock,
  Save,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { supabase } from '../../lib/supabase';

interface User {
  id: string;
  email: string;
  display_name: string | null;
  email_verified: boolean;
  created_at: string;
}

interface Subscription {
  id: string;
  user_id: string;
  plan_type: 'monthly' | 'yearly';
  status: 'active' | 'cancelled' | 'expired' | 'past_due' | 'trialing';
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
}

interface UserWithSubscription extends User {
  subscription: Subscription | null;
}

interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  is_super_admin: boolean;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
}

interface Stats {
  total_users: number;
  active_subscriptions: number;
  monthly_subscriptions: number;
  yearly_subscriptions: number;
  cancelled_subscriptions: number;
  trial_subscriptions: number;
  revenue_this_month: number;
  new_users_this_month: number;
}

export const AdminDashboard: React.FC = () => {
  const { admin, signOut } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'admins' | 'settings'>('overview');
  const [users, setUsers] = useState<UserWithSubscription[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Settings form state
  const [settingsForm, setSettingsForm] = useState({
    full_name: admin?.full_name || '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsErrors, setSettingsErrors] = useState<Record<string, string>>({});
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Show notification
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  // Update settings form when admin data changes
  useEffect(() => {
    if (admin) {
      setSettingsForm(prev => ({
        ...prev,
        full_name: admin.full_name || ''
      }));
    }
  }, [admin]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Load all data in parallel
      await Promise.all([
        loadUsers(),
        loadAdmins(),
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      showNotification('error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      // First get user profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Then get subscriptions
      const { data: subscriptions, error: subscriptionsError } = await supabase
        .from('subscriptions')
        .select('*');

      if (subscriptionsError) throw subscriptionsError;

      // Combine the data
      const usersWithSubscriptions = profiles?.map(user => ({
        ...user,
        subscription: subscriptions?.find(sub => sub.user_id === user.id) || null
      })) || [];

      setUsers(usersWithSubscriptions);
      
      // Calculate stats after loading users
      calculateStats(usersWithSubscriptions);
      
      return usersWithSubscriptions;
    } catch (error) {
      console.error('Error loading users:', error);
      return [];
    }
  };

  const loadAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAdmins(data || []);
      return data;
    } catch (error) {
      console.error('Error loading admins:', error);
      return [];
    }
  };

  const calculateStats = (userData: UserWithSubscription[]) => {
    try {
      const totalUsers = userData.length;
      const activeSubscriptions = userData.filter(u => u.subscription?.status === 'active').length;
      const monthlySubscriptions = userData.filter(u => u.subscription?.plan_type === 'monthly' && u.subscription?.status === 'active').length;
      const yearlySubscriptions = userData.filter(u => u.subscription?.plan_type === 'yearly' && u.subscription?.status === 'active').length;
      const cancelledSubscriptions = userData.filter(u => u.subscription?.status === 'cancelled').length;
      const trialSubscriptions = userData.filter(u => u.subscription?.status === 'trialing').length;

      // Calculate revenue (monthly * 4.99 + yearly * 49.99)
      const revenue = (monthlySubscriptions * 4.99) + (yearlySubscriptions * 49.99);

      // Calculate new users this month
      const thisMonth = new Date();
      thisMonth.setDate(1);
      const newUsersThisMonth = userData.filter(u => 
        new Date(u.created_at) >= thisMonth
      ).length;

      const statsData: Stats = {
        total_users: totalUsers,
        active_subscriptions: activeSubscriptions,
        monthly_subscriptions: monthlySubscriptions,
        yearly_subscriptions: yearlySubscriptions,
        cancelled_subscriptions: cancelledSubscriptions,
        trial_subscriptions: trialSubscriptions,
        revenue_this_month: revenue,
        new_users_this_month: newUsersThisMonth
      };

      setStats(statsData);
    } catch (error) {
      console.error('Error calculating stats:', error);
    }
  };

  // Settings handlers
  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsLoading(true);
    setSettingsErrors({});

    try {
      // Validate form
      const errors: Record<string, string> = {};
      
      if (!settingsForm.full_name.trim()) {
        errors.full_name = 'Full name is required';
      }

      // Only validate password if user is trying to change it
      if (settingsForm.new_password || settingsForm.current_password || settingsForm.confirm_password) {
        if (!settingsForm.current_password) {
          errors.current_password = 'Current password is required';
        }
        
        if (!settingsForm.new_password) {
          errors.new_password = 'New password is required';
        } else if (settingsForm.new_password.length < 6) {
          errors.new_password = 'Password must be at least 6 characters';
        }
        
        if (settingsForm.new_password !== settingsForm.confirm_password) {
          errors.confirm_password = 'Passwords do not match';
        }
      }

      if (Object.keys(errors).length > 0) {
        setSettingsErrors(errors);
        return;
      }

      // Prepare update data
      const updateData: any = {
        full_name: settingsForm.full_name.trim()
      };

      // If changing password, verify current password first
      if (settingsForm.new_password) {
        // Verify current password by calling the admin_authenticate function
        const { data: authData, error: authError } = await supabase.rpc('admin_authenticate', {
          admin_email: admin?.email,
          admin_password: settingsForm.current_password
        });

        if (authError || !authData || authData.length === 0) {
          setSettingsErrors({ current_password: 'Current password is incorrect' });
          return;
        }

        // Hash the new password (you might want to implement proper hashing)
        updateData.password_hash = settingsForm.new_password; // In production, hash this properly
        updateData.updated_at = new Date().toISOString();
      }

      // Update admin profile
      const { error } = await supabase
        .from('admin_users')
        .update(updateData)
        .eq('id', admin?.id);

      if (error) throw error;

      showNotification('success', 'Settings updated successfully');
      
      // Clear password fields
      setSettingsForm(prev => ({
        ...prev,
        current_password: '',
        new_password: '',
        confirm_password: ''
      }));

    } catch (error: any) {
      console.error('Settings update error:', error);
      showNotification('error', error.message || 'Failed to update settings');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleSettingsInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettingsForm(prev => ({
      ...prev,
      [field]: e.target.value
    }));
    
    if (settingsErrors[field]) {
      setSettingsErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Filter functions
  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAdmins = admins.filter(adminUser =>
    adminUser.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    adminUser.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Format date helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Status badge helper
  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      trialing: 'bg-blue-100 text-blue-800',
      expired: 'bg-gray-100 text-gray-800',
      past_due: 'bg-yellow-100 text-yellow-800'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 font-medium">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50">
      {/* Notification */}
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
            notification.type === 'success' 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
          }`}
        >
          <div className="flex items-center">
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5 mr-2" />
            ) : (
              <XCircle className="w-5 h-5 mr-2" />
            )}
            {notification.message}
          </div>
        </motion.div>
      )}

      {/* Header */}
      <header className="bg-white/90 backdrop-blur-lg shadow-lg border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">
                Welcome back, {admin?.full_name || admin?.email}
                {admin?.is_super_admin && (
                  <span className="ml-2 px-2 py-1 bg-gradient-to-r from-blue-500 to-yellow-500 text-white text-xs rounded-full">
                    <Shield className="w-3 h-3 inline mr-1" />
                    Super Admin
                  </span>
                )}
              </p>
            </div>
            <Button
              onClick={signOut}
              variant="secondary"
              className="text-gray-700 border-gray-300 hover:bg-gray-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex space-x-1 bg-white/60 p-1 rounded-lg mb-8 shadow-sm">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md transition-colors ${
              activeTab === 'overview'
                ? 'bg-gradient-to-r from-blue-500 to-yellow-500 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/80'
            }`}
          >
            <BarChart3 className="w-5 h-5 mr-2" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md transition-colors ${
              activeTab === 'users'
                ? 'bg-gradient-to-r from-blue-500 to-yellow-500 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/80'
            }`}
          >
            <Users className="w-5 h-5 mr-2" />
            User Management
          </button>
          <button
            onClick={() => setActiveTab('admins')}
            className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md transition-colors ${
              activeTab === 'admins'
                ? 'bg-gradient-to-r from-blue-500 to-yellow-500 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/80'
            }`}
          >
            <Shield className="w-5 h-5 mr-2" />
            Admin Management
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md transition-colors ${
              activeTab === 'settings'
                ? 'bg-gradient-to-r from-blue-500 to-yellow-500 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/80'
            }`}
          >
            <SettingsIcon className="w-5 h-5 mr-2" />
            Settings
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white/80 backdrop-blur-lg rounded-lg p-6 shadow-lg border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total_users}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-lg rounded-lg p-6 shadow-lg border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CreditCard className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Active Subscriptions</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.active_subscriptions}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-lg rounded-lg p-6 shadow-lg border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <DollarSign className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Monthly Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">${stats.revenue_this_month.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-lg rounded-lg p-6 shadow-lg border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <UserPlus className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">New Users (Month)</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.new_users_this_month}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/80 backdrop-blur-lg rounded-lg p-6 shadow-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription Breakdown</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monthly Plans</span>
                    <span className="font-semibold">{stats.monthly_subscriptions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Yearly Plans</span>
                    <span className="font-semibold">{stats.yearly_subscriptions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Trial Users</span>
                    <span className="font-semibold">{stats.trial_subscriptions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cancelled</span>
                    <span className="font-semibold">{stats.cancelled_subscriptions}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-lg rounded-lg p-6 shadow-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Admin
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Edit className="w-4 h-4 mr-2" />
                    Export User Data
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Generate Report
                  </Button>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-lg rounded-lg p-6 shadow-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Database</span>
                    <span className="flex items-center text-green-600">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Online
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">API</span>
                    <span className="flex items-center text-green-600">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Online
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Payments</span>
                    <span className="flex items-center text-green-600">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Online
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">User Management</h2>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-lg rounded-lg overflow-hidden shadow-lg border border-gray-200">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50/80">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subscription
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.display_name || 'No name'}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.subscription ? (
                            <div>
                              <div className="text-sm font-medium text-gray-900 capitalize">
                                {user.subscription.plan_type}
                              </div>
                              <div className="text-sm text-gray-500">
                                ${user.subscription.plan_type === 'monthly' ? '4.99/mo' : '49.99/yr'}
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">No subscription</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.subscription?.status ? (
                            getStatusBadge(user.subscription.status)
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              No subscription
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(user.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button className="text-blue-600 hover:text-blue-900">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="text-red-600 hover:text-red-900">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredUsers.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No users found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Admins Tab */}
        {activeTab === 'admins' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Admin Management</h2>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search admins..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {admin?.is_super_admin && (
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Admin
                  </Button>
                )}
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-lg rounded-lg overflow-hidden shadow-lg border border-gray-200">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50/80">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Admin
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Login
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      {admin?.is_super_admin && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredAdmins.map((adminUser) => (
                      <tr key={adminUser.id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {adminUser.full_name || 'No name'}
                            </div>
                            <div className="text-sm text-gray-500">{adminUser.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {adminUser.is_super_admin ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 to-yellow-100 text-blue-800">
                              <Shield className="w-3 h-3 mr-1" />
                              Super Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Admin
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {adminUser.is_active ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <XCircle className="w-3 h-3 mr-1" />
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {adminUser.last_login ? formatDate(adminUser.last_login) : 'Never'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(adminUser.created_at)}
                        </td>
                        {admin?.is_super_admin && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {adminUser.id !== admin.id && (
                              <div className="flex space-x-2">
                                <button className="text-blue-600 hover:text-blue-900">
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button className="text-red-600 hover:text-red-900">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredAdmins.length === 0 && (
                  <div className="text-center py-12">
                    <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No admins found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/80 backdrop-blur-lg rounded-lg shadow-lg border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Admin Settings</h2>
              
              <form onSubmit={handleSettingsSubmit} className="space-y-6">
                {/* Profile Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>
                  
                  <div className="space-y-4">
                    <Input
                      type="text"
                      placeholder="Enter your full name"
                      value={settingsForm.full_name}
                      onChange={handleSettingsInputChange('full_name')}
                      error={settingsErrors.full_name}
                      icon={<User />}
                      label="Full Name"
                    />
                    
                    <Input
                      type="email"
                      value={admin?.email || ''}
                      disabled
                      icon={<User />}
                      label="Email Address"
                      className="bg-gray-50"
                    />
                  </div>
                </div>

                {/* Password Change */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Leave password fields empty if you don't want to change your password.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="relative">
                      <Input
                        type={showCurrentPassword ? "text" : "password"}
                        placeholder="Enter current password"
                        value={settingsForm.current_password}
                        onChange={handleSettingsInputChange('current_password')}
                        error={settingsErrors.current_password}
                        icon={<Lock />}
                        label="Current Password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    
                    <div className="relative">
                      <Input
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Enter new password (min 6 characters)"
                        value={settingsForm.new_password}
                        onChange={handleSettingsInputChange('new_password')}
                        error={settingsErrors.new_password}
                        icon={<Lock />}
                        label="New Password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm new password"
                        value={settingsForm.confirm_password}
                        onChange={handleSettingsInputChange('confirm_password')}
                        error={settingsErrors.confirm_password}
                        icon={<Lock />}
                        label="Confirm New Password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Additional Settings */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
                  
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-700">Account Type:</span>
                      <span className="text-sm text-gray-900">
                        {admin?.is_super_admin ? 'Super Administrator' : 'Administrator'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-700">Account Status:</span>
                      <span className={`text-sm ${admin?.is_active ? 'text-green-600' : 'text-red-600'}`}>
                        {admin?.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-700">Account Created:</span>
                      <span className="text-sm text-gray-900">
                        {admin?.created_at ? formatDate(admin.created_at) : 'Unknown'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-700">Last Login:</span>
                      <span className="text-sm text-gray-900">
                        {admin?.last_login ? formatDate(admin.last_login) : 'Never'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-4">
                  <Button
                    type="submit"
                    isLoading={settingsLoading}
                    disabled={settingsLoading}
                    className="px-8"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {settingsLoading ? 'Saving Changes...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;