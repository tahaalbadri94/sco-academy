import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  AppState, User, Course, Exam, ExamAttempt,
  Message, Conversation, Notification, Lesson, Question, StudentAnswer,
} from './types';

const TEACHER_ID = 'teacher_001';

interface StoreActions {
  // Auth
  login: (identifier: string, password: string, deviceId: string) => Promise<User | null>;
  register: (data: Partial<User> & { password: string }, deviceId: string) => Promise<User | null>;
  logout: () => void;
  // Courses
  addCourse: (course: Omit<Course, 'id' | 'createdAt' | 'enrolledStudents'>) => Course;
  updateCourse: (id: string, updates: Partial<Course>) => void;
  deleteCourse: (id: string) => void;
  enrollStudent: (courseId: string, studentId: string) => void;
  addLesson: (courseId: string, lesson: Omit<Lesson, 'id'>) => void;
  // Exams
  addExam: (exam: Omit<Exam, 'id' | 'createdAt'>) => Exam;
  updateExam: (id: string, updates: Partial<Exam>) => void;
  deleteExam: (id: string) => void;
  startExam: (examId: string, studentId: string, deviceId: string) => ExamAttempt;
  submitExam: (attemptId: string, answers: StudentAnswer[]) => ExamAttempt;
  gradeAttempt: (attemptId: string, grades: { questionId: string; points: number }[]) => void;
  recordViolation: (attemptId: string, violation: string) => void;
  // Messages
  sendMessage: (senderId: string, receiverId: string, text: string) => Message;
  markMessagesRead: (conversationId: string, userId: string) => void;
  // Notifications
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => void;
  markNotificationRead: (id: string) => void;
  // Users
  updateUser: (id: string, updates: Partial<User>) => void;
  toggleStudentActive: (id: string) => void;
}

type Store = AppState & StoreActions;

const uid = () => Math.random().toString(36).substring(2, 10) + Date.now().toString(36);

const SEED_TEACHER: User = {
  id: TEACHER_ID,
  name: 'الأستاذ طه البدري',
  email: 'teacher@sco.academy',
  phone: '07700000000',
  role: 'teacher',
  deviceId: '',
  registeredAt: Date.now(),
  isActive: true,
};

