import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/store/useStore';
import { getDeviceId } from '@/utils/device';
import Colors from '@/constants/Colors';

type RegMode = 'email' | 'phone';

export default function RegisterScreen() {
  const [mode, setMode] = useState<RegMode>('email');
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const register = useStore((s) => s.register);

  const handleRegister = async () => {
    if (!name.trim() || !identifier.trim() || !password.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال جميع البيانات');
      return;
    }
    if (password !== confirm) {
      Alert.alert('خطأ', 'كلمتا المرور غير متطابقتين');
      return;
    }
    if (password.length < 6) {
      Alert.alert('خطأ', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setLoading(true);
    try {
      const deviceId = await getDeviceId();
      const userData = {
        name: name.trim(),
        password,
        ...(mode === 'email' ? { email: identifier.trim() } : { phone: identifier.trim() }),
      };
      const user = await register(userData, deviceId);
      if (!user) {
        Alert.alert('خطأ', 'المستخدم مسجل مسبقاً بهذا البريد أو الهاتف');
        return;
      }
      router.replace('/(student)/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#0A0E1A', '#111827']} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>

          <View style={styles.header}>
            <LinearGradient colors={[Colors.accent, '#059669']} style={styles.icon}>
              <Ionicons name="person-add-outline" size={32} color="#fff" />
            </LinearGradient>
            <Text style={styles.title}>إنشاء حساب جديد</Text>
          </View>

          <View style={styles.card}>
            {/* Toggle email/phone */}
            <View style={styles.toggle}>
              <TouchableOpacity
                style={[styles.toggleBtn, mode === 'email' && styles.toggleActive]}
                onPress={() => setMode('email')}
              >
                <Ionicons name="mail-outline" size={16} color={mode === 'email' ? '#fff' : Colors.textMuted} />
                <Text style={[styles.toggleText, mode === 'email' && { color: '#fff' }]}>بريد إلكتروني</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, mode === 'phone' && styles.toggleActive]}
                onPress={() => setMode('phone')}
              >
                <Ionicons name="phone-portrait-outline" size={16} color={mode === 'phone' ? '#fff' : Colors.textMuted} />
                <Text style={[styles.toggleText, mode === 'phone' && { color: '#fff' }]}>رقم الهاتف</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputWrap}>
              <Ionicons name="person-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="الاسم الكامل" placeholderTextColor={Colors.textMuted}
                value={name} onChangeText={setName} textAlign="right" />
            </View>

            <View style={styles.inputWrap}>
              <Ionicons name={mode === 'email' ? 'mail-outline' : 'phone-portrait-outline'} size={20}
                color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput style={styles.input}
                placeholder={mode === 'email' ? 'البريد الإلكتروني' : 'رقم الهاتف'}
                placeholderTextColor={Colors.textMuted}
                value={identifier} onChangeText={setIdentifier}
                keyboardType={mode === 'email' ? 'email-address' : 'phone-pad'}
                autoCapitalize="none" textAlign="right" />
            </View>

            <View style={styles.inputWrap}>
              <TouchableOpacity onPress={() => setShowPw(!showPw)} style={styles.inputIcon}>
                <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textMuted} />
              </TouchableOpacity>
              <TextInput style={styles.input} placeholder="كلمة المرور" placeholderTextColor={Colors.textMuted}
                value={password} onChangeText={setPassword} secureTextEntry={!showPw} textAlign="right" />
            </View>

            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="تأكيد كلمة المرور"
                placeholderTextColor={Colors.textMuted}
                value={confirm} onChangeText={setConfirm} secureTextEntry={!showPw} textAlign="right" />
            </View>

            <View style={styles.notice}>
              <Ionicons name="shield-checkmark-outline" size={16} color={Colors.accent} />
              <Text style={styles.noticeText}>سيتم ربط حسابك بهذا الجهاز تلقائياً</Text>
            </View>

            <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
              <LinearGradient colors={[Colors.accent, '#059669']} style={styles.btnGrad}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>إنشاء الحساب</Text>}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.back()} style={styles.link}>
              <Text style={styles.linkText}>لديك حساب؟ <Text style={{ color: Colors.primary }}>سجل الدخول</Text></Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, padding: 24, paddingTop: 60 },
  back: { marginBottom: 16 },
  header: { alignItems: 'center', marginBottom: 28 },
  icon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  title: { color: Colors.text, fontSize: 22, fontWeight: '700' },
  card: { backgroundColor: Colors.bgCard, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: Colors.border },
  toggle: { flexDirection: 'row', backgroundColor: Colors.bgLight, borderRadius: 12, padding: 4, marginBottom: 20 },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10 },
  toggleActive: { backgroundColor: Colors.primary },
  toggleText: { color: Colors.textMuted, fontSize: 13 },
  inputWrap: {
    flexDirection: 'row-reverse', alignItems: 'center',
    backgroundColor: Colors.bgLight, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 14, paddingHorizontal: 12,
  },
  inputIcon: { padding: 4 },
  input: { flex: 1, color: Colors.text, fontSize: 15, paddingVertical: 14, paddingHorizontal: 8 },
  notice: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, backgroundColor: '#0d2818', borderRadius: 10, padding: 12, marginBottom: 16 },
  noticeText: { color: Colors.accent, fontSize: 12, flex: 1, textAlign: 'right' },
  btn: { borderRadius: 12, overflow: 'hidden', marginTop: 4 },
  btnGrad: { paddingVertical: 16, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  link: { marginTop: 18, alignItems: 'center' },
  linkText: { color: Colors.textMuted, fontSize: 14 },
});
