import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Line, Rect, Polyline, Circle } from 'react-native-svg';
import colors from '../../theme/colors';

// ─── Icons ───────────────────────────────────────────────────────────────────

const HomeIcon = ({ color }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <Polyline points="9,22 9,12 15,12 15,22" />
  </Svg>
);

const ExploreIcon = ({ color }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="11" cy="11" r="8" />
    <Line x1="21" y1="21" x2="16.65" y2="16.65" />
  </Svg>
);

const ScanIcon = ({ color }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="3" y="3" width="5" height="5" rx="1" />
    <Rect x="16" y="3" width="5" height="5" rx="1" />
    <Rect x="3" y="16" width="5" height="5" rx="1" />
    <Line x1="16" y1="16" x2="21" y2="16" />
    <Line x1="16" y1="19" x2="21" y2="19" />
    <Line x1="19" y1="16" x2="19" y2="21" />
  </Svg>
);

const WeightIcon = ({ color }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
    <Path d="M6.5 8h11l1.5 12H5L6.5 8z" />
    <Line x1="12" y1="8" x2="12" y2="20" />
    <Line x1="9" y1="14" x2="15" y2="14" />
  </Svg>
);

const ProfileIcon = ({ color }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <Circle cx="12" cy="7" r="4" />
  </Svg>
);

// ─── Tab Definitions ─────────────────────────────────────────────────────────

const TABS = [
  { id: 'ExploreGyms', label: 'Explore',  Icon: ExploreIcon },
  { id: 'GymLog',     label: 'Gym',       Icon: ScanIcon    },
  { id: 'Weight',     label: 'Weight',    Icon: WeightIcon  },
  { id: 'Profile',    label: 'Profile',   Icon: ProfileIcon },
];

// ─── Component ───────────────────────────────────────────────────────────────

const BottomNavBar = ({ activeRoute, onTabPress }) => {
  const insets = useSafeAreaInsets();

  // One Animated.Value per tab — drives pill width + label opacity
  const animations = useRef(
    TABS.map((_, i) => new Animated.Value(i === 0 ? 1 : 0))
  ).current;

  const activeIndex = TABS.findIndex((t) => t.id === activeRoute);

  useEffect(() => {
    const idx = TABS.findIndex((t) => t.id === activeRoute);
    if (idx === -1) return;

    const anims = animations.map((anim, i) =>
      Animated.spring(anim, {
        toValue: i === idx ? 1 : 0,
        tension: 320,
        friction: 22,
        useNativeDriver: false, // width interpolation needs layout driver
      })
    );
    Animated.parallel(anims).start();
  }, [activeRoute]);

  return (
    <View
      style={[
        styles.wrapper,
        { paddingBottom: Math.max(insets.bottom, 12) },
      ]}
    >
      <View style={styles.bar}>
        {TABS.map((tab, i) => {
          const anim = animations[i];
          const isActive = i === activeIndex;

          // Pill width: inactive = 44 (icon only), active = 110 (icon + label)
          const pillWidth = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [44, 116],
          });

          // Background: inactive = transparent, active = brand gradient sim
          const pillBg = anim.interpolate({
            inputRange: [0, 1],
            outputRange: ['rgba(99,102,241,0)', 'rgba(99,102,241,1)'],
          });

          // Label opacity
          const labelOpacity = anim.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, 0, 1],
          });

          // Label max-width to slide in
          const labelMaxWidth = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 70],
          });

          const iconColor = isActive ? '#FFFFFF' : colors.textMuted;

          return (
            <Animated.View
              key={tab.id}
              style={[
                styles.pill,
                {
                  width: pillWidth,
                  backgroundColor: pillBg,
                },
              ]}
            >
              <TouchableOpacity
                style={styles.pillInner}
                onPress={() => onTabPress(tab.id)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={tab.label}
              >
                <tab.Icon color={iconColor} />
                <Animated.View
                  style={{
                    overflow: 'hidden',
                    maxWidth: labelMaxWidth,
                    opacity: labelOpacity,
                    marginLeft: 6,
                  }}
                >
                  <Text style={styles.label} numberOfLines={1}>
                    {tab.label}
                  </Text>
                </Animated.View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
    // Prevent touches falling through
    pointerEvents: 'box-none',
  },
  bar: {
    backgroundColor: '#1A1A28',
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    height: 58,
    width: '100%',
    maxWidth: 380,
    // Subtle border glow
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.18)',
    // Shadow
    ...Platform.select({
      ios: {
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  pill: {
    height: 42,
    borderRadius: 999,
    overflow: 'hidden',
  },
  pillInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});

export default BottomNavBar;
