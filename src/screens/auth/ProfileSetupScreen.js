import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { useAuth } from "../../context/AuthContext";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  withSpring,
  FadeInDown,
  FadeInUp,
  Easing,
  interpolate,
} from "react-native-reanimated";
import api from "../../api/axios";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Glow Orb ─────────────────────────────────────────────────────────────────
const GlowOrb = ({ size, color, top, left, delay = 0 }) => {
  const pulse = useSharedValue(0.3);

  useEffect(() => {
    pulse.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.6, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: 3000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: pulse.value,
    transform: [{ scale: interpolate(pulse.value, [0.3, 0.6], [0.95, 1.05]) }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          top,
          left,
        },
        style,
      ]}
    />
  );
};

// ─── Border Beam ──────────────────────────────────────────────────────────────
const BorderBeam = () => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 4000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const topBeam = useAnimatedStyle(() => ({
    left: `${interpolate(progress.value, [0, 1], [-50, 100])}%`,
    opacity: interpolate(progress.value, [0, 0.3, 0.7, 1], [0.2, 0.7, 0.7, 0.2]),
  }));

  return (
    <View
      style={{
        position: "absolute",
        top: -0.5,
        left: -0.5,
        right: -0.5,
        bottom: -0.5,
        borderRadius: 24,
        overflow: "hidden",
      }}
      pointerEvents="none"
    >
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 0,
            width: "40%",
            height: 1.5,
            backgroundColor: "rgba(52,211,153,0.6)",
          },
          topBeam,
        ]}
      />
    </View>
  );
};

// ─── Section Label ─────────────────────────────────────────────────────────────
const SectionLabel = ({ label, icon }) => (
  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10, marginTop: 4 }}>
    <Ionicons name={icon} size={13} color="rgba(52,211,153,0.7)" />
    <Text style={{ fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,0.35)", letterSpacing: 1.2, textTransform: "uppercase" }}>
      {label}
    </Text>
  </View>
);

// ─── Styled Text Input ─────────────────────────────────────────────────────────
const FieldInput = ({ placeholder, value, onChangeText, keyboardType = "default", suffix }) => {
  const [focused, setFocused] = useState(false);
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 12,
        borderWidth: focused ? 1.5 : 1,
        borderColor: focused ? "rgba(52,211,153,0.5)" : "rgba(255,255,255,0.08)",
        backgroundColor: focused ? "rgba(52,211,153,0.06)" : "rgba(255,255,255,0.03)",
        paddingHorizontal: 14,
        height: 48,
        marginBottom: 12,
      }}
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.2)"
        keyboardType={keyboardType}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{ flex: 1, color: "#fff", fontSize: 15, fontWeight: "500" }}
      />
      {suffix ? (
        <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontWeight: "600" }}>{suffix}</Text>
      ) : null}
    </View>
  );
};

