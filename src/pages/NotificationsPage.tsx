import { useState, useEffect, useCallback } from 'react';
import { Bell, Heart, MessageCircle, ThumbsUp, Shield, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { useRouter } from '@/lib/router';
import { supabase } from '@/lib/supabase';
import { timeAgo } from '@/lib/constants';
import type { Notification } from '@/lib/types';
import type { TranslationKey } from '@/lib/i18n';
import { EmptyState } from '@/components/ui/Feedback';

export function NotificationsPage() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const { navigate } = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    setNotifications(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ read: true, read_at: new Date().toISOString() }).eq('user_id', user.id).eq('read', false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClick = (notif: Notification) => {
    if (!notif.read) {
      supabase.from('notifications').update({ read: true, read_at: new Date().toISOString() }).eq('id', notif.id);
    }
    if (notif.type === 'match' || notif.type === 'message') {
      const matchId = notif.data?.match_id as string;
      if (matchId) navigate(`/chat/${matchId}`);
    } else if (notif.type === 'like') {
      navigate('/likes');
    }
  };

  const icons = {
    match: <Heart size={20} className="text-primary-500" />,
    message: <MessageCircle size={20} className="text-blue-500" />,
    like: <ThumbsUp size={20} className="text-accent-500" />,
    verification: <Shield size={20} className="text-success-500" />,
    report: <AlertCircle size={20} className="text-warning-500" />,
    account: <CheckCircle2 size={20} className="text-gray-500" />,
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('notifications.title')}</h1>
        {notifications.some((n) => !n.read) && (
          <button onClick={markAllRead} className="text-sm text-primary-500 font-medium hover:underline">
            {t('notifications.markAllRead')}
          </button>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl skeleton" />)}
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={<Bell size={32} />}
            title={t('notifications.empty')}
            description={t('notifications.emptyDesc')}
          />
        ) : (
          <div className="space-y-1">
            {notifications.map((notif) => (
              <button
                key={notif.id}
                onClick={() => handleClick(notif)}
                className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-colors ${!notif.read ? 'bg-primary-50/50 dark:bg-primary-950/30' : 'hover:bg-white dark:hover:bg-gray-800'}`}
              >
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                  {icons[notif.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!notif.read ? 'font-semibold text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}`}>
                    {notif.title || t(`notifications.${notif.type}` as TranslationKey)}
                  </p>
                  {notif.body && <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{notif.body}</p>}
                  <p className="text-xs text-gray-400 mt-0.5">{timeAgo(notif.created_at, lang)}</p>
                </div>
                {!notif.read && <span className="w-2 h-2 rounded-full bg-primary-500 mt-2 flex-shrink-0" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
