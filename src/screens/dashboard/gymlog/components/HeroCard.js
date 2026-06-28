import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  FadeIn,
  Easing,
  interpolate,
} from "react-native-reanimated";

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

export { SkeletonBlock };
export default HeroCardSkeleton;
