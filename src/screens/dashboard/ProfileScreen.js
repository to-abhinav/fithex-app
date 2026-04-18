import { useState, useEffect, useRef } from "react";
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
  Easing,
  interpolate,
  SlideInRight,
} from "react-native-reanimated";
import api from "../../api/axios";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Animated Glow Orb (same pattern as LoginScreen) ─────────────────────────
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

// ─── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ value, label, icon, color, bgColor, borderColor, delay }) => (
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
        paddingVertical: 16,
        paddingHorizontal: 10,
        alignItems: "center",
      }}
    >
      <Text style={{ fontSize: 18, marginBottom: 4 }}>{icon}</Text>
      <Text
        style={{
          fontSize: 22,
          fontWeight: "900",
          color,
          letterSpacing: -0.5,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontSize: 10,
          color: "rgba(255,255,255,0.35)",
          fontWeight: "600",
          textTransform: "uppercase",
          letterSpacing: 1,
          marginTop: 3,
          textAlign: "center",
        }}
      >
        {label}
      </Text>
    </View>
  </Animated.View>
);

// ─── Activity Log Item ─────────────────────────────────────────────────────────
const ActivityItem = ({ icon, title, subtitle, badge, badgeColor, delay }) => (
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
        <Text style={{ fontSize: 18 }}>{icon}</Text>
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
            ? badgeColor.replace("0.15", "0.3")
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

// ─── Settings Row ──────────────────────────────────────────────────────────────
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

const ProfileScreen = () => {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const handleLogout = async () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await SecureStore.deleteItemAsync("token");
          navigation.replace("Login");
        },
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
              Good morning 👋
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

        {/* ── Hero Avatar Card ─────────────────────────────────────────────── */}
        <Animated.View
          entering={FadeInUp.delay(150).springify()}
          style={{ alignItems: "center", paddingTop: 20, paddingBottom: 32 }}
        >
          {/* Avatar ring */}
          <View style={{ position: "relative", marginBottom: 16 }}>
            <LinearGradient
              colors={["#6366f1", "#8b5cf6", "#06b6d4"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Image
                source={{ uri: "https://i.pravatar.cc/150?img=68" }}
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: 45,
                  borderWidth: 3,
                  borderColor: "#09090f",
                }}
              />
            </LinearGradient>
            {/* Online badge */}
            <View
              style={{
                position: "absolute",
                bottom: 4,
                right: 4,
                width: 18,
                height: 18,
                borderRadius: 9,
                backgroundColor: "#10b981",
                borderWidth: 2.5,
                borderColor: "#09090f",
              }}
            />
          </View>

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
        </Animated.View>

        {/* ── Stats Row ───────────────────────────────────────────────────── */}
        <View style={{ flexDirection: "row", gap: 10, paddingHorizontal: 20, marginBottom: 16 }}>
          <StatCard
            value="12"
            label="Workouts"
            icon="🏋️"
            color="#a5b4fc"
            bgColor="rgba(99,102,241,0.08)"
            borderColor="rgba(99,102,241,0.18)"
            delay={300}
          />
          <StatCard
            value="5🔥"
            label="Day Streak"
            icon="⚡"
            color="#fca5a5"
            bgColor="rgba(239,68,68,0.08)"
            borderColor="rgba(239,68,68,0.18)"
            delay={380}
          />
          <StatCard
            value="2"
            label="Goals"
            icon="🎯"
            color="#6ee7b7"
            bgColor="rgba(16,185,129,0.08)"
            borderColor="rgba(16,185,129,0.18)"
            delay={460}
          />
          <StatCard
            value="8.2"
            label="Avg Hours"
            icon="😴"
            color="#93c5fd"
            bgColor="rgba(59,130,246,0.08)"
            borderColor="rgba(59,130,246,0.18)"
            delay={540}
          />
        </View>

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
              <Text style={{ fontSize: 13, fontWeight: "800", color: "#a5b4fc" }}>3 / 5</Text>
            </View>

            {/* Segmented progress bubbles */}
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
              💪 2 more workouts to crush your goal this week
            </Text>
          </View>
        </Animated.View>

        {/* ── Membership Plan Card ─────────────────────────────────────────── */}
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

        {/* ── Recent Activity ──────────────────────────────────────────────── */}
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

            <ActivityItem icon="🏃" title="Morning Run" subtitle="Today · 5.2 km · 34 min" badge="+320 kcal" badgeColor="rgba(16,185,129,0.12)" delay={680} />
            <ActivityItem icon="🏋️" title="Upper Body Push" subtitle="Yesterday · 45 min" badge="+580 kcal" badgeColor="rgba(99,102,241,0.12)" delay={710} />
            <ActivityItem icon="🧘" title="Yoga & Recovery" subtitle="2 days ago · 30 min" badge="+150 kcal" badgeColor="rgba(139,92,246,0.12)" delay={740} />
            <ActivityItem icon="🚴" title="Cycling" subtitle="3 days ago · 12 km" badge="+440 kcal" badgeColor="rgba(6,182,212,0.12)" delay={770} />
          </View>
        </Animated.View>

        {/* ── CTA Buttons ──────────────────────────────────────────────────── */}
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

        {/* ── Settings Menu ────────────────────────────────────────────────── */}
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
            FitHex · v1.0.0 · Made with 💪
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

export default ProfileScreen;
