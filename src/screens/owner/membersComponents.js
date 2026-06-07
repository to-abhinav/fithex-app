import React, { memo, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay,
  withRepeat, withSequence, Easing, interpolate, FadeInDown,
} from 'react-native-reanimated';
import colors from '../../theme/colors';
import { getPlanById, getInitials, formatDate, daysUntilExpiry } from './membersData';

const SW = Dimensions.get('window').width;

export const GlowOrb = ({ size, color, top, left, delay = 0 }) => {
  const p = useSharedValue(0.25);
  useEffect(() => {
    p.value = withDelay(delay, withRepeat(withSequence(
      withTiming(0.55, { duration: 3500, easing: Easing.inOut(Easing.ease) }),
      withTiming(0.25, { duration: 3500, easing: Easing.inOut(Easing.ease) }),
    ), -1, true));
  }, []);
  const st = useAnimatedStyle(() => ({
    opacity: p.value,
    transform: [{ scale: interpolate(p.value, [0.25, 0.55], [0.92, 1.08]) }],
  }));
  return <Animated.View style={[{ position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: color, top, left }, st]} />;
};

export const Skeleton = ({ w, h, r = 8, style }) => {
  const op = useSharedValue(0.3);
  useEffect(() => {
    op.value = withRepeat(withSequence(
      withTiming(0.7, { duration: 800 }), withTiming(0.3, { duration: 800 }),
    ), -1, true);
  }, []);
  const as = useAnimatedStyle(() => ({ opacity: op.value }));
  return <Animated.View style={[{ width: w, height: h, borderRadius: r, backgroundColor: colors.surfaceLight }, as, style]} />;
};

