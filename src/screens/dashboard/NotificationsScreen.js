import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Animated,
  StatusBar,
  Dimensions,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path, Circle, Rect, Line } from "react-native-svg";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from "../../api/notificationService";
import { useNotifications } from "../../context/NotificationContext";

const { width: SW } = Dimensions.get("window");

// ─── Color tokens (OLED dark + FitHex indigo palette) ──────────────────────
const C = {
  bg: "#09090f",
  surface: "#111118",
  surfaceHigh: "#18181f",
  border: "rgba(255,255,255,0.07)",
  primary: "#6366f1",
  secondary: "#8b5cf6",
  accent: "#06b6d4",
  text: "#ffffff",
  textSub: "rgba(255,255,255,0.55)",
  textMuted: "rgba(255,255,255,0.28)",
};

// ─── Notification type config (SVG icons, no emojis) ────────────────────────
const TYPE_MAP = {
  membership_activated:         { color: "#10b981", Icon: IconCheck,      label: "Membership" },
  membership_rejected:          { color: "#ef4444", Icon: IconX,          label: "Membership" },
  membership_request_received:  { color: "#6366f1", Icon: IconInbox,      label: "Requests"   },
  membership_expiring_3d:       { color: "#f59e0b", Icon: IconClock,      label: "Expiry"     },
  membership_expiring_1d:       { color: "#f97316", Icon: IconClock,      label: "Expiry"     },
  membership_expired:           { color: "#ef4444", Icon: IconAlertCircle,label: "Expiry"     },
  payment_success:              { color: "#10b981", Icon: IconCard,        label: "Payments"   },
  payment_failed:               { color: "#ef4444", Icon: IconCard,        label: "Payments"   },
  checkin_confirmed:            { color: "#06b6d4", Icon: IconZap,        label: "Check-in"   },
  checkout_confirmed:           { color: "#8b5cf6", Icon: IconZap,        label: "Check-in"   },
  session_duration_alert:       { color: "#f59e0b", Icon: IconClock,      label: "Session"    },
  forgot_checkout:              { color: "#f97316", Icon: IconAlertCircle,label: "Session"    },
  streak_started:               { color: "#10b981", Icon: IconFire,       label: "Streak"     },
  streak_milestone_3:           { color: "#f59e0b", Icon: IconFire,       label: "Streak"     },
  streak_milestone_7:           { color: "#f97316", Icon: IconFire,       label: "Streak"     },
  streak_broken:                { color: "#ef4444", Icon: IconFire,       label: "Streak"     },
  smart_visit_nudge:            { color: "#06b6d4", Icon: IconZap,        label: "Nudge"      },
  announcement:                 { color: "#6366f1", Icon: IconMegaphone,  label: "Announce"   },
};

const getType = (t) => TYPE_MAP[t] || { color: "#6366f1", Icon: IconBell, label: "General" };

// ─── SVG Icon components ─────────────────────────────────────────────────────
function IconBell({ size = 18, color = "#fff" }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </Svg>
  );
}
function IconCheck({ size = 18, color = "#fff" }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <Path d="M22 4 12 14.01l-3-3" />
    </Svg>
  );
}
function IconX({ size = 18, color = "#fff" }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="12" r="10" />
      <Path d="m15 9-6 6" /><Path d="m9 9 6 6" />
    </Svg>
  );
}
function IconInbox({ size = 18, color = "#fff" }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M22 12h-6l-2 3H10l-2-3H2" />
      <Path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </Svg>
  );
}
function IconClock({ size = 18, color = "#fff" }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="12" r="10" />
      <Path d="M12 6v6l4 2" />
    </Svg>
  );
}
function IconAlertCircle({ size = 18, color = "#fff" }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="12" r="10" />
      <Line x1="12" y1="8" x2="12" y2="12" />
      <Line x1="12" y1="16" x2="12.01" y2="16" />
    </Svg>
  );
}
function IconCard({ size = 18, color = "#fff" }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <Line x1="1" y1="10" x2="23" y2="10" />
    </Svg>
  );
}
function IconZap({ size = 18, color = "#fff" }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
    </Svg>
  );
}
function IconFire({ size = 18, color = "#fff" }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </Svg>
  );
}
function IconMegaphone({ size = 18, color = "#fff" }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="m3 11 19-9-9 19-2-8-8-2z" />
    </Svg>
  );
}
function IconArrowLeft({ size = 20, color = "#fff" }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="m12 19-7-7 7-7" /><Path d="M19 12H5" />
    </Svg>
  );
}

// ─── Time ago ────────────────────────────────────────────────────────────────
const timeAgo = (d) => {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return "Just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

const dayLabel = (d) => {
  const date = new Date(d);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "long" });
};

