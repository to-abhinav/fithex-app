import React, { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  FadeIn,
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

const DS = {
  bg:          "#0D1117",        
  surface:     "#161B27",         
  surfaceAlt:  "#1D2436",         
  border:      "rgba(255,255,255,0.07)",
  orange:      "#F97316",      
  orangeLight: "#FB923C",
  green:       "#22C55E",      
  greenDark:   "#16A34A",
  greenGlow:   "rgba(34,197,94,0.18)",
  indigo:      "#6366F1",
  amber:       "#FBBF24",
  pink:        "#F472B6",
  textPrimary: "#F8FAFC",
  textMuted:   "rgba(248,250,252,0.45)",
  textSubtle:  "rgba(248,250,252,0.28)",
};

const CATEGORY_META = {
  Strength: { color: "#EF4444", gradient: ["#F97316", "#EF4444"], icon: "barbell-outline" },
  Cardio:   { color: "#F472B6", gradient: ["#F472B6", "#EC4899"], icon: "heart-outline"   },
  Yoga:     { color: "#818CF8", gradient: ["#818CF8", "#6366F1"], icon: "body-outline"     },
};

const getExpiryDate = (months) => {
  if (!months) return null;
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
};

const PulseRing = ({ delay, color, size }) => {
  const scale   = useSharedValue(1);
  const opacity = useSharedValue(0.7);
  useEffect(() => {
    scale.value = withDelay(delay, withRepeat(
      withTiming(2.2, { duration: 2200, easing: Easing.out(Easing.exp) }), -1, false
    ));
    opacity.value = withDelay(delay, withRepeat(
      withTiming(0, { duration: 2200, easing: Easing.out(Easing.exp) }), -1, false
    ));
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  return (
    <Animated.View style={[{
      position: "absolute",
      width: size, height: size,
      borderRadius: size / 2,
      borderWidth: 1.5,
      borderColor: color,
    }, style]} />
  );
};

const Confetti = ({ x, y, delay, color, size = 7, shape = "square" }) => {
  const ty      = useSharedValue(0);
  const tx      = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotate  = useSharedValue(0);
  const scale   = useSharedValue(0.4);
  useEffect(() => {
    opacity.value = withDelay(delay, withSequence(
      withTiming(1, { duration: 200 }),
      withDelay(700, withTiming(0, { duration: 700 }))
    ));
    ty.value = withDelay(delay, withTiming(-110, { duration: 1600, easing: Easing.out(Easing.quad) }));
    tx.value = withDelay(delay, withTiming((Math.random() - 0.5) * 40, { duration: 1600 }));
    scale.value = withDelay(delay, withSequence(
      withTiming(1, { duration: 200 }),
      withDelay(900, withTiming(0, { duration: 500 }))
    ));
    rotate.value = withDelay(delay, withRepeat(
      withTiming(360, { duration: 800, easing: Easing.linear }), 3, false
    ));
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: ty.value },
      { translateX: tx.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
  }));
  const borderRadius = shape === "circle" ? size / 2 : 2;
  return (
    <Animated.View style={[{
      position: "absolute", left: x, top: y,
      width: size, height: size, borderRadius,
      backgroundColor: color,
    }, style]} />
  );
};

const TrophyHero = ({ catMeta, glowStyle }) => (
  <Animated.View
    entering={ZoomIn.delay(80).springify().damping(14)}
    style={{ alignItems: "center", justifyContent: "center", marginBottom: 36 }}
  >
    {/* Outer glow bloom */}
    <Animated.View style={[{
      position: "absolute",
      width: 180, height: 180,
      borderRadius: 90,
      backgroundColor: DS.green,
    }, glowStyle]} />

    {/* Pulse rings */}
    <PulseRing delay={0}    color="rgba(34,197,94,0.6)"  size={110} />
    <PulseRing delay={800}  color="rgba(34,197,94,0.35)" size={110} />
    <PulseRing delay={1600} color="rgba(34,197,94,0.15)" size={110} />

    {/* Outer decorative ring */}
    <LinearGradient
      colors={["rgba(34,197,94,0.25)", "rgba(34,197,94,0.05)"]}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={{
        width: 116, height: 116, borderRadius: 58,
        alignItems: "center", justifyContent: "center",
        borderWidth: 1.5, borderColor: "rgba(34,197,94,0.3)",
      }}
    >
      {/* Inner checkmark circle */}
      <LinearGradient
        colors={["#22C55E", "#16A34A"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{
          width: 86, height: 86, borderRadius: 43,
          alignItems: "center", justifyContent: "center",
          shadowColor: DS.green,
          shadowOffset: { width: 0, height: 20 },
          shadowOpacity: 0.7,
          shadowRadius: 32,
          elevation: 20,
        }}
      >
        <Ionicons name="checkmark" size={46} color="#fff" />
      </LinearGradient>
    </LinearGradient>

    {/* Confetti burst */}
    <View style={{ position: "absolute", width: 260, height: 180, top: -70, left: -75 }}>
      <Confetti x={20}  y={90}  delay={250} color={DS.green}  size={8} />
      <Confetti x={50}  y={65}  delay={380} color={DS.amber}  size={6} />
      <Confetti x={90}  y={45}  delay={160} color={DS.orange} size={9} shape="circle" />
      <Confetti x={130} y={55}  delay={300} color={DS.pink}   size={7} />
      <Confetti x={165} y={80}  delay={430} color={DS.green}  size={6} shape="circle" />
      <Confetti x={195} y={100} delay={200} color={DS.indigo} size={8} />
      <Confetti x={40}  y={110} delay={520} color={DS.amber}  size={5} />
      <Confetti x={110} y={100} delay={350} color={catMeta.color} size={7} shape="circle" />
      <Confetti x={220} y={75}  delay={450} color={DS.pink}   size={5} />
    </View>
  </Animated.View>
);

const TicketCard = ({ plan, gym, catMeta, expiryDate }) => {
  const rows = [
    { icon: "pricetag-outline",  label: "Amount Paid",  value: `₹${plan.price.toLocaleString("en-IN")}`,  color: DS.green  },
    { icon: "timer-outline",     label: "Duration",     value: plan.durationInMonths ? `${plan.durationInMonths} Month${plan.durationInMonths > 1 ? "s" : ""}` : "Custom", color: DS.orange },
    ...(expiryDate ? [{ icon: "calendar-outline", label: "Valid Until", value: expiryDate, color: DS.amber }] : []),
    { icon: catMeta.icon,        label: "Category",     value: plan.category,                                color: catMeta.color },
  ];

  return (
    <Animated.View entering={FadeInDown.delay(340).springify().damping(16)} style={{ width: "100%", marginBottom: 18 }}>
      {/* Card shell */}
      <View style={{
        borderRadius: 24,
        borderWidth: 1,
        borderColor: DS.border,
        backgroundColor: DS.surface,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.45,
        shadowRadius: 24,
        elevation: 16,
      }}>

        {/* ── Card header ── */}
        <LinearGradient
          colors={[`${catMeta.color}30`, `${catMeta.color}08`]}
          start={{ x: 0, y: 0 }} end={{ x: 1.2, y: 1 }}
          style={{
            flexDirection: "row", alignItems: "center",
            gap: 14, padding: 18,
            borderBottomWidth: 1, borderBottomColor: DS.border,
          }}
        >
          {/* Category icon badge */}
          <LinearGradient
            colors={catMeta.gradient}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{
              width: 46, height: 46, borderRadius: 14,
              alignItems: "center", justifyContent: "center",
              shadowColor: catMeta.color,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.5,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <Ionicons name={catMeta.icon} size={22} color="#fff" />
          </LinearGradient>

          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: 16, fontWeight: "800", color: DS.textPrimary,
              letterSpacing: 0.1,
            }}>
              {plan.name}
            </Text>
            <Text style={{ fontSize: 12, color: DS.textMuted, marginTop: 2 }}>
              {gym.name}
            </Text>
          </View>

          {/* Active pill */}
          <View style={{
            paddingHorizontal: 11, paddingVertical: 5,
            borderRadius: 20,
            backgroundColor: "rgba(34,197,94,0.12)",
            borderWidth: 1, borderColor: "rgba(34,197,94,0.3)",
            flexDirection: "row", alignItems: "center", gap: 5,
          }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: DS.green }} />
            <Text style={{
              fontSize: 10, fontWeight: "800", color: DS.green,
              textTransform: "uppercase", letterSpacing: 0.8,
            }}>
              Active
            </Text>
          </View>
        </LinearGradient>

        {/* ── Dashed tear line ── */}
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 0 }}>
          <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: DS.bg, marginLeft: -22 }} />
          <View style={{ flex: 1, borderTopWidth: 1.5, borderColor: DS.border, borderStyle: "dashed" }} />
          <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: DS.bg, marginRight: -22 }} />
        </View>

        {/* ── Detail rows ── */}
        <View style={{ padding: 14, gap: 8 }}>
          {rows.map((row, idx) => (
            <View
              key={idx}
              style={{
                flexDirection: "row", alignItems: "center", gap: 14,
                paddingVertical: 12, paddingHorizontal: 16,
                backgroundColor: DS.surfaceAlt,
                borderRadius: 14,
                borderWidth: 1, borderColor: DS.border,
              }}
            >
              <View style={{
                width: 38, height: 38, borderRadius: 11,
                backgroundColor: `${row.color}18`,
                alignItems: "center", justifyContent: "center",
              }}>
                <Ionicons name={row.icon} size={17} color={row.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 10, color: DS.textSubtle, fontWeight: "700",
                  textTransform: "uppercase", letterSpacing: 1, marginBottom: 2,
                }}>
                  {row.label}
                </Text>
                <Text style={{ fontSize: 14, fontWeight: "800", color: DS.textPrimary }}>
                  {row.value}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </Animated.View>
  );
};

