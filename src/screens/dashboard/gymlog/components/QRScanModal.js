import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Vibration,
  Platform,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withSpring,
  FadeIn,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { ORANGE } from "../constants";

const QRScanModal = ({ visible, onClose, onScanned, mode }) => {
  const [phase, setPhase] = useState("idle"); 
  const [errorMsg, setErrorMsg] = useState("");
  const [permission, requestPermission] = useCameraPermissions();
  const hasScannedRef = useRef(false);
  const scanLine   = useSharedValue(0);
  const cornerGlow = useSharedValue(0.4);
  const successScale = useSharedValue(0);
  const successOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setPhase("idle");
      setErrorMsg("");
      hasScannedRef.current = false;
      successScale.value = 0;
      successOpacity.value = 0;
      if (!permission?.granted) requestPermission();
    }
  }, [visible]);

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

  const handleBarCodeScanned = async ({ data }) => {
    if (hasScannedRef.current || phase !== "idle") return;
    hasScannedRef.current = true;

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
      await onScanned(data); 
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

export default QRScanModal;
