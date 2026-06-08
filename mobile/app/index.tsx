import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useStore } from '@/store/useStore';

export default function Index() {
  const currentUser = useStore((s) => s.currentUser);

  if (!currentUser) return <Redirect href="/(auth)/login" />;
  if (currentUser.role === 'teacher') return <Redirect href="/(teacher)/dashboard" />;
  return <Redirect href="/(student)/dashboard" />;
}