// ─── Filter tabs ─────────────────────────────────────────────────────────────
const FILTERS = ["All", "Membership", "Payments", "Check-in", "Streak", "Announce"];

// ─── Empty State ─────────────────────────────────────────────────────────────
const EmptyState = ({ filter }) => (
  <View style={s.emptyWrap}>
    <View style={s.emptyIconRing}>
      <IconBell size={32} color="rgba(99,102,241,0.5)" />
    </View>
    <Text style={s.emptyTitle}>No notifications yet</Text>
    <Text style={s.emptySub}>
      {filter === "All"
        ? "When something happens, you'll see it here"
        : `No "${filter}" notifications yet`}
    </Text>
  </View>
);

// ─── Notification Card ───────────────────────────────────────────────────────
const NotifCard = React.memo(({ item, onPress, index }) => {
  const cfg = getType(item.type);
  const { Icon, color } = cfg;
  const isUnread = !item.read;
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 350,
      delay: Math.min(index * 60, 400),
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
      }}
    >
      <TouchableOpacity
        onPress={() => onPress(item)}
        activeOpacity={0.75}
        style={[s.card, isUnread && { borderColor: `${color}35`, backgroundColor: `${color}08` }]}
      >
        {/* Left accent bar for unread */}
        {isUnread && <View style={[s.accentBar, { backgroundColor: color }]} />}

        {/* Icon circle */}
        <View style={[s.iconCircle, { backgroundColor: `${color}18`, borderColor: `${color}30` }]}>
          <Icon size={18} color={color} />
        </View>

        {/* Content */}
        <View style={s.cardBody}>
          <View style={s.cardRow}>
            <Text style={[s.cardTitle, isUnread && s.cardTitleBold]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={s.cardTime}>{timeAgo(item.createdAt)}</Text>
          </View>
          <Text style={s.cardMsg} numberOfLines={2}>{item.message}</Text>
        </View>

        {/* Unread dot */}
        {isUnread && <View style={[s.dot, { backgroundColor: color }]} />}
      </TouchableOpacity>
    </Animated.View>
  );
});

// ─── Day separator ───────────────────────────────────────────────────────────
const DaySep = ({ label }) => (
  <View style={s.daySep}>
    <View style={s.dayLine} />
    <Text style={s.dayLabel}>{label}</Text>
    <View style={s.dayLine} />
  </View>
);

