import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, useColorScheme, Animated, Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { educationService, Course, Teacher } from "@/src/modules/church-admin/services/education.service";

export default function SchoolCoursesScreen() {
  const { id, name, color } = useLocalSearchParams<{ id: string; name: string; color: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();

  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  const loadData = async () => {
    try {
      const [cData, tData] = await Promise.all([
        educationService.getCourses(Number(id)),
        educationService.getTeachers()
      ]);
      setCourses(cData);
      setTeachers(tData);
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    } catch (error) {
      console.error("Error loading courses/teachers:", error);
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

  const t = {
    bg: isDark ? "#0a0a1a" : "#f0f2f5",
    card: isDark ? "#14142b" : "#ffffff",
    text: isDark ? "#eaeaef" : "#1a1a2e",
    textSec: isDark ? "#8888a4" : "#6b7280",
    accent: color || "#0ea5e9",
    border: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
    shadow: isDark ? "#000" : "#94a3b8",
  };

  const getTeacherName = (teacherId: number | null) => {
    if (!teacherId) return "Sin maestro asignado";
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher ? teacher.name : "Sin maestro asignado";
  };

  if (loading && !refreshing) {
    return (
      <View style={[s.center, { backgroundColor: t.bg }]}>
        <ActivityIndicator size="large" color={t.accent} />
      </View>
    );
  }

  return (
    <View style={[s.container, { backgroundColor: t.bg }]}>
      {/* Custom Header */}
      <View style={[s.header, { backgroundColor: t.accent }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={s.headerContent}>
          <Text style={s.headerLabel}>CURSOS DISPONIBLES</Text>
          <Text style={s.headerTitle}>{name || "Escuela"}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={s.flex}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.accent} />}
      >
        <Animated.View style={[s.list, { opacity: fadeAnim }]}>
          {courses.length === 0 ? (
            <View style={s.empty}>
              <Ionicons name="book-outline" size={48} color={t.textSec} />
              <Text style={[s.emptyText, { color: t.textSec }]}>No hay cursos disponibles para esta escuela.</Text>
            </View>
          ) : (
            courses.map((course, index) => (
              <TouchableOpacity
                key={course.id}
                style={[s.courseCard, { backgroundColor: t.card, borderColor: t.border, shadowColor: t.shadow }]}
                activeOpacity={0.8}
                onPress={() => router.push({
                  pathname: "/(tabs)/course/[id]",
                  params: { id: course.id, name: course.name, schoolColor: t.accent }
                })}
              >
                <View style={[s.orderBadge, { backgroundColor: t.accent + "15" }]}>
                  <Text style={{ color: t.accent, fontWeight: "800", fontSize: 12 }}>{index + 1}</Text>
                </View>
                <View style={s.courseInfo}>
                  <Text style={[s.courseName, { color: t.text }]}>{course.name}</Text>
                  <View style={s.teacherRow}>
                    <Ionicons name="person" size={12} color={course.teacher_id ? t.accent : t.textSec} />
                    <Text style={[s.teacherText, { color: course.teacher_id ? t.accent : t.textSec }]}>
                      {getTeacherName(course.teacher_id)}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={t.textSec + "40"} />
              </TouchableOpacity>
            ))
          )}
        </Animated.View>
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
  headerContent: { alignItems: "center" },
  headerLabel: { fontSize: 10, fontWeight: "700", color: "rgba(255,255,255,0.7)", letterSpacing: 1 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#fff", marginTop: 2 },
  list: { padding: 20, gap: 12 },
  courseCard: {
    flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 16, borderWidth: 1,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  orderBadge: { width: 32, height: 32, borderRadius: 10, justifyContent: "center", alignItems: "center", marginRight: 14 },
  courseInfo: { flex: 1, gap: 4 },
  courseName: { fontSize: 15, fontWeight: "700", lineHeight: 20 },
  teacherRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  teacherText: { fontSize: 12, fontWeight: "500" },
  empty: { alignItems: "center", marginTop: 60, gap: 12 },
  emptyText: { textAlign: "center", fontSize: 14, paddingHorizontal: 40 },
});
