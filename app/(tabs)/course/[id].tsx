import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, useColorScheme, Modal, TextInput, FlatList,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/src/modules/auth";
import { educationService, SchoolPeriod, Teacher, Course, Student } from "@/src/modules/church-admin/services/education.service";

export default function CourseDetailsScreen() {
  const { id, name, schoolColor, period_id, period_name } = useLocalSearchParams<{ 
    id: string; 
    name: string; 
    schoolColor: string;
    period_id?: string;
    period_name?: string;
  }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const { user } = useAuth();

  const [periods, setPeriods] = useState<SchoolPeriod[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<SchoolPeriod | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modals
  const [periodModal, setPeriodModal] = useState(false);
  const [teacherModal, setTeacherModal] = useState(false);
  const [createTeacherModal, setCreateTeacherModal] = useState(false);
  
  // Teacher Modals
  const [enrollModal, setEnrollModal] = useState(false);
  const [attendanceModal, setAttendanceModal] = useState(false);
  const [setupDatesModal, setSetupDatesModal] = useState(false);

  // Forms
  const [newPeriod, setNewPeriod] = useState({ name: '', start_date: '', end_date: '' });
  const [newTeacher, setNewTeacher] = useState({ name: '', email: '', password: '', phone: '', course_id: 0 });
  const [newStudent, setNewStudent] = useState({ name: '', age: '', sex: 'M' as 'M'|'F', is_baptized: false, phone: '' });
  const [attendanceList, setAttendanceList] = useState<any[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pData, tData] = await Promise.all([
        educationService.getPeriods(),
        educationService.getTeachers()
      ]);
      
      const allPeriods = Array.isArray(pData) ? pData : [];
      const coursePeriods = allPeriods.filter(p => p.course_id === Number(id));
      setPeriods(coursePeriods);
      setTeachers(Array.isArray(tData) ? tData : []);

      if (period_id) {
        const currentP = allPeriods.find(p => p.id === Number(period_id));
        if (currentP) setSelectedPeriod(currentP);
        
        const sData = await educationService.getEnrolledStudents(Number(period_id));
        setStudents(sData);
      }
      
    } catch (error) {
      console.error("Error loading course details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [id, period_id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Handlers
  const handleAssignTeacher = async (teacherId: number) => {
    try {
      await educationService.assignTeacher(Number(id), teacherId);
      setTeacherModal(false);
      loadData();
    } catch (error) { alert("Error al asignar maestro"); }
  };

  const handleCreateTeacher = async () => {
    if (!newTeacher.name || !newTeacher.password) return;
    try {
      await educationService.createTeacher({ ...newTeacher, course_id: Number(id) });
      setCreateTeacherModal(false);
      loadData();
    } catch (error) { alert("Error al crear maestro"); }
  };

  const handleCreatePeriod = async () => {
    if (!newPeriod.name) return;
    try {
      await educationService.createPeriod({ ...newPeriod, course_id: Number(id) });
      setPeriodModal(false);
      loadData();
    } catch (error) { alert("Error al crear periodo"); }
  };

  const handleEnrollStudent = async () => {
    if (!newStudent.name) return;
    try {
      await educationService.enrollStudent(Number(period_id), {
        ...newStudent,
        age: newStudent.age ? Number(newStudent.age) : null
      });
      setEnrollModal(false);
      setNewStudent({ name: '', age: '', sex: 'M', is_baptized: false, phone: '' });
      loadData();
    } catch (error) { alert("Error al inscribir alumno"); }
  };

  const handleSetupDates = async () => {
    try {
      await educationService.setupPeriodDates(Number(period_id), {
        start_date: selectedPeriod?.start_date || undefined,
        end_date: selectedPeriod?.end_date || undefined,
      });
      setSetupDatesModal(false);
      loadData();
    } catch (error) { alert("Error al configurar fechas"); }
  };

  const openAttendance = async () => {
    const today = new Date().toISOString().split('T')[0];
    try {
      const existing = await educationService.getAttendance(Number(period_id), today);
      const list = students.map(s => {
        const record = (existing as any[]).find(r => r.enrollment?.student_id === s.id);
        return { student_id: s.id, name: s.name, is_present: record ? record.is_present : true };
      });
      setAttendanceList(list);
      setAttendanceModal(true);
    } catch (error) {
      setAttendanceList(students.map(s => ({ student_id: s.id, name: s.name, is_present: true })));
      setAttendanceModal(true);
    }
  };

  const handleSaveAttendance = async () => {
    const today = new Date().toISOString().split('T')[0];
    try {
      await educationService.saveAttendance(Number(period_id), today, attendanceList);
      setAttendanceModal(false);
      alert("Asistencia guardada correctamente");
    } catch (error) { alert("Error al guardar asistencia"); }
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

  const renderTeacherView = () => (
    <View style={s.content}>
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={[s.sectionTitle, { color: t.text }]}>Estado del Curso</Text>
        </View>
        <View style={[s.mainCard, { backgroundColor: t.card, borderColor: t.border }]}>
          <View style={[s.avatarLarge, { backgroundColor: t.accent + '20' }]}>
            <Ionicons name="calendar" size={30} color={t.accent} />
          </View>
          <View style={s.cardInfo}>
            <Text style={[s.cardTitle, { color: t.text }]}>
              {selectedPeriod?.start_date ? `Inició: ${selectedPeriod.start_date}` : "Curso no iniciado"}
            </Text>
            <Text style={[s.cardSub, { color: t.textSec }]}>
              {selectedPeriod?.end_date ? `Finaliza: ${selectedPeriod.end_date}` : "Fin no definido"}
            </Text>
            <TouchableOpacity style={[s.assignBtn, { backgroundColor: t.accent }]} onPress={() => setSetupDatesModal(true)}>
              <Text style={s.assignBtnText}>Ajustar Fechas</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={[s.sectionTitle, { color: t.text }]}>Lista de Alumnos ({students.length})</Text>
          <TouchableOpacity onPress={() => setEnrollModal(true)}>
            <Ionicons name="person-add" size={24} color={t.accent} />
          </TouchableOpacity>
        </View>
        {students.length === 0 ? (
          <TouchableOpacity style={[s.emptyBox, { borderColor: t.border, borderStyle: 'dashed' }]} onPress={() => setEnrollModal(true)}>
            <Text style={[s.emptyText, { color: t.textSec }]}>No hay alumnos inscritos.</Text>
            <Text style={{ color: t.accent, fontWeight: '700' }}>+ Inscribir Alumno</Text>
          </TouchableOpacity>
        ) : (
          <View style={s.studentList}>
            {students.map(student => (
              <View key={student.id} style={[s.studentCard, { backgroundColor: t.card, borderColor: t.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.studentName, { color: t.text }]}>{student.name}</Text>
                  <Text style={[s.studentInfo, { color: t.textSec }]}>{student.age} años • {student.phone}</Text>
                </View>
                <Ionicons name="call" size={20} color={t.accent} onPress={() => alert('Llamando...')} />
              </View>
            ))}
          </View>
        )}
      </View>

      <TouchableOpacity style={[s.largeActionBtn, { backgroundColor: t.accent }]} onPress={openAttendance}>
        <Ionicons name="checkbox-outline" size={24} color="#fff" />
        <Text style={s.largeActionBtnText}>Pasar Asistencia Hoy</Text>
      </TouchableOpacity>
    </View>
  );

  const renderAdminView = () => (
    <View style={s.content}>
      <View style={s.section}>
        <Text style={[s.sectionTitle, { color: t.text, marginBottom: 12 }]}>Maestro Titular</Text>
        <View style={[s.mainCard, { backgroundColor: t.card, borderColor: t.border }]}>
          <View style={[s.avatarLarge, { backgroundColor: t.accent + '20' }]}>
            <Ionicons name="person" size={30} color={t.accent} />
          </View>
          <View style={s.cardInfo}>
            <Text style={[s.cardTitle, { color: t.text }]}>
              {teachers.find(tr => tr.course_id === Number(id))?.name || "No asignado"}
            </Text>
            <TouchableOpacity style={[s.assignBtn, { backgroundColor: t.accent }]} onPress={() => setTeacherModal(true)}>
              <Text style={s.assignBtnText}>Cambiar / Asignar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={[s.sectionTitle, { color: t.text }]}>Periodos Escolares</Text>
          <TouchableOpacity onPress={() => setPeriodModal(true)}><Ionicons name="add-circle" size={24} color={t.accent} /></TouchableOpacity>
        </View>
        {periods.map(period => (
          <View key={period.id} style={[s.periodItem, { backgroundColor: t.card, borderColor: t.border, marginBottom: 8 }]}>
            <View style={s.periodInfo}>
              <Text style={[s.periodName, { color: t.text }]}>{period.name}</Text>
              <Text style={[s.periodDates, { color: t.textSec }]}>{period.start_date || 'Sin inicio'} • {period.end_date || 'Sin fin'}</Text>
            </View>
            <View style={[s.statusDot, { backgroundColor: period.status === 'active' ? '#10b981' : '#6b7280' }]} />
          </View>
        ))}
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return <View style={[s.container, { backgroundColor: t.bg, justifyContent: 'center' }]}><ActivityIndicator size="large" color={t.accent} /></View>;
  }

  return (
    <View style={[s.container, { backgroundColor: t.bg }]}>
      <View style={[s.header, { backgroundColor: t.accent }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <View style={s.headerContent}>
          <Text style={s.headerLabel}>{period_id ? `PERIODO: ${period_name}` : "GESTIÓN DE CURSO"}</Text>
          <Text style={s.headerTitle} numberOfLines={1}>{name}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.accent} />}>
        {period_id ? renderTeacherView() : renderAdminView()}
      </ScrollView>

      {/* MODALS */}
      {/* Setup Dates */}
      <Modal visible={setupDatesModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { backgroundColor: t.card }]}>
            <Text style={[s.modalTitle, { color: t.text }]}>Configurar Fechas</Text>
            <TextInput 
               placeholder="Fecha Inicio (YYYY-MM-DD)" 
               placeholderTextColor={t.textSec}
               style={[s.input, { backgroundColor: t.input, color: t.text }]}
               value={selectedPeriod?.start_date || ''}
               onChangeText={v => setSelectedPeriod(prev => prev ? {...prev, start_date: v} : null)}
            />
            <TextInput 
               placeholder="Fecha Fin (YYYY-MM-DD)" 
               placeholderTextColor={t.textSec}
               style={[s.input, { backgroundColor: t.input, color: t.text }]}
               value={selectedPeriod?.end_date || ''}
               onChangeText={v => setSelectedPeriod(prev => prev ? {...prev, end_date: v} : null)}
            />
            <View style={s.modalButtons}>
              <TouchableOpacity onPress={() => setSetupDatesModal(false)}><Text style={{ color: t.textSec }}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={[s.btnPri, { backgroundColor: t.accent }]} onPress={handleSetupDates}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Enroll Student */}
      <Modal visible={enrollModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <ScrollView contentContainerStyle={{ justifyContent: 'center', flexGrow: 1 }}>
            <View style={[s.modalContent, { backgroundColor: t.card }]}>
              <Text style={[s.modalTitle, { color: t.text }]}>Inscribir Alumno</Text>
              <TextInput placeholder="Nombre Completo" placeholderTextColor={t.textSec} style={[s.input, { backgroundColor: t.input, color: t.text }]} value={newStudent.name} onChangeText={v => setNewStudent({...newStudent, name: v})} />
              <TextInput placeholder="Edad" keyboardType="numeric" placeholderTextColor={t.textSec} style={[s.input, { backgroundColor: t.input, color: t.text }]} value={newStudent.age} onChangeText={v => setNewStudent({...newStudent, age: v})} />
              <TextInput placeholder="Teléfono" keyboardType="phone-pad" placeholderTextColor={t.textSec} style={[s.input, { backgroundColor: t.input, color: t.text }]} value={newStudent.phone} onChangeText={v => setNewStudent({...newStudent, phone: v})} />
              <View style={s.modalButtons}>
                <TouchableOpacity onPress={() => setEnrollModal(false)}><Text style={{ color: t.textSec }}>Cancelar</Text></TouchableOpacity>
                <TouchableOpacity style={[s.btnPri, { backgroundColor: t.accent }]} onPress={handleEnrollStudent}><Text style={{ color: '#fff', fontWeight: '700' }}>Inscribir</Text></TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Attendance Modal */}
      <Modal visible={attendanceModal} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { backgroundColor: t.card, height: '80%' }]}>
            <Text style={[s.modalTitle, { color: t.text }]}>Asistencia Hoy</Text>
            <FlatList
              data={attendanceList}
              keyExtractor={item => item.student_id.toString()}
              renderItem={({ item, index }) => (
                <TouchableOpacity 
                  style={[s.attendanceItem, { borderBottomColor: t.border }]}
                  onPress={() => {
                    const newList = [...attendanceList];
                    newList[index].is_present = !newList[index].is_present;
                    setAttendanceList(newList);
                  }}
                >
                  <Text style={[s.studentName, { color: t.text, flex: 1 }]}>{item.name}</Text>
                  <Ionicons 
                    name={item.is_present ? "checkmark-circle" : "close-circle"} 
                    size={28} 
                    color={item.is_present ? "#10b981" : "#ef4444"} 
                  />
                </TouchableOpacity>
              )}
            />
            <View style={s.modalButtons}>
              <TouchableOpacity onPress={() => setAttendanceModal(false)}><Text style={{ color: t.textSec }}>Cerrar</Text></TouchableOpacity>
              <TouchableOpacity style={[s.btnPri, { backgroundColor: t.accent }]} onPress={handleSaveAttendance}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Guardar Asistencia</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Admin Modals (Minimal) */}
      <Modal visible={periodModal} transparent><View style={s.modalOverlay}><View style={[s.modalContent, { backgroundColor: t.card }]}><TextInput placeholder="Nombre Periodo" style={s.input} value={newPeriod.name} onChangeText={v => setNewPeriod({...newPeriod, name: v})} /><TouchableOpacity onPress={handleCreatePeriod}><Text>Crear</Text></TouchableOpacity><TouchableOpacity onPress={()=>setPeriodModal(false)}><Text>Cerrar</Text></TouchableOpacity></View></View></Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" },
  headerContent: { alignItems: "center", flex: 1 },
  headerLabel: { fontSize: 10, fontWeight: "700", color: "rgba(255,255,255,0.7)" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },
  content: { padding: 20 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: "800" },
  mainCard: { padding: 16, borderRadius: 20, borderWidth: 1, flexDirection: "row", alignItems: "center" },
  avatarLarge: { width: 50, height: 50, borderRadius: 25, justifyContent: "center", alignItems: "center", marginRight: 12 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: "700" },
  cardSub: { fontSize: 12, marginTop: 2 },
  assignBtn: { marginTop: 8, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, alignSelf: 'flex-start' },
  assignBtnText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  studentList: { gap: 8 },
  studentCard: { padding: 12, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center' },
  studentName: { fontSize: 14, fontWeight: "600" },
  studentInfo: { fontSize: 11 },
  emptyBox: { padding: 20, borderRadius: 16, borderWidth: 1, alignItems: 'center' },
  emptyText: { fontSize: 13, marginBottom: 4 },
  largeActionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 16, gap: 10, marginTop: 10 },
  largeActionBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: 'center', padding: 20 },
  modalContent: { padding: 20, borderRadius: 20, gap: 12 },
  modalTitle: { fontSize: 18, fontWeight: "800", marginBottom: 10 },
  input: { padding: 12, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 15, marginTop: 10 },
  btnPri: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
  attendanceItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  periodItem: { padding: 12, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center' },
  periodInfo: { flex: 1 },
  periodName: { fontSize: 14, fontWeight: "700" },
  periodDates: { fontSize: 11 },
  statusDot: { width: 6, height: 6, borderRadius: 3 }
});
