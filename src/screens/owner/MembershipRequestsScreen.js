import React, { useState, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  StatusBar, Alert, Image, ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import colors from "../../theme/colors";
import { useToast } from "../../context/ToastContext";
import { usePendingRequests } from "../../context/PendingRequestContext";
import { getGymRequests, approveRequest, rejectRequest } from "../../api/ownerService";

const SEGMENTS = ["Pending", "Approved", "Rejected"];
const SEG_COLORS = { Pending: colors.warning, Approved: colors.success, Rejected: colors.danger };
const PAY_COLORS = { Online: colors.success, Offline: "#F59E0B" };

const RequestCard = ({ item, onApprove, onReject }) => {
  const user = item.userId || {};
  const plan = item.planId || {};
  const initial = (user.name || "?").charAt(0).toUpperCase();
  const date = item.createdAt
    ? new Date(item.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "";

  return (
    <Animated.View entering={FadeInDown.duration(350)} style={s.card}>
      {/* ── Top Row: Avatar + User Info + Amount ─────────────────────── */}
      <View style={s.cardTopRow}>
        {/* Profile Image / Initial */}
        <View style={s.avatarWrap}>
          {user.profileImage ? (
            <Image source={{ uri: user.profileImage }} style={s.avatarImage} />
          ) : (
            <View style={s.avatarFallback}>
              <Text style={s.avatarText}>{initial}</Text>
            </View>
          )}
          {/* Payment mode dot */}
          <View style={[s.payModeDot, { backgroundColor: PAY_COLORS[item.paymentMode] || colors.textMuted }]} />
        </View>

        {/* Name + Contact */}
        <View style={{ flex: 1 }}>
          <Text style={s.cardName}>{user.name || "Unknown"}</Text>

          {/* Phone */}
          {user.phone ? (
            <View style={s.contactRow}>
              <Ionicons name="call-outline" size={12} color={colors.textMuted} />
              <Text style={s.contactText}>{user.phone}</Text>
            </View>
          ) : null}

          {/* Email */}
          {user.email ? (
            <View style={s.contactRow}>
              <Ionicons name="mail-outline" size={12} color={colors.textMuted} />
              <Text style={s.contactText} numberOfLines={1}>{user.email}</Text>
            </View>
          ) : null}
        </View>

        {/* Amount Badge */}
        <View style={s.amountBadge}>
          <Text style={s.amountSymbol}>₹</Text>
          <Text style={s.amountValue}>{plan.price ?? "—"}</Text>
        </View>
      </View>

      {/* Plan Payment Mode Row */}
      <View style={s.planRow}>
        <View style={s.planChip}>
          <Ionicons name="pricetag-outline" size={12} color={colors.accent} />
          <Text style={s.planText}>
            {plan.name || "—"} · {plan.durationInMonths ? `${plan.durationInMonths} mo` : "—"}
          </Text>
        </View>
        <View style={[s.payModeChip, { backgroundColor: `${PAY_COLORS[item.paymentMode] || colors.textMuted}1A` }]}>
          <Ionicons
            name={item.paymentMode === "Online" ? "card-outline" : "cash-outline"}
            size={12}
            color={PAY_COLORS[item.paymentMode] || colors.textMuted}
          />
          <Text style={[s.payModeText, { color: PAY_COLORS[item.paymentMode] || colors.textMuted }]}>
            {item.paymentMode || "—"}
          </Text>
        </View>
      </View>

      {item.note ? (
        <View style={s.noteBlock}>
          <View style={s.noteBar} />
          <View style={{ flex: 1 }}>
            <Text style={s.noteLabel}>Note from member</Text>
            <Text style={s.noteText} numberOfLines={3}>{item.note}</Text>
          </View>
        </View>
      ) : null}

      <View style={s.dateRow}>
        <Ionicons name="time-outline" size={12} color={colors.textMuted} />
        <Text style={s.cardDate}>{date}</Text>
      </View>

      {item.status !== "Pending" && (
        <View style={[s.statusBadge, { backgroundColor: `${SEG_COLORS[item.status]}1A` }]}>
          <View style={[s.statusDot, { backgroundColor: SEG_COLORS[item.status] }]} />
          <Text style={[s.statusText, { color: SEG_COLORS[item.status] }]}>{item.status}</Text>
        </View>
      )}
      {item.status === "Rejected" && item.rejectionReason ? (
        <Text style={s.rejReason}>Reason: {item.rejectionReason}</Text>
      ) : null}

      {item.status === "Pending" && (
        <View style={s.actionRow}>
          <TouchableOpacity onPress={() => onReject(item)} activeOpacity={0.8} style={[s.actionBtn, s.rejectBtn]}>
            <Ionicons name="close" size={16} color={colors.danger} />
            <Text style={[s.actionText, { color: colors.danger }]}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onApprove(item)} activeOpacity={0.8} style={[s.actionBtn, s.approveBtn]}>
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            <Text style={[s.actionText, { color: "#FFFFFF" }]}>Approve</Text>
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );
};

// Empty State
const EmptyState = ({ segment }) => (
  <View style={s.empty}>
    <View style={s.emptyIcon}>
      <Ionicons name={segment === "Pending" ? "hourglass-outline" : segment === "Approved" ? "checkmark-done-outline" : "close-circle-outline"} size={40} color={colors.textMuted} />
    </View>
    <Text style={s.emptyTitle}>No {segment.toLowerCase()} requests</Text>
    <Text style={s.emptyDesc}>{segment === "Pending" ? "All caught up! No requests waiting." : `No ${segment.toLowerCase()} requests yet.`}</Text>
  </View>
);

const MembershipRequestsScreen = () => {
  const navigation = useNavigation();
  const toast = useToast();
  const { count: pendingCount, setCount: setPendingCount } = usePendingRequests();
  const [segment, setSegment] = useState("Pending");
  const [requests, setRequests] = useState([]);
  const [segCounts, setSegCounts] = useState({ Pending: 0, Approved: 0, Rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);

  const fetchRequests = useCallback(async (seg) => {
    try {
      setLoading(true);
      const data = await getGymRequests(seg);
      setRequests(data?.requests || []);
      setSegCounts((prev) => ({ ...prev, [seg]: data?.total ?? data?.requests?.length ?? 0 }));
    } catch { setRequests([]); }
    finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => {
    fetchRequests(segment);
    SEGMENTS.forEach(async (seg) => {
      if (seg === segment) return;
      try {
        const data = await getGymRequests(seg);
        setSegCounts((prev) => ({ ...prev, [seg]: data?.total ?? data?.requests?.length ?? 0 }));
      } catch { /* ignore */ }
    });
  }, [segment]));

  const handleSegment = (seg) => { setSegment(seg); };

  const handleApprove = useCallback(async (item) => {
    Alert.alert("Approve Request", `Accept ${item.userId?.name || "this member"}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Approve", onPress: async () => {
          try {
            setActing(item._id);
            await approveRequest(item._id);
            setRequests((prev) => prev.filter((r) => r._id !== item._id));
            const newPending = Math.max(0, segCounts.Pending - 1);
            setSegCounts((prev) => ({
              ...prev,
              Pending: newPending,
              Approved: prev.Approved + 1,
            }));
            // Update shared context so tab badge updates instantly
            setPendingCount(newPending);
          } catch (e) { toast.error(e?.response?.data?.message || "Failed to approve"); }
          finally { setActing(null); }
        },
      },
    ]);
  }, [segCounts.Pending, setPendingCount]);

  const handleReject = useCallback((item) => {
    let reason = "";
    Alert.prompt ? Alert.prompt("Reject Request", "Optional reason:", [
      { text: "Cancel", style: "cancel" },
      { text: "Reject", style: "destructive", onPress: async (text) => {
        try {
          setActing(item._id);
          await rejectRequest(item._id, text);
          setRequests((prev) => prev.filter((r) => r._id !== item._id));
          const newPending = Math.max(0, segCounts.Pending - 1);
          setSegCounts((prev) => ({
            ...prev,
            Pending: newPending,
            Rejected: prev.Rejected + 1,
          }));
          setPendingCount(newPending);
        } catch (e) { toast.error(e?.response?.data?.message || "Failed to reject"); }
        finally { setActing(null); }
      }},
    ], "plain-text") : Alert.alert("Reject Request", `Reject ${item.userId?.name || "this member"}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Reject", style: "destructive", onPress: async () => {
        try {
          setActing(item._id);
          await rejectRequest(item._id, "");
          setRequests((prev) => prev.filter((r) => r._id !== item._id));
          const newPending = Math.max(0, segCounts.Pending - 1);
          setSegCounts((prev) => ({
            ...prev,
            Pending: newPending,
            Rejected: prev.Rejected + 1,
          }));
          setPendingCount(newPending);
        } catch (e) { toast.error(e?.response?.data?.message || "Failed to reject"); }
        finally { setActing(null); }
      }},
    ]);
  }, [segCounts.Pending, setPendingCount]);

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={[`${colors.info}30`, `${colors.primary}18`, "rgba(0,0,0,0)"]} locations={[0, 0.4, 1]} style={s.bgGrad} />

      {/* Header */}
      <Animated.View entering={FadeInDown.duration(500)} style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerLabel}>MEMBER MANAGEMENT</Text>
          <Text style={s.headerTitle}>Membership Requests</Text>
        </View>
      </Animated.View>

      {/* Segment Control with counts */}
      <View style={s.segRow}>
        {SEGMENTS.map((seg) => (
          <TouchableOpacity key={seg} onPress={() => handleSegment(seg)} activeOpacity={0.8}
            style={[s.segPill, segment === seg && { backgroundColor: SEG_COLORS[seg], borderColor: SEG_COLORS[seg] }]}>
            <Text style={[s.segText, segment === seg && { color: "#FFF" }]}>{seg}</Text>
            {segCounts[seg] > 0 && (
              <View style={[s.segBadge, segment === seg ? { backgroundColor: "rgba(255,255,255,0.25)" } : { backgroundColor: `${SEG_COLORS[seg]}1A` }]}>
                <Text style={[s.segBadgeText, segment === seg ? { color: "#FFF" } : { color: SEG_COLORS[seg] }]}>
                  {segCounts[seg]}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(i) => i._id}
          renderItem={({ item }) => <RequestCard item={item} onApprove={handleApprove} onReject={handleReject} />}
          ListEmptyComponent={<EmptyState segment={segment} />}
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

  // Segment control
  segRow: { flexDirection: "row", paddingHorizontal: 20, gap: 10, marginBottom: 12 },
  segPill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 18, paddingVertical: 9, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  segText: { fontSize: 13, fontWeight: "600", color: colors.textMuted },
  segBadge: { minWidth: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center", paddingHorizontal: 5 },
  segBadgeText: { fontSize: 10, fontWeight: "800" },

  list: { paddingHorizontal: 20, paddingBottom: 120 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  // ── Card 
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 16, marginBottom: 12 },

  // Top row
  cardTopRow: { flexDirection: "row", gap: 14, alignItems: "flex-start" },
  avatarWrap: { position: "relative" },
  avatarImage: { width: 52, height: 52, borderRadius: 16, borderWidth: 2, borderColor: `${colors.primary}40` },
  avatarFallback: { width: 52, height: 52, borderRadius: 16, backgroundColor: `${colors.primary}25`, borderWidth: 2, borderColor: `${colors.primary}40`, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 20, fontWeight: "800", color: colors.primary },
  payModeDot: { position: "absolute", bottom: -2, right: -2, width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: colors.surface },

  cardName: { fontSize: 16, fontWeight: "700", color: colors.textPrimary, marginBottom: 4 },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  contactText: { fontSize: 12, color: colors.textMuted, flex: 1 },

  // Amount badge
  amountBadge: { flexDirection: "row", alignItems: "baseline", backgroundColor: `${colors.success}14`, borderWidth: 1, borderColor: `${colors.success}30`, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, alignSelf: "flex-start" },
  amountSymbol: { fontSize: 12, fontWeight: "700", color: colors.success, marginRight: 1 },
  amountValue: { fontSize: 18, fontWeight: "900", color: colors.success },

  // Plan row
  planRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 14, gap: 8 },
  planChip: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: `${colors.accent}12`, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  planText: { fontSize: 12, fontWeight: "600", color: colors.accent },
  payModeChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  payModeText: { fontSize: 11, fontWeight: "700" },

  // Note block
  noteBlock: { flexDirection: "row", gap: 10, marginTop: 14, backgroundColor: `${colors.primary}0A`, borderRadius: 12, padding: 12 },
  noteBar: { width: 3, borderRadius: 2, backgroundColor: colors.primary, opacity: 0.5 },
  noteLabel: { fontSize: 10, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  noteText: { fontSize: 13, color: colors.textSecondary, lineHeight: 19 },

  // Date row
  dateRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 12 },
  cardDate: { fontSize: 11, color: colors.textMuted },

  // Status
  statusBadge: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, marginTop: 12 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: "700" },
  rejReason: { fontSize: 12, color: colors.textMuted, fontStyle: "italic", marginTop: 6 },

  // Actions
  actionRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 11, borderRadius: 12 },
  rejectBtn: { backgroundColor: `${colors.danger}14`, borderWidth: 1, borderColor: `${colors.danger}30` },
  approveBtn: { backgroundColor: colors.success },
  actionText: { fontSize: 13, fontWeight: "700" },

  // Empty
  empty: { alignItems: "center", paddingTop: 80 },
  emptyIcon: { width: 80, height: 80, borderRadius: 24, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: colors.textPrimary, marginBottom: 6 },
  emptyDesc: { fontSize: 13, color: colors.textMuted, textAlign: "center" },
});

export default MembershipRequestsScreen;
