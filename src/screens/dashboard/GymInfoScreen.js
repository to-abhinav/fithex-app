import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Linking,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { getGymById } from "../../api/gymService";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  FadeInDown,
  FadeInUp,
  FadeIn,
  Easing,
  interpolate,
  SlideInRight,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const GlowOrb = ({ size, color, top, left, delay = 0 }) => {
  const pulse = useSharedValue(0.25);

  useEffect(() => {
    pulse.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.55, { duration: 3500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.25, { duration: 3500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: pulse.value,
    transform: [{ scale: interpolate(pulse.value, [0.25, 0.55], [0.92, 1.08]) }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          top,
          left,
        },
        style,
      ]}
    />
  );
};

// ─── Section Header ────────────────────────────────────────────────────────────
const SectionHeader = ({ icon, title, delay = 0 }) => (
  <Animated.View
    entering={FadeInDown.delay(delay).springify()}
    style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}
  >
    <View
      style={{
        width: 30,
        height: 30,
        borderRadius: 9,
        backgroundColor: "rgba(99,102,241,0.15)",
        borderWidth: 1,
        borderColor: "rgba(99,102,241,0.25)",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons name={icon} size={15} color="#a5b4fc" />
    </View>
    <Text style={{ fontSize: 14, fontWeight: "700", color: "rgba(255,255,255,0.85)" }}>
      {title}
    </Text>
  </Animated.View>
);

// ─── Info Row --───
const InfoRow = ({ icon, label, value, onPress, accent, delay = 0 }) => (
  <Animated.View entering={FadeInDown.delay(delay).springify()}>
    <TouchableOpacity
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.05)",
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: accent
            ? `${accent}18`
            : "rgba(255,255,255,0.05)",
          borderWidth: 1,
          borderColor: accent ? `${accent}30` : "rgba(255,255,255,0.08)",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 14,
        }}
      >
        <Ionicons name={icon} size={16} color={accent || "rgba(165,180,252,0.8)"} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 2 }}>
          {label}
        </Text>
        <Text style={{ fontSize: 14, color: accent || "rgba(255,255,255,0.85)", fontWeight: "500" }}>
          {value}
        </Text>
      </View>
      {onPress && (
        <Ionicons name="open-outline" size={14} color="rgba(165,180,252,0.4)" />
      )}
    </TouchableOpacity>
  </Animated.View>
);

// ─── Amenity Chip ──────────────────────────────────────────────────────────────
const AMENITY_META = {
  AC:                { icon: "snow-outline",          color: "#38bdf8" },
  Parking:           { icon: "car-outline",            color: "#a78bfa" },
  Locker:            { icon: "lock-closed-outline",    color: "#fbbf24" },
  Shower:            { icon: "water-outline",          color: "#34d399" },
  Steam:             { icon: "flame-outline",          color: "#fb923c" },
  Sauna:             { icon: "sunny-outline",          color: "#f472b6" },
  Cardio:            { icon: "heart-outline",          color: "#f87171" },
  Crossfit:          { icon: "barbell-outline",        color: "#6366f1" },
  Yoga:              { icon: "body-outline",           color: "#a5b4fc" },
  Zumba:             { icon: "musical-notes-outline",  color: "#e879f9" },
  "Personal Trainer":{ icon: "person-outline",         color: "#10b981" },
  WiFi:              { icon: "wifi-outline",           color: "#60a5fa" },
  "Protein Bar":     { icon: "nutrition-outline",      color: "#fb923c" },
  Cafe:              { icon: "cafe-outline",           color: "#f59e0b" },
};

const AmenityChip = ({ name, delay }) => {
  const meta = AMENITY_META[name] || { icon: "checkmark-circle-outline", color: "#a5b4fc" };
  return (
    <Animated.View entering={FadeIn.delay(delay)}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 12,
          backgroundColor: `${meta.color}15`,
          borderWidth: 1,
          borderColor: `${meta.color}30`,
          margin: 4,
        }}
      >
        <Ionicons name={meta.icon} size={13} color={meta.color} />
        <Text style={{ fontSize: 12, color: meta.color, fontWeight: "600" }}>{name}</Text>
      </View>
    </Animated.View>
  );
};

// ─── Equipment Chip ────────────────────────────────────────────────────────────
const EquipmentChip = ({ name, delay }) => (
  <Animated.View entering={FadeIn.delay(delay)}>
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingHorizontal: 11,
        paddingVertical: 7,
        borderRadius: 10,
        backgroundColor: "rgba(249,115,22,0.1)",
        borderWidth: 1,
        borderColor: "rgba(249,115,22,0.22)",
        margin: 3,
      }}
    >
      <Ionicons name="barbell-outline" size={12} color="#fb923c" />
      <Text style={{ fontSize: 12, color: "#fb923c", fontWeight: "600" }}>{name}</Text>
    </View>
  </Animated.View>
);

const SOCIAL_META = {
  instagram: { icon: "logo-instagram", color: "#e1306c", label: "Instagram" },
  facebook:  { icon: "logo-facebook",  color: "#1877f2", label: "Facebook"  },
  youtube:   { icon: "logo-youtube",   color: "#ff0000", label: "YouTube"   },
};

