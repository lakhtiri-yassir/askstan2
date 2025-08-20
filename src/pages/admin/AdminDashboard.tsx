// src/pages/admin/AdminDashboard.tsx - CLEAN VERSION: No duplicate components
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock,
  Calendar,
  Mail,
  AlertTriangle,
  MoreVertical,
  LogOut
} from 'lucide-react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { supabase } from '../../lib/supabase';

// Types based on existing database structure
interface User {
  id: string;
  email: string;
  display_name: string | null;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
  subscription?: {
    id: string;
    plan_type: 'monthly' | 'yearly';
    status: 'active' | 'cancelled' | 'expired' | 'past_due' | 'trialing';
    current_period_start: string | null;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
    created_at: string;
  } | null;
}

interface AdminStats {
  totalUsers: number;
  activeSubscriptions: number;
  trialingUsers: number;
  cancelledSubscriptions: number;
}

const StatusBadge: React.FC<{ status: string; className?: string }> = ({ status, className = "" }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Active' };
      case 'trialing':
        return { color: 'bg-blue-100 text-blue-800', icon: Clock, label: 'Trial' };
      case 'cancelled':
        return { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Cancelled' };
      case 'expired':
        return { color: 'bg-gray-100 text-gray-800', icon: XCircle, label: 'Expired' };
      case 'past_due':
        return { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle, label: 'Past Due' };
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: XCircle, label: 'No Subscription' };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color} ${className}`}>
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </span>
  );
};

const UserRow: React.FC<{ 
  user: User; 
  onUpdateSubscription: (userId: string, action: 'activate' | 'cancel') => void;
  isUpdating: string | null;
}> = ({ user, onUpdateSubscription, isUpdating }) => {
  const [showActions, setShowActions] = useState(false);
  const hasSubscription = !!user.subscription;
  const isActive = user.subscription?.status === 'active' || user.subscription?.status === 'trialing';

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
                  <>
                    {isActive ? (
                      <button
                        onClick={() => {
                          onUpdateSubscription(user.id, 'cancel');
                          setShowActions(false);
                        }}
                        disabled={isUpdating === user.id}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        {isUpdating === user.id ? (
                          <LoadingSpinner size="sm" className="mr-2" />
                        ) : (
                          <XCircle className="w-4 h-4 mr-2" />
                        )}
                        Cancel Subscription
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          onUpdateSubscription(user.id, 'activate');
                          setShowActions(false);
                        }}
                        disabled={isUpdating === user.id}
                        className="flex items-center w-full px-4 py-2 text-sm text-green-700 hover:bg-green-50 transition-colors disabled:opacity-50"
                      >
                        {isUpdating === user.id ? (
                          <LoadingSpinner size="sm" className="mr-2" />
                        ) : (
                          <CheckCircle className="w-4 h-4 mr-2" />
                        )}
                        Activate Subscription
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    onClick={() => {
                      onUpdateSubscription(user.id, 'activate');
                      setShowActions(false);
                    }}
                    disabled={isUpdating === user.id}
                    className="flex items-center w-full px-4 py-2 text-sm text-green-700 hover:bg-green-50 transition-colors disabled:opacity-50"
                  >
                    {isUpdating === user.id ? (
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

  // Load users with subscriptions - FIXED: Use same logic as AuthContext
  const loadUsers = async () => {
    try {
      setLoading(true);

      // Get users with their subscriptions - FIXED: Get ALL subscriptions, not just active ones
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

      // Transform data - FIXED: Use same subscription logic as AuthContext
      const transformedUsers: User[] = data.map(user => {
        // Find the most recent subscription
        let activeSubscription = null;
        if (user.subscriptions && user.subscriptions.length > 0) {
          // First try to find active or trialing
          activeSubscription = user.subscriptions.find(sub => ['active', 'trialing'].includes(sub.status));
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

      // Calculate stats - FIXED: Count correctly
      const totalUsers = transformedUsers.length;
      const activeSubscriptions = transformedUsers.filter(u => 
        u.subscription?.status === 'active'
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

  // Filter users based on search and status
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.display_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'subscribed' && (user.subscription?.status === 'active' || user.subscription?.status === 'trialing')) ||
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
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-500 mr-3" />
              <div>
                <p className="text-gray-600 text-sm">Total Users</p>
                <p className="text-gray-900 text-2xl font-bold">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-500 mr-3" />
              <div>
                <p className="text-gray-600 text-sm">Active Subscriptions</p>
                <p className="text-gray-900 text-2xl font-bold">{stats.activeSubscriptions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-blue-500 mr-3" />
              <div>
                <p className="text-gray-600 text-sm">Trial Users</p>
                <p className="text-gray-900 text-2xl font-bold">{stats.trialingUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center">
              <XCircle className="w-8 h-8 text-red-500 mr-3" />
              <div>
                <p className="text-gray-600 text-sm">Cancelled</p>
                <p className="text-gray-900 text-2xl font-bold">{stats.cancelledSubscriptions}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search users by email or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="w-5 h-5" />}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Users</option>
                <option value="subscribed">Active Subscriptions</option>
                <option value="trial">Trial Users</option>
                <option value="cancelled">Cancelled</option>
                <option value="none">No Subscription</option>
              </select>
              <Button
                onClick={loadUsers}
                variant="outline"
                size="sm"
                className="flex items-center"
              >
                <Filter className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
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
                    isUpdating={updatingUser}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No users found matching your criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};