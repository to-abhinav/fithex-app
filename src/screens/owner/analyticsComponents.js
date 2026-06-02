import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Rect, Text as SvgText, Line, Circle, Path, Defs, LinearGradient as SvgGrad, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay,
  withRepeat, withSequence, Easing, interpolate, FadeInDown,
  runOnJS,
} from 'react-native-reanimated';
import colors from '../../theme/colors';

const SW = Dimensions.get('window').width;
export const CHART_COLORS = [colors.primary, colors.accent, colors.secondary, colors.warning, colors.success];

export const fmt = (n) => {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n}`;
};

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

export const AnimNum = ({ to, prefix = '', suffix = '', style }) => {
  const [display, setDisplay] = useState('0');
  const val = useSharedValue(0);
  useEffect(() => {
    val.value = withDelay(400, withTiming(to, { duration: 1200, easing: Easing.out(Easing.cubic) }));
    const id = setInterval(() => {
      const cur = val.value;
      if (typeof to === 'number' && to % 1 !== 0) {
        setDisplay(cur.toFixed(1));
      } else {
        setDisplay(Math.round(cur).toString());
      }
      if (Math.abs(cur - to) < 0.5) { setDisplay(to.toString()); clearInterval(id); }
    }, 30);
    return () => clearInterval(id);
  }, [to]);
  return <Text style={style}>{prefix}{display}{suffix}</Text>;
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

export const KpiCard = ({ icon, label, value, numVal, prefix, suffix, trend, trendUp, color, delay }) => (
  <Animated.View entering={FadeInDown.delay(delay).duration(400)} style={cs.kpiCard}>
    <View style={[cs.kpiIconWrap, { backgroundColor: `${color}1A` }]}>
      <Ionicons name={icon} size={18} color={color} />
    </View>
    {numVal !== undefined ? (
      <AnimNum to={numVal} prefix={prefix} suffix={suffix} style={cs.kpiValue} />
    ) : (
      <Text style={cs.kpiValue}>{value}</Text>
    )}
    <Text style={cs.kpiLabel}>{label}</Text>
    {trend !== undefined && (
      <View style={[cs.trendBadge, { backgroundColor: trendUp ? `${colors.success}1A` : `${colors.danger}1A` }]}>
        <Ionicons name={trendUp ? 'trending-up' : 'trending-down'} size={11} color={trendUp ? colors.success : colors.danger} />
        <Text style={[cs.trendText, { color: trendUp ? colors.success : colors.danger }]}>{trend}</Text>
      </View>
    )}
  </Animated.View>
);

export const Section = ({ title, icon, children, delay = 0 }) => (
  <Animated.View entering={FadeInDown.delay(delay).duration(400)} style={cs.section}>
    <View style={cs.sectionHeader}>
      <Ionicons name={icon} size={15} color={colors.accent} />
      <Text style={cs.sectionTitle}>{title}</Text>
    </View>
    {children}
  </Animated.View>
);

export const RevenueChart = ({ data }) => {
  const [tip, setTip] = useState(null);
  const W = SW - 80, H = 120;
  const maxVal = Math.max(...data.map(d => d.amount));
  const barW = (W - (data.length - 1) * 6) / data.length;
  return (
    <View style={{ marginTop: 12 }}>
      {tip !== null && (
        <View style={[cs.tooltip, { left: tip.x - 30, top: tip.y - 30 }]}>
          <Text style={cs.tooltipText}>{fmt(tip.val)}</Text>
        </View>
      )}
      <Svg width={W} height={H + 24}>
        <Defs>
          <SvgGrad id="bg" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.accent} stopOpacity="1" />
            <Stop offset="1" stopColor={colors.primary} stopOpacity="0.6" />
          </SvgGrad>
        </Defs>
        {data.map((d, i) => {
          const bH = (d.amount / maxVal) * H, x = i * (barW + 6), y = H - bH;
          return <Rect key={i} x={x} y={y} width={barW} height={bH} rx={4} fill="url(#bg)" />;
        })}
        {data.map((d, i) => (
          <SvgText key={`l${i}`} x={i * (barW + 6) + barW / 2} y={H + 16}
            fill={colors.textMuted} fontSize={10} fontWeight="600" textAnchor="middle">{d.day}</SvgText>
        ))}
      </Svg>
      <View style={[StyleSheet.absoluteFill, { flexDirection: 'row' }]}>
        {data.map((d, i) => (
          <TouchableOpacity key={i} activeOpacity={0.7}
            style={{ width: barW + 6, height: H }}
            onPress={() => setTip(tip?.val === d.amount ? null : { val: d.amount, x: i * (barW + 6) + barW / 2, y: H - (d.amount / maxVal) * H })} />
        ))}
      </View>
    </View>
  );
};

export const PeakChart = ({ data }) => {
  const f = data.filter((_, i) => i % 2 === 0);
  const W = SW - 80, H = 110;
  const mx = Math.max(...f.map(d => d.checkIns));
  const bW = (W - (f.length - 1) * 5) / f.length;
  return (
    <View style={{ marginTop: 12 }}>
      <Svg width={W} height={H + 28}>
        <Defs>
          <SvgGrad id="pk" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.secondary} stopOpacity="1" />
            <Stop offset="1" stopColor={colors.primary} stopOpacity="0.5" />
          </SvgGrad>
        </Defs>
        {[0.25, 0.5, 0.75].map((p, i) => (
          <Line key={i} x1={0} y1={H * (1 - p)} x2={W} y2={H * (1 - p)} stroke={colors.border} strokeWidth={0.8} strokeDasharray="4,4" />
        ))}
        {f.map((d, i) => {
          const bH = (d.checkIns / mx) * H, x = i * (bW + 5);
          return <Rect key={i} x={x} y={H - bH} width={bW} height={bH} rx={3} fill={d.checkIns === mx ? colors.accent : 'url(#pk)'} opacity={d.checkIns === mx ? 1 : 0.85} />;
        })}
        {f.map((d, i) => (
          <SvgText key={`l${i}`} x={i * (bW + 5) + bW / 2} y={H + 16} fill={colors.textMuted} fontSize={8} fontWeight="600" textAnchor="middle">
            {d.hour.replace(':00', '')}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
};

export const GrowthChart = ({ data }) => {
  const W = SW - 80, H = 100, pad = 10;
  const mx = Math.max(...data.map(d => d.count));
  const mn = Math.min(...data.map(d => d.count));
  const range = mx - mn || 1;
  const pts = data.map((d, i) => ({
    x: pad + (i / (data.length - 1)) * (W - pad * 2),
    y: pad + (1 - (d.count - mn) / range) * (H - pad * 2),
    count: d.count,
  }));
  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = `${linePath} L${pts[pts.length - 1].x},${H} L${pts[0].x},${H} Z`;
  return (
    <View style={{ marginTop: 12 }}>
      <Svg width={W} height={H + 24}>
        <Defs>
          <SvgGrad id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.success} stopOpacity="0.3" />
            <Stop offset="1" stopColor={colors.success} stopOpacity="0.02" />
          </SvgGrad>
        </Defs>
        {[0.25, 0.5, 0.75].map((p, i) => (
          <Line key={i} x1={0} y1={H * (1 - p)} x2={W} y2={H * (1 - p)} stroke={colors.border} strokeWidth={0.5} strokeDasharray="4,4" />
        ))}
        <Path d={areaPath} fill="url(#areaFill)" />
        <Path d={linePath} fill="none" stroke={colors.success} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={4} fill={colors.background} stroke={colors.success} strokeWidth={2} />
        ))}
        {pts.map((p, i) => (
          <SvgText key={`v${i}`} x={p.x} y={p.y - 10} fill={colors.textSecondary} fontSize={9} fontWeight="700" textAnchor="middle">{p.count}</SvgText>
        ))}
        {data.map((d, i) => (
          <SvgText key={`l${i}`} x={pts[i].x} y={H + 16} fill={colors.textMuted} fontSize={9} fontWeight="600" textAnchor="middle">{d.month}</SvgText>
        ))}
      </Svg>
    </View>
  );
};

export const RenewalChurnChart = ({ data }) => {
  const W = SW - 80, H = 90, pad = 10;
  const allVals = data.flatMap(d => [d.renewed, d.churned]);
  const mx = Math.max(...allVals), mn = Math.min(...allVals);
  const range = mx - mn || 1;
  const toP = (v, i) => ({ x: pad + (i / (data.length - 1)) * (W - pad * 2), y: pad + (1 - (v - mn) / range) * (H - pad * 2) });
  const rPts = data.map((d, i) => toP(d.renewed, i));
  const cPts = data.map((d, i) => toP(d.churned, i));
  const mkPath = (pts) => pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  return (
    <View style={{ marginTop: 12 }}>
      <Svg width={W} height={H + 24}>
        <Path d={mkPath(rPts)} fill="none" stroke={colors.success} strokeWidth={2} strokeLinecap="round" />
        <Path d={mkPath(cPts)} fill="none" stroke={colors.danger} strokeWidth={2} strokeLinecap="round" strokeDasharray="5,3" />
        {rPts.map((p, i) => <Circle key={`r${i}`} cx={p.x} cy={p.y} r={3} fill={colors.success} />)}
        {cPts.map((p, i) => <Circle key={`c${i}`} cx={p.x} cy={p.y} r={3} fill={colors.danger} />)}
        {data.map((d, i) => (
          <SvgText key={i} x={rPts[i].x} y={H + 16} fill={colors.textMuted} fontSize={9} fontWeight="600" textAnchor="middle">{d.month}</SvgText>
        ))}
      </Svg>
      <View style={cs.dualLegend}>
        <View style={cs.legendItem}><View style={[cs.legendDot, { backgroundColor: colors.success }]} /><Text style={cs.legendText}>Renewed</Text></View>
        <View style={cs.legendItem}><View style={[cs.legendDot, { backgroundColor: colors.danger }]} /><Text style={cs.legendText}>Cancelled</Text></View>
      </View>
    </View>
  );
};

export const Heatmap = ({ data }) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = [6, 8, 10, 12, 14, 16, 18, 20];
  const mx = Math.max(...data.map(d => d.intensity));
  const cellSize = (SW - 100) / hours.length;
  const getColor = (v) => {
    const pct = v / mx;
    if (pct < 0.15) return `${colors.accent}10`;
    if (pct < 0.35) return `${colors.accent}30`;
    if (pct < 0.55) return `${colors.accent}55`;
    if (pct < 0.75) return `${colors.accent}88`;
    return `${colors.accent}CC`;
  };
  return (
    <View style={{ marginTop: 8 }}>
      <View style={{ flexDirection: 'row', marginLeft: 32, marginBottom: 4 }}>
        {hours.map(h => <Text key={h} style={[cs.hmLabel, { width: cellSize }]}>{h}</Text>)}
      </View>
      {days.map(day => (
        <View key={day} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
          <Text style={cs.hmDay}>{day}</Text>
          {hours.map(hour => {
            const cell = data.find(d => d.day === day && d.hour === hour);
            return (
              <View key={hour} style={{
                width: cellSize - 2, height: cellSize - 2, borderRadius: 3,
                backgroundColor: getColor(cell?.intensity || 0), margin: 1,
              }} />
            );
          })}
        </View>
      ))}
      <View style={cs.hmLegendRow}>
        <Text style={cs.hmLegendText}>Less</Text>
        {[0.1, 0.3, 0.55, 0.75, 1].map((p, i) => (
          <View key={i} style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: getColor(mx * p), marginHorizontal: 1 }} />
        ))}
        <Text style={cs.hmLegendText}>More</Text>
      </View>
    </View>
  );
};

export const RevByPlanBars = ({ data }) => {
  const mx = Math.max(...data.map(d => d.revenue));
  return data.map((d, i) => (
    <Animated.View key={i} entering={FadeInDown.delay(i * 50).duration(300)} style={cs.planRow}>
      <View style={cs.planLabelRow}>
        <Text style={cs.planName} numberOfLines={1}>{d.planName}</Text>
        <Text style={[cs.planCount, { color: CHART_COLORS[i % CHART_COLORS.length] }]}>{fmt(d.revenue)}</Text>
      </View>
      <View style={cs.planBarBg}>
        <View style={[cs.planBarFill, { width: `${(d.revenue / mx) * 100}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }]} />
      </View>
    </Animated.View>
  ));
};

