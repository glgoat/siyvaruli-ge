import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Send, MoreVertical, Trash2, Ban, Flag, UserX, Smile, ImageIcon } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { useToast } from '@/lib/toast-context';
import { useRouter } from '@/lib/router';
import { supabase } from '@/lib/supabase';
import { calculateAge, isOnline, formatTime, formatLastActive } from '@/lib/constants';
import type { Message, Profile, Photo } from '@/lib/types';
import type { TranslationKey } from '@/lib/i18n';
import { EmptyState } from '@/components/ui/Feedback';
import { Modal, ModalBody } from '@/components/ui/Modal';

const EMOJIS = ['😀', '😍', '🥰', '😘', '😊', '❤️', '🔥', '👍', '😂', '🥳', '😢', '😡', '🙏', '👏', '💯', '🌹', '🎉', '✨', '💭', '👋'];

export function ChatPage({ matchId }: { matchId: string }) {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const { showToast } = useToast();
  const { navigate } = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherProfile, setOtherProfile] = useState<Profile | null>(null);
  const [otherPhotos, setOtherPhotos] = useState<Photo[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showBlock, setShowBlock] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadChat = useCallback(async () => {
    if (!user || !matchId) return;
    setLoading(true);

    const { data: match } = await supabase.from('matches').select('*').eq('id', matchId).maybeSingle();
    if (!match) {
      setLoading(false);
      return;
    }

    const otherId = match.user1_id === user.id ? match.user2_id : match.user1_id;
    const [{ data: profile }, { data: photos }, { data: msgs }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', otherId).maybeSingle(),
      supabase.from('photos').select('*').eq('user_id', otherId).order('position'),
      supabase.from('messages').select('*').eq('match_id', matchId).order('created_at', { ascending: true }),
    ]);

    setOtherProfile(profile as Profile);
    setOtherPhotos(photos || []);
    setMessages((msgs || []) as Message[]);

    // Mark messages as read
    if (msgs && msgs.length > 0) {
      const unread = msgs.filter((m) => !m.read && m.sender_id !== user.id);
      if (unread.length > 0) {
        await supabase.from('messages').update({ read: true, read_at: new Date().toISOString() })
          .eq('match_id', matchId).neq('sender_id', user.id);
      }
    }

    setLoading(false);
  }, [user, matchId]);

  useEffect(() => {
    loadChat();
  }, [loadChat]);

  // Realtime subscription
  useEffect(() => {
    if (!matchId) return;

    const channel = supabase
      .channel(`chat:${matchId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => [...prev, newMsg]);
          if (newMsg.sender_id !== user?.id && !newMsg.read) {
            supabase.from('messages').update({ read: true, read_at: new Date().toISOString() }).eq('id', newMsg.id);
          }
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

    return () => { supabase.removeChannel(channel); };
  }, [matchId, user]);

  // Typing indicator cleanup
  useEffect(() => {
    const interval = setInterval(() => {
      if (isTyping) {
        const now = Date.now();
        // Re-check typing status
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [isTyping]);

  const handleTyping = async () => {
    if (!user || !matchId) return;
    await supabase.from('typing_status').upsert({
      match_id: matchId,
      user_id: user.id,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'match_id,user_id' });
  };

  const handleInput = (val: string) => {
    setInput(val);
    handleTyping();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      // Stop typing
    }, 3000);
  };

  const sendMessage = async () => {
    if (!user || !matchId || !input.trim()) return;
    const content = input.trim();
    setInput('');
    setShowEmojis(false);

    const { data } = await supabase.from('messages').insert({
      match_id: matchId,
      sender_id: user.id,
      content,
    }).select().single();

    if (data) {
      setMessages((prev) => [...prev, data as Message]);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const deleteMessage = async (msgId: string) => {
    await supabase.from('messages').update({ deleted_at: new Date().toISOString(), content: '' }).eq('id', msgId);
    setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, deleted_at: new Date().toISOString(), content: '' } : m));
    setDeleteTarget(null);
    showToast(t('messages.messageDeleted'), 'success');
  };

  const handleBlock = async () => {
    if (!user || !otherProfile) return;
    await supabase.from('blocks').insert({ blocker_id: user.id, blocked_id: otherProfile.id });
    await supabase.from('matches').delete().eq('id', matchId);
    showToast(t('block.blocked'), 'success');
    navigate('/matches');
  };

  const handleReport = async () => {
    if (!user || !otherProfile || !reportReason) return;
    await supabase.from('reports').insert({
      reporter_id: user.id,
      reported_id: otherProfile.id,
      reason: reportReason,
      description: reportDesc,
    });
    setShowReport(false);
    showToast(t('report.submitted'), 'success');
  };

  const handleUnmatch = async () => {
    if (!user) return;
    await supabase.from('matches').delete().eq('id', matchId);
    navigate('/matches');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="skeleton w-8 h-8 rounded-full" /></div>;
  }

  if (!otherProfile) {
    return <EmptyState icon={<MessageIcon />} title={t('common.notFound')} description="" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/messages')} className="btn-ghost btn-sm px-2">
          <ArrowLeft size={22} />
        </button>
        <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
          {otherPhotos[0] ? (
            <img src={otherPhotos[0].url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-500 font-bold">
              {otherProfile.first_name.charAt(0)}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{otherProfile.first_name}</h2>
            {otherProfile.is_verified && (
              <span className="w-4 h-4 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400">
            {isOnline(otherProfile.last_active) ? (lang === 'ka' ? 'ონლაინ' : 'Online') : formatLastActive(otherProfile.last_active, lang)}
          </p>
        </div>
        <button onClick={() => setShowMenu(!showMenu)} className="btn-ghost btn-sm px-2 relative">
          <MoreVertical size={22} />
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 card shadow-xl py-1 z-30 animate-scale-in">
              <button onClick={() => { setShowMenu(false); setShowReport(true); }} className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Flag size={16} /> {t('messages.reportUser')}
              </button>
              <button onClick={() => { setShowMenu(false); setShowBlock(true); }} className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Ban size={16} /> {t('messages.blockUser')}
              </button>
              <button onClick={handleUnmatch} className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2 text-error-500">
                <UserX size={16} /> {t('messages.unmatch')}
              </button>
            </div>
          )}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 max-w-2xl mx-auto w-full">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-gray-400 mb-2">{t('messages.noMessages')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((msg) => {
              const isMine = msg.sender_id === user?.id;
              const isDeleted = !!msg.deleted_at;
              return (
                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} group`}>
                  <div
                    className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${isMine ? 'bg-primary-500 text-white rounded-br-md' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md'} relative`}
                    onClick={() => !isDeleted && isMine && setDeleteTarget(msg.id)}
                  >
                    {isDeleted ? (
                      <span className="text-sm italic opacity-60">{t('messages.messageDeleted')}</span>
                    ) : (
                      <>
                        {msg.image_url && <img src={msg.image_url} alt="" className="rounded-xl mb-1 max-w-full" />}
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                        <span className={`text-[10px] ${isMine ? 'text-primary-100' : 'text-gray-400'} block mt-0.5`}>
                          {formatTime(msg.created_at)}
                          {isMine && !isDeleted && (msg.read ? ' ✓✓' : ' ✓')}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-gray-800 px-4 py-3 rounded-2xl rounded-bl-md">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Emoji picker */}
      {showEmojis && (
        <div className="px-4 pb-2 max-w-2xl mx-auto w-full">
          <div className="card p-3 flex flex-wrap gap-1 animate-slide-up">
            {EMOJIS.map((e) => (
              <button key={e} onClick={() => { setInput(input + e); inputRef.current?.focus(); }} className="w-9 h-9 flex items-center justify-center text-xl hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                {e}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 p-3 md:pb-3">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <button onClick={() => setShowEmojis(!showEmojis)} className="btn-ghost btn-sm px-2 text-gray-400">
            <Smile size={24} />
          </button>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => handleInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder={t('messages.typeMessage')}
            className="input flex-1"
          />
          <button onClick={sendMessage} disabled={!input.trim()} className="btn-primary btn-sm px-3">
            <Send size={20} />
          </button>
        </div>
      </div>

      {/* Report modal */}
      <Modal isOpen={showReport} onClose={() => setShowReport(false)}>
        <ModalBody className="p-6">
          <h2 className="text-lg font-bold mb-4">{t('report.title')}</h2>
          <div className="space-y-3">
            <div>
              <label className="label">{t('report.reason')}</label>
              <select className="input" value={reportReason} onChange={(e) => setReportReason(e.target.value)}>
                <option value="">--</option>
                <option value="harassment">{t('report.harassment')}</option>
                <option value="spam">{t('report.spam')}</option>
                <option value="fake_profile">{t('report.fakeProfile')}</option>
                <option value="inappropriate_photo">{t('report.inappropriatePhoto')}</option>
                <option value="underage">{t('report.underage')}</option>
                <option value="violence">{t('report.violence')}</option>
                <option value="hate_speech">{t('report.hateSpeech')}</option>
                <option value="scam">{t('report.scam')}</option>
                <option value="other">{t('report.other')}</option>
              </select>
            </div>
            <div>
              <label className="label">{t('report.description')}</label>
              <textarea className="input min-h-[80px] resize-none" value={reportDesc} onChange={(e) => setReportDesc(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={() => setShowReport(false)} className="btn-secondary flex-1">{t('report.cancel')}</button>
            <button onClick={handleReport} disabled={!reportReason} className="btn-danger flex-1">{t('report.submit')}</button>
          </div>
        </ModalBody>
      </Modal>

      {/* Block modal */}
      <Modal isOpen={showBlock} onClose={() => setShowBlock(false)}>
        <ModalBody className="p-6">
          <h2 className="text-lg font-bold mb-2">{t('block.confirm')}</h2>
          <p className="text-sm text-gray-500 mb-4">{t('block.confirmDesc')}</p>
          <div className="flex gap-2">
            <button onClick={() => setShowBlock(false)} className="btn-secondary flex-1">{t('block.cancel')}</button>
            <button onClick={handleBlock} className="btn-danger flex-1">{t('block.confirmBtn')}</button>
          </div>
        </ModalBody>
      </Modal>

      {/* Delete message modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <ModalBody className="p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{t('messages.deleteMessage')}?</p>
          <div className="flex gap-2">
            <button onClick={() => setDeleteTarget(null)} className="btn-secondary flex-1">{t('common.cancel')}</button>
            <button onClick={() => deleteTarget && deleteMessage(deleteTarget)} className="btn-danger flex-1">{t('common.delete')}</button>
          </div>
        </ModalBody>
      </Modal>
    </div>
  );
}

function MessageIcon() {
  return <Send size={32} />;
}
