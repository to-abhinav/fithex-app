import { useState } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import colors from "../../../../theme/colors";

const FIELDS = [
  {
    key: "name",
    label: "Gym Name",
    placeholder: "Gym Name",
    required: true,
    icon: "fitness-outline",
  },
  {
    key: "contact",
    label: "Contact Number",
    placeholder: "Contact Number",
    required: true,
    keyboardType: "phone-pad",
    icon: "call-outline",
  },
  {
    key: "description",
    label: "Description",
    placeholder: "Describe your gym…",
    multiline: true,
    numberOfLines: 4,
    icon: "document-text-outline",
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    placeholder: "WhatsApp Number (optional)",
    keyboardType: "phone-pad",
    icon: "logo-whatsapp",
  },
  {
    key: "email",
    label: "Email",
    placeholder: "Email (optional)",
    keyboardType: "email-address",
    icon: "mail-outline",
  },
  {
    key: "website",
    label: "Website",
    placeholder: "Website (optional)",
    keyboardType: "url",
    icon: "globe-outline",
  },
];

const BasicInfoForm = ({ formData, onUpdate, errors = [] }) => {
  const [focusedField, setFocusedField] = useState(null);

  const getFieldError = (key) => {
    // Match error messages to field keys
    const errorMap = {
      name: errors.find((e) => e.toLowerCase().includes("name")),
      contact: errors.find((e) => e.toLowerCase().includes("contact")),
      email: errors.find((e) => e.toLowerCase().includes("email")),
    };
    return errorMap[key] || null;
  };

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.delay(50).duration(400)}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        <Text style={styles.sectionSubtitle}>
          Tell members about your gym
        </Text>
      </Animated.View>

      {FIELDS.map((field, index) => {
        const fieldError = getFieldError(field.key);
        const isFocused = focusedField === field.key;
        const hasError = !!fieldError;

        return (
          <Animated.View
            key={field.key}
            entering={FadeInDown.delay(100 + index * 60).duration(400)}
          >
            <View style={styles.fieldWrapper}>
              <View style={styles.labelRow}>
                <Ionicons
                  name={field.icon}
                  size={14}
                  color={isFocused ? colors.primary : colors.textMuted}
                  style={styles.labelIcon}
                />
                <Text style={[styles.label, isFocused && styles.labelFocused]}>
                  {field.label}
                </Text>
                {field.required && <Text style={styles.asterisk}>*</Text>}
              </View>

              <TextInput
                style={[
                  styles.input,
                  field.multiline && styles.inputMultiline,
                  isFocused && styles.inputFocused,
                  hasError && styles.inputError,
                ]}
                placeholder={field.placeholder}
                placeholderTextColor={colors.textMuted}
                value={formData[field.key]}
                onChangeText={(v) => onUpdate(field.key, v)}
                onFocus={() => setFocusedField(field.key)}
                onBlur={() => setFocusedField(null)}
                keyboardType={field.keyboardType || "default"}
                multiline={field.multiline || false}
                numberOfLines={field.numberOfLines || 1}
                textAlignVertical={field.multiline ? "top" : "center"}
                autoCapitalize="none"
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
    marginBottom: 20,
  },
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
  labelFocused: {
    color: colors.primary,
  },
  asterisk: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 3,
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
  inputMultiline: {
    minHeight: 100,
    paddingTop: 14,
  },
  inputFocused: {
    borderColor: colors.borderFocus,
  },
  inputError: {
    borderColor: colors.danger,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 5,
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
    fontWeight: "500",
  },
});

export default BasicInfoForm;
