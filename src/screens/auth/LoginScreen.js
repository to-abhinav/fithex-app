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
import * as SecureStore from "expo-secure-store";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const LOGIN_URL = `${process.env.EXPO_PUBLIC_API_URL}/auth/login`;

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

// ─── Login Screen ──────────────────────────────────────────────────────
const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [loading, setLoading] = useState(false);

  // ── Login Handler ──────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Validation", "Please enter email and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(LOGIN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert("Login Failed", data.message || "Invalid credentials.");
        return;
      }

      if (!data.token) {
        Alert.alert("Error", "No token received from server");
        console.error("Response data:", data);
        return;
      }

      await SecureStore.setItemAsync("token", data.token);
      console.log("Login successful. Token stored");

      navigation.replace("Profile");
      setEmail("");
      setPassword("");
    } catch (error) {
      console.error("Login error:", error.message);
      Alert.alert("Error", error.message || "Could not connect to server. Check your network.");
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
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
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
                  Welcome Back
                </Text>
                <Text className="text-[13px] text-white/40 mt-1 font-normal">
                  Login to your FitHex account
                </Text>
              </Animated.View>

              {/* ── Form Fields ─────────────────────────────────────── */}
              <View className="gap-3.5">
                {/* Email */}
                <Animated.View entering={FadeInDown.delay(400).springify()}>
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
                <Animated.View entering={FadeInDown.delay(500).springify()}>
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
                      placeholder="Your Password"
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
                </Animated.View>

                {/* ── Forgot Password ───────────────────────────────── */}
                <Animated.View entering={FadeInDown.delay(600).springify()} className="items-end">
                  <TouchableOpacity activeOpacity={0.7}>
                    <Text className="text-[12px] text-indigo-300 font-medium">Forgot Password?</Text>
                  </TouchableOpacity>
                </Animated.View>

                {/* ── Login Button ─────────────────────────── */}
                <Animated.View entering={FadeInDown.delay(700).springify()}>
                  <TouchableOpacity
                    className="mt-2"
                    activeOpacity={0.85}
                    onPress={handleLogin}
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
                              Login
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
                  entering={FadeInDown.delay(800).springify()}
                  className="flex-row items-center gap-3 my-1"
                >
                  <View className="flex-1 h-px bg-white/[0.06]" />
                  <Text className="text-[11px] text-white/25 font-medium">
                    or login with
                  </Text>
                  <View className="flex-1 h-px bg-white/[0.06]" />
                </Animated.View>

                {/* ── Social Buttons ────────────────────────────────── */}
                <Animated.View
                  entering={FadeInDown.delay(900).springify()}
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

                {/* ── Sign Up Link ──────────────────────────────────── */}
                <Animated.View
                  entering={FadeInDown.delay(1000).springify()}
                  className="items-center mt-2"
                >
                  <TouchableOpacity
                    onPress={() => navigation.navigate("Registration")}
                    activeOpacity={0.7}
                  >
                    <Text className="text-[13px] text-white/30">
                      Don't have an account?{" "}
                      <Text className="text-indigo-300 font-semibold">
                        Register now
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

export default LoginScreen;
