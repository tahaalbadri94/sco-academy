import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useStore } from '@/store/useStore';
import Colors from '@/constants/Colors';

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Ionicons name={icon as any} size={28} color={color} />
      <Text style={styles.statVal}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function TeacherDashboard() {
  const { currentUser, courses, users, exams, attempts, logout } = useStore();
  const students = users.filter((u) => u.role === 'student');
  const pendingGrading = attempts.filter((a) => a.status === 'submitted').length;

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={['#0A0E1A', '#111827']} style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={24} color={Colors.textMuted} />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.greeting}>مرحباً،</Text>
              <Text style={styles.name}>{currentUser?.name}</Text>
            </View>
            <LinearGradient colors={[Colors.primary, Colors.purple]} style={styles.avatar}>
              <Text style={styles.avatarText}>{currentUser?.name?.charAt(0)}</Text>
            </LinearGradient>
          </View>

          {/* Hero */}
          <LinearGradient colors={[Colors.primary, Colors.purple]} style={styles.hero}>
            <Text style={styles.heroTitle}>لوحة تحكم الأستاذ</Text>
            <Text style={styles.heroSub}>أكاديمية SCO التعليمية</Text>
            <View style={styles.heroBadge}>
              <Ionicons name="shield-checkmark" size={14} color="#fff" />
              <Text style={styles.heroBadgeText}>منصة موثوقة ومحمية</Text>
            </View>
          </LinearGradient>

          {/* Stats */}
          <Text style={styles.section}>الإحصائيات</Text>
          <View style={styles.statsGrid}>
            <StatCard icon="book" label="الكورسات" value={courses.length} color={Colors.primary} />
            <StatCard icon="people" label="الطلاب" value={students.length} color={Colors.accent} />
            <StatCard icon="clipboard" label="الامتحانات" value={exams.length} color={Colors.warning} />
            <StatCard icon="time" label="بانتظار التصحيح" value={pendingGrading} color={Colors.danger} />
          </View>

          {/* Quick Actions */}
          <Text style={styles.section}>إجراءات سريعة</Text>
          <View style={styles.actionsGrid}>
            {[
              { icon: 'add-circle-outline', label: 'إضافة كورس', color: Colors.primary, route: '/(teacher)/courses/index' },
              { icon: 'person-add-outline', label: 'إضافة طالب', color: Colors.accent, route: '/(teacher)/students/index' },
              { icon: 'create-outline', label: 'إنشاء امتحان', color: Colors.warning, route: '/(teacher)/exams/index' },
              { icon: 'notifications-outline', label: 'إرسال إشعار', color: Colors.purple, route: '/(teacher)/notifications' },
            ].map((a) => (
              <TouchableOpacity key={a.label} style={styles.actionBtn} onPress={() => router.push(a.route as any)}>
                <LinearGradient colors={[a.color + '22', a.color + '11']} style={styles.actionGrad}>
                  <Ionicons name={a.icon as any} size={28} color={a.color} />
                  <Text style={[styles.actionLabel, { color: a.color }]}>{a.label}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>

          {/* Recent Courses */}
          {courses.length > 0 && (
            <>
              <Text style={styles.section}>آخر الكورسات</Text>
              {courses.slice(-3).reverse().map((c) => (
                <TouchableOpacity key={c.id} style={styles.courseItem}
                  onPress={() => router.push(`/(teacher)/courses/${c.id}` as any)}>
                  <View style={styles.courseIcon}>
                    <Ionicons name="book" size={20} color={Colors.primary} />
                  </View>
                  <View style={styles.courseInfo}>
                    <Text style={styles.courseTitle}>{c.title}</Text>
                    <Text style={styles.courseMeta}>{c.enrolledStudents.length} طالب • {c.lessons.length} درس</Text>
                  </View>
                  <Ionicons name="chevron-back" size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              ))}
            </>
          )}

          <View style={{ height: 20 }} />
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1 },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 8 },
  headerCenter: { alignItems: 'center' },
  greeting: { color: Colors.textMuted, fontSize: 12 },
  name: { color: Colors.text, fontSize: 16, fontWeight: '700' },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  hero: { margin: 16, borderRadius: 20, padding: 24 },
  heroTitle: { color: '#fff', fontSize: 22, fontWeight: '800', textAlign: 'right', marginBottom: 4 },
  heroSub: { color: 'rgba(255,255,255,0.8)', fontSize: 14, textAlign: 'right', marginBottom: 12 },
  heroBadge: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-end', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  heroBadgeText: { color: '#fff', fontSize: 12 },
  section: { color: Colors.text, fontSize: 16, fontWeight: '700', paddingHorizontal: 16, marginBottom: 12, marginTop: 4, textAlign: 'right' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 10, marginBottom: 8 },
  statCard: { flex: 1, minWidth: '44%', backgroundColor: Colors.bgCard, borderRadius: 16, padding: 16, alignItems: 'center', gap: 6, borderLeftWidth: 3, borderWidth: 1, borderColor: Colors.border },
  statVal: { color: Colors.text, fontSize: 28, fontWeight: '800' },
  statLabel: { color: Colors.textMuted, fontSize: 12 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 10, marginBottom: 8 },
  actionBtn: { flex: 1, minWidth: '44%', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  actionGrad: { padding: 18, alignItems: 'center', gap: 8 },
  actionLabel: { fontSize: 13, fontWeight: '600' },
  courseItem: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: Colors.bgCard, marginHorizontal: 16, marginBottom: 10, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border },
  courseIcon: { width: 40, height: 40, backgroundColor: Colors.primary + '22', borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
  courseInfo: { flex: 1, alignItems: 'flex-end' },
  courseTitle: { color: Colors.text, fontSize: 14, fontWeight: '600', marginBottom: 2 },
  courseMeta: { color: Colors.textMuted, fontSize: 12 },
});
