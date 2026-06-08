import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { preventCapture, allowCapture } from '@/utils/screenCapture';
import { useStore } from '@/store/useStore';
import Colors from '@/constants/Colors';
import { Lesson } from '@/store/types';

export default function StudentCourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { courses, currentUser } = useStore();
  const course = courses.find((c) => c.id === id);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);

  // Prevent screen capture when viewing course content
  useEffect(() => {
    preventCapture('course_view');
    return () => {
      allowCapture('course_view');
    };
  }, []);

  if (!course) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={{ color: Colors.text, textAlign: 'center', marginTop: 40 }}>الكورس غير موجود</Text>
      </SafeAreaView>
    );
  }

  if (activeLesson) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.lessonHeader}>
          <TouchableOpacity onPress={() => setActiveLesson(null)}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.lessonHeaderTitle} numberOfLines={1}>{activeLesson.title}</Text>
          <Ionicons name="lock-closed" size={18} color={Colors.warning} />
        </View>

        {/* Protected content area */}
        <View style={styles.protectedArea}>
          <View style={styles.videoPlaceholder}>
            <Ionicons name="play-circle" size={72} color={Colors.primary} />
            <Text style={styles.videoTitle}>{activeLesson.title}</Text>
            {activeLesson.duration > 0 && (
              <Text style={styles.videoDuration}>{activeLesson.duration} دقيقة</Text>
            )}
          </View>

          <View style={styles.protectBanner}>
            <Ionicons name="shield-checkmark" size={16} color={Colors.warning} />
            <Text style={styles.protectText}>هذا المحتوى محمي • التصوير والتسجيل ممنوع</Text>
          </View>

          <View style={styles.lessonContent}>
            <Text style={styles.lessonDesc}>{activeLesson.description || 'لا يوجد وصف للدرس'}</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{course.title}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[Colors.primary, Colors.purple]} style={styles.banner}>
          <Text style={styles.bannerTitle}>{course.title}</Text>
          <Text style={styles.bannerDesc}>{course.description || 'لا يوجد وصف'}</Text>
          <View style={styles.bannerStats}>
            <View style={styles.bannerStat}>
              <Ionicons name="play-circle-outline" size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.bannerStatText}>{course.lessons.length} درس</Text>
            </View>
            <View style={styles.bannerStat}>
              <Ionicons name="shield-checkmark-outline" size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.bannerStatText}>محتوى محمي</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.lessonsSection}>
          <Text style={styles.sectionTitle}>قائمة الدروس</Text>
          {course.lessons.length === 0 ? (
            <Text style={styles.emptyText}>لا توجد دروس بعد</Text>
          ) : (
            course.lessons.map((lesson, i) => (
              <TouchableOpacity key={lesson.id} style={styles.lessonItem} onPress={() => setActiveLesson(lesson)}>
                <Ionicons name="lock-closed-outline" size={16} color={Colors.warning} />
                <View style={styles.lessonInfo}>
                  <Text style={styles.lessonTitle}>{lesson.title}</Text>
                  {lesson.duration > 0 && (
                    <Text style={styles.lessonMeta}>{lesson.duration} دقيقة</Text>
                  )}
                </View>
                <View style={styles.lessonNum}>
                  <Text style={styles.lessonNumText}>{i + 1}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { color: Colors.text, fontSize: 16, fontWeight: '700', flex: 1, textAlign: 'center' },
  banner: { margin: 16, borderRadius: 20, padding: 20 },
  bannerTitle: { color: '#fff', fontSize: 20, fontWeight: '800', textAlign: 'right', marginBottom: 6 },
  bannerDesc: { color: 'rgba(255,255,255,0.8)', fontSize: 13, textAlign: 'right', marginBottom: 12 },
  bannerStats: { flexDirection: 'row-reverse', gap: 16 },
  bannerStat: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
  bannerStatText: { color: 'rgba(255,255,255,0.9)', fontSize: 12 },
  lessonsSection: { backgroundColor: Colors.bgCard, margin: 16, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border },
  sectionTitle: { color: Colors.text, fontSize: 16, fontWeight: '700', textAlign: 'right', marginBottom: 14 },
  emptyText: { color: Colors.textMuted, textAlign: 'center', paddingVertical: 16 },
  lessonItem: { flexDirection: 'row-reverse', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  lessonNum: { width: 28, height: 28, backgroundColor: Colors.primary + '33', borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
  lessonNumText: { color: Colors.primary, fontSize: 12, fontWeight: '700' },
  lessonInfo: { flex: 1, alignItems: 'flex-end', marginHorizontal: 10 },
  lessonTitle: { color: Colors.text, fontSize: 14, fontWeight: '600' },
  lessonMeta: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  // Active lesson styles
  lessonHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.bgCard, borderBottomWidth: 1, borderBottomColor: Colors.border },
  lessonHeaderTitle: { color: Colors.text, fontSize: 15, fontWeight: '700', flex: 1, textAlign: 'center' },
  protectedArea: { flex: 1 },
  videoPlaceholder: { height: 240, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', gap: 12 },
  videoTitle: { color: '#fff', fontSize: 16, fontWeight: '700', textAlign: 'center', paddingHorizontal: 20 },
  videoDuration: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
  protectBanner: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, backgroundColor: Colors.warning + '22', padding: 12, borderBottomWidth: 1, borderBottomColor: Colors.warning + '44' },
  protectText: { color: Colors.warning, fontSize: 12, flex: 1, textAlign: 'right' },
  lessonContent: { padding: 16 },
  lessonDesc: { color: Colors.textMuted, fontSize: 14, textAlign: 'right', lineHeight: 22 },
});
