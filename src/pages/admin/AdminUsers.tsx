import { useEffect, useState } from 'react';
import { Shield } from 'lucide-react';
import { adminApi, type AdminUser } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Card, PageTitle, fmtDate } from './ui';

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const { user: me } = useAuth();
  const { toast } = useToast();

  const load = () => adminApi.users().then(setUsers).catch(() => {});
  useEffect(() => { load(); }, []);

  const setRole = async (id: number, role: string) => {
    try {
      await adminApi.setUserRole(id, role);
      toast('Role updated');
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Update failed', 'error');
    }
  };

  return (
    <>
      <PageTitle title="Team & Users" subtitle="Staff can manage orders, reviews and recovery — only admins see products, offers, blog, broadcast and settings" />
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-widest text-cocoa-light border-b border-espresso/10">
              <th className="px-5 py-4">User</th>
              <th className="px-5 py-4">Contact</th>
              <th className="px-5 py-4">Points</th>
              <th className="px-5 py-4">Joined</th>
              <th className="px-5 py-4">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-espresso/5">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-cream/50">
                <td className="px-5 py-3.5 font-semibold text-espresso">
                  <span className="flex items-center gap-2">
                    {u.role === 'admin' && <Shield className="w-4 h-4 text-gold" aria-hidden="true" />}
                    {u.name}{me?.id === u.id && <span className="text-xs text-cocoa-light font-normal">(you)</span>}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-cocoa">{u.email}{u.phone && <span className="block text-xs text-cocoa-light">{u.phone}</span>}</td>
                <td className="px-5 py-3.5 text-cocoa">{u.points}</td>
                <td className="px-5 py-3.5 text-cocoa-light">{fmtDate(u.created_at)}</td>
                <td className="px-5 py-3.5">
                  <select
                    value={u.role}
                    disabled={me?.id === u.id}
                    onChange={(e) => setRole(u.id, e.target.value)}
                    aria-label={`Role for ${u.name}`}
                    className="bg-cream border border-espresso/10 rounded-full px-4 py-2 text-sm font-semibold text-espresso capitalize disabled:opacity-50"
                  >
                    <option value="customer">customer</option>
                    <option value="staff">staff</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
