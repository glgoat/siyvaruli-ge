import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { fetchChatData, sendMessage, deleteMessage, updateTyping } from '@/services/messages';
import { isOnline, formatLastActive } from '@/constants';
import type { Message, Profile, Photo } from '@/types';

export function useChat(matchId: string) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherProfile, setOtherProfile] = useState<Profile | null>(null);
  const [otherPhotos, setOtherPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [input, setInput] = useState('');
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const load = useCallback(async () => {
    if (!user || !matchId) return;
    setLoading(true);
    const data = await fetchChatData(matchId, user.id);
    if (data) {
      setOtherProfile(data.otherProfile);
      setOtherPhotos(data.otherPhotos);
      setMessages(data.messages);
    }
    setLoading(false);
  }, [user, matchId]);

  useEffect(() => { load(); }, [load]);

  // Realtime
  useEffect(() => {
    if (!matchId) return;

    const channel = supabase
      .channel(`chat:${matchId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]);
          if (newMsg.sender_id !== user?.id && !newMsg.read) {
            supabase.from('messages').update({ read: true, read_at: new Date().toISOString() }).eq('id', newMsg.id);
          }
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` },
        (payload) => {
          const updated = payload.new as Message;
          setMessages((prev) => prev.map((m) => m.id === updated.id ? updated : m));
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'typing_status', filter: `match_id=eq.${matchId}` },
        (payload) => {
          const typingData = payload.new as { user_id: string; updated_at: string };
          if (typingData.user_id !== user?.id) {
            const isRecent = Date.now() - new Date(typingData.updated_at).getTime() < 3000;
            setIsTyping(isRecent);
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [matchId, user]);

  const handleSend = useCallback(() => {
    if (!user || !matchId || !input.trim()) return;
    const content = input.trim();
    setInput('');
    (async () => {
      const msg = await sendMessage(matchId, user.id, content);
      if (msg) setMessages((prev) => [...prev, msg]);
    })();
  }, [user, matchId, input]);

  const handleDelete = useCallback((msgId: string) => {
    setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, deleted_at: new Date().toISOString(), content: '' } : m));
    (async () => { await deleteMessage(msgId); })();
  }, []);

  const handleTyping = useCallback(() => {
    if (!user || !matchId) return;
    updateTyping(matchId, user.id);
  }, [user, matchId]);

  return {
    messages, otherProfile, otherPhotos, loading, isTyping,
    input, setInput, handleSend, handleDelete, handleTyping,
    otherIsOnline: otherProfile ? isOnline(otherProfile.last_active) : false,
    otherLastActive: otherProfile ? formatLastActive(otherProfile.last_active) : '',
  };
}