const SocialLinkBtn = ({ platform, url, delay }) => {
  const meta = SOCIAL_META[platform];
  if (!meta || !url) return null;
  return (
    <Animated.View entering={FadeIn.delay(delay)} style={{ flex: 1 }}>
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => Linking.openURL(url)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 7,
          paddingVertical: 11,
          borderRadius: 14,
          backgroundColor: `${meta.color}18`,
          borderWidth: 1,
          borderColor: `${meta.color}35`,
        }}
      >
        <Ionicons name={meta.icon} size={17} color={meta.color} />
        <Text style={{ fontSize: 12, fontWeight: "700", color: meta.color }}>
          {meta.label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Policy Badge ─────────────────────────────────────────────────────────────
const GENDER_META = {
  "Unisex":      { icon: "people-outline",      color: "#a5b4fc", bg: "rgba(99,102,241,0.12)"  },
  "Male Only":   { icon: "man-outline",          color: "#60a5fa", bg: "rgba(96,165,250,0.12)"  },
  "Female Only": { icon: "woman-outline",        color: "#f472b6", bg: "rgba(244,114,182,0.12)" },
};

const PolicyBadge = ({ icon, label, value, color, bg, delay }) => (
  <Animated.View entering={FadeIn.delay(delay)} style={{ flex: 1 }}>
    <View
      style={{
        alignItems: "center",
        paddingVertical: 14,
        borderRadius: 16,
        backgroundColor: bg,
        borderWidth: 1,
        borderColor: `${color}30`,
        gap: 6,
      }}
    >
      <View
        style={{
          width: 38, height: 38, borderRadius: 12,
          backgroundColor: `${color}20`,
          alignItems: "center", justifyContent: "center",
        }}
      >
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.7 }}>
        {label}
      </Text>
      <Text style={{ fontSize: 14, fontWeight: "800", color }}>
        {value}
      </Text>
    </View>
  </Animated.View>
);

// ─── Timing Row --
const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAYS_FULL  = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const TimingRow = ({ timing, isToday, delay }) => {
  const dayShort = DAYS_SHORT[DAYS_FULL.indexOf(timing.day)] || timing.day.slice(0, 3);
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 10,
          borderBottomWidth: 1,
          borderBottomColor: "rgba(255,255,255,0.04)",
          backgroundColor: isToday ? "rgba(99,102,241,0.06)" : "transparent",
          paddingHorizontal: isToday ? 10 : 0,
          borderRadius: isToday ? 10 : 0,
          marginHorizontal: isToday ? -10 : 0,
        }}
      >
        <View style={{ width: 52 }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: isToday ? "800" : "600",
              color: isToday ? "#a5b4fc" : "rgba(255,255,255,0.5)",
            }}
          >
            {dayShort}
          </Text>
          {isToday && (
            <Text style={{ fontSize: 9, color: "#6366f1", fontWeight: "700", marginTop: 1 }}>
              TODAY
            </Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          {timing.isClosed ? (
            <Text style={{ fontSize: 13, color: "#f87171", fontWeight: "600" }}>Closed</Text>
          ) : (
            <Text
              style={{
                fontSize: 13,
                fontWeight: isToday ? "700" : "500",
                color: isToday ? "#fff" : "rgba(255,255,255,0.7)",
              }}
            >
              {timing.openTime} – {timing.closeTime}
            </Text>
          )}
        </View>
        {!timing.isClosed && (
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: isToday ? "#10b981" : "rgba(255,255,255,0.12)",
            }}
          />
        )}
      </View>
    </Animated.View>
  );
};

// ─── Occupancy Bar ────────────────────────────────────────────────────────────
const OccupancyBar = ({ current, max, delay }) => {
  const pct = Math.min((current / max) * 100, 100);
  const color = pct < 50 ? "#10b981" : pct < 80 ? "#fbbf24" : "#f87171";
  const label = pct < 50 ? "Not Busy" : pct < 80 ? "Moderate" : "Peak";

  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()}>
      <View style={{ marginTop: 4 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
          <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: "500" }}>
            Current Occupancy
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color }} />
            <Text style={{ fontSize: 12, fontWeight: "700", color }}>{label}</Text>
          </View>
        </View>

        <View
          style={{
            height: 8,
            backgroundColor: "rgba(255,255,255,0.08)",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <LinearGradient
            colors={pct < 50 ? ["#10b981", "#34d399"] : pct < 80 ? ["#f59e0b", "#fbbf24"] : ["#ef4444", "#f87171"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ width: `${pct}%`, height: "100%", borderRadius: 8 }}
          />
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}>
          <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: "500" }}>
            {current} / {max} members
          </Text>
          <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: "500" }}>
            {Math.round(pct)}%
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

// ─── Gallery Modal ────────────────────────────────────────────────────────────
const GalleryModal = ({ visible, images, initialIndex, onClose }) => {
  const [activeIndex, setActiveIndex] = useState(initialIndex || 0);

  useEffect(() => {
    setActiveIndex(initialIndex || 0);
  }, [initialIndex]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.95)", justifyContent: "center" }} onPress={onClose}>
        <View style={{ position: "absolute", top: 52, right: 20, zIndex: 10 }}>
          <TouchableOpacity
            onPress={onClose}
            style={{
              width: 38, height: 38, borderRadius: 19,
              backgroundColor: "rgba(255,255,255,0.1)",
              borderWidth: 1, borderColor: "rgba(255,255,255,0.15)",
              alignItems: "center", justifyContent: "center",
            }}
          >
            <Ionicons name="close" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={images}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={activeIndex}
          getItemLayout={(_, index) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * index, index })}
          onMomentumScrollEnd={(e) => setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH))}
          renderItem={({ item }) => (
            <Pressable style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.65, justifyContent: "center" }}>
              <Image
                source={{ uri: item }}
                style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.65 }}
                resizeMode="contain"
              />
            </Pressable>
          )}
          keyExtractor={(_, i) => String(i)}
        />

        <View style={{ flexDirection: "row", justifyContent: "center", gap: 6, paddingTop: 16 }}>
          {images.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === activeIndex ? 20 : 6,
                height: 6, borderRadius: 3,
                backgroundColor: i === activeIndex ? "#a5b4fc" : "rgba(255,255,255,0.2)",
              }}
            />
          ))}
        </View>
      </Pressable>
    </Modal>
  );
};

