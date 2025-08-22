// src/pages/admin/AdminDashboard.tsx - FIXED: Unified subscription detection
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  CreditCard, 
  Clock, 
  XCircle, 
  Search, 
  Filter,
  Mail,
  Calendar,
  CheckCircle,
  MoreVertical,
  LogOut
} from 'lucide-react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

interface User {
  id: string;
  email: string;
  display_name: string | null;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
  subscription: {
    id: string;
    plan_type: string;
    status: string;
    current_period_start?: string | null;
    current_period_end?: string | null;
    cancel_at_period_end?: boolean;
    created_at: string;
  } | null;
}

interface AdminStats {
  totalUsers: number;
  activeSubscriptions: number;
  trialingUsers: number;
  cancelledSubscriptions: number;
}

// CRITICAL FIX: Create unified subscription status checker that matches AuthContext logic
const hasActiveSubscription = (subscription: User['subscription']): boolean => {
  if (!subscription) return false;
  
  // FIXED: Use same logic as AuthContext - includes both 'active' and 'trialing'
  return subscription.status === 'active' || subscription.status === 'trialing';
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'trialing':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'trialing':
        return 'Trial';
      case 'cancelled':
        return 'Cancelled';
      case 'expired':
        return 'Expired';
      default:
        return 'No Plan';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
      {getStatusText(status)}
    </span>
  );
};

