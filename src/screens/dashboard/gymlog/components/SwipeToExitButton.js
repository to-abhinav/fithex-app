import { useState, useEffect, useRef } from "react";
import { View, Text, Vibration, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSpring,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { SWIPE_TRACK_H, SWIPE_THUMB_SIZE, SWIPE_THRESHOLD } from "../constants";

const SwipeToExitButton = ({ onExitComplete, disabled }) => {
  const [trackWidth, setTrackWidth] = useState(0);
  const translateX = useSharedValue(0);
  const triggered = useRef(false);
  const maxSlide = trackWidth - SWIPE_THUMB_SIZE - 8; 

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

export default SwipeToExitButton;
