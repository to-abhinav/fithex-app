import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Alert,
  Modal,
  FlatList,
  Platform,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  FadeInDown,
  FadeInUp,
  FadeIn,
  Easing,
  interpolate,
  SlideInRight,
  SlideInDown,
} from "react-native-reanimated";
import * as ImagePicker from "expo-image-picker";
import api from "../../api/axios";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Dynamic Greeting ────────────────────────────────────────────────────────
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

// ─── Animated Glow Orb ──────────────────────────────────────────────────────
const GlowOrb = ({ size, color, top, left, delay = 0 }) => {
  const pulse = useSharedValue(0.25);

  useEffect(() => {
    pulse.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.55, { duration: 3500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.25, { duration: 3500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: pulse.value,
    transform: [{ scale: interpolate(pulse.value, [0.25, 0.55], [0.92, 1.08]) }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          top,
          left,
        },
        style,
      ]}
    />
  );
};

// ─── Stat Card (Ionicons, uniform height) ───────────────────────────────────
const StatCard = ({ value, label, iconName, color, bgColor, borderColor, delay }) => (
  <Animated.View
    entering={FadeInDown.delay(delay).springify()}
    style={{ flex: 1 }}
  >
    <View
      style={{
        backgroundColor: bgColor,
        borderWidth: 1,
        borderColor: borderColor,
        borderRadius: 20,
        paddingVertical: 14,
        paddingHorizontal: 8,
        alignItems: "center",
        justifyContent: "center",
        minHeight: 110,
      }}
    >
      <Ionicons name={iconName} size={20} color={color} style={{ marginBottom: 6 }} />
      <Text
        style={{
          fontSize: 16,
          fontWeight: "900",
          color,
          letterSpacing: -0.5,
          textAlign: "center",
        }}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
      >
        {value}
      </Text>
      <Text
        style={{
          fontSize: 9,
          color: "rgba(255,255,255,0.35)",
          fontWeight: "600",
          textTransform: "uppercase",
          letterSpacing: 0.8,
          marginTop: 3,
          textAlign: "center",
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  </Animated.View>
);

// ─── Activity Log Item (Ionicons, no emoji) ────────────────────────────────
const ActivityItem = ({ iconName, title, subtitle, badge, badgeColor, delay }) => (
  <Animated.View entering={SlideInRight.delay(delay).springify()}>
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.05)",
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: "rgba(99,102,241,0.12)",
          borderWidth: 1,
          borderColor: "rgba(99,102,241,0.2)",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        <Ionicons name={iconName} size={18} color="#a5b4fc" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}>{title}</Text>
        <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>
          {subtitle}
        </Text>
      </View>
      <View
        style={{
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 20,
          backgroundColor: badgeColor || "rgba(99,102,241,0.15)",
          borderWidth: 1,
          borderColor: badgeColor
            ? badgeColor.replace("0.12", "0.25")
            : "rgba(99,102,241,0.25)",
        }}
      >
        <Text style={{ fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,0.7)" }}>
          {badge}
        </Text>
      </View>
    </View>
  </Animated.View>
);

const SettingsRow = ({ icon, label, value, onPress, danger, delay }) => (
  <Animated.View entering={FadeInDown.delay(delay).springify()}>
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.05)",
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: danger ? "rgba(248,113,113,0.1)" : "rgba(255,255,255,0.05)",
          borderWidth: 1,
          borderColor: danger ? "rgba(248,113,113,0.2)" : "rgba(255,255,255,0.08)",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 14,
        }}
      >
        <Ionicons
          name={icon}
          size={17}
          color={danger ? "#f87171" : "rgba(165,180,252,0.8)"}
        />
      </View>
      <Text
        style={{
          flex: 1,
          fontSize: 14,
          fontWeight: "500",
          color: danger ? "#f87171" : "rgba(255,255,255,0.85)",
        }}
      >
        {label}
      </Text>
      {value ? (
        <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginRight: 8 }}>
          {value}
        </Text>
      ) : null}
      {!danger && (
        <Ionicons name="chevron-forward" size={15} color="rgba(255,255,255,0.2)" />
      )}
    </TouchableOpacity>
  </Animated.View>
);

