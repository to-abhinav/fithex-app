import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, Dimensions, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import colors from '../../theme/colors';
import { DATA_BY_PERIOD, PERIOD_LABELS } from './analyticsData';
import {
  GlowOrb, KpiCard, Section, RevenueChart, PeakChart,
  GrowthChart, RenewalChurnChart, Heatmap, RevByPlanBars,
  Leaderboard, MemberBar, PlanBars, StatPill, Skeleton, fmt,
} from './analyticsComponents';

const { width: SW } = Dimensions.get('window');

// Skeleton 
const SkeletonScreen = () => (
  <View style={s.scroll}>
    <View style={{ flexDirection: 'row', gap: 10, marginBottom: 18 }}>
      <Skeleton w={100} h={36} r={20} /><Skeleton w={100} h={36} r={20} /><Skeleton w={120} h={36} r={20} />
    </View>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
      {[1,2,3,4].map(i => <Skeleton key={i} w={(SW - 50) / 2} h={120} r={18} />)}
    </View>
    <Skeleton w={SW - 40} h={200} r={18} style={{ marginBottom: 14 }} />
    <Skeleton w={SW - 40} h={160} r={18} style={{ marginBottom: 14 }} />
    <Skeleton w={SW - 40} h={180} r={18} style={{ marginBottom: 14 }} />
  </View>
);

