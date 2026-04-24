import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useState, useEffect, useRef } from "react";
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
} from "react-native-reanimated";
import api from "../../api/axios";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const OTP_LENGTH = 6;
const REGISTER_URL = `${process.env.EXPO_PUBLIC_API_URL}/users/register`;

// ─── Animated Glow Orb ────────────────────────────────────────────────────────
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

// ─── Border Beam ──────────────────────────────────────────────────────────────
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

// ─── Single OTP Box ───────────────────────────────────────────────────────────
const OtpBox = ({ digit, focused, filled }) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (filled) {
      scale.value = withSequence(
        withTiming(1.15, { duration: 100 }),
        withTiming(1, { duration: 100 })
      );
    }
  }, [filled]);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View
      style={[
        {
          width: (SCREEN_WIDTH - 48 - 40 - (OTP_LENGTH - 1) * 8) / OTP_LENGTH,
          height: 56,
          borderRadius: 14,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: focused ? 1.5 : 1,
          borderColor: focused
            ? "rgba(99,102,241,0.7)"
            : filled
            ? "rgba(99,102,241,0.3)"
            : "rgba(255,255,255,0.07)",
          backgroundColor: focused
            ? "rgba(99,102,241,0.12)"
            : filled
            ? "rgba(99,102,241,0.06)"
            : "rgba(255,255,255,0.04)",
        },
        animStyle,
      ]}
    >
      {focused && !digit ? (
        <BlinkingCursor />
      ) : (
        <Text
          style={{ fontSize: 22, fontWeight: "700", color: "#fff", letterSpacing: 2 }}
        >
          {digit || ""}
        </Text>
      )}
    </Animated.View>
  );
};

const BlinkingCursor = () => {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 500 }),
        withTiming(1, { duration: 500 })
      ),
      -1,
      false
    );
  }, []);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[{ width: 2, height: 24, borderRadius: 2, backgroundColor: "#a5b4fc" }, style]}
    />
  );
};