export const Leaderboard = ({ data }) => (
  <View>
    {data.map((m, i) => {
      const medalColors = [colors.warning, '#C0C0C0', '#CD7F32'];
      return (
        <Animated.View key={m._id} entering={FadeInDown.delay(i * 60).duration(300)} style={cs.lbRow}>
          <View style={[cs.lbRank, i < 3 && { backgroundColor: `${medalColors[i]}20`, borderColor: `${medalColors[i]}50` }]}>
            <Text style={[cs.lbRankText, i < 3 && { color: medalColors[i] }]}>#{i + 1}</Text>
          </View>
          <View style={[cs.lbAvatar, { backgroundColor: CHART_COLORS[i % CHART_COLORS.length] + '30' }]}>
            <Text style={[cs.lbInitials, { color: CHART_COLORS[i % CHART_COLORS.length] }]}>{m.initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={cs.lbName}>{m.name}</Text>
            <Text style={cs.lbSub}>{m.checkIns} check-ins this month</Text>
          </View>
          {i === 0 && <Ionicons name="trophy" size={18} color={colors.warning} />}
        </Animated.View>
      );
    })}
  </View>
);

export const MemberBar = ({ active, inactive, total }) => {
  const pct = (active / total) * 100;
  return (
    <View style={{ marginTop: 8 }}>
      <View style={cs.mBarBg}>
        <View style={[cs.mBarFill, { width: `${pct}%`, backgroundColor: colors.success }]} />
        <View style={[cs.mBarFill, { width: `${100 - pct}%`, backgroundColor: colors.danger }]} />
      </View>
      <View style={cs.dualLegend}>
        <View style={cs.legendItem}><View style={[cs.legendDot, { backgroundColor: colors.success }]} /><Text style={cs.legendText}>Active ({active})</Text></View>
        <View style={cs.legendItem}><View style={[cs.legendDot, { backgroundColor: colors.danger }]} /><Text style={cs.legendText}>Inactive ({inactive})</Text></View>
      </View>
    </View>
  );
};

export const PlanBars = ({ data }) => {
  const mx = Math.max(...data.map(p => p.count));
  return data.map((p, i) => (
    <Animated.View key={p._id} entering={FadeInDown.delay(i * 50).duration(300)} style={cs.planRow}>
      <View style={cs.planLabelRow}>
        <Text style={cs.planName} numberOfLines={1}>{p.planName}</Text>
        <Text style={[cs.planCount, { color: CHART_COLORS[i % CHART_COLORS.length] }]}>{p.count}</Text>
      </View>
      <View style={cs.planBarBg}>
        <View style={[cs.planBarFill, { width: `${(p.count / mx) * 100}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }]} />
      </View>
    </Animated.View>
  ));
};

// stat pill 
export const StatPill = ({ icon, label, value, color }) => (
  <View style={[cs.statPill, { borderColor: `${color}30` }]}>
    <Ionicons name={icon} size={14} color={color} />
    <View>
      <Text style={[cs.statPillVal, { color }]}>{value}</Text>
      <Text style={cs.statPillLabel}>{label}</Text>
    </View>
  </View>
);

// Component Styles 
const cs = StyleSheet.create({
  kpiCard: {
    width: (SW - 50) / 2, alignItems: 'center',
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 18, paddingVertical: 18, paddingHorizontal: 10,
  },
  kpiIconWrap: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  kpiValue: { fontSize: 20, fontWeight: '900', color: colors.textPrimary },
  kpiLabel: { fontSize: 11, fontWeight: '600', color: colors.textMuted, marginTop: 3 },
  trendBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 6, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  trendText: { fontSize: 10, fontWeight: '700' },
  section: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 18, marginBottom: 14 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  tooltip: { position: 'absolute', zIndex: 10, backgroundColor: colors.surfaceLight, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  tooltipText: { fontSize: 11, fontWeight: '700', color: colors.textPrimary },
  dualLegend: { flexDirection: 'row', gap: 20, marginTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  planRow: { marginBottom: 12 },
  planLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  planName: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, flex: 1, marginRight: 8 },
  planCount: { fontSize: 13, fontWeight: '800' },
  planBarBg: { height: 8, borderRadius: 4, backgroundColor: colors.surfaceLight, overflow: 'hidden' },
  planBarFill: { height: '100%', borderRadius: 4 },
  mBarBg: { flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', backgroundColor: colors.surfaceLight, marginTop: 12 },
  mBarFill: { height: '100%' },
  hmLabel: { fontSize: 8, fontWeight: '600', color: colors.textMuted, textAlign: 'center' },
  hmDay: { width: 28, fontSize: 9, fontWeight: '600', color: colors.textMuted },
  hmLegendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 3, marginTop: 8 },
  hmLegendText: { fontSize: 9, fontWeight: '600', color: colors.textMuted, marginHorizontal: 2 },
  lbRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  lbRank: { width: 32, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceLight, borderWidth: 1, borderColor: colors.border },
  lbRankText: { fontSize: 11, fontWeight: '800', color: colors.textMuted },
  lbAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  lbInitials: { fontSize: 13, fontWeight: '800' },
  lbName: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  lbSub: { fontSize: 11, fontWeight: '500', color: colors.textMuted, marginTop: 1 },
  statPill: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.surface, borderWidth: 1, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 10 },
  statPillVal: { fontSize: 15, fontWeight: '800' },
  statPillLabel: { fontSize: 9, fontWeight: '600', color: colors.textMuted, marginTop: 1 },
});
