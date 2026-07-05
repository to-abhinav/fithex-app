import { View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ORANGE } from "../constants";

const LogRow = ({ log, delay }) => {
  const durationColor = log.duration >= 90 ? "#34d399" : log.duration >= 60 ? ORANGE.core : "#a5b4fc";
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 14,
          paddingHorizontal: 14,
          marginBottom: 8,
          backgroundColor: "rgba(255,255,255,0.03)",
          borderRadius: 16,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.05)",
        }}
      >
        {/* Duration dot indicator */}
        <View style={{ marginRight: 12, alignItems: "center" }}>
          <LinearGradient
            colors={[`${durationColor}30`, `${durationColor}10`]}
            style={{
              width: 42,
              height: 42,
              borderRadius: 13,
              borderWidth: 1,
              borderColor: `${durationColor}40`,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="barbell-outline" size={18} color={durationColor} />
          </LinearGradient>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: "800", color: "#fff" }}>{log.date}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 }}>
            <Ionicons name="time-outline" size={10} color="rgba(255,255,255,0.25)" />
            <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
              {log.entryTime} → {log.exitTime}
            </Text>
          </View>
        </View>

        <View
          style={{
            backgroundColor: `${durationColor}15`,
            borderWidth: 1,
            borderColor: `${durationColor}35`,
            borderRadius: 20,
            paddingHorizontal: 12,
            paddingVertical: 5,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: "700", color: durationColor }}>
            {Math.floor(log.duration / 60)}h {log.duration % 60}m
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

export default LogRow;
