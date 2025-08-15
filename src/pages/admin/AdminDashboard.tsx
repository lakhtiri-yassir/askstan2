// src/pages/admin/AdminDashboard.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  UserPlus, 
  UserMinus, 
  Settings, 
  LogOut, 
  Search,
  Mail,
  Calendar,
  Crown,
  Shield,
  Plus,
  Trash2,
  Eye,
  AlertCircle
} from 'lucide-react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { supabase } from '../../lib/supabase';

interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  email_verified: boolean;
  created_at: string;
  subscription?: {
    id: string;
    plan_type: 'monthly' | 'yearly';
    status: string;
    current_period_start: string;
    current_period_end: string;
  } | null;
}

interface NewAdminForm {
  email: string;
  password: string;
  full_name: string;
  is_super_admin: boolean;
}

export const AdminDashboard: React.FC = () => {
  const { admin, signOut } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'admins'>('users');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [newAdminForm, setNewAdminForm] = useState<NewAdminForm>({
    email: '',
    password: '',
    full_name: '',
    is_super_admin: false
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      
      // Get users with their subscription info
      const { data: usersData, error: usersError } = await supabase
        .from('user_profiles')
        .select(`
          id,
          email,
          display_name,
          email_verified,
          created_at,
          subscriptions (
            id,
            plan_type,
            status,
            current_period_start,
            current_period_end
          )
        `)
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // Transform data to include subscription info
      const transformedUsers = usersData?.map(user => ({
        ...user,
        subscription: user.subscriptions?.[0] || null
      })) || [];

      setUsers(transformedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addSubscription = async (userId: string, planType: 'monthly' | 'yearly') => {
    try {
      setActionLoading(`add-${userId}`);
      
      const sessionToken = localStorage.getItem('admin_session_token');
      if (!sessionToken) throw new Error('No admin session');

      const { data, error } = await supabase.rpc('admin_add_subscription', {
        session_token: sessionToken,
        target_user_id: userId,
        plan_type: planType,
        subscription_status: 'active'
      });

      if (error) throw error;

      await loadUsers(); // Refresh the user list
      alert(`Successfully added ${planType} subscription`);
    } catch (error: any) {
      console.error('Error adding subscription:', error);
      alert(error.message || 'Failed to add subscription');
    } finally {
      setActionLoading(null);
    }
  };

  const removeSubscription = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this subscription?')) return;

    try {
      setActionLoading(`remove-${userId}`);
      
      const sessionToken = localStorage.getItem('admin_session_token');
      if (!sessionToken) throw new Error('No admin session');

      const { data, error } = await supabase.rpc('admin_remove_subscription', {
        session_token: sessionToken,
        target_user_id: userId
      });

      if (error) throw error;

      await loadUsers(); // Refresh the user list
      alert('Successfully removed subscription');
    } catch (error: any) {
      console.error('Error removing subscription:', error);
      alert(error.message || 'Failed to remove subscription');
    } finally {
      setActionLoading(null);
    }
  };

  const createAdmin = async () => {
    try {
      setActionLoading('create-admin');
      
      const sessionToken = localStorage.getItem('admin_session_token');
      if (!sessionToken) throw new Error('No admin session');

      const { data, error } = await supabase.rpc('admin_create_admin', {
        session_token: sessionToken,
        new_admin_email: newAdminForm.email,
        new_admin_password: newAdminForm.password,
        new_admin_name: newAdminForm.full_name,
        make_super_admin: newAdminForm.is_super_admin
      });

      if (error) throw error;

      alert('Admin created successfully');
      setShowAddAdmin(false);
      setNewAdminForm({ email: '', password: '', full_name: '', is_super_admin: false });
    } catch (error: any) {
      console.error('Error creating admin:', error);
      alert(error.message || 'Failed to create admin');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const subscribedUsers = users.filter(user => user.subscription?.status === 'active');
  const totalRevenue = subscribedUsers.reduce((sum, user) => {
    if (user.subscription?.plan_type === 'monthly') return sum + 19.95;
    if (user.subscription?.plan_type === 'yearly') return sum + 143.95;
    return sum;
  }, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl mr-4">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AskStan! Admin</h1>
                <p className="text-gray-600">Welcome back, {admin?.full_name}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {admin?.is_super_admin && (
                <div className="flex items-center bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                  <Crown className="w-4 h-4 mr-1" />
                  Super Admin
                </div>
              )}
              <Button
                onClick={signOut}
                variant="outline"
                className="flex items-center"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{users.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Subscribers</p>
                <p className="text-3xl font-bold text-green-600">{subscribedUsers.length}</p>
              </div>
              <UserPlus className="w-8 h-8 text-green-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Monthly Revenue</p>
                <p className="text-3xl font-bold text-yellow-600">${totalRevenue.toFixed(2)}</p>
              </div>
              <Calendar className="w-8 h-8 text-yellow-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Conversion Rate</p>
                <p className="text-3xl font-bold text-purple-600">
                  {users.length > 0 ? Math.round((subscribedUsers.length / users.length) * 100) : 0}%
                </p>
              </div>
              <Settings className="w-8 h-8 text-purple-500" />
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('users')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                User Management
              </button>
              {admin?.is_super_admin && (
                <button
                  onClick={() => setActiveTab('admins')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'admins'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Admin Management
                </button>
              )}
            </nav>
          </div>
        </div>

        {/* User Management Tab */}
        {activeTab === 'users' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-xl shadow-lg border border-gray-200"
          >
            {/* Search */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
                <div className="max-w-md">
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    icon={<Search className="w-4 h-4" />}
                  />
                </div>
              </div>
            </div>

            {/* Users List */}
            <div className="p-6">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <LoadingSpinner size="lg" />
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold text-sm">
                                  {user.email.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">
                                {user.display_name || user.email.split('@')[0]}
                              </h3>
                              <p className="text-gray-600 flex items-center">
                                <Mail className="w-4 h-4 mr-1" />
                                {user.email}
                              </p>
                            </div>
                          </div>
                          
                          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                            <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                            {user.subscription ? (
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                                {user.subscription.plan_type} - {user.subscription.status}
                              </span>
                            ) : (
                              <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">
                                No subscription
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {user.subscription?.status === 'active' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeSubscription(user.id)}
                              disabled={actionLoading === `remove-${user.id}`}
                              className="text-red-600 border-red-300 hover:bg-red-50"
                            >
                              {actionLoading === `remove-${user.id}` ? (
                                <LoadingSpinner size="sm" className="mr-2" />
                              ) : (
                                <UserMinus className="w-4 h-4 mr-2" />
                              )}
                              Remove Sub
                            </Button>
                          ) : (
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                onClick={() => addSubscription(user.id, 'monthly')}
                                disabled={actionLoading === `add-${user.id}`}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                {actionLoading === `add-${user.id}` ? (
                                  <LoadingSpinner size="sm" className="mr-2" />
                                ) : (
                                  <Plus className="w-4 h-4 mr-2" />
                                )}
                                Monthly
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => addSubscription(user.id, 'yearly')}
                                disabled={actionLoading === `add-${user.id}`}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Yearly
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Admin Management Tab */}
        {activeTab === 'admins' && admin?.is_super_admin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-xl shadow-lg border border-gray-200"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Admin Management</h2>
                <Button
                  onClick={() => setShowAddAdmin(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Admin
                </Button>
              </div>
            </div>

            {/* Add Admin Form */}
            {showAddAdmin && (
              <div className="p-6 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Admin</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Email"
                    value={newAdminForm.email}
                    onChange={(e) => setNewAdminForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="admin@askstan.io"
                  />
                  <Input
                    label="Full Name"
                    value={newAdminForm.full_name}
                    onChange={(e) => setNewAdminForm(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="John Doe"
                  />
                  <Input
                    label="Password"
                    type="password"
                    value={newAdminForm.password}
                    onChange={(e) => setNewAdminForm(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Secure password"
                  />
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_super_admin"
                      checked={newAdminForm.is_super_admin}
                      onChange={(e) => setNewAdminForm(prev => ({ ...prev, is_super_admin: e.target.checked }))}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor="is_super_admin" className="text-sm font-medium text-gray-700">
                      Super Admin (Can manage other admins)
                    </label>
                  </div>
                </div>
                <div className="mt-4 flex space-x-3">
                  <Button
                    onClick={createAdmin}
                    disabled={actionLoading === 'create-admin'}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {actionLoading === 'create-admin' ? (
                      <LoadingSpinner size="sm" className="mr-2" />
                    ) : null}
                    Create Admin
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowAddAdmin(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <div className="p-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-yellow-800 font-medium">Super Admin Access</h4>
                    <p className="text-yellow-700 text-sm mt-1">
                      As a super admin, you can create new admin accounts and manage existing ones. 
                      Regular admins can only manage user subscriptions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};