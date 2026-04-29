import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, useColorScheme, Modal, TextInput, FlatList,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { educationService, SchoolPeriod, Teacher, Course } from "@/src/modules/church-admin/services/education.service";

export default function CourseDetailsScreen() {
  const { id, name, schoolColor } = useLocalSearchParams<{ id: string; name: string; schoolColor: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();

  const [course, setCourse] = useState<Course | null>(null);
  const [periods, setPeriods] = useState<SchoolPeriod[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modals
  const [periodModal, setPeriodModal] = useState(false);
  const [teacherModal, setTeacherModal] = useState(false);
  const [createTeacherModal, setCreateTeacherModal] = useState(false);

  // Forms
  const [newPeriod, setNewPeriod] = useState({ name: '', start_date: '', end_date: '' });
  const [newTeacher, setNewTeacher] = useState({ name: '', email: '', phone: '' });

  const loadData = async () => {
    try {
      // Necesitamos cargar los maestros y periodos generales de la iglesia
      const [pData, tData] = await Promise.all([
        educationService.getPeriods(),
        educationService.getTeachers()
      ]);
      setPeriods(Array.isArray(pData) ? pData : []);
      setTeachers(Array.isArray(tData) ? tData : []);
      
      // Intentamos encontrar el curso actual en el catalogo (o podriamos tener un getCourseById)
      // Por ahora, asumimos que tenemos los datos del curso o los refrescamos si es necesario
    } catch (error) {
      console.error("Error loading course details:", error);
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

  const handleAssignTeacher = async (teacherId: number) => {
    try {
      await educationService.assignTeacher(Number(id), teacherId);
      setTeacherModal(false);
      loadData();
    } catch (error) {
      alert("Error al asignar maestro");
    }
  };

  const handleCreateTeacher = async () => {
    if (!newTeacher.name) return;
    try {
      const created = await educationService.createTeacher(newTeacher);
      await handleAssignTeacher(created.id);
      setCreateTeacherModal(false);
      setNewTeacher({ name: '', email: '', phone: '' });
    } catch (error) {
      alert("Error al crear maestro");
    }
  };

  const handleCreatePeriod = async () => {
    if (!newPeriod.name) return;
    try {
      await educationService.createPeriod(newPeriod);
      setPeriodModal(false);
      setNewPeriod({ name: '', start_date: '', end_date: '' });
      loadData();
    } catch (error) {
      alert("Error al crear periodo");
    }
  };

  const t = {
    bg: isDark ? "#0a0a1a" : "#f0f2f5",
    card: isDark ? "#14142b" : "#ffffff",
    text: isDark ? "#eaeaef" : "#1a1a2e",
    textSec: isDark ? "#8888a4" : "#6b7280",
    accent: schoolColor || "#6366f1",
    border: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
    input: isDark ? "#1c1c3d" : "#f8fafc",
  };

  const currentTeacherId = teachers.find(t => t.id > 0)?.id; // Simplificación para demo

  return (
    <View style={[s.container, { backgroundColor: t.bg }]}>
      {/* Header */}
      <View style={[s.header, { backgroundColor: t.accent }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={s.headerContent}>
          <Text style={s.headerLabel}>GESTIÓN DE CURSO</Text>
          <Text style={s.headerTitle} numberOfLines={1}>{name}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={s.flex}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.accent} />}
      >
        <View style={s.content}>
          
          {/* SECCIÓN MAESTRO */}
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={[s.sectionTitle, { color: t.text }]}>Maestro Titular</Text>
              <TouchableOpacity onPress={() => setTeacherModal(true)}>
                <Text style={[s.actionText, { color: t.accent }]}>Cambiar</Text>
              </TouchableOpacity>
            </View>
            
            <View style={[s.mainCard, { backgroundColor: t.card, borderColor: t.border }]}>
              <View style={[s.avatarLarge, { backgroundColor: t.accent + '20' }]}>
                <Ionicons name="person" size={30} color={t.accent} />
              </View>
              <View style={s.cardInfo}>
                <Text style={[s.cardTitle, { color: t.text }]}>Asignar Maestro Único</Text>
                <Text style={[s.cardSub, { color: t.textSec }]}>Este maestro será el responsable de la materia en todos los periodos.</Text>
                <TouchableOpacity 
                  style={[s.assignBtn, { backgroundColor: t.accent }]}
                  onPress={() => setTeacherModal(true)}
                >
                  <Text style={s.assignBtnText}>Gestionar Maestro</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* SECCIÓN PERIODOS */}
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={[s.sectionTitle, { color: t.text }]}>Periodos Escolares</Text>
              <TouchableOpacity onPress={() => setPeriodModal(true)}>
                <Ionicons name="add-circle" size={24} color={t.accent} />
              </TouchableOpacity>
            </View>

            {!Array.isArray(periods) || periods.length === 0 ? (
              <View style={[s.emptyBox, { borderColor: t.border, borderStyle: 'dashed' }]}>
                <Text style={[s.emptyText, { color: t.textSec }]}>No hay periodos creados aún.</Text>
                <TouchableOpacity onPress={() => setPeriodModal(true)}>
                  <Text style={{ color: t.accent, fontWeight: '700', marginTop: 8 }}>Crear Primer Periodo</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={s.periodList}>
                {periods.map(period => (
                  <View key={period.id} style={[s.periodItem, { backgroundColor: t.card, borderColor: t.border }]}>
                    <View style={s.periodInfo}>
                      <Text style={[s.periodName, { color: t.text }]}>{period.name}</Text>
                      <Text style={[s.periodDates, { color: t.textSec }]}>
                        {period.start_date || 'Sin inicio'} • {period.end_date || 'Sin fin'}
                      </Text>
                    </View>
                    <View style={[s.statusDot, { backgroundColor: period.status === 'active' ? '#10b981' : '#6b7280' }]} />
                  </View>
                ))}
              </View>
            )}
          </View>

        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal Selección Maestro */}
      <Modal visible={teacherModal} animationType="fade" transparent>
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { backgroundColor: t.card }]}>
            <View style={s.modalHeader}>
              <Text style={[s.modalTitle, { color: t.text }]}>Seleccionar Maestro</Text>
              <TouchableOpacity onPress={() => { setTeacherModal(false); setCreateTeacherModal(true); }}>
                <Text style={{ color: t.accent, fontWeight: '700' }}>+ Crear Nuevo</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={teachers}
              keyExtractor={item => item.id.toString()}
              style={{ maxHeight: 300 }}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  onPress={() => handleAssignTeacher(item.id)}
                  style={[s.teacherItem, { borderBottomColor: t.border }]}
                >
                  <View style={[s.avatarSmall, { backgroundColor: t.accent + '15' }]}>
                    <Text style={{ color: t.accent, fontWeight: '700' }}>{item.name.charAt(0)}</Text>
                  </View>
                  <Text style={[s.teacherItemName, { color: t.text }]}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity onPress={() => setTeacherModal(false)} style={s.closeBtn}>
              <Text style={{ color: t.textSec }}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Crear Maestro */}
      <Modal visible={createTeacherModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { backgroundColor: t.card }]}>
            <Text style={[s.modalTitle, { color: t.text }]}>Nuevo Maestro</Text>
            <TextInput 
              placeholder="Nombre del maestro"
              placeholderTextColor={t.textSec}
              style={[s.input, { backgroundColor: t.input, color: t.text }]}
              value={newTeacher.name}
              onChangeText={text => setNewTeacher({...newTeacher, name: text})}
            />
            <TextInput 
              placeholder="Email (opcional)"
              placeholderTextColor={t.textSec}
              style={[s.input, { backgroundColor: t.input, color: t.text }]}
              value={newTeacher.email}
              onChangeText={text => setNewTeacher({...newTeacher, email: text})}
            />
            <View style={s.modalButtons}>
              <TouchableOpacity onPress={() => setCreateTeacherModal(false)} style={s.btnSec}>
                <Text style={{ color: t.textSec }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreateTeacher} style={[s.btnPri, { backgroundColor: t.accent }]}>
                <Text style={{ color: "#fff", fontWeight: '700' }}>Guardar y Asignar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Crear Periodo */}
      <Modal visible={periodModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { backgroundColor: t.card }]}>
            <Text style={[s.modalTitle, { color: t.text }]}>Nuevo Periodo</Text>
            <TextInput 
              placeholder="Nombre del periodo (ej: 2026-A)"
              placeholderTextColor={t.textSec}
              style={[s.input, { backgroundColor: t.input, color: t.text }]}
              value={newPeriod.name}
              onChangeText={text => setNewPeriod({...newPeriod, name: text})}
            />
            <View style={s.modalButtons}>
              <TouchableOpacity onPress={() => setPeriodModal(false)} style={s.btnSec}>
                <Text style={{ color: t.textSec }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreatePeriod} style={[s.btnPri, { backgroundColor: t.accent }]}>
                <Text style={{ color: "#fff", fontWeight: '700' }}>Crear Periodo</Text>
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
  flex: { flex: 1 },
  header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" },
  headerContent: { alignItems: "center", flex: 1, paddingHorizontal: 10 },
  headerLabel: { fontSize: 10, fontWeight: "700", color: "rgba(255,255,255,0.7)", letterSpacing: 1 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#fff", marginTop: 2 },
  content: { padding: 20 },
  section: { marginBottom: 30 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "800" },
  actionText: { fontWeight: "700", fontSize: 14 },
  mainCard: { padding: 20, borderRadius: 24, borderWidth: 1, flexDirection: "row", alignItems: "center" },
  avatarLarge: { width: 60, height: 60, borderRadius: 30, justifyContent: "center", alignItems: "center", marginRight: 16 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: "700" },
  cardSub: { fontSize: 12, marginTop: 4, lineHeight: 16 },
  assignBtn: { marginTop: 12, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10, alignSelf: 'flex-start' },
  assignBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  periodList: { gap: 10 },
  periodItem: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 16, borderWidth: 1 },
  periodInfo: { flex: 1 },
  periodName: { fontSize: 15, fontWeight: "700" },
  periodDates: { fontSize: 12, marginTop: 2 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  emptyBox: { padding: 30, borderRadius: 20, borderWidth: 2, alignItems: "center" },
  emptyText: { fontSize: 14, textAlign: "center" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: 20 },
  modalContent: { padding: 24, borderRadius: 24, gap: 16 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  modalTitle: { fontSize: 20, fontWeight: "800" },
  input: { padding: 14, borderRadius: 12, fontSize: 16 },
  modalButtons: { flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 8 },
  btnPri: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  btnSec: { paddingHorizontal: 20, paddingVertical: 12 },
  teacherItem: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1 },
  avatarSmall: { width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center", marginRight: 12 },
  teacherItemName: { fontSize: 16, fontWeight: "600" },
  closeBtn: { marginTop: 10, alignItems: "center", padding: 10 },
});
