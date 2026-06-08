import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/store/useStore';
import Colors from '@/constants/Colors';
import { Notification } from '@/store/types';

const TYPE_ICONS: Record<string, { icon: string; color: string }> = {
  course: { icon: 'book-outline', color: Colors.primary },
  exam: { icon: 'clipboard-outline', color: Colors.warning },
  message: { icon: 'chatbubble-outline', color: Colors.accent },
  grade: { icon: 'ribbon-outline', color: Colors.gold },
  system: { icon: 'megaphone-outline', color: Colors.purple },
};

export default function StudentNotificationsScreen() {
  const { notifications, currentUser, markNotificationRead } = useStore();
  const myNotifs = notifications.filter((n) => n.userId === currentUser?.id);
  const unreadCount = myNotifs.filter((n) => !n.isRead).length;

  const renderNotif = ({ item }: { item: Notification }) => {
    const t = TYPE_ICONS[item.type] ?? TYPE_ICONS.system;
    return (
      <TouchableOpacity style={[styles.card, !item.isRead && styles.cardUnread]}
        onPress={() => markNotificationRead(item.id)}>
        <View style={styles.cardMeta}>
          <Text style={styles.time}>
            {new Date(item.createdAt).toLocaleDateString('ar', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </Text>
          {!item.isRead && <View style={styles.unreadDot} />}
        </View>
        <View style={styles.cardBody}>
          <View style={styles.content}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
          </View>
          <View style={[styles.icon, { backgroundColor: t.color + '22' }]}>
            <Ionicons name={t.icon as any} size={22} color={t.color} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount} غير مقروء</Text>
          </View>
        )}
        <Text style={styles.headerTitle}>الإشعارات</Text>
      </View>

      {myNotifs.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="notifications-off-outline" size={64} color={Colors.textMuted} />
          <Text style={styles.emptyText}>لا توجد إشعارات</Text>
        </View>
      ) : (
        <FlatList data={myNotifs} keyExtractor={(n) => n.id} renderItem={renderNotif}
          contentContainerStyle={{ padding: 16, gap: 10 }} showsVerticalScrollIndicator={false} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { color: Colors.text, fontSize: 18, fontWeight: '700' },
  badge: { backgroundColor: Colors.primary + '22', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 4 },
  badgeText: { color: Colors.primary, fontSize: 12, fontWeight: '600' },
  card: { backgroundColor: Colors.bgCard, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border },
  cardUnread: { borderColor: Colors.primary + '66', backgroundColor: Colors.primary + '0A' },
  cardMeta: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  time: { color: Colors.textMuted, fontSize: 11 },
  unreadDot: { width: 8, height: 8, backgroundColor: Colors.primary, borderRadius: 4 },
  cardBody: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 12 },
  icon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, alignItems: 'flex-end' },
  title: { color: Colors.text, fontSize: 14, fontWeight: '700', marginBottom: 4 },
  body: { color: Colors.textMuted, fontSize: 13, textAlign: 'right', lineHeight: 20 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { color: Colors.textMuted, fontSize: 16 },
});