const UserRow: React.FC<{ 
  user: User; 
  onUpdateSubscription: (userId: string, action: 'activate' | 'cancel') => Promise<void>;
  isUpdating: boolean;
}> = ({ user, onUpdateSubscription, isUpdating }) => {
  const [showActions, setShowActions] = useState(false);
  
  // FIXED: Use unified subscription logic
  const hasSubscription = hasActiveSubscription(user.subscription);

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="hover:bg-gray-50 transition-colors"
    >
      {/* User Info */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-yellow-500 flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {user.display_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">
              {user.display_name || 'No Name'}
            </div>
            <div className="text-sm text-gray-500 flex items-center">
              <Mail className="w-3 h-3 mr-1" />
              {user.email}
            </div>
          </div>
        </div>
      </td>

      {/* Subscription Status */}
      <td className="px-6 py-4 whitespace-nowrap">
        <StatusBadge status={user.subscription?.status || 'none'} />
      </td>

      {/* Plan Type */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {user.subscription?.plan_type ? (
          <span className="capitalize">{user.subscription.plan_type}</span>
        ) : (
          <span className="text-gray-400">No Plan</span>
        )}
      </td>

      {/* Join Date */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <div className="flex items-center">
          <Calendar className="w-3 h-3 mr-1" />
          {new Date(user.created_at).toLocaleDateString()}
        </div>
      </td>

      {/* Email Verified */}
      <td className="px-6 py-4 whitespace-nowrap">
        {user.email_verified ? (
          <CheckCircle className="w-5 h-5 text-green-500" />
        ) : (
          <XCircle className="w-5 h-5 text-red-500" />
        )}
      </td>

      {/* Actions */}
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {showActions && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
              <div className="py-1">
                {hasSubscription ? (
                  <button
                    onClick={() => onUpdateSubscription(user.id, 'cancel')}
                    disabled={isUpdating}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center"
                  >
                    {isUpdating ? (
                      <LoadingSpinner size="sm" className="mr-2" />
                    ) : (
                      <XCircle className="w-4 h-4 mr-2" />
                    )}
                    Cancel Subscription
                  </button>
                ) : (
                  <button
                    onClick={() => onUpdateSubscription(user.id, 'activate')}
                    disabled={isUpdating}
                    className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 transition-colors flex items-center"
                  >
                    {isUpdating ? (
                      <LoadingSpinner size="sm" className="mr-2" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    )}
                    Grant Subscription
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </td>
    </motion.tr>
  );
};

export const AdminDashboard: React.FC = () => {
  const { admin, signOut } = useAdminAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeSubscriptions: 0,
    trialingUsers: 0,
    cancelledSubscriptions: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = '/';
    } catch (error) {
      window.location.href = '/';
    }
  };

  // FIXED: Load users with unified subscription logic
  const loadUsers = async () => {
    try {
      setLoading(true);

      // Get users with their subscriptions
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          id,
          email,
          display_name,
          email_verified,
          created_at,
          updated_at,
          subscriptions (
            id,
            plan_type,
            status,
            current_period_start,
            current_period_end,
            cancel_at_period_end,
            created_at
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // FIXED: Transform data using same logic as AuthContext
      const transformedUsers: User[] = data.map(user => {
        // Find the most recent subscription (prioritize active/trialing)
        let activeSubscription = null;
        if (user.subscriptions && user.subscriptions.length > 0) {
          // First try to find active or trialing (matching AuthContext logic)
          activeSubscription = user.subscriptions.find(sub => 
            sub.status === 'active' || sub.status === 'trialing'
          );
          // If none found, use the most recent one
          if (!activeSubscription) {
            activeSubscription = user.subscriptions.sort((a, b) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )[0];
          }
        }

        return {
          id: user.id,
          email: user.email,
          display_name: user.display_name,
          email_verified: user.email_verified,
          created_at: user.created_at,
          updated_at: user.updated_at,
          subscription: activeSubscription
        };
      });

      setUsers(transformedUsers);

      // FIXED: Calculate stats using unified logic
      const totalUsers = transformedUsers.length;
      const activeSubscriptions = transformedUsers.filter(u => 
        hasActiveSubscription(u.subscription)
      ).length;
      const trialingUsers = transformedUsers.filter(u => 
        u.subscription?.status === 'trialing'
      ).length;
      const cancelledSubscriptions = transformedUsers.filter(u => 
        u.subscription?.status === 'cancelled'
      ).length;

      setStats({
        totalUsers,
        activeSubscriptions,
        trialingUsers,
        cancelledSubscriptions
      });

    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update subscription status
  const handleUpdateSubscription = async (userId: string, action: 'activate' | 'cancel') => {
    try {
      setUpdatingUser(userId);

      if (action === 'activate') {
        // Create or reactivate subscription
        const { error } = await supabase
          .from('subscriptions')
          .upsert({
            user_id: userId,
            plan_type: 'monthly', // Default to monthly
            status: 'active',
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
            cancel_at_period_end: false,
            updated_at: new Date().toISOString()
          });

        if (error) throw error;
      } else {
        // Cancel subscription
        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: 'cancelled',
            cancel_at_period_end: true,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);

        if (error) throw error;
      }

      // Reload users to reflect changes
      await loadUsers();

    } catch (error) {
      console.error('Failed to update subscription:', error);
      alert(`Failed to ${action} subscription. Please try again.`);
    } finally {
      setUpdatingUser(null);
    }
  };

  useEffect(() => {
    if (admin) {
      loadUsers();
    }
  }, [admin]);

  // FIXED: Filter users based on unified subscription logic
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.display_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'subscribed' && hasActiveSubscription(user.subscription)) ||
                         (statusFilter === 'trial' && user.subscription?.status === 'trialing') ||
                         (statusFilter === 'cancelled' && user.subscription?.status === 'cancelled') ||
                         (statusFilter === 'none' && !user.subscription);

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-yellow-50">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Sign Out */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Manage users and their subscriptions</p>
          </div>
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="flex items-center"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <CreditCard className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Subscriptions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeSubscriptions}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Trial Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.trialingUsers}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Cancelled</p>
                <p className="text-2xl font-bold text-gray-900">{stats.cancelledSubscriptions}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search users by email or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="all">All Users</option>
                  <option value="subscribed">Subscribed</option>
                  <option value="trial">Trial</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="none">No Subscription</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Verified
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    onUpdateSubscription={handleUpdateSubscription}
                    isUpdating={updatingUser === user.id}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria.' 
                  : 'No users have been created yet.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default AdminDashboard;