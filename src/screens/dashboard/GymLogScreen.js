import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Dimensions,
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
  Easing,
  interpolate,
} from "react-native-reanimated";
import Svg, {
  Path,
  Circle,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  G,
  Line as SvgLine,
} from "react-native-svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const ORANGE = {
  lightest: "rgba(251,191,36,0.15)",
  light: "#FCD34D",
  mid: "#F59E0B",
  core: "#F97316",
  dark: "#EA580C",
  darkest: "#C2410C",
};

const generateStreakData = () => {
  const data = [];
  const today = new Date();
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const rand = Math.random();
    let minutes = 0;
    if (rand > 0.45) {
      // visited
      if (rand > 0.85) minutes = 90 + Math.floor(Math.random() * 60); // 90-150 min
      else if (rand > 0.65) minutes = 60 + Math.floor(Math.random() * 30); // 60-90
      else minutes = 30 + Math.floor(Math.random() * 30); // 30-60
    }
    data.push({
      date: d.toISOString().split("T")[0],
      minutes,
      day: d.getDay(),
    });
  }
  return data;
};

const STREAK_DATA = generateStreakData();

const OCCUPANCY_DATA = [
  { hour: "5 AM", pct: 15 },
  { hour: "6 AM", pct: 38 },
  { hour: "7 AM", pct: 82 },
  { hour: "8 AM", pct: 91 },
  { hour: "9 AM", pct: 70 },
  { hour: "10 AM", pct: 45 },
  { hour: "11 AM", pct: 40 },
  { hour: "12 PM", pct: 55 },
  { hour: "1 PM", pct: 52 },
  { hour: "2 PM", pct: 35 },
  { hour: "3 PM", pct: 30 },
  { hour: "4 PM", pct: 48 },
  { hour: "5 PM", pct: 75 },
  { hour: "6 PM", pct: 95 },
  { hour: "7 PM", pct: 90 },
  { hour: "8 PM", pct: 68 },
  { hour: "9 PM", pct: 42 },
  { hour: "10 PM", pct: 18 },
];



// ─── Bucket pct → label (no numbers ever shown) ───────────────────────────────
const bucketLabel = (pct) => {
  if (pct >= 75) return { label: "Very Busy", color: "#EF4444" };
  if (pct >= 50) return { label: "Busy",     color: ORANGE.core  };
  if (pct >= 25) return { label: "Moderate", color: ORANGE.mid   };
  return              { label: "Quiet",    color: "#34d399" };
};

// ─── Mock log entries ─────────────────────────────────────────────────────────
const INITIAL_LOGS = [
  { id: 1, date: "Apr 15", entryTime: "7:02 AM", exitTime: "8:45 AM", duration: 103 },
  { id: 2, date: "Apr 14", entryTime: "6:50 AM", exitTime: "8:20 AM", duration: 90 },
  { id: 3, date: "Apr 13", entryTime: "7:15 AM", exitTime: "8:55 AM", duration: 100 },
  { id: 4, date: "Apr 11", entryTime: "7:00 AM", exitTime: "8:30 AM", duration: 90 },
  { id: 5, date: "Apr 10", entryTime: "7:30 AM", exitTime: "9:10 AM", duration: 100 },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtTime = (sec) => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const minuteColor = (min) => {
  if (min === 0) return "rgba(255,255,255,0.05)";
  if (min < 30) return "rgba(251,146,60,0.25)";
  if (min < 60) return "rgba(249,115,22,0.55)";
  if (min < 90) return "rgba(234,88,12,0.78)";
  return "#C2410C";
};

const calcCurrentStreak = (data) => {
  let streak = 0;
  for (let i = data.length - 1; i >= 0; i--) {
    if (data[i].minutes > 0) streak++;
    else break;
  }
  return streak;
};

const calcLongestStreak = (data) => {
  let max = 0, cur = 0;
  data.forEach((d) => {
    if (d.minutes > 0) { cur++; max = Math.max(max, cur); }
    else cur = 0;
  });
  return max;
};

const currentHour = new Date().getHours();
const getOccupancyNow = () => {
  const idx = OCCUPANCY_DATA.findIndex(
    (d) => parseInt(d.hour) === (currentHour > 12 ? currentHour - 12 : currentHour || 12) && (currentHour >= 12 ? d.hour.includes("PM") : d.hour.includes("AM"))
  );
  if (idx !== -1) return OCCUPANCY_DATA[idx].pct;
  return 50;
};

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
      style={[{ position: "absolute", width: size, height: size, borderRadius: size / 2, backgroundColor: color, top, left }, style]}
    />
  );
};

