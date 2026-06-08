import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useStore } from '@/store/useStore';
import Colors from '@/constants/Colors';

export default function StudentDashboard() {
  const { currentUser, courses, exams, attempts, notifications, logout } = useStore();
  const myCourses = courses.filter((c) => c.enrolledStudents.includes(currentUser?.id ?? ''));
  const myAttempts = attempts.filter((a) => a.studentId === currentUser?.id);
  const unreadNotifs = notifications.filter((n) => n.userId === currentUser?.id && !n.isRead).length;

  const avgScore = myAttempts.filter((a) => a.percentage !== undefined).reduce((sum, a, _, arr) => {
    return sum + (a.percentage ?? 0) / arr.length;
  }, 0);

  const availableExams = exams.filter((e) => {
    const enrolled = myCourses.some((c) => c.id === e.courseId);
    const attempted = myAttempts.some((a) => a.examId === e.id);
    return enrolled && !attempted && e.isPublished;
  });

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={['#0A0E1A', '#111827']} style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => { logout(); router.replace('/(auth)/login'); }}>
              <Ionicons name="log-out-outline" size={24} color={Colors.textMuted} />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.greeting}>مرحباً،</Text>
              <Text style={styles.name}>{currentUser?.name}</Text>
            </View>
            <LinearGradient colors={[Colors.accent, '#059669']} style={styles.avatar}>
              <Text style={styles.avatarText}>{currentUser?.name?.charAt(0)}</Text>
            </LinearGradient>
          </View>

          {/* Hero */}
          <LinearGradient colors={[Colors.accent, '#059669']} style={styles.hero}>
            <Text style={styles.heroTitle}>لوحة الطالب</Text>
            <Text style={styles.heroSub}>استمر في رحلتك التعليمية</Text>
            {unreadNotifs > 0 && (
              <TouchableOpacity style={styles.heroBadge} onPress={() => router.push('/(student)/notifications')}>
                <Ionicons name="notifications" size={14} color="#fff" />
                <Text style={styles.heroBadgeText}>{unreadNotifs} إشعار جديد</Text>
              </TouchableOpacity>
            )}
          </LinearGradient>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Ionicons name="book" size={24} color={Colors.primary} />
              <Text style={styles.statVal}>{myCourses.length}</Text>
              <Text style={styles.statLabel}>كورساتي</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="clipboard" size={24} color={Colors.warning} />
              <Text style={styles.statVal}>{myAttempts.length}</Text>
              <Text style={styles.statLabel}>الامتحانات</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="trophy" size={24} color={Colors.gold} />
              <Text style={styles.statVal}>{avgScore > 0 ? `${Math.round(avgScore)}%` : '--'}</Text>
              <Text style={styles.statLabel}>متوسط الدرجات</Text>
            </View>
          </View>

          {/* Available Exams */}
          {availableExams.length > 0 && (
            <>
              <Text style={styles.section}>امتحانات متاحة 🔔</Text>
              {availableExams.map((exam) => (
                <TouchableOpacity key={exam.id} style={styles.examAlert}
                  onPress={() => router.push(`/(student)/exams/${exam.id}` as any)}>
                  <Ionicons name="chevron-back" size={18} color={Colors.warning} />
                  <View style={styles.examAlertInfo}>
                    <Text style={styles.examAlertTitle}>{exam.title}</Text>
                    <Text style={styles.examAlertMeta}>{exam.duration} دقيقة • {exam.questions.length} سؤال</Text>
                  </View>
                  <Ionicons name="clipboard-outline" size={22} color={Colors.warning} />
                </TouchableOpacity>
              ))}
            </>
          )}

          {/* My Courses */}
          {myCourses.length > 0 && (
            <>
              <Text style={styles.section}>كورساتي</Text>
              {myCourses.slice(0, 3).map((c) => (
                <TouchableOpacity key={c.id} style={styles.courseItem}
                  onPress={() => router.push(`/(student)/courses/${c.id}` as any)}>
                  <Ionicons name="chevron-back" size={18} color={Colors.textMuted} />
                  <View style={styles.courseInfo}>
                    <Text style={styles.courseTitle}>{c.title}</Text>
                    <Text style={styles.courseMeta}>{c.lessons.length} درس</Text>
                  </View>
                  <View style={[styles.courseIcon, { backgroundColor: Colors.primary + '22' }]}>
                    <Ionicons name="book" size={20} color={Colors.primary} />
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}

          {myCourses.length === 0 && (
            <View style={styles.empty}>
              <Ionicons name="book-outline" size={64} color={Colors.textMuted} />
              <Text style={styles.emptyText}>لم يتم تسجيلك في أي كورس بعد</Text>
              <Text style={styles.emptySubText}>تواصل مع الأستاذ لتسجيلك</Text>
            </View>
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
  heroBadge: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.25)', alignSelf: 'flex-end', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  heroBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 8 },
  statCard: { flex: 1, backgroundColor: Colors.bgCard, borderRadius: 14, padding: 14, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: Colors.border },
  statVal: { color: Colors.text, fontSize: 22, fontWeight: '800' },
  statLabel: { color: Colors.textMuted, fontSize: 11, textAlign: 'center' },
  section: { color: Colors.text, fontSize: 16, fontWeight: '700', paddingHorizontal: 16, marginBottom: 12, marginTop: 8, textAlign: 'right' },
  examAlert: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: Colors.warning + '11', borderRadius: 14, marginHorizontal: 16, marginBottom: 10, padding: 14, borderWidth: 1, borderColor: Colors.warning + '44' },
  examAlertInfo: { flex: 1, marginHorizontal: 12, alignItems: 'flex-end' },
  examAlertTitle: { color: Colors.text, fontSize: 14, fontWeight: '700', marginBottom: 2 },
  examAlertMeta: { color: Colors.textMuted, fontSize: 12 },
  courseItem: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: Colors.bgCard, marginHorizontal: 16, marginBottom: 10, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border },
  courseIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
  courseInfo: { flex: 1, alignItems: 'flex-end' },
  courseTitle: { color: Colors.text, fontSize: 14, fontWeight: '600', marginBottom: 2 },
  courseMeta: { color: Colors.textMuted, fontSize: 12 },
  empty: { padding: 40, alignItems: 'center', gap: 10 },
  emptyText: { color: Colors.text, fontSize: 15, fontWeight: '600' },
  emptySubText: { color: Colors.textMuted, fontSize: 13 },
});
