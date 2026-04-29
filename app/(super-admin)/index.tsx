import React, { useEffect, useRef } from "react";
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  RefreshControl, useColorScheme, Animated, Dimensions,
  TouchableOpacity, Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSuperAdmin } from "@/src/modules/super-admin";
import { useAuth } from "@/src/modules/auth";

const { width } = Dimensions.get("window");
const CARD_W = (width - 52) / 2;

export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { stats, isLoading, error, loadStats } = useSuperAdmin();
  const { logout } = useAuth();

  const handleLogout = () => {
    Alert.alert("Cerrar sesión", "¿Estás seguro de que deseas salir?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Cerrar sesión", style: "destructive", onPress: logout },
    ]);
  };
  const [refreshing, setRefreshing] = React.useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => { loadStats(); }, []);

  useEffect(() => {
    if (stats) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
    }
  }, [stats]);

  const onRefresh = async () => { setRefreshing(true); await loadStats(); setRefreshing(false); };

  const t = {
    bg: isDark ? "#0a0a1a" : "#f0f2f5",
    card: isDark ? "#14142b" : "#ffffff",
    cardAlt: isDark ? "#1c1c3a" : "#f8f9fb",
    text: isDark ? "#eaeaef" : "#1a1a2e",
    textSec: isDark ? "#8888a4" : "#6b7280",
    accent: "#0ea5e9",
    accentDark: "#0284c7",
    green: "#22c55e",
    greenBg: isDark ? "rgba(34,197,94,0.12)" : "rgba(34,197,94,0.08)",
    orange: "#f59e0b",
    orangeBg: isDark ? "rgba(245,158,11,0.12)" : "rgba(245,158,11,0.08)",
    red: "#ef4444",
    purple: "#a855f7",
    purpleBg: isDark ? "rgba(168,85,247,0.12)" : "rgba(168,85,247,0.08)",
    accentBg: isDark ? "rgba(14,165,233,0.12)" : "rgba(14,165,233,0.06)",
    border: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
    shadow: isDark ? "#000" : "#94a3b8",
  };

  const statCards = [
    { title: "Iglesias", value: stats?.total_churches ?? 0, icon: "business", color: t.accent, bg: t.accentBg, subtitle: "Registradas" },
    { title: "Activas", value: stats?.active_churches ?? 0, icon: "checkmark-circle", color: t.green, bg: t.greenBg, subtitle: "En operación" },
    { title: "Suspendidas", value: stats?.suspended_churches ?? 0, icon: "pause-circle", color: t.orange, bg: t.orangeBg, subtitle: "Temporales" },
    { title: "Usuarios", value: stats?.total_users ?? 0, icon: "people", color: t.purple, bg: t.purpleBg, subtitle: "De iglesias" },
  ];

  if (isLoading && !refreshing && !stats) {
    return (
      <View style={[s.loadWrap, { backgroundColor: t.bg }]}>
        <View style={[s.loadInner, { backgroundColor: t.card }]}>
          <ActivityIndicator size="large" color={t.accent} />
          <Text style={[s.loadText, { color: t.textSec }]}>Cargando dashboard...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[s.container, { backgroundColor: t.bg }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.accent} />}
    >
      {/* ─── Hero Header ─────────────────────────── */}
      <View style={s.heroWrap}>
        <View style={s.hero}>
          <View style={s.heroOverlay} />
          <View style={s.heroContent}>
            <View style={s.heroLeft}>
              <Text style={s.heroLabel}>PANEL DE CONTROL</Text>
              <Text style={s.heroTitle}>EcoSchool</Text>
              <Text style={s.heroSub}>Gestión de iglesias y usuarios</Text>
            </View>
            <TouchableOpacity onPress={handleLogout} style={s.heroLogout} activeOpacity={0.7}>
              <Ionicons name="log-out-outline" size={20} color="rgba(255,255,255,0.85)" />
            </TouchableOpacity>
          </View>
          {/* Decorative circles */}
          <View style={[s.heroDeco, s.heroDeco1]} />
          <View style={[s.heroDeco, s.heroDeco2]} />
        </View>
      </View>

      {/* ─── Error ───────────────────────────────── */}
      {error && (
        <View style={[s.errWrap, { backgroundColor: t.red + "10", borderColor: t.red + "30" }]}>
          <View style={[s.errIcon, { backgroundColor: t.red + "20" }]}>
            <Ionicons name="warning" size={16} color={t.red} />
          </View>
          <Text style={[s.errText, { color: t.red }]}>{error}</Text>
        </View>
      )}

      {/* ─── Stats Grid ──────────────────────────── */}
      <Animated.View style={[s.statsGrid, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {statCards.map((card, i) => (
          <View
            key={i}
            style={[s.statCard, {
              backgroundColor: t.card,
              borderColor: t.border,
              shadowColor: t.shadow,
              width: CARD_W,
            }]}
          >
            <View style={[s.statIconWrap, { backgroundColor: card.bg }]}>
              <Ionicons name={card.icon as any} size={22} color={card.color} />
            </View>
            <Text style={[s.statValue, { color: t.text }]}>{card.value}</Text>
            <Text style={[s.statTitle, { color: t.text }]}>{card.title}</Text>
            <Text style={[s.statSub, { color: t.textSec }]}>{card.subtitle}</Text>
          </View>
        ))}
      </Animated.View>

      {/* ─── Recent Churches ─────────────────────── */}
      <Animated.View style={[s.section, { opacity: fadeAnim }]}>
        <View style={s.sectionHead}>
          <View>
            <Text style={[s.sectionTitle, { color: t.text }]}>Últimas Iglesias</Text>
            <Text style={[s.sectionSub, { color: t.textSec }]}>Registros más recientes</Text>
          </View>
          <View style={[s.sectionBadge, { backgroundColor: t.accentBg }]}>
            <Text style={{ color: t.accent, fontSize: 12, fontWeight: "700" }}>
              {stats?.recent_churches?.length ?? 0}
            </Text>
          </View>
        </View>

        {stats?.recent_churches && stats.recent_churches.length > 0 ? (
          stats.recent_churches.map((church, index) => {
            const isActive = church.status === "active";
            const isSuspended = church.status === "suspended";
            const statusColor = isActive ? t.green : isSuspended ? t.orange : t.red;
            const statusLabel = isActive ? "Activa" : isSuspended ? "Suspendida" : "Inactiva";

            return (
              <View
                key={church.id || index}
                style={[s.churchCard, {
                  backgroundColor: t.card,
                  borderColor: t.border,
                  shadowColor: t.shadow,
                }]}
              >
                <View style={s.churchRow}>
                  <View style={[s.churchAva, { backgroundColor: t.accentBg }]}>
                    <Text style={{ fontSize: 18, fontWeight: "800", color: t.accent }}>
                      {church.name?.charAt(0)?.toUpperCase() || "I"}
                    </Text>
                  </View>
                  <View style={s.churchInfo}>
                    <Text style={[s.churchName, { color: t.text }]} numberOfLines={1}>{church.name}</Text>
                    <Text style={[s.churchMeta, { color: t.textSec }]} numberOfLines={1}>
                      {church.presbiterio} · {church.distrito}
                    </Text>
                  </View>
                  <View style={[s.statusPill, { backgroundColor: statusColor + "14" }]}>
                    <View style={[s.statusDot, { backgroundColor: statusColor }]} />
                    <Text style={{ color: statusColor, fontSize: 11, fontWeight: "600" }}>{statusLabel}</Text>
                  </View>
                </View>

                {church.admin_email && (
                  <View style={[s.churchFooter, { backgroundColor: t.cardAlt, borderTopColor: t.border }]}>
                    <Ionicons name="person-circle-outline" size={16} color={t.textSec} />
                    <Text style={{ color: t.textSec, fontSize: 12 }}>
                      {church.admin_name}
                    </Text>
                    <Text style={{ color: t.textSec + "80", fontSize: 11 }}>
                      · {church.admin_email}
                    </Text>
                  </View>
                )}
              </View>
            );
          })
        ) : (
          <View style={[s.emptyWrap, { backgroundColor: t.card, borderColor: t.border }]}>
            <View style={[s.emptyIcon, { backgroundColor: t.accentBg }]}>
              <Ionicons name="business-outline" size={32} color={t.accent} />
            </View>
            <Text style={[s.emptyTitle, { color: t.text }]}>Sin iglesias aún</Text>
            <Text style={{ color: t.textSec, fontSize: 13, textAlign: "center" }}>
              Las iglesias registradas aparecerán aquí
            </Text>
          </View>
        )}
      </Animated.View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  loadWrap: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  loadInner: { padding: 32, borderRadius: 20, alignItems: "center", gap: 14, width: "100%" },
  loadText: { fontSize: 15 },
  // Hero
  heroWrap: { paddingHorizontal: 0 },
  hero: {
    backgroundColor: "#0ea5e9",
    paddingTop: 64, paddingBottom: 28, paddingHorizontal: 24,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
    overflow: "hidden",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  heroContent: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", zIndex: 2 },
  heroLeft: { flex: 1 },
  heroLabel: { fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,0.6)", letterSpacing: 1.5, marginBottom: 6 },
  heroTitle: { fontSize: 30, fontWeight: "800", color: "#fff", letterSpacing: -0.5 },
  heroSub: { fontSize: 14, color: "rgba(255,255,255,0.7)", marginTop: 4 },
  heroLogout: {
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center", alignItems: "center", marginLeft: 12,
  },
  heroIconRing: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 2, borderColor: "rgba(255,255,255,0.25)",
    justifyContent: "center", alignItems: "center",
  },
  heroDeco: { position: "absolute", borderRadius: 999, backgroundColor: "rgba(255,255,255,0.06)" },
  heroDeco1: { width: 180, height: 180, top: -60, right: -40 },
  heroDeco2: { width: 120, height: 120, bottom: -30, left: -20 },
  // Error
  errWrap: {
    marginHorizontal: 20, marginTop: 16, padding: 14, borderRadius: 14,
    flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1,
  },
  errIcon: { width: 30, height: 30, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  errText: { fontSize: 13, flex: 1, fontWeight: "500" },
  // Stats
  statsGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 20, paddingTop: 20, gap: 12 },
  statCard: {
    padding: 18, borderRadius: 20, borderWidth: 1,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
  },
  statIconWrap: { width: 46, height: 46, borderRadius: 14, justifyContent: "center", alignItems: "center", marginBottom: 14 },
  statValue: { fontSize: 32, fontWeight: "800", letterSpacing: -1 },
  statTitle: { fontSize: 14, fontWeight: "600", marginTop: 2 },
  statSub: { fontSize: 11, marginTop: 2 },
  // Section
  section: { paddingHorizontal: 20, marginTop: 28 },
  sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: "700", letterSpacing: -0.3 },
  sectionSub: { fontSize: 13, marginTop: 2 },
  sectionBadge: { width: 32, height: 32, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  // Church Card
  churchCard: {
    borderRadius: 18, borderWidth: 1, marginBottom: 12, overflow: "hidden",
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  churchRow: { flexDirection: "row", alignItems: "center", padding: 16, gap: 12 },
  churchAva: {
    width: 46, height: 46, borderRadius: 14,
    justifyContent: "center", alignItems: "center",
  },
  churchInfo: { flex: 1 },
  churchName: { fontSize: 15, fontWeight: "700" },
  churchMeta: { fontSize: 12, marginTop: 3 },
  statusPill: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, gap: 5 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  churchFooter: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 10,
    borderTopWidth: 1, gap: 6,
  },
  // Empty
  emptyWrap: { padding: 40, borderRadius: 20, borderWidth: 1, alignItems: "center", gap: 12 },
  emptyIcon: { width: 64, height: 64, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  emptyTitle: { fontSize: 17, fontWeight: "700" },
});