// Main Screen
const AnalyticsScreen = () => {
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const data = DATA_BY_PERIOD[period];
  const rev = period === '30d' ? data.revenue.thisMonth : period === '7d' ? data.revenue.thisMonth : data.revenue.thisMonth;
  const busiest = [...data.peakHours].sort((a, b) => b.checkIns - a.checkIns)[0];

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate API call 
    setTimeout(() => setRefreshing(false), 1200);
  }, []);

  const handlePeriod = useCallback((p) => {
    setLoading(true);
    setPeriod(p);
    setTimeout(() => setLoading(false), 600);
  }, []);

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" />

      {/* Background */}
      <LinearGradient colors={[`${colors.accent}47`, `${colors.primary}1F`, 'rgba(0,0,0,0)']} locations={[0, 0.45, 1]} style={s.bgGrad} />
      <GlowOrb size={300} color={`${colors.accent}24`} top={-80} left={SW / 2 - 150} delay={0} />
      <GlowOrb size={220} color={`${colors.primary}1A`} top={200} left={-80} delay={1200} />
      <GlowOrb size={180} color={`${colors.secondary}14`} top={550} left={SW - 120} delay={2400} />

      {/* Header */}
      <Animated.View entering={FadeInDown.delay(0).duration(600)} style={s.header}>
        <Text style={s.headerLabel}>GYM MANAGEMENT</Text>
        <Text style={s.headerTitle}>Analytics</Text>
      </Animated.View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} colors={[colors.accent]} progressBackgroundColor={colors.surface} />}
      >
        {/* Date Range Picker */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={s.periodRow}>
          {Object.keys(DATA_BY_PERIOD).map((p) => (
            <TouchableOpacity key={p} onPress={() => handlePeriod(p)} activeOpacity={0.8}
              style={[s.periodPill, period === p && s.periodActive]}>
              <Text style={[s.periodText, period === p && s.periodTextActive]}>{PERIOD_LABELS[p]}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {loading ? <SkeletonScreen /> : (
          <>
            {/* KPI Grid */}
            <View style={s.kpiGrid}>
              <KpiCard icon="cash-outline" label="Revenue" numVal={rev} prefix="₹" trend="+18%" trendUp color={colors.success} delay={150} />
              <KpiCard icon="people" label="Active Members" numVal={data.members.active} trend="+5" trendUp color={colors.primary} delay={200} />
              <KpiCard icon="trending-up" label="Retention" numVal={data.members.retentionRate} suffix="%" trend="+2.3%" trendUp color={colors.accent} delay={250} />
              <KpiCard icon="person-add" label="New Members" numVal={data.members.newThisMonth} trend="+4" trendUp color={colors.secondary} delay={300} />
            </View>

            {/* Revenue Overview */}
            <Section title="Revenue Overview" icon="bar-chart-outline" delay={350}>
              <View style={s.revSummary}>
                <Text style={s.revBig}>{fmt(rev)}</Text>
                <Text style={s.revSub}>{PERIOD_LABELS[period].toLowerCase()}</Text>
              </View>
              <RevenueChart data={data.dailyRevenue} />
            </Section>

            {/* Revenue By Plan */}
            <Section title="Revenue by Plan" icon="wallet-outline" delay={400}>
              <RevByPlanBars data={data.revenueByPlan} />
            </Section>

            {/* Member Growth */}
            <Section title="Member Growth (6 Months)" icon="analytics-outline" delay={450}>
              <GrowthChart data={data.memberGrowth} />
            </Section>

            {/* Member Composition */}
            <Section title="Member Composition" icon="people-outline" delay={500}>
              <View style={s.memberRow}>
                <Text style={s.memberBig}>{data.members.total}</Text>
                <Text style={s.memberSub}>total members</Text>
              </View>
              <MemberBar active={data.members.active} inactive={data.members.inactive} total={data.members.total} />
            </Section>

            {/* Plan Distribution */}
            <Section title="Plan Distribution" icon="grid-outline" delay={550}>
              <PlanBars data={data.planBreakdown} />
            </Section>

            {/* Attendance Heatmap */}
            <Section title="Attendance Heatmap" icon="calendar-outline" delay={600}>
              <Heatmap data={data.attendanceHeatmap} />
            </Section>

            {/* Renewals vs Cancellations */}
            <Section title="Renewals vs Cancellations" icon="repeat-outline" delay={650}>
              <RenewalChurnChart data={data.renewalVsChurn} />
            </Section>

            {/* Peak Hours */}
            <Section title="Peak Hours (Last 30 Days)" icon="time-outline" delay={700}>
              <PeakChart data={data.peakHours} />
              <View style={s.peakHighlight}>
                <Ionicons name="flash" size={14} color={colors.accent} />
                <Text style={s.peakText}>
                  Busiest: <Text style={{ color: colors.accent, fontWeight: '800' }}>{busiest?.hour}</Text> ({busiest?.checkIns} check-ins)
                </Text>
              </View>
            </Section>

            {/* Top Members Leaderboard */}
            <Section title="Top Members" icon="trophy-outline" delay={750}>
              <Leaderboard data={data.topMembers} />
            </Section>

            {/* Quick Stats Footer */}
            <Animated.View entering={FadeInDown.delay(800).duration(400)} style={s.footerRow}>
              <StatPill icon="arrow-down-outline" label="Cancelled" value={data.members.churnedThisMonth} color={colors.danger} />
              <StatPill icon="pause-circle-outline" label="Inactive" value={data.members.inactive} color={colors.warning} />
              <StatPill icon="resize-outline" label="Capacity" value={`${data.members.active}/100`} color={colors.primary} />
            </Animated.View>

            <View style={{ height: 100 }} />
          </>
        )}
      </ScrollView>
    </View>
  );
};

//  Styles 
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  bgGrad: { position: 'absolute', top: 0, left: 0, right: 0, height: 360 },
  header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 8 },
  headerLabel: { fontSize: 10, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 2, fontWeight: '700' },
  headerTitle: { fontSize: 26, fontWeight: '800', color: colors.textPrimary, marginTop: 4 },
  scroll: { paddingHorizontal: 20, paddingTop: 8 },
  periodRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  periodPill: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  periodActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  periodText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  periodTextActive: { color: colors.textPrimary },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  revSummary: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 4 },
  revBig: { fontSize: 28, fontWeight: '900', color: colors.textPrimary },
  revSub: { fontSize: 12, fontWeight: '500', color: colors.textMuted },
  memberRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  memberBig: { fontSize: 28, fontWeight: '900', color: colors.textPrimary },
  memberSub: { fontSize: 12, fontWeight: '500', color: colors.textMuted },
  peakHighlight: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: `${colors.accent}12` },
  peakText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  footerRow: { flexDirection: 'row', gap: 10, marginTop: 2 },
});

export default AnalyticsScreen;
