import { useState, useEffect, useCallback } from 'react';
import { Users, Flag, Shield, BarChart3, Search, Ban, CheckCircle2, XCircle, Trash2, UserCheck, UserX } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { useToast } from '@/lib/toast-context';
import { useRouter } from '@/lib/router';
import { supabase } from '@/lib/supabase';
import { calculateAge, timeAgo } from '@/lib/constants';
import type { Profile, Report, VerificationRequest } from '@/lib/types';
import type { TranslationKey } from '@/lib/i18n';
import { EmptyState } from '@/components/ui/Feedback';
import { Modal, ModalBody } from '@/components/ui/Modal';

export function AdminPage() {
  const { user, isAdmin } = useAuth();
  const { t, lang } = useLanguage();
  const { showToast } = useToast();
  const { navigate } = useRouter();
  const [tab, setTab] = useState<'dashboard' | 'users' | 'reports' | 'verification'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<Profile[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [verifications, setVerifications] = useState<VerificationRequest[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalMatches: 0, totalMessages: 0, pendingReports: 0, pendingVerifications: 0, activeUsers: 0, newUsers: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);

  const loadDashboard = useCallback(async () => {
    const [usersRes, matchesRes, messagesRes, reportsRes, verifRes, activeRes, newRes] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('matches').select('*', { count: 'exact', head: true }),
      supabase.from('messages').select('*', { count: 'exact', head: true }),
      supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('verification_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('last_active', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    ]);
    setStats({
      totalUsers: usersRes.count || 0,
      totalMatches: matchesRes.count || 0,
      totalMessages: messagesRes.count || 0,
      pendingReports: reportsRes.count || 0,
      pendingVerifications: verifRes.count || 0,
      activeUsers: activeRes.count || 0,
      newUsers: newRes.count || 0,
    });
    setLoading(false);
  }, []);

  const loadUsers = useCallback(async () => {
    let query = supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(50);
    if (searchQuery) {
      query = query.or(`first_name.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%`);
    }
    const { data } = await query;
    setUsers(data || []);
  }, [searchQuery]);

  const loadReports = useCallback(async () => {
    const { data } = await supabase.from('reports').select('*').order('created_at', { ascending: false }).limit(50);
    setReports(data || []);
  }, []);

  const loadVerifications = useCallback(async () => {
    const { data } = await supabase.from('verification_requests').select('*').eq('status', 'pending').order('created_at', { ascending: false });
    setVerifications(data || []);
  }, []);

  useEffect(() => {
    if (!isAdmin) { navigate('/discover'); return; }
    loadDashboard();
  }, [isAdmin, navigate, loadDashboard]);

  useEffect(() => {
    if (tab === 'users') loadUsers();
    if (tab === 'reports') loadReports();
    if (tab === 'verification') loadVerifications();
  }, [tab, loadUsers, loadReports, loadVerifications]);

  const handleSuspend = async (userId: string) => {
    await supabase.from('profiles').update({ is_suspended: true, suspended_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() }).eq('id', userId);
    await supabase.from('moderation_actions').insert({ admin_id: user!.id, action: 'suspend', target_user_id: userId });
    showToast('User suspended', 'success');
    setSelectedUser(null);
    loadUsers();
  };

  const handleBan = async (userId: string) => {
    await supabase.from('profiles').update({ is_suspended: true, suspended_until: null }).eq('id', userId);
    await supabase.from('moderation_actions').insert({ admin_id: user!.id, action: 'ban', target_user_id: userId });
    showToast('User banned', 'success');
    setSelectedUser(null);
    loadUsers();
  };

  const handleUnban = async (userId: string) => {
    await supabase.from('profiles').update({ is_suspended: false, suspended_until: null }).eq('id', userId);
    await supabase.from('moderation_actions').insert({ admin_id: user!.id, action: 'unban', target_user_id: userId });
    showToast('User unbanned', 'success');
    setSelectedUser(null);
    loadUsers();
  };

  const handleDeleteUser = async (userId: string) => {
    await supabase.from('profiles').delete().eq('id', userId);
    await supabase.from('moderation_actions').insert({ admin_id: user!.id, action: 'delete', target_user_id: userId });
    showToast('User deleted', 'success');
    setSelectedUser(null);
    loadUsers();
  };

  const handleReportAction = async (reportId: string, status: 'actioned' | 'dismissed') => {
    await supabase.from('reports').update({ status, reviewed_at: new Date().toISOString(), reviewed_by: user!.id }).eq('id', reportId);
    await supabase.from('moderation_actions').insert({ admin_id: user!.id, action: `report_${status}`, report_id: reportId });
    showToast('Report updated', 'success');
    loadReports();
    loadDashboard();
  };

  const handleVerificationAction = async (reqId: string, userId: string, approved: boolean) => {
    await supabase.from('verification_requests').update({ status: approved ? 'approved' : 'rejected', reviewed_at: new Date().toISOString(), reviewed_by: user!.id }).eq('id', reqId);
    await supabase.from('profiles').update({ verification_status: approved ? 'verified' : 'rejected', is_verified: approved }).eq('id', userId);
    await supabase.from('moderation_actions').insert({ admin_id: user!.id, action: `verification_${approved ? 'approved' : 'rejected'}`, target_user_id: userId });
    showToast(approved ? 'Verification approved' : 'Verification rejected', 'success');
    loadVerifications();
    loadDashboard();
  };

  if (!isAdmin) return null;

  const tabs = [
    { id: 'dashboard' as const, icon: <BarChart3 size={20} />, label: t('admin.dashboard') },
    { id: 'users' as const, icon: <Users size={20} />, label: t('admin.users') },
    { id: 'reports' as const, icon: <Flag size={20} />, label: t('admin.reports') },
    { id: 'verification' as const, icon: <Shield size={20} />, label: t('admin.verification') },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('admin.title')}</h1>
        </div>
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {tabs.map((tb) => (
            <button key={tb.id} onClick={() => setTab(tb.id)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${tab === tb.id ? 'bg-primary-500 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
              {tb.icon}
              {tb.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4">
        {tab === 'dashboard' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <StatCard label={t('admin.totalUsers')} value={stats.totalUsers} icon={<Users size={20} />} />
            <StatCard label={t('admin.totalMatches')} value={stats.totalMatches} icon={<UserCheck size={20} />} />
            <StatCard label={t('admin.totalMessages')} value={stats.totalMessages} icon={<BarChart3 size={20} />} />
            <StatCard label={t('admin.pendingReports')} value={stats.pendingReports} icon={<Flag size={20} />} highlight={stats.pendingReports > 0} />
            <StatCard label={t('admin.pendingVerifications')} value={stats.pendingVerifications} icon={<Shield size={20} />} highlight={stats.pendingVerifications > 0} />
            <StatCard label={t('admin.activeUsers')} value={stats.activeUsers} icon={<Users size={20} />} />
            <StatCard label={t('admin.newUsers')} value={stats.newUsers} icon={<Users size={20} />} />
          </div>
        )}

        {tab === 'users' && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input className="input pl-10" placeholder={t('admin.searchUsers')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && loadUsers()} />
              </div>
              <button onClick={loadUsers} className="btn-primary btn-sm">{t('common.search')}</button>
            </div>
            <div className="space-y-2">
              {users.map((u) => (
                <div key={u.id} className="card p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-500 font-bold">
                    {u.first_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{u.first_name} {u.date_of_birth && calculateAge(u.date_of_birth)} {u.city && `· ${u.city}`}</p>
                    <p className="text-xs text-gray-400">{timeAgo(u.created_at, lang)} {u.is_suspended && '· SUSPENDED'}</p>
                  </div>
                  <button onClick={() => setSelectedUser(u)} className="btn-ghost btn-sm">{t('admin.actions')}</button>
                </div>
              ))}
              {users.length === 0 && <EmptyState icon={<Users size={32} />} title={t('common.notFound')} description="" />}
            </div>
          </div>
        )}

        {tab === 'reports' && (
          <div className="space-y-2">
            {reports.length === 0 ? (
              <EmptyState icon={<Flag size={32} />} title={t('admin.noReports')} description="" />
            ) : reports.map((r) => (
              <div key={r.id} className="card p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="badge bg-error-50 dark:bg-error-900/30 text-error-600 dark:text-error-400">{t(`report.${r.reason}` as TranslationKey)}</span>
                  <span className="text-xs text-gray-400">{timeAgo(r.created_at, lang)}</span>
                </div>
                {r.description && <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{r.description}</p>}
                <div className="flex gap-2">
                  <button onClick={() => handleReportAction(r.id, 'actioned')} className="btn-danger btn-sm flex-1"><Ban size={16} /> {t('admin.review')}</button>
                  <button onClick={() => handleReportAction(r.id, 'dismissed')} className="btn-secondary btn-sm flex-1">{t('admin.dismiss')}</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'verification' && (
          <div className="space-y-2">
            {verifications.length === 0 ? (
              <EmptyState icon={<Shield size={32} />} title={t('admin.noVerifications')} description="" />
            ) : verifications.map((v) => (
              <div key={v.id} className="card p-4">
                <p className="text-sm text-gray-500 mb-2">{timeAgo(v.created_at, lang)}</p>
                {v.selfie_photo_url && <img src={v.selfie_photo_url} alt="" className="w-24 h-24 rounded-xl object-cover mb-3" />}
                {v.notes && <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{v.notes}</p>}
                <div className="flex gap-2">
                  <button onClick={() => handleVerificationAction(v.id, v.user_id, true)} className="btn-primary btn-sm flex-1"><CheckCircle2 size={16} /> {t('admin.approve')}</button>
                  <button onClick={() => handleVerificationAction(v.id, v.user_id, false)} className="btn-secondary btn-sm flex-1"><XCircle size={16} /> {t('admin.reject')}</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User action modal */}
      {selectedUser && (
        <Modal isOpen={!!selectedUser} onClose={() => setSelectedUser(null)}>
          <ModalBody className="p-6">
            <h3 className="font-bold mb-1">{selectedUser.first_name}</h3>
            <p className="text-sm text-gray-400 mb-4">{selectedUser.city} · {selectedUser.is_suspended ? 'Suspended' : 'Active'}</p>
            <div className="space-y-2">
              {!selectedUser.is_suspended && (
                <>
                  <button onClick={() => handleSuspend(selectedUser.id)} className="btn-secondary w-full justify-start"><UserX size={18} /> {t('admin.suspend')}</button>
                  <button onClick={() => handleBan(selectedUser.id)} className="btn-danger w-full justify-start"><Ban size={18} /> {t('admin.ban')}</button>
                </>
              )}
              {selectedUser.is_suspended && (
                <button onClick={() => handleUnban(selectedUser.id)} className="btn-primary w-full justify-start"><UserCheck size={18} /> {t('admin.unban')}</button>
              )}
              <button onClick={() => handleDeleteUser(selectedUser.id)} className="btn-danger w-full justify-start"><Trash2 size={18} /> {t('admin.delete')}</button>
            </div>
          </ModalBody>
        </Modal>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, highlight }: { label: string; value: number; icon: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={`card p-4 ${highlight ? 'border-warning-200 dark:border-warning-700' : ''}`}>
      <div className="flex items-center gap-2 text-gray-400 mb-2">{icon}</div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}
