// src/pages/admin/AdminDashboard.tsx - Complete Admin Dashboard
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  CreditCard, 
  UserPlus, 
  UserMinus, 
  Settings, 
  LogOut, 
  Search,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  XCircle
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

export const AdminDashboard: React.FC = () => {
  const { admin, signOut } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'admins'>('users');
  const [users, setUsers] = useState<UserWithSubscription[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [showAddSubscription, setShowAddSubscription] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithSubscription | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Load users with subscriptions
  const loadUsers = async () => {
    try {
      const { data: usersData, error: usersError } = await supabase
        .from('user_profiles')
        .select(`
          *,
          subscriptions:subscriptions(*)
        `)
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      const formattedUsers: UserWithSubscription[] = usersData.map(user => ({
        ...user,
        subscription: user.subscriptions?.[0] || null
      }));

      setUsers(formattedUsers);
    } catch (error: any) {
      console.error('Error loading users:', error);
      showNotification('error', 'Failed to load users');
    }
  };

  // Load admin users
  const loadAdmins = async () => {
    try {
      const sessionToken = localStorage.getItem('admin_session_token');
      if (!sessionToken) throw new Error('No admin session');

      const { data, error } = await supabase.rpc('admin_get_all_admins', {
        session_token: sessionToken
      });

      if (error) throw error;
      setAdmins(data || []);
    } catch (error: any) {
      console.error('Error loading admins:', error);
      showNotification('error', 'Failed to load admin users');
    }
  };

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadUsers(), loadAdmins()]);
      setLoading(false);
    };

    loadData();
  }, []);

  // Show notification
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Add subscription to user
  const addSubscription = async (userId: string, planType: 'monthly' | 'yearly') => {
    try {
      const sessionToken = localStorage.getItem('admin_session_token');
      if (!sessionToken) throw new Error('No admin session');

      const { data, error } = await supabase.rpc('admin_add_subscription', {
        session_token: sessionToken,
        target_user_id: userId,
        plan_type: planType,
        subscription_status: 'active'
      });

      if (error) throw error;

      showNotification('success', 'Subscription added successfully');
      await loadUsers();
      setShowAddSubscription(false);
      setSelectedUser(null);
    } catch (error: any) {
      console.error('Error adding subscription:', error);
      showNotification('error', error.message || 'Failed to add subscription');
    }
  };

  // Remove subscription from user
  const removeSubscription = async (userId: string) => {
    try {
      const sessionToken = localStorage.getItem('admin_session_token');
      if (!sessionToken) throw new Error('No admin session');

      const { data, error } = await supabase.rpc('admin_remove_subscription', {
        session_token: sessionToken,
        target_user_id: userId
      });

      if (error) throw error;

      showNotification('success', 'Subscription removed successfully');
      await loadUsers();
    } catch (error: any) {
      console.error('Error removing subscription:', error);
      showNotification('error', error.message || 'Failed to remove subscription');
    }
  };

  // Add new admin
  const addAdmin = async (email: string, password: string, fullName: string, isSuperAdmin: boolean) => {
    try {
      const sessionToken = localStorage.getItem('admin_session_token');
      if (!sessionToken) throw new Error('No admin session');

      const { data, error } = await supabase.rpc('admin_create_admin', {
        session_token: sessionToken,
        new_admin_email: email,
        new_admin_password: password,
        new_admin_name: fullName,
        make_super_admin: isSuperAdmin
      });

      if (error) throw error;

      showNotification('success', 'Admin created successfully');
      await loadAdmins();
      setShowAddAdmin(false);
    } catch (error: any) {
      console.error('Error creating admin:', error);
      showNotification('error', error.message || 'Failed to create admin');
    }
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.display_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter admins based on search term
  const filteredAdmins = admins.filter(admin =>
    admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (admin.full_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-gray-800">
        <div className="text-center">
          <LoadingSpinner size="lg" className="text-white" />
          <p className="mt-4 text-white font-medium">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-800">
      {/* Notification */}
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
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
      <header className="bg-white/10 backdrop-blur-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-blue-200">
                Welcome back, {admin?.full_name || admin?.email}
                {admin?.is_super_admin && (
                  <span className="ml-2 px-2 py-1 bg-yellow-500 text-yellow-900 text-xs rounded-full">
                    Super Admin
                  </span>
                )}
              </p>
            </div>
            <Button
              onClick={signOut}
              variant="secondary"
              className="text-white border-white/30 hover:bg-white/20"
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
        <div className="flex space-x-1 bg-white/10 p-1 rounded-lg mb-8">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md transition-colors ${
              activeTab === 'users'
                ? 'bg-white text-gray-900'
                : 'text-white hover:bg-white/20'
            }`}
          >
            <Users className="w-5 h-5 mr-2" />
            User Management
          </button>
          <button
            onClick={() => setActiveTab('admins')}
            className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md transition-colors ${
              activeTab === 'admins'
                ? 'bg-white text-gray-900'
                : 'text-white hover:bg-white/20'
            }`}
          >
            <Settings className="w-5 h-5 mr-2" />
            Admin Management
          </button>
        </div>

        {/* Search and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/10 border-white/30 text-white placeholder-gray-300"
            />
          </div>
          {activeTab === 'users' && (
            <Button
              onClick={() => setShowAddSubscription(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add Subscription
            </Button>
          )}
          {activeTab === 'admins' && admin?.is_super_admin && (
            <Button
              onClick={() => setShowAddAdmin(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Admin
            </Button>
          )}
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white/10 backdrop-blur-lg rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/20">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase tracking-wider">
                      Email Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase tracking-wider">
                      Subscription
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-white/5">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-white">
                            {user.display_name || 'No name'}
                          </div>
                          <div className="text-sm text-gray-300">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.email_verified ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Unverified
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.subscription ? (
                          <div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.subscription.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : user.subscription.status === 'trialing'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              <CreditCard className="w-3 h-3 mr-1" />
                              {user.subscription.plan_type} - {user.subscription.status}
                            </span>
                            {user.subscription.current_period_end && (
                              <div className="text-xs text-gray-400 mt-1">
                                Expires: {new Date(user.subscription.current_period_end).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            No subscription
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {!user.subscription ? (
                            <Button
                              onClick={() => {
                                setSelectedUser(user);
                                setShowAddSubscription(true);
                              }}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <UserPlus className="w-3 h-3 mr-1" />
                              Add Sub
                            </Button>
                          ) : (
                            <Button
                              onClick={() => removeSubscription(user.id)}
                              size="sm"
                              variant="secondary"
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              <UserMinus className="w-3 h-3 mr-1" />
                              Remove Sub
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredUsers.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  No users found matching your search.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Admins Tab */}
        {activeTab === 'admins' && (
          <div className="bg-white/10 backdrop-blur-lg rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/20">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase tracking-wider">
                      Admin
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredAdmins.map((adminUser) => (
                    <tr key={adminUser.id} className="hover:bg-white/5">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-white">
                            {adminUser.full_name || 'No name'}
                          </div>
                          <div className="text-sm text-gray-300">{adminUser.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {adminUser.is_super_admin ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {adminUser.last_login 
                          ? new Date(adminUser.last_login).toLocaleDateString()
                          : 'Never'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {new Date(adminUser.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredAdmins.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  No admins found matching your search.
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Add Subscription Modal */}
      {showAddSubscription && (
        <AddSubscriptionModal
          user={selectedUser}
          onClose={() => {
            setShowAddSubscription(false);
            setSelectedUser(null);
          }}
          onAddSubscription={addSubscription}
        />
      )}

      {/* Add Admin Modal */}
      {showAddAdmin && admin?.is_super_admin && (
        <AddAdminModal
          onClose={() => setShowAddAdmin(false)}
          onAddAdmin={addAdmin}
        />
      )}
    </div>
  );
};

// Add Subscription Modal Component
interface AddSubscriptionModalProps {
  user: UserWithSubscription | null;
  onClose: () => void;
  onAddSubscription: (userId: string, planType: 'monthly' | 'yearly') => void;
}

const AddSubscriptionModal: React.FC<AddSubscriptionModalProps> = ({
  user,
  onClose,
  onAddSubscription,
}) => {
  const [planType, setPlanType] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [users, setUsers] = useState<UserWithSubscription[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      // Load users without subscriptions for selection
      const loadUsersWithoutSub = async () => {
        try {
          const { data, error } = await supabase
            .from('user_profiles')
            .select(`
              *,
              subscriptions:subscriptions(*)
            `)
            .order('created_at', { ascending: false });

          if (error) throw error;

          const usersWithoutSub = data.filter(u => !u.subscriptions || u.subscriptions.length === 0);
          setUsers(usersWithoutSub.map(u => ({ ...u, subscription: null })));
        } catch (error) {
          console.error('Error loading users:', error);
        }
      };
      loadUsersWithoutSub();
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const targetUserId = user?.id || selectedUserId;
      if (!targetUserId) throw new Error('No user selected');

      await onAddSubscription(targetUserId, planType);
    } catch (error) {
      console.error('Error adding subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg p-6 w-full max-w-md"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Add Subscription
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!user && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select User
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              >
                <option value="">Choose a user...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.display_name || u.email} ({u.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          {user && (
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-600">Adding subscription for:</p>
              <p className="font-medium">{user.display_name || user.email}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Plan Type
            </label>
            <select
              value={planType}
              onChange={(e) => setPlanType(e.target.value as 'monthly' | 'yearly')}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="monthly">Monthly ($4.99/month)</option>
              <option value="yearly">Yearly ($49.99/year)</option>
            </select>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || (!user && !selectedUserId)}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {loading ? <LoadingSpinner size="sm" /> : 'Add Subscription'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// Add Admin Modal Component
interface AddAdminModalProps {
  onClose: () => void;
  onAddAdmin: (email: string, password: string, fullName: string, isSuperAdmin: boolean) => void;
}

const AddAdminModal: React.FC<AddAdminModalProps> = ({
  onClose,
  onAddAdmin,
}) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    isSuperAdmin: false,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onAddAdmin(
        formData.email,
        formData.password,
        formData.fullName,
        formData.isSuperAdmin
      );
    } catch (error) {
      console.error('Error adding admin:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg p-6 w-full max-w-md"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Add New Admin
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            label="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />

          <Input
            type="password"
            label="Password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            minLength={6}
          />

          <Input
            type="text"
            label="Full Name"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            required
          />

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isSuperAdmin"
              checked={formData.isSuperAdmin}
              onChange={(e) => setFormData({ ...formData, isSuperAdmin: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="isSuperAdmin" className="text-sm font-medium text-gray-700">
              Make Super Admin (can create other admins)
            </label>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              {loading ? <LoadingSpinner size="sm" /> : 'Create Admin'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};