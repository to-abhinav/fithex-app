import { useState, useEffect, useCallback } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Dimensions,
  FlatList,
  ActivityIndicator,
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
  ZoomIn,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Glow Orb ─────────────────────────────────────────────────────────────────
const GlowOrb = ({ size, color, top, left, delay = 0 }) => {
  const pulse = useSharedValue(0.2);
  useEffect(() => {
    pulse.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.5, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.2, { duration: 4000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: pulse.value,
    transform: [{ scale: interpolate(pulse.value, [0.2, 0.5], [0.9, 1.1]) }],
  }));
  return (
    <Animated.View
      style={[{ position: "absolute", width: size, height: size, borderRadius: size / 2, backgroundColor: color, top, left }, style]}
    />
  );
};

// ─── Category Config ──────────────────────────────────────────────────────────
const CATEGORY_META = {
  Strength: { icon: "barbell-outline",  color: "#f87171", gradient: ["#ef4444", "#b91c1c"] },
  Cardio:   { icon: "heart-outline",    color: "#f472b6", gradient: ["#ec4899", "#9d174d"] },
  Yoga:     { icon: "body-outline",     color: "#a5b4fc", gradient: ["#6366f1", "#4338ca"] },
};

// ─── Duration Config ──────────────────────────────────────────────────────────
const PLAN_META = {
  Monthly:     { icon: "calendar-outline",    color: "#34d399", months: 1  },
  Quarterly:   { icon: "calendar-clear-outline", color: "#60a5fa", months: 3  },
  "Half-Yearly": { icon: "time-outline",       color: "#fbbf24", months: 6  },
  Yearly:      { icon: "trophy-outline",       color: "#a5b4fc", months: 12 },
  Custom:      { icon: "options-outline",      color: "#fb923c", months: null },
};

// ─── Best-value tag thresholds ────────────────────────────────────────────────
const getBestValueLabel = (name) => {
  if (name === "Yearly")     return { label: "Best Value", color: "#fbbf24" };
  if (name === "Half-Yearly") return { label: "Popular",   color: "#a5b4fc" };
  return null;
};

// ─── Savings Calculator ────────────────────────────────────────────────────────
const calcSavings = (plan, monthlyPrice) => {
  if (!monthlyPrice || plan.name === "Monthly" || !plan.durationInMonths) return null;
  const wouldPay = monthlyPrice * plan.durationInMonths;
  const saved = wouldPay - plan.price;
  if (saved <= 0) return null;
  const pct = Math.round((saved / wouldPay) * 100);
  return { saved, pct };
};

