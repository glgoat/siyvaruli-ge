import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/lib/theme-context';
import { useLanguage } from '@/lib/language-context';
import { formatTime } from '@/constants';
import type { Message } from '@/types';

export function MessageBubble({ message, isMine }: { message: Message; isMine: boolean }) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const isDeleted = !!message.deleted_at;

  return (
    <View style={[styles.container, isMine ? styles.mine : styles.theirs]}>
      <View style={[
        styles.bubble,
        isMine ? { backgroundColor: colors.primary, borderBottomRightRadius: 4 } : { backgroundColor: colors.card, borderBottomLeftRadius: 4 },
      ]}>
        {isDeleted ? (
          <Text style={[styles.text, { color: colors.textMuted, fontStyle: 'italic' }]}>{t('messages.messageDeleted')}</Text>
        ) : (
          <>
            {message.image_url && <Text>{message.image_url}</Text>}
            <Text style={[styles.text, { color: isMine ? '#fff' : colors.text }]}>{message.content}</Text>
            <Text style={[styles.time, { color: isMine ? 'rgba(255,255,255,0.6)' : colors.textMuted }]}>
              {formatTime(message.created_at)}
              {isMine && !isDeleted && (message.read ? ' ✓✓' : ' ✓')}
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', marginVertical: 3 },
  mine: { justifyContent: 'flex-end' },
  theirs: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '78%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, gap: 2 },
  text: { fontSize: 15, lineHeight: 20 },
  time: { fontSize: 10, alignSelf: 'flex-end' },
});
