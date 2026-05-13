import React, { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  FadeInDown,
  FadeInUp,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  interpolate,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

//  Category colour map 
const CATEGORY_META = {
  Strength: { color: "#f87171", gradient: ["#ef4444", "#b91c1c"] },
  Cardio:   { color: "#f472b6", gradient: ["#ec4899", "#9d174d"] },
  Yoga:     { color: "#a5b4fc", gradient: ["#6366f1", "#4338ca"] },
};

//  expiry date 
const getExpiryDate = (months) => {
  if (!months) return null;
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
};

// ─── Pulsing ring behind the checkmark 
const PulseRing = ({ delay, color }) => {
  const scale   = useSharedValue(1);
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(withTiming(1.8, { duration: 1800, easing: Easing.out(Easing.ease) }), -1, false)
    );
    opacity.value = withDelay(
      delay,
      withRepeat(withTiming(0, { duration: 1800, easing: Easing.out(Easing.ease) }), -1, false)
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: 110,
          height: 110,
          borderRadius: 55,
          borderWidth: 2,
          borderColor: color,
        },
        style,
      ]}
    />
  );
};

const Particle = ({ x, delay, color }) => {
  const translateY = useSharedValue(0);
  const opacity    = useSharedValue(0);

  useEffect(() => {
    opacity.value    = withDelay(delay, withTiming(1, { duration: 400 }));
    translateY.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(-18, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
        withTiming(0,   { duration: 1600, easing: Easing.inOut(Easing.ease) })
      ),
      -1, true
    ));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[{ position: "absolute", left: x, top: 0, width: 8, height: 8, borderRadius: 4, backgroundColor: color }, style]}
    />
  );
};

const StatPill = ({ icon, label, value, color, delay }) => (
  <Animated.View entering={FadeInDown.delay(delay).springify()} style={{ flex: 1 }}>
    <View style={{
      alignItems: "center", gap: 6,
      backgroundColor: "rgba(255,255,255,0.04)",
      borderWidth: 1, borderColor: "rgba(255,255,255,0.07)",
      borderRadius: 18, paddingVertical: 14,
    }}>
      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: `${color}18`, borderWidth: 1, borderColor: `${color}28`, alignItems: "center", justifyContent: "center" }}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text style={{ fontSize: 13, fontWeight: "800", color: "#fff" }}>{value}</Text>
      <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: "600", textAlign: "center" }}>{label}</Text>
    </View>
  </Animated.View>
);

