import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import colors from "../../../theme/colors";


//  Stat 
const StatCard = ({ icon, label, value, color, delay }) => (
  <Animated.View entering={FadeInDown.delay(delay).duration(400)} style={styles.statCard}>
    <View style={[styles.statIconWrap, { backgroundColor: `${color}1A` }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </Animated.View>
);

//  Info 
const InfoRow = ({ icon, label, value, onPress }) => {
  if (!value) return null;
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper onPress={onPress} activeOpacity={0.7} style={styles.infoRow}>
      <Ionicons name={icon} size={16} color={colors.primary} style={styles.infoIcon} />
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, onPress && { color: colors.primary }]}>{value}</Text>
      </View>
      {onPress && <Ionicons name="open-outline" size={14} color={colors.textMuted} />}
    </Wrapper>
  );
};

//  Section
const SectionCard = ({ title, icon, children, delay = 0 }) => (
  <Animated.View entering={FadeInDown.delay(delay).duration(400)} style={styles.sectionCard}>
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={16} color={colors.primary} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    {children}
  </Animated.View>
);

// Main Component 
const GymDashboard = ({ gym, onEdit, onRefresh }) => {
  const address = gym.address || {};
  const timings = gym.timings || [];
  const amenities = gym.amenities || [];
  const equipment = gym.equipment || [];
  const social = gym.socialLinks || {};
  const rating = gym.rating || {};

  const fullAddress = [address.street, address.city, address.state, address.pincode]
    .filter(Boolean)
    .join(", ");

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        <Animated.View entering={FadeInDown.delay(50).duration(500)} style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.gymName}>{gym.name}</Text>
              {gym.description ? (
                <Text style={styles.gymDesc} numberOfLines={3}>{gym.description}</Text>
              ) : null}
            </View>
          </View>

          {/* Badges */}
          <View style={styles.badgeRow}>
            <View style={[styles.badge, gym.isActive ? styles.badgeActive : styles.badgeInactive]}>
              <View style={[styles.badgeDot, { backgroundColor: gym.isActive ? colors.success : colors.danger }]} />
              <Text style={[styles.badgeText, { color: gym.isActive ? colors.success : colors.danger }]}>
                {gym.isActive ? "Active" : "Inactive"}
              </Text>
            </View>
            {gym.isVerified && (
              <View style={[styles.badge, styles.badgeVerified]}>
                <Ionicons name="checkmark-circle" size={13} color={colors.accent} />
                <Text style={[styles.badgeText, { color: colors.accent }]}>Verified</Text>
              </View>
            )}
            <View style={[styles.badge, styles.badgeGender]}>
              <Ionicons name="people-outline" size={13} color={colors.secondary} />
              <Text style={[styles.badgeText, { color: colors.secondary }]}>{gym.genderPolicy || "Unisex"}</Text>
            </View>
          </View>
        </Animated.View>

        {/* ── Stats Row  */}
        <View style={styles.statsRow}>
          <StatCard icon="people" label="Members" value={gym.currentMembers || 0} color={colors.primary} delay={120} />
          <StatCard icon="resize" label="Capacity" value={gym.maxCapacity || 100} color={colors.accent} delay={180} />
          <StatCard icon="star" label="Rating" value={rating.average?.toFixed(1) || "0.0"} color={colors.warning} delay={240} />
        </View>

        {/* ── Contact ── */}
        <SectionCard title="Contact" icon="call-outline" delay={280}>
          <InfoRow icon="call-outline" label="Phone" value={gym.contactNumber} onPress={() => Linking.openURL(`tel:${gym.contactNumber}`)} />
          {gym.whatsappNumber && <InfoRow icon="logo-whatsapp" label="WhatsApp" value={gym.whatsappNumber} onPress={() => Linking.openURL(`https://wa.me/${gym.whatsappNumber}`)} />}
          {gym.email && <InfoRow icon="mail-outline" label="Email" value={gym.email} onPress={() => Linking.openURL(`mailto:${gym.email}`)} />}
          {gym.website && <InfoRow icon="globe-outline" label="Website" value={gym.website} onPress={() => Linking.openURL(gym.website)} />}
        </SectionCard>

        {/* ── Address ── */}
        <SectionCard title="Address" icon="location-outline" delay={340}>
          <Text style={styles.addressText}>{fullAddress || "Not set"}</Text>
          {gym.location?.coordinates?.[0] !== 0 && gym.location?.coordinates?.[1] !== 0 && (
            <View style={styles.gpsTag}>
              <Ionicons name="navigate" size={12} color={colors.success} />
              <Text style={styles.gpsTagText}>GPS coordinates set</Text>
            </View>
          )}
        </SectionCard>

        {/* ── Schedule ─ */}
        {timings.length > 0 && (
          <SectionCard title="Schedule" icon="time-outline" delay={400}>
            {timings.map((t, i) => (
              <View key={i} style={styles.schedRow}>
                <Text style={[styles.schedDay, t.isClosed && styles.schedClosed]}>{t.day?.substring(0, 3)}</Text>
                <Text style={[styles.schedTime, t.isClosed && styles.schedClosed]}>
                  {t.isClosed ? "Closed" : `${t.openTime || "—"} – ${t.closeTime || "—"}`}
                </Text>
              </View>
            ))}
          </SectionCard>
        )}

        {amenities.length > 0 && (
          <SectionCard title="Amenities" icon="grid-outline" delay={460}>
            <View style={styles.chipGrid}>
              {amenities.map((a) => (
                <View key={a} style={styles.chip}>
                  <Text style={styles.chipText}>{a}</Text>
                </View>
              ))}
            </View>
          </SectionCard>
        )}

        {/* ── Equipment  */}
        {equipment.length > 0 && (
          <SectionCard title="Equipment" icon="barbell-outline" delay={520}>
            <View style={styles.chipGrid}>
              {equipment.map((e) => (
                <View key={e} style={styles.tagChip}>
                  <Text style={styles.tagText}>{e}</Text>
                </View>
              ))}
            </View>
          </SectionCard>
        )}

        {/* ── Policies ─ */}
        <SectionCard title="Policies" icon="shield-checkmark-outline" delay={580}>
          <InfoRow icon="people-outline" label="Gender Policy" value={gym.genderPolicy || "Unisex"} />
          <InfoRow icon="shield-checkmark-outline" label="Minimum Age" value={`${gym.minimumAge || 16} years`} />
          <InfoRow icon="resize-outline" label="Max Capacity" value={`${gym.maxCapacity || 100} members`} />
        </SectionCard>

        {/* ── Social Links  */}
        {(social.instagram || social.facebook || social.youtube) && (
          <SectionCard title="Social Links" icon="share-social-outline" delay={640}>
            {social.instagram && <InfoRow icon="logo-instagram" label="Instagram" value={social.instagram} onPress={() => Linking.openURL(social.instagram)} />}
            {social.facebook && <InfoRow icon="logo-facebook" label="Facebook" value={social.facebook} onPress={() => Linking.openURL(social.facebook)} />}
            {social.youtube && <InfoRow icon="logo-youtube" label="YouTube" value={social.youtube} onPress={() => Linking.openURL(social.youtube)} />}
          </SectionCard>
        )}



        {/* ── Gym ID ─── */}
        <Text selectable style={styles.gymIdText}>Gym ID: {gym._id}</Text>
      </ScrollView>

      {/* ── Edit Button  */}
      <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.editSection}>
        <TouchableOpacity onPress={onEdit} activeOpacity={0.85} style={styles.editButton}>
          <Ionicons name="create-outline" size={20} color={colors.textPrimary} />
          <Text style={styles.editButtonText}>Edit Gym Details</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

