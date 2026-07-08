import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Dimensions,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated as RNAnimated,
  Pressable,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  FadeInDown,
  FadeInUp,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  interpolate,
} from "react-native-reanimated";
import api from "../../api/axios";
import { useToast } from "../../context/ToastContext";

let RazorpayCheckout = null;
try {
  RazorpayCheckout = require("react-native-razorpay").default;
} catch (e) {
  console.warn("[Payment] react-native-razorpay not available, native checkout disabled");
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const CATEGORY_META = {
  Strength: { icon: "barbell-outline",  color: "#f87171", gradient: ["#ef4444", "#b91c1c"] },
  Cardio:   { icon: "heart-outline",    color: "#f472b6", gradient: ["#ec4899", "#9d174d"] },
  Yoga:     { icon: "body-outline",     color: "#a5b4fc", gradient: ["#6366f1", "#4338ca"] },
};

const getExpiryDate = (months) => {
  if (!months) return null;
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
};

const PulsingDot = ({ color }) => {
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(1,   { duration: 900, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: pulse.value,
    transform: [{ scale: interpolate(pulse.value, [0.3, 1], [0.7, 1]) }],
  }));
  return (
    <Animated.View
      style={[{ width: 7, height: 7, borderRadius: 4, backgroundColor: color }, style]}
    />
  );
};

const DetailRow = ({ icon, label, value, color = "rgba(255,255,255,0.4)", valueColor = "#fff" }) => (
  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" }}>
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: `${color}15`, alignItems: "center", justifyContent: "center" }}>
        <Ionicons name={icon} size={14} color={color} />
      </View>
      <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", fontWeight: "500" }}>{label}</Text>
    </View>
    <Text style={{ fontSize: 13, fontWeight: "700", color: valueColor, maxWidth: SCREEN_WIDTH * 0.45, textAlign: "right" }}>{value}</Text>
  </View>
);

const FeatureChip = ({ text, color }) => (
  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8 }}>
    <View style={{ width: 24, height: 24, borderRadius: 7, backgroundColor: `${color}18`, borderWidth: 1, borderColor: `${color}28`, alignItems: "center", justifyContent: "center" }}>
      <Ionicons name="checkmark" size={13} color={color} />
    </View>
    <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: "400", flex: 1 }}>{text}</Text>
  </View>
);

