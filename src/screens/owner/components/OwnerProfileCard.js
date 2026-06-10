import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  FlatList,
  Platform,
  Dimensions,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  FadeInDown,
  FadeInUp,
  SlideInDown,
  Easing,
} from "react-native-reanimated";
import * as ImagePicker from "expo-image-picker";
import api from "../../../api/axios";
import colors from "../../../theme/colors";
import { useToast } from "../../../context/ToastContext";

const DEFAULT_AVATAR =
  "https://res.cloudinary.com/dlkre2bxo/image/upload/f_auto,q_auto/v1777577974/avatar_1.png";

const OwnerProfileCard = () => {
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showPicker, setShowPicker] = useState(false);
  const [pickerTab, setPickerTab] = useState("avatar");
  const [avatars, setAvatars] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selectedAvatarId, setSelectedAvatarId] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get("/auth/profile");
      setUser(res.data);
    } catch (err) {
      console.error("Error fetching owner profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvatars = useCallback(async () => {
    try {
      const res = await api.get("/users/avatars");
      setAvatars(res.data.avatars || []);
    } catch (err) {
      console.error("Error fetching avatars:", err);
    }
  }, []);

  const openPicker = () => {
    setShowPicker(true);
    if (avatars.length === 0) fetchAvatars();
  };

  const handleAvatarSelect = async (avatarId) => {
    try {
      setUploading(true);
      setSelectedAvatarId(avatarId);
      const res = await api.patch("/users/profile-image", { avatarId });
      setUser((prev) => ({ ...prev, profileImage: res.data.profileImage }));
      setShowPicker(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update avatar.");
    } finally {
      setUploading(false);
      setSelectedAvatarId(null);
    }
  };

  const pickImage = async (useCamera = false) => {
    try {
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          toast.warning("Camera access is needed.", "Permission Required");
          return;
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          toast.warning("Photo library access is needed.", "Permission Required");
          return;
        }
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], allowsEditing: false, quality: 0.8 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: false, quality: 0.8 });

      if (result.canceled) return;

      const asset = result.assets[0];
      setUploading(true);

      const formData = new FormData();
      formData.append("profileImage", {
        uri: Platform.OS === "ios" ? asset.uri.replace("file://", "") : asset.uri,
        type: asset.mimeType || "image/jpeg",
        name: asset.fileName || `profile_${Date.now()}.jpg`,
      });

      const res = await api.patch("/users/profile-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setUser((prev) => ({ ...prev, profileImage: res.data.profileImage }));
      setShowPicker(false);
    } catch (err) {
      console.error("Upload error:", err);
      toast.error(err.response?.data?.message || "Something went wrong.", "Upload Failed");
    } finally {
      setUploading(false);
    }
  };

  const displayName = user?.name || "Gym Owner";
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "N/A";

  if (loading) {
    return (
      <Animated.View entering={FadeInDown.delay(50).duration(400)} style={s.card}>
        <View style={s.loadingWrap}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={s.loadingText}>Loading profile…</Text>
        </View>
      </Animated.View>
    );
  }

  if (!user) return null;

  return (
    <>
      <Animated.View entering={FadeInDown.delay(50).duration(500)} style={s.card}>
        <LinearGradient
          colors={[`${colors.primary}40`, `${colors.secondary}25`, "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.cardGradient}
        />

        <View style={s.sectionHeader}>
          <Ionicons name="person-circle-outline" size={16} color={colors.primary} />
          <Text style={s.sectionTitle}>Owner Profile</Text>
        </View>

        <View style={s.profileRow}>
          {/* Avatar with gradient ring */}
          <TouchableOpacity activeOpacity={0.85} onPress={openPicker} style={s.avatarWrap}>
            <LinearGradient
              colors={[colors.primary, colors.secondary, colors.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.avatarRing}
            >
              <Image
                source={{ uri: user?.profileImage || DEFAULT_AVATAR }}
                style={s.avatarImage}
              />
            </LinearGradient>
            <View style={s.cameraBadge}>
              <Ionicons name="camera" size={11} color="#fff" />
            </View>
          </TouchableOpacity>

          {/* Info */}
          <View style={s.infoCol}>
            <Text style={s.ownerName}>{displayName}</Text>

            <View style={s.roleBadge}>
              <Ionicons name="shield-checkmark" size={11} color={colors.primary} />
              <Text style={s.roleBadgeText}>Gym Owner</Text>
            </View>
          </View>
        </View>

        <View style={s.detailsGrid}>
          {/* Email */}
          {user?.email && (
            <View style={s.detailItem}>
              <View style={[s.detailIcon, { backgroundColor: `${colors.primary}1A` }]}>
                <Ionicons name="mail-outline" size={14} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.detailLabel}>Email</Text>
                <Text style={s.detailValue} numberOfLines={1}>{user.email}</Text>
              </View>
            </View>
          )}

          {/* Phone */}
          {user?.phone && (
            <View style={s.detailItem}>
              <View style={[s.detailIcon, { backgroundColor: `${colors.accent}1A` }]}>
                <Ionicons name="call-outline" size={14} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.detailLabel}>Phone</Text>
                <Text style={s.detailValue}>{user.phone}</Text>
              </View>
            </View>
          )}

          {/* Date Joined */}
          <View style={s.detailItem}>
            <View style={[s.detailIcon, { backgroundColor: `${colors.success}1A` }]}>
              <Ionicons name="calendar-outline" size={14} color={colors.success} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.detailLabel}>Date Joined</Text>
              <Text style={s.detailValue}>{memberSince}</Text>
            </View>
          </View>
        </View>
      </Animated.View>

      <Modal
        visible={showPicker}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => !uploading && setShowPicker(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => !uploading && setShowPicker(false)}
          style={s.modalBackdrop}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <Animated.View
              entering={SlideInDown.duration(350).easing(Easing.out(Easing.cubic))}
              style={s.sheet}
            >
              {/* Handle bar */}
              <View style={s.handleWrap}>
                <View style={s.handle} />
              </View>

              <Text style={s.sheetTitle}>Change Profile Photo</Text>

              {/* Tab pills */}
              <View style={s.tabRow}>
                {["avatar", "upload"].map((tab) => (
                  <TouchableOpacity
                    key={tab}
                    activeOpacity={0.8}
                    onPress={() => setPickerTab(tab)}
                    style={{ flex: 1 }}
                  >
                    {pickerTab === tab ? (
                      <LinearGradient
                        colors={[colors.primary, colors.secondary]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={s.tabActive}
                      >
                        <Ionicons
                          name={tab === "avatar" ? "people" : "cloud-upload"}
                          size={14}
                          color="#fff"
                        />
                        <Text style={s.tabActiveText}>
                          {tab === "avatar" ? "Choose Avatar" : "Upload Photo"}
                        </Text>
                      </LinearGradient>
                    ) : (
                      <View style={s.tabInactive}>
                        <Ionicons
                          name={tab === "avatar" ? "people-outline" : "cloud-upload-outline"}
                          size={14}
                          color={colors.textMuted}
                        />
                        <Text style={s.tabInactiveText}>
                          {tab === "avatar" ? "Choose Avatar" : "Upload Photo"}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Tab content */}
              {pickerTab === "avatar" ? (
                <FlatList
                  data={avatars}
                  keyExtractor={(item) => item.id}
                  numColumns={4}
                  contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }}
                  columnWrapperStyle={{ gap: 12, marginBottom: 12 }}
                  showsVerticalScrollIndicator={false}
                  ListEmptyComponent={
                    <View style={s.emptyWrap}>
                      <ActivityIndicator size="small" color={colors.primary} />
                      <Text style={s.emptyText}>Loading avatars…</Text>
                    </View>
                  }
                  renderItem={({ item }) => {
                    const isSelected = user?.profileImage === item.url;
                    const isSelecting = selectedAvatarId === item.id && uploading;
                    return (
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => handleAvatarSelect(item.id)}
                        disabled={uploading}
                        style={{ flex: 1, alignItems: "center" }}
                      >
                        <View style={[s.avatarOption, isSelected && s.avatarOptionSelected]}>
                          <Image source={{ uri: item.url }} style={s.avatarOptionImg} resizeMode="cover" />
                          {isSelecting && (
                            <View style={s.avatarOptionOverlay}>
                              <ActivityIndicator size="small" color="#fff" />
                            </View>
                          )}
                        </View>
                        {isSelected && (
                          <View style={s.avatarCheck}>
                            <Ionicons name="checkmark" size={11} color="#fff" />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  }}
                />
              ) : (
                <View style={{ paddingHorizontal: 20, gap: 12 }}>
                  {/* Camera */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => pickImage(true)}
                    disabled={uploading}
                    style={s.uploadOption}
                  >
                    <View style={[s.uploadOptionIcon, { backgroundColor: `${colors.primary}1F`, borderColor: `${colors.primary}40` }]}>
                      <Ionicons name="camera-outline" size={22} color="#a5b4fc" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.uploadOptionTitle}>Take Photo</Text>
                      <Text style={s.uploadOptionSub}>Use your camera to snap a new pic</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                  </TouchableOpacity>

                  {/* Library */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => pickImage(false)}
                    disabled={uploading}
                    style={s.uploadOption}
                  >
                    <View style={[s.uploadOptionIcon, { backgroundColor: `${colors.secondary}1F`, borderColor: `${colors.secondary}40` }]}>
                      <Ionicons name="images-outline" size={22} color="#c4b5fd" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.uploadOptionTitle}>Choose from Library</Text>
                      <Text style={s.uploadOptionSub}>Pick an existing photo from your gallery</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                  </TouchableOpacity>

                  {uploading && (
                    <View style={s.uploadingRow}>
                      <ActivityIndicator size="small" color={colors.primary} />
                      <Text style={s.uploadingText}>Uploading…</Text>
                    </View>
                  )}
                </View>
              )}
            </Animated.View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const s = StyleSheet.create({
  // Card
  card: {
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 18,
    overflow: "hidden",
  },
  cardGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  loadingWrap: { alignItems: "center", paddingVertical: 28 },
  loadingText: { color: colors.textMuted, fontSize: 12, marginTop: 8, fontWeight: "500" },

  // Section header
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: colors.textPrimary },

  // Profile row
  profileRow: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 18 },
  avatarWrap: { position: "relative" },
  avatarRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2.5,
    borderColor: colors.background,
  },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  infoCol: { flex: 1 },
  ownerName: { fontSize: 18, fontWeight: "800", color: colors.textPrimary, letterSpacing: -0.3 },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 6,
    alignSelf: "flex-start",
    backgroundColor: `${colors.primary}18`,
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  roleBadgeText: { fontSize: 11, fontWeight: "700", color: colors.primary },

  // Details grid
  detailsGrid: {
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 14,
  },
  detailItem: { flexDirection: "row", alignItems: "center", gap: 12 },
  detailIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  detailLabel: { fontSize: 10, fontWeight: "600", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.8 },
  detailValue: { fontSize: 13, fontWeight: "600", color: colors.textPrimary, marginTop: 1 },

  // Modal
  modalBackdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#111118",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: `${colors.primary}25`,
    borderBottomWidth: 0,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    maxHeight: Dimensions.get("window").height * 0.8,
  },
  handleWrap: { alignItems: "center", paddingTop: 12, paddingBottom: 8 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.15)" },
  sheetTitle: { textAlign: "center", fontSize: 17, fontWeight: "800", color: "#fff", letterSpacing: -0.3, marginBottom: 16 },

  // Tabs
  tabRow: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 18,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    padding: 4,
  },
  tabActive: {
    borderRadius: 11,
    paddingVertical: 10,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  tabActiveText: { fontSize: 13, fontWeight: "700", color: "#fff" },
  tabInactive: {
    borderRadius: 11,
    paddingVertical: 10,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  tabInactiveText: { fontSize: 13, fontWeight: "600", color: colors.textMuted },

  // Avatar grid
  emptyWrap: { alignItems: "center", paddingVertical: 32 },
  emptyText: { color: colors.textMuted, fontSize: 12, marginTop: 10 },
  avatarOption: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2.5,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 3,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  avatarOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}1F`,
  },
  avatarOptionImg: { width: "100%", height: "100%", borderRadius: 34 },
  avatarOptionOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 34,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarCheck: {
    position: "absolute",
    bottom: -2,
    right: "50%",
    marginRight: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: "#111118",
    alignItems: "center",
    justifyContent: "center",
  },

  // Upload options
  uploadOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  uploadOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadOptionTitle: { fontSize: 15, fontWeight: "700", color: "#fff" },
  uploadOptionSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  uploadingRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 14 },
  uploadingText: { color: colors.textSecondary, fontSize: 13, fontWeight: "600" },
});

export default OwnerProfileCard;
