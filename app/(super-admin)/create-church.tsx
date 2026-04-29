import React, { useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TextInput,
  TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView,
  Platform, useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSuperAdmin } from "@/src/modules/super-admin";
import type { ChurchFormValues } from "@/src/modules/super-admin";

export default function CreateChurchScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const { createChurch, isLoading, error, setError } = useSuperAdmin();

  const [form, setForm] = useState<ChurchFormValues>({
    name: "", presbiterio: "", distrito: "",
    address: "", phone: "",
    admin_name: "", admin_email: "", admin_password: "",
  });

  const c = {
    bg: isDark ? "#0f0f23" : "#f5f7fa",
    card: isDark ? "#1a1a2e" : "#ffffff",
    text: isDark ? "#e4e4e7" : "#18181b",
    muted: isDark ? "#a1a1aa" : "#71717a",
    input: isDark ? "#252540" : "#f3f4f6",
    accent: "#0a7ea4",
    red: "#ef4444",
    border: isDark ? "#2d2d44" : "#e5e7eb",
  };

  const updateField = (key: keyof ChurchFormValues, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    if (!form.name || !form.presbiterio || !form.distrito) {
      Alert.alert("Campos requeridos", "Nombre, presbiterio y distrito son obligatorios");
      return;
    }
    if (!form.admin_name || !form.admin_email || !form.admin_password) {
      Alert.alert("Campos requeridos", "Los datos del administrador son obligatorios");
      return;
    }
    if (form.admin_password.length < 8) {
      Alert.alert("Contraseña corta", "La contraseña debe tener al menos 8 caracteres");
      return;
    }
    try {
      setError(null);
      await createChurch(form);
      Alert.alert("¡Éxito!", `Iglesia "${form.name}" creada con su administrador`, [
        { text: "OK", onPress: () => router.replace("/(super-admin)/churches" as any) },
      ]);
    } catch (err: any) {
      Alert.alert("Error", err.message || "No se pudo crear la iglesia");
    }
  };

  const renderInput = (
    label: string, key: keyof ChurchFormValues, icon: string,
    opts: { keyboard?: any; secure?: boolean; required?: boolean; placeholder?: string } = {}
  ) => (
    <View style={st.field}>
      <Text style={[st.label, { color: c.text }]}>
        {label} {opts.required && <Text style={{ color: c.red }}>*</Text>}
      </Text>
      <View style={[st.inputWrap, { backgroundColor: c.input, borderColor: c.border }]}>
        <Ionicons name={icon as any} size={18} color={c.muted} />
        <TextInput
          style={[st.input, { color: c.text }]}
          value={form[key]}
          onChangeText={v => updateField(key, v)}
          placeholder={opts.placeholder || label}
          placeholderTextColor={c.muted}
          keyboardType={opts.keyboard || "default"}
          secureTextEntry={opts.secure}
          autoCapitalize={opts.keyboard === "email-address" ? "none" : "sentences"}
        />
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView style={[st.flex, { backgroundColor: c.bg }]} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView style={st.flex}>
        <View style={st.header}>
          <Text style={[st.title, { color: c.text }]}>Nueva Iglesia</Text>
          <Text style={[st.sub, { color: c.muted }]}>Registra una iglesia y su administrador</Text>
        </View>

        {error && (
          <View style={[st.err, { backgroundColor: c.red + "15" }]}>
            <Ionicons name="alert-circle" size={18} color={c.red} />
            <Text style={{ color: c.red, fontSize: 14, flex: 1 }}>{error}</Text>
          </View>
        )}

        {/* Datos de la iglesia */}
        <View style={[st.section, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={st.sectionHeader}>
            <Ionicons name="business" size={20} color={c.accent} />
            <Text style={[st.sectionTitle, { color: c.text }]}>Datos de la Iglesia</Text>
          </View>
          {renderInput("Nombre", "name", "text-outline", { required: true, placeholder: "Ej: Iglesia Bethel" })}
          {renderInput("Presbiterio", "presbiterio", "map-outline", { required: true })}
          {renderInput("Distrito", "distrito", "compass-outline", { required: true })}
          {renderInput("Dirección", "address", "location-outline", { placeholder: "Opcional" })}
          {renderInput("Teléfono", "phone", "call-outline", { keyboard: "phone-pad", placeholder: "Opcional" })}
        </View>

        {/* Datos del admin */}
        <View style={[st.section, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={st.sectionHeader}>
            <Ionicons name="person-add" size={20} color={c.accent} />
            <Text style={[st.sectionTitle, { color: c.text }]}>Administrador de la Iglesia</Text>
          </View>
          {renderInput("Nombre completo", "admin_name", "person-outline", { required: true })}
          {renderInput("Correo electrónico", "admin_email", "mail-outline", { required: true, keyboard: "email-address" })}
          {renderInput("Contraseña", "admin_password", "lock-closed-outline", { required: true, secure: true, placeholder: "Mínimo 8 caracteres" })}
        </View>

        {/* Submit */}
        <View style={st.actions}>
          <TouchableOpacity
            style={[st.btn, { backgroundColor: c.accent }, isLoading && st.btnOff]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? <ActivityIndicator color="#fff" /> : (
              <><Ionicons name="checkmark-circle" size={20} color="#fff" /><Text style={st.btnTxt}>Crear Iglesia</Text></>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  flex: { flex: 1 },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: "bold" },
  sub: { fontSize: 14, marginTop: 4 },
  err: { marginHorizontal: 20, marginTop: 12, padding: 12, borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 8 },
  section: { marginHorizontal: 20, marginTop: 20, borderRadius: 16, borderWidth: 1, padding: 20 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 },
  sectionTitle: { fontSize: 17, fontWeight: "600" },
  field: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "500", marginBottom: 6 },
  inputWrap: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, height: 50, gap: 10 },
  input: { flex: 1, fontSize: 15, height: "100%" },
  actions: { paddingHorizontal: 20, marginTop: 24 },
  btn: { height: 54, borderRadius: 14, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, shadowColor: "#0a7ea4", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 5 },
  btnOff: { opacity: 0.7 },
  btnTxt: { color: "#fff", fontSize: 17, fontWeight: "bold" },
});
