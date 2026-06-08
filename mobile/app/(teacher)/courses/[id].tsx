import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useStore } from '@/store/useStore';
import Colors from '@/constants/Colors';

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { courses, users, addLesson, enrollStudent, currentUser } = useStore();
  const course = courses.find((c) => c.id === id);

  const [showLessonModal, setShowLessonModal] = useState(false);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDesc, setLessonDesc] = useState('');
  const [lessonDuration, setLessonDuration] = useState('');

  const [showEnrollModal, setShowEnrollModal] = useState(false);

  if (!course) return <View style={styles.safe}><Text style={{ color: 'white', textAlign: 'center', marginTop: 40 }}>الكورس غير موجود</Text></View>;

  const availableStudents = users.filter(
    (u) => u.role === 'student' && !course.enrolledStudents.includes(u.id)
  );

  const enrolledStudents = users.filter((u) => course.enrolledStudents.includes(u.id));

  const handleAddLesson = () => {
    if (!lessonTitle.trim()) { Alert.alert('خطأ', 'أدخل عنوان الدرس'); return; }
    addLesson(course.id, {
      courseId: course.id,
      title: lessonTitle.trim(),
      description: lessonDesc.trim(),
      duration: parseInt(lessonDuration) || 0,
      order: course.lessons.length + 1,
      isProtected: true,
    });
    setLessonTitle(''); setLessonDesc(''); setLessonDuration('');
    setShowLessonModal(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{course.title}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} showsVerticalScrollIndicator={false}>
        {/* Info card */}
        <LinearGradient colors={[Colors.primary, Colors.purple]} style={styles.infoCard}>
          <Text style={styles.infoTitle}>{course.title}</Text>
          <Text style={styles.infoDesc}>{course.description || 'لا يوجد وصف'}</Text>
          <View style={styles.infoStats}>
            <View style={styles.infoStat}>
              <Ionicons name="people-outline" size={18} color="rgba(255,255,255,0.8)" />
              <Text style={styles.infoStatText}>{course.enrolledStudents.length} طالب</Text>
            </View>
            <View style={styles.infoStat}>
              <Ionicons name="play-circle-outline" size={18} color="rgba(255,255,255,0.8)" />
              <Text style={styles.infoStatText}>{course.lessons.length} درس</Text>
            </View>
            <View style={styles.infoStat}>
              <Ionicons name="pricetag-outline" size={18} color="rgba(255,255,255,0.8)" />
              <Text style={styles.infoStatText}>{course.category}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Lessons */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TouchableOpacity style={styles.sectionBtn} onPress={() => setShowLessonModal(true)}>
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.sectionBtnText}>إضافة درس</Text>
            </TouchableOpacity>
            <Text style={styles.sectionTitle}>الدروس ({course.lessons.length})</Text>
          </View>

          {course.lessons.length === 0 ? (
            <Text style={styles.emptyText}>لا توجد دروس بعد</Text>
          ) : (
            course.lessons.map((lesson, i) => (
              <View key={lesson.id} style={styles.lessonItem}>
                <View style={styles.lessonNum}>
                  <Text style={styles.lessonNumText}>{i + 1}</Text>
                </View>
                <View style={styles.lessonInfo}>
                  <Text style={styles.lessonTitle}>{lesson.title}</Text>
                  {lesson.duration > 0 && (
                    <Text style={styles.lessonMeta}>{lesson.duration} دقيقة</Text>
                  )}
                </View>
                <View style={styles.lessonProtect}>
                  <Ionicons name="lock-closed" size={14} color={Colors.warning} />
                </View>
              </View>
            ))
          )}
        </View>

        {/* Students */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TouchableOpacity style={[styles.sectionBtn, { backgroundColor: Colors.accent }]} onPress={() => setShowEnrollModal(true)}>
              <Ionicons name="person-add-outline" size={18} color="#fff" />
              <Text style={styles.sectionBtnText}>تسجيل طالب</Text>
            </TouchableOpacity>
            <Text style={styles.sectionTitle}>الطلاب المسجلون ({enrolledStudents.length})</Text>
          </View>

          {enrolledStudents.length === 0 ? (
            <Text style={styles.emptyText}>لا يوجد طلاب مسجلون</Text>
          ) : (
            enrolledStudents.map((s) => (
              <View key={s.id} style={styles.studentItem}>
                <LinearGradient colors={[Colors.accent, '#059669']} style={styles.studentAvatar}>
                  <Text style={styles.studentAvatarText}>{s.name.charAt(0)}</Text>
                </LinearGradient>
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>{s.name}</Text>
                  <Text style={styles.studentMeta}>{s.email || s.phone}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Add Lesson Modal */}
      <Modal visible={showLessonModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowLessonModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>إضافة درس جديد</Text>
            </View>
            <TextInput style={styles.modalInput} placeholder="عنوان الدرس *"
              placeholderTextColor={Colors.textMuted} value={lessonTitle}
              onChangeText={setLessonTitle} textAlign="right" />
            <TextInput style={[styles.modalInput, { height: 80, textAlignVertical: 'top' }]}
              placeholder="وصف الدرس" placeholderTextColor={Colors.textMuted}
              value={lessonDesc} onChangeText={setLessonDesc} multiline textAlign="right" />
            <TextInput style={styles.modalInput} placeholder="مدة الدرس (دقيقة)"
              placeholderTextColor={Colors.textMuted} value={lessonDuration}
              onChangeText={setLessonDuration} keyboardType="numeric" textAlign="right" />
            <View style={styles.protectNote}>
              <Ionicons name="lock-closed" size={14} color={Colors.warning} />
              <Text style={styles.protectText}>الدرس محمي تلقائياً ضد التصوير والتسجيل</Text>
            </View>
            <TouchableOpacity onPress={handleAddLesson}>
              <LinearGradient colors={[Colors.primary, Colors.purple]} style={styles.modalBtn}>
                <Text style={styles.modalBtnText}>إضافة الدرس</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Enroll Modal */}
      <Modal visible={showEnrollModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowEnrollModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>تسجيل طالب في الكورس</Text>
            </View>
            {availableStudents.length === 0 ? (
              <Text style={styles.emptyText}>جميع الطلاب مسجلون بالفعل</Text>
            ) : (
              <ScrollView style={{ maxHeight: 300 }}>
                {availableStudents.map((s) => (
                  <TouchableOpacity key={s.id} style={styles.studentPickItem}
                    onPress={() => { enrollStudent(course.id, s.id); setShowEnrollModal(false); }}>
                    <Ionicons name="person-add-outline" size={20} color={Colors.accent} />
                    <View style={styles.studentPickInfo}>
                      <Text style={styles.studentPickName}>{s.name}</Text>
                      <Text style={styles.studentPickMeta}>{s.email || s.phone}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { color: Colors.text, fontSize: 16, fontWeight: '700', flex: 1, textAlign: 'center' },
  infoCard: { borderRadius: 20, padding: 20 },
  infoTitle: { color: '#fff', fontSize: 20, fontWeight: '800', textAlign: 'right', marginBottom: 6 },
  infoDesc: { color: 'rgba(255,255,255,0.8)', fontSize: 13, textAlign: 'right', marginBottom: 14 },
  infoStats: { flexDirection: 'row-reverse', gap: 16 },
  infoStat: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
  infoStatText: { color: 'rgba(255,255,255,0.9)', fontSize: 13 },
  section: { backgroundColor: Colors.bgCard, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border },
  sectionHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { color: Colors.text, fontSize: 15, fontWeight: '700' },
  sectionBtn: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  sectionBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  emptyText: { color: Colors.textMuted, textAlign: 'center', paddingVertical: 12 },
  lessonItem: { flexDirection: 'row-reverse', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  lessonNum: { width: 28, height: 28, backgroundColor: Colors.primary + '33', borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
  lessonNumText: { color: Colors.primary, fontSize: 12, fontWeight: '700' },
  lessonInfo: { flex: 1, alignItems: 'flex-end' },
  lessonTitle: { color: Colors.text, fontSize: 14, fontWeight: '600' },
  lessonMeta: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  lessonProtect: { marginRight: 8 },
  studentItem: { flexDirection: 'row-reverse', alignItems: 'center', paddingVertical: 8, gap: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  studentAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  studentAvatarText: { color: '#fff', fontWeight: '700' },
  studentInfo: { flex: 1, alignItems: 'flex-end' },
  studentName: { color: Colors.text, fontSize: 14, fontWeight: '600' },
  studentMeta: { color: Colors.textMuted, fontSize: 12 },
  protectNote: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, backgroundColor: '#1a1200', borderRadius: 8, padding: 10 },
  protectText: { color: Colors.warning, fontSize: 12, flex: 1, textAlign: 'right' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modal: { backgroundColor: Colors.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 14, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { color: Colors.text, fontSize: 18, fontWeight: '700' },
  modalInput: { backgroundColor: Colors.bgLight, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, color: Colors.text, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  modalBtn: { borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  modalBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  studentPickItem: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  studentPickInfo: { flex: 1, alignItems: 'flex-end' },
  studentPickName: { color: Colors.text, fontSize: 14, fontWeight: '600' },
  studentPickMeta: { color: Colors.textMuted, fontSize: 12 },
});
