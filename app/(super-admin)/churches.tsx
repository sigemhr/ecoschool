import React, { useEffect, useState, useRef } from "react";
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  RefreshControl, TouchableOpacity, Alert, useColorScheme,
  Modal, TextInput, KeyboardAvoidingView, Platform, Animated, Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSuperAdmin } from "@/src/modules/super-admin";
import type { ChurchFormValues } from "@/src/modules/super-admin";

const { width } = Dimensions.get("window");

const emptyForm: ChurchFormValues = {
  name: "", presbiterio: "", distrito: "",
  address: "", phone: "",
  admin_name: "", admin_email: "", admin_password: "",
};

export default function ChurchesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { churches, isLoading, error, loadChurches, updateChurchStatus, createChurch, setError } = useSuperAdmin();
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState<ChurchFormValues>({ ...emptyForm });
  const [submitting, setSubmitting] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => { loadChurches(); }, []);
  useEffect(() => {
    if (churches.length > 0) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }
  }, [churches]);

  const onRefresh = async () => { setRefreshing(true); await loadChurches(); setRefreshing(false); };

  const t = {
    bg: isDark ? "#0a0a1a" : "#f0f2f5",
    card: isDark ? "#14142b" : "#ffffff",
    cardAlt: isDark ? "#1c1c3a" : "#f8f9fb",
    text: isDark ? "#eaeaef" : "#1a1a2e",
    textSec: isDark ? "#8888a4" : "#6b7280",
    accent: "#0ea5e9",
    green: "#22c55e",
    orange: "#f59e0b",
    red: "#ef4444",
    border: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
    input: isDark ? "#1c1c3a" : "#f3f4f6",
    inputBorder: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
    modalBg: isDark ? "#0f0f24" : "#f8f9fb",
    shadow: isDark ? "#000" : "#94a3b8",
    accentBg: isDark ? "rgba(14,165,233,0.12)" : "rgba(14,165,233,0.06)",
  };

  // ─── Status ──────────────────────────────────────
  const handleStatusChange = (id: number, name: string, current: string) => {
    const opts = ["active", "suspended", "inactive"].filter(s => s !== current);
    const labels: Record<string, string> = { active: "Activar", suspended: "Suspender", inactive: "Desactivar" };
    Alert.alert(`Cambiar estado: ${name}`, `Actual: ${current}`, [
      ...opts.map(s => ({
        text: labels[s],
        style: (s === "inactive" ? "destructive" : "default") as any,
        onPress: async () => {
          try { await updateChurchStatus(id, s); loadChurches(); }
          catch { Alert.alert("Error", "No se pudo actualizar"); }
        },
      })),
      { text: "Cancelar", style: "cancel" },
    ]);
  };

  const statusCfg = (s: string) => {
    if (s === "active") return { label: "Activa", color: t.green, icon: "checkmark-circle" as const };
    if (s === "suspended") return { label: "Suspendida", color: t.orange, icon: "pause-circle" as const };
    return { label: "Inactiva", color: t.red, icon: "close-circle" as const };
  };

  // ─── Create ──────────────────────────────────────
  const updateField = (key: keyof ChurchFormValues, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleCreate = async () => {
    if (!form.name || !form.presbiterio || !form.distrito) {
      Alert.alert("Campos requeridos", "Nombre, presbiterio y distrito son obligatorios"); return;
    }
    if (!form.admin_name || !form.admin_email || !form.admin_password) {
      Alert.alert("Campos requeridos", "Los datos del administrador son obligatorios"); return;
    }
    if (form.admin_password.length < 8) {
      Alert.alert("Contraseña corta", "La contraseña debe tener al menos 8 caracteres"); return;
    }
    try {
      setSubmitting(true); setError(null);
      await createChurch(form);
      setModalVisible(false); setForm({ ...emptyForm }); loadChurches();
      Alert.alert("¡Éxito!", `Iglesia "${form.name}" creada con su administrador`);
    } catch (err: any) {
      Alert.alert("Error", err.message || "No se pudo crear la iglesia");
    } finally { setSubmitting(false); }
  };

  const renderInput = (
    label: string, key: keyof ChurchFormValues, icon: string,
    opts: { keyboard?: any; secure?: boolean; required?: boolean; placeholder?: string } = {}
  ) => (
    <View style={st.field}>
      <Text style={[st.label, { color: t.textSec }]}>
        {label}{opts.required ? <Text style={{ color: t.red }}> *</Text> : ""}
      </Text>
      <View style={[st.inputWrap, { backgroundColor: t.input, borderColor: t.inputBorder }]}>
        <Ionicons name={icon as any} size={16} color={t.textSec} />
        <TextInput
          style={[st.input, { color: t.text }]}
          value={form[key]}
          onChangeText={v => updateField(key, v)}
          placeholder={opts.placeholder || label}
          placeholderTextColor={t.textSec + "80"}
          keyboardType={opts.keyboard || "default"}
          secureTextEntry={opts.secure}
          autoCapitalize={opts.keyboard === "email-address" ? "none" : "sentences"}
        />
      </View>
    </View>
  );

  // ─── Loading ──────────────────────────────────────
  if (isLoading && !refreshing && churches.length === 0) {
    return (
      <View style={[st.loadWrap, { backgroundColor: t.bg }]}>
        <View style={[st.loadInner, { backgroundColor: t.card }]}>
          <ActivityIndicator size="large" color={t.accent} />
          <Text style={{ color: t.textSec, fontSize: 14 }}>Cargando iglesias...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[st.flex, { backgroundColor: t.bg }]}>
      <ScrollView
        style={st.flex}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.accent} />}
      >
        {/* Header */}
        <View style={st.header}>
          <View>
            <Text style={[st.title, { color: t.text }]}>Iglesias</Text>
            <Text style={[st.sub, { color: t.textSec }]}>
              {churches.length} registrada{churches.length !== 1 ? "s" : ""}
            </Text>
          </View>
          <View style={[st.headerBadge, { backgroundColor: t.accentBg }]}>
            <Ionicons name="business" size={18} color={t.accent} />
          </View>
        </View>

        {/* Error */}
        {error && (
          <View style={[st.errWrap, { backgroundColor: t.red + "10", borderColor: t.red + "30" }]}>
            <View style={[st.errIcon, { backgroundColor: t.red + "20" }]}>
              <Ionicons name="warning" size={14} color={t.red} />
            </View>
            <Text style={{ color: t.red, fontSize: 13, flex: 1, fontWeight: "500" }}>{error}</Text>
          </View>
        )}

        {/* List */}
        <Animated.View style={[st.list, { opacity: fadeAnim }]}>
          {churches.length === 0 ? (
            <View style={[st.emptyWrap, { backgroundColor: t.card, borderColor: t.border }]}>
              <View style={[st.emptyIcon, { backgroundColor: t.accentBg }]}>
                <Ionicons name="business-outline" size={36} color={t.accent} />
              </View>
              <Text style={[st.emptyTitle, { color: t.text }]}>Sin iglesias</Text>
              <Text style={{ color: t.textSec, fontSize: 13, textAlign: "center", lineHeight: 19 }}>
                Presiona el botón + para{"\n"}registrar la primera iglesia
              </Text>
            </View>
          ) : churches.map((church, index) => {
            const sc = statusCfg(church.status);
            return (
              <View
                key={church.id}
                style={[st.card, { backgroundColor: t.card, borderColor: t.border, shadowColor: t.shadow }]}
              >
                {/* Card header */}
                <View style={st.cardH}>
                  <View style={[st.ava, { backgroundColor: t.accentBg }]}>
                    <Text style={{ fontSize: 18, fontWeight: "800", color: t.accent }}>
                      {church.name?.charAt(0)?.toUpperCase() || "I"}
                    </Text>
                  </View>
                  <View style={st.flex}>
                    <Text style={[st.cName, { color: t.text }]} numberOfLines={1}>{church.name}</Text>
                    <View style={st.slugRow}>
                      <View style={[st.slugDot, { backgroundColor: t.accent }]} />
                      <Text style={{ color: t.textSec, fontSize: 11, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" }}>
                        {church.slug}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleStatusChange(church.id, church.name, church.status)}
                    style={[st.statusPill, { backgroundColor: sc.color + "14" }]}
                    activeOpacity={0.7}
                  >
                    <View style={[st.statusDot, { backgroundColor: sc.color }]} />
                    <Text style={{ color: sc.color, fontSize: 11, fontWeight: "600" }}>{sc.label}</Text>
                  </TouchableOpacity>
                </View>

                {/* Details chips */}
                <View style={[st.chipRow, { borderTopColor: t.border }]}>
                  <View style={[st.chip, { backgroundColor: t.cardAlt }]}>
                    <Ionicons name="map-outline" size={12} color={t.textSec} />
                    <Text style={{ color: t.textSec, fontSize: 11 }}>{church.presbiterio}</Text>
                  </View>
                  <View style={[st.chip, { backgroundColor: t.cardAlt }]}>
                    <Ionicons name="compass-outline" size={12} color={t.textSec} />
                    <Text style={{ color: t.textSec, fontSize: 11 }}>{church.distrito}</Text>
                  </View>
                  {church.phone && (
                    <View style={[st.chip, { backgroundColor: t.cardAlt }]}>
                      <Ionicons name="call-outline" size={12} color={t.textSec} />
                      <Text style={{ color: t.textSec, fontSize: 11 }}>{church.phone}</Text>
                    </View>
                  )}
                </View>

                {/* Admin */}
                {church.admin_email && (
                  <View style={[st.adminRow, { backgroundColor: t.cardAlt, borderTopColor: t.border }]}>
                    <View style={[st.adminAva, { backgroundColor: t.accent + "18" }]}>
                      <Ionicons name="person" size={12} color={t.accent} />
                    </View>
                    <View style={st.flex}>
                      <Text style={{ color: t.text, fontSize: 12, fontWeight: "600" }}>{church.admin_name}</Text>
                      <Text style={{ color: t.textSec, fontSize: 11 }}>{church.admin_email}</Text>
                    </View>
                    <Text style={{ color: t.textSec + "60", fontSize: 10 }}>ADMIN</Text>
                  </View>
                )}
              </View>
            );
          })}
        </Animated.View>
        <View style={{ height: 110 }} />
      </ScrollView>

      {/* ─── FAB ──────────────────────────────────── */}
      <TouchableOpacity
        style={st.fab}
        onPress={() => { setForm({ ...emptyForm }); setError(null); setModalVisible(true); }}
        activeOpacity={0.85}
      >
        <View style={st.fabInner}>
          <Ionicons name="add" size={26} color="#fff" />
        </View>
      </TouchableOpacity>

      {/* ─── Modal ────────────────────────────────── */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={[st.flex, { backgroundColor: t.modalBg }]} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <ScrollView style={st.flex} showsVerticalScrollIndicator={false}>
            {/* Modal header */}
            <View style={[st.modalHead, { borderBottomColor: t.border }]}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={[st.modalCloseBtn, { backgroundColor: t.cardAlt }]}>
                <Ionicons name="close" size={20} color={t.text} />
              </TouchableOpacity>
              <View style={st.modalTitleWrap}>
                <Text style={[st.modalTitle, { color: t.text }]}>Nueva Iglesia</Text>
                <Text style={{ color: t.textSec, fontSize: 12 }}>Registro con administrador</Text>
              </View>
              <View style={{ width: 38 }} />
            </View>

            {/* Church section */}
            <View style={[st.mSection, { backgroundColor: t.card, borderColor: t.border }]}>
              <View style={st.mSectionH}>
                <View style={[st.mSectionIcon, { backgroundColor: t.accentBg }]}>
                  <Ionicons name="business" size={16} color={t.accent} />
                </View>
                <Text style={[st.mSectionTitle, { color: t.text }]}>Datos de la Iglesia</Text>
              </View>
              {renderInput("Nombre", "name", "text-outline", { required: true, placeholder: "Ej: Iglesia Bethel" })}
              {renderInput("Presbiterio", "presbiterio", "map-outline", { required: true })}
              {renderInput("Distrito", "distrito", "compass-outline", { required: true })}
              {renderInput("Dirección", "address", "location-outline", { placeholder: "Opcional" })}
              {renderInput("Teléfono", "phone", "call-outline", { keyboard: "phone-pad", placeholder: "Opcional" })}
            </View>

            {/* Admin section */}
            <View style={[st.mSection, { backgroundColor: t.card, borderColor: t.border }]}>
              <View style={st.mSectionH}>
                <View style={[st.mSectionIcon, { backgroundColor: "#a855f7" + "15" }]}>
                  <Ionicons name="person-add" size={16} color="#a855f7" />
                </View>
                <Text style={[st.mSectionTitle, { color: t.text }]}>Administrador</Text>
              </View>
              {renderInput("Nombre completo", "admin_name", "person-outline", { required: true })}
              {renderInput("Correo electrónico", "admin_email", "mail-outline", { required: true, keyboard: "email-address" })}
              {renderInput("Contraseña", "admin_password", "lock-closed-outline", { required: true, secure: true, placeholder: "Mínimo 8 caracteres" })}
            </View>

            {/* Actions */}
            <View style={st.mActions}>
              <TouchableOpacity
                style={[st.btnPrimary, submitting && { opacity: 0.7 }]}
                onPress={handleCreate}
                disabled={submitting}
                activeOpacity={0.85}
              >
                {submitting ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Ionicons name="checkmark-circle" size={18} color="#fff" />
                    <Text style={st.btnPTxt}>Crear Iglesia</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={[st.btnGhost, { borderColor: t.border }]} onPress={() => setModalVisible(false)}>
                <Text style={[st.btnGTxt, { color: t.textSec }]}>Cancelar</Text>
              </TouchableOpacity>
            </View>
            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const st = StyleSheet.create({
  flex: { flex: 1 },
  loadWrap: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  loadInner: { padding: 32, borderRadius: 20, alignItems: "center", gap: 14, width: "100%" },
  // Header
  header: {
    paddingTop: 64, paddingHorizontal: 24, paddingBottom: 16,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  title: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  sub: { fontSize: 13, marginTop: 3 },
  headerBadge: { width: 42, height: 42, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  // Error
  errWrap: {
    marginHorizontal: 20, padding: 14, borderRadius: 14,
    flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1,
  },
  errIcon: { width: 28, height: 28, borderRadius: 9, justifyContent: "center", alignItems: "center" },
  // List
  list: { paddingHorizontal: 20, paddingTop: 8 },
  // Card
  card: {
    borderRadius: 20, borderWidth: 1, marginBottom: 14, overflow: "hidden",
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3,
  },
  cardH: { flexDirection: "row", alignItems: "center", padding: 16, gap: 12 },
  ava: { width: 48, height: 48, borderRadius: 15, justifyContent: "center", alignItems: "center" },
  cName: { fontSize: 16, fontWeight: "700", letterSpacing: -0.2 },
  slugRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 3 },
  slugDot: { width: 4, height: 4, borderRadius: 2 },
  statusPill: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, gap: 5 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1, gap: 6 },
  chip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
  adminRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, gap: 10,
  },
  adminAva: { width: 28, height: 28, borderRadius: 9, justifyContent: "center", alignItems: "center" },
  // Empty
  emptyWrap: { padding: 44, borderRadius: 20, borderWidth: 1, alignItems: "center", gap: 12 },
  emptyIcon: { width: 68, height: 68, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  emptyTitle: { fontSize: 17, fontWeight: "700" },
  // FAB
  fab: {
    position: "absolute", bottom: 100, right: 22,
  },
  fabInner: {
    width: 58, height: 58, borderRadius: 20,
    backgroundColor: "#0ea5e9",
    justifyContent: "center", alignItems: "center",
    shadowColor: "#0ea5e9", shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 14, elevation: 10,
  },
  // Modal
  modalHead: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingTop: 20, paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1,
  },
  modalCloseBtn: { width: 38, height: 38, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  modalTitleWrap: { alignItems: "center" },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  mSection: { marginHorizontal: 20, marginTop: 20, borderRadius: 18, borderWidth: 1, padding: 20 },
  mSectionH: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  mSectionIcon: { width: 34, height: 34, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  mSectionTitle: { fontSize: 15, fontWeight: "700" },
  field: { marginBottom: 14 },
  label: { fontSize: 12, fontWeight: "600", marginBottom: 6, letterSpacing: 0.2 },
  inputWrap: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, height: 46, gap: 8 },
  input: { flex: 1, fontSize: 14, height: "100%" },
  mActions: { paddingHorizontal: 20, marginTop: 24, gap: 10 },
  btnPrimary: {
    height: 50, borderRadius: 16, backgroundColor: "#0ea5e9",
    flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8,
    shadowColor: "#0ea5e9", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  btnPTxt: { color: "#fff", fontSize: 15, fontWeight: "700" },
  btnGhost: { height: 46, borderRadius: 14, borderWidth: 1, justifyContent: "center", alignItems: "center" },
  btnGTxt: { fontSize: 14, fontWeight: "500" },
});