// ─── Plan Card ────────────────────────────────────────────────────────────────
const PlanCard = ({ plan, index, monthlyPrice, onEnroll }) => {
  const catMeta  = CATEGORY_META[plan.category]  || CATEGORY_META.Strength;
  const planMeta = PLAN_META[plan.name]           || PLAN_META.Custom;
  const badge    = getBestValueLabel(plan.name);
  const savings  = calcSavings(plan, monthlyPrice);
  const spotsLeft = plan.currentEnrolledMembers !== undefined
    ? Math.max(0, 100 - plan.currentEnrolledMembers) // demo cap at 100
    : null;

  const pricePerMonth = plan.durationInMonths
    ? (plan.price / plan.durationInMonths).toFixed(0)
    : null;

  return (
    <Animated.View entering={FadeInDown.delay(index * 90).springify()} style={{ marginBottom: 16 }}>
      <View
        style={{
          backgroundColor: "rgba(20,20,30,0.92)",
          borderRadius: 20,
          borderWidth: 1,
          borderColor: badge ? `${planMeta.color}40` : "rgba(255,255,255,0.07)",
          overflow: "hidden",
        }}
      >
        {/* ── Top Accent Strip ─────────────────────────────── */}
        <LinearGradient
          colors={[`${catMeta.color}30`, "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ height: 3 }}
        />

        <View style={{ padding: 16 }}>
          {/* ── Header row ────────────────────────────────── */}
          <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 14 }}>
            {/* Category Icon */}
            <LinearGradient
              colors={catMeta.gradient}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={{
                width: 46, height: 46, borderRadius: 14,
                alignItems: "center", justifyContent: "center",
                marginRight: 12,
              }}
            >
              <Ionicons name={catMeta.icon} size={22} color="#fff" />
            </LinearGradient>

            <View style={{ flex: 1 }}>
              {/* Plan name + badge row */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <Text style={{ fontSize: 18, fontWeight: "900", color: "#fff", letterSpacing: -0.4 }}>
                  {plan.name}
                </Text>
                {badge && (
                  <Animated.View entering={ZoomIn.delay(index * 90 + 200)}>
                    <View
                      style={{
                        backgroundColor: `${badge.color}20`,
                        borderWidth: 1,
                        borderColor: `${badge.color}40`,
                        borderRadius: 8,
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                      }}
                    >
                      <Text style={{ fontSize: 9, fontWeight: "800", color: badge.color, letterSpacing: 0.8, textTransform: "uppercase" }}>
                        {badge.label}
                      </Text>
                    </View>
                  </Animated.View>
                )}
              </View>

              {/* Category + duration */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <View
                    style={{
                      width: 18, height: 18, borderRadius: 5,
                      backgroundColor: `${catMeta.color}20`,
                      borderWidth: 1, borderColor: `${catMeta.color}35`,
                      alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <Ionicons name={catMeta.icon} size={10} color={catMeta.color} />
                  </View>
                  <Text style={{ fontSize: 11, color: catMeta.color, fontWeight: "700" }}>{plan.category}</Text>
                </View>

                <View style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.2)" }} />

                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Ionicons name={planMeta.icon} size={11} color={planMeta.color} />
                  <Text style={{ fontSize: 11, color: planMeta.color, fontWeight: "600" }}>
                    {plan.durationInMonths
                      ? `${plan.durationInMonths} Month${plan.durationInMonths > 1 ? "s" : ""}`
                      : "Custom"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Price column */}
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ fontSize: 24, fontWeight: "900", color: "#fff", letterSpacing: -1 }}>
                ₹{plan.price.toLocaleString("en-IN")}
              </Text>
              {pricePerMonth && (
                <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: "500", marginTop: 1 }}>
                  ₹{pricePerMonth}/mo
                </Text>
              )}
            </View>
          </View>

          {/* ── Divider ────────────────────────────────────── */}
          <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.05)", marginBottom: 12 }} />

          {/* ── Stats Row ─────────────────────────────────── */}
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 14 }}>
            {/* Savings chip */}
            {savings ? (
              <View
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 5,
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  borderRadius: 12,
                  backgroundColor: "rgba(16,185,129,0.1)",
                  borderWidth: 1,
                  borderColor: "rgba(16,185,129,0.2)",
                }}
              >
                <Ionicons name="pricetag-outline" size={12} color="#10b981" />
                <Text style={{ fontSize: 11, color: "#10b981", fontWeight: "700" }}>
                  Save {savings.pct}% (₹{savings.saved.toLocaleString("en-IN")})
                </Text>
              </View>
            ) : (
              <View
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 5,
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  borderRadius: 12,
                  backgroundColor: "rgba(255,255,255,0.04)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.08)",
                }}
              >
                <Ionicons name="flash-outline" size={12} color="rgba(255,255,255,0.4)" />
                <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: "600" }}>
                  Pay month to month
                </Text>
              </View>
            )}

            {/* Enrolled chip */}
            {spotsLeft !== null && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 5,
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  borderRadius: 12,
                  backgroundColor: spotsLeft < 10 ? "rgba(248,113,113,0.12)" : "rgba(255,255,255,0.04)",
                  borderWidth: 1,
                  borderColor: spotsLeft < 10 ? "rgba(248,113,113,0.25)" : "rgba(255,255,255,0.08)",
                }}
              >
                <Ionicons
                  name="people-outline"
                  size={12}
                  color={spotsLeft < 10 ? "#f87171" : "rgba(255,255,255,0.4)"}
                />
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "700",
                    color: spotsLeft < 10 ? "#f87171" : "rgba(255,255,255,0.45)",
                  }}
                >
                  {plan.currentEnrolledMembers} enrolled
                </Text>
              </View>
            )}
          </View>

          {/* ── CTA ───────────────────────────────────────── */}
          {plan.isActive ? (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => onEnroll(plan)}
              style={{ borderRadius: 14, overflow: "hidden" }}
            >
              <LinearGradient
                colors={catMeta.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  paddingVertical: 13,
                }}
              >
                <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                <Text style={{ fontSize: 14, fontWeight: "800", color: "#fff", letterSpacing: 0.2 }}>
                  Enroll Now · ₹{plan.price.toLocaleString("en-IN")}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                paddingVertical: 13,
                borderRadius: 14,
                backgroundColor: "rgba(255,255,255,0.04)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.08)",
              }}
            >
              <Ionicons name="close-circle-outline" size={16} color="rgba(255,255,255,0.25)" />
              <Text style={{ fontSize: 14, fontWeight: "700", color: "rgba(255,255,255,0.3)" }}>
                Currently Unavailable
              </Text>
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

