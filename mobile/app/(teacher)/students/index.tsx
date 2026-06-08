import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useStore } from '@/store/useStore';
import Colors from '@/constants/Colors';
import { User } from '@/store/types';

export default function StudentsScreen() {
  const { users, courses, attempts, toggleStudentActive, sendMessage, currentUser } = useStore();
  const [search, setSearch] = useState('');

  const students = users
    .filter((u) => u.role === 'student')
    .filter((u) => u.name.includes(search) || (u.email ?? '').includes(search) || (u.phone ?? '').includes(search));

  const getStudentStats = (studentId: string) => {
    const enrolledCount = courses.filter((c) => c.enrolledStudents.includes(studentId)).length;
    const examCount = attempts.filter((a) => a.studentId === studentId && a.status === 'graded').length;
    return { enrolledCount, examCount };
  };

  const renderStudent = ({ item }: { item: User }) => {
    const stats = getStudentStats(item.id);
    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.cardActions}>
            <TouchableOpacity onPress={() => toggleStudentActive(item.id)} style={[styles.statusBadge, item.isActive ? styles.activeBadge : styles.blockedBadge]}>
              <Ionicons name={item.isActive ? 'checkmark-circle' : 'ban'} size={14} color={item.isActive ? Colors.accent : Colors.danger} />
              <Text style={[styles.statusText, { color: item.isActive ? Colors.accent : Colors.danger }]}>
                {item.isActive ? 'نشط' : 'محظور'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push(`/(teacher)/chat?studentId=${item.id}` as any)}>
              <Ionicons name="chatbubble-outline" size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.cardInfo}>
            <LinearGradient colors={item.isActive ? [Colors.primary, Colors.purple] : ['#444', '#333']} style={styles.avatar}>
              <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
            </LinearGradient>
            <View style={styles.nameWrap}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.contact}>{item.email || item.phone}</Text>
            </View>
          </View>
        </View>

        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Ionicons name="book-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.statText}>{stats.enrolledCount} كورس</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="clipboard-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.statText}>{stats.examCount} امتحان</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name={item.deviceId ? 'phone-portrait' : 'phone-portrait-outline'} size={14} color={item.deviceId ? Colors.accent : Colors.textMuted} />
            <Text style={styles.statText}>{item.deviceId ? 'جهاز مرتبط' : 'غير مرتبط'}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>الطلاب ({students.length})</Text>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
        <TextInput style={styles.searchInput} placeholder="بحث بالاسم أو الهاتف أو الإيميل..."
          placeholderTextColor={Colors.textMuted} value={search} onChangeText={setSearch} textAlign="right" />
      </View>

      {students.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="people-outline" size={64} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>لا يوجد طلاب مسجلون</Text>
          <Text style={styles.emptyText}>الطلاب يسجلون أنفسهم عبر التطبيق</Text>
        </View>
      ) : (
        <FlatList data={students} keyExtractor={(s) => s.id} renderItem={renderStudent}
          contentContainerStyle={{ padding: 16, gap: 12 }} showsVerticalScrollIndicator={false} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { color: Colors.text, fontSize: 18, fontWeight: '700' },
  searchWrap: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: Colors.bgCard, marginHorizontal: 16, borderRadius: 12, paddingHorizontal: 12, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  searchInput: { flex: 1, color: Colors.text, paddingVertical: 12, paddingHorizontal: 8, fontSize: 14 },
  card: { backgroundColor: Colors.bgCard, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border },
  cardTop: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  cardInfo: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  nameWrap: { alignItems: 'flex-end' },
  name: { color: Colors.text, fontSize: 15, fontWeight: '700' },
  contact: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  cardActions: { alignItems: 'flex-end', gap: 8 },
  statusBadge: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  activeBadge: { backgroundColor: Colors.accent + '22' },
  blockedBadge: { backgroundColor: Colors.danger + '22' },
  statusText: { fontSize: 12, fontWeight: '600' },
  stats: { flexDirection: 'row-reverse', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 10 },
  statItem: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
  statText: { color: Colors.textMuted, fontSize: 12 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyTitle: { color: Colors.text, fontSize: 16, fontWeight: '600' },
  emptyText: { color: Colors.textMuted, fontSize: 13 },
});
