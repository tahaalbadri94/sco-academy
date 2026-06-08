import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useStore } from '@/store/useStore';
import { View, Text } from 'react-native';

function TabBadge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <View style={{ position: 'absolute', top: -4, right: -8, backgroundColor: Colors.danger, borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 }}>
      <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
}

export default function TeacherLayout() {
  const { notifications, currentUser, messages } = useStore();
  const unreadNotifs = notifications.filter((n) => n.userId === currentUser?.id && !n.isRead).length;
  const unreadMsgs = messages.filter((m) => m.receiverId === currentUser?.id && !m.isRead).length;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: Colors.bgCard, borderTopColor: Colors.border, height: 65, paddingBottom: 8 },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: 'الرئيسية', tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="courses/index" options={{ title: 'الكورسات', tabBarIcon: ({ color, size }) => <Ionicons name="book-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="students/index" options={{ title: 'الطلاب', tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="exams/index" options={{ title: 'الامتحانات', tabBarIcon: ({ color, size }) => <Ionicons name="clipboard-outline" size={size} color={color} /> }} />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'الرسائل',
          tabBarIcon: ({ color, size }) => (
            <View>
              <Ionicons name="chatbubbles-outline" size={size} color={color} />
              <TabBadge count={unreadMsgs} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'الإشعارات',
          tabBarIcon: ({ color, size }) => (
            <View>
              <Ionicons name="notifications-outline" size={size} color={color} />
              <TabBadge count={unreadNotifs} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
