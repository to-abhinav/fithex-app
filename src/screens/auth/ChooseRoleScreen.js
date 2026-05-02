import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  withSpring,
  FadeInDown,
  FadeInUp,
  Easing,
  interpolate,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const GlowOrb = ({ size, color, top, left, delay = 0 }) => {
  const pulse = useSharedValue(0.3);

  useEffect(() => {
    pulse.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.6, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: 3000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: pulse.value,
    transform: [{ scale: interpolate(pulse.value, [0.3, 0.6], [0.95, 1.05]) }],
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

const BorderBeam = () => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 4000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const topBeam = useAnimatedStyle(() => ({
    left: `${interpolate(progress.value, [0, 1], [-50, 100])}%`,
    opacity: interpolate(progress.value, [0, 0.3, 0.7, 1], [0.2, 0.7, 0.7, 0.2]),
  }));

  return (
    <View
      style={{
        position: "absolute",
        top: -0.5,
        left: -0.5,
        right: -0.5,
        bottom: -0.5,
        borderRadius: 24,
        overflow: "hidden",
      }}
      pointerEvents="none"
    >
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 0,
            width: "40%",
            height: 1.5,
            backgroundColor: "rgba(165, 180, 252, 0.6)",
          },
          topBeam,
        ]}
      />
    </View>
  );
};

