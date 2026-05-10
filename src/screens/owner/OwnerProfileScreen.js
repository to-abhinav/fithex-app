import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
} from "react-native-reanimated";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import colors from "../../theme/colors";
import api from "../../api/axios";

const { width: SW } = Dimensions.get("window");

const InfoRow = ({ icon, label, value, accent, delay, editable, onEdit }) => (
  <Animated.View
    entering={FadeInDown.delay(delay).duration(400)}
    style={s.infoRow}
  >
    <View style={[s.infoIconWrap, { backgroundColor: `${accent}1A` }]}>
      <Ionicons name={icon} size={18} color={accent} />
    </View>
    <View style={s.infoContent}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue} numberOfLines={1}>
        {value || "Not set"}
      </Text>
    </View>
    {editable && (
      <TouchableOpacity onPress={onEdit} style={s.editBtn} activeOpacity={0.7}>
        <Ionicons name="create-outline" size={16} color={colors.textMuted} />
      </TouchableOpacity>
    )}
  </Animated.View>
);

// Stat Chip
const StatChip = ({ icon, label, value, accent, delay }) => (
  <Animated.View
    entering={FadeInDown.delay(delay).springify().damping(18).stiffness(140)}
    style={s.statChip}
  >
    <View style={[s.statChipIcon, { backgroundColor: `${accent}1A` }]}>
      <Ionicons name={icon} size={16} color={accent} />
    </View>
    <Text style={s.statChipValue}>{value}</Text>
    <Text style={s.statChipLabel}>{label}</Text>
  </Animated.View>
);