export const SearchBar = ({ value, onChangeText, onSortPress }) => (
  <Animated.View entering={FadeInDown.delay(100).duration(400)} style={s.searchRow}>
    <View style={s.searchBox}>
      <Ionicons name="search-outline" size={18} color={colors.textMuted} />
      <TextInput
        style={s.searchInput}
        placeholder="Search members…"
        placeholderTextColor={colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        returnKeyType="search"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close-circle" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      )}
    </View>
    <TouchableOpacity style={s.sortBtn} onPress={onSortPress} activeOpacity={0.7}>
      <Ionicons name="swap-vertical-outline" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  </Animated.View>
);

export const FilterPills = ({ filters, active, onSelect, stats }) => {
  const countMap = { all: stats.total, active: stats.active, inactive: stats.inactive, expired: stats.expired };
  return (
    <Animated.View entering={FadeInDown.delay(150).duration(400)} style={s.filterRow}>
      {filters.map(f => (
        <TouchableOpacity
          key={f.key} activeOpacity={0.8}
          onPress={() => onSelect(f.key)}
          style={[s.filterPill, active === f.key && s.filterActive]}
        >
          <Text style={[s.filterText, active === f.key && s.filterTextActive]}>
            {f.label}
          </Text>
          <View style={[s.filterBadge, active === f.key && s.filterBadgeActive]}>
            <Text style={[s.filterBadgeText, active === f.key && s.filterBadgeTextActive]}>
              {countMap[f.key]}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </Animated.View>
  );
};

export const StatsRow = ({ stats }) => (
  <Animated.View entering={FadeInDown.delay(200).duration(400)} style={s.statsRow}>
    <StatMini icon="people" label="Total" value={stats.total} color={colors.primary} />
    <StatMini icon="checkmark-circle" label="Active" value={stats.active} color={colors.success} />
    <StatMini icon="pause-circle" label="Inactive" value={stats.inactive} color={colors.warning} />
    <StatMini icon="time" label="Expired" value={stats.expired} color={colors.danger} />
  </Animated.View>
);

const StatMini = ({ icon, label, value, color }) => (
  <View style={s.statMini}>
    <View style={[s.statMiniIcon, { backgroundColor: `${color}1A` }]}>
      <Ionicons name={icon} size={14} color={color} />
    </View>
    <Text style={[s.statMiniVal, { color }]}>{value}</Text>
    <Text style={s.statMiniLabel}>{label}</Text>
  </View>
);

export const SortSheet = ({ visible, options, active, onSelect, onClose }) => (
  <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
    <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose}>
      <View style={s.sortSheet}>
        <View style={s.sortHandle} />
        <Text style={s.sortTitle}>Sort By</Text>
        {options.map(opt => (
          <TouchableOpacity
            key={opt.key} style={s.sortOption} activeOpacity={0.7}
            onPress={() => { onSelect(opt.key); onClose(); }}
          >
            <Text style={[s.sortOptionText, active === opt.key && { color: colors.primary, fontWeight: '700' }]}>
              {opt.label}
            </Text>
            {active === opt.key && <Ionicons name="checkmark" size={18} color={colors.primary} />}
          </TouchableOpacity>
        ))}
      </View>
    </TouchableOpacity>
  </Modal>
);

export const MemberCard = memo(({ member, index, onPress }) => {
  const plan = getPlanById(member.planId);
  const initials = getInitials(member.name);
  const statusColor = member.status === 'active' ? colors.success
    : member.status === 'inactive' ? colors.warning : colors.danger;
  const statusLabel = member.status.charAt(0).toUpperCase() + member.status.slice(1);
  const expDays = daysUntilExpiry(member.expiryDate);
  const expiring = member.status === 'active' && expDays <= 7 && expDays > 0;

  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index * 40, 400)).duration(350)}>
      <TouchableOpacity style={s.card} activeOpacity={0.8} onPress={() => onPress?.(member)}>
        {/* Avatar */}
        <View style={[s.avatar, { backgroundColor: `${plan.color}25`, borderColor: `${plan.color}40` }]}>
          <Text style={[s.avatarText, { color: plan.color }]}>{initials}</Text>
        </View>

        {/* Info */}
        <View style={s.cardInfo}>
          <View style={s.cardTopRow}>
            <Text style={s.cardName} numberOfLines={1}>{member.name}</Text>
            <View style={[s.statusDot, { backgroundColor: statusColor }]} />
          </View>

          <View style={s.planTag}>
            <View style={[s.planDot, { backgroundColor: plan.color }]} />
            <Text style={s.planText}>{plan.name}</Text>
          </View>

          <View style={s.cardBottomRow}>
            <View style={s.cardMeta}>
              <Ionicons name="footsteps-outline" size={12} color={colors.textMuted} />
              <Text style={s.metaText}>{member.checkIns}</Text>
            </View>
            <View style={s.cardMeta}>
              <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
              <Text style={s.metaText}>{formatDate(member.joinDate)}</Text>
            </View>
            {expiring && (
              <View style={s.expiryBadge}>
                <Ionicons name="alert-circle" size={11} color={colors.warning} />
                <Text style={s.expiryText}>{expDays}d</Text>
              </View>
            )}
          </View>
        </View>

        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </TouchableOpacity>
    </Animated.View>
  );
});

