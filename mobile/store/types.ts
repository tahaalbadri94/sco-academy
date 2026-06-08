export type UserRole = 'teacher' | 'student';

export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  deviceId?: string;
  registeredAt: number;
  isActive: boolean;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  teacherId: string;
  lessons: Lesson[];
  enrolledStudents: string[];
  createdAt: number;
  isPublished: boolean;
  category: string;
  totalDuration: number;
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  description: string;
  videoUrl?: string;
  fileUrl?: string;
  fileType?: 'pdf' | 'doc' | 'video';
  duration: number;
  order: number;
  isProtected: boolean;
}

export type QuestionType = 'mcq' | 'truefalse' | 'short_answer' | 'essay';
export type GradingType = 'auto' | 'manual';

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options?: string[];
  correctAnswer?: string | boolean;
  points: number;
  imageUrl?: string;
}

export interface Exam {
  id: string;
  courseId: string;
  title: string;
  description: string;
  questions: Question[];
  duration: number;
  totalPoints: number;
  gradingType: GradingType;
  preventScreenCapture: boolean;
  preventTabSwitch: boolean;
  shuffleQuestions: boolean;
  maxAttempts: number;
  startDate?: number;
  endDate?: number;
  createdAt: number;
  isPublished: boolean;
}

export interface StudentAnswer {
  questionId: string;
  answer: string | boolean;
  isCorrect?: boolean;
  points?: number;
}

export interface ExamAttempt {
  id: string;
  examId: string;
  studentId: string;
  answers: StudentAnswer[];
  startedAt: number;
  submittedAt?: number;
  totalPoints?: number;
  percentage?: number;
  status: 'in_progress' | 'submitted' | 'graded';
  tabSwitchCount: number;
  deviceId: string;
  violations: string[];
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  sentAt: number;
  isRead: boolean;
  attachmentUrl?: string;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  updatedAt: number;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: 'course' | 'exam' | 'message' | 'grade' | 'system';
  relatedId?: string;
  createdAt: number;
  isRead: boolean;
}

export interface AppState {
  currentUser: User | null;
  users: User[];
  courses: Course[];
  exams: Exam[];
  attempts: ExamAttempt[];
  messages: Message[];
  conversations: Conversation[];
  notifications: Notification[];
}
