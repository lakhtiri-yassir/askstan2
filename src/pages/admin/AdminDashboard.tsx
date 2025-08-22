// src/pages/admin/AdminDashboard.tsx - CLEAN VERSION: Fixed export structure
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  CreditCard, 
  Clock, 
  XCircle, 
  Search, 
  Mail,
  MoreVertical,
  LogOut,
  UserCheck,
  UserX
} from 'lucide-react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { adminService } from '../../lib/adminSupabase';
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

// Helper function to check if user has active subscription
const hasActiveSubscription = (subscription: User['subscription']): boolean => {
  if (!subscription) return false;
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
      case 'active': return 'Active';
      case 'trialing': return 'Trial';
      case 'cancelled': return 'Cancelled';
      case 'expired': return 'Expired';
      default: return 'No Subscription';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
      {getStatusText(status)}
    </span>
  );
};

// User table row component
const UserRow: React.FC<{
  user: User;
  onUpdateSubscription: (userId: string, action: 'activate' | 'cancel') => Promise<void>;
  isUpdating: boolean;
}> = ({ user, onUpdateSubscription, isUpdating }) => {
  const [showActions, setShowActions] = useState(false);
  const hasActiveSub = hasActiveSubscription(user.subscription);
  const subscriptionStatus = user.subscription?.status || 'none';

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="hover:bg-gray-50 transition-colors"
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {user.email.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">
              {user.display_name || 'No Name'}
            </div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <StatusBadge status={subscriptionStatus} />
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {user.subscription?.plan_type || '-'}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          user.email_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {user.email_verified ? 'Verified' : 'Pending'}
        </span>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {new Date(user.created_at).toLocaleDateString()}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isUpdating}
          >
            <MoreVertical className="w-5 h-5" />
          </button>
          
          {showActions && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
              <div className="py-1">
                {hasActiveSub ? (
                  <button
                    onClick={async () => {
                      await onUpdateSubscription(user.id, 'cancel');
                      setShowActions(false);
                    }}
                    disabled={isUpdating}
                    className="flex items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50 w-full text-left"
                  >
                    {isUpdating ? (
                      <LoadingSpinner size="sm" className="mr-2" />
                    ) : (
                      <UserX className="w-4 h-4 mr-2" />
                    )}
                    Cancel Subscription
                  </button>
                ) : (
                  <button
                    onClick={async () => {
                      await onUpdateSubscription(user.id, 'activate');
                      setShowActions(false);
                    }}
                    disabled={isUpdating}
                    className="flex items-center px-4 py-2 text-sm text-green-700 hover:bg-green-50 w-full text-left"
                  >
                    {isUpdating ? (
                      <LoadingSpinner size="sm" className="mr-2" />
                    ) : (
                      <UserCheck className="w-4 h-4 mr-2" />
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

// Main Admin Dashboard Component
function AdminDashboard() {
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

  // Load users with admin service (bypasses RLS)
  const loadUsers = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading users with admin service...');

      // Use admin service to get all users (bypasses RLS)
      const [usersData, statsData] = await Promise.all([
        adminService.getAllUsers(),
        adminService.getStats()
      ]);

      setUsers(usersData);
      setStats(statsData);
      
      console.log('✅ Admin dashboard data loaded:', {
        users: usersData.length,
        stats: statsData
      });

    } catch (error) {
      console.error('❌ Failed to load admin data:', error);
      
      // Show detailed error information
      alert(`Failed to load dashboard data: ${error.message}`);
      
      // Set empty state
      setUsers([]);
      setStats({
        totalUsers: 0,
        activeSubscriptions: 0,
        trialingUsers: 0,
        cancelledSubscriptions: 0
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle subscription updates using admin service
  const handleUpdateSubscription = async (userId: string, action: 'activate' | 'cancel') => {
    try {
      setUpdatingUser(userId);

      if (action === 'activate') {
        await adminService.grantSubscription(userId, 'monthly');
      } else {
        await adminService.cancelSubscription(userId);
      }

      // Reload data to reflect changes
      await loadUsers();
    } catch (error) {
      console.error(`Failed to ${action} subscription:`, error);
      alert(`Failed to ${action} subscription: ${error.message}`);
    } finally {
      setUpdatingUser(null);
    }
  };

  // Load data when admin is available
  useEffect(() => {
    if (admin) {
      loadUsers();
    }
  }, [admin]);

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.display_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const subscriptionStatus = user.subscription?.status || 'none';
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'subscribed' && hasActiveSubscription(user.subscription)) ||
                         (statusFilter === 'trial' && subscriptionStatus === 'trialing') ||
                         (statusFilter === 'cancelled' && subscriptionStatus === 'cancelled') ||
                         (statusFilter === 'none' && subscriptionStatus === 'none');

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
        {/* Header */}
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
                <p className="text-sm font-medium text-gray-600">Cancelled Subscriptions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.cancelledSubscriptions}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search users by email or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="w-5 h-5" />}
              />
            </div>
            <div className="md:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Users ({filteredUsers.length})
            </h3>
          </div>

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
                    Email Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-4 opacity-40" />
                        <p className="text-lg font-medium mb-2">No users found</p>
                        <p>
                          {users.length === 0 
                            ? 'No users in the database yet.' 
                            : 'Try adjusting your search or filter criteria.'
                          }
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <UserRow
                      key={user.id}
                      user={user}
                      onUpdateSubscription={handleUpdateSubscription}
                      isUpdating={updatingUser === user.id}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;