export const MemberDetail = ({ member, onClose }) => {
  if (!member) return null;
  const plan = getPlanById(member.planId);
  const initials = getInitials(member.name);
  const statusColor = member.status === 'active' ? colors.success
    : member.status === 'inactive' ? colors.warning : colors.danger;
  const expDays = daysUntilExpiry(member.expiryDate);

  return (
    <Modal visible={!!member} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={s.overlay}>
        {/* Tap background to close */}
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />

        {/* Sheet content pinned to bottom */}
        <View style={s.detailSheet}>
          <View style={s.sortHandle} />

          <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            {/* Profile Header */}
            <View style={s.detailHeader}>
              <View style={[s.detailAvatar, { backgroundColor: `${plan.color}20`, borderColor: `${plan.color}50` }]}>
                <Text style={[s.detailInitials, { color: plan.color }]}>{initials}</Text>
              </View>
              <Text style={s.detailName}>{member.name}</Text>
              <View style={[s.detailStatusBadge, { backgroundColor: `${statusColor}1A` }]}>
                <View style={[s.statusDot, { backgroundColor: statusColor }]} />
                <Text style={[s.detailStatusText, { color: statusColor }]}>
                  {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                </Text>
              </View>
            </View>

            {/* Quick Stats */}
            <View style={s.detailStats}>
              <DetailStat icon="footsteps" label="Check-ins" value={member.checkIns} color={colors.primary} />
              <DetailStat icon="calendar" label="Joined" value={formatDate(member.joinDate)} color={colors.accent} />
              <DetailStat icon="time" label="Expires" value={expDays > 0 ? `${expDays}d left` : 'Expired'} color={expDays > 0 ? colors.success : colors.danger} />
            </View>

            {/* Plan */}
            <View style={s.detailSection}>
              <Text style={s.detailLabel}>Plan</Text>
              <View style={[s.detailPlanCard, { borderColor: `${plan.color}40` }]}>
                <View style={[s.planDot, { backgroundColor: plan.color, width: 10, height: 10, borderRadius: 5 }]} />
                <View style={{ flex: 1 }}>
                  <Text style={s.detailPlanName}>{plan.name}</Text>
                  <Text style={s.detailPlanDur}>{plan.duration} · ₹{plan.price}</Text>
                </View>
              </View>
            </View>

            {/* Contact */}
            <View style={s.detailSection}>
              <Text style={s.detailLabel}>Contact</Text>
              <DetailRow icon="call-outline" text={member.phone} />
              <DetailRow icon="mail-outline" text={member.email} />
            </View>

            {/* Info */}
            <View style={s.detailSection}>
              <Text style={s.detailLabel}>Details</Text>
              <DetailRow icon="person-outline" text={`${member.gender}, ${member.age} yrs`} />
              <DetailRow icon="log-in-outline" text={`Last: ${member.lastCheckIn ? formatDate(member.lastCheckIn) : 'Never'}`} />
            </View>

            {/* Action Buttons */}
            <View style={s.detailActions}>
              <TouchableOpacity style={[s.actionBtn, { backgroundColor: `${colors.primary}1A` }]} activeOpacity={0.7}>
                <Ionicons name="create-outline" size={18} color={colors.primary} />
                <Text style={[s.actionBtnText, { color: colors.primary }]}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.actionBtn, { backgroundColor: `${colors.accent}1A` }]} activeOpacity={0.7}>
                <Ionicons name="chatbubble-outline" size={18} color={colors.accent} />
                <Text style={[s.actionBtnText, { color: colors.accent }]}>Message</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.actionBtn, { backgroundColor: `${colors.success}1A` }]} activeOpacity={0.7}>
                <Ionicons name="refresh-outline" size={18} color={colors.success} />
                <Text style={[s.actionBtnText, { color: colors.success }]}>Renew</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const DetailStat = ({ icon, label, value, color }) => (
  <View style={s.detStatBox}>
    <View style={[s.detStatIcon, { backgroundColor: `${color}1A` }]}>
      <Ionicons name={icon} size={16} color={color} />
    </View>
    <Text style={s.detStatVal}>{value}</Text>
    <Text style={s.detStatLabel}>{label}</Text>
  </View>
);

const DetailRow = ({ icon, text }) => (
  <View style={s.detRow}>
    <Ionicons name={icon} size={16} color={colors.primary} style={{ width: 22 }} />
    <Text style={s.detRowText}>{text}</Text>
  </View>
);

export const EmptyState = ({ searchQuery }) => (
  <View style={s.empty}>
    <View style={s.emptyIcon}>
      <Ionicons name={searchQuery ? "search-outline" : "people-outline"} size={40} color={colors.secondary} />
    </View>
    <Text style={s.emptyTitle}>{searchQuery ? 'No results' : 'No members yet'}</Text>
    <Text style={s.emptySubtitle}>
      {searchQuery ? `No members match "${searchQuery}"` : 'Members will appear here once added'}
    </Text>
  </View>
);