// Passwords stored as plain for demo (in production use hashing)
const PASSWORDS: Record<string, string> = {
  [TEACHER_ID]: 'teacher123',
};

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: [SEED_TEACHER],
      courses: [],
      exams: [],
      attempts: [],
      messages: [],
      conversations: [],
      notifications: [],

      login: async (identifier, password, deviceId) => {
        const { users } = get();
        const user = users.find(
          (u) => (u.email === identifier || u.phone === identifier) && u.isActive
        );
        if (!user) return null;
        const storedPw = PASSWORDS[user.id];
        if (storedPw !== password) return null;

        // Device lock check (skip for teacher first login setup)
        if (user.deviceId && user.deviceId !== deviceId) {
          return null; // Different device — blocked
        }

        // Bind device on first login
        if (!user.deviceId) {
          set((s) => ({
            users: s.users.map((u) =>
              u.id === user.id ? { ...u, deviceId } : u
            ),
          }));
        }

        const updated = get().users.find((u) => u.id === user.id)!;
        set({ currentUser: updated });
        return updated;
      },

      register: async (data, deviceId) => {
        const { users } = get();
        const exists = users.some(
          (u) => (data.email && u.email === data.email) || (data.phone && u.phone === data.phone)
        );
        if (exists) return null;

        const newUser: User = {
          id: uid(),
          name: data.name ?? '',
          email: data.email,
          phone: data.phone,
          role: 'student',
          deviceId,
          registeredAt: Date.now(),
          isActive: true,
        };
        PASSWORDS[newUser.id] = data.password;
        set((s) => ({ users: [...s.users, newUser] }));
        set({ currentUser: newUser });

        // Welcome notification
        get().addNotification({
          userId: newUser.id,
          title: 'مرحباً بك في SCO Academy',
          body: `أهلاً ${newUser.name}! تم تسجيلك بنجاح.`,
          type: 'system',
        });

        return newUser;
      },

      logout: () => set({ currentUser: null }),

      addCourse: (data) => {
        const course: Course = {
          ...data,
          id: uid(),
          createdAt: Date.now(),
          enrolledStudents: [],
        };
        set((s) => ({ courses: [...s.courses, course] }));
        return course;
      },

      updateCourse: (id, updates) =>
        set((s) => ({
          courses: s.courses.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        })),

      deleteCourse: (id) =>
        set((s) => ({ courses: s.courses.filter((c) => c.id !== id) })),

      enrollStudent: (courseId, studentId) => {
        set((s) => ({
          courses: s.courses.map((c) =>
            c.id === courseId && !c.enrolledStudents.includes(studentId)
              ? { ...c, enrolledStudents: [...c.enrolledStudents, studentId] }
              : c
          ),
        }));
        const course = get().courses.find((c) => c.id === courseId);
        get().addNotification({
          userId: studentId,
          title: 'تم تسجيلك في كورس جديد',
          body: `تم تسجيلك في كورس "${course?.title}"`,
          type: 'course',
          relatedId: courseId,
        });
      },

      addLesson: (courseId, lesson) =>
        set((s) => ({
          courses: s.courses.map((c) =>
            c.id === courseId
              ? { ...c, lessons: [...c.lessons, { ...lesson, id: uid() }] }
              : c
          ),
        })),

      addExam: (data) => {
        const exam: Exam = { ...data, id: uid(), createdAt: Date.now() };
        set((s) => ({ exams: [...s.exams, exam] }));
        return exam;
      },

      updateExam: (id, updates) =>
        set((s) => ({
          exams: s.exams.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        })),

      deleteExam: (id) =>
        set((s) => ({ exams: s.exams.filter((e) => e.id !== id) })),

      startExam: (examId, studentId, deviceId) => {
        const attempt: ExamAttempt = {
          id: uid(),
          examId,
          studentId,
          answers: [],
          startedAt: Date.now(),
          status: 'in_progress',
          tabSwitchCount: 0,
          deviceId,
          violations: [],
        };
        set((s) => ({ attempts: [...s.attempts, attempt] }));
        return attempt;
      },

      submitExam: (attemptId, answers) => {
        const { exams, attempts } = get();
        const attempt = attempts.find((a) => a.id === attemptId)!;
        const exam = exams.find((e) => e.id === attempt.examId)!;

        let totalPoints = 0;
        const gradedAnswers = answers.map((ans) => {
          const q = exam.questions.find((q) => q.id === ans.questionId)!;
          if (q.type === 'mcq' || q.type === 'truefalse') {
            const isCorrect = String(ans.answer) === String(q.correctAnswer);
            const pts = isCorrect ? q.points : 0;
            totalPoints += pts;
            return { ...ans, isCorrect, points: pts };
          }
          return { ...ans, isCorrect: undefined, points: undefined };
        });

        const autoGraded = exam.gradingType === 'auto';
        const percentage = autoGraded
          ? Math.round((totalPoints / exam.totalPoints) * 100)
          : undefined;

        const updated: ExamAttempt = {
          ...attempt,
          answers: gradedAnswers,
          submittedAt: Date.now(),
          status: autoGraded ? 'graded' : 'submitted',
          totalPoints: autoGraded ? totalPoints : undefined,
          percentage,
        };

        set((s) => ({
          attempts: s.attempts.map((a) => (a.id === attemptId ? updated : a)),
        }));

        if (autoGraded) {
          get().addNotification({
            userId: attempt.studentId,
            title: 'نتيجة الامتحان',
            body: `حصلت على ${percentage}% في الامتحان`,
            type: 'grade',
            relatedId: attemptId,
          });
        }

        return updated;
      },

      gradeAttempt: (attemptId, grades) => {
        const { attempts, exams } = get();
        const attempt = attempts.find((a) => a.id === attemptId)!;
        const exam = exams.find((e) => e.id === attempt.examId)!;

        const totalPoints = grades.reduce((sum, g) => sum + g.points, 0);
        const percentage = Math.round((totalPoints / exam.totalPoints) * 100);

        const updatedAnswers = attempt.answers.map((ans) => {
          const grade = grades.find((g) => g.questionId === ans.questionId);
          return grade ? { ...ans, points: grade.points } : ans;
        });

        set((s) => ({
          attempts: s.attempts.map((a) =>
            a.id === attemptId
              ? { ...a, answers: updatedAnswers, totalPoints, percentage, status: 'graded' }
              : a
          ),
        }));

        get().addNotification({
          userId: attempt.studentId,
          title: 'تم تصحيح امتحانك',
          body: `حصلت على ${percentage}% في الامتحان`,
          type: 'grade',
          relatedId: attemptId,
        });
      },

      recordViolation: (attemptId, violation) =>
        set((s) => ({
          attempts: s.attempts.map((a) =>
            a.id === attemptId
              ? {
                  ...a,
                  violations: [...a.violations, violation],
                  tabSwitchCount: violation.includes('tab') ? a.tabSwitchCount + 1 : a.tabSwitchCount,
                }
              : a
          ),
        })),

      sendMessage: (senderId, receiverId, text) => {
        const msg: Message = {
          id: uid(),
          senderId,
          receiverId,
          text,
          sentAt: Date.now(),
          isRead: false,
        };

        const convId = [senderId, receiverId].sort().join('_');
        set((s) => {
          const existingConv = s.conversations.find((c) => c.id === convId);
          const updatedConversations = existingConv
            ? s.conversations.map((c) =>
                c.id === convId ? { ...c, lastMessage: msg, updatedAt: Date.now() } : c
              )
            : [
                ...s.conversations,
                { id: convId, participants: [senderId, receiverId], lastMessage: msg, updatedAt: Date.now() },
              ];
          return { messages: [...s.messages, msg], conversations: updatedConversations };
        });

        get().addNotification({
          userId: receiverId,
          title: 'رسالة جديدة',
          body: text.length > 40 ? text.substring(0, 40) + '...' : text,
          type: 'message',
          relatedId: convId,
        });

        return msg;
      },

      markMessagesRead: (conversationId, userId) =>
        set((s) => ({
          messages: s.messages.map((m) =>
            [m.senderId, m.receiverId].sort().join('_') === conversationId && m.receiverId === userId
              ? { ...m, isRead: true }
              : m
          ),
        })),

      addNotification: (data) => {
        const notif: Notification = {
          ...data,
          id: uid(),
          createdAt: Date.now(),
          isRead: false,
        };
        set((s) => ({ notifications: [notif, ...s.notifications] }));
      },

      markNotificationRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          ),
        })),

      updateUser: (id, updates) =>
        set((s) => ({
          users: s.users.map((u) => (u.id === id ? { ...u, ...updates } : u)),
        })),

      toggleStudentActive: (id) =>
        set((s) => ({
          users: s.users.map((u) =>
            u.id === id ? { ...u, isActive: !u.isActive } : u
          ),
        })),
    }),
    {
      name: 'sco-academy-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
