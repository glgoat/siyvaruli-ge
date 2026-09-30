import React, { useRef, useEffect } from 'react';
import { View, TextInput, Pressable, StyleSheet, Keyboard } from 'react-native';
import { Send } from '@expo/vector-icons/build/Feather';
import { useTheme } from '@/lib/theme-context';
import { useLanguage } from '@/lib/language-context';

interface ChatInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onTyping: () => void;
}

export function ChatInput({ value, onChangeText, onSend, onTyping }: ChatInputProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const inputRef = useRef<TextInput>(null);

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(v) => { onChangeText(v); onTyping(); }}
        placeholder={t('messages.typeMessage')}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, { backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }]}
        multiline={false}
        returnKeyType="send"
        onSubmitEditing={() => { if (value.trim()) { onSend(); } }}
        blurOnSubmit={false}
      />
      <Pressable
        onPress={() => { if (value.trim()) { onSend(); } }}
        disabled={!value.trim()}
        style={[styles.sendBtn, { backgroundColor: value.trim() ? colors.primary : colors.border }]}
      >
        <Send size={20} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1 },
  input: { flex: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, borderWidth: 1, maxHeight: 100 },
  sendBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
});
