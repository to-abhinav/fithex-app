
import { View, Text, TouchableOpacity } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ActivityItem } from "../primitives";

const RecentActivityCard = () => (
  <Animated.View entering={FadeInDown.delay(620).springify()} style={{ marginHorizontal: 20, marginBottom: 14 }}>
    <View
      style={{
        backgroundColor: "rgba(255,255,255,0.03)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.07)",
        borderRadius: 20,
        padding: 18,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <Text style={{ fontSize: 14, fontWeight: "700", color: "rgba(255,255,255,0.85)" }}>
          Recent Activity
        </Text>
        <TouchableOpacity activeOpacity={0.7}>
          <Text style={{ fontSize: 12, color: "#a5b4fc", fontWeight: "600" }}>See all</Text>
        </TouchableOpacity>
      </View>

      <ActivityItem iconName="walk-outline" title="Morning Run" subtitle="Today · 5.2 km · 34 min" badge="+320 kcal" badgeColor="rgba(16,185,129,0.12)" delay={680} />
      <ActivityItem iconName="barbell-outline" title="Upper Body Push" subtitle="Yesterday · 45 min" badge="+580 kcal" badgeColor="rgba(99,102,241,0.12)" delay={710} />
      <ActivityItem iconName="body-outline" title="Yoga & Recovery" subtitle="2 days ago · 30 min" badge="+150 kcal" badgeColor="rgba(139,92,246,0.12)" delay={740} />
      <ActivityItem iconName="bicycle-outline" title="Cycling" subtitle="3 days ago · 12 km" badge="+440 kcal" badgeColor="rgba(6,182,212,0.12)" delay={770} />
    </View>
  </Animated.View>
);

export default RecentActivityCard;
