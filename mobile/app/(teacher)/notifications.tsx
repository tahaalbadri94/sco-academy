import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/store/useStore';
import { sendLocalNotification } from '@/utils/notifications';
import Colors from '@/constants/Colors';

const NOTIF_TYPES = [
  { key: 'system', label: 'عام', icon: 'megaphone-outline', color: Colors.primary },
  { key: 'course', label: 'كورس', icon: 'book-outline', color: Colors.accent },
  { key: 'exam', label: 'امتحان', icon: 'clipboard-outline', color: Colors.warning },
  { key: 'grade', label: 'نتيجة', icon: 'ribbon-outline', color: Colors.purple },
] as const;

export default function TeacherNotificationsScreen() {
  const { users, notifications, addNotification, markNotificationRead, currentUser } = useStore();
  const [showSendModal, setShowSendModal] = useState(false);
  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');
  const [notifType, setNotifType] = useState<'system' | 'course' | 'exam' | 'grade'>('system');
  const [sendTo, setSendTo] = useState<'all' | string>('all');

  const myNotifs = notifications.filter((n) => n.userId === currentUser?.id);
  const students = users.filter((u) => u.role === 'student');

  const handleSend = async () => {
    if (!notifTitle.trim() || !notifBody.trim()) {
      Alert.alert('خطأ', 'أدخل العنوان والمحتوى');
      return;
    }

    const targets = sendTo === 'all' ? students : students.filter((s) => s.id === sendTo);

    targets.forEach((s) => {
      addNotification({
        userId: s.id,
        title: notifTitle.trim(),
        body: notifBody.trim(),
        type: notifType,
      });
    });

    await sendLocalNotification(notifTitle.trim(), notifBody.trim());

    Alert.alert('تم', `تم إرسال الإشعار إلى ${targets.length} طالب`);
    setNotifTitle(''); setNotifBody(''); setShowSendModal(false);
  };

  const typeInfo = (type: string) => NOTIF_TYPES.find((t) => t.key === type) ?? NOTIF_TYPES[0];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.sendBtn} onPress={() => setShowSendModal(true)}>
          <LinearGradient colors={[Colors.primary, Colors.purple]} style={styles.sendBtnGrad}>
            <Ionicons name="send-outline" size={18} color="#fff" />
            <Text style={styles.sendBtnText}>إرسال إشعار</Text>
          </LinearGradient>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>الإشعارات</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
        {myNotifs.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={64} color={Colors.textMuted} />
            <Text style={styles.emptyText}>لا توجد إشعارات</Text>
          </View>
        ) : (
          myNotifs.map((n) => {
            const t = typeInfo(n.type);
            return (
              <TouchableOpacity key={n.id} style={[styles.notifCard, !n.isRead && styles.notifUnread]}
                onPress={() => markNotificationRead(n.id)}>
                <View style={styles.notifMeta}>
                  <Text style={styles.notifTime}>
                    {new Date(n.createdAt).toLocaleDateString('ar')}
                  </Text>
                  {!n.isRead && <View style={styles.unreadDot} />}
                </View>
                <View style={styles.notifContent}>
                  <Text style={styles.notifTitle}>{n.title}</Text>
                  <Text style={styles.notifBody}>{n.body}</Text>
                </View>
                <View style={[styles.notifIcon, { backgroundColor: t.color + '22' }]}>
                  <Ionicons name={t.icon as any} size={22} color={t.color} />
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <Modal visible={showSendModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowSendModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>إرسال إشعار جديد</Text>
            </View>

            <Text style={styles.fieldLabel}>إرسال إلى</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
              <TouchableOpacity style={[styles.chip, sendTo === 'all' && styles.chipActive]} onPress={() => setSendTo('all')}>
                <Text style={[styles.chipText, sendTo === 'all' && { color: '#fff' }]}>جميع الطلاب</Text>
              </TouchableOpacity>
              {students.map((s) => (
                <TouchableOpacity key={s.id} style={[styles.chip, sendTo === s.id && styles.chipActive]}
                  onPress={() => setSendTo(s.id)}>
                  <Text style={[styles.chipText, sendTo === s.id && { color: '#fff' }]}>{s.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.fieldLabel}>نوع الإشعار</Text>
            <View style={styles.typeGrid}>
              {NOTIF_TYPES.map((t) => (
                <TouchableOpacity key={t.key} style={[styles.typeBtn, notifType === t.key && { borderColor: t.color }]}
                  onPress={() => setNotifType(t.key)}>
                  <Ionicons name={t.icon} size={20} color={notifType === t.key ? t.color : Colors.textMuted} />
                  <Text style={[styles.typeBtnText, notifType === t.key && { color: t.color }]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput style={styles.modalInput} placeholder="عنوان الإشعار *"
              placeholderTextColor={Colors.textMuted} value={notifTitle} onChangeText={setNotifTitle} textAlign="right" />
            <TextInput style={[styles.modalInput, { height: 90, textAlignVertical: 'top' }]}
              placeholder="محتوى الإشعار *" placeholderTextColor={Colors.textMuted}
              value={notifBody} onChangeText={setNotifBody} multiline textAlign="right" />

            <TouchableOpacity onPress={handleSend}>
              <LinearGradient colors={[Colors.primary, Colors.purple]} style={styles.modalBtn}>
                <Ionicons name="send-outline" size={18} color="#fff" />
                <Text style={styles.modalBtnText}>إرسال</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { color: Colors.text, fontSize: 18, fontWeight: '700' },
  sendBtn: { borderRadius: 12, overflow: 'hidden' },
  sendBtnGrad: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10 },
  sendBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  notifCard: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 12, backgroundColor: Colors.bgCard, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border },
  notifUnread: { borderColor: Colors.primary + '88', backgroundColor: Colors.primary + '0A' },
  notifIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  notifContent: { flex: 1, alignItems: 'flex-end' },
  notifTitle: { color: Colors.text, fontSize: 14, fontWeight: '700', marginBottom: 4 },
  notifBody: { color: Colors.textMuted, fontSize: 13, textAlign: 'right' },
  notifMeta: { alignItems: 'flex-end', gap: 4 },
  notifTime: { color: Colors.textMuted, fontSize: 11 },
  unreadDot: { width: 8, height: 8, backgroundColor: Colors.primary, borderRadius: 4 },
  empty: { paddingVertical: 60, alignItems: 'center', gap: 12 },
  emptyText: { color: Colors.textMuted, fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modal: { backgroundColor: Colors.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 12 },
  modalHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { color: Colors.text, fontSize: 18, fontWeight: '700' },
  fieldLabel: { color: Colors.textMuted, fontSize: 13, textAlign: 'right' },
  chip: { backgroundColor: Colors.bgLight, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { color: Colors.textMuted, fontSize: 13 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeBtn: { flex: 1, minWidth: '44%', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.bgLight, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Colors.border },
  typeBtnText: { color: Colors.textMuted, fontSize: 13 },
  modalInput: { backgroundColor: Colors.bgLight, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, color: Colors.text, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  modalBtn: { borderRadius: 12, paddingVertical: 16, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8 },
  modalBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
