import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, useColorScheme, Modal, TextInput, FlatList, Switch, Alert, Platform
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { educationService, Student, SchoolPeriod } from "@/src/modules/church-admin/services/education.service";

export default function EnrollmentScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const { period_id, period_name } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [periods, setPeriods] = useState<SchoolPeriod[]>([]);
  const [search, setSearch] = useState("");
  
  // Modals
  const [studentModal, setStudentModal] = useState(false);
  const [enrollModal, setEnrollModal] = useState(false);
  
  // Forms
  const [editingStudent, setEditingStudent] = useState<Partial<Student> | null>(null);
  const [enrollmentForm, setEnrollmentForm] = useState({ 
    student_id: 0, 
    period_id: period_id ? Number(period_id) : 0, 
    requested_book: false, 
    is_book_paid: false 
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [sData, pData] = await Promise.all([
        educationService.getStudents(),
        educationService.getPeriods()
      ]);
      setStudents(sData);
      setPeriods(pData.filter(p => p.status === 'active'));
    } catch (error) {
      console.error("Error loading enrollment data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSaveStudent = async () => {
    if (!editingStudent?.name) return;
    try {
      if (editingStudent.id) {
        await educationService.updateStudent(editingStudent.id, editingStudent);
      } else {
        await educationService.createStudent(editingStudent);
      }
      setStudentModal(false);
      loadData();
    } catch (error) { alert("Error al guardar alumno"); }
  };

  const handleEnroll = async () => {
    if (!enrollmentForm.student_id || !enrollmentForm.period_id) {
        alert("Selecciona un periodo");
        return;
    }
    try {
      await educationService.createEnrollment(enrollmentForm);
      setEnrollModal(false);
      alert("Alumno inscrito correctamente");
      loadData();
    } catch (error) { alert("Error al inscribir (Posiblemente ya inscrito)"); }
  };

  const handleDeleteStudent = async (studentId: number, studentName: string) => {
    const msg = `¿Estás seguro de que deseas eliminar a ${studentName}? Esto borrará permanentemente al alumno y todas sus inscripciones.`;
    
    if (Platform.OS === 'web') {
      if (window.confirm(msg)) {
        await executeDeleteStudent(studentId);
      }
      return;
    }

    Alert.alert(
      "Eliminar Alumno",
      msg,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive",
          onPress: () => executeDeleteStudent(studentId)
        }
      ]
    );
  };

  const executeDeleteStudent = async (studentId: number) => {
    try {
      await educationService.deleteStudent(studentId);
      loadData();
    } catch (error) {
      const errorMsg = "No se pudo eliminar al alumno.";
      if (Platform.OS === 'web') alert(errorMsg);
      else Alert.alert("Error", errorMsg);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    (s.phone && s.phone.includes(search))
  );

  const t = {
    bg: isDark ? "#0a0a1a" : "#f0f2f5",
    card: isDark ? "#14142b" : "#ffffff",
    text: isDark ? "#eaeaef" : "#1a1a2e",
    textSec: isDark ? "#8888a4" : "#6b7280",
    accent: "#6366f1",
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
          <Text style={s.headerTitle}>Inscripciones</Text>
          {period_name && (
            <Text style={s.headerSub} numberOfLines={1}>Curso: {period_name}</Text>
          )}
        </View>
        <TouchableOpacity onPress={() => { setEditingStudent({ name: '', age: null, sex: 'M', is_baptized: false, phone: '' }); setStudentModal(true); }}>
          <Ionicons name="person-add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={s.searchWrap}>
        <View style={[s.searchBar, { backgroundColor: t.card, borderColor: t.border }]}>
          <Ionicons name="search" size={20} color={t.textSec} />
          <TextInput 
            placeholder="Buscar alumno por nombre o teléfono..." 
            placeholderTextColor={t.textSec}
            style={[s.searchInput, { color: t.text }]}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color={t.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredStudents}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.accent} />}
          renderItem={({ item }) => (
            <View style={[s.studentCard, { backgroundColor: t.card, borderColor: t.border }]}>
              <View style={s.cardHeader}>
                <View style={[s.avatar, { backgroundColor: t.accent + '20' }]}>
                  <Text style={[s.avatarText, { color: t.accent }]}>{item.name.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[s.studentName, { color: t.text }]}>{item.name}</Text>
                  <Text style={[s.studentInfo, { color: t.textSec }]}>
                    {item.age} años • {item.phone || 'Sin teléfono'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => { setEditingStudent(item); setStudentModal(true); }}>
                  <Ionicons name="create-outline" size={20} color={t.textSec} style={{ marginRight: 15 }} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteStudent(item.id, item.name)}>
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
              
              <View style={s.cardActions}>
                <TouchableOpacity 
                  style={[s.actionBtn, { backgroundColor: t.card, borderColor: t.accent, borderWidth: 1, marginRight: 8 }]}
                  onPress={() => router.push(`/(tabs)/student/${item.id}/kardex`)}
                >
                  <Ionicons name="document-text-outline" size={16} color={t.accent} />
                  <Text style={[s.actionBtnText, { color: t.accent }]}>Ver Kardex</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[s.actionBtn, { backgroundColor: t.accent }]}
                  onPress={() => {
                    setEnrollmentForm({ student_id: item.id, period_id: 0, requested_book: false, is_book_paid: false });
                    setEnrollModal(true);
                  }}
                >
                  <Ionicons name="school-outline" size={16} color="#fff" />
                  <Text style={s.actionBtnText}>Inscribir a Curso</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="people-outline" size={48} color={t.textSec} />
              <Text style={{ color: t.textSec, marginTop: 10 }}>No se encontraron alumnos</Text>
            </View>
          }
        />
      )}

      {/* Student Modal */}
      <Modal visible={studentModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { backgroundColor: t.card }]}>
            <Text style={[s.modalTitle, { color: t.text }]}>
              {editingStudent?.id ? "Editar Alumno" : "Nuevo Alumno"}
            </Text>
            <TextInput 
              placeholder="Nombre Completo" 
              placeholderTextColor={t.textSec}
              style={[s.input, { backgroundColor: t.input, color: t.text }]}
              value={editingStudent?.name}
              onChangeText={v => setEditingStudent({...editingStudent!, name: v})}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput 
                placeholder="Edad" 
                keyboardType="numeric"
                placeholderTextColor={t.textSec}
                style={[s.input, { flex: 1, backgroundColor: t.input, color: t.text }]}
                value={editingStudent?.age?.toString()}
                onChangeText={v => setEditingStudent({...editingStudent!, age: v ? Number(v) : null})}
              />
              <TextInput 
                placeholder="Teléfono" 
                keyboardType="phone-pad"
                placeholderTextColor={t.textSec}
                style={[s.input, { flex: 2, backgroundColor: t.input, color: t.text }]}
                value={editingStudent?.phone || ''}
                onChangeText={v => setEditingStudent({...editingStudent!, phone: v})}
              />
            </View>
            <View style={s.switchRow}>
              <Text style={{ color: t.text }}>¿Es bautizado?</Text>
              <Switch 
                value={editingStudent?.is_baptized} 
                onValueChange={v => setEditingStudent({...editingStudent!, is_baptized: v})}
                trackColor={{ true: t.accent }}
              />
            </View>
            <View style={s.modalButtons}>
              <TouchableOpacity onPress={() => setStudentModal(false)}><Text style={{ color: t.textSec }}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={[s.btnPri, { backgroundColor: t.accent }]} onPress={handleSaveStudent}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Enroll Modal */}
      <Modal visible={enrollModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { backgroundColor: t.card }]}>
            <Text style={[s.modalTitle, { color: t.text }]}>Inscribir a Curso</Text>
            
            {period_name ? (
              <View style={[s.periodOption, { backgroundColor: t.accent + '15', borderColor: t.accent }]}>
                <Text style={{ color: t.accent, fontWeight: '700' }}>{period_name}</Text>
              </View>
            ) : (
              <>
                <Text style={{ color: t.textSec, marginBottom: 5 }}>Selecciona el Periodo:</Text>
                <View style={{ maxHeight: 200 }}>
                  <FlatList 
                    data={periods}
                    keyExtractor={p => p.id.toString()}
                    renderItem={({ item }) => (
                      <TouchableOpacity 
                        style={[
                            s.periodOption, 
                            { 
                                backgroundColor: enrollmentForm.period_id === item.id ? t.accent + '20' : t.input,
                                borderColor: enrollmentForm.period_id === item.id ? t.accent : t.border
                            }
                        ]}
                        onPress={() => setEnrollmentForm({...enrollmentForm, period_id: item.id})}
                      >
                        <Text style={{ color: enrollmentForm.period_id === item.id ? t.accent : t.text, fontWeight: '600' }}>
                            {item.name}
                        </Text>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              </>
            )}

            <View style={s.switchRow}>
              <Text style={{ color: t.text }}>Solicitó Libro</Text>
              <Switch 
                value={enrollmentForm.requested_book} 
                onValueChange={v => setEnrollmentForm({...enrollmentForm, requested_book: v})}
                trackColor={{ true: t.accent }}
              />
            </View>

            <View style={s.switchRow}>
              <Text style={{ color: t.text }}>Libro Pagado</Text>
              <Switch 
                value={enrollmentForm.is_book_paid} 
                onValueChange={v => setEnrollmentForm({...enrollmentForm, is_book_paid: v})}
                trackColor={{ true: t.accent }}
              />
            </View>

            <View style={s.modalButtons}>
              <TouchableOpacity onPress={() => setEnrollModal(false)}><Text style={{ color: t.textSec }}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={[s.btnPri, { backgroundColor: t.accent }]} onPress={handleEnroll}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Inscribir</Text>
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
  header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: 'space-between', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#fff" },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.8)", fontWeight: '600' },
  searchWrap: { padding: 20 },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, height: 50, borderRadius: 15, borderWidth: 1 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14 },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  studentCard: { padding: 16, borderRadius: 20, borderWidth: 1, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontWeight: '800' },
  studentName: { fontSize: 16, fontWeight: '700' },
  studentInfo: { fontSize: 12, marginTop: 2 },
  cardActions: { marginTop: 15, flexDirection: 'row', justifyContent: 'flex-end' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 10, gap: 6 },
  actionBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  empty: { alignItems: 'center', marginTop: 60 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: 'center', padding: 20 },
  modalContent: { padding: 20, borderRadius: 24, gap: 15 },
  modalTitle: { fontSize: 20, fontWeight: "800", marginBottom: 5 },
  input: { padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 20, marginTop: 10 },
  btnPri: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 },
  periodOption: { padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 8 },
});
