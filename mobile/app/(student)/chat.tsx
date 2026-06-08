import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/store/useStore';
import Colors from '@/constants/Colors';

const TEACHER_ID = 'teacher_001';

export default function StudentChatScreen() {
  const { messages, currentUser, sendMessage, markMessagesRead, users } = useStore();
  const [text, setText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const teacher = users.find((u) => u.id === TEACHER_ID);

  const convMessages = messages.filter(
    (m) =>
      (m.senderId === currentUser?.id && m.receiverId === TEACHER_ID) ||
      (m.senderId === TEACHER_ID && m.receiverId === currentUser?.id)
  ).sort((a, b) => a.sentAt - b.sentAt);

  useEffect(() => {
    if (currentUser) {
      const convId = [currentUser.id, TEACHER_ID].sort().join('_');
      markMessagesRead(convId, currentUser.id);
    }
  }, [messages.length]);

  const handleSend = () => {
    if (!text.trim() || !currentUser) return;
    sendMessage(currentUser.id, TEACHER_ID, text.trim());
    setText('');
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <LinearGradient colors={[Colors.primary, Colors.purple]} style={styles.avatar}>
          <Text style={styles.avatarText}>{teacher?.name?.charAt(0) ?? 'أ'}</Text>
        </LinearGradient>
        <View style={styles.headerInfo}>
          <Text style={styles.teacherName}>{teacher?.name ?? 'الأستاذ'}</Text>
          <Text style={styles.teacherStatus}>● متاح للرد</Text>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={90}>
        <FlatList
          ref={flatListRef}
          data={convMessages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 16, gap: 8, flexGrow: 1, justifyContent: 'flex-end' }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.emptyConv}>
              <Ionicons name="chatbubbles-outline" size={56} color={Colors.textMuted} />
              <Text style={styles.emptyText}>ابدأ محادثة مع الأستاذ</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isMe = item.senderId === currentUser?.id;
            return (
              <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
                <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextThem]}>
                  {item.text}
                </Text>
                <View style={styles.bubbleMeta}>
                  {isMe && <Ionicons name={item.isRead ? 'checkmark-done' : 'checkmark'} size={12} color="rgba(255,255,255,0.6)" />}
                  <Text style={[styles.bubbleTime, isMe && { color: 'rgba(255,255,255,0.6)' }]}>
                    {new Date(item.sentAt).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            );
          }}
        />

        <View style={styles.inputBar}>
          <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
            <LinearGradient colors={[Colors.primary, Colors.purple]} style={styles.sendBtnGrad}>
              <Ionicons name="send" size={18} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="اكتب رسالة للأستاذ..."
            placeholderTextColor={Colors.textMuted}
            value={text}
            onChangeText={setText}
            multiline
            textAlign="right"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.bgCard, borderBottomWidth: 1, borderBottomColor: Colors.border },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  headerInfo: { alignItems: 'flex-end' },
  teacherName: { color: Colors.text, fontSize: 16, fontWeight: '700' },
  teacherStatus: { color: Colors.accent, fontSize: 12, marginTop: 2 },
  emptyConv: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { color: Colors.textMuted, fontSize: 15 },
  bubble: { maxWidth: '80%', borderRadius: 16, padding: 12 },
  bubbleMe: { alignSelf: 'flex-end', backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  bubbleThem: { alignSelf: 'flex-start', backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleTextMe: { color: '#fff', textAlign: 'right' },
  bubbleTextThem: { color: Colors.text, textAlign: 'right' },
  bubbleMeta: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, marginTop: 4 },
  bubbleTime: { fontSize: 10, color: Colors.textMuted },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, gap: 10, backgroundColor: Colors.bgCard, borderTopWidth: 1, borderTopColor: Colors.border },
  input: { flex: 1, backgroundColor: Colors.bgLight, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: Colors.text, fontSize: 14, maxHeight: 100, borderWidth: 1, borderColor: Colors.border },
  sendBtn: { borderRadius: 20, overflow: 'hidden' },
  sendBtnGrad: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 21 },
});
