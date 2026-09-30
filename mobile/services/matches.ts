import { supabase } from '@/lib/supabase';
import type { Conversation, Profile, Photo, Match } from '@/types';

export async function fetchConversations(userId: string): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  const enriched = await Promise.all(
    data.map(async (match) => {
      const otherId = match.user1_id === userId ? match.user2_id : match.user1_id;
      const [{ data: profile }, { data: photos }, { data: lastMsg }, { count }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', otherId).maybeSingle(),
        supabase.from('photos').select('*').eq('user_id', otherId).order('position'),
        supabase.from('messages').select('content, created_at, sender_id, read').eq('match_id', match.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('messages').select('*', { count: 'exact', head: true }).eq('match_id', match.id).eq('read', false).neq('sender_id', userId),
      ]);
      return {
        ...match,
        other_profile: profile as Profile,
        other_photos: photos || [],
        last_message: lastMsg as { content: string; created_at: string; sender_id: string; read: boolean } | undefined,
        unread_count: count || 0,
      } as Conversation;
    })
  );

  return enriched.filter((c) => c.other_profile).sort((a, b) => {
    const aTime = a.last_message?.created_at || a.created_at;
    const bTime = b.last_message?.created_at || b.created_at;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });
}

export async function fetchLikes(userId: string): Promise<{ liker: Profile; photos: Photo[] }[]> {
  const { data } = await supabase
    .from('likes').select('liker_id').eq('liked_id', userId).order('created_at', { ascending: false });

  if (!data || data.length === 0) return [];

  const enriched = await Promise.all(
    data.map(async (like) => {
      const [{ data: profile }, { data: photos }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', like.liker_id).maybeSingle(),
        supabase.from('photos').select('*').eq('user_id', like.liker_id).order('position'),
      ]);
      return { liker: profile as Profile, photos: photos || [] };
    })
  );

  return enriched.filter((l) => l.liker);
}

export async function unmatch(matchId: string): Promise<void> {
  await supabase.from('matches').delete().eq('id', matchId);
}

export async function blockUser(blockerId: string, blockedId: string, matchId?: string): Promise<void> {
  await supabase.from('blocks').insert({ blocker_id: blockerId, blocked_id: blockedId });
  if (matchId) await supabase.from('matches').delete().eq('id', matchId);
}
