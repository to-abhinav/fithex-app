import React, { useState, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar,
  Alert, TextInput, ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import colors from "../../theme/colors";
import { useToast } from "../../context/ToastContext";
import { getClosures, createClosure, deleteClosure } from "../../api/ownerService";

const TYPE_COLORS = { holiday: colors.warning, maintenance: colors.accent, event: colors.primary, other: colors.textMuted };
const TYPE_ICONS = { holiday: "sunny-outline", maintenance: "construct-outline", event: "calendar-outline", other: "ellipsis-horizontal" };
const TYPES = ["holiday", "maintenance", "event", "other"];

const getQuickDates = () => {
  const today = new Date();
  const results = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    results.push(d);
  }
  return results;
};

const formatDate = (d) => new Date(d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
const formatShort = (d) => {
  const date = new Date(d);
  return { day: date.getDate(), weekday: date.toLocaleDateString("en-IN", { weekday: "short" }), month: date.toLocaleDateString("en-IN", { month: "short" }) };
};

const ClosureCard = ({ item, onDelete }) => {
  const t = item.type || "holiday";
  const d = new Date(item.date);
  const dateStr = formatDate(item.date);
  const daysAway = Math.ceil((d - new Date()) / (1000 * 60 * 60 * 24));

  return (
    <Animated.View entering={FadeInDown.duration(350)} style={s.card}>
      <View style={[s.typeIcon, { backgroundColor: `${TYPE_COLORS[t]}1A` }]}>
        <Ionicons name={TYPE_ICONS[t]} size={20} color={TYPE_COLORS[t]} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.cardDate}>{dateStr}</Text>
        {item.reason ? <Text style={s.cardReason} numberOfLines={2}>{item.reason}</Text> : null}
        <View style={s.tagRow}>
          <View style={[s.typeBadge, { backgroundColor: `${TYPE_COLORS[t]}14` }]}>
            <Text style={[s.typeText, { color: TYPE_COLORS[t] }]}>{t}</Text>
          </View>
          {daysAway >= 0 && (
            <Text style={s.daysText}>{daysAway === 0 ? "Today" : daysAway === 1 ? "Tomorrow" : `In ${daysAway} days`}</Text>
          )}
        </View>
      </View>
      <TouchableOpacity onPress={() => onDelete(item)} style={s.delBtn}>
        <Ionicons name="trash-outline" size={18} color={colors.danger} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const GymClosuresScreen = () => {
  const navigation = useNavigation();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [selDate, setSelDate] = useState(null);
  const [reason, setReason] = useState("");
  const [type, setType] = useState("holiday");
  const [saving, setSaving] = useState(false);

  const quickDates = getQuickDates();

  const fetchData = useCallback(async () => {
    try { setLoading(true); const d = await getClosures(); setItems(d?.closures || []); }
    catch { setItems([]); } finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  const handleAdd = async () => {
    if (!selDate) return toast.warning("Please pick a date for the closure", "Select Date");
    try {
      setSaving(true);
      await createClosure(selDate.toISOString(), reason.trim(), type);
      setAdding(false); setReason(""); setType("holiday"); setSelDate(null);
      fetchData();
    } catch (e) { toast.error(e?.response?.data?.message || "Failed to add closure"); }
    finally { setSaving(false); }
  };

  const handleDelete = (item) => {
    const dateStr = formatDate(item.date);
    Alert.alert("Remove Closure", `Remove closure on ${dateStr}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: async () => {
        try { await deleteClosure(item.date); setItems((p) => p.filter((c) => c._id !== item._id)); }
        catch (e) { toast.error(e?.response?.data?.message || "Delete failed"); }
      }},
    ]);
  };

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={[`${colors.secondary}28`, `${colors.primary}18`, "rgba(0,0,0,0)"]} locations={[0, 0.4, 1]} style={s.bgGrad} />

      <Animated.View entering={FadeInDown.duration(500)} style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerLabel}>GYM OPERATIONS</Text>
          <Text style={s.headerTitle}>Gym Closures</Text>
        </View>
      </Animated.View>

      {/* Add form */}
      {adding ? (
        <Animated.View entering={FadeInDown.duration(300)} style={s.addForm}>
          <Text style={s.fieldLabel}>Pick a date</Text>
          <FlatList
            data={quickDates}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(d) => d.toISOString()}
            renderItem={({ item: d }) => {
              const parts = formatShort(d);
              const isSelected = selDate && d.toDateString() === selDate.toDateString();
              return (
                <TouchableOpacity onPress={() => setSelDate(d)} style={[s.dateChip, isSelected && s.dateChipActive]}>
                  <Text style={[s.dateChipWeekday, isSelected && s.dateChipTextActive]}>{parts.weekday}</Text>
                  <Text style={[s.dateChipDay, isSelected && s.dateChipTextActive]}>{parts.day}</Text>
                  <Text style={[s.dateChipMonth, isSelected && s.dateChipTextActive]}>{parts.month}</Text>
                </TouchableOpacity>
              );
            }}
            contentContainerStyle={{ gap: 8 }}
          />

          <TextInput style={s.input} value={reason} onChangeText={setReason} placeholder="Reason (optional)" placeholderTextColor={colors.textMuted} />

          <View style={s.typeRow}>
            {TYPES.map((t) => (
              <TouchableOpacity key={t} onPress={() => setType(t)} style={[s.typeChip, type === t && { backgroundColor: TYPE_COLORS[t], borderColor: TYPE_COLORS[t] }]}>
                <Text style={[s.typeChipText, type === t && { color: "#FFF" }]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={s.addActions}>
            <TouchableOpacity onPress={() => setAdding(false)} style={s.cancelBtn}><Text style={s.cancelText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity onPress={handleAdd} activeOpacity={0.85} style={s.saveBtn} disabled={saving}>
              {saving ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={s.saveBtnText}>Add Closure</Text>}
            </TouchableOpacity>
          </View>
        </Animated.View>
      ) : (
        <TouchableOpacity onPress={() => setAdding(true)} activeOpacity={0.8} style={s.newBtn}>
          <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
          <Text style={s.newBtnText}>Schedule Closure</Text>
        </TouchableOpacity>
      )}

      {/* List */}
      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i._id}
          renderItem={({ item }) => <ClosureCard item={item} onDelete={handleDelete} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="calendar-outline" size={44} color={colors.textMuted} />
              <Text style={s.emptyTitle}>No upcoming closures</Text>
              <Text style={s.emptyDesc}>Your gym is open every day!</Text>
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
  // Field label
  fieldLabel: { fontSize: 12, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  // New btn
  newBtn: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 20, marginBottom: 12, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14, backgroundColor: `${colors.primary}10`, borderWidth: 1, borderColor: `${colors.primary}30`, borderStyle: "dashed" },
  newBtnText: { fontSize: 14, fontWeight: "700", color: colors.primary },
  // Add form
  addForm: { marginHorizontal: 20, marginBottom: 12, padding: 16, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  // Date chips (horizontal scroll)
  dateChip: { alignItems: "center", paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14, backgroundColor: colors.surfaceLight, borderWidth: 1, borderColor: colors.border, minWidth: 58 },
  dateChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dateChipWeekday: { fontSize: 10, fontWeight: "600", color: colors.textMuted, textTransform: "uppercase" },
  dateChipDay: { fontSize: 20, fontWeight: "900", color: colors.textPrimary, marginVertical: 2 },
  dateChipMonth: { fontSize: 10, fontWeight: "600", color: colors.textMuted },
  dateChipTextActive: { color: "#FFF" },
  // Input
  input: { backgroundColor: colors.surfaceLight, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: colors.textPrimary, marginTop: 12, marginBottom: 12 },
  typeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  typeChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, backgroundColor: colors.surfaceLight, borderWidth: 1, borderColor: colors.border },
  typeChipText: { fontSize: 12, fontWeight: "600", color: colors.textMuted, textTransform: "capitalize" },
  addActions: { flexDirection: "row", justifyContent: "flex-end", gap: 10 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10 },
  cancelText: { fontSize: 13, fontWeight: "600", color: colors.textMuted },
  saveBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, backgroundColor: colors.primary },
  saveBtnText: { fontSize: 13, fontWeight: "700", color: "#FFF" },
  // Card
  card: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 14, marginBottom: 10 },
  typeIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  cardDate: { fontSize: 14, fontWeight: "700", color: colors.textPrimary },
  cardReason: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  tagRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  typeText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  daysText: { fontSize: 11, fontWeight: "600", color: colors.textMuted },
  delBtn: { padding: 6 },
  // Empty
  empty: { alignItems: "center", paddingTop: 80 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: colors.textPrimary, marginTop: 12 },
  emptyDesc: { fontSize: 13, color: colors.textMuted },
});

export default GymClosuresScreen;
