import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, useColorScheme, Modal, TextInput, FlatList, Switch
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
  const [newStudent, setNewStudent] = useState({ name: '', age: '', sex: 'M' as 'M'|'F', is_baptized: false, requested_book: false, phone: '' });
  const [attendanceList, setAttendanceList] = useState<any[]>([]);
  const [sessionInfo, setSessionInfo] = useState({ topic_number: '', topic_name: '', comments: '' });

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
    if (!newTeacher.name || !newTeacher.password) {
      alert("Nombre y contraseña son obligatorios");
      return;
    }
    try {
      await educationService.createTeacher({ 
        ...newTeacher, 
        course_id: Number(id),
        email: newTeacher.email || undefined,
        phone: newTeacher.phone || undefined,
      });
      setCreateTeacherModal(false);
      setNewTeacher({ name: '', email: '', password: '', phone: '', course_id: 0 });
      loadData();
    } catch (error) { alert("Error al crear maestro"); }
  };

  const handleCreatePeriod = async () => {
    if (!newPeriod.name) {
      alert("El nombre del periodo es obligatorio");
      return;
    }
    try {
      await educationService.createPeriod({ 
        ...newPeriod, 
        course_id: Number(id),
        start_date: newPeriod.start_date || undefined,
        end_date: newPeriod.end_date || undefined,
      });
      setPeriodModal(false);
      setNewPeriod({ name: '', start_date: '', end_date: '' });
      loadData();
    } catch (error) { 
      console.error("Error creating period:", error);
      alert("Error al crear periodo. Verifica las fechas (YYYY-MM-DD)."); 
    }
  };

  const handleEnrollStudent = async () => {
    if (!newStudent.name) return;
    try {
      await educationService.enrollStudent(Number(period_id), {
        ...newStudent,
        age: newStudent.age ? Number(newStudent.age) : null
      });
      setEnrollModal(false);
      setNewStudent({ name: '', age: '', sex: 'M', is_baptized: false, requested_book: false, phone: '' });
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
      const response = await educationService.getAttendance(Number(period_id), today);
      const { session, attendances } = response as any;
      
      if (session) {
        setSessionInfo({
          topic_number: session.topic_number || '',
          topic_name: session.topic_name || '',
          comments: session.comments || '',
        });
      } else {
        setSessionInfo({ topic_number: '', topic_name: '', comments: '' });
      }

      const list = students.map(s => {
        const record = (attendances as any[]).find(r => r.enrollment?.student_id === s.id);
        return { student_id: s.id, name: s.name, is_present: record ? record.is_present : true };
      });
      setAttendanceList(list);
      setAttendanceModal(true);
    } catch (error) {
      setSessionInfo({ topic_number: '', topic_name: '', comments: '' });
      setAttendanceList(students.map(s => ({ student_id: s.id, name: s.name, is_present: true })));
      setAttendanceModal(true);
    }
  };

  const handleSaveAttendance = async () => {
    const today = new Date().toISOString().split('T')[0];
    try {
      await educationService.saveAttendance(Number(period_id), today, attendanceList, sessionInfo);
      setAttendanceModal(false);
      alert("Asistencia y bitácora guardadas correctamente");
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
                  <Text style={[s.studentInfo, { color: t.textSec }]}>
                    {student.age} años • {student.phone}
                  </Text>
                  <Text style={[s.studentInfo, { color: t.accent, fontSize: 10, fontWeight: '700' }]}>
                    {student.is_baptized ? 'BAUTIZADO' : 'NO BAUTIZADO'} • {student.requested_book ? 'LIBRO: SÍ' : 'LIBRO: NO'}
                  </Text>
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
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={[s.assignBtn, { flex: 1, backgroundColor: t.accent }]} onPress={() => setTeacherModal(true)}>
                <Text style={s.assignBtnText}>Asignar Existente</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.assignBtn, { flex: 1, backgroundColor: t.accent }]} onPress={() => setCreateTeacherModal(true)}>
                <Text style={s.assignBtnText}>Crear Nuevo</Text>
              </TouchableOpacity>
            </View>
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
              
              <View style={s.switchRow}>
                <Text style={{ color: t.text, fontWeight: '600' }}>¿Es bautizado?</Text>
                <Switch 
                  value={newStudent.is_baptized} 
                  onValueChange={v => setNewStudent({...newStudent, is_baptized: v})} 
                  trackColor={{ true: t.accent }} 
                />
              </View>

              <View style={s.switchRow}>
                <Text style={{ color: t.text, fontWeight: '600' }}>¿Solicitó libro?</Text>
                <Switch 
                  value={newStudent.requested_book} 
                  onValueChange={v => setNewStudent({...newStudent, requested_book: v})} 
                  trackColor={{ true: t.accent }} 
                />
              </View>
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
          <View style={[s.modalContent, { backgroundColor: t.card, height: '90%' }]}>
            <View style={s.modalHeader}>
              <Text style={[s.modalTitle, { color: t.text }]}>Sesión de Clase</Text>
              <Text style={{ color: t.accent, fontSize: 12, fontWeight: '700' }}>HOY: {new Date().toLocaleDateString()}</Text>
            </View>

            <View style={{ gap: 10, marginBottom: 15 }}>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TextInput 
                  placeholder="# Tema" 
                  placeholderTextColor={t.textSec}
                  style={[s.input, { flex: 1, backgroundColor: t.input, color: t.text }]} 
                  value={sessionInfo.topic_number} 
                  onChangeText={v => setSessionInfo({...sessionInfo, topic_number: v})} 
                />
                <TextInput 
                  placeholder="Nombre del Tema" 
                  placeholderTextColor={t.textSec}
                  style={[s.input, { flex: 3, backgroundColor: t.input, color: t.text }]} 
                  value={sessionInfo.topic_name} 
                  onChangeText={v => setSessionInfo({...sessionInfo, topic_name: v})} 
                />
              </View>
              <TextInput 
                placeholder="Comentarios (Tarea, observaciones...)" 
                placeholderTextColor={t.textSec}
                multiline 
                numberOfLines={3}
                style={[s.input, { backgroundColor: t.input, color: t.text, height: 80, textAlignVertical: 'top' }]} 
                value={sessionInfo.comments} 
                onChangeText={v => setSessionInfo({...sessionInfo, comments: v})} 
              />
            </View>

            <Text style={{ fontSize: 14, fontWeight: '700', color: t.textSec, marginBottom: 10 }}>LISTA DE ASISTENCIA</Text>
            
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
                <Text style={{ color: '#fff', fontWeight: '700' }}>Guardar Todo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Create Period Modal */}
      <Modal visible={periodModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { backgroundColor: t.card }]}>
            <Text style={[s.modalTitle, { color: t.text }]}>Nuevo Periodo</Text>
            <TextInput 
              placeholder="Nombre del Periodo (Ejem: Ciclo 2026-A)" 
              placeholderTextColor={t.textSec}
              style={[s.input, { backgroundColor: t.input, color: t.text }]} 
              value={newPeriod.name} 
              onChangeText={v => setNewPeriod({...newPeriod, name: v})} 
            />
            <TextInput 
              placeholder="Fecha Inicio (YYYY-MM-DD) - Opcional" 
              placeholderTextColor={t.textSec}
              style={[s.input, { backgroundColor: t.input, color: t.text }]} 
              value={newPeriod.start_date} 
              onChangeText={v => setNewPeriod({...newPeriod, start_date: v})} 
            />
            <TextInput 
              placeholder="Fecha Fin (YYYY-MM-DD) - Opcional" 
              placeholderTextColor={t.textSec}
              style={[s.input, { backgroundColor: t.input, color: t.text }]} 
              value={newPeriod.end_date} 
              onChangeText={v => setNewPeriod({...newPeriod, end_date: v})} 
            />
            <View style={s.modalButtons}>
              <TouchableOpacity onPress={() => setPeriodModal(false)}><Text style={{ color: t.textSec }}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={[s.btnPri, { backgroundColor: t.accent }]} onPress={handleCreatePeriod}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Crear Periodo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Teacher Assignment Modal */}
      <Modal visible={teacherModal} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { backgroundColor: t.card, height: '70%' }]}>
            <Text style={[s.modalTitle, { color: t.text }]}>Asignar Maestro</Text>
            <FlatList
              data={teachers}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[s.attendanceItem, { borderBottomColor: t.border }]}
                  onPress={() => handleAssignTeacher(item.id)}
                >
                  <View>
                    <Text style={[s.studentName, { color: t.text }]}>{item.name}</Text>
                    <Text style={{ color: t.textSec, fontSize: 12 }}>{item.email || 'Sin correo'}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={t.accent} />
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={{ color: t.textSec, textAlign: 'center', marginTop: 20 }}>No hay maestros registrados</Text>}
            />
            <TouchableOpacity style={s.modalButtons} onPress={() => setTeacherModal(false)}>
              <Text style={{ color: t.accent, fontWeight: '700', textAlign: 'center', width: '100%' }}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Create Teacher Modal */}
      <Modal visible={createTeacherModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <ScrollView contentContainerStyle={{ justifyContent: 'center', flexGrow: 1 }}>
            <View style={[s.modalContent, { backgroundColor: t.card }]}>
              <Text style={[s.modalTitle, { color: t.text }]}>Nuevo Maestro</Text>
              <TextInput 
                placeholder="Nombre Completo" 
                placeholderTextColor={t.textSec}
                style={[s.input, { backgroundColor: t.input, color: t.text }]} 
                value={newTeacher.name} 
                onChangeText={v => setNewTeacher({...newTeacher, name: v})} 
              />
              <TextInput 
                placeholder="Correo Electrónico" 
                placeholderTextColor={t.textSec}
                keyboardType="email-address"
                style={[s.input, { backgroundColor: t.input, color: t.text }]} 
                value={newTeacher.email} 
                onChangeText={v => setNewTeacher({...newTeacher, email: v})} 
              />
              <TextInput 
                placeholder="Contraseña para el maestro" 
                placeholderTextColor={t.textSec}
                secureTextEntry
                style={[s.input, { backgroundColor: t.input, color: t.text }]} 
                value={newTeacher.password} 
                onChangeText={v => setNewTeacher({...newTeacher, password: v})} 
              />
              <TextInput 
                placeholder="Teléfono (Opcional)" 
                placeholderTextColor={t.textSec}
                keyboardType="phone-pad"
                style={[s.input, { backgroundColor: t.input, color: t.text }]} 
                value={newTeacher.phone} 
                onChangeText={v => setNewTeacher({...newTeacher, phone: v})} 
              />
              <View style={s.modalButtons}>
                <TouchableOpacity onPress={() => setCreateTeacherModal(false)}><Text style={{ color: t.textSec }}>Cancelar</Text></TouchableOpacity>
                <TouchableOpacity style={[s.btnPri, { backgroundColor: t.accent }]} onPress={handleCreateTeacher}>
                  <Text style={{ color: '#fff', fontWeight: '700' }}>Crear y Asignar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
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
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 18, fontWeight: "800", marginBottom: 10 },
  input: { padding: 12, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 15, marginTop: 10 },
  btnPri: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
  attendanceItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  periodItem: { padding: 12, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center' },
  periodInfo: { flex: 1 },
  periodName: { fontSize: 14, fontWeight: "700" },
  periodDates: { fontSize: 11 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
});
