import React, { useState, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar, ActivityIndicator, Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import colors from "../../theme/colors";
import { getGymPayments, getRevenueSummary } from "../../api/ownerService";

const fmt = (n) => {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n}`;
};

const STATUS_COLORS = { captured: colors.success, paid: colors.success, created: colors.warning, failed: colors.danger, refunded: colors.accent };

// Payment Card
const PaymentCard = ({ item }) => {
  const user = item.userId || {};
  const plan = item.planId || {};
  const initial = (user.name || "?").charAt(0).toUpperCase();
  const status = (item.status || "created").toLowerCase();
  const date = item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";

  return (
    <Animated.View entering={FadeInDown.duration(300)} style={s.card}>
      <View style={s.cardRow}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{initial}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.cardName}>{user.name || "Unknown"}</Text>
          <Text style={s.cardPlan}>{plan.name || "—"}</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={s.cardAmt}>₹{item.amount || 0}</Text>
          <View style={[s.statusPill, { backgroundColor: `${STATUS_COLORS[status] || colors.textMuted}1A` }]}>
            <View style={[s.statusDot, { backgroundColor: STATUS_COLORS[status] || colors.textMuted }]} />
            <Text style={[s.statusText, { color: STATUS_COLORS[status] || colors.textMuted }]}>{status}</Text>
          </View>
        </View>
      </View>
      <View style={s.cardFooter}>
        <Text style={s.cardDate}>{date}</Text>
        {item.razorpayPaymentId && <Text style={s.cardTxn}>#{item.razorpayPaymentId.slice(-8)}</Text>}
      </View>
    </Animated.View>
  );
};

const PaymentHistoryScreen = () => {
  const navigation = useNavigation();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revenue, setRevenue] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [payRes, revRes] = await Promise.allSettled([getGymPayments(1, 50), getRevenueSummary()]);
      setPayments(payRes.status === "fulfilled" ? (payRes.value?.payments || []) : []);
      setRevenue(revRes.status === "fulfilled" ? revRes.value : null);
    } catch { setPayments([]); }
    finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  const totalRev = revenue?.totalRevenue ?? payments.reduce((s, p) => s + (p.amount || 0), 0);
  const thisMonth = revenue?.thisMonth ?? 0;

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={[`${colors.success}28`, `${colors.primary}18`, "rgba(0,0,0,0)"]} locations={[0, 0.4, 1]} style={s.bgGrad} />

      <Animated.View entering={FadeInDown.duration(500)} style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerLabel}>PLANS & PAYMENTS</Text>
          <Text style={s.headerTitle}>Payment History</Text>
        </View>
      </Animated.View>

      {/* Revenue Stats */}
      <Animated.View entering={FadeInDown.delay(100).duration(400)} style={s.statsRow}>
        <View style={s.statCard}>
          <Ionicons name="cash-outline" size={20} color={colors.success} />
          <Text style={s.statVal}>{fmt(totalRev)}</Text>
          <Text style={s.statLabel}>Total Revenue</Text>
        </View>
        <View style={s.statCard}>
          <Ionicons name="trending-up-outline" size={20} color={colors.primary} />
          <Text style={[s.statVal, { color: colors.primary }]}>{fmt(thisMonth)}</Text>
          <Text style={s.statLabel}>This Month</Text>
        </View>
      </Animated.View>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(i) => i._id}
          renderItem={({ item }) => <PaymentCard item={item} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="card-outline" size={44} color={colors.textMuted} />
              <Text style={s.emptyTitle}>No payments yet</Text>
              <Text style={s.emptyDesc}>Payments will appear as members subscribe</Text>
            </View>
          }
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  bgGrad: { position: "absolute", top: 0, left: 0, right: 0, height: 300 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12, gap: 14 },
  backBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: `${colors.primary}1A`, borderWidth: 1, borderColor: `${colors.primary}40`, alignItems: "center", justifyContent: "center" },
  headerLabel: { fontSize: 10, color: colors.textMuted, textTransform: "uppercase", letterSpacing: 2, fontWeight: "700" },
  headerTitle: { fontSize: 22, fontWeight: "800", color: colors.textPrimary, marginTop: 2 },
  list: { paddingHorizontal: 20, paddingBottom: 120 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  // Stats
  statsRow: { flexDirection: "row", gap: 12, paddingHorizontal: 20, marginBottom: 16 },
  statCard: { flex: 1, alignItems: "center", paddingVertical: 16, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 4 },
  statVal: { fontSize: 24, fontWeight: "900", color: colors.success },
  statLabel: { fontSize: 11, fontWeight: "600", color: colors.textMuted },
  // Card
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 14, marginBottom: 10 },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 12, backgroundColor: `${colors.success}20`, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 16, fontWeight: "800", color: colors.success },
  cardName: { fontSize: 14, fontWeight: "700", color: colors.textPrimary },
  cardPlan: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  cardAmt: { fontSize: 17, fontWeight: "900", color: colors.success },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: "700", textTransform: "capitalize" },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border },
  cardDate: { fontSize: 11, color: colors.textMuted },
  cardTxn: { fontSize: 11, color: colors.textMuted, fontFamily: Platform?.OS === "ios" ? "Menlo" : "monospace" },
  // Empty
  empty: { alignItems: "center", paddingTop: 80 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: colors.textPrimary, marginTop: 12 },
  emptyDesc: { fontSize: 13, color: colors.textMuted },
});

export default PaymentHistoryScreen;
