
import { View } from "react-native";
import { StatCard } from "../primitives";

const StatsRow = ({ user, goalLabel, formatVisitTime }) => (
  <View style={{ flexDirection: "row", gap: 10, paddingHorizontal: 20, marginBottom: 16 }}>
    <StatCard
      value={user?.numberOfWorkoutDay ?? "—"}
      label="Workout Days"
      iconName="barbell-outline"
      color="#a5b4fc"
      bgColor="rgba(99,102,241,0.08)"
      borderColor="rgba(99,102,241,0.18)"
      delay={300}
    />
    <StatCard
      value={user?.weight ? `${user.weight}` : "—"}
      label="Weight (kg)"
      iconName="scale-outline"
      color="#fca5a5"
      bgColor="rgba(239,68,68,0.08)"
      borderColor="rgba(239,68,68,0.18)"
      delay={380}
    />
    <StatCard
      value={goalLabel}
      label="Goal"
      iconName="flag-outline"
      color="#6ee7b7"
      bgColor="rgba(16,185,129,0.08)"
      borderColor="rgba(16,185,129,0.18)"
      delay={460}
    />
    <StatCard
      value={formatVisitTime(user?.preferredVisitTime)}
      label="Visit Time"
      iconName="time-outline"
      color="#93c5fd"
      bgColor="rgba(59,130,246,0.08)"
      borderColor="rgba(59,130,246,0.18)"
      delay={540}
    />
  </View>
);

export default StatsRow;