const s = StyleSheet.create({
  // Search
  searchRow: { flexDirection: 'row', gap: 10, marginBottom: 12, paddingHorizontal: 20 },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 14, paddingHorizontal: 14, height: 46,
  },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '500', color: colors.textPrimary },
  sortBtn: {
    width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },

  // Filters
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 14, paddingHorizontal: 20 },
  filterPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  filterActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  filterTextActive: { color: colors.textPrimary },
  filterBadge: {
    minWidth: 20, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surfaceLight, paddingHorizontal: 5,
  },
  filterBadgeActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
  filterBadgeText: { fontSize: 10, fontWeight: '800', color: colors.textMuted },
  filterBadgeTextActive: { color: colors.textPrimary },

  // Stats
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16, paddingHorizontal: 20 },
  statMini: {
    flex: 1, alignItems: 'center', backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingVertical: 12,
  },
  statMiniIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  statMiniVal: { fontSize: 16, fontWeight: '900' },
  statMiniLabel: { fontSize: 9, fontWeight: '600', color: colors.textMuted, marginTop: 1 },

  // Card
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 20, marginBottom: 10,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 16, padding: 14,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 16, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '800' },
  cardInfo: { flex: 1 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  cardName: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, flex: 1, marginRight: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  planTag: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 },
  planDot: { width: 6, height: 6, borderRadius: 3 },
  planText: { fontSize: 11, fontWeight: '600', color: colors.textSecondary },
  cardBottomRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 11, fontWeight: '500', color: colors.textMuted },
  expiryBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
    backgroundColor: `${colors.warning}1A`,
  },
  expiryText: { fontSize: 10, fontWeight: '700', color: colors.warning },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end',
  },
  sortSheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingBottom: 40, paddingTop: 12,
  },
  sortHandle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: colors.textMuted,
    alignSelf: 'center', marginBottom: 16, opacity: 0.4,
  },
  sortTitle: { fontSize: 16, fontWeight: '800', color: colors.textPrimary, marginBottom: 14 },
  sortOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  sortOptionText: { fontSize: 14, fontWeight: '500', color: colors.textSecondary },

  // Detail Sheet
  detailSheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingBottom: 40, paddingTop: 12, maxHeight: '85%',
  },
  detailHeader: { alignItems: 'center', marginBottom: 20 },
  detailAvatar: {
    width: 72, height: 72, borderRadius: 24, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  detailInitials: { fontSize: 24, fontWeight: '800' },
  detailName: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, marginBottom: 8 },
  detailStatusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
  },
  detailStatusText: { fontSize: 12, fontWeight: '700' },

  // Detail Stats
  detailStats: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  detStatBox: {
    flex: 1, alignItems: 'center', backgroundColor: colors.surfaceLight,
    borderRadius: 14, paddingVertical: 14,
  },
  detStatIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  detStatVal: { fontSize: 14, fontWeight: '800', color: colors.textPrimary },
  detStatLabel: { fontSize: 10, fontWeight: '600', color: colors.textMuted, marginTop: 2 },

  // Detail Sections
  detailSection: { marginBottom: 16 },
  detailLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  detailPlanCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.surfaceLight, borderRadius: 12, borderWidth: 1,
    padding: 12,
  },
  detailPlanName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  detailPlanDur: { fontSize: 12, fontWeight: '500', color: colors.textMuted, marginTop: 2 },
  detRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  detRowText: { fontSize: 14, fontWeight: '500', color: colors.textPrimary },

  // Actions
  detailActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    height: 44, borderRadius: 12,
  },
  actionBtnText: { fontSize: 13, fontWeight: '700' },

  // Empty
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
    backgroundColor: `${colors.secondary}18`, borderWidth: 1, borderColor: `${colors.secondary}30`,
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginBottom: 8 },
  emptySubtitle: { fontSize: 13, fontWeight: '500', color: colors.textSecondary, textAlign: 'center', lineHeight: 19 },
});