// ─── Main Screen 
export default function PaymentScreen({ route, navigation }) {
  const { plan, gym } = route.params;
  const toast   = useToast();
  const [loading, setLoading]         = useState(false);
  const [offlineLoading, setOfflineLoading] = useState(false);
  const [showMethodModal, setShowMethodModal] = useState(false);
  const [note, setNote]               = useState("");
  const [profile, setProfile]         = useState(null);
  const slideAnim = useRef(new RNAnimated.Value(400)).current;

  const catMeta    = CATEGORY_META[plan.category] || CATEGORY_META.Strength;
  const expiryDate = getExpiryDate(plan.durationInMonths);
  const features   = plan.features || [];
  const hasDiscount = plan.originalPrice && plan.discountPercent > 0;

  useEffect(() => {
    api.get("/auth/me")
      .then((res) => setProfile(res.data))
      .catch(() => {});
  }, []);

  const openMethodSheet = () => {
    setShowMethodModal(true);
    RNAnimated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const closeMethodSheet = () => {
    RNAnimated.timing(slideAnim, {
      toValue: 400,
      duration: 220,
      useNativeDriver: true,
    }).start(() => setShowMethodModal(false));
  };

  const handleOnlinePay = async () => {
    closeMethodSheet();

    if (!RazorpayCheckout) {
      toast.error(
        "Online payments require a production build. Please use 'Pay in Cash' for now, or rebuild the app with `npx expo run:android`.",
        "Native SDK Unavailable"
      );
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/payment/create-order", {
        planId: plan._id,
        gymId:  gym._id,
      });
      const options = {
        description:  `${plan.name} plan at ${gym.name}`,
        currency:     data.currency,
        key:          data.keyId,
        amount:       data.amount,
        order_id:     data.orderId,
        name:         "Fithex",
        prefill: {
          name:    profile?.name  || "",
          email:   profile?.email || "",
          contact: profile?.phone || "",
        },
        theme: { color: "#6366F1" },
      };
      const paymentData = await RazorpayCheckout.open(options);
      await api.post("/payment/verify", {
        razorpay_order_id:   paymentData.razorpay_order_id,
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_signature:  paymentData.razorpay_signature,
        gymId:               gym._id,
      });
      navigation.replace("PaymentSuccess", { plan, gym });
    } catch (error) {
      if (error?.code === "PAYMENT_CANCELLED" || error?.description === "Payment cancelled") return;

      const errorCode = error?.response?.data?.code;
      if (errorCode === "RAZORPAY_NOT_CONFIGURED") {
        toast.error(
          "This gym hasn't set up online payments yet. Please pay at the counter.",
          "Online Payments Unavailable"
        );
        return;
      }

      toast.error(error?.response?.data?.message || error?.description || error?.message || "Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOfflinePay = async () => {
    closeMethodSheet();
    setOfflineLoading(true);
    try {
      await api.post("/requests/create", {
        gymId:       gym._id,
        planId:      plan._id,
        paymentMode: "Offline",
        note:        note.trim() || undefined,
      });
      toast.success("Membership request sent! The gym owner will verify your payment.");
      navigation.navigate("Main");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to send request. Please try again.");
    } finally {
      setOfflineLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#09090f" }}>
      <StatusBar barStyle="light-content" />

      {/* ── Background gradient ── */}
      <LinearGradient
        colors={[`${catMeta.color}22`, "rgba(139,92,246,0.08)", "rgba(0,0,0,0)"]}
        locations={[0, 0.4, 1]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 320 }}
      />

      {/* ── Decorative orb ── */}
      <View style={{ position: "absolute", top: -80, right: -80, width: 260, height: 260, borderRadius: 130, backgroundColor: catMeta.color, opacity: 0.06 }} />
      <View style={{ position: "absolute", top: 200, left: -60, width: 180, height: 180, borderRadius: 90, backgroundColor: "#8b5cf6", opacity: 0.05 }} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 200 }}>

        {/* ── Top Nav ── */}
        <Animated.View
          entering={FadeInDown.delay(0).duration(400)}
          style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 54, paddingBottom: 12 }}
        >
          <TouchableOpacity
            onPress={() => { if (navigation.canGoBack()) navigation.goBack(); }}
            activeOpacity={0.8}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(9,9,15,0.75)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center", marginRight: 14 }}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View>
            <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: "600", textTransform: "uppercase", letterSpacing: 1.2 }}>Checkout</Text>
            <Text style={{ fontSize: 17, fontWeight: "800", color: "#fff", marginTop: 1 }} numberOfLines={1}>{gym.name}</Text>
          </View>
        </Animated.View>

        {/* ── Plan Hero Card ── */}
        <Animated.View entering={FadeInDown.delay(80).springify()} style={{ marginHorizontal: 20, marginBottom: 16 }}>
          <View style={{ borderRadius: 28, overflow: "hidden", borderWidth: 1, borderColor: `${catMeta.color}30` }}>
            <LinearGradient colors={["rgba(18,10,38,0.97)", "rgba(13,10,20,0.99)"]} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} />
            {/* Orb glow */}
            <View style={{ position: "absolute", top: -50, left: -50, width: 160, height: 160, borderRadius: 80, backgroundColor: catMeta.color, opacity: 0.1 }} />
            <LinearGradient colors={["rgba(255,255,255,0.05)", "transparent"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} />

            <View style={{ padding: 22 }}>
              {/* Icon + Badge row */}
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                <LinearGradient
                  colors={catMeta.gradient}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={{ width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center", shadowColor: catMeta.color, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 }}
                >
                  <Ionicons name={catMeta.icon} size={24} color="#fff" />
                </LinearGradient>

                <Animated.View entering={ZoomIn.delay(200)}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, backgroundColor: "rgba(16,185,129,0.1)", borderWidth: 1, borderColor: "rgba(16,185,129,0.25)" }}>
                    <PulsingDot color="#10b981" />
                    <Text style={{ fontSize: 10, fontWeight: "700", color: "#10b981", letterSpacing: 0.4 }}>Active Plan</Text>
                  </View>
                </Animated.View>
              </View>

              {/* Plan name */}
              <Text style={{ fontSize: 24, fontWeight: "900", color: "#fff", letterSpacing: -0.5, marginBottom: 3 }}>{plan.name} Plan</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 20 }}>
                <View style={{ backgroundColor: `${catMeta.color}15`, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Ionicons name={catMeta.icon} size={10} color={catMeta.color} />
                  <Text style={{ fontSize: 10, color: catMeta.color, fontWeight: "700" }}>{plan.category}</Text>
                </View>
                <View style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.2)" }} />
                <Ionicons name="calendar-outline" size={11} color="rgba(255,255,255,0.35)" />
                <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: "500" }}>
                  {plan.durationInMonths ? `${plan.durationInMonths} Month${plan.durationInMonths > 1 ? "s" : ""}` : "Custom"}
                </Text>
              </View>

              {/* Description */}
              {!!plan.description && (
                <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 19, marginBottom: 18 }}>{plan.description}</Text>
              )}

              {/* Price row */}
              <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
                <Text style={{ fontSize: 16, fontWeight: "600", color: "rgba(255,255,255,0.45)" }}>₹</Text>
                <Text style={{ fontSize: 40, fontWeight: "900", color: "#fff", letterSpacing: -1.5, lineHeight: 44 }}>{plan.price.toLocaleString("en-IN")}</Text>
                {plan.durationInMonths > 1 && (
                  <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", marginLeft: 2 }}>/total</Text>
                )}
              </View>

              {/* Discount row */}
              {hasDiscount && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.3)", fontWeight: "500", textDecorationLine: "line-through" }}>
                    ₹{plan.originalPrice.toLocaleString("en-IN")}
                  </Text>
                  <View style={{ backgroundColor: "rgba(16,185,129,0.15)", borderWidth: 1, borderColor: "rgba(16,185,129,0.3)", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                    <Text style={{ fontSize: 10, fontWeight: "800", color: "#10b981" }}>{plan.discountPercent}% OFF</Text>
                  </View>
                </View>
              )}

              {/* Per-month note */}
              {plan.durationInMonths > 1 && (
                <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: "500" }}>
                  ≈ ₹{Math.round(plan.price / plan.durationInMonths).toLocaleString("en-IN")}/month
                </Text>
              )}
            </View>
          </View>
        </Animated.View>

        {/* ── Plan Details ── */}
        <Animated.View entering={FadeInDown.delay(160).springify()} style={{ marginHorizontal: 20, marginBottom: 16 }}>
          <View style={{ borderRadius: 22, backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", padding: 18 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <Ionicons name="receipt-outline" size={14} color="rgba(165,180,252,0.6)" />
              <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontWeight: "700", textTransform: "uppercase", letterSpacing: 1.4 }}>Order Summary</Text>
            </View>

            <DetailRow icon="business-outline"    label="Gym"      value={gym.name}          color="#a5b4fc" />
            <DetailRow icon="ribbon-outline"       label="Plan"     value={plan.name}          color={catMeta.color} valueColor={catMeta.color} />
            <DetailRow icon={catMeta.icon}         label="Category" value={plan.category}      color={catMeta.color} />
            <DetailRow
              icon="calendar-outline"
              label="Duration"
              value={plan.durationInMonths ? `${plan.durationInMonths} Month${plan.durationInMonths > 1 ? "s" : ""}` : "Custom"}
              color="#34d399"
            />
            {expiryDate && (
              <DetailRow
                icon="hourglass-outline"
                label="Expires On"
                value={expiryDate}
                color="#fbbf24"
                valueColor="#fbbf24"
              />
            )}
            <DetailRow
              icon="pricetag-outline"
              label="Amount Due"
              value={`₹${plan.price.toLocaleString("en-IN")}`}
              color="#10b981"
              valueColor="#10b981"
            />
          </View>
        </Animated.View>

        {/* ── Features ── */}
        {features.length > 0 && (
          <Animated.View entering={FadeInDown.delay(220).springify()} style={{ marginHorizontal: 20, marginBottom: 16 }}>
            <View style={{ borderRadius: 22, backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", padding: 18 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Ionicons name="sparkles-outline" size={14} color="rgba(165,180,252,0.6)" />
                <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontWeight: "700", textTransform: "uppercase", letterSpacing: 1.4 }}>What's Included</Text>
              </View>
              {features.map((feat, i) => (
                <FeatureChip key={i} text={feat} color={catMeta.color} />
              ))}
            </View>
          </Animated.View>
        )}

        {/* ── Secure Payment Note ── */}
        <Animated.View entering={FadeInUp.delay(280).springify()} style={{ marginHorizontal: 20, marginBottom: 20 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 14, backgroundColor: "rgba(16,185,129,0.06)", borderWidth: 1, borderColor: "rgba(16,185,129,0.12)" }}>
            <Ionicons name="lock-closed-outline" size={13} color="#34d399" />
            <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: "500" }}>
              Online payments secured by <Text style={{ color: "#34d399", fontWeight: "700" }}>Razorpay</Text>
            </Text>
          </View>
        </Animated.View>

      </ScrollView>

      <Animated.View
        entering={FadeInUp.delay(300).springify()}
        style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          paddingHorizontal: 20, paddingBottom: 36, paddingTop: 16,
          backgroundColor: "rgba(9,9,15,0.96)",
          borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", fontWeight: "500" }}>Total payable</Text>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 2 }}>
            {hasDiscount && (
              <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.25)", textDecorationLine: "line-through", marginRight: 6 }}>
                ₹{plan.originalPrice?.toLocaleString("en-IN")}
              </Text>
            )}
            <Text style={{ fontSize: 22, fontWeight: "900", color: "#fff", letterSpacing: -0.5 }}>₹{plan.price.toLocaleString("en-IN")}</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={openMethodSheet}
          disabled={loading || offlineLoading}
          activeOpacity={0.88}
          style={{ borderRadius: 18, overflow: "hidden", opacity: (loading || offlineLoading) ? 0.7 : 1 }}
        >
          <LinearGradient
            colors={(loading || offlineLoading) ? ["#374151", "#374151"] : [catMeta.gradient[0], catMeta.gradient[1], "#6366f1"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 17 }}
          >
            {(loading || offlineLoading) ? (
              <>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>Processing…</Text>
              </>
            ) : (
              <>
                <Ionicons name="flash" size={18} color="#fff" />
                <Text style={{ fontSize: 16, fontWeight: "800", color: "#fff", letterSpacing: 0.2 }}>
                  Pay ₹{plan.price.toLocaleString("en-IN")}
                </Text>
                <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="arrow-forward" size={13} color="#fff" />
                </View>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <Modal transparent visible={showMethodModal} animationType="none" onRequestClose={closeMethodSheet}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
          >
            <Pressable
              style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}
              onPress={closeMethodSheet}
            >
              <Pressable onPress={() => {}}>
                <RNAnimated.View style={[
                  { backgroundColor: "#111118", borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40, borderTopWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
                  { transform: [{ translateY: slideAnim }] },
                ]}>
                <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.15)", alignSelf: "center", marginBottom: 22 }} />

                <Text style={{ fontSize: 18, fontWeight: "800", color: "#fff", marginBottom: 6, letterSpacing: -0.3 }}>Choose Payment Method</Text>
                <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 24, fontWeight: "400" }}>How would you like to pay for this plan?</Text>

                <View
                  style={{
                    backgroundColor: "rgba(255,255,255,0.04)",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.1)",
                    borderRadius: 16,
                    padding: 14,
                    marginBottom: 20,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 10 }}>
                    <View style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: "rgba(99,102,241,0.15)", alignItems: "center", justifyContent: "center" }}>
                      <Ionicons name="chatbubble-ellipses-outline" size={13} color="#a5b4fc" />
                    </View>
                    <Text style={{ fontSize: 12, fontWeight: "700", color: "rgba(255,255,255,0.6)", letterSpacing: 0.2 }}>
                      Message to gym owner
                    </Text>
                    <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontWeight: "500", marginLeft: "auto" }}>Optional</Text>
                  </View>
                  <TextInput
                    value={note}
                    onChangeText={setNote}
                    placeholder="e.g. I'll pay at the desk on Monday morning..."
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    multiline
                    numberOfLines={3}
                    maxLength={300}
                    style={{
                      color: "#fff",
                      fontSize: 13,
                      lineHeight: 20,
                      minHeight: 64,
                      textAlignVertical: "top",
                      fontWeight: "400",
                    }}
                  />
                  <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", textAlign: "right", marginTop: 6 }}>
                    {note.length}/300
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={handleOnlinePay}
                  activeOpacity={0.85}
                  style={{ borderRadius: 18, overflow: "hidden", marginBottom: 12 }}
                >
                  <LinearGradient
                    colors={[catMeta.gradient[0], catMeta.gradient[1], "#6366f1"]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 18, paddingHorizontal: 20 }}
                  >
                    <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" }}>
                      <Ionicons name="card-outline" size={20} color="#fff" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: "800", color: "#fff" }}>Pay Online</Text>
                      <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 2, fontWeight: "400" }}>Secured by Razorpay · Instant activation</Text>
                    </View>
                    <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.7)" />
                  </LinearGradient>
                </TouchableOpacity>

                {/* Offline Option */}
                <TouchableOpacity
                  onPress={handleOfflinePay}
                  activeOpacity={0.85}
                  style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 18, paddingHorizontal: 20, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" }}
                >
                  <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: "rgba(245,158,11,0.12)", borderWidth: 1, borderColor: "rgba(245,158,11,0.2)", alignItems: "center", justifyContent: "center" }}>
                    <Ionicons name="cash-outline" size={20} color="#f59e0b" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: "800", color: "#fff" }}>Pay in Cash</Text>
                    <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 2, fontWeight: "400" }}>Pay at gym · Pending owner approval</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.35)" />
                </TouchableOpacity>

              </RNAnimated.View>
              </Pressable>
            </Pressable>
          </KeyboardAvoidingView>
        </Modal>
      </Animated.View>
    </View>
  );
}