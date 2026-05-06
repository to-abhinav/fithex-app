import { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Keyboard,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import colors from "../../../theme/colors";
import useGymForm from "../hooks/useGymForm";
import StepIndicator from "./StepIndicator";
import BasicInfoForm from "./GymForm/BasicInfoForm";
import LocationForm from "./GymForm/LocationForm";
import AmenitiesForm from "./GymForm/AmenitiesForm";
import ScheduleForm from "./GymForm/ScheduleForm";
import { createGym } from "../../../api/gymService";

const TOTAL_STEPS = 5;

const CreateWizard = ({ onGymCreated }) => {
  const { formData, updateField, validateStep, resetForm } = useGymForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const handleNext = useCallback(() => {
    Keyboard.dismiss();
    const result = validateStep(currentStep);
    if (!result.valid) {
      setErrors(result.errors);
      return;
    }
    setErrors([]);
    setCurrentStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }, [currentStep, validateStep]);

  const handleBack = useCallback(() => {
    Keyboard.dismiss();
    setErrors([]);
    setCurrentStep((s) => Math.max(s - 1, 0));
  }, []);

  const jumpToStep = useCallback((step) => {
    setErrors([]);
    setCurrentStep(step);
  }, []);

  const handleCreate = useCallback(async () => {
    Keyboard.dismiss();
    setSubmitError(null);
    setSubmitting(true);
    try {
      // Build the payload field names must match backend gymValidator
      const payload = {
        name: formData.name,
        contactNumber: formData.contact,
        description: formData.description,
        whatsappNumber: formData.whatsapp || undefined,
        email: formData.email || undefined,
        website: formData.website || undefined,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
        },
        location: {
          coordinates:
            formData.longitude && formData.latitude
              ? [parseFloat(formData.longitude), parseFloat(formData.latitude)]
              : undefined,
        },
        amenities: formData.amenities,
        equipment: formData.equipment,
        timings: formData.timings.map((t) => ({
          day: t.day,
          openTime: t.open,
          closeTime: t.close,
          isClosed: !t.isOpen,
        })),
        genderPolicy: formData.gender,
        minimumAge: parseInt(formData.minimumAge, 10) || 16,
        maxCapacity: parseInt(formData.maxCapacity, 10) || 100,
        socialLinks: {
          instagram: formData.instagram || "",
          facebook: formData.facebook || "",
          youtube: formData.youtube || "",
        },
      };

      await createGym(payload);
      resetForm();
      onGymCreated();
    } catch (err) {
      const msg =
        err.response?.data?.message || err.message || "Failed to create gym";
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  }, [formData, resetForm, onGymCreated]);

  // ── Render current step ─────────────────────────────────────────────────
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <BasicInfoForm
            formData={formData}
            onUpdate={updateField}
            errors={errors}
          />
        );
      case 1:
        return (
          <LocationForm
            formData={formData}
            onUpdate={updateField}
            errors={errors}
          />
        );
      case 2:
        return (
          <AmenitiesForm
            formData={formData}
            onUpdate={updateField}
          />
        );
      case 3:
        return (
          <ScheduleForm
            formData={formData}
            onUpdate={updateField}
          />
        );
      case 4:
        return renderReview();
      default:
        return null;
    }
  };

  // ── Step 4: Review & Create 
  const renderReview = () => {
    const enabledTimings = formData.timings.filter((t) => t.isOpen);

    return (
      <View style={styles.reviewContainer}>
        <Animated.View entering={FadeInDown.delay(50).duration(400)}>
          <Text style={styles.sectionTitle}>Review & Create</Text>
          <Text style={styles.sectionSubtitle}>
            Verify everything looks good before creating
          </Text>
        </Animated.View>

        {/* Basic Info Card */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={styles.reviewCard}
        >
          <View style={styles.reviewCardHeader}>
            <Text style={styles.reviewCardTitle}>Basic Info</Text>
            <TouchableOpacity onPress={() => jumpToStep(0)}>
              <Text style={styles.editLink}>Edit</Text>
            </TouchableOpacity>
          </View>
          <ReviewRow label="Name" value={formData.name} />
          <ReviewRow label="Contact" value={formData.contact} />
          {formData.description ? (
            <ReviewRow label="Description" value={formData.description} />
          ) : null}
          {formData.whatsapp ? (
            <ReviewRow label="WhatsApp" value={formData.whatsapp} />
          ) : null}
          {formData.email ? (
            <ReviewRow label="Email" value={formData.email} />
          ) : null}
          {formData.website ? (
            <ReviewRow label="Website" value={formData.website} />
          ) : null}
        </Animated.View>

        {/* Location Card */}
        <Animated.View
          entering={FadeInDown.delay(180).duration(400)}
          style={styles.reviewCard}
        >
          <View style={styles.reviewCardHeader}>
            <Text style={styles.reviewCardTitle}>Location</Text>
            <TouchableOpacity onPress={() => jumpToStep(1)}>
              <Text style={styles.editLink}>Edit</Text>
            </TouchableOpacity>
          </View>
          <ReviewRow
            label="Address"
            value={`${formData.street}, ${formData.city}`}
          />
          <ReviewRow
            label="State / Pincode"
            value={`${formData.state} — ${formData.pincode}`}
          />
          {formData.latitude && formData.longitude ? (
            <ReviewRow label="GPS" value="Coordinates captured" accent />
          ) : (
            <ReviewRow label="GPS" value="Not set" />
          )}
        </Animated.View>

        {/* Amenities Card */}
        <Animated.View
          entering={FadeInDown.delay(260).duration(400)}
          style={styles.reviewCard}
        >
          <View style={styles.reviewCardHeader}>
            <Text style={styles.reviewCardTitle}>Amenities</Text>
            <TouchableOpacity onPress={() => jumpToStep(2)}>
              <Text style={styles.editLink}>Edit</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.reviewAmenities}>
            {formData.amenities.length > 0
              ? formData.amenities.join(", ")
              : "None selected"}
          </Text>
          {formData.equipment.length > 0 && (
            <>
              <Text style={styles.reviewSubLabel}>Equipment</Text>
              <Text style={styles.reviewAmenities}>
                {formData.equipment.join(", ")}
              </Text>
            </>
          )}
        </Animated.View>

        {/* Schedule Card */}
        <Animated.View
          entering={FadeInDown.delay(340).duration(400)}
          style={styles.reviewCard}
        >
          <View style={styles.reviewCardHeader}>
            <Text style={styles.reviewCardTitle}>Schedule</Text>
            <TouchableOpacity onPress={() => jumpToStep(3)}>
              <Text style={styles.editLink}>Edit</Text>
            </TouchableOpacity>
          </View>
          {formData.timings.map((t, i) => (
            <View key={i} style={styles.scheduleRow}>
              <Text style={styles.scheduleDay}>
                {t.day.substring(0, 3)}
              </Text>
              <Text
                style={[
                  styles.scheduleHours,
                  !t.isOpen && styles.scheduleClosed,
                ]}
              >
                {t.isOpen ? `${t.open} – ${t.close}` : "Closed"}
              </Text>
            </View>
          ))}
        </Animated.View>

        {/* Policies Card */}
        <Animated.View
          entering={FadeInDown.delay(420).duration(400)}
          style={styles.reviewCard}
        >
          <View style={styles.reviewCardHeader}>
            <Text style={styles.reviewCardTitle}>Policies</Text>
            <TouchableOpacity onPress={() => jumpToStep(3)}>
              <Text style={styles.editLink}>Edit</Text>
            </TouchableOpacity>
          </View>
          <ReviewRow label="Gender" value={formData.gender} />
          <ReviewRow label="Min Age" value={formData.minimumAge} />
          <ReviewRow label="Max Capacity" value={formData.maxCapacity} />
        </Animated.View>

        {/* Social Links Card */}
        {(formData.instagram || formData.facebook || formData.youtube) && (
          <Animated.View
            entering={FadeInDown.delay(500).duration(400)}
            style={styles.reviewCard}
          >
            <View style={styles.reviewCardHeader}>
              <Text style={styles.reviewCardTitle}>Social Links</Text>
              <TouchableOpacity onPress={() => jumpToStep(0)}>
                <Text style={styles.editLink}>Edit</Text>
              </TouchableOpacity>
            </View>
            {formData.instagram ? <ReviewRow label="Instagram" value={formData.instagram} /> : null}
            {formData.facebook ? <ReviewRow label="Facebook" value={formData.facebook} /> : null}
            {formData.youtube ? <ReviewRow label="YouTube" value={formData.youtube} /> : null}
          </Animated.View>
        )}

        {/* Submit Error */}
        {submitError && (
          <Animated.View
            entering={FadeInDown.duration(300)}
            style={styles.submitErrorWrap}
          >
            <Ionicons name="alert-circle" size={16} color={colors.danger} />
            <Text style={styles.submitErrorText}>{submitError}</Text>
          </Animated.View>
        )}
      </View>
    );
  };

  // ── Bottom Buttons ──────────────────────────────────────────────────────
  const renderButtons = () => {
    const isFirst = currentStep === 0;
    const isLast = currentStep === TOTAL_STEPS - 1;

    return (
      <Animated.View
        entering={FadeInUp.delay(200).duration(400)}
        style={styles.buttonRow}
      >
        {!isFirst && (
          <TouchableOpacity
            onPress={handleBack}
            activeOpacity={0.85}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={16} color={colors.textSecondary} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}

        {isLast ? (
          <TouchableOpacity
            onPress={handleCreate}
            activeOpacity={0.85}
            style={[styles.nextButton, styles.createButton, isFirst && { flex: 1 }]}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={colors.textPrimary} />
            ) : (
              <>
                <Ionicons name="barbell-outline" size={18} color={colors.textPrimary} />
                <Text style={styles.nextButtonText}>Create My Gym</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleNext}
            activeOpacity={0.85}
            style={[styles.nextButton, isFirst && { flex: 1 }]}
          >
            <Text style={styles.nextButtonText}>Next</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.textPrimary} />
          </TouchableOpacity>
        )}
      </Animated.View>
    );
  };

  // ── Errors banner ───────────────────────────────────────────────────────
  const renderErrors = () => {
    if (errors.length === 0) return null;
    return (
      <Animated.View entering={FadeInDown.duration(300)} style={styles.errorBanner}>
        {errors.map((e, i) => (
          <View key={i} style={styles.errorItem}>
            <Ionicons name="alert-circle" size={13} color={colors.danger} />
            <Text style={styles.errorItemText}>{e}</Text>
          </View>
        ))}
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <StepIndicator currentStep={currentStep} totalSteps={TOTAL_STEPS} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {renderStep()}
        {renderErrors()}
      </ScrollView>

      {renderButtons()}
    </View>
  );
};

