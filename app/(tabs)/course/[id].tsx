import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, useColorScheme, Modal, TextInput, FlatList, Switch, Alert, Platform
} from "react-native";
import DateTimePicker from '@react-native-community/datetimepicker';
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
  const [attendanceModal, setAttendanceModal] = useState(false);
  const [setupDatesModal, setSetupDatesModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState<{show: boolean, type: 'start' | 'end', target: 'existing' | 'new'}>({show: false, type: 'start', target: 'existing'});
  const [availableTopics, setAvailableTopics] = useState<any[]>([]);
  const [courseTopics, setCourseTopics] = useState<any[]>([]);

  // Forms
  const [newPeriod, setNewPeriod] = useState({ name: '', start_date: '', end_date: '' });
  const [newTeacher, setNewTeacher] = useState({ name: '', email: '', password: '', phone: '', course_id: 0 });
  const [attendanceList, setAttendanceList] = useState<any[]>([]);
  const [sessionInfo, setSessionInfo] = useState({ topic_id: undefined as number | undefined, topic_number: '', topic_name: '', comments: '' });

  const loadData = async () => {
    try {
      setLoading(true);
      const [pData, tData, topicsData] = await Promise.all([
        educationService.getPeriods(),
        educationService.getTeachers(),
        educationService.getCourseTopics(Number(id))
      ]);
      
      const allPeriods = Array.isArray(pData) ? pData : [];
      const coursePeriods = allPeriods.filter(p => p.course_id === Number(id));
      setPeriods(coursePeriods);
      setTeachers(Array.isArray(tData) ? tData : []);
      setCourseTopics(Array.isArray(topicsData) ? topicsData : []);

      if (period_id) {
        const currentP = allPeriods.find(p => p.id === Number(period_id));
        if (currentP) setSelectedPeriod(currentP);
        
        const [sData, aTopics] = await Promise.all([
          educationService.getEnrolledStudents(Number(period_id)),
          educationService.getAvailableTopics(Number(period_id))
        ]);
        setStudents(sData);
        setAvailableTopics(aTopics);
      }
      
    } catch (error) {
      console.error("Error loading course details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [id, period_id]);

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(prev => ({ ...prev, show: false }));
    if (selectedDate) {
      const dateStr = selectedDate.toISOString().split('T')[0];
      if (showDatePicker.target === 'new') {
        if (showDatePicker.type === 'start') {
          const endDate = new Date(selectedDate);
          endDate.setDate(endDate.getDate() + 112);
          setNewPeriod(prev => ({ ...prev, start_date: dateStr, end_date: endDate.toISOString().split('T')[0] }));
        } else {
          setNewPeriod(prev => ({ ...prev, end_date: dateStr }));
        }
      } else if (selectedPeriod) {
        if (showDatePicker.type === 'start') {
          const endDate = new Date(selectedDate);
          endDate.setDate(endDate.getDate() + 112);
          setSelectedPeriod({ ...selectedPeriod, start_date: dateStr, end_date: endDate.toISOString().split('T')[0] });
        } else {
          setSelectedPeriod({ ...selectedPeriod, end_date: dateStr });
        }
      }
    }
  };

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

  // Remove handleEnrollStudent as it's now admin-only

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

  const openAttendance = async (specificTopic?: any) => {
    const today = new Date().toISOString().split('T')[0];
    try {
      setLoading(true);
      const [response, topics] = await Promise.all([
        educationService.getAttendance(Number(period_id), today),
        educationService.getAvailableTopics(Number(period_id))
      ]);
      
      setAvailableTopics(topics);
      const { session, attendances } = response as any;
      
      if (specificTopic) {
        setSessionInfo({
          topic_id: specificTopic.id,
          topic_number: specificTopic.topic_number?.toString() || '',
          topic_name: specificTopic.topic_name || '',
          comments: session?.comments || '',
        });
      } else if (session) {
        setSessionInfo({
          topic_id: session.topic_id || undefined,
          topic_number: session.topic_number || '',
          topic_name: session.topic_name || '',
          comments: session.comments || '',
        });
      } else {
        setSessionInfo({ topic_id: undefined, topic_number: '', topic_name: '', comments: '' });
      }

      const list = students.map(s => {
        const record = (attendances as any[]).find(r => r.enrollment?.student_id === s.id);
        return { student_id: s.id, name: s.name, is_present: record ? record.is_present : true };
      });
      setAttendanceList(list);
      setAttendanceModal(true);
    } catch (error) {
      console.error("Error opening attendance:", error);
      if (specificTopic) {
        setSessionInfo({
          topic_id: specificTopic.id,
          topic_number: specificTopic.topic_number?.toString() || '',
          topic_name: specificTopic.topic_name || '',
          comments: '',
        });
      } else {
        setSessionInfo({ topic_id: undefined, topic_number: '', topic_name: '', comments: '' });
      }
      setAttendanceList(students.map(s => ({ student_id: s.id, name: s.name, is_present: true })));
      setAttendanceModal(true);
    } finally {
      setLoading(false);
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

  const handleDeleteEnrollment = async (enrollmentId: number, studentName: string) => {
    const msg = `¿Estás seguro de que deseas eliminar la inscripción de ${studentName}? Esto no borrará al alumno del sistema, solo de este curso.`;
    
    if (Platform.OS === 'web') {
      if (window.confirm(msg)) {
        await executeDeleteEnrollment(enrollmentId);
      }
      return;
    }

    Alert.alert(
      "Eliminar Inscripción",
      msg,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive",
          onPress: () => executeDeleteEnrollment(enrollmentId)
        }
      ]
    );
  };

  const executeDeleteEnrollment = async (enrollmentId: number) => {
    try {
      await educationService.deleteEnrollment(enrollmentId);
      if (selectedPeriod) {
        const sData = await educationService.getEnrolledStudents(selectedPeriod.id);
        setStudents(sData);
      }
    } catch (error) {
      const errorMsg = "No se pudo eliminar la inscripción.";
      if (Platform.OS === 'web') alert(errorMsg);
      else Alert.alert("Error", errorMsg);
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
          <Text style={[s.sectionTitle, { color: t.text }]}>Temario del Periodo</Text>
          <Text style={{ fontSize: 12, color: t.textSec }}>Toca un tema para pasar lista</Text>
        </View>
        <View style={{ marginBottom: 10 }}>
          {availableTopics.map((topic, idx) => (
            <TouchableOpacity 
              key={topic.id} 
              onPress={() => openAttendance(topic)}
              style={[
                s.topicIndicator, 
                { 
                  backgroundColor: topic.is_given ? '#10b98120' : '#ef444420',
                  borderColor: topic.is_given ? '#10b981' : '#ef4444'
                }
              ]}
            >
              <View style={[s.topicCircle, { backgroundColor: topic.is_given ? '#10b981' : '#ef4444' }]}>
                <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>{topic.topic_number}</Text>
              </View>
              <Text style={[s.topicNameMini, { color: t.text }]} numberOfLines={1}>{topic.topic_name}</Text>
              <Ionicons 
                name={topic.is_given ? "checkmark-circle" : "time-outline"} 
                size={14} 
                color={topic.is_given ? '#10b981' : '#ef4444'} 
                style={{ marginLeft: 4 }}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={[s.sectionTitle, { color: t.text }]}>Lista de Alumnos ({students.length})</Text>
        </View>
        {students.length === 0 ? (
          <View style={[s.emptyBox, { borderColor: t.border, borderStyle: 'dashed' }]}>
            <Text style={[s.emptyText, { color: t.textSec }]}>No hay alumnos inscritos en este periodo.</Text>
            <Text style={{ color: t.textSec, fontSize: 11 }}>El administrador gestiona las inscripciones.</Text>
          </View>
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
          <Text style={[s.sectionTitle, { color: t.text }]}>Contenido del Curso</Text>
        </View>
        <TouchableOpacity 
          style={[s.adminActionBtn, { backgroundColor: t.card, borderColor: t.border }]}
          onPress={() => router.push({
            pathname: "/course/[id]/topics",
            params: { id, name, color: t.accent }
          })}
        >
          <View style={[s.avatar, { backgroundColor: t.accent + '20' }]}>
            <Ionicons name="list" size={24} color={t.accent} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[s.adminActionTitle, { color: t.text }]}>Gestionar Temario</Text>
            <Text style={[s.adminActionSub, { color: t.textSec }]}>Pre-definir lecciones y temas</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={t.textSec} />
        </TouchableOpacity>

        {courseTopics.length > 0 && (
          <View style={{ marginTop: 10, paddingLeft: 5 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
              {courseTopics.slice(0, 8).map(topic => (
                <View key={topic.id} style={[s.topicChipPreview, { backgroundColor: t.input, borderColor: t.border }]}>
                  <Text style={{ color: t.textSec, fontSize: 10, fontWeight: '700' }}>L{topic.topic_number}</Text>
                </View>
              ))}
              {courseTopics.length > 8 && (
                <View style={[s.topicChipPreview, { backgroundColor: 'transparent', borderColor: 'transparent', justifyContent: 'center' }]}>
                  <Text style={{ color: t.textSec, fontSize: 10, fontWeight: '700' }}>+{courseTopics.length - 8}</Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </View>

      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={[s.sectionTitle, { color: t.text }]}>Periodos / Cursos Activos</Text>
          <TouchableOpacity onPress={() => setPeriodModal(true)}><Ionicons name="add-circle" size={24} color={t.accent} /></TouchableOpacity>
        </View>
        {periods.map(period => {
          const isSelected = selectedPeriod?.id === period.id;
          return (
            <View key={period.id} style={{ marginBottom: 12 }}>
              <TouchableOpacity 
                style={[s.periodItem, { backgroundColor: t.card, borderColor: isSelected ? t.accent : t.border }]}
                onPress={async () => {
                  if (isSelected) {
                    setSelectedPeriod(null);
                    setStudents([]);
                  } else {
                    setSelectedPeriod(period);
                    const sData = await educationService.getEnrolledStudents(period.id);
                    setStudents(sData);
                  }
                }}
              >
                <View style={s.periodInfo}>
                  <Text style={[s.periodName, { color: t.text }]}>{period.name}</Text>
                  <Text style={[s.periodDates, { color: t.textSec }]}>{period.start_date || 'Sin inicio'} • {period.end_date || 'Sin fin'}</Text>
                </View>
                <TouchableOpacity 
                  style={[s.miniEnrollBtn, { backgroundColor: t.accent + '15' }]}
                  onPress={() => router.push({
                    pathname: "/enrollment",
                    params: { period_id: period.id, period_name: period.name }
                  })}
                >
                  <Ionicons name="person-add" size={16} color={t.accent} />
                  <Text style={[s.miniEnrollText, { color: t.accent }]}>Inscribir</Text>
                </TouchableOpacity>
                <View style={[s.statusDot, { backgroundColor: period.status === 'active' ? '#10b981' : '#6b7280', marginLeft: 10 }]} />
              </TouchableOpacity>

              {isSelected && (
                <View style={[s.enrolledList, { backgroundColor: t.card + '50', borderBottomLeftRadius: 15, borderBottomRightRadius: 15, borderLeftWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderColor: t.border }]}>
                  <Text style={[s.enrolledTitle, { color: t.textSec }]}>Alumnos Inscritos:</Text>
                  {students.length === 0 ? (
                    <Text style={{ color: t.textSec, fontSize: 12, fontStyle: 'italic', padding: 10 }}>No hay alumnos inscritos aún.</Text>
                  ) : (
                    students.map(student => (
                      <View key={student.id} style={s.enrolledItem}>
                        <Ionicons name="person" size={14} color={t.textSec} />
                        <Text style={[s.enrolledName, { color: t.text }]}>{student.name}</Text>
                        {student.requested_book && (
                          <View style={[s.bookBadge, { backgroundColor: student.is_book_paid ? '#10b98120' : '#f59e0b20' }]}>
                            <Ionicons name="book" size={10} color={student.is_book_paid ? '#10b981' : '#f59e0b'} />
                            <Text style={[s.bookBadgeText, { color: student.is_book_paid ? '#10b981' : '#f59e0b' }]}>
                              {student.is_book_paid ? 'Pagado' : 'Pendiente'}
                            </Text>
                          </View>
                        )}
                        <TouchableOpacity 
                          onPress={() => student.enrollment_id && handleDeleteEnrollment(student.enrollment_id, student.name)}
                          style={{ padding: 4 }}
                        >
                          <Ionicons name="trash-outline" size={18} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    ))
                  )}
                </View>
              )}
            </View>
          );
        })}
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
            
            {Platform.OS === 'web' ? (
              <View style={{ gap: 10 }}>
                <View style={[s.input, { backgroundColor: t.input, padding: 0 }]}>
                  <input
                    type="date"
                    value={selectedPeriod?.start_date || ''}
                    onChange={(e) => {
                      const d = e.target.value;
                      if (d) {
                        const start = new Date(d + 'T12:00:00');
                        start.setDate(start.getDate() + 112);
                        const endStr = start.toISOString().split('T')[0];
                        setSelectedPeriod(prev => prev ? {...prev, start_date: d, end_date: endStr} : null);
                      } else {
                        setSelectedPeriod(prev => prev ? {...prev, start_date: d} : null);
                      }
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: t.text,
                      padding: '12px',
                      width: '100%',
                      outline: 'none',
                      fontSize: '14px'
                    }}
                  />
                </View>
                <View style={[s.input, { backgroundColor: t.input, padding: 0 }]}>
                  <input
                    type="date"
                    value={selectedPeriod?.end_date || ''}
                    onChange={(e) => setSelectedPeriod(prev => prev ? {...prev, end_date: e.target.value} : null)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: t.text,
                      padding: '12px',
                      width: '100%',
                      outline: 'none',
                      fontSize: '14px'
                    }}
                  />
                </View>
              </View>
            ) : (
              <>
                <TouchableOpacity 
                  onPress={() => setShowDatePicker({ show: true, type: 'start', target: 'existing' })}
                  style={[s.input, { backgroundColor: t.input, justifyContent: 'center' }]}
                >
                  <Text style={{ color: selectedPeriod?.start_date ? t.text : t.textSec }}>
                    {selectedPeriod?.start_date || 'Fecha Inicio (YYYY-MM-DD)'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => setShowDatePicker({ show: true, type: 'end', target: 'existing' })}
                  style={[s.input, { backgroundColor: t.input, justifyContent: 'center' }]}
                >
                  <Text style={{ color: selectedPeriod?.end_date ? t.text : t.textSec }}>
                    {selectedPeriod?.end_date || 'Fecha Fin (YYYY-MM-DD)'}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {Platform.OS !== 'web' && showDatePicker.show && (
              <DateTimePicker
                value={
                  showDatePicker.target === 'new'
                    ? (showDatePicker.type === 'start' && newPeriod.start_date ? new Date(newPeriod.start_date + 'T12:00:00') : (showDatePicker.type === 'end' && newPeriod.end_date ? new Date(newPeriod.end_date + 'T12:00:00') : new Date()))
                    : (showDatePicker.type === 'start' && selectedPeriod?.start_date ? new Date(selectedPeriod.start_date + 'T12:00:00') : (showDatePicker.type === 'end' && selectedPeriod?.end_date ? new Date(selectedPeriod.end_date + 'T12:00:00') : new Date()))
                }
                mode="date"
                display="default"
                onChange={onDateChange}
              />
            )}

            <View style={s.modalButtons}>
              <TouchableOpacity onPress={() => setSetupDatesModal(false)}><Text style={{ color: t.textSec }}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={[s.btnPri, { backgroundColor: t.accent }]} onPress={handleSetupDates}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>


      {/* Attendance Modal */}
      <Modal visible={attendanceModal} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { backgroundColor: t.card, maxHeight: '90%', width: '95%', paddingBottom: 10 }]}>
            <View style={s.modalHeader}>
              <Text style={[s.modalTitle, { color: t.text }]}>Sesión de Clase</Text>
              <Text style={{ color: t.accent, fontSize: 12, fontWeight: '700' }}>HOY: {new Date().toLocaleDateString()}</Text>
            </View>

            <View style={{ marginBottom: 15 }}>
              <View style={[s.topicIndicator, { backgroundColor: t.accent + '15', borderColor: t.accent, marginBottom: 12 }]}>
                <View style={[s.topicCircle, { backgroundColor: t.accent }]}>
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>{sessionInfo.topic_number}</Text>
                </View>
                <Text style={[s.topicNameMini, { color: t.text, fontSize: 14 }]} numberOfLines={1}>
                  {sessionInfo.topic_name}
                </Text>
                <Ionicons name="book" size={16} color={t.accent} style={{ marginLeft: 6 }} />
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
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={false}
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
            <Text style={[s.modalTitle, { color: t.text }]}>Nuevo Periodo / Curso</Text>
            <TextInput 
              placeholder="Nombre del Periodo (Ejem: Mayo 2026)" 
              placeholderTextColor={t.textSec}
              style={[s.input, { backgroundColor: t.input, color: t.text }]} 
              value={newPeriod.name} 
              onChangeText={v => setNewPeriod({...newPeriod, name: v})} 
            />
            {Platform.OS === 'web' ? (
              <View style={{ gap: 10 }}>
                <View style={[s.input, { backgroundColor: t.input, padding: 0 }]}>
                  <input
                    type="date"
                    value={newPeriod.start_date || ''}
                    onChange={(e) => {
                      const d = e.target.value;
                      if (d) {
                        const start = new Date(d + 'T12:00:00');
                        start.setDate(start.getDate() + 112);
                        const endStr = start.toISOString().split('T')[0];
                        setNewPeriod(prev => ({...prev, start_date: d, end_date: endStr}));
                      } else {
                        setNewPeriod(prev => ({...prev, start_date: d}));
                      }
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: t.text,
                      padding: '12px',
                      width: '100%',
                      outline: 'none',
                      fontSize: '14px'
                    }}
                  />
                </View>
                <View style={[s.input, { backgroundColor: t.input, padding: 0 }]}>
                  <input
                    type="date"
                    value={newPeriod.end_date || ''}
                    onChange={(e) => setNewPeriod(prev => ({...prev, end_date: e.target.value}))}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: t.text,
                      padding: '12px',
                      width: '100%',
                      outline: 'none',
                      fontSize: '14px'
                    }}
                  />
                </View>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                <TouchableOpacity 
                  onPress={() => setShowDatePicker({ show: true, type: 'start', target: 'new' })}
                  style={[s.input, { backgroundColor: t.input, justifyContent: 'center' }]}
                >
                  <Text style={{ color: newPeriod.start_date ? t.text : t.textSec }}>
                    {newPeriod.start_date || 'Inicio (AAAA-MM-DD)'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => setShowDatePicker({ show: true, type: 'end', target: 'new' })}
                  style={[s.input, { backgroundColor: t.input, justifyContent: 'center' }]}
                >
                  <Text style={{ color: newPeriod.end_date ? t.text : t.textSec }}>
                    {newPeriod.end_date || 'Fin (AAAA-MM-DD)'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            <View style={s.modalButtons}>
              <TouchableOpacity onPress={() => setPeriodModal(false)}><Text style={{ color: t.textSec }}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={[s.btnPri, { backgroundColor: t.accent }]} onPress={handleCreatePeriod}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Crear</Text>
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
  topicChip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, marginRight: 8, maxWidth: 220 },
  adminActionBtn: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, borderWidth: 1, marginTop: 10 },
  adminActionTitle: { fontSize: 16, fontWeight: '800' },
  adminActionSub: { fontSize: 12, marginTop: 2 },
  miniEnrollBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12, gap: 4 },
  miniEnrollText: { fontSize: 12, fontWeight: '700' },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  enrolledList: { padding: 12, borderBottomLeftRadius: 15, borderBottomRightRadius: 15 },
  enrolledTitle: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 },
  enrolledItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 10, gap: 8 },
  enrolledName: { fontSize: 14, flex: 1 },
  bookBadge: { flexDirection: 'row', alignItems: 'center', paddingVertical: 2, paddingHorizontal: 6, borderRadius: 6, gap: 4 },
  bookBadgeText: { fontSize: 9, fontWeight: '800' },
  topicChipPreview: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 10, borderWidth: 1, marginRight: 6 },
  topicIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 15,
    borderWidth: 1,
    marginBottom: 8,
    width: '100%',
  },
  topicCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  topicNameMini: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
});
