import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useFocusEffect } from "@react-navigation/native";
import colors from "../../theme/colors";
import { useToast } from "../../context/ToastContext";
import { getMyGym, saveRazorpayCredentials, getRazorpayStatus } from "../../api/gymService";

const { width: SW } = Dimensions.get("window");

export default function RazorpaySettingsScreen({ navigation }) {
  const toast = useToast();
  const [gym, setGym] = useState(null);
  const [keyId, setKeyId] = useState("");
  const [keySecret, setKeySecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);
  const [maskedKeyId, setMaskedKeyId] = useState("");

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      const fetchData = async () => {
        try {
          setLoading(true);
          const gymData = await getMyGym();
          const gymObj = gymData?.gym || gymData;

          if (cancelled) return;
          setGym(gymObj);

          if (gymObj?._id) {
            const status = await getRazorpayStatus(gymObj._id);
            if (cancelled) return;
            setIsConfigured(status.isConfigured);
            setMaskedKeyId(status.maskedKeyId || "");
          }
        } catch {
          // silently fail
        } finally {
          if (!cancelled) setLoading(false);
        }
      };

      fetchData();
      return () => { cancelled = true; };
    }, [])
  );

  const handleSave = async () => {
    if (!keyId.trim()) {
      return toast.error("Please enter your Razorpay Key ID");
    }
    if (!keySecret.trim()) {
      return toast.error("Please enter your Razorpay Key Secret");
    }
    if (keyId.trim().length < 10) {
      return toast.error("Razorpay Key ID seems too short");
    }
    if (keySecret.trim().length < 10) {
      return toast.error("Razorpay Key Secret seems too short");
    }

    try {
      setSaving(true);
      const result = await saveRazorpayCredentials(gym._id, keyId.trim(), keySecret.trim());
      setIsConfigured(true);
      setMaskedKeyId(result.maskedKeyId || "");
      setKeyId("");
      setKeySecret("");
      toast.success("Razorpay credentials saved successfully!");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save credentials. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Background gradient */}
      <LinearGradient
        colors={[`${colors.success}22`, `${colors.primary}14`, "rgba(0,0,0,0)"]}
        locations={[0, 0.45, 1]}
        style={styles.bgGrad}
      />
      <View style={styles.orb1} />
      <View style={styles.orb2} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(0).duration(400)} style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerLabel}>SETTINGS</Text>
            <Text style={styles.headerTitle}>Payment Gateway</Text>
          </View>
        </Animated.View>

        {/* Info Card */}
        <Animated.View entering={FadeInDown.delay(80).springify()} style={styles.section}>
          <View style={styles.card}>
            <View style={styles.infoIconRow}>
              <View style={[styles.infoIconWrap, { backgroundColor: `${colors.info}1A` }]}>
                <Ionicons name="information-circle" size={20} color={colors.info} />
              </View>
              <Text style={styles.infoTitle}>How it works</Text>
            </View>
            <Text style={styles.infoText}>
              Connect your Razorpay account so members can pay directly to you. Online payments
              will use these credentials for secure checkout.
            </Text>
            <View style={styles.infoDivider} />
            <View style={styles.infoStep}>
              <View style={styles.stepDot}>
                <Text style={styles.stepNum}>1</Text>
              </View>
              <Text style={styles.stepText}>
                Log in to your{" "}
                <Text style={{ color: colors.info, fontWeight: "700" }}>Razorpay Dashboard</Text>
              </Text>
            </View>
            <View style={styles.infoStep}>
              <View style={styles.stepDot}>
                <Text style={styles.stepNum}>2</Text>
              </View>
              <Text style={styles.stepText}>
                Go to <Text style={{ fontWeight: "700", color: "rgba(255,255,255,0.7)" }}>Settings → API Keys</Text>
              </Text>
            </View>
            <View style={styles.infoStep}>
              <View style={styles.stepDot}>
                <Text style={styles.stepNum}>3</Text>
              </View>
              <Text style={styles.stepText}>Copy your Key ID and Key Secret, and paste them below</Text>
            </View>
          </View>
        </Animated.View>

        {/* Current Status Card */}
        {isConfigured && (
          <Animated.View entering={FadeInDown.delay(120).springify()} style={styles.section}>
            <View style={[styles.card, styles.statusCard]}>
              <View style={styles.statusRow}>
                <View style={[styles.statusIconWrap, { backgroundColor: `${colors.success}1A` }]}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.statusTitle}>Razorpay Connected</Text>
                  <Text style={styles.statusMasked}>{maskedKeyId}</Text>
                </View>
                <View style={styles.activeBadge}>
                  <View style={styles.activeDot} />
                  <Text style={styles.activeText}>Active</Text>
                </View>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Form Card */}
        <Animated.View entering={FadeInDown.delay(160).springify()} style={styles.section}>
          <View style={styles.card}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <Ionicons name="key-outline" size={14} color={colors.textMuted} />
              <Text style={styles.formSectionLabel}>
                {isConfigured ? "UPDATE CREDENTIALS" : "ENTER CREDENTIALS"}
              </Text>
            </View>

            {/* Key ID */}
            <Text style={styles.inputLabel}>Razorpay Key ID</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="card-outline" size={16} color={colors.textMuted} style={{ marginRight: 10 }} />
              <TextInput
                value={keyId}
                onChangeText={setKeyId}
                placeholder="rzp_live_xxxxxxxxxx"
                placeholderTextColor={colors.textDisabled}
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Key Secret */}
            <Text style={[styles.inputLabel, { marginTop: 16 }]}>Razorpay Key Secret</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={16} color={colors.textMuted} style={{ marginRight: 10 }} />
              <TextInput
                value={keySecret}
                onChangeText={setKeySecret}
                placeholder="••••••••••••••••"
                placeholderTextColor={colors.textDisabled}
                style={[styles.input, { flex: 1 }]}
                secureTextEntry={!showSecret}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setShowSecret(!showSecret)}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={showSecret ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            </View>

            {/* Security note */}
            <View style={styles.securityNote}>
              <Ionicons name="shield-checkmark-outline" size={13} color={colors.success} />
              <Text style={styles.securityText}>
                Your credentials are encrypted with AES-256 before storage. They are never logged or exposed.
              </Text>
            </View>

            {/* Save button */}
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving || !keyId.trim() || !keySecret.trim()}
              activeOpacity={0.88}
              style={{ borderRadius: 16, overflow: "hidden", marginTop: 20, opacity: (saving || !keyId.trim() || !keySecret.trim()) ? 0.5 : 1 }}
            >
              <LinearGradient
                colors={saving ? ["#374151", "#374151"] : [colors.success, colors.successDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveBtn}
              >
                {saving ? (
                  <>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={styles.saveBtnText}>Saving…</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="save-outline" size={18} color="#fff" />
                    <Text style={styles.saveBtnText}>
                      {isConfigured ? "Update Credentials" : "Save Credentials"}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Warning note */}
        <Animated.View entering={FadeInUp.delay(240).springify()} style={[styles.section, { marginBottom: 40 }]}>
          <View style={styles.warningCard}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.warning} />
            <Text style={styles.warningText}>
              If you change your API keys in Razorpay, make sure to update them here too or
              payments will fail.
            </Text>
          </View>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  bgGrad: { position: "absolute", top: 0, left: 0, right: 0, height: 380 },
  orb1: {
    position: "absolute", top: -80, right: -80,
    width: 240, height: 240, borderRadius: 120,
    backgroundColor: colors.success, opacity: 0.05,
  },
  orb2: {
    position: "absolute", top: 300, left: -60,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: colors.primary, opacity: 0.04,
  },

  scroll: { paddingHorizontal: 20, paddingTop: 4 },

  // Header
  header: {
    flexDirection: "row", alignItems: "center",
    paddingTop: 54, paddingBottom: 20, gap: 14,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 14,
    backgroundColor: colors.surface, borderWidth: 1,
    borderColor: colors.border, alignItems: "center",
    justifyContent: "center",
  },
  headerLabel: {
    fontSize: 10, color: colors.textMuted,
    textTransform: "uppercase", letterSpacing: 1.5, fontWeight: "700",
  },
  headerTitle: {
    fontSize: 22, fontWeight: "800", color: colors.textPrimary, marginTop: 2,
  },

  section: { marginBottom: 16 },

  // Card
  card: {
    borderRadius: 20, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, padding: 20,
  },

  // Info card
  infoIconRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  infoIconWrap: {
    width: 36, height: 36, borderRadius: 11,
    alignItems: "center", justifyContent: "center",
  },
  infoTitle: { fontSize: 15, fontWeight: "700", color: colors.textPrimary },
  infoText: {
    fontSize: 13, color: colors.textSecondary, lineHeight: 20, fontWeight: "400",
  },
  infoDivider: {
    height: 1, backgroundColor: colors.border, marginVertical: 16,
  },
  infoStep: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  stepDot: {
    width: 24, height: 24, borderRadius: 8,
    backgroundColor: `${colors.primary}1A`, alignItems: "center",
    justifyContent: "center",
  },
  stepNum: { fontSize: 11, fontWeight: "800", color: colors.primary },
  stepText: { fontSize: 13, color: colors.textMuted, flex: 1, lineHeight: 18 },

  // Status card
  statusCard: { borderColor: `${colors.success}30` },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  statusIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  statusTitle: { fontSize: 14, fontWeight: "700", color: colors.textPrimary },
  statusMasked: { fontSize: 12, fontWeight: "500", color: colors.textMuted, marginTop: 2 },
  activeBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 100, backgroundColor: `${colors.success}15`,
    borderWidth: 1, borderColor: `${colors.success}30`,
  },
  activeDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success,
  },
  activeText: { fontSize: 10, fontWeight: "700", color: colors.success },

  // Form
  formSectionLabel: {
    fontSize: 10, color: colors.textMuted, fontWeight: "700",
    textTransform: "uppercase", letterSpacing: 1.4,
  },
  inputLabel: {
    fontSize: 12, fontWeight: "600", color: colors.textSecondary, marginBottom: 8,
  },
  inputWrap: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: colors.background, borderWidth: 1,
    borderColor: colors.border, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  input: {
    flex: 1, fontSize: 14, color: colors.textPrimary, fontWeight: "500",
  },

  // Security
  securityNote: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    marginTop: 14, paddingHorizontal: 4,
  },
  securityText: {
    fontSize: 11, color: colors.textMuted, lineHeight: 16, flex: 1,
  },

  // Save button
  saveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, paddingVertical: 16,
  },
  saveBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },

  // Warning
  warningCard: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    backgroundColor: `${colors.warning}08`, borderWidth: 1,
    borderColor: `${colors.warning}20`, borderRadius: 14,
    padding: 14,
  },
  warningText: {
    fontSize: 12, color: colors.textMuted, lineHeight: 18, flex: 1,
  },
});