// ── ReviewRow helper 
const ReviewRow = ({ label, value, accent }) => (
  <View style={styles.reviewRow}>
    <Text style={styles.reviewLabel}>{label}</Text>
    <Text
      style={[styles.reviewValue, accent && { color: colors.accent }]}
      numberOfLines={2}
    >
      {value || "—"}
    </Text>
  </View>
);

// ─── Styles 
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // ── Section Headers 
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textPrimary,
    marginBottom: 4,
    paddingHorizontal: 20,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 20,
    paddingHorizontal: 20,
  },

  // ── Buttons 
  buttonRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  backButton: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  backButtonText: {
    color: colors.textSecondary,
    fontWeight: "700",
    fontSize: 14,
  },
  nextButton: {
    flex: 2,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  createButton: {
    backgroundColor: colors.primary,
  },
  nextButtonText: {
    color: colors.textPrimary,
    fontWeight: "700",
    fontSize: 15,
  },

  // ── Errors 
  errorBanner: {
    marginHorizontal: 20,
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: `${colors.danger}14`,
    borderWidth: 1,
    borderColor: `${colors.danger}30`,
  },
  errorItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  errorItemText: {
    fontSize: 13,
    color: colors.danger,
    fontWeight: "500",
    flex: 1,
  },

  // ── Review 
  reviewContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  reviewCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  reviewCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  reviewCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  editLink: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
  },
  reviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  reviewLabel: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: "500",
    flex: 1,
  },
  reviewValue: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "600",
    flex: 2,
    textAlign: "right",
  },
  reviewAmenities: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "600",
    lineHeight: 20,
  },
  reviewSubLabel: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "500",
    marginTop: 10,
    marginBottom: 4,
  },

  // ── Schedule (review) 
  scheduleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 5,
  },
  scheduleDay: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "600",
    width: 36,
  },
  scheduleHours: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  scheduleClosed: {
    color: colors.textMuted,
    fontStyle: "italic",
  },

  // ── Submit error 
  submitErrorWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 20,
  },
  submitErrorText: {
    fontSize: 13,
    color: colors.danger,
    fontWeight: "500",
    flex: 1,
  },
});

export default CreateWizard;
