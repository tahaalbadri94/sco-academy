import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useStore } from '@/store/useStore';
import Colors from '@/constants/Colors';
import { Exam } from '@/store/types';

export default function StudentExamsScreen() {
  const { exams, courses, attempts, currentUser } = useStore();
  const myCourses = courses.filter((c) => c.enrolledStudents.includes(currentUser?.id ?? ''));
  const myAttempts = attempts.filter((a) => a.studentId === currentUser?.id);

  const availableExams = exams.filter((e) =>
    myCourses.some((c) => c.id === e.courseId) && e.isPublished
  );

  const getAttempt = (examId: string) => myAttempts.find((a) => a.examId === examId);

  const renderExam = ({ item }: { item: Exam }) => {
    const attempt = getAttempt(item.id);
    const course = courses.find((c) => c.id === item.courseId);

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          {attempt ? (
            <View style={[styles.statusBadge,
              attempt.status === 'graded' ? styles.gradedBadge :
              attempt.status === 'submitted' ? styles.pendingBadge : styles.progressBadge]}>
              <Text style={[styles.statusText,
                attempt.status === 'graded' ? { color: Colors.accent } :
                attempt.status === 'submitted' ? { color: Colors.warning } : { color: Colors.primary }]}>
                {attempt.status === 'graded' ? (attempt.percentage !== undefined ? `${attempt.percentage}%` : 'مصحح') :
                 attempt.status === 'submitted' ? 'بانتظار التصحيح' : 'قيد التأدية'}
              </Text>
            </View>
          ) : (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>جديد</Text>
            </View>
          )}
          <Text style={styles.cardTitle}>{item.title}</Text>
        </View>

        {course && <Text style={styles.cardCourse}>{course.title}</Text>}

        <View style={styles.cardMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="help-circle-outline" size={13} color={Colors.textMuted} />
            <Text style={styles.metaText}>{item.questions.length} سؤال</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={13} color={Colors.textMuted} />
            <Text style={styles.metaText}>{item.duration} دقيقة</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="star-outline" size={13} color={Colors.textMuted} />
            <Text style={styles.metaText}>{item.totalPoints} درجة</Text>
          </View>
        </View>

        <View style={styles.protections}>
          {item.preventScreenCapture && (
            <View style={styles.protect}>
              <Ionicons name="camera-outline" size={11} color={Colors.warning} />
              <Text style={styles.protectTxt}>ممنوع التصوير</Text>
            </View>
          )}
          {item.preventTabSwitch && (
            <View style={styles.protect}>
              <Ionicons name="eye-outline" size={11} color={Colors.warning} />
              <Text style={styles.protectTxt}>مراقبة الغش</Text>
            </View>
          )}
        </View>

        {!attempt ? (
          <TouchableOpacity onPress={() => router.push(`/(student)/exams/${item.id}` as any)}>
            <LinearGradient colors={[Colors.primary, Colors.purple]} style={styles.startBtn}>
              <Text style={styles.startBtnText}>ابدأ الامتحان</Text>
              <Ionicons name="arrow-back" size={18} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        ) : attempt.status === 'graded' ? (
          <View style={styles.gradeResult}>
            <Ionicons name="trophy" size={20} color={Colors.gold} />
            <Text style={styles.gradeResultText}>
              النتيجة: {attempt.totalPoints ?? 0}/{item.totalPoints} ({attempt.percentage}%)
            </Text>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>الامتحانات ({availableExams.length})</Text>
      </View>

      {availableExams.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="clipboard-outline" size={64} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>لا توجد امتحانات</Text>
          <Text style={styles.emptyText}>ستظهر الامتحانات هنا عند إضافتها من قبل الأستاذ</Text>
        </View>
      ) : (
        <FlatList data={availableExams} keyExtractor={(e) => e.id} renderItem={renderExam}
          contentContainerStyle={{ padding: 16, gap: 12 }} showsVerticalScrollIndicator={false} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { color: Colors.text, fontSize: 18, fontWeight: '700', textAlign: 'right' },
  card: { backgroundColor: Colors.bgCard, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 10 },
  cardTop: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { color: Colors.text, fontSize: 15, fontWeight: '700', flex: 1, textAlign: 'right', marginLeft: 8 },
  cardCourse: { color: Colors.textMuted, fontSize: 12, textAlign: 'right' },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  gradedBadge: { backgroundColor: Colors.accent + '22' },
  pendingBadge: { backgroundColor: Colors.warning + '22' },
  progressBadge: { backgroundColor: Colors.primary + '22' },
  statusText: { fontSize: 12, fontWeight: '700' },
  newBadge: { backgroundColor: Colors.danger + '22', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  newBadgeText: { color: Colors.danger, fontSize: 12, fontWeight: '700' },
  cardMeta: { flexDirection: 'row-reverse', gap: 12 },
  metaItem: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
  metaText: { color: Colors.textMuted, fontSize: 12 },
  protections: { flexDirection: 'row-reverse', gap: 8, flexWrap: 'wrap' },
  protect: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, backgroundColor: Colors.warning + '11', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  protectTxt: { color: Colors.warning, fontSize: 11 },
  startBtn: { borderRadius: 12, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 8 },
  startBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  gradeResult: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, backgroundColor: Colors.gold + '11', borderRadius: 12, padding: 12 },
  gradeResultText: { color: Colors.gold, fontSize: 14, fontWeight: '700' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyTitle: { color: Colors.text, fontSize: 16, fontWeight: '600' },
  emptyText: { color: Colors.textMuted, fontSize: 13, textAlign: 'center', paddingHorizontal: 40 },
});
