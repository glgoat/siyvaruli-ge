import { useState, useEffect, useCallback } from 'react';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { useRouter } from '@/lib/router';
import { supabase } from '@/lib/supabase';
import { calculateAge, isOnline } from '@/lib/constants';
import type { Profile, Photo, Match } from '@/lib/types';
import { EmptyState } from '@/components/ui/Feedback';

interface Conversation extends Match {
  other_profile: Profile;
  other_photos: Photo[];
  last_message?: { content: string; created_at: string; sender_id: string; read: boolean };
  unread_count: number;
}

export function MessagesListPage() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const { navigate } = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data } = await supabase
      .from('matches')
      .select('*')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (!data) {
      setLoading(false);
      return;
    }

    const enriched = await Promise.all(
      data.map(async (match) => {
        const otherId = match.user1_id === user.id ? match.user2_id : match.user1_id;
        const [{ data: profile }, { data: photos }, { data: lastMsg }, { count }] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', otherId).maybeSingle(),
          supabase.from('photos').select('*').eq('user_id', otherId).order('position'),
          supabase.from('messages').select('content, created_at, sender_id, read').eq('match_id', match.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
          supabase.from('messages').select('*', { count: 'exact', head: true }).eq('match_id', match.id).eq('read', false).neq('sender_id', user.id),
        ]);
        return {
          ...match,
          other_profile: profile as Profile,
          other_photos: photos || [],
          last_message: lastMsg as { content: string; created_at: string; sender_id: string; read: boolean } | undefined,
          unread_count: count || 0,
        };
      })
    );

    // Sort by last message time, keep conversations with no messages at top
    const sorted = enriched
      .filter((c) => c.other_profile)
      .sort((a, b) => {
        const aTime = a.last_message?.created_at || a.created_at;
        const bTime = b.last_message?.created_at || b.created_at;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });

    setConversations(sorted);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-4 py-3">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('messages.title')}</h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl skeleton" />)}
          </div>
        ) : conversations.length === 0 ? (
          <EmptyState
            icon={<MessageCircle size={32} />}
            title={t('messages.empty')}
            description={t('messages.emptyDesc')}
            action={<button onClick={() => navigate('/discover')} className="btn-primary">{t('matches.goDiscover')}</button>}
          />
        ) : (
          <div className="space-y-1">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => navigate(`/chat/${conv.id}`)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-colors text-left"
              >
                <div className="relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0">
                  {conv.other_photos[0] ? (
                    <img src={conv.other_photos[0].url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-500 font-bold text-lg">
                      {conv.other_profile.first_name.charAt(0)}
                    </div>
                  )}
                  {isOnline(conv.other_profile.last_active) && (
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-success-500 border-2 border-white dark:border-gray-900" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {conv.other_profile.first_name}
                      {conv.other_profile.date_of_birth && ` ${calculateAge(conv.other_profile.date_of_birth)}`}
                    </span>
                    {conv.unread_count > 0 && (
                      <span className="ml-2 flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-primary-500 text-white text-xs font-bold flex items-center justify-center">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                  <p className={`text-sm truncate ${conv.unread_count > 0 ? 'text-gray-900 dark:text-gray-100 font-medium' : 'text-gray-400'}`}>
                    {conv.last_message?.sender_id === user?.id ? 'თქვენ: ' : ''}
                    {conv.last_message?.content || '...'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
