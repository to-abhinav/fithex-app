import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Line, Circle, Ellipse, Rect } from 'react-native-svg';
import colors from '../../theme/colors';

// ─── Icons ───────────────────────────────────────────────────────────────────

const ExploreIcon = ({ color }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="11" cy="11" r="8" />
    <Line x1="21" y1="21" x2="16.65" y2="16.65" />
  </Svg>
);

/** Barbell / gym icon — replaces old QR scan icon */
const GymLogIcon = ({ color }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    {/* bar */}
    <Line x1="6.5" y1="12" x2="17.5" y2="12" />
    {/* left plates */}
    <Rect x="2" y="9.5" width="2.5" height="5" rx="1" />
    <Rect x="4.5" y="10.5" width="2" height="3" rx="0.5" />
    {/* right plates */}
    <Rect x="17.5" y="10.5" width="2" height="3" rx="0.5" />
    <Rect x="19.5" y="9.5" width="2.5" height="5" rx="1" />
  </Svg>
);

/** Scale / balance icon — replaces old weight icon */
const WeightIcon = ({ color }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    {/* scale platform */}
    <Path d="M4 20h16" />
    {/* central pole */}
    <Line x1="12" y1="20" x2="12" y2="8" />
    {/* beam */}
    <Line x1="5" y1="8" x2="19" y2="8" />
    {/* left pan */}
    <Path d="M5 8 C5 5 2 5 2 8" />
    {/* right pan */}
    <Path d="M19 8 C19 5 22 5 22 8" />
    {/* pivot circle */}
    <Circle cx="12" cy="8" r="1.2" fill={color} stroke="none" />
  </Svg>
);

const ProfileIcon = ({ color }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <Circle cx="12" cy="7" r="4" />
  </Svg>
);


const TABS = [
  { id: 'ExploreGyms', label: 'Explore', Icon: ExploreIcon, accent: '#6366F1' },
  { id: 'GymLog',      label: 'Gym',     Icon: GymLogIcon,  accent: '#EA580C' },
  { id: 'Weight',      label: 'Weight',  Icon: WeightIcon,  accent: '#34d399' },
  { id: 'Profile',     label: 'Profile', Icon: ProfileIcon, accent: '#8B5CF6' },
];


const LiquidRipple = ({ triggerRef, color }) => {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (triggerRef) {
      triggerRef.current = () => {
        scale.setValue(0);
        opacity.setValue(0.6);
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1,
            duration: 480,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 480,
            useNativeDriver: true,
          }),
        ]).start();
      };
    }
  }, []);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: color,
        top: -14,
        left: -14,
        transform: [{ scale }],
        opacity,
      }}
    />
  );
};

// ─── Component ───────────────────────────────────────────────────────────────

const BottomNavBar = ({ activeRoute, onTabPress }) => {
  const insets = useSafeAreaInsets();

  // One Animated.Value per tab — drives pill width + label opacity
  const animations = useRef(
    TABS.map((_, i) => new Animated.Value(i === 0 ? 1 : 0))
  ).current;

  // One ripple trigger ref per tab
  const rippleRefs = useRef(TABS.map(() => ({ current: null }))).current;

  const activeIndex = TABS.findIndex((t) => t.id === activeRoute);

  useEffect(() => {
    const idx = TABS.findIndex((t) => t.id === activeRoute);
    if (idx === -1) return;

    const anims = animations.map((anim, i) =>
      Animated.spring(anim, {
        toValue: i === idx ? 1 : 0,
        tension: 280,
        friction: 20,
        useNativeDriver: false,
      })
    );
    Animated.parallel(anims).start();
  }, [activeRoute]);

  const handlePress = useCallback((tab, i) => {
    if (rippleRefs[i]?.current) rippleRefs[i].current();
    setTimeout(() => onTabPress(tab.id), 120);
  }, [onTabPress]);

  return (
    <View
      style={[
        styles.wrapper,
        { paddingBottom: Math.max(insets.bottom, 14) },
      ]}
    >
      <View style={styles.bar}>
        {TABS.map((tab, i) => {
          const anim = animations[i];
          const isActive = i === activeIndex;

          const pillWidth = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [52, 120],
          });

          const pillBg = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [`${tab.accent}00`, tab.accent],
          });

          const labelOpacity = anim.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, 0, 1],
          });

          // Label slide-in
          const labelMaxWidth = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 72],
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
              {/* Liquid ripple layer */}
              <LiquidRipple triggerRef={rippleRefs[i]} color={tab.accent} />

              <TouchableOpacity
                style={styles.pillInner}
                onPress={() => handlePress(tab, i)}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={tab.label}
              >
                <tab.Icon color={iconColor} />
                <Animated.View
                  style={{
                    overflow: 'hidden',
                    maxWidth: labelMaxWidth,
                    opacity: labelOpacity,
                    marginLeft: 7,
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
    pointerEvents: 'box-none',
  },
  bar: {
    backgroundColor: '#1A1A28',
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    height: 70,          // ← taller from 58
    width: '100%',
    maxWidth: 390,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.18)',
    ...Platform.select({
      ios: {
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 24,
      },
      android: {
        elevation: 24,
      },
    }),
  },
  pill: {
    height: 52,          // ← taller pill from 42
    borderRadius: 999,
    overflow: 'hidden',
  },
  pillInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
});

export default BottomNavBar;
