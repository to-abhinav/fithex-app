import React, { useState, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar, ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import colors from "../../theme/colors";
import { getGymLogs, getTodayAttendance } from "../../api/ownerService";

const LogCard = ({ item }) => {
  const user = item.userId || {};
  const initial = (user.name || "?").charAt(0).toUpperCase();
  const isIn = !!item.checkInTime && !item.checkOutTime;
  const inTime = item.checkInTime ? new Date(item.checkInTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—";
  const outTime = item.checkOutTime ? new Date(item.checkOutTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—";

  return (
    <Animated.View entering={FadeInDown.duration(300)} style={s.logCard}>
      <View style={[s.avatar, { backgroundColor: isIn ? `${colors.success}20` : `${colors.primary}20` }]}>
        <Text style={[s.avatarText, { color: isIn ? colors.success : colors.primary }]}>{initial}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.logName}>{user.name || "Unknown"}</Text>
        <View style={s.timeRow}>
          <Ionicons name="log-in-outline" size={12} color={colors.success} />
          <Text style={s.timeText}>{inTime}</Text>
          {item.checkOutTime && (
            <>
              <Ionicons name="log-out-outline" size={12} color={colors.danger} style={{ marginLeft: 10 }} />
              <Text style={s.timeText}>{outTime}</Text>
            </>
          )}
        </View>
      </View>
      <View style={[s.statusPill, { backgroundColor: isIn ? `${colors.success}1A` : `${colors.textMuted}14` }]}>
        <View style={[s.statusDot, { backgroundColor: isIn ? colors.success : colors.textMuted }]} />
        <Text style={[s.statusPillText, { color: isIn ? colors.success : colors.textMuted }]}>{isIn ? "Inside" : "Left"}</Text>
      </View>
    </Animated.View>
  );
};

const EntryLogScreen = () => {
  const navigation = useNavigation();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [logsData, attData] = await Promise.allSettled([getGymLogs(1, 100), getTodayAttendance()]);
      setLogs(logsData.status === "fulfilled" ? (logsData.value?.logs || []) : []);
      setAttendance(attData.status === "fulfilled" ? attData.value : null);
    } catch { setLogs([]); }
    finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  const todayCount = attendance?.totalCheckIns ?? logs.length;
  const insideNow = attendance?.currentlyInside ?? logs.filter((l) => l.checkInTime && !l.checkOutTime).length;

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={[`${colors.info}28`, `${colors.primary}18`, "rgba(0,0,0,0)"]} locations={[0, 0.4, 1]} style={s.bgGrad} />

      <Animated.View entering={FadeInDown.duration(500)} style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerLabel}>MEMBER MANAGEMENT</Text>
          <Text style={s.headerTitle}>Entry Log</Text>
        </View>
      </Animated.View>

      {/* Stats */}
      <Animated.View entering={FadeInDown.delay(100).duration(400)} style={s.statsRow}>
        <View style={s.statCard}>
          <Ionicons name="people" size={20} color={colors.primary} />
          <Text style={s.statVal}>{todayCount}</Text>
          <Text style={s.statLabel}>Total Today</Text>
        </View>
        <View style={s.statCard}>
          <View style={[s.liveDot, { backgroundColor: colors.success }]} />
          <Text style={[s.statVal, { color: colors.success }]}>{insideNow}</Text>
          <Text style={s.statLabel}>Inside Now</Text>
        </View>
      </Animated.View>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(i) => i._id}
          renderItem={({ item }) => <LogCard item={item} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="log-in-outline" size={44} color={colors.textMuted} />
              <Text style={s.emptyTitle}>No entries today</Text>
              <Text style={s.emptyDesc}>Check-ins will appear here</Text>
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
  statVal: { fontSize: 26, fontWeight: "900", color: colors.textPrimary },
  statLabel: { fontSize: 11, fontWeight: "600", color: colors.textMuted },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  // Log Card
  logCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 14, marginBottom: 8 },
  avatar: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 16, fontWeight: "800" },
  logName: { fontSize: 14, fontWeight: "700", color: colors.textPrimary },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  timeText: { fontSize: 12, fontWeight: "500", color: colors.textMuted },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusPillText: { fontSize: 11, fontWeight: "700" },
  // Empty
  empty: { alignItems: "center", paddingTop: 80 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: colors.textPrimary, marginTop: 12 },
  emptyDesc: { fontSize: 13, color: colors.textMuted },
});

export default EntryLogScreen;
