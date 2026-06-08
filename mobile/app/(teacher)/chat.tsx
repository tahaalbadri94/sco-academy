import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useStore } from '@/store/useStore';
import Colors from '@/constants/Colors';

export default function TeacherChatScreen() {
  const { studentId } = useLocalSearchParams<{ studentId?: string }>();
  const { users, messages, conversations, currentUser, sendMessage, markMessagesRead } = useStore();
  const [selectedConv, setSelectedConv] = useState<string | null>(studentId ?? null);
  const [text, setText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const students = users.filter((u) => u.role === 'student');

  useEffect(() => {
    if (studentId) setSelectedConv(studentId);
  }, [studentId]);

  const convMessages = selectedConv
    ? messages.filter(
        (m) =>
          (m.senderId === currentUser?.id && m.receiverId === selectedConv) ||
          (m.senderId === selectedConv && m.receiverId === currentUser?.id)
      ).sort((a, b) => a.sentAt - b.sentAt)
    : [];

  useEffect(() => {
    if (selectedConv && currentUser) {
      const convId = [currentUser.id, selectedConv].sort().join('_');
      markMessagesRead(convId, currentUser.id);
    }
  }, [selectedConv, messages.length]);

  const handleSend = () => {
    if (!text.trim() || !selectedConv || !currentUser) return;
    sendMessage(currentUser.id, selectedConv, text.trim());
    setText('');
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const getUnreadCount = (studentId: string) => {
    return messages.filter((m) => m.senderId === studentId && m.receiverId === currentUser?.id && !m.isRead).length;
  };

  const selectedStudent = users.find((u) => u.id === selectedConv);

  if (selectedConv && selectedStudent) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.chatHeader}>
          <TouchableOpacity onPress={() => setSelectedConv(null)}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.chatHeaderInfo}>
            <Text style={styles.chatHeaderName}>{selectedStudent.name}</Text>
            <Text style={styles.chatHeaderSub}>{selectedStudent.email || selectedStudent.phone}</Text>
          </View>
          <LinearGradient colors={[Colors.accent, '#059669']} style={styles.chatAvatar}>
            <Text style={styles.chatAvatarText}>{selectedStudent.name.charAt(0)}</Text>
          </LinearGradient>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={90}>
          <FlatList
            ref={flatListRef}
            data={convMessages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={{ padding: 16, gap: 8 }}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            renderItem={({ item }) => {
              const isMe = item.senderId === currentUser?.id;
              return (
                <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
                  <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextThem]}>
                    {item.text}
                  </Text>
                  <Text style={[styles.bubbleTime, isMe && { color: 'rgba(255,255,255,0.6)' }]}>
                    {new Date(item.sentAt).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
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
              placeholder="اكتب رسالة..."
              placeholderTextColor={Colors.textMuted}
              value={text}
              onChangeText={setText}
              multiline
              textAlign="right"
              onSubmitEditing={handleSend}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>الرسائل</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
        {students.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="chatbubbles-outline" size={64} color={Colors.textMuted} />
            <Text style={styles.emptyText}>لا يوجد طلاب للمراسلة</Text>
          </View>
        ) : (
          students.map((s) => {
            const unread = getUnreadCount(s.id);
            const lastMsg = messages
              .filter((m) => (m.senderId === s.id && m.receiverId === currentUser?.id) ||
                (m.senderId === currentUser?.id && m.receiverId === s.id))
              .sort((a, b) => b.sentAt - a.sentAt)[0];
            return (
              <TouchableOpacity key={s.id} style={styles.convItem} onPress={() => setSelectedConv(s.id)}>
                <View>
                  {unread > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{unread}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.convInfo}>
                  <View style={styles.convTop}>
                    <Text style={styles.convTime}>
                      {lastMsg ? new Date(lastMsg.sentAt).toLocaleDateString('ar') : ''}
                    </Text>
                    <Text style={styles.convName}>{s.name}</Text>
                  </View>
                  <Text style={styles.convLast} numberOfLines={1}>
                    {lastMsg ? lastMsg.text : 'ابدأ المحادثة...'}
                  </Text>
                </View>
                <LinearGradient colors={[Colors.primary, Colors.purple]} style={styles.convAvatar}>
                  <Text style={styles.convAvatarText}>{s.name.charAt(0)}</Text>
                </LinearGradient>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { color: Colors.text, fontSize: 18, fontWeight: '700', textAlign: 'right' },
  chatHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.bgCard, borderBottomWidth: 1, borderBottomColor: Colors.border },
  chatHeaderInfo: { flex: 1, alignItems: 'flex-end', marginRight: 12 },
  chatHeaderName: { color: Colors.text, fontSize: 15, fontWeight: '700' },
  chatHeaderSub: { color: Colors.textMuted, fontSize: 12 },
  chatAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  chatAvatarText: { color: '#fff', fontWeight: '800' },
  bubble: { maxWidth: '80%', borderRadius: 16, padding: 12 },
  bubbleMe: { alignSelf: 'flex-end', backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  bubbleThem: { alignSelf: 'flex-start', backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleTextMe: { color: '#fff', textAlign: 'right' },
  bubbleTextThem: { color: Colors.text, textAlign: 'right' },
  bubbleTime: { fontSize: 10, color: Colors.textMuted, marginTop: 4, textAlign: 'right' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, gap: 10, backgroundColor: Colors.bgCard, borderTopWidth: 1, borderTopColor: Colors.border },
  input: { flex: 1, backgroundColor: Colors.bgLight, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: Colors.text, fontSize: 14, maxHeight: 100, borderWidth: 1, borderColor: Colors.border },
  sendBtn: { borderRadius: 20, overflow: 'hidden' },
  sendBtnGrad: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
  convItem: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, backgroundColor: Colors.bgCard, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border },
  convAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  convAvatarText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  convInfo: { flex: 1, alignItems: 'flex-end' },
  convTop: { flexDirection: 'row-reverse', justifyContent: 'space-between', width: '100%', marginBottom: 4 },
  convName: { color: Colors.text, fontSize: 15, fontWeight: '700' },
  convTime: { color: Colors.textMuted, fontSize: 11 },
  convLast: { color: Colors.textMuted, fontSize: 12 },
  unreadBadge: { backgroundColor: Colors.primary, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  unreadText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  empty: { paddingVertical: 60, alignItems: 'center', gap: 12 },
  emptyText: { color: Colors.textMuted, fontSize: 16 },
});
