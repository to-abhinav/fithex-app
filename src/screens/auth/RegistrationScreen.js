import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
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
  FadeInDown,
  FadeInUp,
  Easing,
  interpolate,
} from "react-native-reanimated";
import axios from "axios";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
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

// ─── Animated Border Beam ─────────────────────────────────────────────────────
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
      className="absolute -top-[0.5px] -left-[0.5px] -right-[0.5px] -bottom-[0.5px] rounded-3xl overflow-hidden"
      pointerEvents="none"
    >
      {/* Top beam */}
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

// ─── Registration Screen ──────────────────────────────────────────────────────
const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  // ── Password Strength ─────────────────────────────────────────────────
  const getPasswordStrength = () => {
    if (password.length === 0) return { bars: 0, label: "", color: "#6366f1" };
    if (password.length < 6) return { bars: 1, label: "Weak", color: "#f87171" };
    if (password.length < 10) return { bars: 2, label: "Medium", color: "#fbbf24" };
    if (/[A-Z]/.test(password) && /[0-9]/.test(password))
      return { bars: 4, label: "Strong", color: "#34d399" };
    return { bars: 3, label: "Good", color: "#6ee7b7" };
  };
  const strength = getPasswordStrength();

  // ── Register Handler ──────────────────────────────────────────────────
  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    if (!agreed) {
      Alert.alert("Error", "Please accept the terms");
      return;
    }

    setLoading(true);
    try {
      await axios.post(REGISTER_URL, { name, email, password });
      Alert.alert("Success", "Account created successfully!");
      navigation.navigate("Login");
    } catch (error) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />

      {/* ── Background Gradient Layer ──────────────────────────────────── */}
      <LinearGradient
        colors={["rgba(99,102,241,0.35)", "rgba(79,70,229,0.25)", "rgba(0,0,0,1)"]}
        locations={[0, 0.4, 1]}
        className="absolute inset-0"
      />

      {/* ── Glow Orbs ─────────────────────────────────────────────────── */}
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
        top={100}
        left={-60}
        delay={1000}
      />
      <GlowOrb
        size={180}
        color="rgba(99,102,241,0.1)"
        top={600}
        left={SCREEN_WIDTH - 100}
        delay={2000}
      />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24, paddingTop: 60, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Back Button ─────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="w-9 h-9 bg-white/[0.06] border border-white/[0.08] rounded-xl items-center justify-center mb-6"
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={18} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          </Animated.View>

          {/* ── Glass Card ──────────────────────────────────────────── */}
          <Animated.View
            entering={FadeInUp.delay(200).duration(800).springify()}
            className="relative"
          >
            {/* Border beam effect */}
            <BorderBeam />

            {/* Card border glow */}
            <View className="absolute -inset-[0.5px] rounded-3xl border border-white/[0.08]" />

            {/* Glass card */}
            <View
              className="rounded-3xl p-6 border border-white/[0.05] overflow-hidden"
              style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
            >
              {/* ── Logo ────────────────────────────────────────────── */}
              <Animated.View
                entering={FadeInDown.delay(300).springify()}
                className="items-center mb-6"
              >
                <LinearGradient
                  colors={["#6366f1", "#8b5cf6"]}
                  className="w-12 h-12 rounded-2xl items-center justify-center mb-4"
                >
                  <Text className="text-xl">💪</Text>
                </LinearGradient>

                <Text className="text-[22px] font-bold text-white tracking-tight">
                  Create Account
                </Text>
                <Text className="text-[13px] text-white/40 mt-1 font-normal">
                  Start your fitness journey with FitHex
                </Text>
              </Animated.View>

              {/* ── Form Fields ─────────────────────────────────────── */}
              <View className="gap-3.5">

                {/* Full Name */}
                <Animated.View entering={FadeInDown.delay(400).springify()}>
                  <Text className="text-[11px] text-white/35 font-semibold uppercase tracking-widest mb-2 ml-1">
                    Full Name
                  </Text>
                  <View
                    className="flex-row items-center rounded-xl px-4 h-[50px] gap-2.5 border"
                    style={{
                      backgroundColor:
                        focusedField === "name"
                          ? "rgba(255,255,255,0.08)"
                          : "rgba(255,255,255,0.04)",
                      borderColor:
                        focusedField === "name"
                          ? "rgba(99,102,241,0.4)"
                          : "rgba(255,255,255,0.06)",
                    }}
                  >
                    <Ionicons
                      name="person-outline"
                      size={16}
                      color={
                        focusedField === "name"
                          ? "rgba(165,180,252,0.9)"
                          : "rgba(165,180,252,0.35)"
                      }
                    />
                    <TextInput
                      className="flex-1 text-[15px] text-white font-normal"
                      placeholder="John Doe"
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      value={name}
                      onChangeText={setName}
                      onFocus={() => setFocusedField("name")}
                      onBlur={() => setFocusedField(null)}
                      autoCapitalize="words"
                      editable={!loading}
                    />
                  </View>
                </Animated.View>

                {/* Email */}
                <Animated.View entering={FadeInDown.delay(500).springify()}>
                  <Text className="text-[11px] text-white/35 font-semibold uppercase tracking-widest mb-2 ml-1">
                    Email Address
                  </Text>
                  <View
                    className="flex-row items-center rounded-xl px-4 h-[50px] gap-2.5 border"
                    style={{
                      backgroundColor:
                        focusedField === "email"
                          ? "rgba(255,255,255,0.08)"
                          : "rgba(255,255,255,0.04)",
                      borderColor:
                        focusedField === "email"
                          ? "rgba(99,102,241,0.4)"
                          : "rgba(255,255,255,0.06)",
                    }}
                  >
                    <Ionicons
                      name="mail-outline"
                      size={16}
                      color={
                        focusedField === "email"
                          ? "rgba(165,180,252,0.9)"
                          : "rgba(165,180,252,0.35)"
                      }
                    />
                    <TextInput
                      className="flex-1 text-[15px] text-white font-normal"
                      placeholder="you@fithex.io"
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      value={email}
                      onChangeText={setEmail}
                      onFocus={() => setFocusedField("email")}
                      onBlur={() => setFocusedField(null)}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      editable={!loading}
                    />
                  </View>
                </Animated.View>

                {/* Password */}
                <Animated.View entering={FadeInDown.delay(600).springify()}>
                  <Text className="text-[11px] text-white/35 font-semibold uppercase tracking-widest mb-2 ml-1">
                    Password
                  </Text>
                  <View
                    className="flex-row items-center rounded-xl px-4 h-[50px] gap-2.5 border"
                    style={{
                      backgroundColor:
                        focusedField === "password"
                          ? "rgba(255,255,255,0.08)"
                          : "rgba(255,255,255,0.04)",
                      borderColor:
                        focusedField === "password"
                          ? "rgba(99,102,241,0.4)"
                          : "rgba(255,255,255,0.06)",
                    }}
                  >
                    <Ionicons
                      name="lock-closed-outline"
                      size={16}
                      color={
                        focusedField === "password"
                          ? "rgba(165,180,252,0.9)"
                          : "rgba(165,180,252,0.35)"
                      }
                    />
                    <TextInput
                      className="flex-1 text-[15px] text-white font-normal"
                      placeholder="Min. 8 characters"
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      value={password}
                      onChangeText={setPassword}
                      onFocus={() => setFocusedField("password")}
                      onBlur={() => setFocusedField(null)}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      editable={!loading}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={16}
                        color="rgba(255,255,255,0.25)"
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Password Strength Bars */}
                  {password.length > 0 && (
                    <View className="mt-2.5 px-0.5">
                      <View className="flex-row gap-1 mb-1.5">
                        {[1, 2, 3, 4].map((bar) => (
                          <View
                            key={bar}
                            className="flex-1 h-[3px] rounded-full"
                            style={{
                              backgroundColor:
                                bar <= strength.bars
                                  ? strength.color
                                  : "rgba(255,255,255,0.08)",
                            }}
                          />
                        ))}
                      </View>
                      <Text
                        className="text-[11px] font-medium"
                        style={{ color: strength.color }}
                      >
                        {strength.label} password
                      </Text>
                    </View>
                  )}
                </Animated.View>

                {/* ── Terms Checkbox ────────────────────────────────── */}
                <Animated.View entering={FadeInDown.delay(700).springify()}>
                  <TouchableOpacity
                    className="flex-row items-start gap-3 pt-1"
                    onPress={() => setAgreed(!agreed)}
                    activeOpacity={0.7}
                    disabled={loading}
                  >
                    <View
                      className="w-[18px] h-[18px] rounded-md items-center justify-center mt-0.5"
                      style={{
                        backgroundColor: agreed
                          ? undefined
                          : "rgba(255,255,255,0.05)",
                        borderWidth: agreed ? 0 : 1,
                        borderColor: "rgba(255,255,255,0.12)",
                      }}
                    >
                      {agreed ? (
                        <LinearGradient
                          colors={["#6366f1", "#8b5cf6"]}
                          className="w-full h-full rounded-md items-center justify-center"
                        >
                          <Ionicons name="checkmark" size={11} color="#fff" />
                        </LinearGradient>
                      ) : null}
                    </View>
                    <Text className="flex-1 text-xs text-white/30 leading-relaxed">
                      I agree to the{" "}
                      <Text className="text-indigo-300 font-semibold">
                        Terms of Service
                      </Text>{" "}
                      and{" "}
                      <Text className="text-indigo-300 font-semibold">
                        Privacy Policy
                      </Text>
                    </Text>
                  </TouchableOpacity>
                </Animated.View>

                {/* ── Create Account Button ─────────────────────────── */}
                <Animated.View entering={FadeInDown.delay(800).springify()}>
                  <TouchableOpacity
                    className="mt-2"
                    activeOpacity={0.85}
                    onPress={handleRegister}
                    disabled={loading}
                  >
                    <View className="overflow-hidden rounded-xl">
                      <LinearGradient
                        colors={
                          loading
                            ? ["#4f46e5", "#6366f1"]
                            : ["#ffffff", "#f0f0f0"]
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        className="py-[14px] items-center justify-center flex-row gap-2"
                      >
                        {loading ? (
                          <ActivityIndicator color="#fff" size="small" />
                        ) : (
                          <>
                            <Text className="text-[15px] font-bold text-black tracking-wide">
                              Create Account
                            </Text>
                            <Ionicons
                              name="arrow-forward"
                              size={16}
                              color="#000"
                            />
                          </>
                        )}
                      </LinearGradient>
                    </View>
                  </TouchableOpacity>
                </Animated.View>

                {/* ── Divider ───────────────────────────────────────── */}
                <Animated.View
                  entering={FadeInDown.delay(900).springify()}
                  className="flex-row items-center gap-3 my-1"
                >
                  <View className="flex-1 h-px bg-white/[0.06]" />
                  <Text className="text-[11px] text-white/25 font-medium">
                    or sign up with
                  </Text>
                  <View className="flex-1 h-px bg-white/[0.06]" />
                </Animated.View>

                {/* ── Social Buttons ────────────────────────────────── */}
                <Animated.View
                  entering={FadeInDown.delay(1000).springify()}
                  className="flex-row gap-3"
                >
                  <TouchableOpacity
                    className="flex-1 flex-row items-center justify-center gap-2 bg-white/[0.04] border border-white/[0.07] rounded-xl py-3.5"
                    activeOpacity={0.7}
                  >
                    <Text className="text-base font-bold text-white/70">G</Text>
                    <Text className="text-[13px] font-semibold text-white/50">
                      Google
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 flex-row items-center justify-center gap-2 bg-white/[0.04] border border-white/[0.07] rounded-xl py-3.5"
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="logo-apple"
                      size={16}
                      color="rgba(255,255,255,0.5)"
                    />
                    <Text className="text-[13px] font-semibold text-white/50">
                      Apple
                    </Text>
                  </TouchableOpacity>
                </Animated.View>

                {/* ── Sign In Link ──────────────────────────────────── */}
                <Animated.View
                  entering={FadeInDown.delay(1100).springify()}
                  className="items-center mt-2"
                >
                  <TouchableOpacity
                    onPress={() => navigation.navigate("Login")}
                    activeOpacity={0.7}
                  >
                    <Text className="text-[13px] text-white/30">
                      Already have an account?{" "}
                      <Text className="text-indigo-300 font-semibold">
                        Sign In
                      </Text>
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default RegisterScreen;