// ─── Filter Chip ──────────────────────────────────────────────────────────────
const FilterChip = ({ label, icon, color, active, onPress }) => (
  <TouchableOpacity activeOpacity={0.75} onPress={onPress}>
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingHorizontal: 13,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: active ? `${color}22` : "rgba(255,255,255,0.05)",
        borderWidth: 1,
        borderColor: active ? `${color}55` : "rgba(255,255,255,0.08)",
        marginRight: 8,
      }}
    >
      {icon && <Ionicons name={icon} size={12} color={active ? color : "rgba(255,255,255,0.4)"} />}
      <Text style={{ fontSize: 12, fontWeight: "700", color: active ? color : "rgba(255,255,255,0.45)" }}>
        {label}
      </Text>
    </View>
  </TouchableOpacity>
);

// ─── Summary Stat ─────────────────────────────────────────────────────────────
const StatCard = ({ icon, value, label, color, delay = 0 }) => (
  <Animated.View entering={FadeInUp.delay(delay).springify()} style={{ flex: 1 }}>
    <View
      style={{
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.04)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.07)",
        borderRadius: 16,
        paddingVertical: 14,
        gap: 5,
      }}
    >
      <View
        style={{
          width: 34, height: 34, borderRadius: 10,
          backgroundColor: `${color}18`,
          borderWidth: 1, borderColor: `${color}30`,
          alignItems: "center", justifyContent: "center",
          marginBottom: 2,
        }}
      >
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text style={{ fontSize: 17, fontWeight: "900", color: "#fff" }}>{value}</Text>
      <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: "600", textAlign: "center" }}>
        {label}
      </Text>
    </View>
  </Animated.View>
);

// ─── Mock Plans Data ──────────────────────────────────────────────────────────
const MOCK_PLANS = [
  {
    _id: "p1",
    gymId: "gym001",
    name: "Monthly",
    category: "Strength",
    price: 1499,
    durationInMonths: 1,
    currentEnrolledMembers: 42,
    isActive: true,
  },
  {
    _id: "p2",
    gymId: "gym001",
    name: "Quarterly",
    category: "Strength",
    price: 3999,
    durationInMonths: 3,
    currentEnrolledMembers: 87,
    isActive: true,
  },
  {
    _id: "p3",
    gymId: "gym001",
    name: "Half-Yearly",
    category: "Cardio",
    price: 6999,
    durationInMonths: 6,
    currentEnrolledMembers: 64,
    isActive: true,
  },
  {
    _id: "p4",
    gymId: "gym001",
    name: "Yearly",
    category: "Strength",
    price: 11999,
    durationInMonths: 12,
    currentEnrolledMembers: 31,
    isActive: true,
  },
  {
    _id: "p5",
    gymId: "gym001",
    name: "Monthly",
    category: "Yoga",
    price: 999,
    durationInMonths: 1,
    currentEnrolledMembers: 18,
    isActive: true,
  },
  {
    _id: "p6",
    gymId: "gym001",
    name: "Quarterly",
    category: "Yoga",
    price: 2699,
    durationInMonths: 3,
    currentEnrolledMembers: 9,
    isActive: true,
  },
  {
    _id: "p7",
    gymId: "gym001",
    name: "Monthly",
    category: "Cardio",
    price: 1299,
    durationInMonths: 1,
    currentEnrolledMembers: 55,
    isActive: true,
  },
  {
    _id: "p8",
    gymId: "gym001",
    name: "Custom",
    category: "Strength",
    price: 4500,
    durationInMonths: 2,
    currentEnrolledMembers: 7,
    isActive: false,
  },
];

const CATEGORY_FILTERS = [
  { key: "All",      icon: "apps-outline",    color: "#a5b4fc" },
  { key: "Strength", icon: "barbell-outline", color: "#f87171" },
  { key: "Cardio",   icon: "heart-outline",   color: "#f472b6" },
  { key: "Yoga",     icon: "body-outline",    color: "#a5b4fc" },
];

const DURATION_FILTERS = [
  { key: "All",        label: "All" },
  { key: "Monthly",    label: "Monthly" },
  { key: "Quarterly",  label: "3M" },
  { key: "Half-Yearly",label: "6M" },
  { key: "Yearly",     label: "Yearly" },
];

