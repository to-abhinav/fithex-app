import { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import colors from "../../../../theme/colors";

const ADDRESS_FIELDS = [
  { key: "street", label: "Street Address", placeholder: "Street Address", required: true, icon: "location-outline" },
  { key: "city", label: "City", placeholder: "City", required: true, icon: "business-outline" },
  { key: "state", label: "State", placeholder: "State", required: true, icon: "map-outline" },
  { key: "pincode", label: "Pincode", placeholder: "Pincode", required: true, keyboardType: "numeric", maxLength: 6, icon: "keypad-outline" },
];

const LocationForm = ({ formData, onUpdate, errors = [] }) => {
  const [focusedField, setFocusedField] = useState(null);
  const [detecting, setDetecting] = useState(false);
  const [gpsStatus, setGpsStatus] = useState(
    formData.latitude && formData.longitude ? "success" : null
  );

  const getFieldError = (key) => {
    const map = {
      street: errors.find((e) => e.toLowerCase().includes("street")),
      city: errors.find((e) => e.toLowerCase().includes("city")),
      state: errors.find((e) => e.toLowerCase().includes("state")),
      pincode: errors.find((e) => e.toLowerCase().includes("pincode")),
    };
    return map[key] || null;
  };

  const handleDetectLocation = useCallback(async () => {
    setDetecting(true);
    setGpsStatus(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setGpsStatus("error");
        setDetecting(false);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      onUpdate("latitude", pos.coords.latitude);
      onUpdate("longitude", pos.coords.longitude);
      setGpsStatus("success");
    } catch {
      setGpsStatus("error");
    } finally {
      setDetecting(false);
    }
  }, [onUpdate]);

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.delay(50).duration(400)}>
        <Text style={styles.sectionTitle}>Location</Text>
        <Text style={styles.sectionSubtitle}>Where is your gym located?</Text>
      </Animated.View>

      {ADDRESS_FIELDS.map((field, index) => {
        const fieldError = getFieldError(field.key);
        const isFocused = focusedField === field.key;
        const hasError = !!fieldError;
        return (
          <Animated.View key={field.key} entering={FadeInDown.delay(100 + index * 60).duration(400)}>
            <View style={styles.fieldWrapper}>
              <View style={styles.labelRow}>
                <Ionicons name={field.icon} size={14} color={isFocused ? colors.primary : colors.textMuted} style={styles.labelIcon} />
                <Text style={[styles.label, isFocused && styles.labelFocused]}>{field.label}</Text>
                {field.required && <Text style={styles.asterisk}>*</Text>}
              </View>
              <TextInput
                style={[styles.input, isFocused && styles.inputFocused, hasError && styles.inputError]}
                placeholder={field.placeholder}
                placeholderTextColor={colors.textMuted}
                value={formData[field.key]}
                onChangeText={(v) => onUpdate(field.key, v)}
                onFocus={() => setFocusedField(field.key)}
                onBlur={() => setFocusedField(null)}
                keyboardType={field.keyboardType || "default"}
                maxLength={field.maxLength}
                autoCapitalize="words"
                autoCorrect={false}
              />
              {hasError && (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle" size={12} color={colors.danger} />
                  <Text style={styles.errorText}>{fieldError}</Text>
                </View>
              )}
            </View>
          </Animated.View>
        );
      })}

      <Animated.View entering={FadeInDown.delay(350).duration(400)} style={styles.gpsSection}>
        <TouchableOpacity onPress={handleDetectLocation} activeOpacity={0.85} disabled={detecting} style={styles.gpsButton}>
          {detecting ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="navigate-outline" size={18} color={colors.primary} />
          )}
          <Text style={styles.gpsButtonText}>{detecting ? "Detecting…" : "Detect My Location"}</Text>
        </TouchableOpacity>
        <Text style={styles.gpsNote}>For best accuracy, stand inside your gym</Text>
        {gpsStatus === "success" && (
          <View style={styles.gpsSuccess}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={styles.gpsSuccessText}>GPS coordinates captured</Text>
          </View>
        )}
        {gpsStatus === "error" && (
          <View style={styles.gpsError}>
            <Ionicons name="close-circle" size={16} color={colors.danger} />
            <Text style={styles.gpsErrorText}>Could not detect location. Please allow location access.</Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: colors.textPrimary, marginBottom: 4 },
  sectionSubtitle: { fontSize: 13, color: colors.textMuted, marginBottom: 20 },
  fieldWrapper: { marginBottom: 16 },
  labelRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  labelIcon: { marginRight: 6 },
  label: { fontSize: 13, fontWeight: "600", color: colors.textSecondary },
  labelFocused: { color: colors.primary },
  asterisk: { color: colors.danger, fontSize: 14, fontWeight: "700", marginLeft: 3 },
  input: { backgroundColor: colors.surfaceLight, borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 14, color: colors.textPrimary },
  inputFocused: { borderColor: colors.borderFocus },
  inputError: { borderColor: colors.danger },
  errorRow: { flexDirection: "row", alignItems: "center", marginTop: 6, gap: 5 },
  errorText: { fontSize: 12, color: colors.danger, fontWeight: "500" },
  gpsSection: { marginTop: 8, marginBottom: 8 },
  gpsButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, height: 48, borderRadius: 14, backgroundColor: `${colors.primary}14`, borderWidth: 1, borderColor: `${colors.primary}30` },
  gpsButtonText: { fontSize: 14, fontWeight: "700", color: colors.primary },
  gpsNote: { fontSize: 12, color: colors.textMuted, fontStyle: "italic", textAlign: "center", marginTop: 8 },
  gpsSuccess: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 10 },
  gpsSuccessText: { fontSize: 13, color: colors.success, fontWeight: "600" },
  gpsError: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 10 },
  gpsErrorText: { fontSize: 12, color: colors.danger, fontWeight: "500" },
});

export default LocationForm;