// ─── Main Screen ─────────────────────────────────────────────────────────────
const NotificationsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { refresh: refreshBadge } = useNotifications();

  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");

  // ── Fetch ──────────────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async (pageNum = 1, append = false) => {
    try {
      const res = await getNotifications(pageNum, 20);
      const data = res.data;
      if (append) {
        setNotifications((prev) => [...prev, ...data.notifications]);
      } else {
        setNotifications(data.notifications);
      }
      setTotalPages(data.pagination?.totalPages ?? 1);
      setPage(pageNum);
    } catch (err) {
      console.error("[NotificationsScreen] Fetch error:", err.message);
    }
  }, []);

  useEffect(() => {
    fetchNotifications(1).finally(() => setLoading(false));
  }, [fetchNotifications]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications(1);
    refreshBadge();
    setRefreshing(false);
  }, [fetchNotifications, refreshBadge]);

  const onEndReached = useCallback(async () => {
    if (loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    await fetchNotifications(page + 1, true);
    setLoadingMore(false);
  }, [loadingMore, page, totalPages, fetchNotifications]);

  const handlePress = useCallback(async (item) => {
    if (!item.read) {
      markAsRead(item._id).catch(() => {});
      setNotifications((prev) =>
        prev.map((n) => (n._id === item._id ? { ...n, read: true } : n))
      );
      refreshBadge();
    }
    const screen = item.data?.screen;
    if (screen && navigation) navigation.navigate(screen);
  }, [refreshBadge, navigation]);

  const handleMarkAllRead = useCallback(async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      refreshBadge();
    } catch {}
  }, [refreshBadge]);

  // ── Filter + group by day ──────────────────────────────────────────────
  const filtered = notifications.filter((n) => {
    if (activeFilter === "All") return true;
    return getType(n.type).label === activeFilter;
  });

  // Build list items: insert day separators
  const listData = [];
  let lastDay = null;
  filtered.forEach((n, i) => {
    const day = dayLabel(n.createdAt);
    if (day !== lastDay) {
      listData.push({ _id: `sep_${day}_${i}`, _isSep: true, label: day });
      lastDay = day;
    }
    listData.push({ ...n, _listIndex: i });
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <View style={[s.screen, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" />
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={s.loadingText}>Loading…</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      {/* ── Ambient gradient ──────────────────────────────────────────────── */}
      <LinearGradient
        colors={["rgba(99,102,241,0.22)", "rgba(139,92,246,0.10)", "rgba(0,0,0,0)"]}
        locations={[0, 0.4, 1]}
        style={s.bgGrad}
      />

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <View style={s.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={s.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <IconArrowLeft size={20} color={C.text} />
        </TouchableOpacity>

        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={s.headerBadge}>
              <Text style={s.headerBadgeText}>{unreadCount > 99 ? "99+" : unreadCount}</Text>
            </View>
          )}
        </View>

        {unreadCount > 0 ? (
          <TouchableOpacity onPress={handleMarkAllRead} style={s.markAllBtn} activeOpacity={0.7}>
            <Text style={s.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 90 }} />
        )}
      </View>

      {/* ── Filter tabs ──────────────────────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.filtersContent}
        style={s.filtersList}
      >
        {FILTERS.map((f) => {
          const active = activeFilter === f;
          return (
            <TouchableOpacity
              key={f}
              onPress={() => setActiveFilter(f)}
              activeOpacity={0.75}
              style={[s.filterChip, active && s.filterChipActive]}
            >
              <Text style={[s.filterText, active && s.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Divider ───────────────────────────────────────────────────────── */}
      <View style={s.divider} />

      {/* ── Notification list ─────────────────────────────────────────────── */}
      <FlatList
        data={listData}
        keyExtractor={(item) => item._id}
        renderItem={({ item, index }) => {
          if (item._isSep) return <DaySep label={item.label} />;
          return <NotifCard item={item} onPress={handlePress} index={item._listIndex} />;
        }}
        contentContainerStyle={[
          s.listContent,
          listData.length === 0 && s.listEmpty,
        ]}
        ListEmptyComponent={<EmptyState filter={activeFilter} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={C.primary}
            colors={[C.primary]}
            progressBackgroundColor={C.surface}
          />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          loadingMore ? (
            <View style={s.footer}>
              <ActivityIndicator size="small" color={C.primary} />
            </View>
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  bgGrad: { position: "absolute", top: 0, left: 0, right: 0, height: 220 },

  // Loading
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 13, color: C.textMuted, fontWeight: "500" },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    gap: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: C.text,
    letterSpacing: -0.4,
  },
  headerBadge: {
    backgroundColor: C.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  headerBadgeText: { fontSize: 11, fontWeight: "800", color: "#fff" },
  markAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: "rgba(99,102,241,0.15)",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.3)",
  },
  markAllText: { fontSize: 12, fontWeight: "600", color: C.primary },

  // Filters
  filtersList: { flexGrow: 0 },
  filtersContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 34,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: C.border,
    justifyContent: "center",
    alignItems: "center",
  },
  filterChipActive: {
    backgroundColor: "rgba(99,102,241,0.2)",
    borderColor: "rgba(99,102,241,0.5)",
  },
  filterText: { fontSize: 13, fontWeight: "600", color: C.textSub, lineHeight: 18 },
  filterTextActive: { color: C.primary },

  divider: { height: 1, backgroundColor: C.border, marginHorizontal: 0 },

  // List
  listContent: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 32 },
  listEmpty: { flex: 1, justifyContent: "center" },

  // Day separator
  daySep: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 14,
    paddingHorizontal: 2,
  },
  dayLine: { flex: 1, height: 1, backgroundColor: C.border },
  dayLabel: { fontSize: 11, fontWeight: "700", color: C.textMuted, textTransform: "uppercase", letterSpacing: 1 },

  // Card
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.border,
    position: "relative",
    overflow: "hidden",
    gap: 12,
  },
  accentBar: {
    position: "absolute",
    left: 0, top: 0, bottom: 0,
    width: 3,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    flexShrink: 0,
  },
  cardBody: { flex: 1, gap: 3 },
  cardRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 6 },
  cardTitle: { flex: 1, fontSize: 14, fontWeight: "500", color: C.textSub },
  cardTitleBold: { fontWeight: "700", color: C.text },
  cardTime: { fontSize: 11, color: C.textMuted, flexShrink: 0 },
  cardMsg: { fontSize: 13, color: C.textSub, lineHeight: 18 },
  dot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0, alignSelf: "flex-start", marginTop: 3 },

  // Empty
  emptyWrap: { alignItems: "center", paddingVertical: 64, gap: 12 },
  emptyIconRing: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "rgba(99,102,241,0.08)",
    borderWidth: 1, borderColor: "rgba(99,102,241,0.2)",
    alignItems: "center", justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "rgba(255,255,255,0.5)" },
  emptySub: { fontSize: 13, color: C.textMuted, textAlign: "center", maxWidth: 240, lineHeight: 20 },

  // Footer
  footer: { paddingVertical: 20, alignItems: "center" },
});

export default NotificationsScreen;
