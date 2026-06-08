import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, AppState, AppStateStatus, BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as ScreenCapture from 'expo-screen-capture';
import { useStore } from '@/store/useStore';
import { getDeviceId } from '@/utils/device';
import Colors from '@/constants/Colors';
import { Question, StudentAnswer } from '@/store/types';

type ExamPhase = 'intro' | 'exam' | 'submitted';

export default function TakeExamScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { exams, courses, attempts, currentUser, startExam, submitExam, recordViolation } = useStore();
  const exam = exams.find((e) => e.id === id);
  const course = courses.find((c) => c.id === exam?.courseId);

  const [phase, setPhase] = useState<ExamPhase>('intro');
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | boolean>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [violations, setViolations] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>('active');

  const existingAttempt = attempts.find((a) => a.examId === id && a.studentId === currentUser?.id);

  // Prevent screen capture during exam
  useEffect(() => {
    if (phase === 'exam' && exam?.preventScreenCapture) {
      ScreenCapture.preventScreenCaptureAsync('exam');
    }
    return () => {
      ScreenCapture.allowScreenCaptureAsync('exam');
    };
  }, [phase]);

  // App state monitoring (detect tab switch / minimize)
  useEffect(() => {
    if (phase !== 'exam' || !exam?.preventTabSwitch) return;

    const sub = AppState.addEventListener('change', (nextState) => {
      if (appStateRef.current === 'active' && nextState !== 'active') {
        const newCount = violations + 1;
        setViolations(newCount);
        if (attemptId) recordViolation(attemptId, 'tab_switch');
        Alert.alert(
          '⚠️ تحذير مخالفة',
          `تم رصد محاولة تبديل التطبيق!\nعدد المخالفات: ${newCount}\n${newCount >= 3 ? 'سيتم إرسال الامتحان تلقائياً عند الخروج مرة أخرى.' : ''}`,
          [{ text: 'العودة للامتحان', style: 'default' }]
        );
        if (newCount >= 5 && attemptId) {
          handleSubmit(true);
        }
      }
      appStateRef.current = nextState;
    });

    return () => sub.remove();
  }, [phase, violations, attemptId]);

  // Back button prevention
  useEffect(() => {
    if (phase !== 'exam') return;
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      Alert.alert('تحذير', 'لا يمكنك الخروج أثناء الامتحان', [{ text: 'موافق' }]);
      return true;
    });
    return () => backHandler.remove();
  }, [phase]);

  // Timer
  useEffect(() => {
    if (phase !== 'exam' || !exam) return;
    setTimeLeft(exam.duration * 60);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          handleSubmit(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  const handleStart = async () => {
    if (!exam || !currentUser) return;
    const deviceId = await getDeviceId();
    const attempt = startExam(exam.id, currentUser.id, deviceId);
    setAttemptId(attempt.id);
    const questions = exam.shuffleQuestions
      ? [...exam.questions].sort(() => Math.random() - 0.5)
      : exam.questions;
    setPhase('exam');
    setCurrentQ(0);
  };

  const handleSubmit = useCallback((auto = false) => {
    if (!attemptId || !exam) return;
    if (timerRef.current) clearInterval(timerRef.current);

    const studentAnswers: StudentAnswer[] = exam.questions.map((q) => ({
      questionId: q.id,
      answer: answers[q.id] ?? '',
    }));

    submitExam(attemptId, studentAnswers);
    setPhase('submitted');

    if (!auto) {
      ScreenCapture.allowScreenCaptureAsync('exam');
    }
  }, [attemptId, exam, answers]);

  const confirmSubmit = () => {
    Alert.alert(
      'تسليم الامتحان',
      'هل أنت متأكد من تسليم الامتحان؟ لن تتمكن من تغيير إجاباتك.',
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'تسليم', onPress: () => handleSubmit(false) },
      ]
    );
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const timeColor = timeLeft < 300 ? Colors.danger : timeLeft < 600 ? Colors.warning : Colors.accent;

  if (!exam) {
    return <SafeAreaView style={styles.safe}><Text style={{ color: Colors.text, textAlign: 'center', margin: 20 }}>الامتحان غير موجود</Text></SafeAreaView>;
  }

  // Already attempted
  if (existingAttempt && phase === 'intro') {
    const attempt = existingAttempt;
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{exam.title}</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.resultContainer}>
          {attempt.status === 'graded' ? (
            <>
              <LinearGradient colors={[Colors.gold, '#D97706']} style={styles.resultCircle}>
                <Ionicons name="trophy" size={48} color="#fff" />
              </LinearGradient>
              <Text style={styles.resultTitle}>نتيجتك في الامتحان</Text>
              <Text style={styles.resultScore}>{attempt.percentage}%</Text>
              <Text style={styles.resultPoints}>{attempt.totalPoints}/{exam.totalPoints} درجة</Text>
              {attempt.violations.length > 0 && (
                <Text style={styles.resultViolations}>{attempt.violations.length} مخالفة مسجلة</Text>
              )}
            </>
          ) : attempt.status === 'submitted' ? (
            <>
              <View style={[styles.resultCircle, { backgroundColor: Colors.warning }]}>
                <Ionicons name="time" size={48} color="#fff" />
              </View>
              <Text style={styles.resultTitle}>تم تسليم الامتحان</Text>
              <Text style={styles.resultSubTitle}>بانتظار التصحيح من الأستاذ</Text>
            </>
          ) : null}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>العودة</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Submitted phase
  if (phase === 'submitted') {
    const finalAttempt = attempts.find((a) => a.id === attemptId);
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.resultContainer}>
          <LinearGradient colors={[Colors.accent, '#059669']} style={styles.resultCircle}>
            <Ionicons name="checkmark" size={48} color="#fff" />
          </LinearGradient>
          <Text style={styles.resultTitle}>تم تسليم الامتحان بنجاح!</Text>
          {finalAttempt?.status === 'graded' ? (
            <>
              <Text style={styles.resultScore}>{finalAttempt.percentage}%</Text>
              <Text style={styles.resultPoints}>{finalAttempt.totalPoints}/{exam.totalPoints} درجة</Text>
            </>
          ) : (
            <Text style={styles.resultSubTitle}>سيتم إشعارك بالنتيجة بعد التصحيح</Text>
          )}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/(student)/exams/index')}>
            <Text style={styles.backBtnText}>العودة للامتحانات</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Intro phase
  if (phase === 'intro') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{exam.title}</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
          <LinearGradient colors={[Colors.primary, Colors.purple]} style={styles.introBanner}>
            <Text style={styles.introTitle}>{exam.title}</Text>
            {course && <Text style={styles.introSubTitle}>{course.title}</Text>}
          </LinearGradient>

          <View style={styles.infoGrid}>
            {[
              { icon: 'help-circle-outline', label: 'عدد الأسئلة', val: String(exam.questions.length), color: Colors.primary },
              { icon: 'time-outline', label: 'المدة', val: `${exam.duration} دقيقة`, color: Colors.warning },
              { icon: 'star-outline', label: 'الدرجة الكاملة', val: String(exam.totalPoints), color: Colors.gold },
              { icon: exam.gradingType === 'auto' ? 'flash-outline' : 'hand-left-outline', label: 'التصحيح', val: exam.gradingType === 'auto' ? 'تلقائي' : 'يدوي', color: Colors.accent },
            ].map((item) => (
              <View key={item.label} style={styles.infoCard}>
                <Ionicons name={item.icon as any} size={24} color={item.color} />
                <Text style={styles.infoVal}>{item.val}</Text>
                <Text style={styles.infoLabel}>{item.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.rulesCard}>
            <Text style={styles.rulesTitle}>قواعد الامتحان</Text>
            {exam.preventScreenCapture && (
              <View style={styles.ruleItem}>
                <Ionicons name="camera-outline" size={16} color={Colors.danger} />
                <Text style={styles.ruleText}>ممنوع تصوير شاشة الامتحان</Text>
              </View>
            )}
            {exam.preventTabSwitch && (
              <View style={styles.ruleItem}>
                <Ionicons name="warning-outline" size={16} color={Colors.danger} />
                <Text style={styles.ruleText}>ممنوع تبديل التطبيقات - ستُسجَّل المخالفات</Text>
              </View>
            )}
            <View style={styles.ruleItem}>
              <Ionicons name="phone-portrait-outline" size={16} color={Colors.danger} />
              <Text style={styles.ruleText}>يجب استخدام جهازك المسجل فقط</Text>
            </View>
            <View style={styles.ruleItem}>
              <Ionicons name="time-outline" size={16} color={Colors.warning} />
              <Text style={styles.ruleText}>سيُرسل الامتحان تلقائياً عند انتهاء الوقت</Text>
            </View>
          </View>

          <TouchableOpacity onPress={handleStart}>
            <LinearGradient colors={[Colors.primary, Colors.purple]} style={styles.startBtn}>
              <Ionicons name="play-circle-outline" size={22} color="#fff" />
              <Text style={styles.startBtnText}>ابدأ الامتحان الآن</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Exam phase
  const questions = exam.shuffleQuestions
    ? [...exam.questions].sort((a, b) => a.id.localeCompare(b.id))
    : exam.questions;
  const question = questions[currentQ];

  return (
    <SafeAreaView style={styles.safe}>
      {/* Exam Header */}
      <View style={styles.examHeader}>
        <View style={[styles.timer, { borderColor: timeColor }]}>
          <Ionicons name="time-outline" size={14} color={timeColor} />
          <Text style={[styles.timerText, { color: timeColor }]}>{formatTime(timeLeft)}</Text>
        </View>
        <Text style={styles.examProgress}>{currentQ + 1} / {questions.length}</Text>
        <View style={styles.violationBadge}>
          {violations > 0 && <Ionicons name="warning" size={14} color={Colors.danger} />}
          <Text style={[styles.violationText, violations > 0 && { color: Colors.danger }]}>
            {violations > 0 ? `${violations} مخالفة` : 'نظيف'}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((currentQ + 1) / questions.length) * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.examContent}>
        <View style={styles.questionCard}>
          <View style={styles.qHeader}>
            <View style={[styles.qTypeBadge, { backgroundColor: Colors.primary + '22' }]}>
              <Text style={[styles.qTypeBadgeText, { color: Colors.primary }]}>
                {{ mcq: 'اختيار متعدد', truefalse: 'صح / خطأ', short_answer: 'إجابة قصيرة', essay: 'مقالي' }[question.type]}
              </Text>
            </View>
            <Text style={styles.qPoints}>{question.points} درجة</Text>
          </View>
          <Text style={styles.qText}>{question.text}</Text>

          {/* MCQ */}
          {question.type === 'mcq' && question.options?.map((opt, i) => (
            <TouchableOpacity key={i} style={[styles.optionBtn, answers[question.id] === opt && styles.optionBtnSelected]}
              onPress={() => setAnswers({ ...answers, [question.id]: opt })}>
              <View style={[styles.optionCircle, answers[question.id] === opt && styles.optionCircleSelected]}>
                {answers[question.id] === opt && <Ionicons name="checkmark" size={14} color="#fff" />}
              </View>
              <Text style={[styles.optionText, answers[question.id] === opt && { color: Colors.primary }]}>{opt}</Text>
            </TouchableOpacity>
          ))}

          {/* True/False */}
          {question.type === 'truefalse' && (
            <View style={styles.tfRow}>
              <TouchableOpacity style={[styles.tfBtn, answers[question.id] === 'false' && styles.tfBtnWrong]}
                onPress={() => setAnswers({ ...answers, [question.id]: 'false' })}>
                <Ionicons name="close-circle" size={28} color={answers[question.id] === 'false' ? '#fff' : Colors.danger} />
                <Text style={[styles.tfText, answers[question.id] === 'false' && { color: '#fff' }]}>خطأ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tfBtn, answers[question.id] === 'true' && styles.tfBtnCorrect]}
                onPress={() => setAnswers({ ...answers, [question.id]: 'true' })}>
                <Ionicons name="checkmark-circle" size={28} color={answers[question.id] === 'true' ? '#fff' : Colors.accent} />
                <Text style={[styles.tfText, answers[question.id] === 'true' && { color: '#fff' }]}>صح</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Short answer / Essay */}
          {(question.type === 'short_answer' || question.type === 'essay') && (
            <TextInput
              style={[styles.textAnswer, question.type === 'essay' && { height: 150 }]}
              placeholder="اكتب إجابتك هنا..."
              placeholderTextColor={Colors.textMuted}
              value={String(answers[question.id] ?? '')}
              onChangeText={(v) => setAnswers({ ...answers, [question.id]: v })}
              multiline
              textAlign="right"
              textAlignVertical="top"
            />
          )}
        </View>
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navBtn} onPress={confirmSubmit}>
          <LinearGradient colors={[Colors.accent, '#059669']} style={styles.navBtnGrad}>
            <Text style={styles.navBtnText}>تسليم</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.navBtns}>
          {currentQ < questions.length - 1 && (
            <TouchableOpacity style={styles.navNext} onPress={() => setCurrentQ(currentQ + 1)}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
          )}
          {currentQ > 0 && (
            <TouchableOpacity style={styles.navPrev} onPress={() => setCurrentQ(currentQ - 1)}>
              <Ionicons name="arrow-forward" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { color: Colors.text, fontSize: 16, fontWeight: '700', flex: 1, textAlign: 'center' },
  examHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: Colors.bgCard, borderBottomWidth: 1, borderBottomColor: Colors.border },
  timer: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  timerText: { fontSize: 16, fontWeight: '800', fontVariant: ['tabular-nums'] },
  examProgress: { color: Colors.text, fontSize: 15, fontWeight: '700' },
  violationBadge: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
  violationText: { color: Colors.textMuted, fontSize: 12 },
  progressBar: { height: 3, backgroundColor: Colors.bgLight },
  progressFill: { height: 3, backgroundColor: Colors.primary, borderRadius: 3 },
  examContent: { padding: 16 },
  questionCard: { backgroundColor: Colors.bgCard, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: Colors.border, gap: 14 },
  qHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  qTypeBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  qTypeBadgeText: { fontSize: 12, fontWeight: '600' },
  qPoints: { color: Colors.gold, fontSize: 13, fontWeight: '700' },
  qText: { color: Colors.text, fontSize: 16, fontWeight: '600', textAlign: 'right', lineHeight: 26 },
  optionBtn: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, backgroundColor: Colors.bgLight, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border },
  optionBtnSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary + '11' },
  optionCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  optionCircleSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  optionText: { color: Colors.text, fontSize: 14, flex: 1, textAlign: 'right' },
  tfRow: { flexDirection: 'row', gap: 12 },
  tfBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.bgLight, borderRadius: 14, padding: 20, borderWidth: 1, borderColor: Colors.border },
  tfBtnCorrect: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  tfBtnWrong: { backgroundColor: Colors.danger, borderColor: Colors.danger },
  tfText: { color: Colors.text, fontSize: 16, fontWeight: '700' },
  textAnswer: { backgroundColor: Colors.bgLight, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, color: Colors.text, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, height: 80 },
  navBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.bgCard, borderTopWidth: 1, borderTopColor: Colors.border },
  navBtn: { borderRadius: 12, overflow: 'hidden' },
  navBtnGrad: { paddingHorizontal: 24, paddingVertical: 12 },
  navBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  navBtns: { flexDirection: 'row', gap: 10 },
  navNext: { backgroundColor: Colors.primary, borderRadius: 12, padding: 12 },
  navPrev: { backgroundColor: Colors.bgLight, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Colors.border },
  // Result styles
  resultContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  resultCircle: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  resultTitle: { color: Colors.text, fontSize: 22, fontWeight: '800', textAlign: 'center' },
  resultScore: { color: Colors.gold, fontSize: 56, fontWeight: '900' },
  resultPoints: { color: Colors.textMuted, fontSize: 16 },
  resultViolations: { color: Colors.danger, fontSize: 13 },
  resultSubTitle: { color: Colors.textMuted, fontSize: 16, textAlign: 'center' },
  backBtn: { backgroundColor: Colors.primary, borderRadius: 14, paddingHorizontal: 32, paddingVertical: 14, marginTop: 8 },
  backBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  // Intro styles
  introBanner: { borderRadius: 20, padding: 24, alignItems: 'center', gap: 8 },
  introTitle: { color: '#fff', fontSize: 22, fontWeight: '800', textAlign: 'center' },
  introSubTitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  infoCard: { flex: 1, minWidth: '44%', backgroundColor: Colors.bgCard, borderRadius: 14, padding: 16, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: Colors.border },
  infoVal: { color: Colors.text, fontSize: 18, fontWeight: '800' },
  infoLabel: { color: Colors.textMuted, fontSize: 12 },
  rulesCard: { backgroundColor: Colors.bgCard, borderRadius: 16, padding: 16, gap: 10, borderWidth: 1, borderLeftWidth: 3, borderLeftColor: Colors.danger, borderColor: Colors.border },
  rulesTitle: { color: Colors.text, fontSize: 15, fontWeight: '700', textAlign: 'right', marginBottom: 4 },
  ruleItem: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  ruleText: { color: Colors.textMuted, fontSize: 13, flex: 1, textAlign: 'right' },
  startBtn: { borderRadius: 14, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, gap: 10 },
  startBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
