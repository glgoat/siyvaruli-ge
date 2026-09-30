import React, { useRef, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { ArrowLeft, MoreVertical, Flag, Ban, UserX } from '@expo/vector-icons/build/Feather';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { useTheme } from '@/lib/theme-context';
import { useChat } from '@/hooks/useChat';
import { MessageBubble } from '@/components/MessageBubble';
import { ChatInput } from '@/components/ChatInput';
import { LoadingScreen, EmptyState } from '@/components/Feedback';
import { AppModal } from '@/components/Modal';
import { UserAvatar } from '@/components/UserAvatar';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/Button';
import type { TranslationKey } from '@/constants/i18n';

export default function ChatScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { colors } = useTheme();
  const router = useRouter();
  const { messages, otherProfile, otherPhotos, loading, isTyping, input, setInput, handleSend, handleDelete, handleTyping, otherIsOnline } = useChat(matchId);
  const [showMenu, setShowMenu] = React.useState(false);
  const [showReport, setShowReport] = React.useState(false);
  const [showBlock, setShowBlock] = React.useState(false);
  const [reportReason, setReportReason] = React.useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  if (loading) return <LoadingScreen />;
  if (!otherProfile) return <EmptyState icon={<Text>?</Text>} title={t('common.notFound')} description="" />;

  const handleBlock = async () => {
    if (!user || !otherProfile) return;
    await supabase.from('blocks').insert({ blocker_id: user.id, blocked_id: otherProfile.id });
    await supabase.from('matches').delete().eq('id', matchId);
    setShowBlock(false);
    router.replace('/(tabs)/matches');
  };

  const handleReport = async () => {
    if (!user || !otherProfile || !reportReason) return;
    await supabase.from('reports').insert({ reporter_id: user.id, reported_id: otherProfile.id, reason: reportReason });
    setShowReport(false);
    setReportReason('');
  };

  const handleUnmatch = async () => {
    await supabase.from('matches').delete().eq('id', matchId);
    router.replace('/(tabs)/matches');
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.bg }} keyboardVerticalOffset={0}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
          <ArrowLeft size={22} color={colors.text} />
        </Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
          <UserAvatar name={otherProfile.first_name} photo={otherPhotos[0]} size={40} />
          <View>
            <Text style={{ fontWeight: '600', color: colors.text, fontSize: 16 }}>{otherProfile.first_name}</Text>
            <Text style={{ fontSize: 12, color: otherIsOnline ? colors.success : colors.textMuted }}>
              {otherIsOnline ? t('messages.online') : ''}
            </Text>
          </View>
        </View>
        <Pressable onPress={() => setShowMenu(!showMenu)} style={{ padding: 8 }}>
          <MoreVertical size={22} color={colors.textSecondary} />
        </Pressable>
      </View>

      {showMenu && (
        <Pressable onPress={() => setShowMenu(false)} style={styles.menuOverlay}>
          <View style={[styles.menu, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Pressable onPress={() => { setShowMenu(false); setShowReport(true); }} style={styles.menuItem}>
              <Flag size={16} color={colors.textSecondary} /><Text style={{ color: colors.text, fontSize: 14 }}>{t('messages.reportUser')}</Text>
            </Pressable>
            <Pressable onPress={() => { setShowMenu(false); setShowBlock(true); }} style={styles.menuItem}>
              <Ban size={16} color={colors.textSecondary} /><Text style={{ color: colors.text, fontSize: 14 }}>{t('messages.blockUser')}</Text>
            </Pressable>
            <Pressable onPress={handleUnmatch} style={styles.menuItem}>
              <UserX size={16} color={colors.error} /><Text style={{ color: colors.error, fontSize: 14 }}>{t('messages.unmatch')}</Text>
            </Pressable>
          </View>
        </Pressable>
      )}

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        renderItem={({ item }) => (
          <MessageBubble message={item} isMine={item.sender_id === user?.id} />
        )}
        ListEmptyComponent={
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 }}>
            <Text style={{ color: colors.textMuted, fontSize: 15 }}>{t('messages.noMessages')}</Text>
          </View>
        }
        ListFooterComponent={
          isTyping ? (
            <View style={{ flexDirection: 'row', gap: 4, paddingHorizontal: 14, paddingVertical: 8 }}>
              <View style={[styles.typingDot, { backgroundColor: colors.textMuted }]} />
              <View style={[styles.typingDot, { backgroundColor: colors.textMuted }]} />
              <View style={[styles.typingDot, { backgroundColor: colors.textMuted }]} />
            </View>
          ) : null
        }
      />

      <ChatInput value={input} onChangeText={setInput} onSend={handleSend} onTyping={handleTyping} />

      {/* Report modal */}
      <AppModal visible={showReport} onClose={() => setShowReport(false)} title={t('report.title')}>
        <View style={{ padding: 20, gap: 12 }}>
          <Text style={{ fontSize: 14, fontWeight: '500', color: colors.textSecondary }}>{t('report.reason')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {(['harassment', 'spam', 'fake_profile', 'inappropriate_photo', 'underage', 'violence', 'hate_speech', 'scam', 'other'] as const).map((r) => (
              <Pressable key={r} onPress={() => setReportReason(r)} style={[styles.cityPill, { borderColor: reportReason === r ? colors.primary : colors.border, backgroundColor: reportReason === r ? colors.primaryLight : 'transparent' }]}>
                <Text style={{ color: reportReason === r ? colors.primary : colors.textSecondary, fontSize: 13 }}>{t(`report.${r}` as TranslationKey)}</Text>
              </Pressable>
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <Button title={t('report.cancel')} variant="secondary" onPress={() => setShowReport(false)} />
            <Button title={t('report.submit')} variant="danger" onPress={handleReport} disabled={!reportReason} />
          </View>
        </View>
      </AppModal>

      {/* Block modal */}
      <AppModal visible={showBlock} onClose={() => setShowBlock(false)} title={t('block.confirm')}>
        <View style={{ padding: 20, gap: 16 }}>
          <Text style={{ fontSize: 14, color: colors.textMuted }}>{t('block.confirmDesc')}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button title={t('block.cancel')} variant="secondary" onPress={() => setShowBlock(false)} />
            <Button title={t('block.confirmBtn')} variant="danger" onPress={handleBlock} />
          </View>
        </View>
      </AppModal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, paddingTop: 50 },
  menuOverlay: { position: 'absolute', top: 60, right: 12, zIndex: 50, width: '100%', height: '100%' },
  menu: { position: 'absolute', top: 0, right: 12, borderRadius: 12, borderWidth: 1, padding: 4, gap: 2, minWidth: 180, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, elevation: 8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 },
  typingDot: { width: 8, height: 8, borderRadius: 4 },
  cityPill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
});
