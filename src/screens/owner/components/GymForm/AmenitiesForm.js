import { useState, useCallback } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import colors from "../../../../theme/colors";

const AMENITY_OPTIONS = [
  { label: "WiFi", icon: "wifi-outline" },
  { label: "Parking", icon: "car-outline" },
  { label: "Locker Room", icon: "lock-closed-outline" },
  { label: "Shower", icon: "water-outline" },
  { label: "AC", icon: "snow-outline" },
  { label: "Changing Room", icon: "shirt-outline" },
  { label: "Cafeteria", icon: "cafe-outline" },
  { label: "Steam Room", icon: "cloud-outline" },
  { label: "Swimming Pool", icon: "fish-outline" },
  { label: "Sauna", icon: "flame-outline" },
  { label: "Cardio Zone", icon: "heart-outline" },
  { label: "Free Weights", icon: "barbell-outline" },
  { label: "Personal Training", icon: "people-outline" },
  { label: "Group Classes", icon: "people-circle-outline" },
];

const AmenitiesForm = ({ formData, onUpdate }) => {
  const [equipmentInput, setEquipmentInput] = useState("");

  const toggleAmenity = useCallback(
    (label) => {
      const current = formData.amenities || [];
      const updated = current.includes(label)
        ? current.filter((a) => a !== label)
        : [...current, label];
      onUpdate("amenities", updated);
    },
    [formData.amenities, onUpdate]
  );

  const addEquipment = useCallback(() => {
    const tag = equipmentInput.trim();
    if (!tag) return;
    const current = formData.equipment || [];
    if (current.includes(tag)) {
      setEquipmentInput("");
      return;
    }
    onUpdate("equipment", [...current, tag]);
    setEquipmentInput("");
  }, [equipmentInput, formData.equipment, onUpdate]);

  const removeEquipment = useCallback(
    (tag) => {
      const current = formData.equipment || [];
      onUpdate("equipment", current.filter((t) => t !== tag));
    },
    [formData.equipment, onUpdate]
  );

  const selected = formData.amenities || [];

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.delay(50).duration(400)}>
        <Text style={styles.sectionTitle}>Amenities</Text>
        <Text style={styles.sectionSubtitle}>Select amenities available at your gym</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(120).duration(400)} style={styles.chipGrid}>
        {AMENITY_OPTIONS.map((item) => {
          const isOn = selected.includes(item.label);
          return (
            <TouchableOpacity key={item.label} onPress={() => toggleAmenity(item.label)} activeOpacity={0.8} style={[styles.chip, isOn && styles.chipOn]}>
              <Ionicons name={item.icon} size={16} color={isOn ? colors.primary : colors.textMuted} />
              <Text style={[styles.chipText, isOn && styles.chipTextOn]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(400)}>
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Equipment</Text>
        <Text style={styles.sectionSubtitle}>Add equipment tags (e.g. Treadmill, Smith Machine)</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(260).duration(400)} style={styles.addRow}>
        <TextInput
          style={styles.addInput}
          placeholder="Equipment name"
          placeholderTextColor={colors.textMuted}
          value={equipmentInput}
          onChangeText={setEquipmentInput}
          onSubmitEditing={addEquipment}
          returnKeyType="done"
          autoCapitalize="words"
        />
        <TouchableOpacity onPress={addEquipment} activeOpacity={0.85} style={styles.addButton}>
          <Ionicons name="add" size={20} color={colors.textPrimary} />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </Animated.View>

      {(formData.equipment || []).length > 0 && (
        <View style={styles.tagGrid}>
          {formData.equipment.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
              <TouchableOpacity onPress={() => removeEquipment(tag)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                <Ionicons name="close" size={14} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: colors.textPrimary, marginBottom: 4 },
  sectionSubtitle: { fontSize: 13, color: colors.textMuted, marginBottom: 16 },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  chipOn: { backgroundColor: `${colors.primary}1F`, borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: "600", color: colors.textMuted },
  chipTextOn: { color: colors.primary },
  addRow: { flexDirection: "row", gap: 10 },
  addInput: { flex: 1, backgroundColor: colors.surfaceLight, borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: colors.textPrimary },
  addButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingHorizontal: 18, borderRadius: 14, backgroundColor: colors.primary },
  addButtonText: { fontSize: 14, fontWeight: "700", color: colors.textPrimary },
  tagGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
  tag: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: colors.surfaceLight },
  tagText: { fontSize: 13, fontWeight: "600", color: colors.textSecondary },
});

export default AmenitiesForm;
