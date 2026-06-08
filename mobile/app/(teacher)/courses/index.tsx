import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Modal, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useStore } from '@/store/useStore';
import Colors from '@/constants/Colors';
import { Course } from '@/store/types';

const CATEGORIES = ['تداول', 'برمجة', 'تصميم', 'رياضيات', 'لغات', 'عام'];

export default function CoursesScreen() {
  const { courses, addCourse, deleteCourse, updateCourse, currentUser } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [search, setSearch] = useState('');

  const filtered = courses.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    if (!title.trim()) { Alert.alert('خطأ', 'أدخل عنوان الكورس'); return; }
    addCourse({
      title: title.trim(),
      description: desc.trim(),
      teacherId: currentUser!.id,
      lessons: [],
      isPublished: false,
      category,
      totalDuration: 0,
    });
    setTitle(''); setDesc(''); setShowModal(false);
  };

  const handleDelete = (c: Course) => {
    Alert.alert('حذف الكورس', `هل تريد حذف "${c.title}"?`, [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: () => deleteCourse(c.id) },
    ]);
  };

  const renderCourse = ({ item }: { item: Course }) => (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/(teacher)/courses/${item.id}` as any)}>
      <LinearGradient colors={[Colors.primary + '22', Colors.purple + '11']} style={styles.cardGrad}>
        <View style={styles.cardHeader}>
          <TouchableOpacity onPress={() => handleDelete(item)}>
            <Ionicons name="trash-outline" size={20} color={Colors.danger} />
          </TouchableOpacity>
          <View style={styles.cardBadge}>
            <Text style={styles.cardBadgeText}>{item.category}</Text>
          </View>
        </View>
        <Text style={styles.cardTitle}>{item.title}</Text>
        {item.description ? <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text> : null}
        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={[styles.statusBtn, item.isPublished && styles.statusBtnActive]}
            onPress={() => updateCourse(item.id, { isPublished: !item.isPublished })}
          >
            <Ionicons name={item.isPublished ? 'eye' : 'eye-off'} size={14} color={item.isPublished ? Colors.accent : Colors.textMuted} />
            <Text style={[styles.statusText, item.isPublished && { color: Colors.accent }]}>
              {item.isPublished ? 'منشور' : 'مسودة'}
            </Text>
          </TouchableOpacity>
          <View style={styles.cardStats}>
            <View style={styles.statItem}>
              <Ionicons name="people-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.statTxt}>{item.enrolledStudents.length}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="play-circle-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.statTxt}>{item.lessons.length} درس</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>الكورسات ({courses.length})</Text>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
        <TextInput style={styles.searchInput} placeholder="بحث في الكورسات..."
          placeholderTextColor={Colors.textMuted} value={search} onChangeText={setSearch} textAlign="right" />
      </View>

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="book-outline" size={64} color={Colors.textMuted} />
          <Text style={styles.emptyText}>لا توجد كورسات بعد</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowModal(true)}>
            <Text style={styles.emptyBtnText}>أضف كورسك الأول</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList data={filtered} keyExtractor={(c) => c.id} renderItem={renderCourse}
          contentContainerStyle={{ padding: 16, gap: 12 }} showsVerticalScrollIndicator={false} />
      )}

      {/* Add Course Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>إضافة كورس جديد</Text>
            </View>

            <TextInput style={styles.modalInput} placeholder="عنوان الكورس *"
              placeholderTextColor={Colors.textMuted} value={title} onChangeText={setTitle} textAlign="right" />
            <TextInput style={[styles.modalInput, { height: 90, textAlignVertical: 'top' }]}
              placeholder="وصف الكورس" placeholderTextColor={Colors.textMuted}
              value={desc} onChangeText={setDesc} multiline textAlign="right" />

            <Text style={styles.catLabel}>التصنيف</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity key={cat} style={[styles.catChip, category === cat && styles.catChipActive]}
                  onPress={() => setCategory(cat)}>
                  <Text style={[styles.catChipText, category === cat && { color: '#fff' }]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity onPress={handleAdd}>
              <LinearGradient colors={[Colors.primary, Colors.purple]} style={styles.modalBtn}>
                <Text style={styles.modalBtnText}>إضافة الكورس</Text>
              </LinearGradient>
            </TouchableOpacity>
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
  searchWrap: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: Colors.bgCard, marginHorizontal: 16, borderRadius: 12, paddingHorizontal: 12, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  searchInput: { flex: 1, color: Colors.text, paddingVertical: 12, paddingHorizontal: 8, fontSize: 14 },
  card: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  cardGrad: { padding: 16 },
  cardHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardBadge: { backgroundColor: Colors.primary + '33', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  cardBadgeText: { color: Colors.primary, fontSize: 11, fontWeight: '600' },
  cardTitle: { color: Colors.text, fontSize: 16, fontWeight: '700', textAlign: 'right', marginBottom: 6 },
  cardDesc: { color: Colors.textMuted, fontSize: 13, textAlign: 'right', marginBottom: 12 },
  cardFooter: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  statusBtn: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, backgroundColor: Colors.bgLight, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  statusBtnActive: { backgroundColor: Colors.accent + '22' },
  statusText: { color: Colors.textMuted, fontSize: 12 },
  cardStats: { flexDirection: 'row', gap: 12 },
  statItem: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
  statTxt: { color: Colors.textMuted, fontSize: 12 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { color: Colors.textMuted, fontSize: 16 },
  emptyBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  emptyBtnText: { color: '#fff', fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modal: { backgroundColor: Colors.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 14 },
  modalHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { color: Colors.text, fontSize: 18, fontWeight: '700' },
  modalInput: { backgroundColor: Colors.bgLight, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, color: Colors.text, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  catLabel: { color: Colors.textMuted, fontSize: 13, textAlign: 'right' },
  catScroll: { marginVertical: -4 },
  catChip: { backgroundColor: Colors.bgLight, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, borderWidth: 1, borderColor: Colors.border },
  catChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catChipText: { color: Colors.textMuted, fontSize: 13 },
  modalBtn: { borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  modalBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
