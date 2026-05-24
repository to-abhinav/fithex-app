import React, { useState, useCallback, useEffect } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar,
  TextInput, ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import colors from "../../theme/colors";
import { useToast } from "../../context/ToastContext";
import { getGymReviews, replyToReview } from "../../api/ownerService";
import { getMyGym } from "../../api/gymService";

// ─── Star Row 
const Stars = ({ rating }) => (
  <View style={s.starRow}>
    {[1, 2, 3, 4, 5].map((i) => (
      <Ionicons key={i} name={i <= rating ? "star" : "star-outline"} size={14} color={i <= rating ? "#F59E0B" : colors.textMuted} />
    ))}
  </View>
);

// ─── Review Card 
const ReviewCard = ({ item, gymId, onReplied }) => {
  const toast = useToast();
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const user = item.userId || {};
  const date = item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";

  const handleReply = async () => {
    if (!replyText.trim()) return;
    try {
      setSending(true);
      await replyToReview(gymId, item._id, replyText.trim());
      setReplying(false); setReplyText("");
      onReplied();
    } catch (e) { toast.error(e?.response?.data?.message || "Failed to reply"); }
    finally { setSending(false); }
  };

  return (
    <Animated.View entering={FadeInDown.duration(350)} style={s.card}>
      <View style={s.cardTop}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{(user.name || "?").charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={s.nameRow}>
            <Text style={s.userName}>{user.name || "Anonymous"}</Text>
            {item.isVerifiedMember && (
              <View style={s.verBadge}>
                <Ionicons name="shield-checkmark" size={10} color={colors.success} />
                <Text style={s.verText}>Verified</Text>
              </View>
            )}
          </View>
          <Stars rating={item.rating} />
        </View>
        <Text style={s.dateText}>{date}</Text>
      </View>

      {item.title ? <Text style={s.reviewTitle}>{item.title}</Text> : null}
      {item.comment ? <Text style={s.reviewComment}>{item.comment}</Text> : null}

      {/* Owner Reply */}
      {item.ownerReply?.text ? (
        <View style={s.replyBox}>
          <View style={s.replyHeader}>
            <Ionicons name="return-down-forward" size={14} color={colors.primary} />
            <Text style={s.replyLabel}>Your Reply</Text>
          </View>
          <Text style={s.replyText}>{item.ownerReply.text}</Text>
        </View>
      ) : replying ? (
        <View style={s.replyInput}>
          <TextInput
            style={s.replyField}
            value={replyText} onChangeText={setReplyText}
            placeholder="Write your reply..." placeholderTextColor={colors.textMuted}
            multiline
          />
          <View style={s.replyActions}>
            <TouchableOpacity onPress={() => setReplying(false)}>
              <Text style={s.replyCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleReply} activeOpacity={0.85} style={s.replySendBtn} disabled={sending}>
              {sending ? <ActivityIndicator color="#FFF" size="small" /> : (
                <><Ionicons name="send" size={14} color="#FFF" /><Text style={s.replySendText}>Reply</Text></>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity onPress={() => setReplying(true)} style={s.replyBtn}>
          <Ionicons name="chatbubble-outline" size={14} color={colors.primary} />
          <Text style={s.replyBtnText}>Reply</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const ReviewsScreen = () => {
  const navigation = useNavigation();
  const [gymId, setGymId] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ avg: 0, total: 0 });

  const fetchGym = useCallback(async () => {
    try { const d = await getMyGym(); const gym = d?.gym || d; setGymId(gym?._id || null); return gym?._id; }
    catch { return null; }
  }, []);

  const fetchReviews = useCallback(async (gId) => {
    if (!gId) return;
    try {
      setLoading(true);
      const d = await getGymReviews(gId, 1, 50);
      setReviews(d?.reviews || []);
      setStats({ avg: d?.averageRating || 0, total: d?.totalReviews || d?.reviews?.length || 0 });
    } catch { setReviews([]); }
    finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => {
    const load = async () => { const gId = await fetchGym(); if (gId) fetchReviews(gId); else setLoading(false); };
    load();
  }, []));

  const handleReplied = () => { if (gymId) fetchReviews(gymId); };

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={[`${colors.warning}28`, `${colors.primary}18`, "rgba(0,0,0,0)"]} locations={[0, 0.4, 1]} style={s.bgGrad} />

      <Animated.View entering={FadeInDown.duration(500)} style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerLabel}>COMMUNICATION</Text>
          <Text style={s.headerTitle}>Reviews & Replies</Text>
        </View>
      </Animated.View>

      {/* Stats bar */}
      {stats.total > 0 && (
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={s.statsBar}>
          <View style={s.statItem}>
            <Ionicons name="star" size={18} color="#F59E0B" />
            <Text style={s.statVal}>{stats.avg.toFixed(1)}</Text>
          </View>
          <Text style={s.statDiv}>·</Text>
          <Text style={s.statLabel}>{stats.total} review{stats.total !== 1 ? "s" : ""}</Text>
        </Animated.View>
      )}

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(i) => i._id}
          renderItem={({ item }) => <ReviewCard item={item} gymId={gymId} onReplied={handleReplied} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="star-outline" size={44} color={colors.textMuted} />
              <Text style={s.emptyTitle}>No reviews yet</Text>
              <Text style={s.emptyDesc}>Members haven't reviewed your gym</Text>
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
  // Stats bar
  statsBar: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 24, marginBottom: 12 },
  statItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  statVal: { fontSize: 18, fontWeight: "900", color: colors.textPrimary },
  statDiv: { fontSize: 18, color: colors.textMuted },
  statLabel: { fontSize: 13, fontWeight: "500", color: colors.textMuted },
  // Card
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 16, marginBottom: 12 },
  cardTop: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  avatar: { width: 40, height: 40, borderRadius: 12, backgroundColor: `${colors.accent}20`, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 16, fontWeight: "800", color: colors.accent },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  userName: { fontSize: 14, fontWeight: "700", color: colors.textPrimary },
  verBadge: { flexDirection: "row", alignItems: "center", gap: 3 },
  verText: { fontSize: 10, fontWeight: "600", color: colors.success },
  starRow: { flexDirection: "row", gap: 2, marginTop: 2 },
  dateText: { fontSize: 11, color: colors.textMuted },
  reviewTitle: { fontSize: 14, fontWeight: "700", color: colors.textPrimary, marginTop: 10 },
  reviewComment: { fontSize: 13, color: colors.textSecondary, lineHeight: 19, marginTop: 4 },
  // Reply display
  replyBox: { marginTop: 12, padding: 12, borderRadius: 12, backgroundColor: `${colors.primary}0A`, borderWidth: 1, borderColor: `${colors.primary}20` },
  replyHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  replyLabel: { fontSize: 11, fontWeight: "700", color: colors.primary },
  replyText: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  // Reply input
  replyInput: { marginTop: 12 },
  replyField: { backgroundColor: colors.surfaceLight, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 13, color: colors.textPrimary, minHeight: 60, textAlignVertical: "top" },
  replyActions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 8 },
  replyCancelText: { fontSize: 13, fontWeight: "600", color: colors.textMuted, paddingVertical: 8 },
  replySendBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: colors.primary },
  replySendText: { fontSize: 13, fontWeight: "700", color: "#FFF" },
  // Reply button
  replyBtn: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10, alignSelf: "flex-start" },
  replyBtnText: { fontSize: 13, fontWeight: "600", color: colors.primary },
  // Empty
  empty: { alignItems: "center", paddingTop: 80 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: colors.textPrimary, marginTop: 12 },
  emptyDesc: { fontSize: 13, color: colors.textMuted },
});

export default ReviewsScreen;