// ─── Main Screen ──────────────────────────────────────────────────────────────
const GymPlansScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  // In production: const gymId = route.params?.gymId;
  const gymName = route.params?.gymName || "IronEdge Fitness";

  const [plans, setPlans]             = useState([]);
  const [filtered, setFiltered]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [catFilter, setCatFilter]     = useState("All");
  const [durFilter, setDurFilter]     = useState("All");
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setPlans(MOCK_PLANS);
      setLoading(false);
    }, 800);
    return () => clearTimeout(t);
  }, []);

  // Find cheapest monthly plan price for savings calculation
  const monthlyPrice = plans
    .filter((p) => p.name === "Monthly" && p.isActive)
    .reduce((min, p) => (p.price < min ? p.price : min), Infinity);

  // Apply filters
  useEffect(() => {
    let result = [...plans];
    if (catFilter !== "All") result = result.filter((p) => p.category === catFilter);
    if (durFilter !== "All") result = result.filter((p) => p.name === durFilter);
    if (showActiveOnly)       result = result.filter((p) => p.isActive);
    setFiltered(result);
  }, [plans, catFilter, durFilter, showActiveOnly]);

  const handleEnroll = useCallback((plan) => {
    navigation.navigate("Payment", { plan });
  }, [navigation]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#09090f", alignItems: "center", justifyContent: "center" }}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, marginTop: 14, fontWeight: "500" }}>
          Loading plans…
        </Text>
      </View>
    );
  }

  const activePlans  = plans.filter((p) => p.isActive).length;
  const lowestPrice  = Math.min(...plans.filter((p) => p.isActive).map((p) => p.price));
  const totalEnrolled = plans.reduce((s, p) => s + (p.currentEnrolledMembers || 0), 0);

  return (
    <View style={{ flex: 1, backgroundColor: "#09090f" }}>
      <StatusBar barStyle="light-content" />

      {/* Background Gradient */}
      <LinearGradient
        colors={["rgba(99,102,241,0.22)", "rgba(139,92,246,0.08)", "rgba(0,0,0,0)"]}
        locations={[0, 0.45, 1]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 380 }}
      />

      {/* Glow Orbs */}
      <GlowOrb size={260} color="rgba(99,102,241,0.14)" top={-50}  left={SCREEN_WIDTH / 2 - 130} delay={0}    />
      <GlowOrb size={200} color="rgba(248,113,113,0.08)" top={320} left={-80}                    delay={1200} />
      <GlowOrb size={160} color="rgba(167,139,250,0.09)" top={700} left={SCREEN_WIDTH - 100}     delay={2400} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>

        {/* ── Top Nav ────────────────────────────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(0).duration(450)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingTop: 54,
            paddingBottom: 8,
          }}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
            style={{
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: "rgba(9,9,15,0.75)",
              borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
              alignItems: "center", justifyContent: "center",
            }}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>

          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: "600", textTransform: "uppercase", letterSpacing: 1 }}>
              Membership Plans
            </Text>
            <Text style={{ fontSize: 15, fontWeight: "800", color: "#fff", marginTop: 1 }} numberOfLines={1}>
              {gymName}
            </Text>
          </View>

          {/* Active filter toggle */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setShowActiveOnly((v) => !v)}
            style={{
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: showActiveOnly ? "rgba(99,102,241,0.2)" : "rgba(9,9,15,0.75)",
              borderWidth: 1,
              borderColor: showActiveOnly ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.12)",
              alignItems: "center", justifyContent: "center",
            }}
          >
            <Ionicons name="filter" size={18} color={showActiveOnly ? "#a5b4fc" : "rgba(255,255,255,0.5)"} />
          </TouchableOpacity>
        </Animated.View>

        {/* ── Hero Banner ─────────────────────────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(80).springify()}
          style={{ marginHorizontal: 20, marginTop: 16, marginBottom: 20 }}
        >
          <LinearGradient
            colors={["rgba(99,102,241,0.25)", "rgba(139,92,246,0.12)"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 20,
              padding: 20,
              borderWidth: 1,
              borderColor: "rgba(99,102,241,0.25)",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <LinearGradient
                colors={["#6366f1", "#8b5cf6"]}
                style={{ width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" }}
              >
                <Ionicons name="ribbon-outline" size={18} color="#fff" />
              </LinearGradient>
              <View>
                <Text style={{ fontSize: 16, fontWeight: "900", color: "#fff" }}>Choose Your Plan</Text>
                <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 1 }}>
                  Unlock your fitness journey today
                </Text>
              </View>
            </View>
            <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 18 }}>
              Select a plan that fits your goals. Longer plans offer more savings and exclusive perks.
            </Text>
          </LinearGradient>
        </Animated.View>

        {/* ── Stats Row ───────────────────────────────────────────────────── */}
        <View style={{ flexDirection: "row", gap: 10, marginHorizontal: 20, marginBottom: 20 }}>
          <StatCard icon="pricetag-outline" value={`₹${lowestPrice.toLocaleString("en-IN")}`} label="Starting at" color="#10b981" delay={100} />
          <StatCard icon="documents-outline" value={activePlans}       label="Active Plans" color="#6366f1" delay={160} />
          <StatCard icon="people-outline"    value={totalEnrolled}     label="Enrolled"     color="#f472b6" delay={220} />
        </View>

        {/* ── Category Filter ─────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 4 }}
            style={{ marginBottom: 10 }}
          >
            {CATEGORY_FILTERS.map((f) => (
              <FilterChip
                key={f.key}
                label={f.key}
                icon={f.icon}
                color={f.color}
                active={catFilter === f.key}
                onPress={() => setCatFilter(f.key)}
              />
            ))}
          </ScrollView>
        </Animated.View>

        {/* ── Duration Filter ─────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(240).springify()}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 4 }}
            style={{ marginBottom: 20 }}
          >
            {DURATION_FILTERS.map((f) => (
              <FilterChip
                key={f.key}
                label={f.label}
                color="#fbbf24"
                active={durFilter === f.key}
                onPress={() => setDurFilter(f.key)}
              />
            ))}
          </ScrollView>
        </Animated.View>

        {/* ── Results Header ──────────────────────────────────────────────── */}
        <Animated.View
          entering={FadeIn.delay(280)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            marginBottom: 12,
          }}
        >
          <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", fontWeight: "600" }}>
            {filtered.length} plan{filtered.length !== 1 ? "s" : ""} found
          </Text>
          {showActiveOnly && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                backgroundColor: "rgba(99,102,241,0.12)",
                borderWidth: 1,
                borderColor: "rgba(99,102,241,0.25)",
                borderRadius: 10,
                paddingHorizontal: 8,
                paddingVertical: 3,
              }}
            >
              <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: "#6366f1" }} />
              <Text style={{ fontSize: 10, color: "#a5b4fc", fontWeight: "700" }}>Active Only</Text>
            </View>
          )}
        </Animated.View>

        {/* ── Plan Cards ──────────────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: 20 }}>
          {filtered.length === 0 ? (
            <Animated.View
              entering={FadeIn.delay(300)}
              style={{ alignItems: "center", paddingVertical: 60, gap: 12 }}
            >
              <View
                style={{
                  width: 64, height: 64, borderRadius: 20,
                  backgroundColor: "rgba(99,102,241,0.1)",
                  borderWidth: 1, borderColor: "rgba(99,102,241,0.2)",
                  alignItems: "center", justifyContent: "center",
                }}
              >
                <Ionicons name="search-outline" size={28} color="rgba(165,180,252,0.5)" />
              </View>
              <Text style={{ fontSize: 15, fontWeight: "800", color: "rgba(255,255,255,0.5)" }}>
                No plans found
              </Text>
              <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textAlign: "center" }}>
                Try changing the category or duration filter
              </Text>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => { setCatFilter("All"); setDurFilter("All"); setShowActiveOnly(false); }}
                style={{
                  marginTop: 4,
                  paddingHorizontal: 20, paddingVertical: 10,
                  borderRadius: 12,
                  backgroundColor: "rgba(99,102,241,0.15)",
                  borderWidth: 1, borderColor: "rgba(99,102,241,0.3)",
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#a5b4fc" }}>Reset Filters</Text>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            filtered.map((plan, idx) => (
              <PlanCard
                key={plan._id}
                plan={plan}
                index={idx}
                monthlyPrice={monthlyPrice === Infinity ? null : monthlyPrice}
                onEnroll={handleEnroll}
              />
            ))
          )}
        </View>

        {/* ── Bottom Note ─────────────────────────────────────────────────── */}
        {filtered.length > 0 && (
          <Animated.View
            entering={FadeIn.delay(400)}
            style={{
              marginHorizontal: 20,
              marginTop: 4,
              padding: 14,
              borderRadius: 14,
              backgroundColor: "rgba(255,255,255,0.03)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.06)",
              flexDirection: "row",
              alignItems: "flex-start",
              gap: 10,
            }}
          >
            <Ionicons name="information-circle-outline" size={16} color="rgba(165,180,252,0.5)" style={{ marginTop: 1 }} />
            <Text style={{ flex: 1, fontSize: 11, color: "rgba(255,255,255,0.35)", lineHeight: 17, fontWeight: "400" }}>
              All plans renew automatically. You can cancel anytime from your profile. Savings are calculated against the Monthly plan price.
            </Text>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
};

export default GymPlansScreen;
