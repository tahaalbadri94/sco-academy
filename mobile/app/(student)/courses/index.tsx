import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useStore } from '@/store/useStore';
import Colors from '@/constants/Colors';
import { Course } from '@/store/types';

export default function StudentCoursesScreen() {
  const { courses, currentUser } = useStore();
  const myCourses = courses.filter((c) => c.enrolledStudents.includes(currentUser?.id ?? ''));

  const renderCourse = ({ item }: { item: Course }) => (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/(student)/courses/${item.id}` as any)}>
      <LinearGradient colors={[Colors.primary + '22', Colors.accent + '11']} style={styles.cardGrad}>
        <View style={styles.cardHeader}>
          <View style={[styles.badge, { backgroundColor: Colors.accent + '22' }]}>
            <Text style={[styles.badgeText, { color: Colors.accent }]}>{item.category}</Text>
          </View>
          <Ionicons name="book" size={24} color={Colors.primary} />
        </View>
        <Text style={styles.cardTitle}>{item.title}</Text>
        {item.description ? <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text> : null}
        <View style={styles.cardFooter}>
          <Ionicons name="chevron-back" size={18} color={Colors.textMuted} />
          <View style={styles.cardStats}>
            <View style={styles.statItem}>
              <Ionicons name="play-circle-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.statText}>{item.lessons.length} درس</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="lock-closed-outline" size={14} color={Colors.warning} />
              <Text style={[styles.statText, { color: Colors.warning }]}>محمي</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>كورساتي ({myCourses.length})</Text>
      </View>

      {myCourses.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="book-outline" size={64} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>لا توجد كورسات</Text>
          <Text style={styles.emptyText}>تواصل مع الأستاذ لتسجيلك في الكورسات</Text>
        </View>
      ) : (
        <FlatList data={myCourses} keyExtractor={(c) => c.id} renderItem={renderCourse}
          contentContainerStyle={{ padding: 16, gap: 12 }} showsVerticalScrollIndicator={false} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { color: Colors.text, fontSize: 18, fontWeight: '700', textAlign: 'right' },
  card: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  cardGrad: { padding: 16 },
  cardHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  cardTitle: { color: Colors.text, fontSize: 16, fontWeight: '700', textAlign: 'right', marginBottom: 6 },
  cardDesc: { color: Colors.textMuted, fontSize: 13, textAlign: 'right', marginBottom: 12 },
  cardFooter: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  cardStats: { flexDirection: 'row', gap: 12 },
  statItem: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
  statText: { color: Colors.textMuted, fontSize: 12 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyTitle: { color: Colors.text, fontSize: 16, fontWeight: '600' },
  emptyText: { color: Colors.textMuted, fontSize: 13, textAlign: 'center', paddingHorizontal: 40 },
});
