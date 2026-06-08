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

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const login = useStore((s) => s.login);

  const handleLogin = async () => {
    if (!identifier.trim() || !password.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال البيانات كاملة');
      return;
    }
    setLoading(true);
    try {
      const deviceId = await getDeviceId();
      const user = await login(identifier.trim(), password, deviceId);
      if (!user) {
        Alert.alert(
          'خطأ في تسجيل الدخول',
          'بيانات غير صحيحة أو الحساب محظور أو هذا الجهاز غير مسجل لهذا الحساب.'
        );
        return;
      }
      if (user.role === 'teacher') router.replace('/(teacher)/dashboard');
      else router.replace('/(student)/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#0A0E1A', '#111827']} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Logo */}
          <View style={styles.logoWrap}>
            <LinearGradient colors={[Colors.primary, Colors.purple]} style={styles.logoCircle}>
              <Text style={styles.logoText}>SCO</Text>
            </LinearGradient>
            <Text style={styles.appName}>أكاديمية SCO</Text>
            <Text style={styles.tagline}>منصة التعليم الاحترافية</Text>
          </View>

          {/* Form */}
          <View style={styles.card}>
            <Text style={styles.title}>تسجيل الدخول</Text>

            <View style={styles.inputWrap}>
              <Ionicons name="person-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="البريد الإلكتروني أو رقم الهاتف"
                placeholderTextColor={Colors.textMuted}
                value={identifier}
                onChangeText={setIdentifier}
                keyboardType="email-address"
                autoCapitalize="none"
                textAlign="right"
              />
            </View>

            <View style={styles.inputWrap}>
              <TouchableOpacity onPress={() => setShowPw(!showPw)} style={styles.inputIcon}>
                <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textMuted} />
              </TouchableOpacity>
              <TextInput
                style={styles.input}
                placeholder="كلمة المرور"
                placeholderTextColor={Colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPw}
                textAlign="right"
              />
            </View>

            <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
              <LinearGradient colors={[Colors.primary, Colors.purple]} style={styles.btnGrad}>
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.btnText}>دخول</Text>}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/(auth)/register')} style={styles.link}>
              <Text style={styles.linkText}>ليس لديك حساب؟ <Text style={{ color: Colors.primary }}>سجل الآن</Text></Text>
            </TouchableOpacity>
          </View>

          <View style={styles.hint}>
            <Text style={styles.hintText}>للأستاذ: teacher@sco.academy / teacher123</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoWrap: { alignItems: 'center', marginBottom: 40 },
  logoCircle: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  logoText: { color: '#fff', fontSize: 28, fontWeight: '900' },
  appName: { color: Colors.text, fontSize: 26, fontWeight: '800', marginBottom: 4 },
  tagline: { color: Colors.textMuted, fontSize: 14 },
  card: { backgroundColor: Colors.bgCard, borderRadius: 20, padding: 28, borderWidth: 1, borderColor: Colors.border },
  title: { color: Colors.text, fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 24 },
  inputWrap: {
    flexDirection: 'row-reverse', alignItems: 'center',
    backgroundColor: Colors.bgLight, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 16, paddingHorizontal: 12,
  },
  inputIcon: { padding: 4 },
  input: { flex: 1, color: Colors.text, fontSize: 15, paddingVertical: 14, paddingHorizontal: 8 },
  btn: { borderRadius: 12, overflow: 'hidden', marginTop: 8 },
  btnGrad: { paddingVertical: 16, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  link: { marginTop: 20, alignItems: 'center' },
  linkText: { color: Colors.textMuted, fontSize: 14 },
  hint: { marginTop: 24, alignItems: 'center' },
  hintText: { color: Colors.textMuted, fontSize: 11 },
});
