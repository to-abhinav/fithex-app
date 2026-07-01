import { useEffect } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  interpolate,
} from "react-native-reanimated";

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

export default GlowOrb;
