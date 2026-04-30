import React from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, useColorScheme, Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/src/modules/auth";

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { user, logout } = useAuth();

  const t = {
    bg: isDark ? "#0a0a1a" : "#f0f2f5",
    card: isDark ? "#14142b" : "#ffffff",
    cardAlt: isDark ? "#1c1c3a" : "#f8f9fb",
    text: isDark ? "#eaeaef" : "#1a1a2e",
    textSec: isDark ? "#8888a4" : "#6b7280",
    accent: "#0ea5e9",
    red: "#ef4444",
    border: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
    shadow: isDark ? "#000" : "#94a3b8",
    accentBg: isDark ? "rgba(14,165,233,0.12)" : "rgba(14,165,233,0.06)",
  };

  const handleLogout = () => {
    if (Platform.OS === "web") {
      const confirmed = window.confirm("¿Estás seguro de que deseas salir?");
      if (confirmed) {
        logout();
      }
    } else {
      Alert.alert("Cerrar sesión", "¿Estás seguro de que deseas salir?", [
        { text: "Cancelar", style: "cancel" },
        { text: "Cerrar sesión", style: "destructive", onPress: logout },
      ]);
    }
  };

  const infoItems = [
    { label: "Nombre", value: user?.name || "—", icon: "person-outline" },
    { label: "Correo electrónico", value: user?.email || "—", icon: "mail-outline" },
    { label: "Rol", value: "Super Administrador", icon: "shield-outline" },
    { label: "Estado", value: "Activo", icon: "checkmark-circle-outline" },
  ];

  return (
    <ScrollView style={[s.container, { backgroundColor: t.bg }]} showsVerticalScrollIndicator={false}>
      {/* ─── Profile Header ───────────────────────── */}
      <View style={s.headerWrap}>
        <View style={[s.headerBg, { backgroundColor: t.accent }]}>
          <View style={[s.headerDeco, s.deco1]} />
          <View style={[s.headerDeco, s.deco2]} />
        </View>
        <View style={s.avatarWrap}>
          <View style={[s.avatar, { backgroundColor: t.card, borderColor: t.bg, shadowColor: t.shadow }]}>
            <View style={[s.avatarInner, { backgroundColor: t.accentBg }]}>
              <Text style={{ fontSize: 32, fontWeight: "800", color: t.accent }}>
                {user?.name?.charAt(0)?.toUpperCase() || "A"}
              </Text>
            </View>
          </View>
          <Text style={[s.name, { color: t.text }]}>{user?.name || "Super Admin"}</Text>
          <Text style={[s.email, { color: t.textSec }]}>{user?.email || "admin@ecoschool.com"}</Text>
          <View style={[s.rolePill, { backgroundColor: t.accentBg }]}>
            <Ionicons name="shield-checkmark" size={13} color={t.accent} />
            <Text style={{ color: t.accent, fontSize: 12, fontWeight: "700" }}>Super Administrador</Text>
          </View>
        </View>
      </View>

      {/* ─── Info Card ────────────────────────────── */}
      <View style={[s.infoCard, { backgroundColor: t.card, borderColor: t.border, shadowColor: t.shadow }]}>
        <View style={s.infoHeader}>
          <Text style={[s.infoTitle, { color: t.text }]}>Información</Text>
          <View style={[s.infoBadge, { backgroundColor: t.accentBg }]}>
            <Ionicons name="information-circle" size={16} color={t.accent} />
          </View>
        </View>

        {infoItems.map((item, i) => (
          <View key={i} style={[s.infoRow, i < infoItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: t.border }]}>
            <View style={[s.infoIcon, { backgroundColor: t.cardAlt }]}>
              <Ionicons name={item.icon as any} size={16} color={t.accent} />
            </View>
            <View style={s.infoContent}>
              <Text style={[s.infoLabel, { color: t.textSec }]}>{item.label}</Text>
              <Text style={[s.infoValue, { color: t.text }]} numberOfLines={1}>{item.value}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* ─── App Info ─────────────────────────────── */}
      <View style={[s.appCard, { backgroundColor: t.card, borderColor: t.border, shadowColor: t.shadow }]}>
        <View style={s.appRow}>
          <View style={[s.appIcon, { backgroundColor: t.accentBg }]}>
            <Ionicons name="school" size={18} color={t.accent} />
          </View>
          <View style={s.flex}>
            <Text style={[s.appName, { color: t.text }]}>EcoSchool</Text>
            <Text style={{ color: t.textSec, fontSize: 11 }}>Escuela para Iglesias</Text>
          </View>
          <Text style={[s.version, { color: t.textSec }]}>v1.0.0</Text>
        </View>
      </View>

      {/* ─── Logout ───────────────────────────────── */}
      <TouchableOpacity
        style={[s.logoutBtn, { borderColor: t.red + "30" }]}
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <View style={[s.logoutIcon, { backgroundColor: t.red + "12" }]}>
          <Ionicons name="log-out-outline" size={18} color={t.red} />
        </View>
        <Text style={[s.logoutText, { color: t.red }]}>Cerrar Sesión</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  // Header
  headerWrap: { marginBottom: 8 },
  headerBg: {
    height: 140, borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
    overflow: "hidden",
  },
  headerDeco: { position: "absolute", borderRadius: 999, backgroundColor: "rgba(255,255,255,0.06)" },
  deco1: { width: 160, height: 160, top: -50, right: -30 },
  deco2: { width: 100, height: 100, bottom: -20, left: -20 },
  avatarWrap: { alignItems: "center", marginTop: -46 },
  avatar: {
    width: 92, height: 92, borderRadius: 30, borderWidth: 4,
    justifyContent: "center", alignItems: "center",
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 6,
  },
  avatarInner: {
    width: 78, height: 78, borderRadius: 24,
    justifyContent: "center", alignItems: "center",
  },
  name: { fontSize: 22, fontWeight: "800", marginTop: 14, letterSpacing: -0.3 },
  email: { fontSize: 14, marginTop: 4 },
  rolePill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    marginTop: 12, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
  },
  // Info
  infoCard: {
    marginHorizontal: 20, marginTop: 24, borderRadius: 20, borderWidth: 1,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3,
    overflow: "hidden",
  },
  infoHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingTop: 18, paddingBottom: 12,
  },
  infoTitle: { fontSize: 16, fontWeight: "700" },
  infoBadge: { width: 32, height: 32, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  infoRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, gap: 14 },
  infoIcon: { width: 36, height: 36, borderRadius: 11, justifyContent: "center", alignItems: "center" },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, fontWeight: "600", letterSpacing: 0.3, textTransform: "uppercase" },
  infoValue: { fontSize: 15, fontWeight: "500", marginTop: 2 },
  // App
  appCard: {
    marginHorizontal: 20, marginTop: 16, borderRadius: 18, borderWidth: 1,
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  appRow: { flexDirection: "row", alignItems: "center", padding: 16, gap: 12 },
  appIcon: { width: 42, height: 42, borderRadius: 13, justifyContent: "center", alignItems: "center" },
  appName: { fontSize: 15, fontWeight: "700" },
  version: { fontSize: 12, fontWeight: "500" },
  // Logout
  logoutBtn: {
    marginHorizontal: 20, marginTop: 20, height: 52, borderRadius: 16,
    borderWidth: 1, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 10,
  },
  logoutIcon: { width: 32, height: 32, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  logoutText: { fontSize: 15, fontWeight: "600" },
});
