import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, useColorScheme, Modal, TextInput, FlatList, Alert
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { educationService } from "@/src/modules/church-admin/services/education.service";

export default function TopicsScreen() {
  const { id, name, color } = useLocalSearchParams<{ id: string; name: string; color: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [topics, setTopics] = useState<any[]>([]);
  
  // Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [newTopic, setNewTopic] = useState({ topic_number: '', topic_name: '' });

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await educationService.getCourseTopics(Number(id));
      setTopics(data);
    } catch (error) {
      console.error("Error loading topics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCreate = async () => {
    if (!newTopic.topic_number || !newTopic.topic_name) return;
    try {
      await educationService.createCourseTopic(Number(id), {
        topic_number: Number(newTopic.topic_number),
        topic_name: newTopic.topic_name
      });
      setModalVisible(false);
      setNewTopic({ topic_number: '', topic_name: '' });
      loadData();
    } catch (error) { alert("Error al crear lección"); }
  };

  const handleDelete = (topicId: number) => {
    Alert.alert("Eliminar Lección", "¿Estás seguro?", [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: async () => {
            try {
                await educationService.deleteCourseTopic(Number(id), topicId);
                loadData();
            } catch (error) { alert("Error al eliminar"); }
        }}
    ]);
  };

  const t = {
    bg: isDark ? "#0a0a1a" : "#f0f2f5",
    card: isDark ? "#14142b" : "#ffffff",
    text: isDark ? "#eaeaef" : "#1a1a2e",
    textSec: isDark ? "#8888a4" : "#6b7280",
    accent: color || "#6366f1",
    border: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
    input: isDark ? "#1c1c3d" : "#f8fafc",
  };

  return (
    <View style={[s.container, { backgroundColor: t.bg }]}>
      <View style={[s.header, { backgroundColor: t.accent }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 15 }}>
          <Text style={s.headerLabel}>TEMARIO DEL CURSO</Text>
          <Text style={s.headerTitle} numberOfLines={1}>{name}</Text>
        </View>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Ionicons name="add-circle" size={32} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color={t.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={topics}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.accent} />}
          renderItem={({ item }) => (
            <View style={[s.topicCard, { backgroundColor: t.card, borderColor: t.border }]}>
              <View style={[s.numberBadge, { backgroundColor: t.accent + '20' }]}>
                <Text style={[s.numberText, { color: t.accent }]}>{item.topic_number}</Text>
              </View>
              <Text style={[s.topicName, { color: t.text }]}>{item.topic_name}</Text>
              <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="book-outline" size={64} color={t.textSec} />
              <Text style={{ color: t.textSec, marginTop: 15, fontSize: 16, fontWeight: '600' }}>No hay lecciones registradas</Text>
              <Text style={{ color: t.textSec, marginTop: 5, textAlign: 'center' }}>Define el temario para que el maestro{'\n'}pueda pasar asistencia fácilmente.</Text>
            </View>
          }
        />
      )}

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { backgroundColor: t.card }]}>
            <Text style={[s.modalTitle, { color: t.text }]}>Nueva Lección</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput 
                placeholder="# Lección" 
                keyboardType="numeric"
                placeholderTextColor={t.textSec}
                style={[s.input, { flex: 1, backgroundColor: t.input, color: t.text }]}
                value={newTopic.topic_number}
                onChangeText={v => setNewTopic({...newTopic, topic_number: v})}
              />
              <TextInput 
                placeholder="Nombre de la lección" 
                placeholderTextColor={t.textSec}
                style={[s.input, { flex: 3, backgroundColor: t.input, color: t.text }]}
                value={newTopic.topic_name}
                onChangeText={v => setNewTopic({...newTopic, topic_name: v})}
              />
            </View>
            <View style={s.modalButtons}>
              <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={{ color: t.textSec }}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={[s.btnPri, { backgroundColor: t.accent }]} onPress={handleCreate}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Agregar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingBottom: 25, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", borderBottomLeftRadius: 35, borderBottomRightRadius: 35 },
  backBtn: { width: 42, height: 42, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" },
  headerLabel: { fontSize: 10, fontWeight: "700", color: "rgba(255,255,255,0.7)", letterSpacing: 1 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },
  list: { padding: 20, paddingBottom: 40 },
  topicCard: { padding: 15, borderRadius: 18, borderWidth: 1, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  numberBadge: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  numberText: { fontSize: 16, fontWeight: '800' },
  topicName: { flex: 1, fontSize: 15, fontWeight: '700' },
  empty: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: 'center', padding: 20 },
  modalContent: { padding: 25, borderRadius: 28, gap: 15 },
  modalTitle: { fontSize: 20, fontWeight: "800", marginBottom: 5 },
  input: { padding: 14, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 20, marginTop: 10 },
  btnPri: { paddingVertical: 12, paddingHorizontal: 25, borderRadius: 12 },
});
