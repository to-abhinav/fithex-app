import React, { useState, useRef, useCallback } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";
import colors from "../../../theme/colors";
import { useToast } from "../../../context/ToastContext";
import { createPlan } from "../../../api/ownerService";
import { STEPS, DURATION_MAP } from "./constants";
import { StepIndicator } from "./SharedUI";
import StepBasics from "./StepBasics";
import StepPricing from "./StepPricing";
import StepFeatures from "./StepFeatures";

const CreatePlanScreen = () => {
  const navigation = useNavigation();
  const toast = useToast();
  const scrollRef = useRef(null);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [duration, setDuration] = useState("");
  const [description, setDescription] = useState("");

  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");
  const [taxPercent, setTaxPercent] = useState("18");
  const [offerLabel, setOfferLabel] = useState("");
  const [offerExpiresAt, setOfferExpiresAt] = useState("");

  const [features, setFeatures] = useState([]);
  const [featureInput, setFeatureInput] = useState("");
  const [maxMembers, setMaxMembers] = useState("");

  const scrollTop = () => scrollRef.current?.scrollTo({ y: 0, animated: true });

  const validate = useCallback((s) => {
    if (s === 0) {
      if (!name) { toast.warning("Select a plan name"); return false; }
      if (!category) { toast.warning("Select a category"); return false; }
      if (!duration || parseInt(duration) < 1) { toast.warning("Enter a valid duration"); return false; }
    }
    if (s === 1) {
      if (!price || parseFloat(price) < 0) { toast.warning("Enter a valid price"); return false; }
      if (originalPrice && parseFloat(originalPrice) < parseFloat(price)) {
        toast.warning("Original price must be ≥ selling price"); return false;
      }
    }
    return true;
  }, [name, category, duration, price, originalPrice, toast]);

  const next = useCallback(() => {
    if (!validate(step)) return;
    setStep((s) => Math.min(s + 1, 2));
    scrollTop();
  }, [step, validate]);

  const prev = useCallback(() => {
    setStep((s) => Math.max(s - 1, 0));
    scrollTop();
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!validate(0) || !validate(1)) return;
    setSaving(true);
    try {
      const data = {
        name, category,
        durationInMonths: parseInt(duration),
        description: description.trim() || undefined,
        price: parseFloat(price),
        originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
        discountPercent: discountPercent ? parseFloat(discountPercent) : undefined,
        taxPercent: taxPercent ? parseFloat(taxPercent) : undefined,
        features: features.length > 0 ? features : undefined,
        maxMembers: maxMembers ? parseInt(maxMembers) : undefined,
        offerLabel: offerLabel.trim() || undefined,
        offerExpiresAt: offerExpiresAt.trim() || undefined,
      };
      await createPlan(data);
      toast.success("Plan created successfully!");
      navigation.goBack();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to create plan");
    } finally {
      setSaving(false);
    }
  }, [name, category, duration, description, price, originalPrice, discountPercent, taxPercent, features, maxMembers, offerLabel, offerExpiresAt, navigation]);

  const stepTitle = STEPS[step]?.title || "";

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[`${colors.primary}28`, `${colors.secondary}18`, "rgba(0,0,0,0)"]}
        locations={[0, 0.4, 1]}
        style={s.bgGrad}
      />

      {/* Header */}
      <Animated.View entering={FadeInDown.duration(500)} style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerLabel}>NEW MEMBERSHIP PLAN</Text>
          <Text style={s.headerTitle}>{stepTitle}</Text>
        </View>
        <Text style={s.stepCount}>{step + 1}/{STEPS.length}</Text>
      </Animated.View>

      <StepIndicator current={step} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === 0 && (
            <StepBasics
              name={name} setName={setName}
              category={category} setCategory={setCategory}
              duration={duration} setDuration={setDuration}
              description={description} setDescription={setDescription}
            />
          )}
          {step === 1 && (
            <StepPricing
              price={price} setPrice={setPrice}
              originalPrice={originalPrice} setOriginalPrice={setOriginalPrice}
              discountPercent={discountPercent} setDiscountPercent={setDiscountPercent}
              taxPercent={taxPercent} setTaxPercent={setTaxPercent}
              offerLabel={offerLabel} setOfferLabel={setOfferLabel}
              offerExpiresAt={offerExpiresAt} setOfferExpiresAt={setOfferExpiresAt}
            />
          )}
          {step === 2 && (
            <StepFeatures
              features={features} setFeatures={setFeatures}
              featureInput={featureInput} setFeatureInput={setFeatureInput}
              maxMembers={maxMembers} setMaxMembers={setMaxMembers}
              name={name} category={category} duration={duration}
              price={price} originalPrice={originalPrice}
              discountPercent={discountPercent} taxPercent={taxPercent}
              offerLabel={offerLabel} description={description}
            />
          )}
          <View style={{ height: 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer Navigation */}
      <View style={s.footer}>
        <LinearGradient
          colors={["rgba(10,10,15,0)", colors.background, colors.background]}
          style={s.footerGrad}
        />
        <View style={s.footerInner}>
          {step > 0 ? (
            <TouchableOpacity onPress={prev} activeOpacity={0.8} style={s.prevBtn}>
              <Ionicons name="arrow-back" size={18} color={colors.textSecondary} />
              <Text style={s.prevText}>Back</Text>
            </TouchableOpacity>
          ) : (
            <View />
          )}

          {step < 2 ? (
            <TouchableOpacity onPress={next} activeOpacity={0.85} style={s.nextBtn}>
              <Text style={s.nextText}>Next</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleSubmit} activeOpacity={0.85}
              style={[s.nextBtn, s.submitBtn]} disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={18} color="#FFF" />
                  <Text style={s.nextText}>Create Plan</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  bgGrad: { position: "absolute", top: 0, left: 0, right: 0, height: 300 },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 20, paddingTop: 58, paddingBottom: 8, gap: 14,
  },
  backBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: `${colors.primary}1A`, borderWidth: 1, borderColor: `${colors.primary}40`,
    alignItems: "center", justifyContent: "center",
  },
  headerLabel: {
    fontSize: 10, color: colors.textMuted, textTransform: "uppercase",
    letterSpacing: 2, fontWeight: "700",
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: colors.textPrimary, marginTop: 2 },
  stepCount: { fontSize: 13, fontWeight: "700", color: colors.textMuted },
  scroll: { paddingHorizontal: 20, paddingTop: 8 },

  /* Footer */
  footer: { position: "absolute", bottom: 0, left: 0, right: 0 },
  footerGrad: { position: "absolute", top: -30, left: 0, right: 0, height: 30 },
  footerInner: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingBottom: 36, paddingTop: 12,
    backgroundColor: colors.background,
  },
  prevBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 20, paddingVertical: 14, borderRadius: 14,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  prevText: { fontSize: 14, fontWeight: "600", color: colors.textSecondary },
  nextBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14,
    backgroundColor: colors.primary,
  },
  submitBtn: { backgroundColor: colors.success },
  nextText: { fontSize: 14, fontWeight: "700", color: "#FFF" },
});

export default CreatePlanScreen;
