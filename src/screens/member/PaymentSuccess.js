import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function PaymentSuccess({ route, navigation }) {
  const { plan, gym } = route.params;

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Text style={styles.icon}>✓</Text>
      </View>
      <Text style={styles.title}>Membership activated!</Text>
      <Text style={styles.subtitle}>
        You are now a member of {gym.name}. Your {plan.name} plan is active.
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("Home")}
      >
        <Text style={styles.buttonText}>Go to dashboard</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  iconCircle:  { width: 80, height: 80, borderRadius: 40, backgroundColor: "#e8f5e9",
                 alignItems: "center", justifyContent: "center", marginBottom: 24 },
  icon:        { fontSize: 36, color: "#2e7d32" },
  title:       { fontSize: 22, fontWeight: "700", color: "#1a1a1a", marginBottom: 12 },
  subtitle:    { fontSize: 15, color: "#666", textAlign: "center", lineHeight: 22, marginBottom: 32 },
  button:      { backgroundColor: "#6366F1", borderRadius: 12, paddingVertical: 14,
                 paddingHorizontal: 40 },
  buttonText:  { color: "#fff", fontSize: 16, fontWeight: "600" },
});