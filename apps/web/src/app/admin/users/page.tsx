'use client';

import { useEffect, useState, useCallback } from 'react';
import { adminApi } from '@/lib/api';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';
import {
  Search, RefreshCw, UserCheck, UserX, Shield,
  Store, ShoppingBag, ChevronLeft, ChevronRight, Users,
} from 'lucide-react';

const ROLES = ['ALL', 'CUSTOMER', 'VENDOR', 'ADMIN'];

const ROLE_BADGE: Record<string, string> = {
  ADMIN: 'bg-purple-100 text-purple-700',
  VENDOR: 'bg-blue-100 text-blue-700',
  CUSTOMER: 'bg-gray-100 text-gray-600',
};

const ROLE_ICON: Record<string, React.ReactNode> = {
  ADMIN: <Shield className="w-3 h-3" />,
  VENDOR: <Store className="w-3 h-3" />,
  CUSTOMER: <ShoppingBag className="w-3 h-3" />,
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [toggling, setToggling] = useState<string | null>(null);

  const load = useCallback(async (p = page, s = search, r = roleFilter) => {
    setLoading(true);
    try {
      const params: any = { page: p };
      if (s.trim()) params.search = s.trim();
      if (r !== 'ALL') params.role = r;
      const { data } = await adminApi.listUsers(params);
      const res = data.data;
      setUsers(res.items ?? []);
      setTotal(res.total ?? 0);
      setTotalPages(res.totalPages ?? 1);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => { load(1, search, roleFilter); }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    load(1, search, roleFilter);
  };

  const handleRoleChange = (r: string) => {
    setRoleFilter(r);
    setPage(1);
    load(1, search, r);
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    load(p, search, roleFilter);
  };

  const toggleStatus = async (user: any) => {
    setToggling(user.id);
    try {
      await adminApi.toggleUserStatus(user.id, !user.isActive);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isActive: !u.isActive } : u));
      toast.success(`${user.name} ${user.isActive ? 'deactivated' : 'activated'}`);
    } catch {
      toast.error('Failed to update user status');
    } finally {
      setToggling(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Manage Users</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total.toLocaleString()} total users</p>
        </div>
        <button onClick={() => load(page, search, roleFilter)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </form>
        <div className="flex gap-2 flex-wrap">
          {ROLES.map(r => (
            <button key={r} onClick={() => handleRoleChange(r)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${roleFilter === r ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Users className="w-12 h-12 text-gray-200 mb-3" />
            <p className="text-gray-500 font-medium">No users found</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">Orders</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Joined</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-brand-gradient flex items-center justify-center text-white text-sm font-black flex-shrink-0">
                          {user.name?.[0]?.toUpperCase() ?? '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-gray-900 truncate">{user.name}</p>
                          <p className="text-xs text-gray-400 truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold w-fit ${ROLE_BADGE[user.role] ?? 'bg-gray-100 text-gray-600'}`}>
                          {ROLE_ICON[user.role]}
                          {user.role}
                        </span>
                        {user.vendor && (
                          <span className="text-xs text-gray-400 truncate max-w-[120px]">{user.vendor.storeName}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="text-sm text-gray-700 font-medium">{user._count?.orders ?? 0}</span>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <span className="text-sm text-gray-500">{formatDate(user.createdAt)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {user.role !== 'ADMIN' && (
                        <button
                          onClick={() => toggleStatus(user)}
                          disabled={toggling === user.id}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 ${
                            user.isActive
                              ? 'bg-red-50 text-red-600 hover:bg-red-100'
                              : 'bg-green-50 text-green-600 hover:bg-green-100'
                          }`}
                        >
                          {user.isActive
                            ? <><UserX className="w-3.5 h-3.5" /> Deactivate</>
                            : <><UserCheck className="w-3.5 h-3.5" /> Activate</>
                          }
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50/50 gap-3">
            <p className="text-sm text-gray-500">
              Page {page} of {totalPages} · {total} users
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => handlePageChange(page - 1)} disabled={page <= 1}
                className="p-2 rounded-xl hover:bg-gray-100 disabled:opacity-40 transition-colors">
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const p = page <= 3 ? i + 1 : page - 2 + i;
                if (p < 1 || p > totalPages) return null;
                return (
                  <button key={p} onClick={() => handlePageChange(p)}
                    className={`w-8 h-8 rounded-xl text-sm font-semibold transition-all ${p === page ? 'bg-gray-900 text-white' : 'hover:bg-gray-100 text-gray-600'}`}>
                    {p}
                  </button>
                );
              })}
              <button onClick={() => handlePageChange(page + 1)} disabled={page >= totalPages}
                className="p-2 rounded-xl hover:bg-gray-100 disabled:opacity-40 transition-colors">
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
