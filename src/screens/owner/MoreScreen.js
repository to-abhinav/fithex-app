import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Dimensions,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import colors from "../../theme/colors";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import { usePendingRequests } from "../../context/PendingRequestContext";
import { useNotifications } from "../../context/NotificationContext";
import { getMyGym } from "../../api/gymService";
import api from "../../api/axios";

const { width: SW } = Dimensions.get("window");
const TILE_GAP = 12;
const TILE_WIDTH = (SW - 40 - TILE_GAP) / 2;

const GlowOrb = ({ size, color, top, left, delay = 0 }) => (
  <Animated.View
    entering={FadeInDown.delay(delay).duration(1200)}
    pointerEvents="none"
    style={{
      position: "absolute",
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: color,
      top,
      left,
      opacity: 0.6,
    }}
  />
);

const CategoryLabel = ({ icon, label, delay }) => (
  <Animated.View
    entering={FadeInDown.delay(delay).duration(400)}
    style={styles.categoryRow}
  >
    <View style={styles.categoryDot} />
    <Ionicons name={icon} size={14} color={colors.textMuted} />
    <Text style={styles.categoryLabel}>{label}</Text>
  </Animated.View>
);

const ActionTile = ({
  icon,
  title,
  subtitle,
  accent,
  badge,
  delay,
  onPress,
  fullWidth,
  destructive,
}) => (
  <Animated.View
    entering={FadeInDown.delay(delay).springify().damping(18).stiffness(140)}
    style={[
      styles.tile,
      fullWidth && styles.tileFullWidth,
      destructive && styles.tileDestructive,
    ]}
  >
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={styles.tileInner}
    >
      {/* Icon + Badge Row */}
      <View style={styles.tileTopRow}>
        <View
          style={[
            styles.tileIconWrap,
            {
              backgroundColor: destructive
                ? `${colors.danger}1A`
                : `${accent}1A`,
            },
          ]}
        >
          <Ionicons
            name={icon}
            size={22}
            color={destructive ? colors.danger : accent}
          />
        </View>
        {badge > 0 && (
          <View style={styles.tileBadge}>
            <Text style={styles.tileBadgeText}>
              {badge > 99 ? "99+" : badge}
            </Text>
          </View>
        )}
      </View>

      {/* Title */}
      <Text
        style={[styles.tileTitle, destructive && { color: colors.danger }]}
        numberOfLines={1}
      >
        {title}
      </Text>

      {/* Subtitle */}
      {subtitle ? (
        <Text style={styles.tileSubtitle} numberOfLines={2}>
          {subtitle}
        </Text>
      ) : null}

      {/* Arrow hint */}
      {!destructive && (
        <View style={styles.tileArrow}>
          <Ionicons
            name="chevron-forward"
            size={14}
            color={colors.textMuted}
          />
        </View>
      )}
    </TouchableOpacity>
  </Animated.View>
);

