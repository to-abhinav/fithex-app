import React, { useEffect } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  interpolate,
  FadeIn,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const PulsingRing = ({ size, delay = 0 }) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 2000, easing: Easing.out(Easing.ease) }),
          withTiming(0, { duration: 0 })
        ),
        -1,
        false
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.4, 1], [0.6, 0.15, 0]),
    transform: [
      { scale: interpolate(progress.value, [0, 1], [1, 2.5]) },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 1.5,
          borderColor: "rgba(99,102,241,0.5)",
        },
        style,
      ]}
    />
  );
};

// ─── Glow Orb (same as Login) ──────────────────────────────────────────────────
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

const LoadingDots = () => {
  const dots = [0, 1, 2];

  return (
    <View style={styles.dotsRow}>
      {dots.map((i) => (
        <Dot key={i} index={i} />
      ))}
    </View>
  );
};

const Dot = ({ index }) => {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withDelay(
      index * 200,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: 400, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: interpolate(opacity.value, [0.3, 1], [0.8, 1.1]) }],
  }));

  return (
    <Animated.View
      style={[
        {
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: "#a5b4fc",
          marginHorizontal: 4,
        },
        style,
      ]}
    />
  );
};

// ─── Auth Loading Screen ───────────────────────────────────────────────────────
const AuthLoadingScreen = () => {
  return (
    <View style={styles.container}>
      {/* Background gradient — matches the rest of the auth flow */}
      <LinearGradient
        colors={["rgba(99,102,241,0.35)", "rgba(79,70,229,0.25)", "rgba(0,0,0,1)"]}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Ambient glow orbs */}
      <GlowOrb
        size={300}
        color="rgba(99,102,241,0.15)"
        top={-80}
        left={SCREEN_WIDTH / 2 - 150}
        delay={0}
      />
      <GlowOrb
        size={220}
        color="rgba(139,92,246,0.12)"
        top={200}
        left={-80}
        delay={800}
      />
      <GlowOrb
        size={200}
        color="rgba(99,102,241,0.08)"
        top={500}
        left={SCREEN_WIDTH - 80}
        delay={1600}
      />

      {/* Center content */}
      <View style={styles.center}>
        {/* Pulsing rings behind the logo */}
        <View style={styles.logoContainer}>
          <PulsingRing size={100} delay={0} />
          <PulsingRing size={100} delay={700} />
          <PulsingRing size={100} delay={1400} />

          {/* Logo icon */}
          <Animated.View entering={FadeIn.duration(800)} style={styles.logoCircle}>
            <LinearGradient
              colors={["#6366f1", "#8b5cf6"]}
              style={styles.logoGradient}
            >
              <Text style={styles.logoEmoji}>💪</Text>
            </LinearGradient>
          </Animated.View>
        </View>

        {/* Brand text */}
        <Animated.Text
          entering={FadeIn.delay(300).duration(800)}
          style={styles.brand}
        >
          FitHex
        </Animated.Text>

        <Animated.Text
          entering={FadeIn.delay(600).duration(800)}
          style={styles.tagline}
        >
          Your Fitness Companion
        </Animated.Text>

        {/* Loading dots */}
        <Animated.View entering={FadeIn.delay(900).duration(800)} style={styles.dotsWrapper}>
          <LoadingDots />
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 22,
    overflow: "hidden",
  },
  logoGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoEmoji: {
    fontSize: 30,
  },
  brand: {
    fontSize: 32,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    color: "rgba(255,255,255,0.35)",
    marginTop: 8,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  dotsWrapper: {
    marginTop: 48,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default AuthLoadingScreen;