//  Edit Modal 
const EditField = ({ label, value, onSave, onCancel, saving }) => {
  const [text, setText] = useState(value || "");
  return (
    <Animated.View entering={FadeIn.duration(250)} style={s.editOverlay}>
      <View style={s.editCard}>
        <Text style={s.editTitle}>Edit {label}</Text>
        <TextInput
          style={s.editInput}
          value={text}
          onChangeText={setText}
          placeholder={`Enter ${label.toLowerCase()}`}
          placeholderTextColor={colors.textMuted}
          autoFocus
        />
        <View style={s.editActions}>
          <TouchableOpacity onPress={onCancel} style={s.editCancelBtn}>
            <Text style={s.editCancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onSave(text)}
            style={s.editSaveBtn}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark" size={16} color="#FFF" />
                <Text style={s.editSaveText}>Save</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

// ─── Main Screen 
const OwnerProfileScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState(null);
  const [gymStats, setGymStats] = useState({ gymName: "", memberCount: 0, planCount: 0 });
  const [editField, setEditField] = useState(null); // { key, label, value }

  // Fetch profile data
  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const [profileRes, gymRes] = await Promise.allSettled([
        api.get("/auth/me"),
        api.get("/gyms/owner/mine"),
      ]);

      if (profileRes.status === "fulfilled") {
        setUser(profileRes.value?.data);
      }

      if (gymRes.status === "fulfilled") {
        const gym = gymRes.value?.data?.gym || gymRes.value?.data;
        setGymStats({
          gymName: gym?.name || "",
          memberCount: gym?.members?.length || gym?.memberCount || 0,
          planCount: gym?.plans?.length || gym?.planCount || 0,
        });
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile])
  );

  // ── Handle avatar upload 
  const handleAvatarPress = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please allow access to your photo library.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]) {
      try {
        setUploading(true);
        const uri = result.assets[0].uri;
        const formData = new FormData();
        formData.append("profileImage", {
          uri,
          name: "profile.jpg",
          type: "image/jpeg",
        });

        await api.put("/auth/profile-image", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        // Refresh profile
        await fetchProfile();
      } catch (e) {
        Alert.alert("Upload Failed", e?.response?.data?.message || "Could not upload image.");
      } finally {
        setUploading(false);
      }
    }
  }, [fetchProfile]);

  // ── Handle field edit 
  const handleSaveField = useCallback(
    async (newValue) => {
      if (!editField) return;
      try {
        setSaving(true);
        await api.put("/auth/profile", { [editField.key]: newValue });
        setEditField(null);
        await fetchProfile();
      } catch (e) {
        Alert.alert("Update Failed", e?.response?.data?.message || "Could not update profile.");
      } finally {
        setSaving(false);
      }
    },
    [editField, fetchProfile]
  );

  // ── Member Since 
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
      })
    : "";

  // ── Role label 
  const roleLabel = user?.role === "gymOwner" ? "Gym Owner" : user?.role || "Owner";

  if (loading) {
    return (
      <View style={[s.container, s.center]}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={[`${colors.secondary}30`, `${colors.primary}18`, "rgba(0,0,0,0)"]}
        locations={[0, 0.45, 1]}
        style={s.bgGrad}
      />

      <Animated.View
        entering={FadeInDown.delay(0).duration(1200)}
        pointerEvents="none"
        style={[s.glowOrb, { width: 300, height: 300, borderRadius: 150, backgroundColor: `${colors.secondary}18`, top: -100, left: SW / 2 - 150 }]}
      />
      <Animated.View
        entering={FadeInDown.delay(600).duration(1200)}
        pointerEvents="none"
        style={[s.glowOrb, { width: 180, height: 180, borderRadius: 90, backgroundColor: `${colors.primary}12`, top: 350, left: -60 }]}
      />

      <Animated.View
        entering={FadeInDown.duration(500)}
        style={s.header}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={s.backBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerLabel}>GYM OPERATIONS</Text>
          <Text style={s.headerTitle}>Owner Profile</Text>
        </View>
      </Animated.View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            entering={FadeInDown.delay(100).springify().damping(18).stiffness(140)}
            style={s.avatarSection}
          >
            <TouchableOpacity
              onPress={handleAvatarPress}
              activeOpacity={0.8}
              style={s.avatarOuter}
            >
              <LinearGradient
                colors={[colors.primary, colors.secondary, colors.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.avatarRing}
              >
                <View style={s.avatarInner}>
                  {user?.profileImage ? (
                    <Image
                      source={{ uri: user.profileImage }}
                      style={s.avatarImage}
                    />
                  ) : (
                    <View style={s.avatarFallback}>
                      <Text style={s.avatarInitial}>
                        {user?.name ? user.name.charAt(0).toUpperCase() : "O"}
                      </Text>
                    </View>
                  )}
                </View>
              </LinearGradient>

              <View style={s.cameraBadge}>
                {uploading ? (
                  <ActivityIndicator color="#FFF" size={12} />
                ) : (
                  <Ionicons name="camera" size={14} color="#FFF" />
                )}
              </View>
            </TouchableOpacity>

            <Text style={s.profileName}>{user?.name || "Gym Owner"}</Text>
            <View style={s.roleChip}>
              <Ionicons name="shield-checkmark" size={12} color={colors.primary} />
              <Text style={s.roleText}>{roleLabel}</Text>
            </View>
            {memberSince ? (
              <Text style={s.memberSince}>Member since {memberSince}</Text>
            ) : null}
          </Animated.View>

          <View style={s.statsRow}>
            <StatChip
              icon="fitness-outline"
              label="Gym"
              value={gymStats.gymName || "—"}
              accent={colors.primary}
              delay={200}
            />
            <StatChip
              icon="people-outline"
              label="Members"
              value={gymStats.memberCount}
              accent={colors.success}
              delay={280}
            />
            <StatChip
              icon="pricetag-outline"
              label="Plans"
              value={gymStats.planCount}
              accent={colors.warning}
              delay={360}
            />
          </View>

          <Animated.View
            entering={FadeInDown.delay(300).duration(400)}
            style={s.sectionHeader}
          >
            <View style={s.sectionDot} />
            <Ionicons name="person-outline" size={14} color={colors.textMuted} />
            <Text style={s.sectionLabel}>PERSONAL INFORMATION</Text>
          </Animated.View>

          <View style={s.infoCard}>
            <InfoRow
              icon="person-outline"
              label="Full Name"
              value={user?.name}
              accent={colors.primary}
              delay={350}
              editable
              onEdit={() =>
                setEditField({ key: "name", label: "Name", value: user?.name })
              }
            />
            <View style={s.divider} />
            <InfoRow
              icon="mail-outline"
              label="Email"
              value={user?.email}
              accent="#3B82F6"
              delay={400}
              editable
              onEdit={() =>
                setEditField({ key: "email", label: "Email", value: user?.email })
              }
            />
            <View style={s.divider} />
            <InfoRow
              icon="call-outline"
              label="Phone"
              value={user?.phone}
              accent={colors.success}
              delay={450}
              editable
              onEdit={() =>
                setEditField({ key: "phone", label: "Phone", value: user?.phone })
              }
            />
          </View>

          <Animated.View
            entering={FadeInDown.delay(500).duration(400)}
            style={s.sectionHeader}
          >
            <View style={s.sectionDot} />
            <Ionicons name="key-outline" size={14} color={colors.textMuted} />
            <Text style={s.sectionLabel}>ACCOUNT DETAILS</Text>
          </Animated.View>

          <View style={s.infoCard}>
            <InfoRow
              icon="shield-checkmark-outline"
              label="Role"
              value={roleLabel}
              accent={colors.secondary}
              delay={550}
            />
            <View style={s.divider} />
            <InfoRow
              icon="calendar-outline"
              label="Joined"
              value={
                user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "—"
              }
              accent={colors.accent}
              delay={600}
            />
            <View style={s.divider} />
            <InfoRow
              icon="finger-print-outline"
              label="User ID"
              value={user?._id ? `...${user._id.slice(-8)}` : "—"}
              accent={colors.textMuted}
              delay={650}
            />
          </View>

          {/* Bottom spacer */}
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {editField && (
        <EditField
          label={editField.label}
          value={editField.value}
          onSave={handleSaveField}
          onCancel={() => setEditField(null)}
          saving={saving}
        />
      )}
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { alignItems: "center", justifyContent: "center" },
  bgGrad: { position: "absolute", top: 0, left: 0, right: 0, height: 380 },
  glowOrb: { position: "absolute", opacity: 0.6 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 12,
    gap: 14,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: `${colors.primary}1A`,
    borderWidth: 1,
    borderColor: `${colors.primary}40`,
    alignItems: "center",
    justifyContent: "center",
  },
  headerLabel: {
    fontSize: 10,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 2,
    fontWeight: "700",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.textPrimary,
    marginTop: 2,
  },

  // Scroll
  scroll: { paddingHorizontal: 20, paddingTop: 8 },

  // Avatar Section
  avatarSection: { alignItems: "center", marginBottom: 24 },
  avatarOuter: { position: "relative", marginBottom: 16 },
  avatarRing: {
    width: 108,
    height: 108,
    borderRadius: 36,
    padding: 3,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 33,
    overflow: "hidden",
    backgroundColor: colors.background,
  },
  avatarImage: { width: "100%", height: "100%", resizeMode: "cover" },
  avatarFallback: {
    flex: 1,
    backgroundColor: `${colors.primary}20`,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontSize: 38,
    fontWeight: "900",
    color: colors.primary,
  },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  profileName: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.textPrimary,
    textAlign: "center",
  },
  roleChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: `${colors.primary}15`,
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
  },
  roleText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  memberSince: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 8,
  },

  // Quick Stats
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 28,
  },
  statChip: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
  },
  statChipIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statChipValue: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.textPrimary,
    textAlign: "center",
  },
  statChipLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.textMuted,
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    paddingLeft: 2,
  },
  sectionDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textMuted,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },

  infoCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 4,
    marginBottom: 24,
    overflow: "hidden",
  },

  // Info Row
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 14,
  },
  infoIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  infoContent: { flex: 1 },
  infoLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  editBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: `${colors.textMuted}15`,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 14,
  },

  // Edit Overlay
  editOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
    zIndex: 100,
  },
  editCard: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  editTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textPrimary,
    marginBottom: 16,
  },
  editInput: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  editActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  editCancelBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  editCancelText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textMuted,
  },
  editSaveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  editSaveText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFF",
  },
});

export default OwnerProfileScreen;
