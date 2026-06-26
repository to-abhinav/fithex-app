
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";

const WeeklyGoalCard = ({ user }) => (
  <Animated.View entering={FadeInDown.delay(500).springify()} style={{ marginHorizontal: 20, marginBottom: 14 }}>
    <View
      style={{
        backgroundColor: "rgba(255,255,255,0.03)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.07)",
        borderRadius: 20,
        padding: 18,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Ionicons name="trophy-outline" size={16} color="#a5b4fc" />
          <Text style={{ fontSize: 14, fontWeight: "700", color: "rgba(255,255,255,0.85)" }}>
            Weekly Goal
          </Text>
        </View>
        <Text style={{ fontSize: 13, fontWeight: "800", color: "#a5b4fc" }}>— / {user?.numberOfWorkoutDay ?? 5}</Text>
      </View>

      <View style={{ flexDirection: "row", gap: 6, marginBottom: 12 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <View
            key={i}
            style={{ flex: 1, height: 6, borderRadius: 4, overflow: "hidden" }}
          >
            {i <= 3 ? (
              <LinearGradient
                colors={["#6366f1", "#8b5cf6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ flex: 1 }}
              />
            ) : (
              <View style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.08)" }} />
            )}
          </View>
        ))}
      </View>

      <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: "500" }}>
        2 more workouts to crush your goal this week
      </Text>
    </View>
  </Animated.View>
);

export default WeeklyGoalCard;
