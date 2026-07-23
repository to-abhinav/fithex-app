
import { Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";

const QuickActionButtons = () => (
  <Animated.View
    entering={FadeInDown.delay(660).springify()}
    style={{ flexDirection: "row", gap: 12, paddingHorizontal: 20, marginBottom: 14 }}
  >
    <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.85}>
      <LinearGradient
        colors={["#6366f1", "#8b5cf6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          borderRadius: 16,
          paddingVertical: 14,
          alignItems: "center",
          flexDirection: "row",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <Ionicons name="barbell-outline" size={16} color="#fff" />
        <Text style={{ fontSize: 14, fontWeight: "800", color: "#fff" }}>
          Start Workout
        </Text>
      </LinearGradient>
    </TouchableOpacity>

    <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.85}>
      <LinearGradient
        colors={["#10b981", "#059669"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          borderRadius: 16,
          paddingVertical: 14,
          alignItems: "center",
          flexDirection: "row",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <Ionicons name="analytics-outline" size={16} color="#fff" />
        <Text style={{ fontSize: 14, fontWeight: "800", color: "#fff" }}>
          Progress
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  </Animated.View>
);

export default QuickActionButtons;
