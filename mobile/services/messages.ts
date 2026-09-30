import { supabase } from '@/lib/supabase';
import type { Message, Profile, Photo } from '@/types';

export async function fetchChatData(matchId: string, userId: string) {
  const { data: match } = await supabase.from('matches').select('*').eq('id', matchId).maybeSingle();
  if (!match) return null;

  const otherId = match.user1_id === userId ? match.user2_id : match.user1_id;
  const [{ data: profile }, { data: photos }, { data: msgs }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', otherId).maybeSingle(),
    supabase.from('photos').select('*').eq('user_id', otherId).order('position'),
    supabase.from('messages').select('*').eq('match_id', matchId).order('created_at', { ascending: true }),
  ]);

  // Mark unread as read
  if (msgs && msgs.length > 0) {
    const unread = msgs.filter((m) => !m.read && m.sender_id !== userId);
    if (unread.length > 0) {
      await supabase.from('messages').update({ read: true, read_at: new Date().toISOString() })
        .eq('match_id', matchId).neq('sender_id', userId);
    }
  }

  return {
    otherProfile: profile as Profile,
    otherPhotos: (photos || []) as Photo[],
    messages: (msgs || []) as Message[],
  };
}

export async function sendMessage(matchId: string, senderId: string, content: string): Promise<Message | null> {
  const { data } = await supabase.from('messages').insert({
    match_id: matchId, sender_id: senderId, content,
  }).select().maybeSingle();
  return data as Message | null;
}

export async function deleteMessage(msgId: string): Promise<void> {
  await supabase.from('messages').update({ deleted_at: new Date().toISOString(), content: '' }).eq('id', msgId);
}

export async function updateTyping(matchId: string, userId: string): Promise<void> {
  await supabase.from('typing_status').upsert({
    match_id: matchId, user_id: userId, updated_at: new Date().toISOString(),
  }, { onConflict: 'match_id,user_id' });
}
