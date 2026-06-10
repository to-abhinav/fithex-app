import { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  FadeInDown,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import colors from "../../../theme/colors";

const STEP_LABELS = ["Info", "Location", "Amenities", "Schedule", "Review"];

const StepDot = ({ index, currentStep }) => {
  const isCompleted = index < currentStep;
  const isCurrent = index === currentStep;
  const isFuture = index > currentStep;

  const scale = useSharedValue(1);

  useEffect(() => {
    if (isCurrent) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.25, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      scale.value = withTiming(1, { duration: 300 });
    }
  }, [isCurrent]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={stepStyles.dotColumn}>
      <Animated.View
        style={[
          stepStyles.dot,
          isCompleted && stepStyles.dotCompleted,
          isCurrent && stepStyles.dotCurrent,
          isFuture && stepStyles.dotFuture,
          isCurrent && animatedStyle,
        ]}
      >
        {isCompleted && (
          <Ionicons name="checkmark" size={14} color={colors.textPrimary} />
        )}
      </Animated.View>
      <Text
        style={[
          stepStyles.label,
          (isCompleted || isCurrent) && stepStyles.labelActive,
        ]}
      >
        {STEP_LABELS[index]}
      </Text>
    </View>
  );
};

const StepIndicator = ({ currentStep, totalSteps = 5 }) => {
  return (
    <Animated.View
      entering={FadeInDown.delay(100).duration(500)}
      style={stepStyles.container}
    >
      {Array.from({ length: totalSteps }).map((_, i) => (
        <View key={i} style={stepStyles.stepRow}>
          <StepDot index={i} currentStep={currentStep} />
          {i < totalSteps - 1 && (
            <View
              style={[
                stepStyles.line,
                i < currentStep && stepStyles.lineCompleted,
              ]}
            />
          )}
        </View>
      ))}
    </Animated.View>
  );
};

const stepStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
  },
  dotColumn: {
    alignItems: "center",
    width: 44,
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  dotCompleted: {
    backgroundColor: colors.primary,
  },
  dotCurrent: {
    backgroundColor: "transparent",
    borderWidth: 2.5,
    borderColor: colors.primary,
  },
  dotFuture: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  label: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: "600",
    marginTop: 6,
    textAlign: "center",
  },
  labelActive: {
    color: colors.primary,
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    marginTop: 13,
    marginHorizontal: -4,
    borderRadius: 1,
  },
  lineCompleted: {
    backgroundColor: colors.primary,
  },
});

export default StepIndicator;
