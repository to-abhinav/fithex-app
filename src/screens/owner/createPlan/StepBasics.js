import React from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import colors from "../../../theme/colors";
import { PLAN_NAMES, CATEGORIES, CAT_META, DURATION_MAP } from "./constants";
import { Section, Label } from "./SharedUI";

const StepBasics = ({ name, setName, category, setCategory, duration, setDuration, description, setDescription }) => {
  const handleName = (n) => {
    setName(n);
    if (n !== "Custom" && DURATION_MAP[n]) setDuration(DURATION_MAP[n].toString());
  };

  return (
    <Animated.View entering={FadeInDown.duration(400)}>
      <Section title="Plan Name" icon="layers-outline">
        <View style={s.chipRow}>
          {PLAN_NAMES.map((n) => (
            <TouchableOpacity
              key={n} activeOpacity={0.8}
              onPress={() => handleName(n)}
              style={[s.chip, name === n && s.chipActive]}
            >
              <Text style={[s.chipText, name === n && s.chipTextActive]}>{n}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Section>

      <Section title="Category" icon="grid-outline">
        <View style={s.catRow}>
          {CATEGORIES.map((c) => {
            const meta = CAT_META[c];
            const active = category === c;
            return (
              <TouchableOpacity
                key={c} activeOpacity={0.8}
                onPress={() => setCategory(c)}
                style={[s.catCard, active && { borderColor: meta.color, backgroundColor: `${meta.color}14` }]}
              >
                <View style={[s.catIconWrap, { backgroundColor: `${meta.color}20` }]}>
                  <Ionicons name={meta.icon} size={20} color={meta.color} />
                </View>
                <Text style={[s.catLabel, active && { color: meta.color }]}>{c}</Text>
                {active && (
                  <View style={[s.catCheck, { backgroundColor: meta.color }]}>
                    <Ionicons name="checkmark" size={10} color="#FFF" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </Section>

      <Section title="Details" icon="document-text-outline">
        <Label text="Duration (months)" required />
        <TextInput
          style={s.input}
          value={duration}
          onChangeText={setDuration}
          keyboardType="numeric"
          placeholder="e.g. 3"
          placeholderTextColor={colors.textMuted}
          editable={name === "Custom" || !name}
        />
        {name && name !== "Custom" && (
          <Text style={s.hint}>Auto-set to {DURATION_MAP[name]} month{DURATION_MAP[name] > 1 ? "s" : ""} for {name} plan</Text>
        )}

        <Label text="Description" />
        <TextInput
          style={[s.input, { height: 90, textAlignVertical: "top" }]}
          value={description}
          onChangeText={setDescription}
          multiline
          maxLength={500}
          placeholder="Describe what this plan offers..."
          placeholderTextColor={colors.textMuted}
        />
        <Text style={s.charCount}>{description.length}/500</Text>
      </Section>
    </Animated.View>
  );
};

const s = StyleSheet.create({
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12,
    backgroundColor: colors.surfaceLight, borderWidth: 1, borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: "600", color: colors.textMuted },
  chipTextActive: { color: "#FFF" },

  catRow: { flexDirection: "row", gap: 10 },
  catCard: {
    flex: 1, alignItems: "center", paddingVertical: 16, borderRadius: 16,
    backgroundColor: colors.surfaceLight, borderWidth: 1.5, borderColor: colors.border,
  },
  catIconWrap: {
    width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", marginBottom: 8,
  },
  catLabel: { fontSize: 12, fontWeight: "700", color: colors.textSecondary },
  catCheck: {
    position: "absolute", top: 8, right: 8,
    width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center",
  },

  input: {
    backgroundColor: colors.surfaceLight, borderWidth: 1, borderColor: colors.border,
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13,
    fontSize: 14, color: colors.textPrimary, fontWeight: "500",
  },
  hint: { fontSize: 11, color: colors.accent, marginTop: 6, fontStyle: "italic" },
  charCount: { fontSize: 11, color: colors.textMuted, textAlign: "right", marginTop: 4 },
});

export default StepBasics;
