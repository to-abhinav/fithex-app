import React, { useState } from "react";
import {
  View,
  Text,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import RazorpayCheckout from "react-native-razorpay";
import api from "../../api/axios";

export default function PaymentScreen({ route, navigation }) {
  const { plan, gym, user } = route.params;
  const [loading, setLoading] = useState(false);

  const handlePayNow = async () => {
    setLoading(true);
    try {
      // Step 1 — Ask backend to create a Razorpay order
      const { data } = await api.post("/payment/create-order", {
        planId: plan._id,
        gymId:  gym._id,
      });

      // Step 2 — Open Razorpay checkout sheet
      const options = {
        description:  `${plan.name} at ${gym.name}`,
        currency:     data.currency,
        key:          data.keyId,
        amount:       data.amount,        // paise
        order_id:     data.orderId,
        name:         "Fithex",
        prefill: {
          name:    user.name,
          email:   user.email,
          contact: user.phone || "",
        },
        theme: { color: "#6366F1" },
      };

      const paymentData = await RazorpayCheckout.open(options);

      // Step 3 — Send result to backend for verification + auto-approval
      await api.post("/payment/verify", {
        razorpay_order_id:   paymentData.razorpayOrderId,
        razorpay_payment_id: paymentData.razorpayPaymentId,
        razorpay_signature:  paymentData.razorpaySignature,
      });

      // Step 4 — Navigate to success screen
      navigation.replace("PaymentSuccess", { plan, gym });

    } catch (error) {
      // User closed the Razorpay modal — do nothing
      if (error.code === "PAYMENT_CANCELLED") return;

      Alert.alert(
        "Payment failed",
        error?.response?.data?.message || error.message || "Please try again"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>

      {/* Plan summary card */}
      <View style={styles.card}>
        <Text style={styles.gymName}>{gym.name}</Text>
        <View style={styles.divider} />
        <Row label="Plan"     value={plan.name} />
        <Row label="Category" value={plan.category} />
        <Row label="Duration" value={`${plan.durationInMonths} month(s)`} />
        <View style={styles.divider} />
        <Row label="Total" value={`₹${plan.price}`} large />
      </View>

      {/* What happens after payment */}
      <Text style={styles.note}>
        Membership activates immediately after payment. No owner approval needed.
      </Text>

      {/* Pay button */}
      <TouchableOpacity
        style={[styles.payButton, loading && styles.payButtonDisabled]}
        onPress={handlePayNow}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.payButtonText}>Pay ₹{plan.price}</Text>
        )}
      </TouchableOpacity>

    </View>
  );
}

// Small helper component for label-value rows
const Row = ({ label, value, large }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={[styles.rowValue, large && styles.rowValueLarge]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container:        { flex: 1, padding: 20, backgroundColor: "#f9f9f9" },
  card:             { backgroundColor: "#fff", borderRadius: 12, padding: 20, marginBottom: 16,
                      shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  gymName:          { fontSize: 18, fontWeight: "600", marginBottom: 12, color: "#1a1a1a" },
  divider:          { height: 1, backgroundColor: "#f0f0f0", marginVertical: 12 },
  row:              { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  rowLabel:         { fontSize: 14, color: "#666" },
  rowValue:         { fontSize: 14, color: "#1a1a1a", fontWeight: "500" },
  rowValueLarge:    { fontSize: 18, fontWeight: "700", color: "#6366F1" },
  note:             { fontSize: 13, color: "#888", textAlign: "center", marginBottom: 24, lineHeight: 18 },
  payButton:        { backgroundColor: "#6366F1", borderRadius: 12, paddingVertical: 16,
                      alignItems: "center" },
  payButtonDisabled:{ opacity: 0.6 },
  payButtonText:    { color: "#fff", fontSize: 16, fontWeight: "600" },
});