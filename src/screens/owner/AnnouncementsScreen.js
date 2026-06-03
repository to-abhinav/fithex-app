import React, { useState, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar,
  Alert, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import colors from "../../theme/colors";
import { useToast } from "../../context/ToastContext";
import { getMyAnnouncements, createAnnouncement, deleteAnnouncement } from "../../api/ownerService";

const CATEGORIES = ["general", "schedule", "offer", "closure", "event"];
const CAT_ICONS = { general: "megaphone-outline", schedule: "time-outline", offer: "gift-outline", closure: "lock-closed-outline", event: "calendar-outline" };
const CAT_COLORS = { general: colors.primary, schedule: colors.accent, offer: colors.success, closure: colors.danger, event: colors.warning };

const AnnouncementCard = ({ item, onDelete }) => {
  const cat = item.category || "general";
  const date = item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "";

  return (
    <Animated.View entering={FadeInDown.duration(350)} style={s.card}>
      <View style={s.cardTop}>
        <View style={[s.catIcon, { backgroundColor: `${CAT_COLORS[cat]}1A` }]}>
          <Ionicons name={CAT_ICONS[cat]} size={18} color={CAT_COLORS[cat]} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.cardTitle}>{item.title}</Text>
          <View style={[s.catBadge, { backgroundColor: `${CAT_COLORS[cat]}14` }]}>
            <Text style={[s.catText, { color: CAT_COLORS[cat] }]}>{cat}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => onDelete(item)} style={s.delIcon}>
          <Ionicons name="trash-outline" size={18} color={colors.danger} />
        </TouchableOpacity>
      </View>
      <Text style={s.cardMsg} numberOfLines={4}>{item.message}</Text>
      <Text style={s.cardDate}>{date}</Text>
    </Animated.View>
  );
};

const AnnouncementsScreen = () => {
  const navigation = useNavigation();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("general");
  const [posting, setPosting] = useState(false);

  const fetchData = useCallback(async () => {
    try { setLoading(true); const d = await getMyAnnouncements(); setItems(d?.announcements || []); }
    catch { setItems([]); } finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  const handlePost = async () => {
    if (!title.trim() || !message.trim()) return toast.warning("Title and message are required");
    try {
      setPosting(true);
      await createAnnouncement(title.trim(), message.trim(), category);
      setTitle(""); setMessage(""); setCategory("general"); setComposing(false);
      fetchData();
    } catch (e) { toast.error(e?.response?.data?.message || "Failed to post"); }
    finally { setPosting(false); }
  };

  const handleDelete = (item) => {
    Alert.alert("Delete", `Delete "${item.title}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try { await deleteAnnouncement(item._id); setItems((p) => p.filter((a) => a._id !== item._id)); }
        catch (e) { toast.error(e?.response?.data?.message || "Delete failed"); }
      }},
    ]);
  };

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
          <Text style={s.headerTitle}>Announcements</Text>
        </View>
      </Animated.View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        {/* Compose Area */}
        {composing ? (
          <Animated.View entering={FadeInDown.duration(300)} style={s.compose}>
            <TextInput style={s.composeTitle} value={title} onChangeText={setTitle} placeholder="Announcement title" placeholderTextColor={colors.textMuted} />
            <TextInput style={s.composeMsg} value={message} onChangeText={setMessage} placeholder="Write your message..." placeholderTextColor={colors.textMuted} multiline />
            <View style={s.catRow}>
              {CATEGORIES.map((c) => (
                <TouchableOpacity key={c} onPress={() => setCategory(c)} style={[s.catChip, category === c && { backgroundColor: CAT_COLORS[c], borderColor: CAT_COLORS[c] }]}>
                  <Text style={[s.catChipText, category === c && { color: "#FFF" }]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={s.composeActions}>
              <TouchableOpacity onPress={() => setComposing(false)} style={s.composeCancel}>
                <Text style={s.composeCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handlePost} activeOpacity={0.85} style={s.postBtn} disabled={posting}>
                {posting ? <ActivityIndicator color="#FFF" size="small" /> : (
                  <><Ionicons name="send" size={16} color="#FFF" /><Text style={s.postBtnText}>Post</Text></>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        ) : (
          <TouchableOpacity onPress={() => setComposing(true)} activeOpacity={0.8} style={s.newBtn}>
            <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
            <Text style={s.newBtnText}>New Announcement</Text>
          </TouchableOpacity>
        )}

        {/* List */}
        {loading ? (
          <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(i) => i._id}
            renderItem={({ item }) => <AnnouncementCard item={item} onDelete={handleDelete} />}
            ListEmptyComponent={
              <View style={s.empty}>
                <Ionicons name="megaphone-outline" size={44} color={colors.textMuted} />
                <Text style={s.emptyTitle}>No announcements yet</Text>
                <Text style={s.emptyDesc}>Post your first update for members</Text>
              </View>
            }
            contentContainerStyle={s.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </KeyboardAvoidingView>
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
  // New btn
  newBtn: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 20, marginBottom: 12, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14, backgroundColor: `${colors.primary}10`, borderWidth: 1, borderColor: `${colors.primary}30`, borderStyle: "dashed" },
  newBtnText: { fontSize: 14, fontWeight: "700", color: colors.primary },
  // Compose
  compose: { marginHorizontal: 20, marginBottom: 12, padding: 16, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  composeTitle: { fontSize: 16, fontWeight: "700", color: colors.textPrimary, borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 10, marginBottom: 10 },
  composeMsg: { fontSize: 14, color: colors.textPrimary, minHeight: 80, textAlignVertical: "top" },
  catRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12 },
  catChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: colors.surfaceLight, borderWidth: 1, borderColor: colors.border },
  catChipText: { fontSize: 11, fontWeight: "600", color: colors.textMuted, textTransform: "capitalize" },
  composeActions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 14 },
  composeCancel: { paddingHorizontal: 16, paddingVertical: 10 },
  composeCancelText: { fontSize: 13, fontWeight: "600", color: colors.textMuted },
  postBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, backgroundColor: colors.primary },
  postBtnText: { fontSize: 13, fontWeight: "700", color: "#FFF" },
  // Card
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 16, marginBottom: 12 },
  cardTop: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  catIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 15, fontWeight: "700", color: colors.textPrimary, marginBottom: 4 },
  catBadge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  catText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  delIcon: { padding: 4 },
  cardMsg: { fontSize: 13, color: colors.textSecondary, lineHeight: 19, marginTop: 10 },
  cardDate: { fontSize: 11, color: colors.textMuted, marginTop: 8 },
  // Empty
  empty: { alignItems: "center", paddingTop: 80 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: colors.textPrimary, marginTop: 12 },
  emptyDesc: { fontSize: 13, color: colors.textMuted },
});

export default AnnouncementsScreen;
