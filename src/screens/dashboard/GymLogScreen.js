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
  AppState,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { CameraView, useCameraPermissions } from "expo-camera";
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
import * as gymLogService from "../../api/gymLogService";
import {
  savePendingCheckIn,
  getPendingCheckIn,
  clearPendingCheckIn,
  isPendingExpired,
} from "../../utils/offlineQueue";

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
// Phases: "idle" → "processing" → "success" | "error"
const QRScanModal = ({ visible, onClose, onScanned, mode }) => {
  const [phase, setPhase] = useState("idle"); // idle | processing | success | error
  const [errorMsg, setErrorMsg] = useState("");
  const [permission, requestPermission] = useCameraPermissions();
  const hasScannedRef = useRef(false); // prevent duplicate scans

  // Animations
  const scanLine   = useSharedValue(0);
  const cornerGlow = useSharedValue(0.4);
  const successScale = useSharedValue(0);
  const successOpacity = useSharedValue(0);

  // Reset phase whenever the modal opens
  useEffect(() => {
    if (visible) {
      setPhase("idle");
      setErrorMsg("");
      hasScannedRef.current = false;
      successScale.value = 0;
      successOpacity.value = 0;
      // Request camera permission when modal opens
      if (!permission?.granted) requestPermission();
    }
  }, [visible]);

  // Scan-line & corner animations — run in idle phase
  useEffect(() => {
    if (visible && phase === "idle") {
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
    } else if (phase === "processing") {
      scanLine.value = withRepeat(
        withTiming(1, { duration: 500, easing: Easing.linear }),
        -1,
        false
      );
      cornerGlow.value = withRepeat(
        withSequence(withTiming(1, { duration: 300 }), withTiming(0.2, { duration: 300 })),
        -1,
        true
      );
    }
  }, [visible, phase]);

  // Success pop animation
  const triggerSuccess = () => {
    successScale.value = withSpring(1, { damping: 10, stiffness: 200 });
    successOpacity.value = withTiming(1, { duration: 250 });
  };

  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(scanLine.value, [0, 1], [0, 220]) }],
    opacity: phase === "processing" ? 1 : 0.85,
  }));

  const cornerStyle = useAnimatedStyle(() => ({
    opacity: cornerGlow.value,
    borderColor:
      phase === "processing"
        ? ORANGE.light
        : phase === "success"
        ? "#34d399"
        : phase === "error"
        ? "#f87171"
        : ORANGE.core,
  }));

  const successBubbleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: successScale.value }],
    opacity: successOpacity.value,
  }));

  // ── Real QR scan handler ──────────────────────────────────────────────────
  const handleBarCodeScanned = async ({ data }) => {
    if (hasScannedRef.current || phase !== "idle") return;
    hasScannedRef.current = true;

    // Validate the scanned data is valid JSON with gymId & secret
    try {
      const parsed = JSON.parse(data);
      if (!parsed.gymId || !parsed.secret) {
        setErrorMsg("Invalid QR code. Missing gym identifier or secret.");
        setPhase("error");
        return;
      }
    } catch {
      setErrorMsg("Invalid QR code. Please scan a valid gym QR code.");
      setPhase("error");
      return;
    }

    if (Platform.OS !== "web") Vibration.vibrate([0, 40]);
    setPhase("processing");

    try {
      await onScanned(data); // data is already JSON string from QR
      setPhase("success");
      triggerSuccess();
      setTimeout(() => onClose(), 1600);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        (err?.message === "Network Error" ? "No internet connection" : "Check-in failed");
      setErrorMsg(msg);
      setPhase("error");
    }
  };

  const handleRetry = () => {
    setPhase("idle");
    setErrorMsg("");
    hasScannedRef.current = false;
  };

  if (!visible) return null;

  // ─── Render helpers ───────────────────────────────────────────────────────
  const isEntry = mode === "entry";
  const phaseLabel = isEntry ? "Gym Entry" : "Gym Exit";
  const phaseTitle = isEntry ? "Scan to Enter" : "Scan to Exit";

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.93)",
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 32,
        }}
      >
        <Animated.View entering={FadeIn.duration(280)} style={{ width: "100%", alignItems: "center" }}>

          {/* ── Header ─────────────────────────────────────────────────────── */}
          <View style={{ alignItems: "center", marginBottom: 28 }}>
            <Text
              style={{
                fontSize: 10,
                color:
                  phase === "success" ? "#34d399" :
                  phase === "error"   ? "#f87171" :
                  ORANGE.mid,
                letterSpacing: 3,
                fontWeight: "800",
                textTransform: "uppercase",
              }}
            >
              {phase === "processing" ? "Authenticating…" :
               phase === "success"    ? (isEntry ? "Checked In!" : "Checked Out!") :
               phase === "error"      ? "Scan Failed" :
               phaseLabel}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 }}>
              {phase === "success" ? (
                <Ionicons name="checkmark-circle" size={22} color="#34d399" />
              ) : phase === "error" ? (
                <Ionicons name="alert-circle-outline" size={22} color="#f87171" />
              ) : (
                <Ionicons name={isEntry ? "scan-outline" : "exit-outline"} size={22} color={ORANGE.core} />
              )}
              <Text style={{ fontSize: 22, fontWeight: "900", color: "#fff" }}>
                {phase === "success"    ? (isEntry ? "Welcome!" : "See you!") :
                 phase === "error"      ? "Something went wrong" :
                 phaseTitle}
              </Text>
            </View>
          </View>

          {/* ── Scanner Box ─────────────────────────────────────────────────── */}
          <View
            style={{
              width: 300,
              height: 300,
              alignSelf: "center",
              position: "relative",
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            {/* Corner decorations */}
            {[
              { top: 0,  left: 0,  borderTopWidth: 3,    borderLeftWidth: 3,  borderTopLeftRadius: 10     },
              { top: 0,  right: 0, borderTopWidth: 3,    borderRightWidth: 3, borderTopRightRadius: 10    },
              { bottom: 0, left: 0,  borderBottomWidth: 3, borderLeftWidth: 3,  borderBottomLeftRadius: 10  },
              { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 10 },
            ].map((s, i) => (
              <Animated.View
                key={i}
                style={[{ position: "absolute", width: 32, height: 32 }, s, cornerStyle]}
              />
            ))}

            {/* QR mock grid */}
            <View
              style={{
                flex: 1,
                margin: 16,
                backgroundColor: "rgba(255,255,255,0.03)",
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              {phase === "success" ? (
                /* Success overlay */
                <Animated.View
                  style={[
                    {
                      flex: 1,
                      backgroundColor: "rgba(52,211,153,0.12)",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 8,
                    },
                    successBubbleStyle,
                  ]}
                >
                  <View
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 36,
                      backgroundColor: "rgba(52,211,153,0.2)",
                      borderWidth: 2,
                      borderColor: "#34d399",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name="checkmark" size={38} color="#34d399" />
                  </View>
                </Animated.View>
              ) : phase === "error" ? (
                /* Error overlay */
                <View
                  style={{
                    flex: 1,
                    backgroundColor: "rgba(248,113,113,0.08)",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 8,
                    padding: 16,
                  }}
                >
                  <View
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 32,
                      backgroundColor: "rgba(248,113,113,0.15)",
                      borderWidth: 2,
                      borderColor: "#f87171",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 12,
                    }}
                  >
                    <Ionicons name="close" size={34} color="#f87171" />
                  </View>
                  <Text
                    style={{
                      color: "#f87171",
                      fontSize: 12,
                      fontWeight: "700",
                      textAlign: "center",
                      lineHeight: 18,
                    }}
                  >
                    {errorMsg}
                  </Text>
                </View>
              ) : phase === "processing" ? (
                /* Processing overlay */
                <View
                  style={{
                    flex: 1,
                    backgroundColor: "rgba(249,115,22,0.06)",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 8,
                  }}
                >
                  <ActivityIndicator size="large" color={ORANGE.core} />
                  <Text
                    style={{
                      color: ORANGE.mid,
                      fontSize: 12,
                      fontWeight: "700",
                      marginTop: 14,
                      letterSpacing: 1.5,
                      textTransform: "uppercase",
                    }}
                  >
                    Verifying…
                  </Text>
                </View>
              ) : (
                /* Live camera feed for QR scanning */
                permission?.granted ? (
                  <CameraView
                    style={{ flex: 1, borderRadius: 8 }}
                    facing="back"
                    barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                    onBarcodeScanned={phase === "idle" ? handleBarCodeScanned : undefined}
                  />
                ) : (
                  <View
                    style={{
                      flex: 1,
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 8,
                      backgroundColor: "rgba(255,255,255,0.03)",
                      padding: 16,
                    }}
                  >
                    <Ionicons name="camera-outline" size={36} color="rgba(255,255,255,0.25)" />
                    <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: "700", marginTop: 10, textAlign: "center" }}>
                      Camera permission required
                    </Text>
                    <TouchableOpacity onPress={requestPermission} style={{ marginTop: 12, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: "rgba(249,115,22,0.2)", borderWidth: 1, borderColor: "rgba(249,115,22,0.4)" }}>
                      <Text style={{ color: ORANGE.mid, fontSize: 12, fontWeight: "700" }}>Grant Access</Text>
                    </TouchableOpacity>
                  </View>
                )
              )}
            </View>

            {/* Animated scan line — only when not in result phase */}
            {(phase === "idle" || phase === "processing") && (
              <Animated.View
                style={[
                  {
                    position: "absolute",
                    left: 16,
                    right: 16,
                    top: 16,
                    height: phase === "processing" ? 3 : 2,
                    borderRadius: 2,
                  },
                  scanLineStyle,
                ]}
              >
                <LinearGradient
                  colors={
                    phase === "processing"
                      ? ["transparent", ORANGE.light, "#fff", ORANGE.light, "transparent"]
                      : ["transparent", ORANGE.core, ORANGE.light, ORANGE.core, "transparent"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ flex: 1, borderRadius: 2 }}
                />
              </Animated.View>
            )}
          </View>

          <Text
            style={{
              textAlign: "center",
              color:
                phase === "success" ? "rgba(52,211,153,0.7)" :
                phase === "error"   ? "rgba(248,113,113,0.7)" :
                phase === "processing" ? "rgba(249,115,22,0.6)" :
                "rgba(255,255,255,0.3)",
              fontSize: 12,
              marginTop: 18,
              marginBottom: 28,
              letterSpacing: 0.5,
            }}
          >
            {phase === "idle"       && "Point camera at the gym QR code"}
            {phase === "processing" && `Connecting to server…  (POST /entry/${isEntry ? "checkin" : "checkout"})`}
            {phase === "success"    && (isEntry ? "Session started • Timer is running" : "Session saved • Great workout!")}
            {phase === "error"      && "Tap retry or cancel and try again"}
          </Text>


          {phase === "processing" && (
            <View
              style={{
                width: "100%",
                borderRadius: 18,
                backgroundColor: "rgba(249,115,22,0.12)",
                borderWidth: 1,
                borderColor: "rgba(249,115,22,0.3)",
                paddingVertical: 17,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 10,
              }}
            >
              <ActivityIndicator size="small" color={ORANGE.mid} />
              <Text style={{ fontSize: 15, fontWeight: "800", color: ORANGE.mid, letterSpacing: 0.4 }}>
                Processing…
              </Text>
            </View>
          )}

          {phase === "error" && (
            <View style={{ width: "100%", gap: 12 }}>
              <TouchableOpacity
                onPress={handleRetry}
                activeOpacity={0.82}
                style={{ width: "100%", borderRadius: 18, overflow: "hidden" }}
              >
                <LinearGradient
                  colors={[ORANGE.core, ORANGE.dark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    paddingVertical: 16,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <Ionicons name="refresh-outline" size={18} color="#fff" />
                  <Text style={{ fontSize: 15, fontWeight: "800", color: "#fff" }}>Try Again</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* Cancel — hidden during processing & success */}
          {(phase === "idle" || phase === "error") && (
            <TouchableOpacity onPress={onClose} style={{ alignItems: "center", marginTop: 18 }}>
              <Text style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>Cancel</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const StreakGrid = ({ data }) => {
  const CELL = 12;
  const GAP = 3;
  const WEEKS = 52;
  const COL_W = CELL + GAP; // 15px per week column
  const DAY_LABEL_W = 28; // width reserved for day labels (Mon, Wed, Fri)
  const MIN_LABEL_GAP_WEEKS = 3; // skip month labels closer than 3 weeks

  const weeks = [];
  for (let w = 0; w < WEEKS; w++) {
    weeks.push(data.slice(w * 7, w * 7 + 7));
  }

  const dayLabels = ["", "Mon", "", "Wed", "", "Fri", ""];

  const monthLabels = [];
  let lastMonth = "";
  let lastLabelWeek = -Infinity;
  weeks.forEach((week, wi) => {
    const firstDay = week.find((d) => d);
    if (firstDay) {
      const month = new Date(firstDay.date).toLocaleString("en-US", { month: "short" });
      if (month !== lastMonth) {
        // Only add if far enough from the previous label
        if (wi - lastLabelWeek >= MIN_LABEL_GAP_WEEKS) {
          monthLabels.push({ week: wi, label: month });
          lastLabelWeek = wi;
        }
        lastMonth = month;
      }
    }
  });

  const monthScrollRef = useRef(null);
  const gridScrollRef = useRef(null);

  const handleGridScroll = useCallback((e) => {
    const x = e.nativeEvent.contentOffset.x;
    monthScrollRef.current?.scrollTo({ x, animated: false });
  }, []);

  const totalGridW = WEEKS * COL_W;

  return (
    <View>
      <View style={{ flexDirection: "row" }}>
        {/* Spacer matching day-label column */}
        <View style={{ width: DAY_LABEL_W }} />

        {/* Month labels — synced horizontal scroll */}
        <ScrollView
          ref={monthScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEnabled={false}
          pointerEvents="none"
        >
          <View style={{ width: totalGridW, height: 16, position: "relative" }}>
            {monthLabels.map(({ week, label }) => (
              <Text
                key={`${week}-${label}`}
                style={{
                  position: "absolute",
                  left: week * COL_W,
                  top: 0,
                  fontSize: 9,
                  color: "rgba(255,255,255,0.45)",
                  fontWeight: "600",
                }}
              >
                {label}
              </Text>
            ))}
          </View>
        </ScrollView>
      </View>

      <View style={{ flexDirection: "row" }}>
        {/* Day labels */}
        <View style={{ width: DAY_LABEL_W, justifyContent: "space-around" }}>
          {dayLabels.map((d, i) => (
            <Text
              key={i}
              style={{
                fontSize: 8,
                color: "rgba(255,255,255,0.25)",
                height: CELL + GAP,
                lineHeight: CELL + GAP,
              }}
            >
              {d}
            </Text>
          ))}
        </View>

        <ScrollView
          ref={gridScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          onScroll={handleGridScroll}
          scrollEventThrottle={16}
        >
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

const ArcGauge = ({ pct }) => {
  const SIZE = 280;
  const CX = SIZE / 2;
  const CY = SIZE / 2 + 6;   
  const R = 108;               
  const STROKE_W = 14;
  const START_DEG = 180;       
  const END_DEG = 360;         
  const NEEDLE_R = R - 22;    

  const nowBucket = bucketLabel(pct);
  const labelColor = nowBucket.color;
  const statusLabel = nowBucket.label;

  const [needlePt, setNeedlePt] = useState(polarToXY(CX, CY, NEEDLE_R, START_DEG));
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



const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371000; // Earth radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const SWIPE_TRACK_H = 56;
const SWIPE_THUMB_SIZE = 48;
const SWIPE_THRESHOLD = 0.78; // 78% of track to trigger exit

const SwipeToExitButton = ({ onExitComplete, disabled }) => {
  const [trackWidth, setTrackWidth] = useState(0);
  const translateX = useSharedValue(0);
  const triggered = useRef(false);
  const maxSlide = trackWidth - SWIPE_THUMB_SIZE - 8; // 4px padding each side

  const shimmer = useSharedValue(0);
  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const panResponder = useRef(
    null
  );

  // Rebuild PanResponder whenever trackWidth or disabled changes
  useEffect(() => {
    const _maxSlide = trackWidth - SWIPE_THUMB_SIZE - 8;
    panResponder.current = require("react-native").PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled && _maxSlide > 0,
      onMoveShouldSetPanResponder: (_, gs) => !disabled && Math.abs(gs.dx) > 5,
      onPanResponderGrant: () => {
        triggered.current = false;
      },
      onPanResponderMove: (_, gs) => {
        if (triggered.current) return;
        const clamped = Math.max(0, Math.min(gs.dx, _maxSlide));
        translateX.value = clamped;
      },
      onPanResponderRelease: (_, gs) => {
        if (triggered.current) return;
        const clamped = Math.max(0, Math.min(gs.dx, _maxSlide));
        const pct = _maxSlide > 0 ? clamped / _maxSlide : 0;
        if (pct >= SWIPE_THRESHOLD) {
          // Snap to end and trigger
          triggered.current = true;
          translateX.value = withTiming(_maxSlide, { duration: 120 });
          if (Platform.OS !== "web") Vibration.vibrate([0, 40, 30, 40]);
          // Small delay so animation completes
          setTimeout(() => {
            onExitComplete();
            // Reset after exit completes
            setTimeout(() => {
              translateX.value = withTiming(0, { duration: 300 });
              triggered.current = false;
            }, 400);
          }, 150);
        } else {
          // Snap back
          translateX.value = withSpring(0, { damping: 18, stiffness: 200 });
        }
      },
      onPanResponderTerminate: () => {
        if (!triggered.current) {
          translateX.value = withSpring(0, { damping: 18, stiffness: 200 });
        }
      },
    });
  }, [trackWidth, disabled]);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const fillStyle = useAnimatedStyle(() => ({
    width: translateX.value + SWIPE_THUMB_SIZE + 4,
  }));

  const textOpacity = useAnimatedStyle(() => {
    const mxSlide = trackWidth - SWIPE_THUMB_SIZE - 8;
    return {
      opacity: mxSlide > 0
        ? interpolate(translateX.value, [0, mxSlide * 0.5], [1, 0], 'clamp')
        : 1,
    };
  });

  const arrowShimmer = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0.3, 0.8, 0.3]),
  }));

  if (!panResponder.current) return null;

  return (
    <View style={{ flex: 1 }}>
      <View
        onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
        style={{
          width: "100%",
          height: SWIPE_TRACK_H,
          borderRadius: SWIPE_TRACK_H / 2,
          backgroundColor: "rgba(239,68,68,0.15)",
          borderWidth: 1,
          borderColor: "rgba(239,68,68,0.35)",
          overflow: "hidden",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* Red fill that follows the thumb */}
        <Animated.View
          style={[
            {
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              borderRadius: SWIPE_TRACK_H / 2,
              overflow: "hidden",
            },
            fillStyle,
          ]}
        >
          <LinearGradient
            colors={["rgba(239,68,68,0.6)", "rgba(185,28,28,0.8)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1, borderRadius: SWIPE_TRACK_H / 2 }}
          />
        </Animated.View>

        {/* Label text */}
        <Animated.View
          style={[
            { position: "absolute", left: 0, right: 0, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6 },
            textOpacity,
          ]}
        >
          <Text style={{ fontSize: 13, fontWeight: "700", color: "rgba(239,68,68,0.8)", letterSpacing: 0.5 }}>
            Slide to Exit
          </Text>
          <Animated.View style={arrowShimmer}>
            <Ionicons name="chevron-forward" size={14} color="rgba(239,68,68,0.6)" />
          </Animated.View>
          <Animated.View style={[arrowShimmer, { marginLeft: -8 }]}>
            <Ionicons name="chevron-forward" size={14} color="rgba(239,68,68,0.4)" />
          </Animated.View>
        </Animated.View>

        {/* Draggable thumb */}
        <Animated.View
          {...panResponder.current.panHandlers}
          style={[
            {
              position: "absolute",
              left: 4,
              width: SWIPE_THUMB_SIZE,
              height: SWIPE_THUMB_SIZE,
              borderRadius: SWIPE_THUMB_SIZE / 2,
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            },
            thumbStyle,
          ]}
        >
          <LinearGradient
            colors={["#EF4444", "#B91C1C"]}
            style={{
              width: "100%",
              height: "100%",
              borderRadius: SWIPE_THUMB_SIZE / 2,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="exit-outline" size={20} color="#fff" />
          </LinearGradient>
        </Animated.View>
      </View>
    </View>
  );
};

// ─── Log Row ─────────────────────────────────────────────────────────────────
const LogRow = ({ log, delay }) => {
  const durationColor = log.duration >= 90 ? "#34d399" : log.duration >= 60 ? ORANGE.core : "#a5b4fc";
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 14,
          paddingHorizontal: 14,
          marginBottom: 8,
          backgroundColor: "rgba(255,255,255,0.03)",
          borderRadius: 16,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.05)",
        }}
      >
        {/* Duration dot indicator */}
        <View style={{ marginRight: 12, alignItems: "center" }}>
          <LinearGradient
            colors={[`${durationColor}30`, `${durationColor}10`]}
            style={{
              width: 42,
              height: 42,
              borderRadius: 13,
              borderWidth: 1,
              borderColor: `${durationColor}40`,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="barbell-outline" size={18} color={durationColor} />
          </LinearGradient>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: "800", color: "#fff" }}>{log.date}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 }}>
            <Ionicons name="time-outline" size={10} color="rgba(255,255,255,0.25)" />
            <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
              {log.entryTime} → {log.exitTime}
            </Text>
          </View>
        </View>

        <View
          style={{
            backgroundColor: `${durationColor}15`,
            borderWidth: 1,
            borderColor: `${durationColor}35`,
            borderRadius: 20,
            paddingHorizontal: 12,
            paddingVertical: 5,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: "700", color: durationColor }}>
            {Math.floor(log.duration / 60)}h {log.duration % 60}m
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

// ─── Hero Card Skeleton ──────────────────────────────────────────────────────
const SkeletonBlock = ({ width, height, borderRadius = 8, style }) => {
  const shimmer = useSharedValue(0);
  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);
  const animStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 1], [0.25, 0.55]),
  }));
  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: "rgba(255,255,255,0.08)",
        },
        animStyle,
        style,
      ]}
    />
  );
};

