import React, { useState, useEffect } from 'react';
import { Users, Search, UserCheck, UserX, ShieldCheck, Mail, Phone } from 'lucide-react';
import { adminApi } from '../../api/admin.api';

export default function AdminCustomers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');

  const loadUsers = async () => {

    try {
      setLoading(true);
      const res = await adminApi.users({ search });
      setUsers(res.users || []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [search]);

  const toggleUserStatus = async (user) => {
    const newStatus = !(user.is_active ?? true);
    try {

        await adminApi.updateUser(user.id, { is_active: newStatus });
        await loadUsers();

      setActionMsg(`User ${user.name} has been ${newStatus ? 'activated' : 'deactivated'}.`);
    } catch (err) {
      window.alert(err.response?.data?.error || 'Failed to update user status.');
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Customers</h1>
        <p className="text-sm text-slate-500 mt-1">
          Review customer registrations, manage access permissions, and maintain account status.
        </p>
      </div>

      {actionMsg && (
        <div className="p-3.5 bg-blue-50 text-blue-800 text-xs rounded-2xl border border-blue-100 font-semibold">
          {actionMsg}
        </div>
      )}

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="Search by customer name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-4">Customer Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Phone</th>
                <th className="p-4">Role</th>
                <th className="p-4">Account Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => {
                const active = u.is_active ?? true;
                return (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition">
                    <td className="p-4 font-bold text-slate-900">{u.name}</td>
                    <td className="p-4 text-slate-600">{u.email}</td>
                    <td className="p-4 text-slate-500">{u.phone || '—'}</td>
                    <td className="p-4">
                      <span className="bg-slate-100 text-slate-700 font-bold text-xs px-2.5 py-0.5 rounded-md">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => toggleUserStatus(u)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                          active
                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        {active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