//  Main Screen 
export default function PaymentSuccess({ route, navigation }) {
  const { plan, gym } = route.params;
  const catMeta    = CATEGORY_META[plan.category] || CATEGORY_META.Strength;
  const expiryDate = getExpiryDate(plan.durationInMonths);

  // Spinning checkmark glow
  const glow = useSharedValue(0.5);
  useEffect(() => {
    glow.value = withRepeat(
      withSequence(
        withTiming(1,   { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.5, { duration: 1800, easing: Easing.inOut(Easing.ease) })
      ),
      -1, true
    );
  }, []);
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
    transform: [{ scale: interpolate(glow.value, [0.5, 1], [0.95, 1.05]) }],
  }));

  return (
    <View style={{ flex: 1, backgroundColor: "#09090f" }}>
      <StatusBar barStyle="light-content" />

      {/* ── Background gradients ── */}
      <LinearGradient
        colors={["rgba(16,185,129,0.18)", "rgba(99,102,241,0.08)", "rgba(0,0,0,0)"]}
        locations={[0, 0.5, 1]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 420 }}
      />
      {/* Orbs */}
      <View style={{ position: "absolute", top: -100, left: -80,  width: 280, height: 280, borderRadius: 140, backgroundColor: "#10b981", opacity: 0.06 }} />
      <View style={{ position: "absolute", top: 160, right: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: "#6366f1", opacity: 0.07 }} />
      <View style={{ position: "absolute", bottom: 80, left: 40,  width: 160, height: 160, borderRadius: 80,  backgroundColor: catMeta.color, opacity: 0.05 }} />

      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>

        {/* ── Check icon with pulse rings ── */}
        <Animated.View entering={ZoomIn.delay(100).springify()} style={{ alignItems: "center", justifyContent: "center", marginBottom: 32 }}>
          {/* Pulse rings */}
          <PulseRing delay={0}    color="rgba(16,185,129,0.4)" />
          <PulseRing delay={600}  color="rgba(16,185,129,0.25)" />
          <PulseRing delay={1200} color="rgba(16,185,129,0.12)" />

          {/* Glow blob */}
          <Animated.View style={[{ position: "absolute", width: 130, height: 130, borderRadius: 65, backgroundColor: "#10b981", opacity: 0.18 }, glowStyle]} />

          {/* Checkmark circle */}
          <LinearGradient
            colors={["#10b981", "#059669"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{
              width: 88, height: 88, borderRadius: 44,
              alignItems: "center", justifyContent: "center",
              shadowColor: "#10b981",
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.5,
              shadowRadius: 24,
              elevation: 14,
            }}
          >
            <Ionicons name="checkmark" size={44} color="#fff" />
          </LinearGradient>

          {/* Floating particles */}
          <View style={{ position: "absolute", width: 200, height: 60, top: -24 }}>
            <Particle x={20}  delay={400}  color="#10b981" />
            <Particle x={80}  delay={600}  color="#fbbf24" />
            <Particle x={140} delay={300}  color={catMeta.color} />
            <Particle x={170} delay={700}  color="#10b981" />
          </View>
        </Animated.View>

        {/* ── Headline ── */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={{ alignItems: "center", marginBottom: 8 }}>
          <Text style={{ fontSize: 9, fontWeight: "700", color: "#10b981", textTransform: "uppercase", letterSpacing: 2.5, marginBottom: 8 }}>
            Payment Successful
          </Text>
          <Text style={{ fontSize: 28, fontWeight: "900", color: "#fff", letterSpacing: -0.8, textAlign: "center", lineHeight: 34 }}>
            Membership{"\n"}Activated! 🎉
          </Text>
        </Animated.View>

        {/* ── Subtitle ── */}
        <Animated.View entering={FadeInDown.delay(280).springify()} style={{ marginBottom: 28 }}>
          <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", textAlign: "center", lineHeight: 21, maxWidth: 300 }}>
            Welcome to <Text style={{ color: "#fff", fontWeight: "700" }}>{gym.name}</Text>. Your <Text style={{ color: catMeta.color, fontWeight: "700" }}>{plan.name} Plan</Text> is now live.
          </Text>
        </Animated.View>

        {/* ── Stats row ── */}
        <Animated.View entering={FadeInDown.delay(340).springify()} style={{ flexDirection: "row", gap: 10, width: "100%", marginBottom: 20 }}>
          <StatPill
            icon="calendar-outline"
            label="Duration"
            value={plan.durationInMonths ? `${plan.durationInMonths}M` : "Custom"}
            color="#6366f1"
            delay={380}
          />
          <StatPill
            icon="pricetag-outline"
            label="Paid"
            value={`₹${plan.price.toLocaleString("en-IN")}`}
            color="#10b981"
            delay={420}
          />
          <StatPill
            icon={catMeta.color === "#f87171" ? "barbell-outline" : catMeta.color === "#f472b6" ? "heart-outline" : "body-outline"}
            label="Category"
            value={plan.category}
            color={catMeta.color}
            delay={460}
          />
        </Animated.View>

        {/* ── Expiry card ── */}
        {expiryDate && (
          <Animated.View entering={FadeInDown.delay(400).springify()} style={{ width: "100%", marginBottom: 28 }}>
            <LinearGradient
              colors={["rgba(251,191,36,0.12)", "rgba(251,191,36,0.05)"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{
                borderRadius: 18, padding: 16,
                borderWidth: 1, borderColor: "rgba(251,191,36,0.2)",
                flexDirection: "row", alignItems: "center", gap: 14,
              }}
            >
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(251,191,36,0.15)", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="hourglass-outline" size={18} color="#fbbf24" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10, color: "rgba(251,191,36,0.6)", fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>
                  Plan Expires On
                </Text>
                <Text style={{ fontSize: 16, fontWeight: "800", color: "#fbbf24" }}>{expiryDate}</Text>
              </View>
            </LinearGradient>
          </Animated.View>
        )}

        {/* ── CTA Buttons ── */}
        <Animated.View entering={FadeInUp.delay(480).springify()} style={{ width: "100%", gap: 12 }}>
          {/* Primary */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => navigation.navigate("Home")}
            style={{ borderRadius: 18, overflow: "hidden" }}
          >
            <LinearGradient
              colors={["#10b981", "#059669"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 17 }}
            >
              <Ionicons name="home-outline" size={18} color="#fff" />
              <Text style={{ fontSize: 16, fontWeight: "800", color: "#fff", letterSpacing: 0.2 }}>Go to Dashboard</Text>
              <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="arrow-forward" size={13} color="#fff" />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Secondary */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => navigation.navigate("Main", { screen: "Explore" })}
            style={{
              borderRadius: 18, paddingVertical: 15,
              borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
              backgroundColor: "rgba(255,255,255,0.04)",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "700", color: "rgba(255,255,255,0.5)" }}>Explore More Gyms</Text>
          </TouchableOpacity>
        </Animated.View>

      </View>
    </View>
  );
}