// ─── Role Card --─
const RoleCard = ({ icon, emoji, title, subtitle, features, selected, onPress, gradientColors, delay = 0 }) => {
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(selected ? 1.02 : 1, { damping: 15, stiffness: 150 });
    glowOpacity.value = withTiming(selected ? 1 : 0, { duration: 300 });
  }, [selected]);

  const cardAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        style={{ marginBottom: 16 }}
      >
        <Animated.View style={cardAnimStyle}>
          <Animated.View
            style={[
              {
                position: "absolute",
                top: -2,
                left: -2,
                right: -2,
                bottom: -2,
                borderRadius: 22,
                borderWidth: 1.5,
                borderColor: gradientColors[0],
              },
              glowStyle,
            ]}
          />

          <View
            style={{
              borderRadius: 20,
              padding: 20,
              borderWidth: 1,
              borderColor: selected
                ? `${gradientColors[0]}40`
                : "rgba(255,255,255,0.06)",
              backgroundColor: selected
                ? `${gradientColors[0]}12`
                : "rgba(255,255,255,0.03)",
              overflow: "hidden",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
              {/* Icon badge */}
              <LinearGradient
                colors={selected ? gradientColors : ["rgba(255,255,255,0.08)", "rgba(255,255,255,0.04)"]}
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name={icon}
                  size={24}
                  color={selected ? "#fff" : "rgba(255,255,255,0.5)"}
                />
              </LinearGradient>

              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "700",
                    color: "#fff",
                    letterSpacing: -0.3,
                  }}
                >
                  {title}
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: "rgba(255,255,255,0.4)",
                    marginTop: 2,
                  }}
                >
                  {subtitle}
                </Text>
              </View>

              {/* ── Selection indicator ───────────────────────────── */}
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  borderWidth: selected ? 0 : 1.5,
                  borderColor: "rgba(255,255,255,0.15)",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                {selected ? (
                  <LinearGradient
                    colors={gradientColors}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  </LinearGradient>
                ) : null}
              </View>
            </View>

            {/* ── Feature pills ──────────────────────────────────── */}
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 8,
                marginTop: 16,
              }}
            >
              {features.map((feature, idx) => (
                <View
                  key={idx}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                    backgroundColor: selected
                      ? `${gradientColors[0]}18`
                      : "rgba(255,255,255,0.04)",
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: selected
                      ? `${gradientColors[0]}25`
                      : "rgba(255,255,255,0.06)",
                  }}
                >
                  <Ionicons
                    name={feature.icon}
                    size={12}
                    color={selected ? gradientColors[0] : "rgba(255,255,255,0.35)"}
                  />
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "600",
                      color: selected
                        ? "rgba(255,255,255,0.7)"
                        : "rgba(255,255,255,0.3)",
                    }}
                  >
                    {feature.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Choose Role Screen ───────────────────────────────────────────────────────
const ChooseRoleScreen = ({ navigation, route }) => {
  const { name, email, phone, password } = route?.params || {};
  const [selectedRole, setSelectedRole] = useState(null);

  const handleContinue = () => {
    if (!selectedRole) return;
    navigation.navigate("OtpVerification", {
      name,
      email,
      phone,
      password,
      role: selectedRole,
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <StatusBar barStyle="light-content" />

      {/* ── Background Gradient ───────────────────────────────────────── */}
      <LinearGradient
        colors={["rgba(99,102,241,0.35)", "rgba(79,70,229,0.25)", "rgba(0,0,0,1)"]}
        locations={[0, 0.4, 1]}
        style={{ position: "absolute", inset: 0 }}
      />

      {/* ── Glow Orbs ────────────────────────────────────────────────── */}
      <GlowOrb
        size={280}
        color="rgba(99,102,241,0.15)"
        top={-60}
        left={SCREEN_WIDTH / 2 - 140}
        delay={0}
      />
      <GlowOrb
        size={200}
        color="rgba(139,92,246,0.12)"
        top={120}
        left={-60}
        delay={1000}
      />
      <GlowOrb
        size={180}
        color="rgba(6,182,212,0.1)"
        top={500}
        left={SCREEN_WIDTH - 100}
        delay={2000}
      />

      {/* ── Content ──────────────────────────────────────────────────── */}
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          paddingHorizontal: 24,
          paddingTop: 60,
          paddingBottom: 40,
        }}
      >
        {/* ── Back Button ──────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              width: 36,
              height: 36,
              backgroundColor: "rgba(255,255,255,0.06)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.08)",
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 24,
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={18} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
        </Animated.View>

        {/* ── Glass Card Container ─────────────────────────────────── */}
        <Animated.View
          entering={FadeInUp.delay(200).duration(800).springify()}
          style={{ position: "relative" }}
        >
          <BorderBeam />

          {/* Card border glow */}
          <View
            style={{
              position: "absolute",
              top: -0.5,
              left: -0.5,
              right: -0.5,
              bottom: -0.5,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.08)",
            }}
          />

          {/* Glass card body */}
          <View
            style={{
              borderRadius: 24,
              padding: 24,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.05)",
              overflow: "hidden",
              backgroundColor: "rgba(0,0,0,0.45)",
            }}
          >
            {/* ── Header ──────────────────────────────────────────── */}
            <Animated.View
              entering={FadeInDown.delay(300).springify()}
              style={{ alignItems: "center", marginBottom: 24 }}
            >
              <LinearGradient
                colors={["#6366f1", "#8b5cf6"]}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 18,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <Ionicons name="people-outline" size={26} color="#fff" />
              </LinearGradient>

              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "700",
                  color: "#fff",
                  letterSpacing: -0.5,
                }}
              >
                Choose Your Role
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.4)",
                  marginTop: 6,
                  textAlign: "center",
                  lineHeight: 20,
                }}
              >
                This helps us personalize your experience.{"\n"}
                <Text style={{ color: "rgba(165,180,252,0.6)", fontWeight: "500" }}>
                  You can change this later.
                </Text>
              </Text>
            </Animated.View>

            {/* ── Role Cards ──────────────────────────────────────── */}
            <RoleCard
              icon="business-outline"
              title="Gym Owner"
              subtitle="I own or manage a gym"
              gradientColors={["#6366f1", "#8b5cf6"]}
              selected={selectedRole === "owner"}
              onPress={() => setSelectedRole("owner")}
              delay={400}
              features={[
                { icon: "add-circle-outline", label: "Create Gym" },
                { icon: "people-outline", label: "Manage Members" },
                { icon: "card-outline", label: "Plans & Billing" },
                { icon: "stats-chart-outline", label: "Analytics" },
              ]}
            />

            <RoleCard
              icon="fitness-outline"
              title="Gym Member"
              subtitle="I'm looking to join a gym"
              gradientColors={["#06b6d4", "#0891b2"]}
              selected={selectedRole === "member"}
              onPress={() => setSelectedRole("member")}
              delay={500}
              features={[
                { icon: "search-outline", label: "Find Gyms" },
                { icon: "calendar-outline", label: "Subscriptions" },
                { icon: "barbell-outline", label: "Track Workouts" },
                { icon: "trending-up-outline", label: "Progress" },
              ]}
            />

            {/* ── Continue Button ─────────────────────────────────── */}
            <Animated.View entering={FadeInDown.delay(600).springify()}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleContinue}
                disabled={!selectedRole}
              >
                <View style={{ borderRadius: 14, overflow: "hidden" }}>
                  <LinearGradient
                    colors={
                      !selectedRole
                        ? ["rgba(99,102,241,0.3)", "rgba(139,92,246,0.3)"]
                        : ["#ffffff", "#f0f0f0"]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      paddingVertical: 14,
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "row",
                      gap: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: "700",
                        color: selectedRole ? "#000" : "rgba(255,255,255,0.3)",
                        letterSpacing: 0.3,
                      }}
                    >
                      Continue
                    </Text>
                    {selectedRole && (
                      <Ionicons name="arrow-forward" size={16} color="#000" />
                    )}
                  </LinearGradient>
                </View>
              </TouchableOpacity>
            </Animated.View>

            {/* ── Step indicator ───────────────────────────────────── */}
            <Animated.View
              entering={FadeInDown.delay(700).springify()}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                marginTop: 20,
              }}
            >
              {/* Step 1: Registration — done */}
              <View
                style={{
                  width: 24,
                  height: 3,
                  borderRadius: 2,
                  backgroundColor: "rgba(99,102,241,0.7)",
                }}
              />
              {/* Step 2: Role — current */}
              <View
                style={{
                  width: 24,
                  height: 3,
                  borderRadius: 2,
                  backgroundColor: selectedRole
                    ? "rgba(99,102,241,0.7)"
                    : "rgba(99,102,241,0.35)",
                }}
              />
              {/* Step 3: OTP — upcoming */}
              <View
                style={{
                  width: 24,
                  height: 3,
                  borderRadius: 2,
                  backgroundColor: "rgba(255,255,255,0.08)",
                }}
              />
              <Text
                style={{
                  fontSize: 11,
                  color: "rgba(255,255,255,0.25)",
                  marginLeft: 8,
                  fontWeight: "500",
                }}
              >
                Step 2 of 3
              </Text>
            </Animated.View>
          </View>
        </Animated.View>
      </View>
    </View>
  );
};

export default ChooseRoleScreen;