// ─── Chip Selector ─────────────────────────────────────────────────────────────
const ChipSelector = ({ options, selected, onSelect, activeColor }) => (
  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
    {options.map((opt) => {
      const isSelected = selected === opt.value;
      return (
        <TouchableOpacity
          key={opt.value}
          onPress={() => onSelect(opt.value)}
          activeOpacity={0.8}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingHorizontal: 14,
            paddingVertical: 9,
            borderRadius: 999,
            borderWidth: isSelected ? 1.5 : 1,
            borderColor: isSelected ? activeColor : "rgba(255,255,255,0.08)",
            backgroundColor: isSelected ? `${activeColor}18` : "rgba(255,255,255,0.04)",
          }}
        >
          {opt.icon && (
            <Ionicons name={opt.icon} size={14} color={isSelected ? activeColor : "rgba(255,255,255,0.3)"} />
          )}
          <Text
            style={{
              fontSize: 13,
              fontWeight: "600",
              color: isSelected ? "#fff" : "rgba(255,255,255,0.35)",
            }}
          >
            {opt.label}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

// ─── Goal Tile (Premium Full-Width) ────────────────────────────────────────────
const GoalTile = ({ icon, label, description, value, selected, onPress, gradientColors, index }) => {
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const checkScale = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(selected ? 1.02 : 1, { damping: 14, stiffness: 160 });
    glowOpacity.value = withTiming(selected ? 1 : 0, { duration: 350, easing: Easing.out(Easing.ease) });
    checkScale.value = withSpring(selected ? 1 : 0, { damping: 12, stiffness: 200 });
  }, [selected]);

  const cardAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkScale.value,
  }));

  return (
    <TouchableOpacity onPress={() => onPress(value)} activeOpacity={0.85}>
      <Animated.View
        entering={FadeInDown.delay(350 + index * 80).springify()}
        style={[
          {
            borderRadius: 18,
            overflow: "hidden",
            marginBottom: 10,
          },
          cardAnimStyle,
        ]}
      >
        {/* Outer glow ring on selection */}
        <Animated.View
          style={[
            {
              position: "absolute",
              top: -1,
              left: -1,
              right: -1,
              bottom: -1,
              borderRadius: 19,
              borderWidth: 1.5,
              borderColor: gradientColors[0] + "90",
            },
            glowStyle,
          ]}
          pointerEvents="none"
        />

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            borderRadius: 18,
            borderWidth: 1,
            borderColor: selected ? gradientColors[0] + "50" : "rgba(255,255,255,0.06)",
            backgroundColor: selected ? gradientColors[0] + "10" : "rgba(255,255,255,0.03)",
            padding: 0,
            overflow: "hidden",
          }}
        >
          {/* Left gradient accent stripe */}
          <LinearGradient
            colors={selected ? gradientColors : ["rgba(255,255,255,0.06)", "rgba(255,255,255,0.03)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{
              width: 4,
              alignSelf: "stretch",
            }}
          />

          {/* Icon container */}
          <View style={{ paddingLeft: 14, paddingVertical: 16 }}>
            <LinearGradient
              colors={selected ? gradientColors : ["rgba(255,255,255,0.07)", "rgba(255,255,255,0.03)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons
                name={icon}
                size={22}
                color={selected ? "#fff" : "rgba(255,255,255,0.35)"}
              />
            </LinearGradient>
          </View>

          {/* Text content */}
          <View style={{ flex: 1, paddingHorizontal: 14, paddingVertical: 16 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "700",
                color: selected ? "#fff" : "rgba(255,255,255,0.5)",
                letterSpacing: 0.2,
              }}
            >
              {label}
            </Text>
            <Text
              style={{
                fontSize: 11,
                fontWeight: "500",
                color: selected ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.2)",
                marginTop: 3,
                lineHeight: 16,
              }}
            >
              {description}
            </Text>
          </View>

          {/* Check indicator */}
          <View style={{ paddingRight: 16 }}>
            <Animated.View
              style={[
                {
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  borderWidth: selected ? 0 : 1.5,
                  borderColor: "rgba(255,255,255,0.1)",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                },
                !selected && { backgroundColor: "rgba(255,255,255,0.03)" },
              ]}
            >
              {selected ? (
                <Animated.View style={checkStyle}>
                  <LinearGradient
                    colors={gradientColors}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  </LinearGradient>
                </Animated.View>
              ) : null}
            </Animated.View>
          </View>
        </View>

        {/* Bottom glow bleed on selection */}
        <Animated.View
          style={[
            {
              position: "absolute",
              bottom: 0,
              left: 20,
              right: 20,
              height: 1,
              backgroundColor: gradientColors[0],
              borderRadius: 1,
            },
            glowStyle,
          ]}
          pointerEvents="none"
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

// ─── Data ──────────────────────────────────────────────────────────────────────
const GENDER_OPTIONS = [
  { value: "male",   label: "Male",   icon: "male-outline"   },
  { value: "female", label: "Female", icon: "female-outline" },
  { value: "other",  label: "Other",  icon: "ellipsis-horizontal-outline" },
];

const FITNESS_GOALS = [
  { value: "lose_weight",           label: "Lose Weight",           description: "Burn fat & get lean with structured cardio",       icon: "trending-down-outline",    gradientColors: ["#f43f5e", "#e11d48"] },
  { value: "gain_muscle",           label: "Gain Muscle",           description: "Build strength with progressive overload",         icon: "barbell-outline",          gradientColors: ["#f59e0b", "#d97706"] },
  { value: "maintain_fitness",      label: "Maintain Fitness",      description: "Stay in shape with balanced routines",             icon: "shield-checkmark-outline", gradientColors: ["#34d399", "#059669"] },
  { value: "improve_endurance",     label: "Improve Endurance",     description: "Boost stamina for peak performance",               icon: "pulse-outline",            gradientColors: ["#6366f1", "#8b5cf6"] },
  { value: "increase_flexibility",  label: "Increase Flexibility",  description: "Enhance mobility & prevent injuries",              icon: "body-outline",             gradientColors: ["#06b6d4", "#0891b2"] },
];

// ─── Progress Steps ────────────────────────────────────────────────────────────
const StepDots = ({ step, total }) => (
  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, justifyContent: "center", marginTop: 20 }}>
    {Array.from({ length: total }).map((_, i) => (
      <View
        key={i}
        style={{
          width: i === step ? 32 : 8,
          height: 4,
          borderRadius: 2,
          backgroundColor: i < step
            ? "rgba(52,211,153,0.7)"
            : i === step
            ? "#34d399"
            : "rgba(255,255,255,0.08)",
        }}
      />
    ))}
    <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginLeft: 8, fontWeight: "500" }}>
      Step {step + 1} of {total}
    </Text>
  </View>
);

