import React, { useEffect, useRef } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  useColorScheme, Animated, Dimensions, Alert,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/src/modules/auth";
import { educationService } from "@/src/modules/church-admin/services/education.service";

const { width } = Dimensions.get("window");
const CARD_W = (width - 56) / 2;

// Logos individuales
const SCHOOL_LOGOS: Record<string, any> = {
  dna: require("@/assets/schools/dna.png"),
  eco: require("@/assets/schools/eco.png"),
  emid: require("@/assets/schools/emid.png"),
  ibd: require("@/assets/schools/ibd.png"),
  uccdi: require("@/assets/schools/uccdi.png"),
};

const SCHOOLS = [
  {
    id: 1, // dna
    slug: "dna",
    name: "DNA",
    fullName: "Discipulado Niños y Adolescentes",
    color: "#2563eb",
    colorLight: "rgba(37,99,235,0.06)",
    colorDark: "rgba(37,99,235,0.14)",
  },
  {
    id: 2, // eco
    slug: "eco",
    name: "ECO",
    fullName: "Escuela de Capacitación y Orientación",
    color: "#059669",
    colorLight: "rgba(5,150,105,0.06)",
    colorDark: "rgba(5,150,105,0.14)",
  },
  {
    id: 3, // emid
    slug: "emid",
    name: "EMID",
    fullName: "Escuela de Ministerios y Discipulado",
    color: "#7c3aed",
    colorLight: "rgba(124,58,237,0.06)",
    colorDark: "rgba(124,58,237,0.14)",
  },
  {
    id: 4, // ibd
    slug: "ibd",
    name: "IBD",
    fullName: "Desarrollo Líderes y Pastores",
    color: "#0891b2",
    colorLight: "rgba(8,145,178,0.06)",
    colorDark: "rgba(8,145,178,0.14)",
  },
];

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { user } = useAuth();
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnims = useRef(SCHOOLS.map(() => new Animated.Value(0.9))).current;

  const [assignedPeriods, setAssignedPeriods] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    SCHOOLS.forEach((_, i) => {
      Animated.spring(scaleAnims[i], {
        toValue: 1, friction: 6, tension: 80, delay: i * 80, useNativeDriver: true,
      }).start();
    });

    if (user?.role === 'teacher') {
      fetchAssignedPeriods();
    }
  }, [user]);

  const fetchAssignedPeriods = async () => {
    setIsLoading(true);
    try {
      const data = await educationService.getMyAssignedPeriods();
      setAssignedPeriods(data);
    } catch (err) {
      console.error("Error fetching periods:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const t = {
    bg: isDark ? "#0a0a1a" : "#f0f2f5",
    card: isDark ? "#14142b" : "#ffffff",
    cardAlt: isDark ? "#1c1c3a" : "#f8f9fb",
    text: isDark ? "#eaeaef" : "#1a1a2e",
    textSec: isDark ? "#8888a4" : "#6b7280",
    accent: "#0ea5e9",
    border: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
    shadow: isDark ? "#000" : "#94a3b8",
    accentBg: isDark ? "rgba(14,165,233,0.12)" : "rgba(14,165,233,0.06)",
  };

  const handleSchoolPress = (school: typeof SCHOOLS[0]) => {
    router.push({
      pathname: "/(tabs)/school/[id]",
      params: { id: school.id, name: school.name, color: school.color }
    });
  };

  const handlePeriodPress = (period: any) => {
    router.push({
      pathname: "/(tabs)/course/[id]",
      params: { 
        id: period.course_id, 
        name: period.course?.name || period.name,
        period_id: period.id,
        period_name: period.name
      }
    });
  };

  return (
    <ScrollView style={[s.container, { backgroundColor: t.bg }]} showsVerticalScrollIndicator={false}>
      {/* ─── Hero Header ─────────────────────────── */}
      <View style={s.hero}>
        <View style={s.heroOverlay} />
        <View style={s.heroContent}>
          <View style={s.heroLeft}>
            <Text style={s.heroLabel}>ESCUELAS</Text>
            <Text style={s.heroTitle}>EcoSchool</Text>
            <Text style={s.heroSub}>
              {user?.role === 'teacher' ? `Hola Maestro, ${user.name}` : `Bienvenido, ${user?.name || 'Administrador'}`}
            </Text>
          </View>
          <View style={s.heroLogoWrap}>
            <Image
              source={require("@/assets/images.jpeg")}
              style={s.heroLogo}
              contentFit="contain"
            />
          </View>
        </View>
        <View style={[s.heroDeco, s.heroDeco1]} />
        <View style={[s.heroDeco, s.heroDeco2]} />
      </View>

      {/* ─── Quick Stats ─────────────────────────── */}
      <Animated.View style={[s.quickStats, { opacity: fadeAnim }]}>
        <View style={[s.qCard, { backgroundColor: t.card, borderColor: t.border, shadowColor: t.shadow }]}>
          <View style={[s.qIcon, { backgroundColor: t.accentBg }]}>
            <Ionicons name="school" size={18} color={t.accent} />
          </View>
          <Text style={[s.qValue, { color: t.text }]}>
            {user?.role === 'teacher' ? assignedPeriods.length : '4'}
          </Text>
          <Text style={[s.qLabel, { color: t.textSec }]}>
            {user?.role === 'teacher' ? 'Periodos' : 'Escuelas'}
          </Text>
        </View>
        <View style={[s.qCard, { backgroundColor: t.card, borderColor: t.border, shadowColor: t.shadow }]}>
          <View style={[s.qIcon, { backgroundColor: "rgba(34,197,94,0.08)" }]}>
            <Ionicons name="book" size={18} color="#22c55e" />
          </View>
          <Text style={[s.qValue, { color: t.text }]}>—</Text>
          <Text style={[s.qLabel, { color: t.textSec }]}>Cursos</Text>
        </View>
        <View style={[s.qCard, { backgroundColor: t.card, borderColor: t.border, shadowColor: t.shadow }]}>
          <View style={[s.qIcon, { backgroundColor: "rgba(168,85,247,0.08)" }]}>
            <Ionicons name="people" size={18} color="#a855f7" />
          </View>
          <Text style={[s.qValue, { color: t.text }]}>—</Text>
          <Text style={[s.qLabel, { color: t.textSec }]}>Alumnos</Text>
        </View>
      </Animated.View>

      {/* ─── Section Title ────────────────────────── */}
      <View style={s.sectionHead}>
        <Text style={[s.sectionTitle, { color: t.text }]}>
          {user?.role === 'teacher' ? 'Mis Periodos Asignados' : 'Programas Educativos'}
        </Text>
        <Text style={[s.sectionSub, { color: t.textSec }]}>
          {user?.role === 'teacher' ? 'Gestiona tus clases actuales' : 'Selecciona una escuela para comenzar'}
        </Text>
      </View>

      {/* ─── Content ─────────────────────────── */}
      <View style={s.grid}>
        {user?.role === 'teacher' ? (
          assignedPeriods.length > 0 ? (
            assignedPeriods.map((period, i) => (
              <TouchableOpacity
                key={period.id}
                style={[s.periodCard, {
                  backgroundColor: t.card,
                  borderColor: t.border,
                  shadowColor: t.shadow,
                }]}
                onPress={() => handlePeriodPress(period)}
                activeOpacity={0.85}
              >
                <View style={[s.cardAccent, { backgroundColor: '#0ea5e9' }]} />
                <View style={s.periodHeader}>
                  <View style={[s.logoWrap, { backgroundColor: 'rgba(14,165,233,0.1)' }]}>
                    <Ionicons name="calendar" size={30} color="#0ea5e9" />
                  </View>
                  <View style={s.periodInfo}>
                    <Text style={[s.schoolName, { color: t.text }]}>{period.name}</Text>
                    <Text style={[s.schoolFull, { color: t.textSec }]}>
                      {period.course?.name || 'Materia'}
                    </Text>
                  </View>
                </View>
                
                <View style={s.periodFooter}>
                  <View style={s.periodTag}>
                    <Text style={s.periodTagText}>ACTIVO</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={t.textSec} />
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={s.emptyState}>
              <Ionicons name="alert-circle-outline" size={48} color={t.textSec} />
              <Text style={[s.emptyText, { color: t.textSec }]}>No tienes periodos asignados actualmente.</Text>
            </View>
          )
        ) : (
          SCHOOLS.map((school, i) => (
            <Animated.View
              key={school.id}
              style={{ width: CARD_W, transform: [{ scale: scaleAnims[i] }], opacity: fadeAnim }}
            >
              <TouchableOpacity
                style={[s.schoolCard, {
                  backgroundColor: t.card,
                  borderColor: t.border,
                  shadowColor: t.shadow,
                }]}
                onPress={() => handleSchoolPress(school)}
                activeOpacity={0.85}
              >
                {/* Colored accent bar */}
                <View style={[s.cardAccent, { backgroundColor: school.color }]} />

                {/* Logo image */}
                <View style={[s.logoWrap, { backgroundColor: isDark ? school.colorDark : school.colorLight }]}>
                  <Image
                    source={SCHOOL_LOGOS[school.slug]}
                    style={s.logoImg}
                    contentFit="contain"
                  />
                </View>

                {/* Name */}
                <Text style={[s.schoolName, { color: school.color }]}>{school.name}</Text>

                {/* Full name */}
                <Text style={[s.schoolFull, { color: t.textSec }]} numberOfLines={2}>
                  {school.fullName}
                </Text>

                {/* Arrow */}
                <View style={[s.schoolArrow, { backgroundColor: isDark ? school.colorDark : school.colorLight }]}>
                  <Ionicons name="chevron-forward" size={14} color={school.color} />
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))
        )}
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  // Hero
  hero: {
    backgroundColor: "#0ea5e9",
    paddingTop: 60, paddingBottom: 24, paddingHorizontal: 24,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
    overflow: "hidden",
  },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.06)" },
  heroContent: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", zIndex: 2 },
  heroLeft: { flex: 1 },
  heroLabel: { fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,0.6)", letterSpacing: 1.5, marginBottom: 6 },
  heroTitle: { fontSize: 28, fontWeight: "800", color: "#fff", letterSpacing: -0.5 },
  heroSub: { fontSize: 13, color: "rgba(255,255,255,0.75)", marginTop: 4 },
  heroLogoWrap: {
    width: 64, height: 64, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.95)",
    justifyContent: "center", alignItems: "center",
    marginLeft: 12, overflow: "hidden",
  },
  heroLogo: { width: 56, height: 56 },
  heroDeco: { position: "absolute", borderRadius: 999, backgroundColor: "rgba(255,255,255,0.06)" },
  heroDeco1: { width: 180, height: 180, top: -60, right: -40 },
  heroDeco2: { width: 120, height: 120, bottom: -30, left: -20 },
  // Quick Stats
  quickStats: { flexDirection: "row", paddingHorizontal: 20, paddingTop: 20, gap: 10 },
  qCard: {
    flex: 1, padding: 14, borderRadius: 16, borderWidth: 1, alignItems: "center",
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  qIcon: { width: 36, height: 36, borderRadius: 11, justifyContent: "center", alignItems: "center", marginBottom: 8 },
  qValue: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  qLabel: { fontSize: 11, marginTop: 2, fontWeight: "500" },
  // Section
  sectionHead: { paddingHorizontal: 24, marginTop: 24, marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: "700", letterSpacing: -0.3 },
  sectionSub: { fontSize: 13, marginTop: 3 },
  // Grid
  grid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 20, gap: 16 },
  schoolCard: {
    borderRadius: 20, borderWidth: 1, paddingTop: 0, paddingHorizontal: 18,
    paddingBottom: 18, overflow: "hidden",
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3,
  },
  cardAccent: { height: 4, marginHorizontal: -18, marginBottom: 16 },
  // Logo
  logoWrap: {
    width: 64, height: 64, borderRadius: 18,
    justifyContent: "center", alignItems: "center", marginBottom: 14,
    overflow: "hidden",
  },
  logoImg: { width: 52, height: 52 },
  schoolName: { fontSize: 20, fontWeight: "800", letterSpacing: -0.3 },
  schoolFull: { fontSize: 11, marginTop: 4, lineHeight: 15 },
  schoolArrow: {
    width: 28, height: 28, borderRadius: 9,
    justifyContent: "center", alignItems: "center",
    position: "absolute", bottom: 16, right: 16,
  },
  // Period Card (Teacher)
  periodCard: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 12,
  },
  periodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  periodInfo: {
    marginLeft: 16,
    flex: 1,
  },
  periodFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  periodTag: {
    backgroundColor: 'rgba(34,197,94,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  periodTagText: {
    color: '#16a34a',
    fontSize: 10,
    fontWeight: '700',
  },
  emptyState: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
  },
});
