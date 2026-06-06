import React, { useState, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar,
  Alert, Switch, ActivityIndicator, Modal, TextInput, ScrollView, KeyboardAvoidingView, Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import colors from "../../theme/colors";
import { useToast } from "../../context/ToastContext";
import { getMyPlans, createPlan, updatePlan, togglePlan, deletePlan } from "../../api/ownerService";

const DURATION_MAP = { Monthly: 1, Quarterly: 3, "Half-Yearly": 6, Yearly: 12, Custom: 1 };
const CATEGORIES = ["Strength", "Cardio", "Yoga"];
const PLAN_NAMES = ["Monthly", "Quarterly", "Half-Yearly", "Yearly", "Custom"];

const PlanCard = ({ item, onToggle, onEdit, onDelete }) => {
  const enrolled = item.currentEnrolledMembers || 0;
  const max = item.maxMembers;

  return (
    <Animated.View entering={FadeInDown.duration(350)} style={s.card}>
      <View style={s.cardTop}>
        <View style={{ flex: 1 }}>
          <View style={s.nameRow}>
            <Text style={s.planName}>{item.name}</Text>
            <View style={[s.catBadge, { backgroundColor: `${colors.accent}1A` }]}>
              <Text style={s.catText}>{item.category}</Text>
            </View>
          </View>
          {item.description ? <Text style={s.planDesc} numberOfLines={2}>{item.description}</Text> : null}
        </View>
        <Switch
          value={item.isActive}
          onValueChange={() => onToggle(item)}
          trackColor={{ false: colors.surfaceLight, true: `${colors.success}60` }}
          thumbColor={item.isActive ? colors.success : colors.textMuted}
        />
      </View>

      {/* Price + Duration */}
      <View style={s.priceRow}>
        <Text style={s.price}>₹{item.price}</Text>
        {item.originalPrice && item.originalPrice > item.price && (
          <Text style={s.origPrice}>₹{item.originalPrice}</Text>
        )}
        <Text style={s.duration}>{item.durationInMonths} month{item.durationInMonths > 1 ? "s" : ""}</Text>
      </View>

      {/* Features */}
      {item.features?.length > 0 && (
        <View style={s.featRow}>
          {item.features.slice(0, 3).map((f, i) => (
            <View key={i} style={s.featChip}>
              <Text style={s.featText}>{f}</Text>
            </View>
          ))}
          {item.features.length > 3 && <Text style={s.featMore}>+{item.features.length - 3}</Text>}
        </View>
      )}

      {/* Enrollment */}
      <View style={s.enrollRow}>
        <Ionicons name="people-outline" size={14} color={colors.textMuted} />
        <Text style={s.enrollText}>{enrolled}{max ? `/${max}` : ""} enrolled</Text>
      </View>

      {/* Actions */}
      <View style={s.actionRow}>
        <TouchableOpacity onPress={() => onEdit(item)} activeOpacity={0.8} style={s.editBtn}>
          <Ionicons name="create-outline" size={16} color={colors.primary} />
          <Text style={s.editText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDelete(item)} activeOpacity={0.8} style={s.delBtn}>
          <Ionicons name="trash-outline" size={16} color={colors.danger} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const PlanFormModal = ({ visible, plan, onClose, onSave }) => {
  const isEdit = !!plan;
  const [name, setName] = useState(plan?.name || "Monthly");
  const [category, setCategory] = useState(plan?.category || "Strength");
  const [description, setDescription] = useState(plan?.description || "");
  const [price, setPrice] = useState(plan?.price?.toString() || "");
  const [duration, setDuration] = useState(plan?.durationInMonths?.toString() || "1");
  const [features, setFeatures] = useState(plan?.features?.join(", ") || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!price) return toast.warning("Price is required");
    setSaving(true);
    try {
      const data = {
        name, category, description,
        price: parseFloat(price),
        durationInMonths: parseInt(duration) || DURATION_MAP[name] || 1,
        features: features.split(",").map((f) => f.trim()).filter(Boolean),
      };
      await onSave(data, plan?._id);
      onClose();
    } catch (e) { toast.error(e?.response?.data?.message || "Failed to save"); }
    finally { setSaving(false); }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={s.modalOverlay}>
        <View style={s.modalSheet}>
          <View style={s.modalHandle} />
          <Text style={s.modalTitle}>{isEdit ? "Edit Plan" : "Create Plan"}</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Plan Name */}
            <Text style={s.fieldLabel}>Plan Name</Text>
            <View style={s.chipRow}>
              {PLAN_NAMES.map((n) => (
                <TouchableOpacity key={n} onPress={() => { setName(n); if (!isEdit) setDuration(DURATION_MAP[n]?.toString()); }} style={[s.selChip, name === n && s.selChipActive]}>
                  <Text style={[s.selChipText, name === n && s.selChipTextActive]}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Category */}
            <Text style={s.fieldLabel}>Category</Text>
            <View style={s.chipRow}>
              {CATEGORIES.map((c) => (
                <TouchableOpacity key={c} onPress={() => setCategory(c)} style={[s.selChip, category === c && s.selChipActive]}>
                  <Text style={[s.selChipText, category === c && s.selChipTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.fieldLabel}>Price (₹)</Text>
            <TextInput style={s.input} value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="e.g. 1500" placeholderTextColor={colors.textMuted} />

            <Text style={s.fieldLabel}>Duration (months)</Text>
            <TextInput style={s.input} value={duration} onChangeText={setDuration} keyboardType="numeric" placeholder="e.g. 3" placeholderTextColor={colors.textMuted} />

            <Text style={s.fieldLabel}>Description</Text>
            <TextInput style={[s.input, { height: 80, textAlignVertical: "top" }]} value={description} onChangeText={setDescription} multiline placeholder="Plan description..." placeholderTextColor={colors.textMuted} />

            <Text style={s.fieldLabel}>Features (comma separated)</Text>
            <TextInput style={[s.input, { height: 60, textAlignVertical: "top" }]} value={features} onChangeText={setFeatures} multiline placeholder="AC, Locker, Trainer" placeholderTextColor={colors.textMuted} />

            <TouchableOpacity onPress={handleSave} activeOpacity={0.85} style={s.saveBtn} disabled={saving}>
              {saving ? <ActivityIndicator color="#FFF" /> : <Text style={s.saveBtnText}>{isEdit ? "Update Plan" : "Create Plan"}</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={s.cancelBtn}>
              <Text style={s.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const ManagePlansScreen = () => {
  const navigation = useNavigation();
  const toast = useToast();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  const fetchPlans = useCallback(async () => {
    try { setLoading(true); const data = await getMyPlans(); setPlans(data?.plans || []); }
    catch { setPlans([]); } finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { fetchPlans(); }, []));

  const handleToggle = async (item) => {
    try {
      await togglePlan(item._id);
      setPlans((prev) => prev.map((p) => p._id === item._id ? { ...p, isActive: !p.isActive } : p));
    } catch (e) { toast.error(e?.response?.data?.message || "Toggle failed"); }
  };

  const handleDelete = (item) => {
    Alert.alert("Delete Plan", `Delete "${item.name}"? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try { await deletePlan(item._id); setPlans((prev) => prev.filter((p) => p._id !== item._id)); }
        catch (e) { toast.error(e?.response?.data?.message || "Delete failed"); }
      }},
    ]);
  };

  const handleSave = async (data, id) => {
    if (id) { await updatePlan(id, data); } else { await createPlan(data); }
    fetchPlans();
  };

  const openCreate = () => navigation.navigate("CreatePlan");
  const openEdit = (item) => { setEditingPlan(item); setModalVisible(true); };

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
          <Text style={s.headerTitle}>Manage Plans</Text>
        </View>
      </Animated.View>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : (
        <FlatList
          data={plans}
          keyExtractor={(i) => i._id}
          renderItem={({ item }) => <PlanCard item={item} onToggle={handleToggle} onEdit={openEdit} onDelete={handleDelete} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="pricetag-outline" size={44} color={colors.textMuted} />
              <Text style={s.emptyTitle}>No plans yet</Text>
              <Text style={s.emptyDesc}>Create your first membership plan</Text>
            </View>
          }
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB */}
      <TouchableOpacity onPress={openCreate} activeOpacity={0.85} style={s.fab}>
        <Ionicons name="add" size={28} color="#FFF" />
      </TouchableOpacity>

      <PlanFormModal visible={modalVisible} plan={editingPlan} onClose={() => setModalVisible(false)} onSave={handleSave} />
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
  list: { paddingHorizontal: 20, paddingBottom: 120, paddingTop: 8 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 16, marginBottom: 12 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  planName: { fontSize: 17, fontWeight: "800", color: colors.textPrimary },
  catBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  catText: { fontSize: 10, fontWeight: "700", color: colors.accent },
  planDesc: { fontSize: 12, color: colors.textMuted, lineHeight: 17, marginTop: 2 },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 8, marginTop: 12 },
  price: { fontSize: 22, fontWeight: "900", color: colors.success },
  origPrice: { fontSize: 14, color: colors.textMuted, textDecorationLine: "line-through" },
  duration: { fontSize: 12, fontWeight: "600", color: colors.textSecondary },
  featRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  featChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: `${colors.primary}14` },
  featText: { fontSize: 11, fontWeight: "600", color: colors.primary },
  featMore: { fontSize: 11, fontWeight: "600", color: colors.textMuted, alignSelf: "center" },
  enrollRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 },
  enrollText: { fontSize: 12, fontWeight: "500", color: colors.textMuted },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  editBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 12, backgroundColor: `${colors.primary}14`, borderWidth: 1, borderColor: `${colors.primary}30` },
  editText: { fontSize: 13, fontWeight: "700", color: colors.primary },
  delBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: `${colors.danger}14`, borderWidth: 1, borderColor: `${colors.danger}30`, alignItems: "center", justifyContent: "center" },
  fab: { position: "absolute", bottom: 110, right: 24, width: 56, height: 56, borderRadius: 18, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", elevation: 8, shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12 },
  // Empty
  empty: { alignItems: "center", paddingTop: 80 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: colors.textPrimary, marginTop: 12 },
  emptyDesc: { fontSize: 13, color: colors.textMuted },
  // Modal
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.6)" },
  modalSheet: { backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingTop: 12, maxHeight: "90%" },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.textMuted, alignSelf: "center", marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: "800", color: colors.textPrimary, marginBottom: 20 },
  fieldLabel: { fontSize: 12, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, marginTop: 16 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  selChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  selChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  selChipText: { fontSize: 13, fontWeight: "600", color: colors.textMuted },
  selChipTextActive: { color: "#FFF" },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: colors.textPrimary, fontWeight: "500" },
  saveBtn: { marginTop: 24, height: 52, borderRadius: 14, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  saveBtnText: { fontSize: 15, fontWeight: "700", color: "#FFF" },
  cancelBtn: { alignItems: "center", paddingVertical: 14 },
  cancelText: { fontSize: 14, fontWeight: "600", color: colors.textMuted },
});

export default ManagePlansScreen;