// ─── Star Rating ──────────────────────────────────────────────────────────────
const StarRating = ({ rating }) => (
  <View style={{ flexDirection: "row", gap: 2 }}>
    {[1, 2, 3, 4, 5].map((star) => (
      <Ionicons
        key={star}
        name={
          star <= Math.floor(rating)
            ? "star"
            : star - rating < 1 && star - rating > 0
            ? "star-half"
            : "star-outline"
        }
        size={14}
        color="#fbbf24"
      />
    ))}
  </View>
);

// ─── Cover Image with Skeleton ────────────────────────────────────────────────
const CoverImage = ({ uri }) => {
  const [loaded, setLoaded] = useState(false);
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 900, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({ opacity: interpolate(shimmer.value, [0, 1], [0.3, 0.6]) }));

  return (
    <View style={{ width: "100%", height: 220 }}>
      {!loaded && (
        <Animated.View
          style={[{ width: "100%", height: "100%", backgroundColor: "#1E1E2E", position: "absolute" }, shimmerStyle]}
        />
      )}
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
          onLoad={() => setLoaded(true)}
        />
      ) : (
        <LinearGradient
          colors={["rgba(99,102,241,0.3)", "rgba(139,92,246,0.15)", "#09090f"]}
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Ionicons name="fitness-outline" size={52} color="rgba(165,180,252,0.4)" />
        </LinearGradient>
      )}
    </View>
  );
};



// ─── Helpers --───
const todayDayName = () =>
  ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][
    new Date().getDay()
  ];

const isGymOpen = (timings) => {
  const today = todayDayName();
  const todayTiming = timings.find((t) => t.day === today);
  if (!todayTiming || todayTiming.isClosed) return false;
  const now = new Date();
  const [oh, om] = todayTiming.openTime.split(":").map(Number);
  const [ch, cm] = todayTiming.closeTime.split(":").map(Number);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  return nowMin >= oh * 60 + om && nowMin <= ch * 60 + cm;
};