const OtpVerificationScreen = ({ navigation, route }) => {
  const { name, email, phone, password, role } = route?.params || {};
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 300);
    setCountdown(60); // Start countdown since OTP was just sent
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const id = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [countdown]);

  const handleSendOtp = async () => {
    if (!email) {
      Alert.alert("Error", "No email address provided.");
      return;
    }
    setSending(true);
    try {
      await api.post("/users/send-otp", { email });
      setCountdown(60);
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Failed to send OTP");
    } finally {
      setSending(false);
    }
  };

  const handleChange = (text) => {
    const digits = text.replace(/[^0-9]/g, "");
    const newOtp = Array(OTP_LENGTH).fill("");

    for (let i = 0; i < Math.min(digits.length, OTP_LENGTH); i++) {
      newOtp[i] = digits[i];
    }

    setOtp(newOtp);
    const nextFocus = Math.min(digits.length, OTP_LENGTH - 1);
    setFocusedIndex(nextFocus);
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length < OTP_LENGTH) {
      Alert.alert("Incomplete", "Please enter all 6 digits.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/users/register", { name, email, phone, password, role, otp: code });
      // ProfileSetup can mount. Pass the token as a param instead.
      navigation.navigate("ProfileSetup", { token: data.token });
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const filledCount = otp.filter(Boolean).length;
  const isComplete = filledCount === OTP_LENGTH;

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={["rgba(99,102,241,0.35)", "rgba(79,70,229,0.25)", "rgba(0,0,0,1)"]}
        locations={[0, 0.4, 1]}
        style={{ position: "absolute", inset: 0 }}
      />

      <GlowOrb size={280} color="rgba(99,102,241,0.15)" top={-60} left={SCREEN_WIDTH / 2 - 140} delay={0} />
      <GlowOrb size={200} color="rgba(139,92,246,0.12)" top={80} left={-60} delay={1000} />
      <GlowOrb size={180} color="rgba(99,102,241,0.1)" top={550} left={SCREEN_WIDTH - 100} delay={2000} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            paddingHorizontal: 24,
            paddingTop: 60,
            paddingBottom: 40,
          }}
        >
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

          {/* ── Glass Card ───────────────────────────────────────────── */}
          <Animated.View entering={FadeInUp.delay(200).duration(800).springify()} style={{ position: "relative" }}>
            <BorderBeam />

            {/* Card border glow */}
            <View
              style={{
                position: "absolute",
                top: -0.5, left: -0.5, right: -0.5, bottom: -0.5,
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
              {/* ── Header ─────────────────────────────────────────── */}
              <Animated.View entering={FadeInDown.delay(300).springify()} style={{ alignItems: "center", marginBottom: 28 }}>
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
                  <Ionicons name="shield-checkmark-outline" size={26} color="#fff" />
                </LinearGradient>

                <Text style={{ fontSize: 22, fontWeight: "700", color: "#fff", letterSpacing: -0.5 }}>
                  Verify Your Email
                </Text>
                <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 6, textAlign: "center", lineHeight: 20 }}>
                  Enter the 6-digit code sent to{"\n"}
                  <Text style={{ color: "rgba(165,180,252,0.85)", fontWeight: "600" }}>
                    {email || "your email"}
                  </Text>
                </Text>
              </Animated.View>

              {/* ── OTP Boxes ──────────────────────────────────────── */}
              <Animated.View entering={FadeInDown.delay(400).springify()}>
                {/* Hidden real input */}
                <TextInput
                  ref={inputRef}
                  value={otp.join("")}
                  onChangeText={handleChange}
                  keyboardType="number-pad"
                  maxLength={OTP_LENGTH}
                  style={{ position: "absolute", opacity: 0, width: 1, height: 1 }}
                  caretHidden
                  onFocus={() => setFocusedIndex(Math.min(filledCount, OTP_LENGTH - 1))}
                  onBlur={() => setFocusedIndex(-1)}
                  editable={!loading}
                />

                {/* Visual boxes */}
                <TouchableOpacity
                  onPress={() => inputRef.current?.focus()}
                  activeOpacity={1}
                  style={{ flexDirection: "row", gap: 8, justifyContent: "center" }}
                >
                  {otp.map((digit, index) => (
                    <OtpBox
                      key={index}
                      digit={digit}
                      focused={focusedIndex === index}
                      filled={!!digit}
                    />
                  ))}
                </TouchableOpacity>
              </Animated.View>

              {/* ── Progress Bar ────────────────────────────────────── */}
              <Animated.View entering={FadeInDown.delay(500).springify()} style={{ marginTop: 20 }}>
                <View style={{ height: 3, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 99 }}>
                  <View
                    style={{
                      height: 3,
                      width: `${(filledCount / OTP_LENGTH) * 100}%`,
                      borderRadius: 99,
                      backgroundColor: isComplete ? "#34d399" : "#6366f1",
                    }}
                  />
                </View>
                <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 6, textAlign: "right" }}>
                  {filledCount}/{OTP_LENGTH} digits
                </Text>
              </Animated.View>

              {/* ── Verify Button ───────────────────────────────────── */}
              <Animated.View entering={FadeInDown.delay(600).springify()} style={{ marginTop: 20 }}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleVerify}
                  disabled={loading || !isComplete}
                >
                  <View style={{ borderRadius: 14, overflow: "hidden" }}>
                    <LinearGradient
                      colors={
                        !isComplete
                          ? ["rgba(99,102,241,0.3)", "rgba(139,92,246,0.3)"]
                          : loading
                          ? ["#4f46e5", "#6366f1"]
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
                      {loading ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <>
                          <Text
                            style={{
                              fontSize: 15,
                              fontWeight: "700",
                              color: isComplete ? "#000" : "rgba(255,255,255,0.3)",
                              letterSpacing: 0.3,
                            }}
                          >
                            Create Account
                          </Text>
                          {isComplete && (
                            <Ionicons name="arrow-forward" size={16} color="#000" />
                          )}
                        </>
                      )}
                    </LinearGradient>
                  </View>
                </TouchableOpacity>
              </Animated.View>

              {/* ── Divider ─────────────────────────────────────────── */}
              <Animated.View
                entering={FadeInDown.delay(700).springify()}
                style={{ flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 16 }}
              >
                <View style={{ flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.06)" }} />
                <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontWeight: "500" }}>
                  didn't receive it?
                </Text>
                <View style={{ flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.06)" }} />
              </Animated.View>

              {/* ── Send OTP / Resend ────────────────────────────────── */}
              <Animated.View entering={FadeInDown.delay(800).springify()}>
                <TouchableOpacity
                  onPress={handleSendOtp}
                  disabled={sending || countdown > 0}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    paddingVertical: 12,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor:
                      countdown > 0
                        ? "rgba(255,255,255,0.05)"
                        : "rgba(99,102,241,0.3)",
                    backgroundColor:
                      countdown > 0
                        ? "rgba(255,255,255,0.02)"
                        : "rgba(99,102,241,0.08)",
                  }}
                  activeOpacity={0.7}
                >
                  {sending ? (
                    <ActivityIndicator color="rgba(165,180,252,0.7)" size="small" />
                  ) : (
                    <>
                      <Ionicons
                        name="mail-outline"
                        size={15}
                        color={
                          countdown > 0
                            ? "rgba(255,255,255,0.2)"
                            : "rgba(165,180,252,0.8)"
                        }
                      />
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "600",
                          color:
                            countdown > 0
                              ? "rgba(255,255,255,0.2)"
                              : "rgba(165,180,252,0.9)",
                        }}
                      >
                        {countdown > 0 ? `Resend in ${countdown}s` : "Resend OTP"}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </Animated.View>
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default OtpVerificationScreen;
