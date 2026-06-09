import { useState, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, StyleSheet, StatusBar,
  Dimensions, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import colors from '../../theme/colors';
import {
  MEMBERS, STATUS_FILTERS, SORT_OPTIONS,
  getMemberStats, filterMembers, sortMembers,
} from './membersData';
import {
  GlowOrb, Skeleton, SearchBar, FilterPills,
  StatsRow, MemberCard, SortSheet, MemberDetail, EmptyState,
} from './membersComponents';

const { width: SW } = Dimensions.get('window');

const SkeletonScreen = () => (
  <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
    <Skeleton w={SW - 40} h={46} r={14} style={{ marginBottom: 12 }} />
    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
      {[1,2,3,4].map(i => <Skeleton key={i} w={70} h={36} r={20} />)}
    </View>
    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
      {[1,2,3,4].map(i => <Skeleton key={i} w={(SW - 64) / 4} h={80} r={14} />)}
    </View>
    {[1,2,3,4,5].map(i => (
      <Skeleton key={i} w={SW - 40} h={86} r={16} style={{ marginBottom: 10 }} />
    ))}
  </View>
);

const MembersScreen = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortKey, setSortKey] = useState('name_asc');
  const [sortVisible, setSortVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const stats = useMemo(() => getMemberStats(MEMBERS), []);

  // Filter + sort
  const displayMembers = useMemo(() => {
    const filtered = filterMembers(MEMBERS, statusFilter, search);
    return sortMembers(filtered, sortKey);
  }, [statusFilter, search, sortKey]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleFilterChange = useCallback((key) => {
    setLoading(true);
    setStatusFilter(key);
    setTimeout(() => setLoading(false), 300);
  }, []);

  const renderMember = useCallback(({ item, index }) => (
    <MemberCard member={item} index={index} onPress={setSelectedMember} />
  ), []);

  const keyExtractor = useCallback((item) => item._id, []);

  const ListHeader = useMemo(() => (
    <>
      <SearchBar value={search} onChangeText={setSearch} onSortPress={() => setSortVisible(true)} />
      <FilterPills filters={STATUS_FILTERS} active={statusFilter} onSelect={handleFilterChange} stats={stats} />
      <StatsRow stats={stats} />

      {/* Results Count */}
      <Animated.View entering={FadeInDown.delay(250).duration(300)} style={s.resultRow}>
        <Text style={s.resultText}>
          {displayMembers.length} member{displayMembers.length !== 1 ? 's' : ''}
        </Text>
      </Animated.View>
    </>
  ), [search, statusFilter, stats, displayMembers.length, handleFilterChange]);

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" />

      {/* Background */}
      <LinearGradient
        colors={[`${colors.secondary}47`, `${colors.primary}1F`, 'rgba(0,0,0,0)']}
        locations={[0, 0.45, 1]}
        style={s.bgGrad}
      />
      <GlowOrb size={300} color={`${colors.secondary}24`} top={-80} left={SW / 2 - 150} delay={0} />
      <GlowOrb size={220} color={`${colors.primary}1A`} top={200} left={-80} delay={1200} />
      <GlowOrb size={180} color={`${colors.accent}14`} top={500} left={SW - 100} delay={2400} />

      {/* Header */}
      <Animated.View entering={FadeInDown.delay(0).duration(600)} style={s.header}>
        <Text style={s.headerLabel}>GYM MANAGEMENT</Text>
        <Text style={s.headerTitle}>Members</Text>
      </Animated.View>

      {loading ? <SkeletonScreen /> : (
        <FlatList
          data={displayMembers}
          renderItem={renderMember}
          keyExtractor={keyExtractor}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={<EmptyState searchQuery={search} />}
          ListFooterComponent={<View style={{ height: 100 }} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.secondary}
              colors={[colors.secondary]}
              progressBackgroundColor={colors.surface}
            />
          }
        />
      )}

      {/* Sort Bottom Sheet */}
      <SortSheet
        visible={sortVisible}
        options={SORT_OPTIONS}
        active={sortKey}
        onSelect={setSortKey}
        onClose={() => setSortVisible(false)}
      />

      <MemberDetail
        member={selectedMember}
        onClose={() => setSelectedMember(null)}
      />
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  bgGrad: { position: 'absolute', top: 0, left: 0, right: 0, height: 360 },
  header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 12 },
  headerLabel: {
    fontSize: 10, color: colors.textMuted, textTransform: 'uppercase',
    letterSpacing: 2, fontWeight: '700',
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: colors.textPrimary, marginTop: 4 },
  listContent: { paddingTop: 4 },
  resultRow: { paddingHorizontal: 22, marginBottom: 10 },
  resultText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
});

export default MembersScreen;