// ─── QR Scanner Modal ─────────────────────────────────────────────────────────
const QRScanModal = ({ visible, onClose, onScanned, mode }) => {
  const scanLine = useSharedValue(0);
  const cornerGlow = useSharedValue(0.4);

  useEffect(() => {
    if (visible) {
      scanLine.value = withRepeat(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
      cornerGlow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1200 }),
          withTiming(0.4, { duration: 1200 })
        ),
        -1,
        true
      );
    }
  }, [visible]);

  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(scanLine.value, [0, 1], [0, 220]) }],
  }));

  const cornerStyle = useAnimatedStyle(() => ({
    opacity: cornerGlow.value,
  }));

  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.92)", alignItems: "center", justifyContent: "center" }}>
        <Animated.View entering={FadeIn.duration(300)}>
          {/* Header */}
          <View style={{ alignItems: "center", marginBottom: 32 }}>
            <Text style={{ fontSize: 11, color: ORANGE.mid, letterSpacing: 3, fontWeight: "700", textTransform: "uppercase" }}>
              {mode === "entry" ? "Gym Entry" : "Gym Exit"}
            </Text>
            <Text style={{ fontSize: 22, fontWeight: "900", color: "#fff", marginTop: 6 }}>
              {mode === "entry" ? "🏋️ Scan to Enter" : "👋 Scan to Exit"}
            </Text>
          </View>

          {/* Scanner Box */}
          <View style={{ width: 240, height: 240, alignSelf: "center", position: "relative" }}>
            {/* Corner decorations */}
            {[
              { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 10 },
              { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 10 },
              { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 10 },
              { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 10 },
            ].map((style, i) => (
              <Animated.View
                key={i}
                style={[{ position: "absolute", width: 30, height: 30, borderColor: ORANGE.core }, style, cornerStyle]}
              />
            ))}

            {/* Background grid faking QR */}
            <View style={{ flex: 1, margin: 16, backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 8, overflow: "hidden" }}>
              <View style={{ flex: 1, flexDirection: "row", flexWrap: "wrap", padding: 10, gap: 3 }}>
                {Array.from({ length: 64 }).map((_, i) => (
                  <View
                    key={i}
                    style={{
                      width: 20,
                      height: 20,
                      backgroundColor: Math.random() > 0.5 ? "rgba(255,255,255,0.12)" : "transparent",
                      borderRadius: 2,
                    }}
                  />
                ))}
              </View>
            </View>

            {/* Scan line */}
            <Animated.View
              style={[
                {
                  position: "absolute",
                  left: 16,
                  right: 16,
                  top: 16,
                  height: 2,
                  borderRadius: 1,
                },
                scanLineStyle,
              ]}
            >
              <LinearGradient
                colors={["transparent", ORANGE.core, ORANGE.light, ORANGE.core, "transparent"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ flex: 1, borderRadius: 1 }}
              />
            </Animated.View>
          </View>

          <Text style={{ textAlign: "center", color: "rgba(255,255,255,0.35)", fontSize: 12, marginTop: 20, marginBottom: 32 }}>
            Point camera at the gym QR code
          </Text>

         
          <TouchableOpacity
            onPress={onScanned}
            activeOpacity={0.85}
            style={{ marginHorizontal: 40, borderRadius: 18, overflow: "hidden" }}
          >
            <LinearGradient
              colors={[ORANGE.core, ORANGE.dark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ paddingVertical: 16, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}
            >
              <Ionicons name="qr-code-outline" size={18} color="#fff" />
              <Text style={{ fontSize: 15, fontWeight: "800", color: "#fff" }}>
                Simulate Scan
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={{ alignItems: "center", marginTop: 18 }}>
            <Text style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>Cancel</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const StreakGrid = ({ data }) => {
  const CELL = 12;
  const GAP = 3;
  const WEEKS = 52;
  const DAYS_PER_WEEK = 7;
  const gridW = SCREEN_WIDTH - 48;

  const weeks = [];
  for (let w = 0; w < WEEKS; w++) {
    weeks.push(data.slice(w * 7, w * 7 + 7));
  }

  const dayLabels = ["", "Mon", "", "Wed", "", "Fri", ""];
  const monthLabels = [];
  let lastMonth = "";
  weeks.forEach((week, wi) => {
    const firstDay = week.find((d) => d);
    if (firstDay) {
      const month = new Date(firstDay.date).toLocaleString("en-US", { month: "short" });
      if (month !== lastMonth) {
        monthLabels.push({ week: wi, label: month });
        lastMonth = month;
      }
    }
  });

  return (
    <View>
      {/* Month labels */}
      <View style={{ flexDirection: "row", marginLeft: 22, marginBottom: 4, position: "relative" }}>
        {monthLabels.map(({ week, label }) => (
          <Text
            key={week}
            style={{
              position: "absolute",
              left: week * (CELL + GAP),
              fontSize: 9,
              color: "rgba(255,255,255,0.35)",
              fontWeight: "600",
            }}
          >
            {label}
          </Text>
        ))}
      </View>

      <View style={{ flexDirection: "row", gap: GAP }}>
        {/* Day labels */}
        <View style={{ justifyContent: "space-around", marginTop: 0 }}>
          {dayLabels.map((d, i) => (
            <Text key={i} style={{ fontSize: 8, color: "rgba(255,255,255,0.25)", height: CELL + GAP, lineHeight: CELL + GAP }}>
              {d}
            </Text>
          ))}
        </View>

        {/* Grid */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: "row", gap: GAP }}>
            {weeks.map((week, wi) => (
              <View key={wi} style={{ flexDirection: "column", gap: GAP }}>
                {week.map((day, di) => (
                  <View
                    key={di}
                    style={{
                      width: CELL,
                      height: CELL,
                      borderRadius: 2.5,
                      backgroundColor: minuteColor(day?.minutes || 0),
                    }}
                  />
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Legend */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 10, justifyContent: "flex-end" }}>
        <Text style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>Less</Text>
        {["rgba(255,255,255,0.05)", "rgba(251,146,60,0.25)", "rgba(249,115,22,0.55)", "rgba(234,88,12,0.78)", "#C2410C"].map((c, i) => (
          <View key={i} style={{ width: 11, height: 11, borderRadius: 2, backgroundColor: c }} />
        ))}
        <Text style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>More</Text>
      </View>
    </View>
  );
};

// ─── Arc helpers ─────────────────────────────────────────────────────────────
const polarToXY = (cx, cy, r, angleDeg) => {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
};

const describeArc = (cx, cy, r, startDeg, endDeg) => {
  const s = polarToXY(cx, cy, r, startDeg);
  const e = polarToXY(cx, cy, r, endDeg);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`;
};

// ─── Arc Gauge (semicircle — canvas-style) ───────────────────────────────────
const ArcGauge = ({ pct }) => {
  const SIZE = 280;
  const CX = SIZE / 2;
  const CY = SIZE / 2 + 6;    // push center slightly below midpoint
  const R = 108;               // main arc radius
  const STROKE_W = 14;
  const START_DEG = 180;       // full semicircle: left
  const END_DEG = 360;         // full semicircle: right
  const NEEDLE_R = R - 22;     // how far needle dot sits from center

  const nowBucket = bucketLabel(pct);
  const labelColor = nowBucket.color;
  const statusLabel = nowBucket.label;

  // Animated needle dot position
  const [needlePt, setNeedlePt] = useState(polarToXY(CX, CY, NEEDLE_R, START_DEG));
  // Animated fill end angle
  const [fillEnd, setFillEnd] = useState(START_DEG);

  useEffect(() => {
    const targetAngle = START_DEG + (pct / 100) * (END_DEG - START_DEG);
    let start = null;
    const duration = 1400;
    const raf = setInterval(() => {
      if (!start) start = Date.now();
      const t = Math.min((Date.now() - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3); // ease-out cubic
      const curAngle = START_DEG + ease * (targetAngle - START_DEG);
      setNeedlePt(polarToXY(CX, CY, NEEDLE_R, curAngle));
      setFillEnd(curAngle);
      if (t >= 1) clearInterval(raf);
    }, 16);
    return () => clearInterval(raf);
  }, [pct]);

  // Tick marks at 0%, 25%, 50%, 75%, 100%
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const TICK_INNER = R - 20;
  const TICK_OUTER = R - 10;

  return (
    <View style={{ alignItems: "center", position: "relative" }}>
      <Svg width={SIZE} height={SIZE * 0.58} viewBox={`0 0 ${SIZE} ${SIZE * 0.58}`}>
        {/* Background track */}
        <Path
          d={describeArc(CX, CY, R, START_DEG, END_DEG)}
          stroke="#222228"
          strokeWidth={STROKE_W}
          fill="none"
          strokeLinecap="round"
        />

        {/* Colored fill arc */}
        {fillEnd > START_DEG && (
          <Path
            d={describeArc(CX, CY, R, START_DEG, fillEnd)}
            stroke={labelColor}
            strokeWidth={STROKE_W}
            fill="none"
            strokeLinecap="round"
          />
        )}

        {/* Tick marks */}
        {ticks.map((t, i) => {
          const angle = START_DEG + t * (END_DEG - START_DEG);
          const p1 = polarToXY(CX, CY, TICK_INNER, angle);
          const p2 = polarToXY(CX, CY, TICK_OUTER, angle);
          return (
            <SvgLine
              key={i}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke="#444"
              strokeWidth={1.5}
            />
          );
        })}

        {/* Needle tip dot */}
        <Circle cx={needlePt.x} cy={needlePt.y} r={5} fill={labelColor} />

        {/* Centre hub dot */}
        <Circle cx={CX} cy={CY} r={5} fill="#333" />
      </Svg>

      {/* Status label inside gauge */}
      <View style={{ position: "absolute", bottom: 10, left: 0, right: 0, alignItems: "center" }}>
        <Text style={{ fontSize: 30, fontWeight: "900", color: labelColor, letterSpacing: 1 }}>
          {statusLabel}
        </Text>
        <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 2, marginTop: 2 }}>
          Right now
        </Text>
      </View>
    </View>
  );
};



// ─── Log Row ─────────────────────────────────────────────────────────────────
const LogRow = ({ log, delay }) => (
  <Animated.View entering={FadeInDown.delay(delay).springify()}>
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 13,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.05)",
      }}
    >
      <LinearGradient
        colors={[`${ORANGE.core}22`, `${ORANGE.dark}12`]}
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: `${ORANGE.core}40`,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        <Ionicons name="barbell-outline" size={17} color={ORANGE.mid} />
      </LinearGradient>

      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: "800", color: "#fff" }}>{log.date}</Text>
        <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>
          {log.entryTime} → {log.exitTime}
        </Text>
      </View>

      <View
        style={{
          backgroundColor: `${ORANGE.core}1A`,
          borderWidth: 1,
          borderColor: `${ORANGE.core}40`,
          borderRadius: 20,
          paddingHorizontal: 10,
          paddingVertical: 4,
        }}
      >
        <Text style={{ fontSize: 12, fontWeight: "700", color: ORANGE.mid }}>
          {Math.floor(log.duration / 60)}h {log.duration % 60}m
        </Text>
      </View>
    </View>
  </Animated.View>
);

// ─── Main Screen ─────────────────────────────────────────────────────────────
const GymLogScreen = () => {
  const navigation = useNavigation();

  const [isInsideGym, setIsInsideGym] = useState(false);
  const [entryTime, setEntryTime] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [logs, setLogs] = useState(INITIAL_LOGS);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [qrMode, setQrMode] = useState("entry"); // "entry" | "exit"
  const [streakData] = useState(STREAK_DATA);

  const timerRef = useRef(null);

  const currentStreak = calcCurrentStreak(streakData);
  const longestStreak = calcLongestStreak(streakData);
  const totalVisits = streakData.filter((d) => d.minutes > 0).length;
  const avgMinutes = Math.round(
    streakData.filter((d) => d.minutes > 0).reduce((s, d) => s + d.minutes, 0) /
      (totalVisits || 1)
  );

  // Animations
  const pulseEntry = useSharedValue(1);
  const scanBtnScale = useSharedValue(1);

  useEffect(() => {
    if (isInsideGym) {
      pulseEntry.value = withRepeat(
        withSequence(
          withTiming(1.06, { duration: 900, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      pulseEntry.value = withTiming(1);
    }
  }, [isInsideGym]);

  // Timer
  useEffect(() => {
    if (isInsideGym) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isInsideGym]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseEntry.value }],
  }));

  const handleOpenScan = (mode) => {
    setQrMode(mode);
    setQrModalVisible(true);
  };

  const handleScanned = () => {
    setQrModalVisible(false);
    if (Platform.OS !== "web") Vibration.vibrate([0, 80, 60, 80]);

    if (qrMode === "entry") {
      setIsInsideGym(true);
      setEntryTime(new Date());
      setElapsedSeconds(0);
    } else {
      // Exit
      if (!entryTime) return;
      const now = new Date();
      const durationMin = Math.floor((now - entryTime) / 60000);
      const dateStr = now.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const entryStr = entryTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
      const exitStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
      setLogs((prev) => [
        { id: Date.now(), date: dateStr, entryTime: entryStr, exitTime: exitStr, duration: durationMin > 0 ? durationMin : 1 },
        ...prev,
      ]);
      setIsInsideGym(false);
      setEntryTime(null);
      setElapsedSeconds(0);
    }
  };

  const progressPct = Math.min(100, (elapsedSeconds / 3600) * 100); // 1 hour = 100%

  return (
    <View style={{ flex: 1, backgroundColor: "#09090f" }}>
      <StatusBar barStyle="light-content" />

      {/* Background gradients */}
      <LinearGradient
        colors={["rgba(249,115,22,0.18)", "rgba(234,88,12,0.08)", "rgba(0,0,0,0)"]}
        locations={[0, 0.4, 1]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 380 }}
      />

      {/* Glow orbs */}
      <GlowOrb size={300} color="rgba(249,115,22,0.10)" top={-80} left={SCREEN_WIDTH / 2 - 150} delay={0} />
      <GlowOrb size={180} color="rgba(234,88,12,0.07)" top={320} left={-60} delay={1200} />
      <GlowOrb size={140} color="rgba(251,191,36,0.06)" top={650} left={SCREEN_WIDTH - 90} delay={2500} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        {/* ── Header ─────────────────────────────────────────────────────────── */}
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
              FitHex
            </Text>
            <Text style={{ fontSize: 18, fontWeight: "900", color: "#fff", marginTop: 2 }}>
              🏋️ Gym Log
            </Text>
          </View>

          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: isInsideGym ? "rgba(52,211,153,0.12)" : "rgba(255,255,255,0.04)",
              borderWidth: 1,
              borderColor: isInsideGym ? "rgba(52,211,153,0.35)" : "rgba(255,255,255,0.08)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: isInsideGym ? "#34d399" : "rgba(255,255,255,0.2)",
              }}
            />
          </View>
        </Animated.View>

        {/* ── Entry / Exit Hero Card ─────────────────────────────────────────── */}
        <Animated.View
          entering={FadeInUp.delay(150).springify()}
          style={{ marginHorizontal: 20, marginTop: 16, marginBottom: 16 }}
        >
          <LinearGradient
            colors={
              isInsideGym
                ? ["rgba(52,211,153,0.18)", "rgba(6,182,212,0.10)", "rgba(99,102,241,0.10)"]
                : ["rgba(249,115,22,0.18)", "rgba(234,88,12,0.12)", "rgba(99,102,241,0.08)"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 26,
              padding: 22,
              borderWidth: 1,
              borderColor: isInsideGym ? "rgba(52,211,153,0.25)" : "rgba(249,115,22,0.25)",
            }}
          >
            {/* Status label */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 18 }}>
              <Animated.View
                style={[
                  {
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: isInsideGym ? "#34d399" : ORANGE.core,
                  },
                  isInsideGym ? pulseStyle : {},
                ]}
              />
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: isInsideGym ? "#34d399" : ORANGE.mid,
                  textTransform: "uppercase",
                  letterSpacing: 2,
                }}
              >
                {isInsideGym ? "Currently In Gym" : "Outside Gym"}
              </Text>
            </View>

            {/* Timer */}
            <View style={{ alignItems: "center", marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: 56,
                  fontWeight: "900",
                  color: "#fff",
                  letterSpacing: -2,
                  fontVariant: ["tabular-nums"],
                }}
              >
                {isInsideGym ? fmtTime(elapsedSeconds) : "--:--"}
              </Text>
              <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>
                {isInsideGym
                  ? `Entered at ${entryTime?.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`
                  : "Time in gym"}
              </Text>
            </View>

            {/* Progress ring (linear progress bar) */}
            {isInsideGym && (
              <View style={{ marginBottom: 20 }}>
                <View style={{ height: 6, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" }}>
                  <LinearGradient
                    colors={[ORANGE.light, ORANGE.core, ORANGE.dark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ width: `${progressPct}%`, height: "100%", borderRadius: 3 }}
                  />
                </View>
                <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 6, textAlign: "right" }}>
                  {Math.floor(elapsedSeconds / 60)} min · Goal: 60 min
                </Text>
              </View>
            )}

            {/* Buttons */}
            <View style={{ flexDirection: "row", gap: 10 }}>
              {!isInsideGym ? (
                <TouchableOpacity
                  onPress={() => handleOpenScan("entry")}
                  activeOpacity={0.85}
                  style={{ flex: 1, borderRadius: 18, overflow: "hidden" }}
                >
                  <LinearGradient
                    colors={[ORANGE.core, ORANGE.dark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      paddingVertical: 16,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    <Ionicons name="qr-code-outline" size={18} color="#fff" />
                    <Text style={{ fontSize: 15, fontWeight: "800", color: "#fff" }}>Scan Entry</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <>
                  <View style={{ flex: 1 }}>
                    <LinearGradient
                      colors={["rgba(52,211,153,0.12)", "rgba(52,211,153,0.06)"]}
                      style={{
                        paddingVertical: 16,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        borderRadius: 18,
                        borderWidth: 1,
                        borderColor: "rgba(52,211,153,0.25)",
                      }}
                    >
                      <Ionicons name="checkmark-circle" size={18} color="#34d399" />
                      <Text style={{ fontSize: 14, fontWeight: "800", color: "#34d399" }}>Checked In</Text>
                    </LinearGradient>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleOpenScan("exit")}
                    activeOpacity={0.85}
                    style={{ flex: 1, borderRadius: 18, overflow: "hidden" }}
                  >
                    <LinearGradient
                      colors={["rgba(239,68,68,0.8)", "rgba(185,28,28,0.9)"]}
                      style={{
                        paddingVertical: 16,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                      }}
                    >
                      <Ionicons name="exit-outline" size={18} color="#fff" />
                      <Text style={{ fontSize: 15, fontWeight: "800", color: "#fff" }}>Scan Exit</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ── Streak Summary Stats ─────────────────────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(220).springify()}
          style={{ flexDirection: "row", marginHorizontal: 20, gap: 10, marginBottom: 16 }}
        >
          {[
            { label: "Current Streak", value: `${currentStreak}`, unit: "days", icon: "flame", color: ORANGE.core },
            { label: "Longest Streak", value: `${longestStreak}`, unit: "days", icon: "trophy-outline", color: ORANGE.light },
            { label: "Total Visits", value: `${totalVisits}`, unit: "times", icon: "checkmark-circle-outline", color: "#34d399" },
            { label: "Avg Session", value: `${avgMinutes}`, unit: "min", icon: "time-outline", color: "#a5b4fc" },
          ].map((s, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                backgroundColor: "rgba(255,255,255,0.03)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.07)",
                borderRadius: 18,
                padding: 12,
                alignItems: "center",
              }}
            >
              <Ionicons name={s.icon} size={18} color={s.color} />
              <Text style={{ fontSize: 20, fontWeight: "900", color: "#fff", marginTop: 6, letterSpacing: -0.5 }}>
                {s.value}
              </Text>
              <Text style={{ fontSize: 8, color: s.color, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 }}>
                {s.unit}
              </Text>
              <Text style={{ fontSize: 8.5, color: "rgba(255,255,255,0.3)", marginTop: 3, textAlign: "center" }}>
                {s.label}
              </Text>
            </View>
          ))}
        </Animated.View>

        {/* ── Streak Heatmap ─────────────────────────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(280).springify()}
          style={{ marginHorizontal: 20, marginBottom: 16 }}
        >
          <View
            style={{
              backgroundColor: "rgba(255,255,255,0.03)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.07)",
              borderRadius: 22,
              padding: 18,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Ionicons name="flame" size={17} color={ORANGE.core} />
              <Text style={{ fontSize: 14, fontWeight: "700", color: "rgba(255,255,255,0.85)" }}>
                Gym Streak
              </Text>
              <View
                style={{
                  marginLeft: "auto",
                  backgroundColor: `${ORANGE.core}20`,
                  borderWidth: 1,
                  borderColor: `${ORANGE.core}40`,
                  borderRadius: 20,
                  paddingHorizontal: 10,
                  paddingVertical: 3,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: "700", color: ORANGE.mid }}>
                  🔥 {currentStreak} day streak
                </Text>
              </View>
            </View>

            <StreakGrid data={streakData} />
          </View>
        </Animated.View>

        {/* ── Gym Occupancy ─────────────────────────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(340).springify()}
          style={{ marginHorizontal: 20, marginBottom: 16 }}
        >
          <View
            style={{
              backgroundColor: "rgba(255,255,255,0.03)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.07)",
              borderRadius: 22,
              padding: 18,
            }}
          >
            {/* Section header */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <Ionicons name="people-outline" size={17} color={ORANGE.mid} />
              <Text style={{ fontSize: 14, fontWeight: "700", color: "rgba(255,255,255,0.85)" }}>
                Gym Occupancy
              </Text>
              <View
                style={{
                  marginLeft: "auto",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  backgroundColor: "rgba(52,211,153,0.10)",
                  borderWidth: 1,
                  borderColor: "rgba(52,211,153,0.25)",
                  borderRadius: 20,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                }}
              >
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#34d399" }} />
                <Text style={{ fontSize: 10, color: "#34d399", fontWeight: "700" }}>Live</Text>
              </View>
            </View>

            {/* Arc gauge — no numbers */}
            <ArcGauge pct={getOccupancyNow()} />


          </View>
        </Animated.View>

        {/* ── Recent Log ────────────────────────────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(400).springify()}
          style={{ marginHorizontal: 20, marginBottom: 16 }}
        >
          <View
            style={{
              backgroundColor: "rgba(255,255,255,0.03)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.07)",
              borderRadius: 22,
              padding: 18,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <Ionicons name="list-outline" size={17} color="rgba(255,255,255,0.5)" />
              <Text style={{ fontSize: 14, fontWeight: "700", color: "rgba(255,255,255,0.85)" }}>
                Recent Sessions
              </Text>
              <Text style={{ marginLeft: "auto", fontSize: 11, color: "rgba(255,255,255,0.25)" }}>
                {logs.length} logs
              </Text>
            </View>

            {logs.slice(0, 6).map((log, i) => (
              <LogRow key={log.id} log={log} delay={i * 60} />
            ))}

            {logs.length === 0 && (
              <View style={{ alignItems: "center", paddingVertical: 28 }}>
                <Ionicons name="barbell-outline" size={32} color="rgba(255,255,255,0.1)" />
                <Text style={{ color: "rgba(255,255,255,0.2)", fontSize: 13, marginTop: 10 }}>
                  No sessions logged yet
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.12)", fontSize: 11, marginTop: 4 }}>
                  Scan QR to log your first session
                </Text>
              </View>
            )}
          </View>
        </Animated.View>
      </ScrollView>

      {/* QR Scanner Modal */}
      <QRScanModal
        visible={qrModalVisible}
        onClose={() => setQrModalVisible(false)}
        onScanned={handleScanned}
        mode={qrMode}
      />
    </View>
  );
};

export default GymLogScreen;
