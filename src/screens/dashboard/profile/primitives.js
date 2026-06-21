
import { useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  FadeInDown,
  Easing,
  interpolate,
  SlideInRight,
} from "react-native-reanimated";

export const GlowOrb = ({ size, color, top, left, delay = 0 }) => {
  const pulse = useSharedValue(0.25);

  useEffect(() => {
    pulse.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.55, { duration: 3500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.25, { duration: 3500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: pulse.value,
    transform: [{ scale: interpolate(pulse.value, [0.25, 0.55], [0.92, 1.08]) }],
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

export const StatCard = ({ value, label, iconName, color, bgColor, borderColor, delay }) => (
  <Animated.View
    entering={FadeInDown.delay(delay).springify()}
    style={{ flex: 1 }}
  >
    <View
      style={{
        backgroundColor: bgColor,
        borderWidth: 1,
        borderColor: borderColor,
        borderRadius: 20,
        paddingVertical: 14,
        paddingHorizontal: 8,
        alignItems: "center",
        justifyContent: "center",
        minHeight: 110,
      }}
    >
      <Ionicons name={iconName} size={20} color={color} style={{ marginBottom: 6 }} />
      <Text
        style={{
          fontSize: 16,
          fontWeight: "900",
          color,
          letterSpacing: -0.5,
          textAlign: "center",
        }}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
      >
        {value}
      </Text>
      <Text
        style={{
          fontSize: 9,
          color: "rgba(255,255,255,0.35)",
          fontWeight: "600",
          textTransform: "uppercase",
          letterSpacing: 0.8,
          marginTop: 3,
          textAlign: "center",
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  </Animated.View>
);

export const ActivityItem = ({ iconName, title, subtitle, badge, badgeColor, delay }) => (
  <Animated.View entering={SlideInRight.delay(delay).springify()}>
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.05)",
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: "rgba(99,102,241,0.12)",
          borderWidth: 1,
          borderColor: "rgba(99,102,241,0.2)",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        <Ionicons name={iconName} size={18} color="#a5b4fc" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}>{title}</Text>
        <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>
          {subtitle}
        </Text>
      </View>
      <View
        style={{
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 20,
          backgroundColor: badgeColor || "rgba(99,102,241,0.15)",
          borderWidth: 1,
          borderColor: badgeColor
            ? badgeColor.replace("0.12", "0.25")
            : "rgba(99,102,241,0.25)",
        }}
      >
        <Text style={{ fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,0.7)" }}>
          {badge}
        </Text>
      </View>
    </View>
  </Animated.View>
);

export const SettingsRow = ({ icon, label, value, onPress, danger, delay }) => (
  <Animated.View entering={FadeInDown.delay(delay).springify()}>
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.05)",
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: danger ? "rgba(248,113,113,0.1)" : "rgba(255,255,255,0.05)",
          borderWidth: 1,
          borderColor: danger ? "rgba(248,113,113,0.2)" : "rgba(255,255,255,0.08)",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 14,
        }}
      >
        <Ionicons
          name={icon}
          size={17}
          color={danger ? "#f87171" : "rgba(165,180,252,0.8)"}
        />
      </View>
      <Text
        style={{
          flex: 1,
          fontSize: 14,
          fontWeight: "500",
          color: danger ? "#f87171" : "rgba(255,255,255,0.85)",
        }}
      >
        {label}
      </Text>
      {value ? (
        <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginRight: 8 }}>
          {value}
        </Text>
      ) : null}
      {!danger && (
        <Ionicons name="chevron-forward" size={15} color="rgba(255,255,255,0.2)" />
      )}
    </TouchableOpacity>
  </Animated.View>
);
