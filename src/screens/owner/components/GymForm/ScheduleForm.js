import { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  StyleSheet,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import colors from "../../../../theme/colors";

const GENDER_OPTIONS = ["Unisex", "Male Only", "Female Only"];

const ScheduleForm = ({ formData, onUpdate }) => {
  const [genderOpen, setGenderOpen] = useState(false);

  const updateTiming = useCallback(
    (dayIndex, key, value) => {
      const updated = formData.timings.map((t, i) =>
        i === dayIndex ? { ...t, [key]: value } : t
      );
      onUpdate("timings", updated);
    },
    [formData.timings, onUpdate]
  );

  return (
    <View style={styles.container}>
      {/* Schedule Section */}
      <Animated.View entering={FadeInDown.delay(50).duration(400)}>
        <Text style={styles.sectionTitle}>Schedule</Text>
        <Text style={styles.sectionSubtitle}>
          Set your operating hours for each day
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(120).duration(400)}>
        {formData.timings.map((day, index) => (
          <View key={day.day} style={styles.dayRow}>
            <View style={styles.dayLabelRow}>
              <Text style={[styles.dayLabel, !day.isOpen && styles.dayLabelOff]}>
                {day.day.substring(0, 3)}
              </Text>
              <Switch
                value={day.isOpen}
                onValueChange={(v) => updateTiming(index, "isOpen", v)}
                trackColor={{ false: colors.border, true: `${colors.primary}60` }}
                thumbColor={day.isOpen ? colors.primary : colors.textMuted}
              />
            </View>

            <View style={styles.timeInputs}>
              <TextInput
                style={[styles.timeInput, !day.isOpen && styles.timeInputDisabled]}
                placeholder="06:00"
                placeholderTextColor={colors.textMuted}
                value={day.open}
                onChangeText={(v) => updateTiming(index, "open", v)}
                keyboardType="numeric"
                maxLength={5}
                editable={day.isOpen}
              />
              <Text style={styles.timeSep}>–</Text>
              <TextInput
                style={[styles.timeInput, !day.isOpen && styles.timeInputDisabled]}
                placeholder="22:00"
                placeholderTextColor={colors.textMuted}
                value={day.close}
                onChangeText={(v) => updateTiming(index, "close", v)}
                keyboardType="numeric"
                maxLength={5}
                editable={day.isOpen}
              />
            </View>
          </View>
        ))}
      </Animated.View>

      {/* Policies Section */}
      <Animated.View entering={FadeInDown.delay(250).duration(400)}>
        <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Policies</Text>
        <Text style={styles.sectionSubtitle}>
          Set admission policies for your gym
        </Text>
      </Animated.View>

      {/* Gender Picker */}
      <Animated.View entering={FadeInDown.delay(300).duration(400)}>
        <View style={styles.fieldWrapper}>
          <View style={styles.labelRow}>
            <Ionicons
              name="people-outline"
              size={14}
              color={colors.textMuted}
              style={styles.labelIcon}
            />
            <Text style={styles.label}>Gender Policy</Text>
          </View>

          <TouchableOpacity
            onPress={() => setGenderOpen(!genderOpen)}
            activeOpacity={0.85}
            style={styles.dropdown}
          >
            <Text style={styles.dropdownText}>{formData.gender}</Text>
            <Ionicons
              name={genderOpen ? "chevron-up" : "chevron-down"}
              size={16}
              color={colors.textMuted}
            />
          </TouchableOpacity>

          {genderOpen && (
            <View style={styles.dropdownMenu}>
              {GENDER_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  onPress={() => {
                    onUpdate("gender", opt);
                    setGenderOpen(false);
                  }}
                  style={[
                    styles.dropdownItem,
                    formData.gender === opt && styles.dropdownItemActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      formData.gender === opt && styles.dropdownItemTextActive,
                    ]}
                  >
                    {opt}
                  </Text>
                  {formData.gender === opt && (
                    <Ionicons name="checkmark" size={16} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </Animated.View>

      {/* Minimum Age */}
      <Animated.View entering={FadeInDown.delay(360).duration(400)}>
        <View style={styles.fieldWrapper}>
          <View style={styles.labelRow}>
            <Ionicons
              name="shield-checkmark-outline"
              size={14}
              color={colors.textMuted}
              style={styles.labelIcon}
            />
            <Text style={styles.label}>Minimum Age</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="16"
            placeholderTextColor={colors.textMuted}
            value={formData.minimumAge}
            onChangeText={(v) => onUpdate("minimumAge", v)}
            keyboardType="numeric"
            maxLength={3}
          />
        </View>
      </Animated.View>

      {/* Max Capacity */}
      <Animated.View entering={FadeInDown.delay(420).duration(400)}>
        <View style={styles.fieldWrapper}>
          <View style={styles.labelRow}>
            <Ionicons
              name="resize-outline"
              size={14}
              color={colors.textMuted}
              style={styles.labelIcon}
            />
            <Text style={styles.label}>Max Capacity</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="100"
            placeholderTextColor={colors.textMuted}
            value={formData.maxCapacity}
            onChangeText={(v) => onUpdate("maxCapacity", v)}
            keyboardType="numeric"
            maxLength={5}
          />
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 16,
  },

  // Day rows
  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
  },
  dayLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minWidth: 90,
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
    width: 36,
  },
  dayLabelOff: {
    color: colors.textMuted,
  },
  timeInputs: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timeInput: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: 64,
    fontSize: 13,
    color: colors.textPrimary,
    textAlign: "center",
    fontWeight: "600",
  },
  timeInputDisabled: {
    opacity: 0.35,
  },
  timeSep: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: "600",
  },

  // Fields
  fieldWrapper: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  labelIcon: {
    marginRight: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  input: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: colors.textPrimary,
  },

  // Dropdown
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dropdownText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  dropdownMenu: {
    marginTop: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    overflow: "hidden",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownItemActive: {
    backgroundColor: `${colors.primary}14`,
  },
  dropdownItemText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  dropdownItemTextActive: {
    color: colors.primary,
    fontWeight: "700",
  },
});

export default ScheduleForm;
