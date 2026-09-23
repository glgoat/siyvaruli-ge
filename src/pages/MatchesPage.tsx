import { useState, useEffect, useCallback } from 'react';
import { Heart, MessageCircle, Search } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { useRouter } from '@/lib/router';
import { supabase } from '@/lib/supabase';
import { calculateAge, isOnline, formatLastActive } from '@/lib/constants';
import type { Profile, Photo, Match } from '@/lib/types';
import { EmptyState } from '@/components/ui/Feedback';
import type { TranslationKey } from '@/lib/i18n';

interface MatchWithProfile extends Match {
  other_profile: Profile;
  other_photos: Photo[];
  last_message?: { content: string; created_at: string; sender_id: string };
  unread_count: number;
}

export function MatchesPage() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const { navigate } = useRouter();
  const [matches, setMatches] = useState<MatchWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMatches = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (error || !data) {
      setLoading(false);
      return;
    }

    const enriched = await Promise.all(
      data.map(async (match) => {
        const otherId = match.user1_id === user.id ? match.user2_id : match.user1_id;
        const [{ data: profile }, { data: photos }, { data: lastMsg }, { count }] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', otherId).maybeSingle(),
          supabase.from('photos').select('*').eq('user_id', otherId).order('position'),
          supabase.from('messages').select('content, created_at, sender_id').eq('match_id', match.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
          supabase.from('messages').select('*', { count: 'exact', head: true }).eq('match_id', match.id).eq('read', false).neq('sender_id', user.id),
        ]);

        return {
          ...match,
          other_profile: profile as Profile,
          other_photos: photos || [],
          last_message: lastMsg as { content: string; created_at: string; sender_id: string } | undefined,
          unread_count: count || 0,
        };
      })
    );

    setMatches(enriched.filter((m) => m.other_profile));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  const newMatches = matches.filter((m) => !m.last_message);
  const conversations = matches.filter((m) => m.last_message);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-4 py-3">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('matches.title')}</h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl skeleton" />)}
          </div>
        ) : matches.length === 0 ? (
          <EmptyState
            icon={<Heart size={32} />}
            title={t('matches.empty')}
            description={t('matches.emptyDesc')}
            action={<button onClick={() => navigate('/discover')} className="btn-primary">{t('matches.goDiscover')}</button>}
          />
        ) : (
          <>
            {/* New matches */}
            {newMatches.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">{t('matches.new')}</h2>
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                  {newMatches.map((match) => (
                    <button
                      key={match.id}
                      onClick={() => navigate(`/chat/${match.id}`)}
                      className="flex-shrink-0 flex flex-col items-center gap-1"
                    >
                      <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-primary-500 p-0.5">
                        {match.other_photos[0] ? (
                          <img src={match.other_photos[0].url} alt="" className="w-full h-full object-cover rounded-full" />
                        ) : (
                          <div className="w-full h-full rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-500 font-bold text-xl">
                            {match.other_profile.first_name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-medium truncate max-w-[80px]">{match.other_profile.first_name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Conversations */}
            {conversations.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">{t('messages.title')}</h2>
                <div className="space-y-2">
                  {conversations.map((match) => (
                    <button
                      key={match.id}
                      onClick={() => navigate(`/chat/${match.id}`)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-colors text-left"
                    >
                      <div className="relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0">
                        {match.other_photos[0] ? (
                          <img src={match.other_photos[0].url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-500 font-bold text-lg">
                            {match.other_profile.first_name.charAt(0)}
                          </div>
                        )}
                        {isOnline(match.other_profile.last_active) && (
                          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-success-500 border-2 border-white dark:border-gray-900" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {match.other_profile.first_name}
                            {match.other_profile.date_of_birth && ` ${calculateAge(match.other_profile.date_of_birth)}`}
                          </span>
                          {match.unread_count > 0 && (
                            <span className="ml-2 flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-primary-500 text-white text-xs font-bold flex items-center justify-center">
                              {match.unread_count}
                            </span>
                          )}
                        </div>
                        <p className={`text-sm truncate ${match.unread_count > 0 ? 'text-gray-900 dark:text-gray-100 font-medium' : 'text-gray-400'}`}>
                          {match.last_message?.sender_id === user?.id ? 'თქვენ: ' : ''}
                          {match.last_message?.content || t('messages.noMessages')}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function LikesPage() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const { navigate } = useRouter();
  const [likes, setLikes] = useState<{ liker: Profile; photos: Photo[] }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('likes')
        .select('liker_id')
        .eq('liked_id', user.id)
        .order('created_at', { ascending: false });

      if (!data || data.length === 0) {
        setLoading(false);
        return;
      }

      const enriched = await Promise.all(
        data.map(async (like) => {
          const [{ data: profile }, { data: photos }] = await Promise.all([
            supabase.from('profiles').select('*').eq('id', like.liker_id).maybeSingle(),
            supabase.from('photos').select('*').eq('user_id', like.liker_id).order('position'),
          ]);
          return { liker: profile as Profile, photos: photos || [] };
        })
      );

      setLikes(enriched.filter((l) => l.liker));
      setLoading(false);
    })();
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-4 py-3">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('likes.title')}</h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => <div key={i} className="aspect-square rounded-2xl skeleton" />)}
          </div>
        ) : likes.length === 0 ? (
          <EmptyState
            icon={<Heart size={32} />}
            title={t('likes.empty')}
            description={t('likes.emptyDesc')}
          />
        ) : (
          <>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('likes.whoLikedDesc')}</p>
            <div className="grid grid-cols-2 gap-3">
              {likes.map((like, i) => (
                <button
                  key={i}
                  onClick={() => navigate('/discover')}
                  className="card overflow-hidden text-left hover:shadow-lg transition-shadow"
                >
                  <div className="aspect-square bg-gray-100 dark:bg-gray-800 relative">
                    {like.photos[0] ? (
                      <img src={like.photos[0].url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl font-bold">
                        {like.liker.first_name.charAt(0)}
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                      <p className="text-white font-semibold text-sm">
                        {like.liker.first_name}
                        {like.liker.date_of_birth && ` ${calculateAge(like.liker.date_of_birth)}`}
                      </p>
                      <p className="text-white/70 text-xs">{like.liker.city}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