const DEFAULT_AVATAR = "https://res.cloudinary.com/dlkre2bxo/image/upload/f_auto,q_auto/v1777577974/avatar_1.png";

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { signOut, userRole } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showPicker, setShowPicker] = useState(false);
  const [pickerTab, setPickerTab] = useState("avatar"); // "avatar" | "upload"
  const [avatars, setAvatars] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selectedAvatarId, setSelectedAvatarId] = useState(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await api.get("/auth/profile");
      setUser(response.data);
    } catch (error) {
      console.error("Error fetching user data:", error);
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

  // ── Select a preset avatar ────────────────────────────────────────────────
  const handleAvatarSelect = async (avatarId) => {
    try {
      setUploading(true);
      setSelectedAvatarId(avatarId);
      const res = await api.patch("/users/profile-image", { avatarId });
      setUser((prev) => ({ ...prev, profileImage: res.data.profileImage }));
      setShowPicker(false);
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Failed to update avatar.");
    } finally {
      setUploading(false);
      setSelectedAvatarId(null);
    }
  };

  // ── Upload custom photo ───────────────────────────────────────────────────
  const pickImage = async (useCamera = false) => {
    try {
      // Request permissions
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Required", "Camera access is needed to take a photo.");
          return;
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Required", "Photo library access is needed.");
          return;
        }
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            allowsEditing: false,
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: false,
            quality: 0.8,
          });

      if (result.canceled) return;

      const asset = result.assets[0];
      setUploading(true);

      // Build FormData
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
      Alert.alert("Upload Failed", err.response?.data?.message || "Something went wrong.");
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: () => signOut(), 
      },
    ]);
  };

  // ── Loading State ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#09090f", alignItems: "center", justifyContent: "center" }}>
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={["rgba(99,102,241,0.2)", "rgba(0,0,0,0)"]}
          style={{ position: "absolute", inset: 0 }}
        />
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, marginTop: 14, fontWeight: "500" }}>
          Loading profile…
        </Text>
      </View>
    );
  }

  // ── Derived values ─────────────────────────────────────────────────────────
  const displayName = user?.name || "Athlete";
  const memberRole  = user?.role === "owner" ? "Gym Owner" : "Member";
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "N/A";

  // Format preferred visit time for display
  const formatVisitTime = (hour) => {
    if (hour === null || hour === undefined) return "Not set";
    const h = hour % 12 || 12;
    const period = hour < 12 ? "AM" : "PM";
    return `${h} ${period}`;
  };

  // Friendly fitness goal label
  const goalLabel = {
    lose_weight: "Lose Weight",
    gain_muscle: "Gain Muscle",
    maintain_fitness: "Maintain",
    improve_endurance: "Endurance",
    increase_flexibility: "Flexibility",
  }[user?.fitnessGoal] || "Not set";

  return (
    <View style={{ flex: 1, backgroundColor: "#09090f" }}>
      <StatusBar barStyle="light-content" />

      {/* ── Background gradient ──────────────────────────────────────────── */}
      <LinearGradient
        colors={["rgba(99,102,241,0.28)", "rgba(139,92,246,0.12)", "rgba(0,0,0,0)"]}
        locations={[0, 0.45, 1]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 360 }}
      />

      {/* ── Glow Orbs ────────────────────────────────────────────────────── */}
      <GlowOrb size={300} color="rgba(99,102,241,0.14)" top={-80} left={SCREEN_WIDTH / 2 - 150} delay={0} />
      <GlowOrb size={220} color="rgba(139,92,246,0.10)" top={200} left={-80} delay={1200} />
      <GlowOrb size={180} color="rgba(6,182,212,0.08)"  top={500} left={SCREEN_WIDTH - 120} delay={2400} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 48 }}
      >
        {/* ── Top Bar ────────────────────────────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(0).duration(600)}
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: 24,
            paddingTop: 56,
            paddingBottom: 8,
          }}
        >
          <View>
            <Text
              style={{
                fontSize: 10,
                color: "rgba(255,255,255,0.28)",
                textTransform: "uppercase",
                letterSpacing: 2,
                fontWeight: "700",
              }}
            >
              My Profile
            </Text>
            <Text style={{ fontSize: 20, fontWeight: "800", color: "#fff", marginTop: 2 }}>
              {getGreeting()}
            </Text>
          </View>
          <TouchableOpacity
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: "rgba(99,102,241,0.1)",
              borderWidth: 1,
              borderColor: "rgba(99,102,241,0.25)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="notifications-outline" size={20} color="rgba(165,180,252,0.85)" />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(150).springify()}
          style={{ alignItems: "center", paddingTop: 20, paddingBottom: 32 }}
        >
          {/* Avatar ring — tap to change */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={openPicker}
            style={{ position: "relative", marginBottom: 16 }}
          >
            <LinearGradient
              colors={["#6366f1", "#8b5cf6", "#06b6d4"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Image
                source={{ uri: user?.profileImage || DEFAULT_AVATAR }}
                style={{
                  width: 108,
                  height: 108,
                  borderRadius: 54,
                  borderWidth: 3,
                  borderColor: "#09090f",
                }}
              />
            </LinearGradient>
            {/* Camera edit badge */}
            <View
              style={{
                position: "absolute",
                bottom: 2,
                right: 2,
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: "#6366f1",
                borderWidth: 2.5,
                borderColor: "#09090f",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="camera" size={13} color="#fff" />
            </View>
          </TouchableOpacity>

          <Text
            style={{
              fontSize: 22,
              fontWeight: "800",
              color: "#fff",
              letterSpacing: -0.4,
            }}
          >
            {displayName}
          </Text>

          {/* Role badge */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              marginTop: 8,
              backgroundColor: "rgba(99,102,241,0.12)",
              borderWidth: 1,
              borderColor: "rgba(99,102,241,0.25)",
              borderRadius: 20,
              paddingHorizontal: 14,
              paddingVertical: 5,
            }}
          >
            <Ionicons name="shield-checkmark" size={12} color="#a5b4fc" />
            <Text style={{ fontSize: 12, fontWeight: "700", color: "#a5b4fc" }}>
              {memberRole} · Since {memberSince}
            </Text>
          </View>

          {/* Email */}
          {user?.email && (
            <Text
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.3)",
                marginTop: 8,
                fontWeight: "400",
              }}
            >
              {user.email}
            </Text>
          )}

          {/* Phone */}
          {user?.phone && (
            <Text
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.25)",
                marginTop: 4,
                fontWeight: "400",
              }}
            >
              {user.phone}
            </Text>
          )}
        </Animated.View>

        {/* ── Stats Row ───────────────────────────────────────────────────── */}
        <View style={{ flexDirection: "row", gap: 10, paddingHorizontal: 20, marginBottom: 16 }}>
          <StatCard
            value={user?.numberOfWorkoutDay ?? "—"}
            label="Workout Days"
            iconName="barbell-outline"
            color="#a5b4fc"
            bgColor="rgba(99,102,241,0.08)"
            borderColor="rgba(99,102,241,0.18)"
            delay={300}
          />
          <StatCard
            value={user?.weight ? `${user.weight}` : "—"}
            label="Weight (kg)"
            iconName="scale-outline"
            color="#fca5a5"
            bgColor="rgba(239,68,68,0.08)"
            borderColor="rgba(239,68,68,0.18)"
            delay={380}
          />
          <StatCard
            value={goalLabel}
            label="Goal"
            iconName="flag-outline"
            color="#6ee7b7"
            bgColor="rgba(16,185,129,0.08)"
            borderColor="rgba(16,185,129,0.18)"
            delay={460}
          />
          <StatCard
            value={formatVisitTime(user?.preferredVisitTime)}
            label="Visit Time"
            iconName="time-outline"
            color="#93c5fd"
            bgColor="rgba(59,130,246,0.08)"
            borderColor="rgba(59,130,246,0.18)"
            delay={540}
          />
        </View>

        {userRole !== 'owner' && (
          <Animated.View entering={FadeInDown.delay(500).springify()} style={{ marginHorizontal: 20, marginBottom: 14 }}>
            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.03)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.07)",
                borderRadius: 20,
                padding: 18,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Ionicons name="trophy-outline" size={16} color="#a5b4fc" />
                  <Text style={{ fontSize: 14, fontWeight: "700", color: "rgba(255,255,255,0.85)" }}>
                    Weekly Goal
                  </Text>
                </View>
                <Text style={{ fontSize: 13, fontWeight: "800", color: "#a5b4fc" }}>— / {user?.numberOfWorkoutDay ?? 5}</Text>
              </View>

              <View style={{ flexDirection: "row", gap: 6, marginBottom: 12 }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <View
                    key={i}
                    style={{ flex: 1, height: 6, borderRadius: 4, overflow: "hidden" }}
                  >
                    {i <= 3 ? (
                      <LinearGradient
                        colors={["#6366f1", "#8b5cf6"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{ flex: 1 }}
                      />
                    ) : (
                      <View style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.08)" }} />
                    )}
                  </View>
                ))}
              </View>

              <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: "500" }}>
                2 more workouts to crush your goal this week
              </Text>
            </View>
          </Animated.View>
        )}

        {userRole !== 'owner' && (
        <Animated.View entering={FadeInDown.delay(580).springify()} style={{ marginHorizontal: 20, marginBottom: 14 }}>
          <LinearGradient
            colors={["rgba(99,102,241,0.25)", "rgba(139,92,246,0.18)", "rgba(6,182,212,0.12)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 20,
              padding: 18,
              borderWidth: 1,
              borderColor: "rgba(99,102,241,0.3)",
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <View>
                <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1.5, fontWeight: "700", marginBottom: 4 }}>
                  Current Plan
                </Text>
                <Text style={{ fontSize: 20, fontWeight: "900", color: "#fff", letterSpacing: -0.5 }}>
                  Pro Member
                </Text>
                <Text style={{ fontSize: 12, color: "rgba(165,180,252,0.7)", marginTop: 4 }}>
                  Renews on May 28, 2026
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: "rgba(99,102,241,0.2)",
                  borderWidth: 1,
                  borderColor: "rgba(165,180,252,0.3)",
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: "800", color: "#a5b4fc" }}>ACTIVE</Text>
              </View>
            </View>

            <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.08)", marginVertical: 14 }} />

            <View style={{ flexDirection: "row", gap: 20 }}>
              {[
                { icon: "barbell-outline", text: "Unlimited Access" },
                { icon: "person-outline",  text: "1-on-1 Coach" },
                { icon: "nutrition-outline",text: "Diet Plans" },
              ].map((f) => (
                <View key={f.text} style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                  <Ionicons name={f.icon} size={12} color="rgba(165,180,252,0.7)" />
                  <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: "500" }}>
                    {f.text}
                  </Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              onPress={() => navigation.navigate("Payment")}
              style={{ marginTop: 16 }}
              activeOpacity={0.8}
            >
              <View
                style={{
                  backgroundColor: "rgba(255,255,255,0.1)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.15)",
                  borderRadius: 12,
                  paddingVertical: 10,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "700", color: "rgba(255,255,255,0.85)" }}>
                  Manage Subscription
                </Text>
                <Ionicons name="arrow-forward" size={13} color="rgba(255,255,255,0.6)" />
              </View>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
        )}

        {/* ── Recent Activity — member only ────────────────────────────────── */}
        {userRole !== 'owner' && (
        <Animated.View entering={FadeInDown.delay(620).springify()} style={{ marginHorizontal: 20, marginBottom: 14 }}>
          <View
            style={{
              backgroundColor: "rgba(255,255,255,0.03)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.07)",
              borderRadius: 20,
              padding: 18,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: "rgba(255,255,255,0.85)" }}>
                Recent Activity
              </Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={{ fontSize: 12, color: "#a5b4fc", fontWeight: "600" }}>See all</Text>
              </TouchableOpacity>
            </View>

            <ActivityItem iconName="walk-outline" title="Morning Run" subtitle="Today · 5.2 km · 34 min" badge="+320 kcal" badgeColor="rgba(16,185,129,0.12)" delay={680} />
            <ActivityItem iconName="barbell-outline" title="Upper Body Push" subtitle="Yesterday · 45 min" badge="+580 kcal" badgeColor="rgba(99,102,241,0.12)" delay={710} />
            <ActivityItem iconName="body-outline" title="Yoga & Recovery" subtitle="2 days ago · 30 min" badge="+150 kcal" badgeColor="rgba(139,92,246,0.12)" delay={740} />
            <ActivityItem iconName="bicycle-outline" title="Cycling" subtitle="3 days ago · 12 km" badge="+440 kcal" badgeColor="rgba(6,182,212,0.12)" delay={770} />
          </View>
        </Animated.View>
        )}

        {userRole !== 'owner' && (
        <Animated.View
          entering={FadeInDown.delay(660).springify()}
          style={{ flexDirection: "row", gap: 12, paddingHorizontal: 20, marginBottom: 14 }}
        >
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.85}>
            <LinearGradient
              colors={["#6366f1", "#8b5cf6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                borderRadius: 16,
                paddingVertical: 14,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Ionicons name="barbell-outline" size={16} color="#fff" />
              <Text style={{ fontSize: 14, fontWeight: "800", color: "#fff" }}>
                Start Workout
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.85}>
            <LinearGradient
              colors={["#10b981", "#059669"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                borderRadius: 16,
                paddingVertical: 14,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Ionicons name="analytics-outline" size={16} color="#fff" />
              <Text style={{ fontSize: 14, fontWeight: "800", color: "#fff" }}>
                Progress
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
        )}

        {userRole === 'owner' && (
          <Animated.View entering={FadeInDown.delay(500).springify()} style={{ marginHorizontal: 20, marginBottom: 14 }}>
            <View
              style={{
                backgroundColor: 'rgba(255,255,255,0.03)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.07)',
                borderRadius: 20,
                paddingHorizontal: 18,
                paddingTop: 6,
                paddingBottom: 6,
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  color: 'rgba(255,255,255,0.25)',
                  textTransform: 'uppercase',
                  letterSpacing: 1.5,
                  fontWeight: '700',
                  paddingTop: 14,
                  paddingBottom: 6,
                }}
              >
                Gym Management
              </Text>

              <SettingsRow
                icon="business-outline"
                label="My Gym"
                onPress={() => navigation.navigate('Main', { screen: 'MyGym' })}
                delay={520}
              />

              {user?.gymId && (
                <SettingsRow
                  icon="shield-checkmark-outline"
                  label="Gym Status"
                  value="Active"
                  delay={540}
                />
              )}
            </View>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(700).springify()} style={{ marginHorizontal: 20, marginBottom: 14 }}>
          <View
            style={{
              backgroundColor: "rgba(255,255,255,0.03)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.07)",
              borderRadius: 20,
              paddingHorizontal: 18,
              paddingTop: 6,
              paddingBottom: 6,
            }}
          >
            <Text
              style={{
                fontSize: 10,
                color: "rgba(255,255,255,0.25)",
                textTransform: "uppercase",
                letterSpacing: 1.5,
                fontWeight: "700",
                paddingTop: 14,
                paddingBottom: 6,
              }}
            >
              Account
            </Text>
            <SettingsRow icon="person-circle-outline"    label="Edit Profile"        delay={720} />
            <SettingsRow icon="notifications-outline"    label="Notifications"        value="On"    delay={740} />
            <SettingsRow icon="shield-outline"           label="Privacy & Security"                 delay={760} />
            <SettingsRow icon="card-outline"             label="Billing & Payments"                 delay={780} />
            <SettingsRow icon="help-circle-outline"      label="Help & Support"                     delay={800} />

            <Text
              style={{
                fontSize: 10,
                color: "rgba(255,255,255,0.25)",
                textTransform: "uppercase",
                letterSpacing: 1.5,
                fontWeight: "700",
                paddingTop: 14,
                paddingBottom: 6,
              }}
            >
              Preferences
            </Text>
            <SettingsRow icon="moon-outline"             label="Dark Mode"            value="Auto"  delay={820} />
            <SettingsRow icon="language-outline"         label="Language"             value="EN"    delay={840} />
            <SettingsRow icon="information-circle-outline" label="App Version"        value="1.0.0" delay={860} />

            <Text
              style={{
                fontSize: 10,
                color: "rgba(255,255,255,0.25)",
                textTransform: "uppercase",
                letterSpacing: 1.5,
                fontWeight: "700",
                paddingTop: 14,
                paddingBottom: 6,
              }}
            >
              Danger Zone
            </Text>
            <SettingsRow
              icon="log-out-outline"
              label="Log Out"
              onPress={handleLogout}
              danger
              delay={880}
            />

            <View style={{ height: 8 }} />
          </View>
        </Animated.View>

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(900).springify()} style={{ alignItems: "center", marginTop: 8 }}>
          <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.15)", fontWeight: "500" }}>
            FitHex · v1.0.0
          </Text>
        </Animated.View>
      </ScrollView>

      {/* ═══════════════════════ Image Picker Modal ═══════════════════════ */}
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
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.6)",
            justifyContent: "flex-end",
          }}
        >
          {/* Sheet content — stop propagation */}
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <Animated.View
              entering={SlideInDown.duration(350).easing(Easing.out(Easing.cubic))}
              style={{
                backgroundColor: "#111118",
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                borderWidth: 1,
                borderColor: "rgba(99,102,241,0.15)",
                borderBottomWidth: 0,
                paddingBottom: Platform.OS === "ios" ? 40 : 24,
                maxHeight: Dimensions.get("window").height * 0.80,
              }}
            >
              {/* ── Handle Bar ──────────────────────────────────────────── */}
              <View style={{ alignItems: "center", paddingTop: 12, paddingBottom: 8 }}>
                <View
                  style={{
                    width: 40,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: "rgba(255,255,255,0.15)",
                  }}
                />
              </View>

              {/* ── Title ───────────────────────────────────────────────── */}
              <Text
                style={{
                  textAlign: "center",
                  fontSize: 17,
                  fontWeight: "800",
                  color: "#fff",
                  letterSpacing: -0.3,
                  marginBottom: 16,
                }}
              >
                Change Profile Photo
              </Text>

              {/* ── Tab Pills ──────────────────────────────────────────── */}
              <View
                style={{
                  flexDirection: "row",
                  marginHorizontal: 20,
                  marginBottom: 18,
                  backgroundColor: "rgba(255,255,255,0.05)",
                  borderRadius: 14,
                  padding: 4,
                }}
              >
                {["avatar", "upload"].map((tab) => (
                  <TouchableOpacity
                    key={tab}
                    activeOpacity={0.8}
                    onPress={() => setPickerTab(tab)}
                    style={{ flex: 1 }}
                  >
                    {pickerTab === tab ? (
                      <LinearGradient
                        colors={["#6366f1", "#8b5cf6"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{
                          borderRadius: 11,
                          paddingVertical: 10,
                          alignItems: "center",
                          flexDirection: "row",
                          justifyContent: "center",
                          gap: 6,
                        }}
                      >
                        <Ionicons
                          name={tab === "avatar" ? "people" : "cloud-upload"}
                          size={14}
                          color="#fff"
                        />
                        <Text style={{ fontSize: 13, fontWeight: "700", color: "#fff" }}>
                          {tab === "avatar" ? "Choose Avatar" : "Upload Photo"}
                        </Text>
                      </LinearGradient>
                    ) : (
                      <View
                        style={{
                          borderRadius: 11,
                          paddingVertical: 10,
                          alignItems: "center",
                          flexDirection: "row",
                          justifyContent: "center",
                          gap: 6,
                        }}
                      >
                        <Ionicons
                          name={tab === "avatar" ? "people-outline" : "cloud-upload-outline"}
                          size={14}
                          color="rgba(255,255,255,0.4)"
                        />
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: "600",
                            color: "rgba(255,255,255,0.4)",
                          }}
                        >
                          {tab === "avatar" ? "Choose Avatar" : "Upload Photo"}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* ── Tab Content ─────────────────────────────────────────── */}
              {pickerTab === "avatar" ? (
                /* ── Avatar Grid ────────────────────────────────────── */
                <FlatList
                  data={avatars}
                  keyExtractor={(item) => item.id}
                  numColumns={4}
                  contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }}
                  columnWrapperStyle={{ gap: 12, marginBottom: 12 }}
                  showsVerticalScrollIndicator={false}
                  ListEmptyComponent={
                    <View style={{ alignItems: "center", paddingVertical: 32 }}>
                      <ActivityIndicator size="small" color="#6366f1" />
                      <Text
                        style={{
                          color: "rgba(255,255,255,0.3)",
                          fontSize: 12,
                          marginTop: 10,
                        }}
                      >
                        Loading avatars…
                      </Text>
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
                        <View
                          style={{
                            width: 72,
                            height: 72,
                            borderRadius: 36,
                            borderWidth: 2.5,
                            borderColor: isSelected ? "#6366f1" : "rgba(255,255,255,0.08)",
                            padding: 3,
                            backgroundColor: isSelected
                              ? "rgba(99,102,241,0.12)"
                              : "rgba(255,255,255,0.03)",
                          }}
                        >
                          <Image
                            source={{ uri: item.url }}
                            style={{
                              width: "100%",
                              height: "100%",
                              borderRadius: 34,
                            }}
                            resizeMode="cover"
                          />
                          {isSelecting && (
                            <View
                              style={{
                                ...StyleSheet.absoluteFillObject,
                                borderRadius: 34,
                                backgroundColor: "rgba(0,0,0,0.5)",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <ActivityIndicator size="small" color="#fff" />
                            </View>
                          )}
                        </View>
                        {isSelected && (
                          <View
                            style={{
                              position: "absolute",
                              bottom: -2,
                              right: "50%",
                              marginRight: -10,
                              width: 20,
                              height: 20,
                              borderRadius: 10,
                              backgroundColor: "#6366f1",
                              borderWidth: 2,
                              borderColor: "#111118",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Ionicons name="checkmark" size={11} color="#fff" />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  }}
                />
              ) : (
                /* ── Upload Options ─────────────────────────────────── */
                <View style={{ paddingHorizontal: 20, gap: 12 }}>
                  {/* Camera */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => pickImage(true)}
                    disabled={uploading}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 14,
                      backgroundColor: "rgba(255,255,255,0.04)",
                      borderWidth: 1,
                      borderColor: "rgba(99,102,241,0.2)",
                      borderRadius: 16,
                      paddingVertical: 16,
                      paddingHorizontal: 18,
                    }}
                  >
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 14,
                        backgroundColor: "rgba(99,102,241,0.12)",
                        borderWidth: 1,
                        borderColor: "rgba(99,102,241,0.25)",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons name="camera-outline" size={22} color="#a5b4fc" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff" }}>
                        Take Photo
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: "rgba(255,255,255,0.35)",
                          marginTop: 2,
                        }}
                      >
                        Use your camera to snap a new pic
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.2)" />
                  </TouchableOpacity>

                  {/* Photo Library */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => pickImage(false)}
                    disabled={uploading}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 14,
                      backgroundColor: "rgba(255,255,255,0.04)",
                      borderWidth: 1,
                      borderColor: "rgba(139,92,246,0.2)",
                      borderRadius: 16,
                      paddingVertical: 16,
                      paddingHorizontal: 18,
                    }}
                  >
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 14,
                        backgroundColor: "rgba(139,92,246,0.12)",
                        borderWidth: 1,
                        borderColor: "rgba(139,92,246,0.25)",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons name="images-outline" size={22} color="#c4b5fd" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff" }}>
                        Choose from Library
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: "rgba(255,255,255,0.35)",
                          marginTop: 2,
                        }}
                      >
                        Pick an existing photo from your gallery
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.2)" />
                  </TouchableOpacity>

                  {/* Upload in progress overlay */}
                  {uploading && (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 10,
                        paddingVertical: 14,
                      }}
                    >
                      <ActivityIndicator size="small" color="#6366f1" />
                      <Text
                        style={{
                          color: "rgba(255,255,255,0.5)",
                          fontSize: 13,
                          fontWeight: "600",
                        }}
                      >
                        Uploading…
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </Animated.View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default ProfileScreen;