//  Main Screen
const MoreScreen = () => {
  const { signOut } = useAuth();
  const navigation = useNavigation();
  const toast = useToast();
  const { count: pendingCount, refresh: refreshPending } = usePendingRequests();
  const { unreadCount } = useNotifications();
  const [ownerInfo, setOwnerInfo] = useState({ name: "", profileImage: null, gymName: "" });

  //  Fetch owner info + pending count 
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      const fetchData = async () => {
        try {
          refreshPending();

          const [profileRes, gymData] = await Promise.allSettled([
            api.get("/auth/me"),
            getMyGym(),
          ]);

          if (cancelled) return;

          // Owner profile
          const user = profileRes.status === "fulfilled" ? profileRes.value?.data : null;
          const gym = gymData.status === "fulfilled" ? (gymData.value?.gym || gymData.value) : null;

          setOwnerInfo({
            name: user?.name || "",
            profileImage: user?.profileImage || null,
            gymName: gym?.name || "",
          });
        } catch {
          // silently fail
        }
      };

      fetchData();
      return () => {
        cancelled = true;
      };
    }, [refreshPending])
  );

  //  Logout handler 
  const handleLogout = useCallback(() => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => signOut(),
      },
    ]);
  }, [signOut]);

  //  Coming Soon handler 
  const comingSoon = useCallback((name) => {
    toast.info(`${name} is being built. Stay tuned!`, "Coming Soon");
  }, [toast]);

  // Tile definitions ─
  const TILES = useMemo(
    () => ({
      members: {
        label: "Member Management",
        icon: "people-outline",
        tiles: [
          {
            id: "requests",
            icon: "person-add-outline",
            title: "Requests",
            subtitle: "Approve or reject join requests",
            accent: "#3B82F6",
            badge: pendingCount,
            onPress: () => navigation.navigate("MembershipRequests"),
          },
          {
            id: "entry",
            icon: "log-in-outline",
            title: "Entry Log",
            subtitle: "Today's check-ins & outs",
            accent: "#3B82F6",
            onPress: () => navigation.navigate("EntryLog"),
          },
        ],
      },
      plans: {
        label: "Plans & Payments",
        icon: "wallet-outline",
        tiles: [
          {
            id: "plans",
            icon: "pricetag-outline",
            title: "Manage Plans",
            subtitle: "Create, edit, toggle plans",
            accent: "#10B981",
            onPress: () => navigation.navigate("ManagePlans"),
          },
          {
            id: "payments",
            icon: "card-outline",
            title: "Payments",
            subtitle: "View payment records",
            accent: "#10B981",
            onPress: () => navigation.navigate("PaymentHistory"),
          },
        ],
      },
      communication: {
        label: "Communication",
        icon: "chatbubbles-outline",
        tiles: [
          {
            id: "notifications",
            icon: "notifications-outline",
            title: "Notifications",
            subtitle: "View alerts & updates",
            accent: "#6366F1",
            badge: unreadCount,
            onPress: () => navigation.navigate("Notifications"),
          },
          {
            id: "announcements",
            icon: "megaphone-outline",
            title: "Announcements",
            subtitle: "Post updates to members",
            accent: "#F59E0B",
            onPress: () => navigation.navigate("Announcements"),
          },
          {
            id: "reviews",
            icon: "star-outline",
            title: "Reviews",
            subtitle: "View reviews, post replies",
            accent: "#F59E0B",
            onPress: () => navigation.navigate("Reviews"),
          },
        ],
      },
      operations: {
        label: "Gym Operations",
        icon: "settings-outline",
        tiles: [
          {
            id: "closures",
            icon: "calendar-outline",
            title: "Closures",
            subtitle: "Schedule holidays & closures",
            accent: "#8B5CF6",
            onPress: () => navigation.navigate("GymClosures"),
          },
          {
            id: "profile",
            icon: "person-circle-outline",
            title: "Owner Profile",
            subtitle: "Edit your personal info",
            accent: "#8B5CF6",
            onPress: () => navigation.navigate("OwnerProfile"),
          },
        ],
      },
    }),
    [pendingCount, unreadCount, comingSoon, navigation]
  );

  // Compute stagger delays 
  let tileIndex = 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Ambient Background */}
      <LinearGradient
        colors={[`${colors.secondary}30`, `${colors.primary}18`, "rgba(0,0,0,0)"]}
        locations={[0, 0.45, 1]}
        style={styles.bgGrad}
      />
      <GlowOrb
        size={280}
        color={`${colors.secondary}20`}
        top={-90}
        left={SW / 2 - 140}
        delay={0}
      />
      <GlowOrb
        size={200}
        color={`${colors.primary}14`}
        top={300}
        left={-80}
        delay={800}
      />
      <GlowOrb
        size={160}
        color={`${colors.accent}10`}
        top={600}
        left={SW - 100}
        delay={1600}
      />

      {/* ── Header  */}
      <Animated.View
        entering={FadeInDown.delay(0).duration(600)}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerLabel}>GYM MANAGEMENT</Text>
            <Text style={styles.headerTitle}>More</Text>
            {ownerInfo.gymName ? (
              <Text style={styles.headerGymName} numberOfLines={1}>
                {ownerInfo.gymName}
              </Text>
            ) : null}
          </View>

          {/* Owner Avatar */}
          <View style={styles.avatarWrap}>
            {ownerInfo.profileImage ? (
              <Image
                source={{ uri: ownerInfo.profileImage }}
                style={styles.avatarImage}
              />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitial}>
                  {ownerInfo.name ? ownerInfo.name.charAt(0).toUpperCase() : "O"}
                </Text>
              </View>
            )}
            <View style={styles.avatarBadge}>
              <Ionicons name="shield-checkmark" size={10} color="#FFFFFF" />
            </View>
          </View>
        </View>
      </Animated.View>

      {/* ── Scrollable Content  */}
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {Object.entries(TILES).map(([key, category]) => {
          const categoryDelay = tileIndex * 80 + 100;

          return (
            <View key={key} style={styles.categoryGroup}>
              {/* Category Label */}
              <CategoryLabel
                icon={category.icon}
                label={category.label}
                delay={categoryDelay}
              />

              {/* Tile Grid */}
              <View style={styles.tileGrid}>
                {category.tiles.map((tile) => {
                  const delay = ++tileIndex * 80 + 120;
                  return (
                    <ActionTile
                      key={tile.id}
                      icon={tile.icon}
                      title={tile.title}
                      subtitle={tile.subtitle}
                      accent={tile.accent}
                      badge={tile.badge}
                      delay={delay}
                      onPress={tile.onPress}
                    />
                  );
                })}
              </View>
            </View>
          );
        })}

        {/* ── Logout Tile  */}
        <Animated.View
          entering={FadeInDown.delay(++tileIndex * 80 + 120)
            .springify()
            .damping(18)
            .stiffness(140)}
          style={styles.logoutWrap}
        >
          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.75}
            style={styles.logoutTile}
          >
            <View style={styles.logoutIconWrap}>
              <Ionicons name="log-out-outline" size={20} color={colors.danger} />
            </View>
            <Text style={styles.logoutText}>Sign Out</Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={`${colors.danger}80`}
            />
          </TouchableOpacity>
        </Animated.View>

        {/* Bottom spacer for tab bar */}
        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
};