//  Profile Setup Screen 
const ProfileSetupScreen = ({ navigation, route }) => {
  const { signIn } = useAuth();
  const token = route?.params?.token;

  const [step, setStep] = useState(0); // 0 = basics, 1 = goals
  const [loading, setLoading] = useState(false);

 
  useEffect(() => {
    if (token) {
      SecureStore.setItemAsync("token", token).catch(() => {});
    }
  }, [token]);

  //  Form state 
  const [age, setAge]               = useState("");
  const [gender, setGender]         = useState(null);
  const [heightCm, setHeightCm]     = useState("");
  const [weight, setWeight]         = useState("");
  const [goalWeight, setGoalWeight] = useState("");
  const [fitnessGoal, setFitnessGoal]           = useState(null);
  const [numberOfWorkoutDay, setNumberOfWorkoutDay] = useState(3);
  const [preferredVisitTime, setPreferredVisitTime] = useState(null);

  //  Step 1 validation 
  const step0Valid =
    age.trim() !== "" &&
    parseInt(age, 10) >= 10 &&
    parseInt(age, 10) <= 100 &&
    gender !== null &&
    heightCm.trim() !== "" &&
    weight.trim() !== "" &&
    goalWeight.trim() !== "";

  // ── Step 2 validation ────────────────────────────────────────
  const step1Valid = fitnessGoal !== null && preferredVisitTime !== null;

  const handleNext = () => {
    if (step === 0 && !step0Valid) {
      Alert.alert("Incomplete", "Please fill in all fields correctly before continuing.");
      return;
    }
    setStep(1);
  };

  const handleSubmit = async () => {
    if (!step1Valid) {
      Alert.alert("Incomplete", "Please select your fitness goal and activity level.");
      return;
    }

    setLoading(true);
    try {
      await api.put("/users/profile", {
        age: parseInt(age, 10),
        gender,
        heightCm: parseFloat(heightCm),
        weight: parseFloat(weight),
        goalWeight: parseFloat(goalWeight),
        fitnessGoal,
        numberOfWorkoutDay,
        preferredVisitTime,
      });
      await signIn(token);
      Alert.alert("All Set! 🎉", "Your fitness profile is ready. Let's get started!");
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Failed to save profile.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <StatusBar barStyle="light-content" />

      {/* ── Background gradient */}
      <LinearGradient
        colors={["rgba(52,211,153,0.25)", "rgba(16,185,129,0.15)", "rgba(0,0,0,1)"]}
        locations={[0, 0.4, 1]}
        style={{ position: "absolute", inset: 0 }}
      />

      {/* ── Glow orbs */}
      <GlowOrb size={260} color="rgba(52,211,153,0.12)" top={-50} left={SCREEN_WIDTH / 2 - 130} delay={0} />
      <GlowOrb size={200} color="rgba(16,185,129,0.10)" top={150} left={-70} delay={1200} />
      <GlowOrb size={160} color="rgba(6,182,212,0.08)"  top={520} left={SCREEN_WIDTH - 90} delay={2400} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 60, paddingBottom: 48 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
\          <Animated.View entering={FadeInDown.delay(100).springify()}>
            {step === 1 ? (
              <TouchableOpacity
                onPress={() => setStep(0)}
                style={{
                  width: 36, height: 36,
                  backgroundColor: "rgba(255,255,255,0.06)",
                  borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
                  borderRadius: 12, alignItems: "center", justifyContent: "center",
                  marginBottom: 24,
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-back" size={18} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 36, height: 36, marginBottom: 24 }} />
            )}
          </Animated.View>

          {/* ── Glass card */}
          <Animated.View entering={FadeInUp.delay(200).duration(800).springify()} style={{ position: "relative" }}>
            <BorderBeam />

            <View
              style={{
                position: "absolute", top: -0.5, left: -0.5, right: -0.5, bottom: -0.5,
                borderRadius: 24, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
              }}
            />

            <View
              style={{
                borderRadius: 24, padding: 24,
                borderWidth: 1, borderColor: "rgba(255,255,255,0.05)",
                overflow: "hidden", backgroundColor: "rgba(0,0,0,0.5)",
              }}
            >
              {/* ── Header */}
              <Animated.View entering={FadeInDown.delay(300).springify()} style={{ alignItems: "center", marginBottom: 24 }}>
                <LinearGradient
                  colors={["#34d399", "#059669"]}
                  style={{
                    width: 56, height: 56, borderRadius: 18,
                    alignItems: "center", justifyContent: "center", marginBottom: 14,
                  }}
                >
                  <Ionicons name={step === 0 ? "person-outline" : "trophy-outline"} size={26} color="#fff" />
                </LinearGradient>

                <Text style={{ fontSize: 22, fontWeight: "700", color: "#fff", letterSpacing: -0.5 }}>
                  {step === 0 ? "Your Body Stats" : "Your Goals"}
                </Text>
                <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 6, textAlign: "center", lineHeight: 20 }}>
                  {step === 0
                    ? "Help us personalize your experience.\nThis takes less than a minute."
                    : "Tell us what you want to achieve\nso we can tailor your plan."}
                </Text>
              </Animated.View>

              {step === 0 && (
                <>
                  <Animated.View entering={FadeInDown.delay(350).springify()}>
                    <SectionLabel label="Age" icon="calendar-outline" />
                    <FieldInput
                      placeholder="e.g. 25"
                      value={age}
                      onChangeText={setAge}
                      keyboardType="number-pad"
                      suffix="yrs"
                    />
                  </Animated.View>

                  <Animated.View entering={FadeInDown.delay(400).springify()}>
                    <SectionLabel label="Gender" icon="male-female-outline" />
                    <ChipSelector
                      options={GENDER_OPTIONS}
                      selected={gender}
                      onSelect={setGender}
                      activeColor="#34d399"
                    />
                  </Animated.View>

                  <Animated.View entering={FadeInDown.delay(450).springify()}>
                    <SectionLabel label="Height" icon="resize-outline" />
                    <FieldInput
                      placeholder="e.g. 175"
                      value={heightCm}
                      onChangeText={setHeightCm}
                      keyboardType="decimal-pad"
                      suffix="cm"
                    />
                  </Animated.View>

                  <Animated.View entering={FadeInDown.delay(500).springify()}>
                    <SectionLabel label="Current Weight" icon="barbell-outline" />
                    <FieldInput
                      placeholder="e.g. 72"
                      value={weight}
                      onChangeText={setWeight}
                      keyboardType="decimal-pad"
                      suffix="kg"
                    />
                  </Animated.View>

                  <Animated.View entering={FadeInDown.delay(550).springify()}>
                    <SectionLabel label="Goal Weight" icon="trending-up-outline" />
                    <FieldInput
                      placeholder="e.g. 65"
                      value={goalWeight}
                      onChangeText={setGoalWeight}
                      keyboardType="decimal-pad"
                      suffix="kg"
                    />
                  </Animated.View>

                  {/* ── Continue button */}
                  <Animated.View entering={FadeInDown.delay(600).springify()} style={{ marginTop: 4 }}>
                    <TouchableOpacity activeOpacity={0.85} onPress={handleNext} disabled={!step0Valid}>
                      <View style={{ borderRadius: 14, overflow: "hidden" }}>
                        <LinearGradient
                          colors={step0Valid ? ["#34d399", "#059669"] : ["rgba(52,211,153,0.25)", "rgba(5,150,105,0.25)"]}
                          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                          style={{ paddingVertical: 14, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 }}
                        >
                          <Text style={{ fontSize: 15, fontWeight: "700", color: step0Valid ? "#000" : "rgba(255,255,255,0.25)", letterSpacing: 0.3 }}>
                            Continue
                          </Text>
                          {step0Valid && <Ionicons name="arrow-forward" size={16} color="#000" />}
                        </LinearGradient>
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                </>
              )}

              {/* ── STEP 1: Goals ──────────────────────────────────────── */}
              {step === 1 && (
                <>
                  <Animated.View entering={FadeInDown.delay(350).springify()}>
                    <SectionLabel label="Fitness Goal" icon="trophy-outline" />
                    <View style={{ marginBottom: 12 }}>
                      {FITNESS_GOALS.map((goal, idx) => (
                        <GoalTile
                          key={goal.value}
                          icon={goal.icon}
                          label={goal.label}
                          description={goal.description}
                          value={goal.value}
                          selected={fitnessGoal === goal.value}
                          onPress={setFitnessGoal}
                          gradientColors={goal.gradientColors}
                          index={idx}
                        />
                      ))}
                    </View>
                  </Animated.View>

                  <Animated.View entering={FadeInDown.delay(450).springify()}>
                    <SectionLabel label="Workout Days / Week" icon="calendar-outline" />
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 16 }}>
                      <TouchableOpacity
                        onPress={() => setNumberOfWorkoutDay(Math.max(0, numberOfWorkoutDay - 1))}
                        activeOpacity={0.7}
                        style={{
                          width: 44, height: 44, borderRadius: 14,
                          backgroundColor: "rgba(255,255,255,0.06)",
                          borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
                          alignItems: "center", justifyContent: "center",
                        }}
                      >
                        <Ionicons name="remove" size={20} color="rgba(255,255,255,0.6)" />
                      </TouchableOpacity>

                      <View style={{ alignItems: "center", gap: 2 }}>
                        <Text style={{ fontSize: 36, fontWeight: "900", color: "#34d399", letterSpacing: -1 }}>
                          {numberOfWorkoutDay}
                        </Text>
                        <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: "600" }}>
                          days per week
                        </Text>
                      </View>

                      <TouchableOpacity
                        onPress={() => setNumberOfWorkoutDay(Math.min(7, numberOfWorkoutDay + 1))}
                        activeOpacity={0.7}
                        style={{
                          width: 44, height: 44, borderRadius: 14,
                          backgroundColor: "rgba(52,211,153,0.12)",
                          borderWidth: 1, borderColor: "rgba(52,211,153,0.3)",
                          alignItems: "center", justifyContent: "center",
                        }}
                      >
                        <Ionicons name="add" size={20} color="#34d399" />
                      </TouchableOpacity>
                    </View>

                    {/* Day dots visual */}
                    <View style={{ flexDirection: "row", gap: 6, justifyContent: "center", marginBottom: 16 }}>
                      {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                        <View
                          key={d}
                          style={{
                            width: 32, height: 6, borderRadius: 3,
                            backgroundColor: d < numberOfWorkoutDay
                              ? "#34d399"
                              : "rgba(255,255,255,0.08)",
                          }}
                        />
                      ))}
                    </View>
                  </Animated.View>

                  <Animated.View entering={FadeInDown.delay(550).springify()}>
                    <SectionLabel label="Preferred Visit Time" icon="time-outline" />
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                      <View style={{ flexDirection: "row", gap: 8, paddingRight: 8 }}>
                        {[
                          { value: 5,  label: "5 AM",  icon: "partly-sunny-outline" },
                          { value: 6,  label: "6 AM",  icon: "sunny-outline" },
                          { value: 7,  label: "7 AM",  icon: "sunny-outline" },
                          { value: 8,  label: "8 AM",  icon: "sunny-outline" },
                          { value: 9,  label: "9 AM",  icon: "sunny-outline" },
                          { value: 10, label: "10 AM", icon: "sunny-outline" },
                          { value: 16, label: "4 PM",  icon: "partly-sunny-outline" },
                          { value: 17, label: "5 PM",  icon: "partly-sunny-outline" },
                          { value: 18, label: "6 PM",  icon: "moon-outline" },
                          { value: 19, label: "7 PM",  icon: "moon-outline" },
                          { value: 20, label: "8 PM",  icon: "moon-outline" },
                          { value: 21, label: "9 PM",  icon: "moon-outline" },
                        ].map((t) => {
                          const isSelected = preferredVisitTime === t.value;
                          return (
                            <TouchableOpacity
                              key={t.value}
                              onPress={() => setPreferredVisitTime(t.value)}
                              activeOpacity={0.8}
                              style={{
                                paddingHorizontal: 14, paddingVertical: 10,
                                borderRadius: 14, alignItems: "center", gap: 4,
                                borderWidth: isSelected ? 1.5 : 1,
                                borderColor: isSelected ? "rgba(52,211,153,0.6)" : "rgba(255,255,255,0.08)",
                                backgroundColor: isSelected ? "rgba(52,211,153,0.12)" : "rgba(255,255,255,0.04)",
                                minWidth: 64,
                              }}
                            >
                              <Ionicons
                                name={t.icon}
                                size={16}
                                color={isSelected ? "#34d399" : "rgba(255,255,255,0.3)"}
                              />
                              <Text style={{
                                fontSize: 12, fontWeight: "700",
                                color: isSelected ? "#fff" : "rgba(255,255,255,0.35)",
                              }}>
                                {t.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </ScrollView>
                  </Animated.View>

                  {/* ── Submit button */}
                  <Animated.View entering={FadeInDown.delay(550).springify()} style={{ marginTop: 4 }}>
                    <TouchableOpacity activeOpacity={0.85} onPress={handleSubmit} disabled={!step1Valid || loading}>
                      <View style={{ borderRadius: 14, overflow: "hidden" }}>
                        <LinearGradient
                          colors={step1Valid ? ["#34d399", "#059669"] : ["rgba(52,211,153,0.25)", "rgba(5,150,105,0.25)"]}
                          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                          style={{ paddingVertical: 14, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 }}
                        >
                          {loading ? (
                            <ActivityIndicator color="#000" size="small" />
                          ) : (
                            <>
                              <Text style={{ fontSize: 15, fontWeight: "700", color: step1Valid ? "#000" : "rgba(255,255,255,0.25)", letterSpacing: 0.3 }}>
                                Complete Setup
                              </Text>
                              {step1Valid && <Ionicons name="checkmark-circle" size={16} color="#000" />}
                            </>
                          )}
                        </LinearGradient>
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                </>
              )}

              {/* ── Step indicator */}
              <StepDots step={step} total={2} />
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default ProfileSetupScreen;
