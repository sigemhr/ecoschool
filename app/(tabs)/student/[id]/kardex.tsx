import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, useColorScheme, Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { educationService } from "@/src/modules/church-admin/services/education.service";

const { width } = Dimensions.get("window");

export default function StudentKardexScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();

  const [kardex, setKardex] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedCourse, setExpandedCourse] = useState<number | null>(null);

  const loadKardex = async () => {
    try {
      const data = await educationService.getStudentKardex(Number(id));
      setKardex(data);
    } catch (error) {
      console.error("Error loading kardex:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadKardex(); }, [id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadKardex();
    setRefreshing(false);
  };

  const t = {
    bg: isDark ? "#0a0a1a" : "#f0f2f5",
    card: isDark ? "#14142b" : "#ffffff",
    text: isDark ? "#eaeaef" : "#1a1a2e",
    textSec: isDark ? "#8888a4" : "#6b7280",
    accent: "#6366f1",
    border: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
    success: "#22c55e",
    danger: "#ef4444",
    warning: "#f59e0b",
  };

  if (loading && !refreshing) {
    return (
      <View style={[s.center, { backgroundColor: t.bg }]}>
        <ActivityIndicator size="large" color={t.accent} />
      </View>
    );
  }

  if (!kardex) return null;

  return (
    <View style={[s.container, { backgroundColor: t.bg }]}>
      {/* Header */}
      <View style={[s.header, { backgroundColor: t.accent }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={s.headerContent}>
          <Text style={s.headerLabel}>KARDEX DEL ALUMNO</Text>
          <Text style={s.headerTitle} numberOfLines={1}>{kardex.student.name}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={s.flex}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.accent} />}
      >
        {/* Summary Stats */}
        <View style={s.statsRow}>
          <View style={[s.statCard, { backgroundColor: t.card }]}>
            <Text style={[s.statValue, { color: t.text }]}>{kardex.summary.general_attendance_percentage}%</Text>
            <Text style={[s.statLabel, { color: t.textSec }]}>Asistencia Gral.</Text>
          </View>
          <View style={[s.statCard, { backgroundColor: t.card }]}>
            <Text style={[s.statValue, { color: t.text }]}>{kardex.summary.completed_courses}</Text>
            <Text style={[s.statLabel, { color: t.textSec }]}>Cursos Aprobados</Text>
          </View>
        </View>

        {/* Course History */}
        <View style={s.section}>
          <Text style={[s.sectionTitle, { color: t.text }]}>Historial Académico</Text>
          
          {kardex.history.map((item: any) => (
            <View key={item.id} style={[s.courseCard, { backgroundColor: t.card, borderColor: t.border }]}>
              <TouchableOpacity 
                style={s.courseHeader} 
                onPress={() => setExpandedCourse(expandedCourse === item.id ? null : item.id)}
              >
                <View style={s.courseMainInfo}>
                  <Text style={[s.coursePeriod, { color: t.accent }]}>{item.period_name}</Text>
                  <Text style={[s.courseName, { color: t.text }]}>{item.course_name}</Text>
                  <Text style={[s.schoolName, { color: t.textSec }]}>{item.school_name}</Text>
                </View>
                <View style={s.courseStatus}>
                  <Text style={[s.gradeText, { color: item.final_grade >= 8 ? t.success : t.text }]}>
                    {item.final_grade || '--'}
                  </Text>
                  <View style={[s.statusBadge, { 
                    backgroundColor: item.status === 'completed' ? t.success + '20' : t.warning + '20' 
                  }]}>
                    <Text style={{ 
                      color: item.status === 'completed' ? t.success : t.warning, 
                      fontSize: 10, 
                      fontWeight: '700' 
                    }}>
                      {item.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Ionicons 
                  name={expandedCourse === item.id ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color={t.textSec} 
                />
              </TouchableOpacity>

              {expandedCourse === item.id && (
                <View style={s.expandedContent}>
                  <View style={s.attendanceSummary}>
                    <Text style={[s.attTitle, { color: t.text }]}>Detalle de Asistencia</Text>
                    <Text style={[s.attPercent, { color: t.accent }]}>{item.attendance_stats.percentage}%</Text>
                  </View>
                  
                  {item.attendance_detail.map((att: any, idx: number) => (
                    <View key={idx} style={s.attRow}>
                      <View style={[s.attDot, { backgroundColor: att.is_present ? t.success : t.danger }]} />
                      <View style={s.attInfo}>
                        <Text style={[s.attDate, { color: t.text }]}>{new Date(att.date).toLocaleDateString()}</Text>
                        <Text style={[s.attTopic, { color: t.textSec }]} numberOfLines={1}>{att.topic}</Text>
                      </View>
                      <Text style={{ color: att.is_present ? t.success : t.danger, fontSize: 12, fontWeight: '600' }}>
                        {att.is_present ? 'Presente' : 'Falta'}
                      </Text>
                    </View>
                  ))}
                  
                  {item.attendance_detail.length === 0 && (
                    <Text style={[s.emptyAtt, { color: t.textSec }]}>No hay registros de asistencia aún.</Text>
                  )}
                </View>
              )}
            </View>
          ))}

          {kardex.history.length === 0 && (
            <View style={s.empty}>
              <Ionicons name="document-text-outline" size={48} color={t.textSec} />
              <Text style={{ color: t.textSec, marginTop: 10 }}>Este alumno no tiene historial académico.</Text>
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" },
  headerContent: { alignItems: "center", flex: 1 },
  headerLabel: { fontSize: 10, fontWeight: "700", color: "rgba(255,255,255,0.7)", letterSpacing: 1 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#fff", marginTop: 2 },
  statsRow: { flexDirection: 'row', padding: 20, gap: 15 },
  statCard: { flex: 1, padding: 15, borderRadius: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 11, marginTop: 4 },
  section: { paddingHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 15 },
  courseCard: { borderRadius: 20, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  courseHeader: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  courseMainInfo: { flex: 1 },
  coursePeriod: { fontSize: 10, fontWeight: '700', marginBottom: 2 },
  courseName: { fontSize: 15, fontWeight: '700' },
  schoolName: { fontSize: 11, marginTop: 2 },
  courseStatus: { alignItems: 'flex-end', marginRight: 15 },
  gradeText: { fontSize: 18, fontWeight: '800' },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
  expandedContent: { padding: 16, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', backgroundColor: 'rgba(0,0,0,0.01)' },
  attendanceSummary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  attTitle: { fontSize: 13, fontWeight: '700' },
  attPercent: { fontSize: 16, fontWeight: '800' },
  attRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  attDot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  attInfo: { flex: 1 },
  attDate: { fontSize: 12, fontWeight: '600' },
  attTopic: { fontSize: 11, marginTop: 1 },
  emptyAtt: { textAlign: 'center', fontSize: 12, fontStyle: 'italic', paddingVertical: 10 },
  empty: { alignItems: 'center', marginTop: 40 },
});