// ─── Styles 
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 20 },

  // Hero
  heroCard: {
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 20,
  },
  heroTop: { flexDirection: "row", alignItems: "flex-start" },
  gymName: { fontSize: 22, fontWeight: "900", color: colors.textPrimary, marginBottom: 6 },
  gymDesc: { fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
  badge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  badgeActive: { backgroundColor: `${colors.success}1A` },
  badgeInactive: { backgroundColor: `${colors.danger}1A` },
  badgeVerified: { backgroundColor: `${colors.accent}1A` },
  badgeGender: { backgroundColor: `${colors.secondary}1A` },
  badgeDot: { width: 7, height: 7, borderRadius: 4 },
  badgeText: { fontSize: 12, fontWeight: "700" },

  // Stats
  statsRow: { flexDirection: "row", marginHorizontal: 20, gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1, alignItems: "center",
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 16, paddingVertical: 16,
  },
  statIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: "center", justifyContent: "center", marginBottom: 8,
  },
  statValue: { fontSize: 18, fontWeight: "800", color: colors.textPrimary },
  statLabel: { fontSize: 11, fontWeight: "600", color: colors.textMuted, marginTop: 2 },

  // Section
  sectionCard: {
    marginHorizontal: 20, marginBottom: 12,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 16, padding: 16,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: colors.textPrimary },

  // Info rows
  infoRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8 },
  infoIcon: { marginRight: 12, width: 20 },
  infoLabel: { fontSize: 11, fontWeight: "600", color: colors.textMuted },
  infoValue: { fontSize: 14, fontWeight: "600", color: colors.textPrimary, marginTop: 1 },

  // Address
  addressText: { fontSize: 14, fontWeight: "600", color: colors.textPrimary, lineHeight: 20 },
  gpsTag: {
    flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10,
    alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 10, backgroundColor: `${colors.success}14`,
  },
  gpsTagText: { fontSize: 12, fontWeight: "600", color: colors.success },

  // Schedule
  schedRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5 },
  schedDay: { fontSize: 13, fontWeight: "700", color: colors.textSecondary, width: 36 },
  schedTime: { fontSize: 13, fontWeight: "500", color: colors.textPrimary },
  schedClosed: { color: colors.textMuted, fontStyle: "italic" },

  // Chips
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
    backgroundColor: `${colors.primary}1A`,
  },
  chipText: { fontSize: 12, fontWeight: "600", color: colors.primary },
  tagChip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
    backgroundColor: colors.surfaceLight,
  },
  tagText: { fontSize: 12, fontWeight: "600", color: colors.textSecondary },

  // Gym ID
  gymIdText: {
    fontSize: 11, color: colors.textMuted, fontWeight: "500",
    textAlign: "center", marginTop: 8, marginBottom: 20,
  },

  // Edit button
  editSection: {
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 100,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  editButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    height: 54, borderRadius: 16, backgroundColor: colors.primary,
  },
  editButtonText: { fontSize: 16, fontWeight: "700", color: colors.textPrimary },
});

export default GymDashboard;