const InfoStrip = () => (
  <Animated.View
    entering={FadeInDown.delay(460).springify()}
    style={{
      width: "100%", marginBottom: 28,
      flexDirection: "row", alignItems: "center", gap: 12,
      backgroundColor: "rgba(99,102,241,0.08)",
      borderWidth: 1, borderColor: "rgba(99,102,241,0.2)",
      borderRadius: 16, paddingHorizontal: 16, paddingVertical: 13,
    }}
  >
    <View style={{
      width: 34, height: 34, borderRadius: 10,
      backgroundColor: "rgba(99,102,241,0.15)",
      alignItems: "center", justifyContent: "center",
    }}>
      <Ionicons name="shield-checkmark-outline" size={17} color="#818CF8" />
    </View>
    <Text style={{ flex: 1, fontSize: 12, color: DS.textMuted, lineHeight: 19 }}>
      Show your membership at the gym desk for first-time check-in.{" "}
      <Text style={{ color: "#818CF8", fontWeight: "700" }}>Your QR code</Text>
      {" "}is available in your profile.
    </Text>
  </Animated.View>
);

export default function PaymentSuccess({ route, navigation }) {
  const { plan, gym } = route.params;
  const catMeta    = CATEGORY_META[plan.category] || CATEGORY_META.Strength;
  const expiryDate = getExpiryDate(plan.durationInMonths);

  // Glow pulse on check circle
  const glow = useSharedValue(0.4);
  useEffect(() => {
    glow.value = withRepeat(withSequence(
      withTiming(1,   { duration: 2400, easing: Easing.inOut(Easing.ease) }),
      withTiming(0.4, { duration: 2400, easing: Easing.inOut(Easing.ease) })
    ), -1, true);
  }, []);
  const glowStyle = useAnimatedStyle(() => ({
    opacity:   interpolate(glow.value, [0.4, 1], [0.08, 0.22]),
    transform: [{ scale: interpolate(glow.value, [0.4, 1], [0.9, 1.15]) }],
  }));

  const handleGoToDashboard = () => {
    navigation.reset({ index: 0, routes: [{ name: "Main" }] });
  };

  return (
    <View style={{ flex: 1, backgroundColor: DS.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={DS.bg} />

      {/* ── Ambient blobs ── */}
      <View style={{
        position: "absolute", top: -140, left: -110,
        width: 350, height: 350, borderRadius: 175,
        backgroundColor: DS.green, opacity: 0.055,
      }} />
      <View style={{
        position: "absolute", top: 180, right: -100,
        width: 300, height: 300, borderRadius: 150,
        backgroundColor: DS.orange, opacity: 0.06,
      }} />
      <View style={{
        position: "absolute", bottom: 100, left: 10,
        width: 200, height: 200, borderRadius: 100,
        backgroundColor: catMeta.color, opacity: 0.04,
      }} />

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1, alignItems: "center",
          paddingHorizontal: 20, paddingBottom: 48,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top status chip ── */}
        <Animated.View
          entering={FadeIn.delay(30)}
          style={{
            marginTop: 60, marginBottom: 32,
            paddingHorizontal: 20, paddingVertical: 8,
            borderRadius: 50,
            backgroundColor: "rgba(34,197,94,0.1)",
            borderWidth: 1, borderColor: "rgba(34,197,94,0.28)",
            flexDirection: "row", alignItems: "center", gap: 8,
          }}
        >
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: DS.green }} />
          <Text style={{
            fontSize: 11, fontWeight: "800", color: DS.green,
            textTransform: "uppercase", letterSpacing: 2.2,
          }}>
            Payment Confirmed
          </Text>
        </Animated.View>

        {/* ── Animated success hero ── */}
        <TrophyHero catMeta={catMeta} glowStyle={glowStyle} />

        {/* ── Headline ── */}
        <Animated.View
          entering={FadeInDown.delay(190).springify()}
          style={{ alignItems: "center", marginBottom: 10 }}
        >
          <Text style={{
            fontSize: 38, fontWeight: "900", color: DS.textPrimary,
            letterSpacing: -1, textAlign: "center", lineHeight: 42,
          }}>
            You're All Set!
          </Text>
          {/* Orange accent underline */}
          <View style={{
            width: 56, height: 4, borderRadius: 2,
            backgroundColor: DS.orange, marginTop: 10,
            shadowColor: DS.orange, shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.7, shadowRadius: 8, elevation: 6,
          }} />
        </Animated.View>

        {/* ── Subtitle ── */}
        <Animated.View
          entering={FadeInDown.delay(260).springify()}
          style={{ marginBottom: 32, alignItems: "center" }}
        >
          <Text style={{
            fontSize: 14, color: DS.textMuted,
            textAlign: "center", lineHeight: 22, maxWidth: 310,
            marginTop: 14,
          }}>
            Your membership at{" "}
            <Text style={{ color: DS.textPrimary, fontWeight: "800" }}>
              {gym.name}
            </Text>
            {" "}is now{" "}
            <Text style={{ color: DS.green, fontWeight: "800" }}>active</Text>
            {" "}and ready to use.
          </Text>
        </Animated.View>

        {/* ── Premium ticket card ── */}
        <TicketCard
          plan={plan}
          gym={gym}
          catMeta={catMeta}
          expiryDate={expiryDate}
        />

        {/* ── Info strip ── */}
        <InfoStrip />

        {/* ── CTA button ── */}
        <Animated.View
          entering={FadeInUp.delay(540).springify().damping(18)}
          style={{ width: "100%" }}
        >
          <TouchableOpacity
            activeOpacity={0.84}
            onPress={handleGoToDashboard}
            style={{ borderRadius: 18, overflow: "hidden" }}
            accessibilityRole="button"
            accessibilityLabel="Go to Dashboard"
          >
            <LinearGradient
              colors={[DS.green, DS.greenDark]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{
                flexDirection: "row", alignItems: "center",
                justifyContent: "center", gap: 10,
                paddingVertical: 18,
                shadowColor: DS.green,
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.45,
                shadowRadius: 20,
                elevation: 12,
              }}
            >
              <Ionicons name="home-outline" size={19} color="#fff" />
              <Text style={{
                fontSize: 16, fontWeight: "900", color: "#fff",
                letterSpacing: 0.4, textTransform: "uppercase",
              }}>
                Go to Dashboard
              </Text>
              <View style={{
                width: 30, height: 30, borderRadius: 15,
                backgroundColor: "rgba(255,255,255,0.18)",
                alignItems: "center", justifyContent: "center",
              }}>
                <Ionicons name="arrow-forward" size={15} color="#fff" />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Secondary: View plans / explore */}
          <TouchableOpacity
            activeOpacity={0.7}
            style={{
              marginTop: 12, paddingVertical: 15,
              borderRadius: 18, borderWidth: 1, borderColor: DS.border,
              backgroundColor: DS.surface,
              flexDirection: "row", alignItems: "center",
              justifyContent: "center", gap: 8,
            }}
            accessibilityRole="button"
            accessibilityLabel="Explore more plans"
          >
            <Ionicons name="grid-outline" size={17} color={DS.textMuted} />
            <Text style={{
              fontSize: 14, fontWeight: "700", color: DS.textMuted,
              letterSpacing: 0.2,
            }}>
              Explore More Plans
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}