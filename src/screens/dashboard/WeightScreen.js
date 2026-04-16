import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Dimensions,
  TextInput,
  Alert,
  Modal,
  Vibration,
  Platform,
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
  withSpring,
  FadeInDown,
  FadeInUp,
  FadeIn,
  SlideInRight,
  Easing,
  interpolate,
  runOnJS,
} from "react-native-reanimated";
import Svg, {
  Path,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  Circle,
  Line,
  Text as SvgText,
  Rect,
} from "react-native-svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRAPH_WIDTH = SCREEN_WIDTH - 48;
const GRAPH_HEIGHT = 180;

// ─── Glow Orb ─────────────────────────────────────────────────────────────────
const GlowOrb = ({ size, color, top, left, delay = 0 }) => {
  const pulse = useSharedValue(0.25);
  useEffect(() => {
    pulse.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.6, { duration: 3800, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.25, { duration: 3800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: pulse.value,
    transform: [{ scale: interpolate(pulse.value, [0.25, 0.6], [0.9, 1.1]) }],
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

// ─── BMI Helpers ──────────────────────────────────────────────────────────────
const calcBMI = (weightKg, heightCm) => {
  if (!weightKg || !heightCm) return null;
  const hm = heightCm / 100;
  return +(weightKg / (hm * hm)).toFixed(1);
};

const bmiCategory = (bmi) => {
  if (bmi < 18.5) return { label: "Underweight", color: "#60a5fa", emoji: "🌿" };
  if (bmi < 25)   return { label: "Healthy",     color: "#34d399", emoji: "✅" };
  if (bmi < 30)   return { label: "Overweight",  color: "#fbbf24", emoji: "⚠️" };
  return                  { label: "Obese",       color: "#f87171", emoji: "🔴" };
};

const bmiPointerPercent = (bmi) => {
  // Scale 15–40 → 0–100%
  const clamped = Math.max(15, Math.min(40, bmi));
  return ((clamped - 15) / 25) * 100;
};

// ─── Trend Sparkline Graph ─────────────────────────────────────────────────────
const WeightGraph = ({ entries }) => {
  if (!entries || entries.length < 2) {
    return (
      <View style={{ height: GRAPH_HEIGHT, alignItems: "center", justifyContent: "center" }}>
        <Ionicons name="analytics-outline" size={32} color="rgba(255,255,255,0.15)" />
        <Text style={{ color: "rgba(255,255,255,0.2)", fontSize: 12, marginTop: 8 }}>
          Log at least 2 entries to see your trend
        </Text>
      </View>
    );
  }

  const weights = entries.map((e) => e.weight);
  const minW = Math.min(...weights) - 1;
  const maxW = Math.max(...weights) + 1;
  const range = maxW - minW || 1;

  const PAD_LEFT = 32;
  const PAD_RIGHT = 16;
  const PAD_TOP = 16;
  const PAD_BOTTOM = 28;
  const gW = GRAPH_WIDTH - PAD_LEFT - PAD_RIGHT;
  const gH = GRAPH_HEIGHT - PAD_TOP - PAD_BOTTOM;

  const toX = (i) => PAD_LEFT + (i / (entries.length - 1)) * gW;
  const toY = (w) => PAD_TOP + gH - ((w - minW) / range) * gH;

  // Build smooth path using cubic bezier
  const pts = entries.map((e, i) => ({ x: toX(i), y: toY(e.weight) }));

  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const cpx = (prev.x + curr.x) / 2;
    d += ` C ${cpx} ${prev.y} ${cpx} ${curr.y} ${curr.x} ${curr.y}`;
  }

  // Area fill path
  const lastPt = pts[pts.length - 1];
  const filld =
    d +
    ` L ${lastPt.x} ${PAD_TOP + gH} L ${pts[0].x} ${PAD_TOP + gH} Z`;

  // Y-axis labels
  const yLabels = [minW + 1, minW + range / 2, maxW - 1].map((w) => ({
    val: w.toFixed(1),
    y: toY(w),
  }));

  // X-axis labels (first, mid, last)
  const xIdxs = [0, Math.floor((entries.length - 1) / 2), entries.length - 1];
  const xLabels = xIdxs.map((i) => ({
    label: entries[i].date,
    x: toX(i),
  }));

  const isDown = weights[weights.length - 1] <= weights[0];

  return (
    <Svg width={GRAPH_WIDTH} height={GRAPH_HEIGHT}>
      <Defs>
        <SvgGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor={isDown ? "#34d399" : "#f87171"} />
          <Stop offset="100%" stopColor={isDown ? "#06b6d4" : "#fbbf24"} />
        </SvgGradient>
        <SvgGradient id="fillGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={isDown ? "#34d399" : "#f87171"} stopOpacity="0.18" />
          <Stop offset="100%" stopColor={isDown ? "#34d399" : "#f87171"} stopOpacity="0" />
        </SvgGradient>
      </Defs>

      {/* Grid lines */}
      {yLabels.map((yl, i) => (
        <Line
          key={i}
          x1={PAD_LEFT}
          y1={yl.y}
          x2={GRAPH_WIDTH - PAD_RIGHT}
          y2={yl.y}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
      ))}

      {/* Y-axis labels */}
      {yLabels.map((yl, i) => (
        <SvgText
          key={i}
          x={PAD_LEFT - 4}
          y={yl.y + 4}
          fontSize="8"
          fill="rgba(255,255,255,0.3)"
          textAnchor="end"
        >
          {yl.val}
        </SvgText>
      ))}

      {/* Area fill */}
      <Path d={filld} fill="url(#fillGrad)" />

      {/* Trend line */}
      <Path
        d={d}
        fill="none"
        stroke="url(#lineGrad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Data points */}
      {pts.map((p, i) => (
        <Circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={i === pts.length - 1 ? 5 : 3}
          fill={i === pts.length - 1 ? (isDown ? "#34d399" : "#f87171") : "rgba(255,255,255,0.5)"}
          stroke="#09090f"
          strokeWidth="2"
        />
      ))}

      {/* X-axis labels */}
      {xLabels.map((xl, i) => (
        <SvgText
          key={i}
          x={xl.x}
          y={GRAPH_HEIGHT - 4}
          fontSize="8"
          fill="rgba(255,255,255,0.3)"
          textAnchor="middle"
        >
          {xl.label}
        </SvgText>
      ))}
    </Svg>
  );
};

// ─── BMI Gauge ─────────────────────────────────────────────────────────────────
const BMIGauge = ({ bmi }) => {
  if (!bmi) return null;
  const cat = bmiCategory(bmi);
  const pct = bmiPointerPercent(bmi);

  return (
    <Animated.View entering={FadeInDown.delay(400).springify()}>
      <View
        style={{
          backgroundColor: "rgba(255,255,255,0.03)",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.07)",
          borderRadius: 20,
          padding: 18,
          marginHorizontal: 20,
          marginBottom: 14,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <Ionicons name="body-outline" size={16} color="#a5b4fc" />
          <Text style={{ fontSize: 14, fontWeight: "700", color: "rgba(255,255,255,0.85)" }}>
            BMI Tracker
          </Text>
        </View>

        {/* Big BMI number */}
        <View style={{ alignItems: "center", marginBottom: 16 }}>
          <Text style={{ fontSize: 52, fontWeight: "900", color: cat.color, letterSpacing: -2 }}>
            {bmi}
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              backgroundColor: `${cat.color}18`,
              borderWidth: 1,
              borderColor: `${cat.color}40`,
              borderRadius: 20,
              paddingHorizontal: 14,
              paddingVertical: 5,
              marginTop: 4,
            }}
          >
            <Text style={{ fontSize: 14 }}>{cat.emoji}</Text>
            <Text style={{ fontSize: 13, fontWeight: "700", color: cat.color }}>
              {cat.label}
            </Text>
          </View>
        </View>

        {/* Gauge bar */}
        <View style={{ position: "relative", height: 10, borderRadius: 6, overflow: "hidden", marginBottom: 6 }}>
          <LinearGradient
            colors={["#60a5fa", "#34d399", "#fbbf24", "#f87171"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1 }}
          />
          {/* Pointer */}
          <View
            style={{
              position: "absolute",
              top: -3,
              left: `${pct}%`,
              marginLeft: -6,
              width: 12,
              height: 16,
              borderRadius: 3,
              backgroundColor: "#fff",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.4,
              shadowRadius: 4,
            }}
          />
        </View>

        {/* Scale labels */}
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          {["15", "18.5", "25", "30", "40"].map((l) => (
            <Text key={l} style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontWeight: "600" }}>
              {l}
            </Text>
          ))}
        </View>

        {/* Tip */}
        <View
          style={{
            marginTop: 14,
            backgroundColor: "rgba(99,102,241,0.08)",
            borderRadius: 10,
            borderWidth: 1,
            borderColor: "rgba(99,102,241,0.15)",
            padding: 10,
          }}
        >
          <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", lineHeight: 16 }}>
            {bmi < 18.5
              ? "💡 Consider increasing caloric intake and strength training to build healthy muscle mass."
              : bmi < 25
              ? "🎉 Great job! You're in the healthy BMI range. Keep maintaining your routine."
              : bmi < 30
              ? "💡 Focus on cardio and caloric deficit. Even a 5% weight loss improves health markers."
              : "💡 Consult your physician for a personalized weight loss plan tailored to your needs."}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

// ─── Weight History Item ───────────────────────────────────────────────────────
const HistoryItem = ({ entry, prevWeight, onDelete, delay }) => {
  const diff = prevWeight != null ? (entry.weight - prevWeight).toFixed(1) : null;
  const isGain = diff > 0;

  return (
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
            width: 42,
            height: 42,
            borderRadius: 13,
            backgroundColor: "rgba(99,102,241,0.1)",
            borderWidth: 1,
            borderColor: "rgba(99,102,241,0.2)",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          <Ionicons name="scale-outline" size={18} color="#a5b4fc" />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: "800", color: "#fff", letterSpacing: -0.4 }}>
            {entry.weight} kg
          </Text>
          <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>
            {entry.date} · {entry.time}
          </Text>
        </View>

        {diff !== null && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 3,
              backgroundColor: isGain
                ? "rgba(248,113,113,0.12)"
                : "rgba(52,211,153,0.12)",
              borderWidth: 1,
              borderColor: isGain
                ? "rgba(248,113,113,0.25)"
                : "rgba(52,211,153,0.25)",
              borderRadius: 20,
              paddingHorizontal: 10,
              paddingVertical: 4,
              marginRight: 8,
            }}
          >
            <Ionicons
              name={isGain ? "trending-up" : "trending-down"}
              size={11}
              color={isGain ? "#f87171" : "#34d399"}
            />
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: isGain ? "#f87171" : "#34d399",
              }}
            >
              {isGain ? "+" : ""}{diff} kg
            </Text>
          </View>
        )}

        <TouchableOpacity onPress={() => onDelete(entry.id)} activeOpacity={0.7}>
          <Ionicons name="trash-outline" size={16} color="rgba(248,113,113,0.45)" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