const HeroCardSkeleton = () => (
  <Animated.View
    entering={FadeIn.duration(300)}
    style={{ marginHorizontal: 20, marginTop: 16, marginBottom: 16 }}
  >
    <View
      style={{
        borderRadius: 26,
        padding: 22,
        borderWidth: 1,
        borderColor: "rgba(249,115,22,0.15)",
        backgroundColor: "rgba(249,115,22,0.06)",
      }}
    >
      {/* Status label skeleton */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 18 }}>
        <SkeletonBlock width={8} height={8} borderRadius={4} />
        <SkeletonBlock width={110} height={12} borderRadius={6} />
      </View>

      {/* Timer skeleton */}
      <View style={{ alignItems: "center", marginBottom: 20 }}>
        <SkeletonBlock width={180} height={50} borderRadius={12} />
        <SkeletonBlock width={120} height={12} borderRadius={6} style={{ marginTop: 10 }} />
      </View>

      {/* Button skeleton */}
      <SkeletonBlock width="100%" height={52} borderRadius={18} />
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
  const [qrMode, setQrMode] = useState("entry"); // "entry" only now
  const [streakData] = useState(STREAK_DATA);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  // New states for the 3 features
  const [isPendingSync, setIsPendingSync] = useState(false);
  const [isCheckingLocation, setIsCheckingLocation] = useState(false);
  const [isExitProcessing, setIsExitProcessing] = useState(false);
  const [gymCoords, setGymCoords] = useState(null); // [lng, lat]
  const [userCoords, setUserCoords] = useState(null); // { latitude, longitude }

  const timerRef = useRef(null);
  const syncIntervalRef = useRef(null);

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

  // ─── Fetch gym coordinates on mount ──────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const data = await gymLogService.getMyGymLocation();
        if (data?.coordinates) setGymCoords(data.coordinates);
      } catch (err) {
        console.log("[GymLog] Failed to fetch gym location:", err.message);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      // 1. Check for a pending offline check-in first
      const pending = await getPendingCheckIn();
      if (pending) {
        setIsPendingSync(true);
        setIsInsideGym(true);
        setEntryTime(new Date(pending.createdAt));
        const elapsed = Math.floor((Date.now() - new Date(pending.createdAt).getTime()) / 1000);
        setElapsedSeconds(elapsed);
        startSyncRetry();
        setIsLoadingStatus(false);
        return; // Already handled — skip backend check
      }

      // 2. No pending offline entry — check backend for an active session
      try {
        const status = await gymLogService.getMyStatus();
        if (status?.isInsideGym && status?.checkInTime) {
          const entry = new Date(status.checkInTime);
          setIsInsideGym(true);
          setEntryTime(entry);
          const elapsed = Math.floor((Date.now() - entry.getTime()) / 1000);
          setElapsedSeconds(elapsed > 0 ? elapsed : 0);
        }
      } catch (err) {
        console.log("[GymLog] Failed to fetch session status:", err.message);
      } finally {
        setIsLoadingStatus(false);
      }
    })();

    // Master cleanup on unmount
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    };
  }, []);

  // ─── Offline sync: retry loop ────────────────────────────────────────────
  const startSyncRetry = useCallback(() => {
    if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    syncIntervalRef.current = setInterval(async () => {
      const pending = await getPendingCheckIn();
      if (!pending || isPendingExpired(pending)) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
        if (pending) {
          await clearPendingCheckIn();
          setIsPendingSync(false);
          Alert.alert(
            "Sync Failed",
            "Check-in could not be synced within 15 minutes. Please try again.",
            [{ text: "OK" }]
          );
        }
        return;
      }
      try {
        await gymLogService.checkIn({
          qrPayload: pending.qrPayload,
          latitude: pending.latitude,
          longitude: pending.longitude,
          note: pending.note,
        });
        await clearPendingCheckIn();
        setIsPendingSync(false);
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      } catch (err) {
        // Still failing — keep retrying
        console.log("[GymLog] Sync retry failed:", err.message);
      }
    }, 30_000); // every 30 seconds
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseEntry.value }],
  }));

  // ─── Location verification ───────────────────────────────────────────────
  const verifyLocationAndOpenScan = async () => {
    setIsCheckingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Location Required",
          "Please enable location access to check in at the gym.",
          [{ text: "OK" }]
        );
        setIsCheckingLocation(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const userLat = loc.coords.latitude;
      const userLon = loc.coords.longitude;

      console.log("[GymLog] 📍 User Location Details:", {
        latitude: userLat,
        longitude: userLon,
        altitude: loc.coords.altitude,
        accuracy: loc.coords.accuracy,
        altitudeAccuracy: loc.coords.altitudeAccuracy,
        heading: loc.coords.heading,
        speed: loc.coords.speed,
        timestamp: new Date(loc.timestamp).toISOString(),
      });

      setUserCoords({ latitude: userLat, longitude: userLon });

      if (!gymCoords || gymCoords.length < 2) {
        console.log("[GymLog] No gym coords cached, allowing check-in");
        setIsCheckingLocation(false);
        setQrMode("entry");
        setQrModalVisible(true);
        return;
      }

      const gymLat = gymCoords[0];
      const gymLon = gymCoords[1];
      const distance = haversineDistance(userLat, userLon, gymLat, gymLon);

      console.log("gym latitude, longitude",gymLat,gymLon);


      if (distance <= 100) {
        setIsCheckingLocation(false);
        setQrMode("entry");
        setQrModalVisible(true);
      } else {
        setIsCheckingLocation(false);
        setUserCoords(null);
        Alert.alert(
          "Too Far From Gym",
          `You need to be at the gym to check in.\nYou are ${Math.round(distance)}m away.`,
          [{ text: "OK" }]
        );
      }
    } catch (err) {
      setIsCheckingLocation(false);
      setUserCoords(null);
      Alert.alert("Location Error", "Could not determine your location. Please try again.");
      console.log("[GymLog] Location error:", err.message);
    }
  };

  // ─── Check-in handler (called by QRScanModal — must throw on hard failure) ──
  const handleScanned = async (qrPayload) => {
    const checkInData = {
      qrPayload,
      latitude: userCoords?.latitude || 0,
      longitude: userCoords?.longitude || 0,
    };

    try {
      await gymLogService.checkIn(checkInData);
    } catch (err) {
      const isNetworkError =
        !err.response || err.message === "Network Error" || err.code === "ECONNABORTED";

      if (isNetworkError) {
        // Offline — optimistically check in + queue for retry
        await savePendingCheckIn(checkInData);
        setIsPendingSync(true);
        startSyncRetry();
      } else {
        throw err;
      }
    }

    if (Platform.OS !== "web") Vibration.vibrate([0, 80, 60, 80]);
    setIsInsideGym(true);
    setEntryTime(new Date());
    setElapsedSeconds(0);
    setUserCoords(null); // Clear after successful check-in
  };

  const handleExitComplete = async () => {
    if (!entryTime) return;
    setIsExitProcessing(true);

    let checkoutData;
    try {
      console.log("[GymLog] 📤 Calling checkout API…");
      const res = await gymLogService.checkOut();
      checkoutData = res.data;
      console.log("[GymLog] ✅ Checkout API success:", checkoutData);
    } catch (err) {
      console.log("[GymLog] ❌ Checkout API error:", err.message, err.response?.data);
      setIsExitProcessing(false);
      Alert.alert(
        "Checkout Failed",
        err.response?.data?.message || "Could not reach the server. Please try again.",
        [{ text: "OK" }]
      );
      return; // Keep the user checked-in so they can retry
    }

    // Use authoritative data from backend response
    const { durationMinutes, session } = checkoutData;
    const checkInDate = new Date(session.checkInTime);
    const checkOutDate = new Date(session.checkOutTime);
    const dateStr = checkOutDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const entryStr = checkInDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    const exitStr = checkOutDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

    setLogs((prev) => [
      { id: Date.now(), date: dateStr, entryTime: entryStr, exitTime: exitStr, duration: durationMinutes > 0 ? durationMinutes : 1 },
      ...prev,
    ]);
    setIsInsideGym(false);
    setEntryTime(null);
    setElapsedSeconds(0);
    setIsPendingSync(false);
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }
    await clearPendingCheckIn();
    setIsExitProcessing(false);
  };

  const progressPct = Math.min(100, (elapsedSeconds / 3600) * 100); // 1 hour = 100%

  return (
    <View style={{ flex: 1, backgroundColor: "#09090f" }}>
      <StatusBar barStyle="light-content" />

      {/* Primary gradient */}
      <LinearGradient
        colors={["rgba(249,115,22,0.22)", "rgba(234,88,12,0.10)", "rgba(0,0,0,0)"]}
        locations={[0, 0.4, 1]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 420 }}
      />
      {/* Secondary mesh gradient for depth */}
      <LinearGradient
        colors={["rgba(165,180,252,0.05)", "rgba(0,0,0,0)"]}
        locations={[0, 1]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 300 }}
      />

      {/* Glow orbs — more vibrant */}
      <GlowOrb size={320} color="rgba(249,115,22,0.13)" top={-90} left={SCREEN_WIDTH / 2 - 160} delay={0} />
      <GlowOrb size={200} color="rgba(234,88,12,0.09)" top={340} left={-70} delay={1200} />
      <GlowOrb size={160} color="rgba(251,191,36,0.07)" top={680} left={SCREEN_WIDTH - 100} delay={2500} />
      <GlowOrb size={120} color="rgba(165,180,252,0.05)" top={200} left={SCREEN_WIDTH - 50} delay={3000} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        {/* */}
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
            <View style={{ flexDirection: "row", alignItems: "center", gap: 7, marginTop: 2 }}>
              <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: "rgba(249,115,22,0.15)", borderWidth: 1, borderColor: "rgba(249,115,22,0.3)", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="fitness-outline" size={15} color={ORANGE.core} />
              </View>
              <Text style={{ fontSize: 18, fontWeight: "900", color: "#fff" }}>
                Gym Log
              </Text>
            </View>
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
        {isLoadingStatus ? (
          <HeroCardSkeleton />
        ) : (
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

              {/* Syncing indicator for offline check-in */}
              {isPendingSync && (
                <View
                  style={{
                    marginLeft: "auto",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                    backgroundColor: "rgba(251,191,36,0.12)",
                    borderWidth: 1,
                    borderColor: "rgba(251,191,36,0.3)",
                    borderRadius: 20,
                    paddingHorizontal: 10,
                    paddingVertical: 3,
                  }}
                >
                  <ActivityIndicator size={10} color={ORANGE.mid} />
                  <Text style={{ fontSize: 10, color: ORANGE.mid, fontWeight: "700" }}>
                    Syncing…
                  </Text>
                </View>
              )}
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

            {/* Circular Progress Ring */}
            {isInsideGym && (
              <View style={{ alignItems: "center", marginBottom: 20 }}>
                <View style={{ width: 120, height: 68, position: "relative" }}>
                  <Svg width={120} height={68} viewBox="0 0 120 68">
                    {/* Background track */}
                    <Path
                      d={describeArc(60, 64, 52, 180, 360)}
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth={8}
                      fill="none"
                      strokeLinecap="round"
                    />
                    {/* Filled progress arc */}
                    {progressPct > 0 && (
                      <Path
                        d={describeArc(60, 64, 52, 180, 180 + Math.min(progressPct, 100) * 1.8)}
                        stroke={progressPct >= 100 ? "#34d399" : ORANGE.core}
                        strokeWidth={8}
                        fill="none"
                        strokeLinecap="round"
                      />
                    )}
                  </Svg>
                  {/* Center percentage */}
                  <View style={{ position: "absolute", bottom: 2, left: 0, right: 0, alignItems: "center" }}>
                    <Text style={{ fontSize: 16, fontWeight: "900", color: progressPct >= 100 ? "#34d399" : ORANGE.mid }}>
                      {Math.min(Math.round(progressPct), 100)}%
                    </Text>
                  </View>
                </View>
                <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>
                  {Math.floor(elapsedSeconds / 60)} min · Goal: 60 min
                </Text>
              </View>
            )}

            {/* Buttons */}
            <View style={{ flexDirection: isInsideGym ? "column" : "row", gap: 10 }}>
              {!isInsideGym ? (
                <TouchableOpacity
                  onPress={verifyLocationAndOpenScan}
                  activeOpacity={0.85}
                  disabled={isCheckingLocation}
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
                    {isCheckingLocation ? (
                      <>
                        <ActivityIndicator size={18} color="#fff" />
                        <Text style={{ fontSize: 15, fontWeight: "800", color: "#fff" }}>Checking Location…</Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="qr-code-outline" size={18} color="#fff" />
                        <Text style={{ fontSize: 15, fontWeight: "800", color: "#fff" }}>Scan Entry</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <>
                  <LinearGradient
                    colors={["rgba(52,211,153,0.12)", "rgba(52,211,153,0.06)"]}
                    style={{
                      paddingVertical: 14,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      borderRadius: 18,
                      borderWidth: 1,
                      borderColor: "rgba(52,211,153,0.25)",
                      marginBottom: 10,
                    }}
                  >
                    <Ionicons name="checkmark-circle" size={18} color="#34d399" />
                    <Text style={{ fontSize: 14, fontWeight: "800", color: "#34d399" }}>Checked In</Text>
                  </LinearGradient>

                  <SwipeToExitButton
                    onExitComplete={handleExitComplete}
                    disabled={isExitProcessing}
                  />
                </>
              )}
            </View>
          </LinearGradient>
        </Animated.View>
        )}

        {/* ── Streak Summary Stats — 2×2 Bento Grid ───────────────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(220).springify()}
          style={{ marginHorizontal: 20, marginBottom: 16 }}
        >
          {[[
            { label: "Current Streak", value: `${currentStreak}`, unit: "days", icon: "flame", color: ORANGE.core, gradient: ["rgba(249,115,22,0.18)", "rgba(249,115,22,0.06)"] },
            { label: "Longest Streak", value: `${longestStreak}`, unit: "days", icon: "trophy-outline", color: ORANGE.light, gradient: ["rgba(252,211,77,0.15)", "rgba(252,211,77,0.04)"] },
          ], [
            { label: "Total Visits", value: `${totalVisits}`, unit: "sessions", icon: "checkmark-circle-outline", color: "#34d399", gradient: ["rgba(52,211,153,0.12)", "rgba(52,211,153,0.04)"] },
            { label: "Avg Session", value: `${avgMinutes}`, unit: "min", icon: "time-outline", color: "#a5b4fc", gradient: ["rgba(165,180,252,0.12)", "rgba(165,180,252,0.04)"] },
          ]].map((row, ri) => (
            <View key={ri} style={{ flexDirection: "row", gap: 10, marginBottom: ri === 0 ? 10 : 0 }}>
              {row.map((s, ci) => (
                <Animated.View
                  key={ci}
                  entering={FadeInDown.delay(220 + (ri * 2 + ci) * 80).springify()}
                  style={{ flex: 1 }}
                >
                  <LinearGradient
                    colors={s.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      borderRadius: 20,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: `${s.color}25`,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 11,
                          backgroundColor: `${s.color}20`,
                          borderWidth: 1,
                          borderColor: `${s.color}35`,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Ionicons name={s.icon} size={18} color={s.color} />
                      </View>
                      <Text style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontWeight: "600", textTransform: "uppercase", letterSpacing: 1 }}>
                        {s.label}
                      </Text>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
                      <Text style={{ fontSize: 28, fontWeight: "900", color: "#fff", letterSpacing: -1 }}>
                        {s.value}
                      </Text>
                      <Text style={{ fontSize: 11, color: s.color, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 }}>
                        {s.unit}
                      </Text>
                    </View>
                  </LinearGradient>
                </Animated.View>
              ))}
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
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 9,
                  backgroundColor: "rgba(249,115,22,0.12)",
                  borderWidth: 1,
                  borderColor: "rgba(249,115,22,0.25)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="flame" size={15} color={ORANGE.core} />
              </View>
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
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Ionicons name="flame" size={13} color={ORANGE.mid} />
                  <Text style={{ fontSize: 11, fontWeight: "700", color: ORANGE.mid }}>
                    {currentStreak} day streak
                  </Text>
                </View>
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
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 9,
                  backgroundColor: "rgba(249,115,22,0.12)",
                  borderWidth: 1,
                  borderColor: "rgba(249,115,22,0.25)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="people-outline" size={15} color={ORANGE.mid} />
              </View>
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

            {/* Hourly Breakdown Bars */}
            <View style={{ marginTop: 4 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 }}>
                <View style={{ flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.06)" }} />
                <Text style={{ fontSize: 9, fontWeight: "600", color: "rgba(255,255,255,0.25)", letterSpacing: 1.5, textTransform: "uppercase" }}>
                  Today's Pattern
                </Text>
                <View style={{ flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.06)" }} />
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 4, height: 70, paddingBottom: 16 }}>
                  {OCCUPANCY_DATA.map((d, i) => {
                    const barH = Math.max(6, (d.pct / 100) * 50);
                    const { color } = bucketLabel(d.pct);
                    const hourNum = parseInt(d.hour);
                    const isPM = d.hour.includes("PM");
                    const hour24 = isPM ? (hourNum === 12 ? 12 : hourNum + 12) : (hourNum === 12 ? 0 : hourNum);
                    const isCurrent = hour24 === currentHour;
                    return (
                      <View key={i} style={{ alignItems: "center", width: 28 }}>
                        <View
                          style={{
                            width: isCurrent ? 14 : 10,
                            height: barH,
                            borderRadius: 4,
                            backgroundColor: isCurrent ? color : `${color}80`,
                            borderWidth: isCurrent ? 1 : 0,
                            borderColor: isCurrent ? color : "transparent",
                            shadowColor: isCurrent ? color : "transparent",
                            shadowOffset: { width: 0, height: 0 },
                            shadowOpacity: isCurrent ? 0.6 : 0,
                            shadowRadius: isCurrent ? 8 : 0,
                          }}
                        />
                        <Text style={{
                          fontSize: 7,
                          color: isCurrent ? color : "rgba(255,255,255,0.25)",
                          fontWeight: isCurrent ? "800" : "500",
                          marginTop: 4,
                          position: "absolute",
                          bottom: -14,
                        }}>
                          {hourNum}{isPM ? "p" : "a"}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
              {/* Legend */}
              <View style={{ flexDirection: "row", justifyContent: "center", gap: 14, marginTop: 10 }}>
                {[
                  { label: "Quiet", color: "#34d399" },
                  { label: "Moderate", color: ORANGE.mid },
                  { label: "Busy", color: ORANGE.core },
                  { label: "Very Busy", color: "#EF4444" },
                ].map((l, i) => (
                  <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: l.color }} />
                    <Text style={{ fontSize: 8, color: "rgba(255,255,255,0.35)", fontWeight: "600" }}>{l.label}</Text>
                  </View>
                ))}
              </View>
            </View>

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
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 9,
                  backgroundColor: "rgba(165,180,252,0.12)",
                  borderWidth: 1,
                  borderColor: "rgba(165,180,252,0.25)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="list-outline" size={15} color="#a5b4fc" />
              </View>
              <Text style={{ fontSize: 14, fontWeight: "700", color: "rgba(255,255,255,0.85)" }}>
                Recent Sessions
              </Text>
              <View
                style={{
                  marginLeft: "auto",
                  backgroundColor: "rgba(165,180,252,0.10)",
                  borderWidth: 1,
                  borderColor: "rgba(165,180,252,0.2)",
                  borderRadius: 20,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                }}
              >
                <Text style={{ fontSize: 10, color: "#a5b4fc", fontWeight: "700" }}>
                  {logs.length} logs
                </Text>
              </View>
            </View>

            {logs.slice(0, 6).map((log, i) => (
              <LogRow key={log.id} log={log} delay={i * 60} />
            ))}

            {logs.length === 0 && (
              <View style={{ alignItems: "center", paddingVertical: 36 }}>
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    backgroundColor: "rgba(249,115,22,0.06)",
                    borderWidth: 1,
                    borderColor: "rgba(249,115,22,0.15)",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 14,
                  }}
                >
                  <Ionicons name="barbell-outline" size={28} color="rgba(249,115,22,0.25)" />
                </View>
                <Text style={{ color: "rgba(255,255,255,0.3)", fontSize: 14, fontWeight: "700" }}>
                  No sessions logged yet
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.15)", fontSize: 12, marginTop: 4 }}>
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
