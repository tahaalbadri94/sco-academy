import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Modal, ScrollView, Alert, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useStore } from '@/store/useStore';
import Colors from '@/constants/Colors';
import { Exam, GradingType, Question, QuestionType } from '@/store/types';

const QUESTION_TYPES: { key: QuestionType; label: string; icon: string; autoGrade: boolean }[] = [
  { key: 'mcq', label: 'اختيار متعدد', icon: 'radio-button-on-outline', autoGrade: true },
  { key: 'truefalse', label: 'صح وخطأ', icon: 'checkmark-done-outline', autoGrade: true },
  { key: 'short_answer', label: 'إجابة قصيرة', icon: 'create-outline', autoGrade: false },
  { key: 'essay', label: 'مقالي', icon: 'document-text-outline', autoGrade: false },
];

export default function ExamsScreen() {
  const { exams, courses, addExam, deleteExam, updateExam, gradeAttempt, attempts, users } = useStore();
  const [tab, setTab] = useState<'exams' | 'grading'>('exams');
  const [showModal, setShowModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [selectedAttempt, setSelectedAttempt] = useState<string | null>(null);
  const [manualGrades, setManualGrades] = useState<Record<string, number>>({});

  // Exam form state
  const [examTitle, setExamTitle] = useState('');
  const [examDesc, setExamDesc] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [duration, setDuration] = useState('60');
  const [gradingType, setGradingType] = useState<GradingType>('auto');
  const [preventCapture, setPreventCapture] = useState(true);
  const [preventTabSwitch, setPreventTabSwitch] = useState(true);
  const [shuffleQ, setShuffleQ] = useState(false);
  const [questions, setQuestions] = useState<Omit<Question, 'id'>[]>([]);
  const [addingQuestion, setAddingQuestion] = useState(false);
  const [qType, setQType] = useState<QuestionType>('mcq');
  const [qText, setQText] = useState('');
  const [qPoints, setQPoints] = useState('5');
  const [qOptions, setQOptions] = useState(['', '', '', '']);
  const [qCorrect, setQCorrect] = useState('');
  const [qCorrectBool, setQCorrectBool] = useState(true);

  const pendingAttempts = attempts.filter((a) => a.status === 'submitted');

  const handleAddQuestion = () => {
    if (!qText.trim()) { Alert.alert('خطأ', 'أدخل نص السؤال'); return; }
    const q: Omit<Question, 'id'> = {
      text: qText.trim(),
      type: qType,
      points: parseInt(qPoints) || 5,
      options: qType === 'mcq' ? qOptions.filter((o) => o.trim()) : undefined,
      correctAnswer: qType === 'mcq' ? qCorrect : qType === 'truefalse' ? qCorrectBool : undefined,
    };
    setQuestions([...questions, q]);
    setQText(''); setQOptions(['', '', '', '']); setQCorrect(''); setAddingQuestion(false);
  };

  const handleCreateExam = () => {
    if (!examTitle.trim()) { Alert.alert('خطأ', 'أدخل عنوان الامتحان'); return; }
    if (questions.length === 0) { Alert.alert('خطأ', 'أضف سؤالاً على الأقل'); return; }
    const totalPoints = questions.reduce((s, q) => s + q.points, 0);
    addExam({
      courseId: selectedCourse,
      title: examTitle.trim(),
      description: examDesc,
      questions: questions.map((q, i) => ({ ...q, id: `q_${i}_${Date.now()}` })),
      duration: parseInt(duration) || 60,
      totalPoints,
      gradingType,
      preventScreenCapture: preventCapture,
      preventTabSwitch,
      shuffleQuestions: shuffleQ,
      maxAttempts: 1,
      isPublished: true,
    });
    setExamTitle(''); setQuestions([]); setShowModal(false);
  };

  const handleGradeSubmit = (attemptId: string) => {
    const attempt = attempts.find((a) => a.id === attemptId)!;
    const exam = exams.find((e) => e.id === attempt.examId)!;
    const grades = exam.questions
      .filter((q) => q.type === 'short_answer' || q.type === 'essay')
      .map((q) => ({ questionId: q.id, points: manualGrades[q.id] ?? 0 }));
    gradeAttempt(attemptId, grades);
    setSelectedAttempt(null); setManualGrades({}); setShowGradeModal(false);
  };

  const renderExam = ({ item }: { item: Exam }) => {
    const course = courses.find((c) => c.id === item.courseId);
    const examAttempts = attempts.filter((a) => a.examId === item.id);
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <TouchableOpacity onPress={() => { Alert.alert('حذف', `حذف "${item.title}"?`, [{ text: 'إلغاء', style: 'cancel' }, { text: 'حذف', style: 'destructive', onPress: () => deleteExam(item.id) }]); }}>
            <Ionicons name="trash-outline" size={18} color={Colors.danger} />
          </TouchableOpacity>
          <View style={styles.cardBadges}>
            <View style={[styles.badge, { backgroundColor: item.gradingType === 'auto' ? Colors.accent + '33' : Colors.warning + '33' }]}>
              <Text style={[styles.badgeText, { color: item.gradingType === 'auto' ? Colors.accent : Colors.warning }]}>
                {item.gradingType === 'auto' ? 'تصحيح تلقائي' : 'تصحيح يدوي'}
              </Text>
            </View>
          </View>
        </View>
        <Text style={styles.cardTitle}>{item.title}</Text>
        {course && <Text style={styles.cardCourse}>{course.title}</Text>}
        <View style={styles.cardStats}>
          <View style={styles.statItem}>
            <Ionicons name="help-circle-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.statText}>{item.questions.length} سؤال</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.statText}>{item.duration} دقيقة</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="people-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.statText}>{examAttempts.length} محاولة</Text>
          </View>
        </View>
        <View style={styles.cardProtections}>
          {item.preventScreenCapture && <View style={styles.protect}><Ionicons name="camera-outline" size={12} color={Colors.warning} /><Text style={styles.protectText}>محمي ضد التصوير</Text></View>}
          {item.preventTabSwitch && <View style={styles.protect}><Ionicons name="eye-outline" size={12} color={Colors.warning} /><Text style={styles.protectText}>مراقبة التبديل</Text></View>}
        </View>
      </View>
    );
  };

  const currentAttempt = selectedAttempt ? attempts.find((a) => a.id === selectedAttempt) : null;
  const currentExam = currentAttempt ? exams.find((e) => e.id === currentAttempt.examId) : null;
  const currentStudent = currentAttempt ? users.find((u) => u.id === currentAttempt.studentId) : null;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>الامتحانات</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tab === 'exams' && styles.tabActive]} onPress={() => setTab('exams')}>
          <Text style={[styles.tabText, tab === 'exams' && styles.tabTextActive]}>الامتحانات ({exams.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'grading' && styles.tabActive]} onPress={() => setTab('grading')}>
          <Text style={[styles.tabText, tab === 'grading' && styles.tabTextActive]}>
            بانتظار التصحيح {pendingAttempts.length > 0 ? `(${pendingAttempts.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {tab === 'exams' ? (
        exams.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="clipboard-outline" size={64} color={Colors.textMuted} />
            <Text style={styles.emptyText}>لا توجد امتحانات بعد</Text>
          </View>
        ) : (
          <FlatList data={exams} keyExtractor={(e) => e.id} renderItem={renderExam}
            contentContainerStyle={{ padding: 16, gap: 12 }} />
        )
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
          {pendingAttempts.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="checkmark-circle-outline" size={64} color={Colors.accent} />
              <Text style={styles.emptyText}>لا توجد امتحانات بانتظار التصحيح</Text>
            </View>
          ) : (
            pendingAttempts.map((a) => {
              const student = users.find((u) => u.id === a.studentId);
              const exam = exams.find((e) => e.id === a.examId);
              return (
                <View key={a.id} style={styles.gradeCard}>
                  <View style={styles.gradeInfo}>
                    <Text style={styles.gradeName}>{student?.name ?? 'طالب'}</Text>
                    <Text style={styles.gradeExam}>{exam?.title ?? 'امتحان'}</Text>
                    {a.violations.length > 0 && (
                      <Text style={styles.violations}>{a.violations.length} مخالفة مسجلة ⚠️</Text>
                    )}
                  </View>
                  <TouchableOpacity style={styles.gradeBtn} onPress={() => { setSelectedAttempt(a.id); setShowGradeModal(true); }}>
                    <Text style={styles.gradeBtnText}>تصحيح</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Create Exam Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { maxHeight: '95%' }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>إنشاء امتحان جديد</Text>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <TextInput style={styles.modalInput} placeholder="عنوان الامتحان *"
                placeholderTextColor={Colors.textMuted} value={examTitle} onChangeText={setExamTitle} textAlign="right" />

              <Text style={styles.fieldLabel}>الكورس</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {courses.map((c) => (
                  <TouchableOpacity key={c.id} style={[styles.chip, selectedCourse === c.id && styles.chipActive]} onPress={() => setSelectedCourse(c.id)}>
                    <Text style={[styles.chipText, selectedCourse === c.id && { color: '#fff' }]}>{c.title}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TextInput style={styles.modalInput} placeholder="المدة (دقيقة)"
                placeholderTextColor={Colors.textMuted} value={duration} onChangeText={setDuration} keyboardType="numeric" textAlign="right" />

              <Text style={styles.fieldLabel}>نوع التصحيح</Text>
              <View style={styles.toggleRow}>
                <TouchableOpacity style={[styles.toggleChip, gradingType === 'manual' && styles.toggleChipActive]}
                  onPress={() => setGradingType('manual')}>
                  <Text style={[styles.chipText, gradingType === 'manual' && { color: '#fff' }]}>يدوي</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.toggleChip, gradingType === 'auto' && styles.toggleChipActive]}
                  onPress={() => setGradingType('auto')}>
                  <Text style={[styles.chipText, gradingType === 'auto' && { color: '#fff' }]}>تلقائي</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.switchRow}>
                <Switch value={preventCapture} onValueChange={setPreventCapture} trackColor={{ true: Colors.primary }} />
                <Text style={styles.switchLabel}>منع تصوير الامتحان</Text>
              </View>
              <View style={styles.switchRow}>
                <Switch value={preventTabSwitch} onValueChange={setPreventTabSwitch} trackColor={{ true: Colors.primary }} />
                <Text style={styles.switchLabel}>رصد التبديل بين التطبيقات</Text>
              </View>
              <View style={styles.switchRow}>
                <Switch value={shuffleQ} onValueChange={setShuffleQ} trackColor={{ true: Colors.primary }} />
                <Text style={styles.switchLabel}>ترتيب عشوائي للأسئلة</Text>
              </View>

              {/* Questions */}
              <Text style={styles.fieldLabel}>الأسئلة ({questions.length})</Text>
              {questions.map((q, i) => (
                <View key={i} style={styles.qItem}>
                  <TouchableOpacity onPress={() => setQuestions(questions.filter((_, j) => j !== i))}>
                    <Ionicons name="close-circle" size={18} color={Colors.danger} />
                  </TouchableOpacity>
                  <View style={styles.qInfo}>
                    <Text style={styles.qText} numberOfLines={2}>{q.text}</Text>
                    <Text style={styles.qMeta}>{QUESTION_TYPES.find((t) => t.key === q.type)?.label} • {q.points} درجة</Text>
                  </View>
                </View>
              ))}

              {addingQuestion ? (
                <View style={styles.addQForm}>
                  <Text style={styles.fieldLabel}>نوع السؤال</Text>
                  <View style={styles.qTypeGrid}>
                    {QUESTION_TYPES.map((t) => (
                      <TouchableOpacity key={t.key} style={[styles.qTypeBtn, qType === t.key && styles.qTypeBtnActive]} onPress={() => setQType(t.key)}>
                        <Ionicons name={t.icon as any} size={18} color={qType === t.key ? '#fff' : Colors.textMuted} />
                        <Text style={[styles.qTypeText, qType === t.key && { color: '#fff' }]}>{t.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TextInput style={[styles.modalInput, { height: 80, textAlignVertical: 'top' }]}
                    placeholder="نص السؤال *" placeholderTextColor={Colors.textMuted}
                    value={qText} onChangeText={setQText} multiline textAlign="right" />

                  {qType === 'mcq' && (
                    <>
                      {qOptions.map((opt, i) => (
                        <TextInput key={i} style={styles.modalInput}
                          placeholder={`الخيار ${i + 1}`} placeholderTextColor={Colors.textMuted}
                          value={opt} onChangeText={(v) => { const n = [...qOptions]; n[i] = v; setQOptions(n); }} textAlign="right" />
                      ))}
                      <TextInput style={styles.modalInput} placeholder="الإجابة الصحيحة"
                        placeholderTextColor={Colors.textMuted} value={qCorrect}
                        onChangeText={setQCorrect} textAlign="right" />
                    </>
                  )}

                  {qType === 'truefalse' && (
                    <View style={styles.toggleRow}>
                      <TouchableOpacity style={[styles.toggleChip, !qCorrectBool && styles.toggleChipActive]}
                        onPress={() => setQCorrectBool(false)}>
                        <Text style={[styles.chipText, !qCorrectBool && { color: '#fff' }]}>خطأ</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.toggleChip, qCorrectBool && styles.toggleChipActive]}
                        onPress={() => setQCorrectBool(true)}>
                        <Text style={[styles.chipText, qCorrectBool && { color: '#fff' }]}>صح</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  <TextInput style={styles.modalInput} placeholder="الدرجات" placeholderTextColor={Colors.textMuted}
                    value={qPoints} onChangeText={setQPoints} keyboardType="numeric" textAlign="right" />

                  <View style={styles.qBtns}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setAddingQuestion(false)}>
                      <Text style={styles.cancelBtnText}>إلغاء</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.saveBtn} onPress={handleAddQuestion}>
                      <Text style={styles.saveBtnText}>إضافة السؤال</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity style={styles.addQBtn} onPress={() => setAddingQuestion(true)}>
                  <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
                  <Text style={styles.addQBtnText}>إضافة سؤال</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity onPress={handleCreateExam} style={{ marginTop: 16 }}>
                <LinearGradient colors={[Colors.primary, Colors.purple]} style={styles.modalBtn}>
                  <Text style={styles.modalBtnText}>إنشاء الامتحان</Text>
                </LinearGradient>
              </TouchableOpacity>
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Grade Modal */}
      <Modal visible={showGradeModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowGradeModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>تصحيح: {currentStudent?.name}</Text>
            </View>
            <ScrollView>
              {currentExam?.questions.filter((q) => q.type === 'short_answer' || q.type === 'essay').map((q) => {
                const ans = currentAttempt?.answers.find((a) => a.questionId === q.id);
                return (
                  <View key={q.id} style={styles.gradeQuestion}>
                    <Text style={styles.gradeQText}>{q.text}</Text>
                    <Text style={styles.gradeAnswer}>إجابة الطالب: {String(ans?.answer ?? 'لم يجب')}</Text>
                    <Text style={styles.fieldLabel}>الدرجة (من {q.points})</Text>
                    <TextInput style={styles.modalInput}
                      placeholder={`0 - ${q.points}`} placeholderTextColor={Colors.textMuted}
                      value={String(manualGrades[q.id] ?? '')}
                      onChangeText={(v) => setManualGrades({ ...manualGrades, [q.id]: parseInt(v) || 0 })}
                      keyboardType="numeric" textAlign="right" />
                  </View>
                );
              })}
              {currentAttempt && (
                <TouchableOpacity onPress={() => handleGradeSubmit(currentAttempt.id)} style={{ marginTop: 8 }}>
                  <LinearGradient colors={[Colors.accent, '#059669']} style={styles.modalBtn}>
                    <Text style={styles.modalBtnText}>حفظ التصحيح وإرسال النتيجة</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </ScrollView>
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
  addBtn: { backgroundColor: Colors.primary, borderRadius: 10, padding: 8 },
  tabs: { flexDirection: 'row-reverse', marginHorizontal: 16, marginBottom: 8, backgroundColor: Colors.bgCard, borderRadius: 12, padding: 4, borderWidth: 1, borderColor: Colors.border },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { color: Colors.textMuted, fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  card: { backgroundColor: Colors.bgCard, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border },
  cardHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardBadges: { flexDirection: 'row-reverse', gap: 6 },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  cardTitle: { color: Colors.text, fontSize: 16, fontWeight: '700', textAlign: 'right', marginBottom: 4 },
  cardCourse: { color: Colors.textMuted, fontSize: 12, textAlign: 'right', marginBottom: 10 },
  cardStats: { flexDirection: 'row-reverse', gap: 12, marginBottom: 10 },
  statItem: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
  statText: { color: Colors.textMuted, fontSize: 12 },
  cardProtections: { flexDirection: 'row-reverse', gap: 8, flexWrap: 'wrap' },
  protect: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, backgroundColor: Colors.warning + '11', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  protectText: { color: Colors.warning, fontSize: 11 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 60 },
  emptyText: { color: Colors.textMuted, fontSize: 16 },
  gradeCard: { backgroundColor: Colors.bgCard, borderRadius: 14, padding: 16, flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  gradeInfo: { flex: 1, alignItems: 'flex-end' },
  gradeName: { color: Colors.text, fontSize: 14, fontWeight: '700' },
  gradeExam: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  violations: { color: Colors.danger, fontSize: 11, marginTop: 4 },
  gradeBtn: { backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  gradeBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modal: { backgroundColor: Colors.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { color: Colors.text, fontSize: 18, fontWeight: '700' },
  modalInput: { backgroundColor: Colors.bgLight, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, color: Colors.text, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, marginBottom: 10 },
  fieldLabel: { color: Colors.textMuted, fontSize: 13, textAlign: 'right', marginBottom: 8, marginTop: 4 },
  toggleRow: { flexDirection: 'row-reverse', gap: 8, marginBottom: 10 },
  chip: { backgroundColor: Colors.bgLight, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { color: Colors.textMuted, fontSize: 13 },
  toggleChip: { flex: 1, backgroundColor: Colors.bgLight, borderRadius: 12, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  toggleChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  switchRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6, marginBottom: 4 },
  switchLabel: { color: Colors.text, fontSize: 14 },
  qItem: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, backgroundColor: Colors.bgLight, borderRadius: 10, padding: 10, marginBottom: 8 },
  qInfo: { flex: 1, alignItems: 'flex-end' },
  qText: { color: Colors.text, fontSize: 13 },
  qMeta: { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
  addQBtn: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, justifyContent: 'center', borderWidth: 1, borderColor: Colors.primary, borderRadius: 12, paddingVertical: 12, marginTop: 4 },
  addQBtnText: { color: Colors.primary, fontWeight: '600' },
  addQForm: { backgroundColor: Colors.bgLight, borderRadius: 14, padding: 14, gap: 4 },
  qTypeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  qTypeBtn: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, backgroundColor: Colors.bgCard, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: Colors.border, flex: 1, minWidth: '45%', justifyContent: 'center' },
  qTypeBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  qTypeText: { color: Colors.textMuted, fontSize: 12 },
  qBtns: { flexDirection: 'row-reverse', gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, backgroundColor: Colors.bgCard, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  cancelBtnText: { color: Colors.textMuted, fontWeight: '600' },
  saveBtn: { flex: 2, backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700' },
  modalBtn: { borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  modalBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  gradeQuestion: { backgroundColor: Colors.bgLight, borderRadius: 12, padding: 14, marginBottom: 12 },
  gradeQText: { color: Colors.text, fontSize: 14, fontWeight: '600', textAlign: 'right', marginBottom: 8 },
  gradeAnswer: { color: Colors.textMuted, fontSize: 13, textAlign: 'right', marginBottom: 8 },
});