//  Styles 
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  bgGrad: { position: "absolute", top: 0, left: 0, right: 0, height: 380 },

  // Header
  header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 12 },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLabel: {
    fontSize: 10,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 2,
    fontWeight: "700",
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.textPrimary,
    marginTop: 4,
  },
  headerGymName: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    marginTop: 3,
  },

  // Avatar
  avatarWrap: {
    position: "relative",
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: `${colors.primary}60`,
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: `${colors.primary}30`,
    borderWidth: 2,
    borderColor: `${colors.primary}60`,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.primary,
  },
  avatarBadge: {
    position: "absolute",
    bottom: -3,
    right: -3,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },

  // Scroll
  scroll: { paddingHorizontal: 20, paddingTop: 4 },

  // Category
  categoryGroup: { marginBottom: 20 },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    paddingLeft: 2,
  },
  categoryDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textMuted,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },

  // Tile Grid
  tileGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: TILE_GAP,
  },

  // Tile
  tile: {
    width: TILE_WIDTH,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    overflow: "hidden",
  },
  tileFullWidth: {
    width: "100%",
  },
  tileDestructive: {
    borderColor: `${colors.danger}30`,
    backgroundColor: `${colors.danger}08`,
  },
  tileInner: {
    padding: 16,
    minHeight: 140,
    justifyContent: "flex-start",
  },

  // Tile Top Row (icon + badge)
  tileTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  tileIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  // Badge
  tileBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  tileBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  // Tile 
  tileTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  tileSubtitle: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.textMuted,
    lineHeight: 17,
  },

  // Arrow
  tileArrow: {
    position: "absolute",
    bottom: 14,
    right: 14,
    opacity: 0.5,
  },

  // Logout
  logoutWrap: {
    marginTop: 8,
  },
  logoutTile: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${colors.danger}0A`,
    borderWidth: 1,
    borderColor: `${colors.danger}20`,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  logoutIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: `${colors.danger}1A`,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: colors.danger,
  },
});

export default MoreScreen;