// ─── Main Screen ───────────────────────────────────────────────────────────────
const WeightScreen = () => {
  const navigation = useNavigation();

  // State
  const [entries, setEntries] = useState([
    { id: 1, weight: 78.5, date: "Apr 10", time: "7:02 AM" },
    { id: 2, weight: 78.0, date: "Apr 11", time: "6:55 AM" },
    { id: 3, weight: 77.6, date: "Apr 12", time: "7:10 AM" },
    { id: 4, weight: 77.2, date: "Apr 13", time: "8:00 AM" },
    { id: 5, weight: 76.8, date: "Apr 14", time: "7:30 AM" },
    { id: 6, weight: 76.5, date: "Apr 15", time: "7:05 AM" },
    { id: 7, weight: 76.1, date: "Apr 16", time: "7:00 AM" },
  ]);
  const [modalVisible, setModalVisible] = useState(false);
  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [inputWeight, setInputWeight] = useState("");
  const [weightGoal, setWeightGoal] = useState(72);
  const [goalInput, setGoalInput] = useState("72");
  const [heightCm, setHeightCm] = useState(175);
  const [activeFilter, setActiveFilter] = useState("1W"); // 1W, 1M, 3M, All
  const [unit, setUnit] = useState("kg"); // kg or lbs

  // Animated value for modal
  const modalScale = useSharedValue(0.85);
  const modalOpacity = useSharedValue(0);

  const openModal = () => {
    setModalVisible(true);
    modalScale.value = withSpring(1, { damping: 15 });
    modalOpacity.value = withTiming(1, { duration: 200 });
  };

  const closeModal = () => {
    modalScale.value = withTiming(0.85, { duration: 150 });
    modalOpacity.value = withTiming(0, { duration: 150 });
    setTimeout(() => setModalVisible(false), 150);
    setInputWeight("");
  };

  const modalAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: modalScale.value }],
    opacity: modalOpacity.value,
  }));

  // Derived
  const latestWeight = entries.length > 0 ? entries[entries.length - 1].weight : null;
  const firstWeight = entries.length > 0 ? entries[0].weight : null;
  const totalChange = latestWeight != null && firstWeight != null
    ? (latestWeight - firstWeight).toFixed(1)
    : null;
  const bmi = calcBMI(latestWeight, heightCm);

  const progressToGoal =
    latestWeight && firstWeight
      ? Math.min(100, Math.max(0,
          ((firstWeight - latestWeight) / (firstWeight - weightGoal)) * 100
        ))
      : 0;

  // Filter entries
  const filteredEntries = useCallback(() => {
    if (activeFilter === "All" || entries.length === 0) return entries;
    const days = activeFilter === "1W" ? 7 : activeFilter === "1M" ? 30 : 90;
    return entries.slice(-days);
  }, [entries, activeFilter])();

  // Add entry
  const addEntry = () => {
    const w = parseFloat(inputWeight);
    if (isNaN(w) || w < 20 || w > 500) {
      Alert.alert("Invalid Weight", "Please enter a valid weight between 20 and 500 kg.");
      return;
    }

    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

    setEntries((prev) => [
      ...prev,
      { id: Date.now(), weight: w, date: dateStr, time: timeStr },
    ]);
    if (Platform.OS !== "web") Vibration.vibrate(50);
    closeModal();
  };

  const deleteEntry = (id) => {
    Alert.alert("Delete Entry", "Remove this weight log?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => setEntries((prev) => prev.filter((e) => e.id !== id)),
      },
    ]);
  };

  const saveGoal = () => {
    const g = parseFloat(goalInput);
    if (isNaN(g) || g < 20 || g > 400) {
      Alert.alert("Invalid Goal", "Enter a realistic weight goal.");
      return;
    }
    setWeightGoal(g);
    setGoalModalVisible(false);
  };

  const kgLeft = latestWeight ? Math.max(0, latestWeight - weightGoal).toFixed(1) : "—";
  const isOnTrack = totalChange !== null && parseFloat(totalChange) < 0;

  return (
    <View style={{ flex: 1, backgroundColor: "#09090f" }}>
      <StatusBar barStyle="light-content" />

      {/* Background gradient */}
      <LinearGradient
        colors={["rgba(52,211,153,0.22)", "rgba(6,182,212,0.10)", "rgba(0,0,0,0)"]}
        locations={[0, 0.45, 1]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 360 }}
      />

      {/* Glow orbs */}
      <GlowOrb size={280} color="rgba(52,211,153,0.12)" top={-60} left={SCREEN_WIDTH / 2 - 140} delay={0} />
      <GlowOrb size={200} color="rgba(6,182,212,0.08)"  top={300} left={-60} delay={1000} />
      <GlowOrb size={160} color="rgba(99,102,241,0.07)" top={600} left={SCREEN_WIDTH - 100} delay={2000} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 56 }}>
        {/* ── Top Bar ──────────────────────────────────────────────────────── */}
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
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: "rgba(255,255,255,0.06)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.1)",
              alignItems: "center",
              justifyContent: "center",
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={18} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>

          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: 2, fontWeight: "700" }}>
              My Weight
            </Text>
            <Text style={{ fontSize: 18, fontWeight: "800", color: "#fff", marginTop: 2 }}>
              ⚖️ Progress Tracker
            </Text>
          </View>

          <TouchableOpacity
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: "rgba(52,211,153,0.12)",
              borderWidth: 1,
              borderColor: "rgba(52,211,153,0.25)",
              alignItems: "center",
              justifyContent: "center",
            }}
            activeOpacity={0.7}
            onPress={() => setGoalModalVisible(true)}
          >
            <Ionicons name="flag-outline" size={17} color="#34d399" />
          </TouchableOpacity>
        </Animated.View>

        {/* ── Hero Card ────────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInUp.delay(150).springify()} style={{ marginHorizontal: 20, marginTop: 12, marginBottom: 14 }}>
          <LinearGradient
            colors={["rgba(52,211,153,0.22)", "rgba(6,182,212,0.15)", "rgba(99,102,241,0.12)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 24,
              padding: 20,
              borderWidth: 1,
              borderColor: "rgba(52,211,153,0.25)",
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <View>
                <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: 1.5, fontWeight: "700", marginBottom: 4 }}>
                  Current Weight
                </Text>
                <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 6 }}>
                  <Text style={{ fontSize: 48, fontWeight: "900", color: "#fff", letterSpacing: -2 }}>
                    {latestWeight ?? "—"}
                  </Text>
                  <Text style={{ fontSize: 20, fontWeight: "700", color: "rgba(255,255,255,0.5)", marginBottom: 10 }}>
                    kg
                  </Text>
                </View>
                {totalChange !== null && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
                    <Ionicons
                      name={parseFloat(totalChange) <= 0 ? "trending-down" : "trending-up"}
                      size={14}
                      color={parseFloat(totalChange) <= 0 ? "#34d399" : "#f87171"}
                    />
                    <Text style={{ fontSize: 13, color: parseFloat(totalChange) <= 0 ? "#34d399" : "#f87171", fontWeight: "600" }}>
                      {totalChange > 0 ? "+" : ""}{totalChange} kg overall
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                onPress={openModal}
                activeOpacity={0.85}
                style={{
                  borderRadius: 18,
                  overflow: "hidden",
                }}
              >
                <LinearGradient
                  colors={["#34d399", "#06b6d4"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    paddingHorizontal: 18,
                    paddingVertical: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Ionicons name="add" size={18} color="#fff" />
                  <Text style={{ fontSize: 13, fontWeight: "800", color: "#fff" }}>Log Weight</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.08)", marginVertical: 16 }} />

            {/* Mini stats row */}
            <View style={{ flexDirection: "row", gap: 0 }}>
              {[
                { label: "Start", value: firstWeight ? `${firstWeight} kg` : "—", color: "rgba(255,255,255,0.5)" },
                { label: "Goal",  value: `${weightGoal} kg`,                       color: "#a5b4fc" },
                { label: "Left",  value: `${kgLeft} kg`,                           color: "#fbbf24" },
                { label: "Logs",  value: `${entries.length}`,                      color: "#34d399" },
              ].map((s, i) => (
                <View key={i} style={{ flex: 1, alignItems: "center", borderRightWidth: i < 3 ? 1 : 0, borderRightColor: "rgba(255,255,255,0.08)" }}>
                  <Text style={{ fontSize: 15, fontWeight: "800", color: s.color }}>{s.value}</Text>
                  <Text style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontWeight: "600", textTransform: "uppercase", letterSpacing: 1, marginTop: 3 }}>{s.label}</Text>
                </View>
              ))}
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ── Goal Progress Bar ─────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(280).springify()} style={{ marginHorizontal: 20, marginBottom: 14 }}>
          <View
            style={{
              backgroundColor: "rgba(255,255,255,0.03)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.07)",
              borderRadius: 20,
              padding: 18,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="flag-outline" size={16} color="#a5b4fc" />
                <Text style={{ fontSize: 14, fontWeight: "700", color: "rgba(255,255,255,0.85)" }}>
                  Weight Goal
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={{ fontSize: 13, fontWeight: "800", color: "#a5b4fc" }}>
                  {progressToGoal.toFixed(0)}%
                </Text>
                <TouchableOpacity onPress={() => setGoalModalVisible(true)} activeOpacity={0.7}>
                  <Ionicons name="create-outline" size={14} color="rgba(255,255,255,0.3)" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Progress bar */}
            <View style={{ height: 8, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden", marginBottom: 10 }}>
              <LinearGradient
                colors={["#34d399", "#06b6d4"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ width: `${progressToGoal}%`, height: "100%", borderRadius: 4 }}
              />
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: "500" }}>
                {firstWeight ?? "—"} kg (start)
              </Text>
              <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: "500" }}>
                🎯 {weightGoal} kg (goal)
              </Text>
            </View>

            {/* Motivational text */}
            <View style={{ marginTop: 12, backgroundColor: "rgba(52,211,153,0.06)", borderRadius: 10, borderWidth: 1, borderColor: "rgba(52,211,153,0.12)", padding: 10 }}>
              <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 16 }}>
                {progressToGoal >= 100
                  ? "🎉 Goal smashed! Set a new target to keep the momentum going."
                  : isOnTrack
                  ? `🔥 You're on track! Only ${kgLeft} kg to go. Keep it up!`
                  : `💪 Stay consistent! Log your meals and workouts to hit your target.`}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* ── Trend Graph ──────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(330).springify()} style={{ marginHorizontal: 20, marginBottom: 14 }}>
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
                <Ionicons name="analytics-outline" size={16} color="#a5b4fc" />
                <Text style={{ fontSize: 14, fontWeight: "700", color: "rgba(255,255,255,0.85)" }}>
                  Weight Trend
                </Text>
              </View>

              {/* Filter tabs */}
              <View
                style={{
                  flexDirection: "row",
                  backgroundColor: "rgba(255,255,255,0.05)",
                  borderRadius: 10,
                  padding: 2,
                }}
              >
                {["1W", "1M", "3M", "All"].map((f) => (
                  <TouchableOpacity
                    key={f}
                    onPress={() => setActiveFilter(f)}
                    activeOpacity={0.7}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 8,
                      backgroundColor: activeFilter === f ? "rgba(99,102,241,0.35)" : "transparent",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "700",
                        color: activeFilter === f ? "#a5b4fc" : "rgba(255,255,255,0.3)",
                      }}
                    >
                      {f}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <WeightGraph entries={filteredEntries} />
          </View>
        </Animated.View>

        {/* ── BMI Card ─────────────────────────────────────────────────────── */}
        <BMIGauge bmi={bmi} />

        {/* ── Insights Row ─────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(450).springify()}>
          <View style={{ flexDirection: "row", gap: 12, marginHorizontal: 20, marginBottom: 14 }}>
            {[
              {
                icon: "📉",
                label: "Best Week",
                value: "-1.8 kg",
                color: "#34d399",
                bg: "rgba(52,211,153,0.08)",
                border: "rgba(52,211,153,0.18)",
              },
              {
                icon: "🔥",
                label: "Streak",
                value: "7 Days",
                color: "#fbbf24",
                bg: "rgba(251,191,36,0.08)",
                border: "rgba(251,191,36,0.18)",
              },
              {
                icon: "📊",
                label: "Avg/Week",
                value: "-0.6 kg",
                color: "#06b6d4",
                bg: "rgba(6,182,212,0.08)",
                border: "rgba(6,182,212,0.18)",
              },
            ].map((item, i) => (
              <View
                key={i}
                style={{
                  flex: 1,
                  backgroundColor: item.bg,
                  borderWidth: 1,
                  borderColor: item.border,
                  borderRadius: 18,
                  paddingVertical: 14,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 20, marginBottom: 4 }}>{item.icon}</Text>
                <Text style={{ fontSize: 15, fontWeight: "800", color: item.color }}>{item.value}</Text>
                <Text style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontWeight: "600", textTransform: "uppercase", letterSpacing: 1, marginTop: 3 }}>{item.label}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* ── Tips Card ────────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(500).springify()} style={{ marginHorizontal: 20, marginBottom: 14 }}>
          <LinearGradient
            colors={["rgba(99,102,241,0.18)", "rgba(139,92,246,0.12)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 20,
              padding: 18,
              borderWidth: 1,
              borderColor: "rgba(99,102,241,0.25)",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Ionicons name="bulb-outline" size={16} color="#a5b4fc" />
              <Text style={{ fontSize: 14, fontWeight: "700", color: "rgba(255,255,255,0.85)" }}>
                Pro Tips
              </Text>
            </View>
            {[
              { emoji: "🌅", tip: "Weigh yourself first thing in the morning, after using the restroom." },
              { emoji: "💧", tip: "Drink 2L of water daily — hydration aids metabolism significantly." },
              { emoji: "😴", tip: "Quality sleep of 7–9 hrs helps regulate hunger hormones like leptin." },
              { emoji: "🥗", tip: "Track macros, not just calories — protein intake preserves muscle." },
            ].map((t, i) => (
              <View key={i} style={{ flexDirection: "row", gap: 10, marginBottom: i < 3 ? 10 : 0 }}>
                <Text style={{ fontSize: 16 }}>{t.emoji}</Text>
                <Text style={{ flex: 1, fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 18 }}>
                  {t.tip}
                </Text>
              </View>
            ))}
          </LinearGradient>
        </Animated.View>

        {/* ── Weight History ────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(560).springify()} style={{ marginHorizontal: 20, marginBottom: 14 }}>
          <View
            style={{
              backgroundColor: "rgba(255,255,255,0.03)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.07)",
              borderRadius: 20,
              padding: 18,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="time-outline" size={16} color="#a5b4fc" />
                <Text style={{ fontSize: 14, fontWeight: "700", color: "rgba(255,255,255,0.85)" }}>
                  Weight History
                </Text>
              </View>
              <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: "500" }}>
                {entries.length} logs
              </Text>
            </View>

            {[...entries].reverse().map((entry, i) => {
              const prevIdx = entries.length - 1 - i - 1;
              const prevWeight = prevIdx >= 0 ? entries[prevIdx].weight : null;
              return (
                <HistoryItem
                  key={entry.id}
                  entry={entry}
                  prevWeight={prevWeight}
                  onDelete={deleteEntry}
                  delay={600 + i * 30}
                />
              );
            })}

            {entries.length === 0 && (
              <View style={{ alignItems: "center", paddingVertical: 24 }}>
                <Ionicons name="scale-outline" size={36} color="rgba(255,255,255,0.1)" />
                <Text style={{ color: "rgba(255,255,255,0.2)", fontSize: 13, marginTop: 8 }}>
                  No logs yet. Tap "Log Weight" above!
                </Text>
              </View>
            )}
          </View>
        </Animated.View>
      </ScrollView>

      {/* ── Add Weight Modal ────────────────────────────────────────────────── */}
      <Modal visible={modalVisible} transparent animationType="none" onRequestClose={closeModal}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "flex-end" }}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={closeModal} />
          <Animated.View style={[{ backgroundColor: "#14141E", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" }, modalAnimStyle]}>
            {/* Handle */}
            <View style={{ width: 40, height: 4, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 2, alignSelf: "center", marginBottom: 20 }} />

            <Text style={{ fontSize: 18, fontWeight: "800", color: "#fff", marginBottom: 4 }}>
              Log Today's Weight
            </Text>
            <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 20 }}>
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </Text>

            {/* Input */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "rgba(255,255,255,0.05)",
                borderWidth: 1,
                borderColor: "rgba(99,102,241,0.35)",
                borderRadius: 16,
                paddingHorizontal: 18,
                marginBottom: 20,
              }}
            >
              <Ionicons name="scale-outline" size={20} color="rgba(165,180,252,0.7)" />
              <TextInput
                value={inputWeight}
                onChangeText={setInputWeight}
                placeholder="e.g. 75.5"
                placeholderTextColor="rgba(255,255,255,0.2)"
                keyboardType="decimal-pad"
                style={{
                  flex: 1,
                  fontSize: 28,
                  fontWeight: "800",
                  color: "#fff",
                  paddingVertical: 16,
                  paddingHorizontal: 12,
                  letterSpacing: -0.5,
                }}
                autoFocus
              />
              <Text style={{ fontSize: 16, fontWeight: "700", color: "rgba(255,255,255,0.4)" }}>kg</Text>
            </View>

            {/* Quick fill buttons */}
            {latestWeight && (
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 20 }}>
                {[latestWeight - 0.5, latestWeight, latestWeight + 0.5].map((v) => (
                  <TouchableOpacity
                    key={v}
                    onPress={() => setInputWeight(v.toFixed(1))}
                    activeOpacity={0.7}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 12,
                      backgroundColor: "rgba(99,102,241,0.1)",
                      borderWidth: 1,
                      borderColor: "rgba(99,102,241,0.2)",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: "700", color: "#a5b4fc" }}>{v.toFixed(1)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TouchableOpacity onPress={addEntry} activeOpacity={0.85} style={{ borderRadius: 16, overflow: "hidden" }}>
              <LinearGradient
                colors={["#34d399", "#06b6d4"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ paddingVertical: 16, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}
              >
                <Ionicons name="checkmark-circle" size={18} color="#fff" />
                <Text style={{ fontSize: 15, fontWeight: "800", color: "#fff" }}>Save Entry</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={{ height: 16 }} />
          </Animated.View>
        </View>
      </Modal>

      {/* ── Goal Modal ───────────────────────────────────────────────────────── */}
      <Modal visible={goalModalVisible} transparent animationType="fade" onRequestClose={() => setGoalModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "center", alignItems: "center", padding: 24 }}>
          <View
            style={{
              width: "100%",
              backgroundColor: "#14141E",
              borderRadius: 24,
              padding: 24,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.08)",
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "800", color: "#fff", marginBottom: 4 }}>
              🎯 Set Weight Goal
            </Text>
            <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 20 }}>
              Define your target weight to track progress
            </Text>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "rgba(255,255,255,0.05)",
                borderWidth: 1,
                borderColor: "rgba(99,102,241,0.35)",
                borderRadius: 16,
                paddingHorizontal: 18,
                marginBottom: 20,
              }}
            >
              <Ionicons name="flag-outline" size={18} color="rgba(165,180,252,0.7)" />
              <TextInput
                value={goalInput}
                onChangeText={setGoalInput}
                placeholder="Target weight"
                placeholderTextColor="rgba(255,255,255,0.2)"
                keyboardType="decimal-pad"
                style={{
                  flex: 1,
                  fontSize: 24,
                  fontWeight: "800",
                  color: "#fff",
                  paddingVertical: 14,
                  paddingHorizontal: 12,
                }}
              />
              <Text style={{ fontSize: 16, fontWeight: "700", color: "rgba(255,255,255,0.4)" }}>kg</Text>
            </View>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={() => setGoalModalVisible(false)}
                activeOpacity={0.7}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.1)",
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: "700", color: "rgba(255,255,255,0.5)" }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={saveGoal} activeOpacity={0.85} style={{ flex: 1, borderRadius: 14, overflow: "hidden" }}>
                <LinearGradient
                  colors={["#6366f1", "#8b5cf6"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ paddingVertical: 14, alignItems: "center" }}
                >
                  <Text style={{ fontSize: 14, fontWeight: "800", color: "#fff" }}>Save Goal</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default WeightScreen;