// ─── Main Screen ────────────────────────────────────────────────────────────
const GymInfoScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const gymId = route.params?.gymId;

  const [gym, setGym] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [galleryVisible, setGalleryVisible] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("info"); // info | timings | gallery

  const fetchGym = useCallback(async () => {
    if (!gymId) {
      setError("No gym ID provided");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await getGymById(gymId);
      setGym(data);
    } catch (err) {
      const msg =
        err.response?.data?.message || err.message || "Failed to load gym";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [gymId]);

  useEffect(() => {
    fetchGym();
  }, [fetchGym]);

  // ── Loading ──
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#09090f", alignItems: "center", justifyContent: "center" }}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, marginTop: 14, fontWeight: "500" }}>
          Loading gym info…
        </Text>
      </View>
    );
  }

  if (error || !gym) {
    return (
      <View style={{ flex: 1, backgroundColor: "#09090f", alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
        <StatusBar barStyle="light-content" />
        <Ionicons name="alert-circle-outline" size={48} color="#f87171" />
        <Text style={{ color: "#f87171", fontSize: 15, fontWeight: "700", marginTop: 14, textAlign: "center" }}>
          {error || "Gym not found"}
        </Text>
        <TouchableOpacity
          onPress={fetchGym}
          activeOpacity={0.85}
          style={{
            marginTop: 20, paddingHorizontal: 28, paddingVertical: 12,
            borderRadius: 14, backgroundColor: "rgba(99,102,241,0.15)",
            borderWidth: 1, borderColor: "rgba(99,102,241,0.3)",
          }}
        >
          <Text style={{ color: "#a5b4fc", fontWeight: "700", fontSize: 14 }}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 14 }}>
          <Text style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const open = isGymOpen(gym.timings);
  const todayTiming = gym.timings.find((t) => t.day === todayDayName());
  const allImages = [
    ...(gym?.images?.cover ? [gym.images.cover] : []),
    ...(gym?.images?.gallery || []),
  ];

  return (
    <View style={{ flex: 1, backgroundColor: "#09090f" }}>
      <StatusBar barStyle="light-content" />

      {/* ── Background gradient  */}
      <LinearGradient
        colors={["rgba(99,102,241,0.3)", "rgba(139,92,246,0.1)", "rgba(0,0,0,0)"]}
        locations={[0, 0.5, 1]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 400 }}
      />

      {/* ── Glow Orbs  */}
      <GlowOrb size={280} color="rgba(99,102,241,0.12)" top={-60} left={SCREEN_WIDTH / 2 - 140} delay={0} />
      <GlowOrb size={200} color="rgba(139,92,246,0.09)" top={300} left={-70} delay={1000} />
      <GlowOrb size={160} color="rgba(6,182,212,0.07)" top={600} left={SCREEN_WIDTH - 100} delay={2000} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
        stickyHeaderIndices={[2]} // makes the tab bar sticky
      >
        {/* ── Top Navigation Bar  */}
        <Animated.View
          entering={FadeInDown.delay(0).duration(500)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingTop: 52,
            paddingBottom: 12,
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10,
          }}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
            style={{
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: "rgba(9,9,15,0.75)",
              borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
              alignItems: "center", justifyContent: "center",
            }}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => Linking.openURL(`tel:${gym.contactNumber}`)}
              style={{
                width: 40, height: 40, borderRadius: 20,
                backgroundColor: "rgba(16,185,129,0.15)",
                borderWidth: 1, borderColor: "rgba(16,185,129,0.25)",
                alignItems: "center", justifyContent: "center",
              }}
            >
              <Ionicons name="call-outline" size={18} color="#34d399" />
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              style={{
                width: 40, height: 40, borderRadius: 20,
                backgroundColor: "rgba(99,102,241,0.15)",
                borderWidth: 1, borderColor: "rgba(99,102,241,0.25)",
                alignItems: "center", justifyContent: "center",
              }}
            >
              <Ionicons name="heart-outline" size={18} color="#a5b4fc" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ── Cover Image ──────────────────────────────────────────────────── */}
        <TouchableOpacity
          activeOpacity={0.95}
          onPress={() => { setGalleryIndex(0); setGalleryVisible(true); }}
        >
          <CoverImage uri={gym.images.cover} />
          <LinearGradient
            colors={["transparent", "rgba(9,9,15,0.95)"]}
            style={{
              position: "absolute", bottom: 0, left: 0, right: 0, height: 120,
            }}
          />
        </TouchableOpacity>

        {/* ── Gym Identity Card ─────────────────────────────────────────────── */}
        <Animated.View
          entering={FadeInUp.delay(200).springify()}
          style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 0, backgroundColor: "#09090f" }}
        >
          {/* Profile + Name row */}
          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 14, marginBottom: 14 }}>
            <View style={{ position: "relative" }}>
              <LinearGradient
                colors={["#6366f1", "#8b5cf6", "#06b6d4"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={{ width: 68, height: 68, borderRadius: 18, alignItems: "center", justifyContent: "center" }}
              >
                {gym.images.profile ? (
                  <Image
                    source={{ uri: gym.images.profile }}
                    style={{ width: 61, height: 61, borderRadius: 16, borderWidth: 2.5, borderColor: "#09090f" }}
                  />
                ) : (
                  <Ionicons name="fitness" size={28} color="#fff" />
                )}
              </LinearGradient>
              {/* Verified badge */}
              {gym.isVerified && (
                <View
                  style={{
                    position: "absolute", bottom: -4, right: -4,
                    width: 20, height: 20, borderRadius: 10,
                    backgroundColor: "#6366f1",
                    borderWidth: 2, borderColor: "#09090f",
                    alignItems: "center", justifyContent: "center",
                  }}
                >
                  <Ionicons name="checkmark" size={11} color="#fff" />
                </View>
              )}
            </View>

            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <Text style={{ fontSize: 20, fontWeight: "900", color: "#fff", letterSpacing: -0.5 }}>
                  {gym.name}
                </Text>
                {gym.isFeatured && (
                  <View style={{ backgroundColor: "rgba(251,191,36,0.15)", borderWidth: 1, borderColor: "rgba(251,191,36,0.3)", borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 }}>
                    <Text style={{ fontSize: 9, fontWeight: "800", color: "#fbbf24", textTransform: "uppercase", letterSpacing: 1 }}>⭐ Featured</Text>
                  </View>
                )}
              </View>

              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                <Ionicons name="location-outline" size={13} color="rgba(255,255,255,0.3)" />
                <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: "400" }} numberOfLines={1}>
                  {gym.address.street}, {gym.address.city}
                </Text>
              </View>

              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 }}>
                {/* Rating */}
                <StarRating rating={gym.rating.average} />
                <Text style={{ fontSize: 12, fontWeight: "700", color: "#fbbf24" }}>
                  {gym.rating.average.toFixed(1)}
                </Text>
                <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
                  ({gym.rating.totalReviews})
                </Text>

                {/* Open/Closed pill */}
                <View style={{ marginLeft: "auto" }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 5,
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 20,
                      backgroundColor: open ? "rgba(16,185,129,0.12)" : "rgba(248,113,113,0.12)",
                      borderWidth: 1,
                      borderColor: open ? "rgba(16,185,129,0.25)" : "rgba(248,113,113,0.25)",
                    }}
                  >
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: open ? "#10b981" : "#f87171" }} />
                    <Text style={{ fontSize: 11, fontWeight: "700", color: open ? "#34d399" : "#fca5a5" }}>
                      {open ? "Open" : "Closed"}
                    </Text>
                  </View>
                </View>
              </View>

              {todayTiming && !todayTiming.isClosed && (
                <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 4, fontWeight: "400" }}>
                  Today {todayTiming.openTime} – {todayTiming.closeTime}
                </Text>
              )}
            </View>
          </View>

          {/* Quick action buttons */}
          <Animated.View
            entering={FadeInDown.delay(300).springify()}
            style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}
          >
            {[
              {
                label: "Call",
                icon: "call",
                colors: ["#10b981", "#059669"],
                onPress: () => Linking.openURL(`tel:${gym.contactNumber}`),
              },
              {
                label: "WhatsApp",
                icon: "logo-whatsapp",
                colors: ["#25D366", "#128C7E"],
                onPress: () => Linking.openURL(`https://wa.me/${gym.whatsappNumber?.replace(/\D/g, "")}`),
              },
              {
                label: "Website",
                icon: "globe-outline",
                colors: ["#6366f1", "#8b5cf6"],
                onPress: () => gym.website && Linking.openURL(gym.website),
              },
              {
                label: "Maps",
                icon: "navigate-outline",
                colors: ["#06b6d4", "#0284c7"],
                onPress: () => Linking.openURL(`https://maps.google.com/?q=${gym.address.street},${gym.address.city}`),
              },
            ].map((btn) => (
              <TouchableOpacity
                key={btn.label}
                activeOpacity={0.85}
                onPress={btn.onPress}
                style={{ flex: 1, alignItems: "center", gap: 6 }}
              >
                <LinearGradient
                  colors={btn.colors}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={{
                    width: 46, height: 46, borderRadius: 14,
                    alignItems: "center", justifyContent: "center",
                  }}
                >
                  <Ionicons name={btn.icon} size={20} color="#fff" />
                </LinearGradient>
                <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {btn.label}
                </Text>
              </TouchableOpacity>
            ))}
          </Animated.View>

          {/* View Plans CTA */}
          <Animated.View entering={FadeInDown.delay(380).springify()} style={{ marginBottom: 20 }}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate("GymPlans", { gymId: gym._id, gymName: gym.name })}
              style={{ borderRadius: 16, overflow: "hidden" }}
            >
              <LinearGradient
                colors={["#6366f1", "#8b5cf6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  paddingVertical: 15,
                }}
              >
                <Ionicons name="ribbon-outline" size={18} color="#fff" />
                <Text style={{ fontSize: 15, fontWeight: "800", color: "#fff", letterSpacing: 0.2 }}>
                  View Plans & Pricing
                </Text>
                <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.7)" />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        {/* ── Sticky Tab Bar ───────────────────────────────────────────────── */}
        <View
          style={{
            backgroundColor: "#09090f",
            borderBottomWidth: 1,
            borderBottomColor: "rgba(255,255,255,0.06)",
            paddingHorizontal: 20,
          }}
        >
          <View style={{ flexDirection: "row", gap: 0 }}>
            {[
              { key: "info",    label: "Info",    icon: "information-circle-outline" },
              { key: "timings", label: "Timings", icon: "time-outline" },
              { key: "gallery", label: "Gallery", icon: "images-outline" },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.key}
                activeOpacity={0.7}
                onPress={() => setActiveTab(tab.key)}
                style={{
                  flex: 1, flexDirection: "row", alignItems: "center",
                  justifyContent: "center", gap: 5,
                  paddingVertical: 13,
                  borderBottomWidth: 2,
                  borderBottomColor: activeTab === tab.key ? "#6366f1" : "transparent",
                }}
              >
                <Ionicons
                  name={tab.icon}
                  size={15}
                  color={activeTab === tab.key ? "#a5b4fc" : "rgba(255,255,255,0.3)"}
                />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: activeTab === tab.key ? "700" : "500",
                    color: activeTab === tab.key ? "#a5b4fc" : "rgba(255,255,255,0.3)",
                  }}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* ── INFO TAB ────────────────────────────────────────────────────── */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {activeTab === "info" && (
          <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>

            {/* Description */}
            {!!gym.description && (
              <Animated.View
                entering={FadeInDown.delay(100).springify()}
                style={{
                  backgroundColor: "rgba(255,255,255,0.03)",
                  borderWidth: 1, borderColor: "rgba(255,255,255,0.07)",
                  borderRadius: 20, padding: 18, marginBottom: 14,
                }}
              >
                <SectionHeader icon="document-text-outline" title="About" delay={100} />
                <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 21, fontWeight: "400" }}>
                  {gym.description}
                </Text>
              </Animated.View>
            )}

            {/* Occupancy */}
            <Animated.View
              entering={FadeInDown.delay(180).springify()}
              style={{
                backgroundColor: "rgba(255,255,255,0.03)",
                borderWidth: 1, borderColor: "rgba(255,255,255,0.07)",
                borderRadius: 20, padding: 18, marginBottom: 14,
              }}
            >
              <SectionHeader icon="people-outline" title="Gym Occupancy" delay={180} />
              <OccupancyBar current={gym.currentMembers} max={gym.maxCapacity} delay={220} />
            </Animated.View>

            {/* Contact Details */}
            <Animated.View
              entering={FadeInDown.delay(260).springify()}
              style={{
                backgroundColor: "rgba(255,255,255,0.03)",
                borderWidth: 1, borderColor: "rgba(255,255,255,0.07)",
                borderRadius: 20, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 6,
                marginBottom: 14,
              }}
            >
              <SectionHeader icon="call-outline" title="Contact" delay={260} />

              <InfoRow icon="call-outline"     label="Phone"     value={gym.contactNumber}  accent="#10b981"  onPress={() => Linking.openURL(`tel:${gym.contactNumber}`)}  delay={290} />
              {gym.whatsappNumber && (
                <InfoRow icon="logo-whatsapp" label="WhatsApp" value={gym.whatsappNumber} accent="#25D366" onPress={() => Linking.openURL(`https://wa.me/${gym.whatsappNumber.replace(/\D/g,"")}`)} delay={310} />
              )}
              {gym.email && (
                <InfoRow icon="mail-outline" label="Email" value={gym.email} accent="#6366f1" onPress={() => Linking.openURL(`mailto:${gym.email}`)} delay={330} />
              )}
              {gym.website && (
                <InfoRow icon="globe-outline" label="Website" value={gym.website} accent="#a5b4fc" onPress={() => Linking.openURL(gym.website)} delay={350} />
              )}
            </Animated.View>

            {/* Address */}
            <Animated.View
              entering={FadeInDown.delay(380).springify()}
              style={{
                backgroundColor: "rgba(255,255,255,0.03)",
                borderWidth: 1, borderColor: "rgba(255,255,255,0.07)",
                borderRadius: 20, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 6,
                marginBottom: 14,
              }}
            >
              <SectionHeader icon="location-outline" title="Location" delay={380} />
              <InfoRow icon="map-outline"    label="Street"  value={gym.address.street}  delay={400} />
              <InfoRow icon="business-outline" label="City"  value={`${gym.address.city}, ${gym.address.state}`} delay={420} />
              <InfoRow icon="pin-outline"    label="Pincode" value={gym.address.pincode}  delay={440} />

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => Linking.openURL(`https://maps.google.com/?q=${gym.address.street},${gym.address.city}`)}
                style={{ marginTop: 14, marginBottom: 14 }}
              >
                <LinearGradient
                  colors={["rgba(6,182,212,0.2)", "rgba(6,182,212,0.08)"]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={{
                    flexDirection: "row", alignItems: "center", justifyContent: "center",
                    gap: 8, paddingVertical: 11, borderRadius: 14,
                    borderWidth: 1, borderColor: "rgba(6,182,212,0.25)",
                  }}
                >
                  <Ionicons name="navigate-outline" size={16} color="#06b6d4" />
                  <Text style={{ fontSize: 13, fontWeight: "700", color: "#06b6d4" }}>
                    Get Directions
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* Amenities */}
            {gym.amenities.length > 0 && (
              <Animated.View
                entering={FadeInDown.delay(460).springify()}
                style={{
                  backgroundColor: "rgba(255,255,255,0.03)",
                  borderWidth: 1, borderColor: "rgba(255,255,255,0.07)",
                  borderRadius: 20, padding: 18, marginBottom: 14,
                }}
              >
                <SectionHeader icon="star-outline" title="Amenities" delay={460} />
                <View style={{ flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4 }}>
                  {gym.amenities.map((a, i) => (
                    <AmenityChip key={a} name={a} delay={480 + i * 30} />
                  ))}
                </View>
              </Animated.View>
            )}

            {/* Equipment */}
            {gym.equipment && gym.equipment.length > 0 && (
              <Animated.View
                entering={FadeInDown.delay(500).springify()}
                style={{
                  backgroundColor: "rgba(255,255,255,0.03)",
                  borderWidth: 1, borderColor: "rgba(255,255,255,0.07)",
                  borderRadius: 20, padding: 18, marginBottom: 14,
                }}
              >
                <SectionHeader icon="barbell-outline" title="Equipment" delay={500} />
                <View style={{ flexDirection: "row", flexWrap: "wrap", marginHorizontal: -3 }}>
                  {gym.equipment.map((eq, i) => (
                    <EquipmentChip key={eq} name={eq} delay={520 + i * 25} />
                  ))}
                </View>
              </Animated.View>
            )}

            {/* Gym Policies */}
            {(gym.genderPolicy || gym.minimumAge) && (
              <Animated.View
                entering={FadeInDown.delay(560).springify()}
                style={{
                  backgroundColor: "rgba(255,255,255,0.03)",
                  borderWidth: 1, borderColor: "rgba(255,255,255,0.07)",
                  borderRadius: 20, padding: 18, marginBottom: 14,
                }}
              >
                <SectionHeader icon="shield-checkmark-outline" title="Gym Policies" delay={560} />
                <View style={{ flexDirection: "row", gap: 10 }}>
                  {gym.genderPolicy && (() => {
                    const gm = GENDER_META[gym.genderPolicy] || GENDER_META["Unisex"];
                    return (
                      <PolicyBadge
                        icon={gm.icon}
                        label="Gender Policy"
                        value={gym.genderPolicy}
                        color={gm.color}
                        bg={gm.bg}
                        delay={580}
                      />
                    );
                  })()}
                  {gym.minimumAge && (
                    <PolicyBadge
                      icon="person-outline"
                      label="Min. Age"
                      value={`${gym.minimumAge}+ yrs`}
                      color="#34d399"
                      bg="rgba(16,185,129,0.1)"
                      delay={600}
                    />
                  )}
                </View>
              </Animated.View>
            )}

            {/* Social Links */}
            {gym.socialLinks && Object.values(gym.socialLinks).some(Boolean) && (
              <Animated.View
                entering={FadeInDown.delay(620).springify()}
                style={{
                  backgroundColor: "rgba(255,255,255,0.03)",
                  borderWidth: 1, borderColor: "rgba(255,255,255,0.07)",
                  borderRadius: 20, padding: 18, marginBottom: 14,
                }}
              >
                <SectionHeader icon="share-social-outline" title="Social Media" delay={620} />
                <View style={{ flexDirection: "row", gap: 10 }}>
                  {Object.entries(gym.socialLinks).map(([platform, url], i) => (
                    <SocialLinkBtn
                      key={platform}
                      platform={platform}
                      url={url}
                      delay={640 + i * 40}
                    />
                  ))}
                </View>
              </Animated.View>
            )}

            {/* Gym Owner Profile */}
            {gym.ownerId && (
              <Animated.View
                entering={FadeInDown.delay(680).springify()}
                style={{
                  backgroundColor: "rgba(255,255,255,0.03)",
                  borderWidth: 1, borderColor: "rgba(255,255,255,0.07)",
                  borderRadius: 20, padding: 18, marginBottom: 14,
                  overflow: "hidden",
                }}
              >
                {/* Subtle gradient accent */}
                <LinearGradient
                  colors={["rgba(99,102,241,0.15)", "rgba(139,92,246,0.08)", "transparent"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ position: "absolute", top: 0, left: 0, right: 0, height: 70, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}
                />

                <SectionHeader icon="person-circle-outline" title="Gym Owner" delay={680} />

                <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 14 }}>
                  {/* Owner avatar */}
                  <LinearGradient
                    colors={["#6366f1", "#8b5cf6", "#06b6d4"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ width: 62, height: 62, borderRadius: 31, alignItems: "center", justifyContent: "center" }}
                  >
                    {gym.ownerId.profileImage ? (
                      <Image
                        source={{ uri: gym.ownerId.profileImage }}
                        style={{ width: 55, height: 55, borderRadius: 27.5, borderWidth: 2, borderColor: "#09090f" }}
                      />
                    ) : (
                      <View style={{ width: 55, height: 55, borderRadius: 27.5, backgroundColor: "#09090f", borderWidth: 2, borderColor: "#09090f", alignItems: "center", justifyContent: "center" }}>
                        <Ionicons name="person" size={24} color="rgba(165,180,252,0.6)" />
                      </View>
                    )}
                  </LinearGradient>

                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: "800", color: "#fff", letterSpacing: -0.3 }}>
                      {gym.ownerId.name || "Gym Owner"}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 }}>
                      <View style={{
                        backgroundColor: "rgba(99,102,241,0.15)",
                        borderWidth: 1, borderColor: "rgba(99,102,241,0.25)",
                        borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3,
                        flexDirection: "row", alignItems: "center", gap: 4,
                      }}>
                        <Ionicons name="shield-checkmark" size={10} color="#a5b4fc" />
                        <Text style={{ fontSize: 10, fontWeight: "700", color: "#a5b4fc" }}>Owner</Text>
                      </View>
                      {gym.ownerId.createdAt && (
                        <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: "400" }}>
                          · Since {new Date(gym.ownerId.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>

                {/* Contact details */}
                <View style={{ borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)", paddingTop: 12, gap: 8 }}>
                  {gym.ownerId.email && (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => Linking.openURL(`mailto:${gym.ownerId.email}`)}
                      style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
                    >
                      <View style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: "rgba(99,102,241,0.12)", alignItems: "center", justifyContent: "center" }}>
                        <Ionicons name="mail-outline" size={14} color="#a5b4fc" />
                      </View>
                      <Text style={{ fontSize: 13, color: "#a5b4fc", fontWeight: "500" }}>{gym.ownerId.email}</Text>
                    </TouchableOpacity>
                  )}
                  {gym.ownerId.phone && (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => Linking.openURL(`tel:${gym.ownerId.phone}`)}
                      style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
                    >
                      <View style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: "rgba(6,182,212,0.12)", alignItems: "center", justifyContent: "center" }}>
                        <Ionicons name="call-outline" size={14} color="#67e8f9" />
                      </View>
                      <Text style={{ fontSize: 13, color: "#67e8f9", fontWeight: "500" }}>{gym.ownerId.phone}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </Animated.View>
            )}

            {/* Membership CTA */}
            <Animated.View entering={FadeInDown.delay(700).springify()} style={{ marginBottom: 14 }}>
              <LinearGradient
                colors={["rgba(99,102,241,0.3)", "rgba(139,92,246,0.2)", "rgba(6,182,212,0.1)"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={{ borderRadius: 22, padding: 20, borderWidth: 1, borderColor: "rgba(99,102,241,0.3)" }}
              >
                <Text style={{ fontSize: 10, color: "rgba(165,180,252,0.5)", textTransform: "uppercase", letterSpacing: 1.5, fontWeight: "700", marginBottom: 4 }}>
                  Ready to join?
                </Text>
                <Text style={{ fontSize: 20, fontWeight: "900", color: "#fff", letterSpacing: -0.5, marginBottom: 6 }}>
                  Become a Member
                </Text>
                <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginBottom: 18, lineHeight: 18 }}>
                  Get unlimited access, personal training sessions, and more.
                </Text>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate("Payment")}
                >
                  <LinearGradient
                    colors={["#6366f1", "#8b5cf6"]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={{
                      flexDirection: "row", alignItems: "center", justifyContent: "center",
                      gap: 8, paddingVertical: 14, borderRadius: 16,
                    }}
                  >
                    <Ionicons name="flash" size={16} color="#fff" />
                    <Text style={{ fontSize: 14, fontWeight: "800", color: "#fff" }}>
                      View Plans & Pricing
                    </Text>
                    <Ionicons name="arrow-forward" size={14} color="rgba(255,255,255,0.7)" />
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </Animated.View>
          </View>
        )}

     
        {activeTab === "timings" && (
          <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>

            {/* Status banner */}
            <Animated.View entering={FadeInDown.delay(100).springify()} style={{ marginBottom: 14 }}>
              <LinearGradient
                colors={open
                  ? ["rgba(16,185,129,0.2)", "rgba(16,185,129,0.06)"]
                  : ["rgba(248,113,113,0.2)", "rgba(248,113,113,0.06)"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{
                  flexDirection: "row", alignItems: "center", gap: 12,
                  padding: 16, borderRadius: 18,
                  borderWidth: 1,
                  borderColor: open ? "rgba(16,185,129,0.25)" : "rgba(248,113,113,0.25)",
                }}
              >
                <View
                  style={{
                    width: 44, height: 44, borderRadius: 14,
                    backgroundColor: open ? "rgba(16,185,129,0.2)" : "rgba(248,113,113,0.2)",
                    alignItems: "center", justifyContent: "center",
                  }}
                >
                  <Ionicons
                    name={open ? "checkmark-circle" : "close-circle"}
                    size={22}
                    color={open ? "#34d399" : "#fca5a5"}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: "800", color: open ? "#34d399" : "#fca5a5" }}>
                    {open ? "Currently Open" : "Currently Closed"}
                  </Text>
                  {todayTiming && !todayTiming.isClosed && (
                    <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2, fontWeight: "400" }}>
                      Today: {todayTiming.openTime} – {todayTiming.closeTime}
                    </Text>
                  )}
                </View>
              </LinearGradient>
            </Animated.View>

            {/* Weekly Schedule */}
            <Animated.View
              entering={FadeInDown.delay(160).springify()}
              style={{
                backgroundColor: "rgba(255,255,255,0.03)",
                borderWidth: 1, borderColor: "rgba(255,255,255,0.07)",
                borderRadius: 20, padding: 18, marginBottom: 14,
              }}
            >
              <SectionHeader icon="calendar-outline" title="Weekly Schedule" delay={160} />
              {gym.timings.map((timing, i) => (
                <TimingRow
                  key={timing.day}
                  timing={timing}
                  isToday={timing.day === todayDayName()}
                  delay={200 + i * 50}
                />
              ))}
            </Animated.View>

            {/* Holiday note */}
            <Animated.View
              entering={FadeInDown.delay(560).springify()}
              style={{
                flexDirection: "row", gap: 10,
                backgroundColor: "rgba(251,191,36,0.07)",
                borderWidth: 1, borderColor: "rgba(251,191,36,0.18)",
                borderRadius: 14, padding: 14,
              }}
            >
              <Ionicons name="information-circle-outline" size={18} color="#fbbf24" style={{ marginTop: 1 }} />
              <Text style={{ flex: 1, fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 19, fontWeight: "400" }}>
                Timings may vary on public holidays. Contact the gym before visiting.
              </Text>
            </Animated.View>
          </View>
        )}

 
        {activeTab === "gallery" && (
          <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
            {allImages.length === 0 ? (
              <Animated.View
                entering={FadeIn.delay(100)}
                style={{ alignItems: "center", paddingVertical: 60 }}
              >
                <Ionicons name="images-outline" size={56} color="rgba(255,255,255,0.12)" />
                <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.3)", marginTop: 16, fontWeight: "500" }}>
                  No gallery photos yet
                </Text>
              </Animated.View>
            ) : (
              <>
                <Animated.View
                  entering={FadeInDown.delay(80).springify()}
                  style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}
                >
                  <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", fontWeight: "500" }}>
                    {allImages.length} photos
                  </Text>
                </Animated.View>

                {/* Masonry-style grid: 1 big + 2 small ... */}
                <View style={{ gap: 10 }}>
                  {allImages.map((img, idx) => {
                    const isWide = idx === 0; // first image is full-width hero
                    return (
                      <Animated.View
                        key={idx}
                        entering={FadeInDown.delay(100 + idx * 60).springify()}
                        style={isWide ? undefined : { flexDirection: "row", gap: 10 }}
                      >
                        {isWide ? (
                          <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={() => { setGalleryIndex(idx); setGalleryVisible(true); }}
                            style={{ borderRadius: 18, overflow: "hidden", height: 200 }}
                          >
                            <Image source={{ uri: img }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                            <LinearGradient
                              colors={["transparent", "rgba(9,9,15,0.6)"]}
                              style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 60 }}
                            />
                            <View style={{ position: "absolute", top: 12, right: 12, backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, flexDirection: "row", alignItems: "center", gap: 4 }}>
                              <Ionicons name="expand-outline" size={12} color="#fff" />
                              <Text style={{ fontSize: 11, color: "#fff", fontWeight: "600" }}>Cover</Text>
                            </View>
                          </TouchableOpacity>
                        ) : (
                          // Pair up remaining images side by side
                          idx % 2 === 1 ? (
                            <>
                              <TouchableOpacity
                                activeOpacity={0.9}
                                onPress={() => { setGalleryIndex(idx); setGalleryVisible(true); }}
                                style={{ flex: 1, borderRadius: 14, overflow: "hidden", height: 130 }}
                              >
                                <Image source={{ uri: img }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                              </TouchableOpacity>
                              {allImages[idx + 1] && (
                                <TouchableOpacity
                                  activeOpacity={0.9}
                                  onPress={() => { setGalleryIndex(idx + 1); setGalleryVisible(true); }}
                                  style={{ flex: 1, borderRadius: 14, overflow: "hidden", height: 130 }}
                                >
                                  <Image source={{ uri: allImages[idx + 1] }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                                  {idx + 1 === allImages.length - 1 && allImages.length > 6 && (
                                    <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center" }}>
                                      <Text style={{ fontSize: 20, fontWeight: "800", color: "#fff" }}>+{allImages.length - 6}</Text>
                                    </View>
                                  )}
                                </TouchableOpacity>
                              )}
                            </>
                          ) : null
                        )}
                      </Animated.View>
                    );
                  })}
                </View>
              </>
            )}
          </View>
        )}
      </ScrollView>

      {/* ── Gallery Full-Screen Modal ─────────────────────────────────────── */}
      <GalleryModal
        visible={galleryVisible}
        images={allImages}
        initialIndex={galleryIndex}
        onClose={() => setGalleryVisible(false)}
      />
    </View>
  );
};

export default GymInfoScreen;
