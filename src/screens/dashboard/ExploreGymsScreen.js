import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import * as Location from "expo-location";
import { getNearbyGyms } from "../../api/gymService";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  FlatList,
  Dimensions,
  Linking,
  Image,
  ActivityIndicator,
  RefreshControl,
  Pressable,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
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
  ZoomIn,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - 40;

// ─── Glow Orb --──
const GlowOrb = ({ size, color, top, left, delay = 0 }) => {
  const pulse = useSharedValue(0.2);
  useEffect(() => {
    pulse.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.5, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.2, { duration: 4000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: pulse.value,
    transform: [{ scale: interpolate(pulse.value, [0.2, 0.5], [0.9, 1.1]) }],
  }));
  return (
    <Animated.View
      style={[
        { position: "absolute", width: size, height: size, borderRadius: size / 2, backgroundColor: color, top, left },
        style,
      ]}
    />
  );
};

// ─── Star Rating ──────────────────────────────────────────────────────────────
const StarRating = ({ rating, size = 12 }) => (
  <View style={{ flexDirection: "row", gap: 1 }}>
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
        size={size}
        color="#fbbf24"
      />
    ))}
  </View>
);

// ─── Distance Badge ────────────────────────────────────────────────────────────
const DistanceBadge = ({ distance }) => (
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: "rgba(6,182,212,0.12)",
      borderWidth: 1,
      borderColor: "rgba(6,182,212,0.25)",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 20,
    }}
  >
    <Ionicons name="navigate-outline" size={10} color="#06b6d4" />
    <Text style={{ fontSize: 10, color: "#06b6d4", fontWeight: "700" }}>{distance} km</Text>
  </View>
);

// ─── Amenity Icon Strip ────────────────────────────────────────────────────────
const AMENITY_META = {
  AC: { icon: "snow-outline", color: "#38bdf8" },
  Parking: { icon: "car-outline", color: "#a78bfa" },
  Locker: { icon: "lock-closed-outline", color: "#fbbf24" },
  Shower: { icon: "water-outline", color: "#34d399" },
  Steam: { icon: "flame-outline", color: "#fb923c" },
  Sauna: { icon: "sunny-outline", color: "#f472b6" },
  Cardio: { icon: "heart-outline", color: "#f87171" },
  Crossfit: { icon: "barbell-outline", color: "#6366f1" },
  Yoga: { icon: "body-outline", color: "#a5b4fc" },
  "Personal Trainer": { icon: "person-outline", color: "#10b981" },
  WiFi: { icon: "wifi-outline", color: "#60a5fa" },
  "Protein Bar": { icon: "nutrition-outline", color: "#fb923c" },
  Pool: { icon: "water-outline", color: "#38bdf8" },
  Boxing: { icon: "fitness-outline", color: "#ef4444" },
};

const AmenityIcon = ({ name }) => {
  const meta = AMENITY_META[name] || { icon: "checkmark-circle-outline", color: "#a5b4fc" };
  return (
    <View
      style={{
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: `${meta.color}18`,
        borderWidth: 1,
        borderColor: `${meta.color}30`,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons name={meta.icon} size={13} color={meta.color} />
    </View>
  );
};

// ─── Occupancy Indicator ──────────────────────────────────────────────────────
const OccupancyIndicator = ({ current, max }) => {
  const pct = Math.min((current / max) * 100, 100);
  const color = pct < 50 ? "#10b981" : pct < 80 ? "#fbbf24" : "#f87171";
  const label = pct < 50 ? "Not Busy" : pct < 80 ? "Moderate" : "Peak";
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
      <Text style={{ fontSize: 10, color, fontWeight: "700" }}>{label}</Text>
    </View>
  );
};

// ─── Price Tier --
const PriceTier = ({ tier }) => {
  const tiers = ["₹", "₹₹", "₹₹₹"];
  return (
    <View style={{ flexDirection: "row", gap: 1 }}>
      {tiers.map((t, i) => (
        <Text
          key={i}
          style={{
            fontSize: 10,
            fontWeight: "700",
            color: i < tier ? "#fbbf24" : "rgba(255,255,255,0.15)",
          }}
        >
          ₹
        </Text>
      ))}
    </View>
  );
};

// ─── Gym Card --──
const GymCard = ({ gym, index, onPress, onSave }) => {
  const [saved, setSaved] = useState(gym.isSaved || false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const scale = useSharedValue(1);

  const today = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][
    new Date().getDay()
  ];
  const todayTiming = gym.timings?.find((t) => t.day === today);
  const isOpen = todayTiming && !todayTiming.isClosed;

  const handleSave = () => {
    setSaved((s) => !s);
    onSave?.(gym._id, !saved);
  };

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 100).springify()}
      style={[{ marginBottom: 16 }, cardStyle]}
    >
      <TouchableOpacity
        activeOpacity={0.93}
        onPress={() => onPress(gym)}
        style={{
          backgroundColor: "rgba(20,20,30,0.9)",
          borderRadius: 20,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.07)",
          overflow: "hidden",
        }}
      >
        {/* Cover Image */}
        <View style={{ height: 170, width: "100%", backgroundColor: "#14141E" }}>
          {!imgLoaded && (
            <View
              style={{
                ...StyleSheet_abs,
                backgroundColor: "#1E1E2E",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="fitness-outline" size={32} color="rgba(165,180,252,0.2)" />
            </View>
          )}
          {gym.images?.cover && (
            <Image
              source={{ uri: gym.images.cover }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
              onLoad={() => setImgLoaded(true)}
            />
          )}

          {/* Image gradient overlay */}
          <LinearGradient
            colors={["transparent", "rgba(9,9,15,0.85)"]}
            style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 80 }}
          />

          {/* Top row badges */}
          <View
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              right: 12,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={{ flexDirection: "row", gap: 6 }}>
              {gym.isFeatured && (
                <View
                  style={{
                    backgroundColor: "rgba(251,191,36,0.2)",
                    borderWidth: 1,
                    borderColor: "rgba(251,191,36,0.4)",
                    borderRadius: 8,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                  }}
                >
                  <Text style={{ fontSize: 9, fontWeight: "800", color: "#fbbf24", letterSpacing: 0.8 }}>
                    ⭐ FEATURED
                  </Text>
                </View>
              )}
              {gym.isVerified && (
                <View
                  style={{
                    backgroundColor: "rgba(99,102,241,0.2)",
                    borderWidth: 1,
                    borderColor: "rgba(99,102,241,0.4)",
                    borderRadius: 8,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 3,
                  }}
                >
                  <Ionicons name="checkmark-circle" size={9} color="#a5b4fc" />
                  <Text style={{ fontSize: 9, fontWeight: "800", color: "#a5b4fc", letterSpacing: 0.8 }}>
                    VERIFIED
                  </Text>
                </View>
              )}
            </View>

            {/* Save button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleSave}
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: "rgba(9,9,15,0.7)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.15)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons
                name={saved ? "heart" : "heart-outline"}
                size={16}
                color={saved ? "#f87171" : "rgba(255,255,255,0.6)"}
              />
            </TouchableOpacity>
          </View>

          {/* Open/Closed pill on bottom of image */}
          <View style={{ position: "absolute", bottom: 10, left: 12 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                paddingHorizontal: 9,
                paddingVertical: 3,
                borderRadius: 20,
                backgroundColor: isOpen ? "rgba(16,185,129,0.2)" : "rgba(248,113,113,0.2)",
                borderWidth: 1,
                borderColor: isOpen ? "rgba(16,185,129,0.4)" : "rgba(248,113,113,0.4)",
              }}
            >
              <View
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: 3,
                  backgroundColor: isOpen ? "#10b981" : "#f87171",
                }}
              />
              <Text style={{ fontSize: 10, fontWeight: "700", color: isOpen ? "#34d399" : "#fca5a5" }}>
                {isOpen ? `Open · till ${todayTiming?.closeTime}` : "Closed"}
              </Text>
            </View>
          </View>
        </View>

        {/* Card Body */}
        <View style={{ padding: 14 }}>
          {/* Name row */}
          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
            {/* Profile pic */}
            <LinearGradient
              colors={["#6366f1", "#8b5cf6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" }}
            >
              {gym.images?.profile ? (
                <Image
                  source={{ uri: gym.images.profile }}
                  style={{ width: 38, height: 38, borderRadius: 10, borderWidth: 2, borderColor: "#09090f" }}
                />
              ) : (
                <Ionicons name="fitness" size={20} color="#fff" />
              )}
            </LinearGradient>

            <View style={{ flex: 1 }}>
              <Text
                style={{ fontSize: 17, fontWeight: "800", color: "#fff", letterSpacing: -0.3 }}
                numberOfLines={1}
              >
                {gym.name}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
                <Ionicons name="location-outline" size={11} color="rgba(255,255,255,0.35)" />
                <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }} numberOfLines={1}>
                  {gym.address.street}, {gym.address.city}
                </Text>
              </View>
            </View>

            <DistanceBadge distance={gym.distance} />
          </View>

          {/* Rating + Price + Occupancy */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              marginBottom: 10,
              paddingVertical: 8,
              borderTopWidth: 1,
              borderBottomWidth: 1,
              borderColor: "rgba(255,255,255,0.05)",
            }}
          >
            <StarRating rating={gym.rating.average} />
            <Text style={{ fontSize: 12, fontWeight: "700", color: "#fbbf24" }}>
              {gym.rating.average.toFixed(1)}
            </Text>
            <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>({gym.rating.totalReviews})</Text>
            <View style={{ width: 1, height: 12, backgroundColor: "rgba(255,255,255,0.1)" }} />
            <OccupancyIndicator current={gym.currentMembers} max={gym.maxCapacity} />
            <View style={{ marginLeft: "auto" }}>
              <PriceTier tier={gym.priceTier || 2} />
            </View>
          </View>

          {/* Amenities */}
          <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
            {gym.amenities.slice(0, 6).map((a) => (
              <AmenityIcon key={a} name={a} />
            ))}
            {gym.amenities.length > 6 && (
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  backgroundColor: "rgba(255,255,255,0.05)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.1)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", fontWeight: "700" }}>
                  +{gym.amenities.length - 6}
                </Text>
              </View>
            )}
          </View>

          {/* CTA row */}
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                Linking.openURL(
                  `https://maps.google.com/?q=${gym.address.street},${gym.address.city}`
                )
              }
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                paddingVertical: 10,
                borderRadius: 12,
                backgroundColor: "rgba(6,182,212,0.1)",
                borderWidth: 1,
                borderColor: "rgba(6,182,212,0.2)",
              }}
            >
              <Ionicons name="navigate-outline" size={14} color="#06b6d4" />
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#06b6d4" }}>Directions</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => onPress(gym)}
              style={{ flex: 1.8, overflow: "hidden", borderRadius: 12 }}
            >
              <LinearGradient
                colors={["#6366f1", "#8b5cf6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  paddingVertical: 10,
                }}
              >
                <Ionicons name="eye-outline" size={14} color="#fff" />
                <Text style={{ fontSize: 12, fontWeight: "700", color: "#fff" }}>View Gym</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Filter Chip --
const FilterChip = ({ label, icon, active, onPress }) => (
  <TouchableOpacity activeOpacity={0.75} onPress={onPress}>
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: active ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.05)",
        borderWidth: 1,
        borderColor: active ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.08)",
        marginRight: 8,
      }}
    >
      {icon && <Ionicons name={icon} size={12} color={active ? "#a5b4fc" : "rgba(255,255,255,0.4)"} />}
      <Text style={{ fontSize: 12, fontWeight: "700", color: active ? "#a5b4fc" : "rgba(255,255,255,0.45)" }}>
        {label}
      </Text>
    </View>
  </TouchableOpacity>
);

// ─── Sort Option Pill ──────────────────────────────────────────────────────────
const SortPill = ({ label, active, onPress }) => (
  <TouchableOpacity activeOpacity={0.75} onPress={onPress}>
    <View
      style={{
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: active ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.04)",
        borderWidth: 1,
        borderColor: active ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.07)",
        marginRight: 8,
      }}
    >
      <Text style={{ fontSize: 12, fontWeight: "700", color: active ? "#a5b4fc" : "rgba(255,255,255,0.4)" }}>
        {label}
      </Text>
    </View>
  </TouchableOpacity>
);

// ─── Stat Badge (top summary) ─────────────────────────────────────────────────
const StatBadge = ({ icon, value, label, color }) => (
  <View
    style={{
      flex: 1,
      alignItems: "center",
      backgroundColor: "rgba(255,255,255,0.04)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.07)",
      borderRadius: 14,
      paddingVertical: 12,
      gap: 4,
    }}
  >
    <View
      style={{
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: `${color}18`,
        borderWidth: 1,
        borderColor: `${color}30`,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 2,
      }}
    >
      <Ionicons name={icon} size={16} color={color} />
    </View>
    <Text style={{ fontSize: 16, fontWeight: "900", color: "#fff" }}>{value}</Text>
    <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: "600", textAlign: "center" }}>
      {label}
    </Text>
  </View>
);

// ─── StyleSheet helper (inline abs position) ──────────────────────────────────
const StyleSheet_abs = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

// ─── Haversine distance (km) ──────────────────────────────────────────────────
const haversineKm = (lat1, lon1, lat2, lon2) => {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1);
};

const AMENITY_FILTERS = [
  { key: "AC", icon: "snow-outline" },
  { key: "Parking", icon: "car-outline" },
  { key: "Shower", icon: "water-outline" },
  { key: "Yoga", icon: "body-outline" },
  { key: "Crossfit", icon: "barbell-outline" },
  { key: "Personal Trainer", icon: "person-outline" },
  { key: "Pool", icon: "water-outline" },
  { key: "WiFi", icon: "wifi-outline" },
];

const SORT_OPTIONS = [
  { key: "distance", label: "Nearest" },
  { key: "rating", label: "Top Rated" },
  { key: "occupancy", label: "Less Busy" },
  { key: "price_asc", label: "Budget" },
];

// ─── Main Screen --
const ExploreGymsScreen = () => {
  const navigation = useNavigation();
  const [gyms, setGyms] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);       // "denied" | "error" | null
  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState([]);
  const [sortBy, setSortBy] = useState("distance");
  const [showOpenOnly, setShowOpenOnly] = useState(false);
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const [cityLabel, setCityLabel] = useState("");
  const searchRef = useRef(null);
  const coordsRef = useRef(null);                  // cache user coords

  const today = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][
    new Date().getDay()
  ];

  // ─── Fetch location → API 
  const loadGyms = useCallback(async () => {
    try {
      // 1. Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("denied");
        setLoading(false);
        return;
      }

      // 2. Get device coordinates
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = loc.coords;
      coordsRef.current = { latitude, longitude };

      // 3. Reverse-geocode for city label
      try {
        const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (place?.city) setCityLabel(place.city);
        else if (place?.region) setCityLabel(place.region);
      } catch {
      }

      // 4. Call backend
      const data = await getNearbyGyms({ longitude, latitude, radius: 10 });

      // 5. Attach client-side distance
      const withDistance = (data.gyms || []).map((gym) => {
        const [gymLng, gymLat] = gym.location?.coordinates || [longitude, latitude];
        return {
          ...gym,
          distance: haversineKm(latitude, longitude, gymLat, gymLng),
        };
      });

      setGyms(withDistance);
      setError(null);
    } catch (err) {
      console.error("[ExploreGyms] load failed:", err.message);
      setError("error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGyms();
  }, []);

  useEffect(() => {
    let result = [...gyms];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (g) =>
          g.name.toLowerCase().includes(q) ||
          g.address.city.toLowerCase().includes(q) ||
          g.address.street.toLowerCase().includes(q)
      );
    }

    // Amenity filters
    if (activeFilters.length > 0) {
      result = result.filter((g) =>
        activeFilters.every((f) => g.amenities.includes(f))
      );
    }

    // Open only
    if (showOpenOnly) {
      result = result.filter((g) => {
        const t = g.timings?.find((t) => t.day === today);
        return t && !t.isClosed;
      });
    }

    // Verified only
    if (showVerifiedOnly) {
      result = result.filter((g) => g.isVerified);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "distance") return parseFloat(a.distance) - parseFloat(b.distance);
      if (sortBy === "rating") return b.rating.average - a.rating.average;
      if (sortBy === "occupancy") {
        return a.currentMembers / a.maxCapacity - b.currentMembers / b.maxCapacity;
      }
      if (sortBy === "price_asc") return (a.priceTier || 2) - (b.priceTier || 2);
      return 0;
    });

    setFiltered(result);
  }, [gyms, search, activeFilters, sortBy, showOpenOnly, showVerifiedOnly]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadGyms();
    setRefreshing(false);
  }, [loadGyms]);

  const toggleFilter = (key) => {
    setActiveFilters((prev) =>
      prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]
    );
  };

  const openGymsCount = gyms.filter((g) => {
    const t = g.timings?.find((t) => t.day === today);
    return t && !t.isClosed;
  }).length;

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#09090f", alignItems: "center", justifyContent: "center" }}>
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={["rgba(99,102,241,0.3)", "rgba(139,92,246,0.1)", "rgba(0,0,0,0)"]}
          style={{ position: "absolute", top: 0, left: 0, right: 0, height: 400 }}
        />
        <Animated.View entering={ZoomIn.springify()}>
          <LinearGradient
            colors={["#6366f1", "#8b5cf6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ width: 72, height: 72, borderRadius: 22, alignItems: "center", justifyContent: "center", marginBottom: 20 }}
          >
            <Ionicons name="location" size={32} color="#fff" />
          </LinearGradient>
        </Animated.View>
        <ActivityIndicator size="large" color="#6366f1" />
        <Animated.Text
          entering={FadeInDown.delay(200)}
          style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, marginTop: 14, fontWeight: "600" }}
        >
          Finding gyms near you…
        </Animated.Text>
      </View>
    );
  }

  // ─── Error / Permission Denied 
  if (error) {
    const isDenied = error === "denied";
    return (
      <View style={{ flex: 1, backgroundColor: "#09090f", alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={["rgba(99,102,241,0.3)", "rgba(139,92,246,0.1)", "rgba(0,0,0,0)"]}
          style={{ position: "absolute", top: 0, left: 0, right: 0, height: 400 }}
        />
        <Animated.View entering={ZoomIn.springify()}>
          <LinearGradient
            colors={isDenied ? ["#f87171", "#ef4444"] : ["#fbbf24", "#f59e0b"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ width: 72, height: 72, borderRadius: 22, alignItems: "center", justifyContent: "center", marginBottom: 20 }}
          >
            <Ionicons name={isDenied ? "location-outline" : "cloud-offline-outline"} size={32} color="#fff" />
          </LinearGradient>
        </Animated.View>
        <Text style={{ fontSize: 20, fontWeight: "800", color: "#fff", textAlign: "center", marginBottom: 8 }}>
          {isDenied ? "Location Access Required" : "Something went wrong"}
        </Text>
        <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", textAlign: "center", lineHeight: 20, marginBottom: 24 }}>
          {isDenied
            ? "FitHex needs your location to show nearby gyms. Please grant location access in your device settings."
            : "We couldn't load gyms right now. Check your internet connection and try again."}
        </Text>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            if (isDenied) {
              Linking.openSettings();
            } else {
              setError(null);
              setLoading(true);
              loadGyms();
            }
          }}
          style={{ overflow: "hidden", borderRadius: 14 }}
        >
          <LinearGradient
            colors={["#6366f1", "#8b5cf6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ paddingHorizontal: 32, paddingVertical: 14, flexDirection: "row", alignItems: "center", gap: 8 }}
          >
            <Ionicons name={isDenied ? "settings-outline" : "refresh-outline"} size={16} color="#fff" />
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>
              {isDenied ? "Open Settings" : "Try Again"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#09090f" }}>
      <StatusBar barStyle="light-content" />

      {/* Background Gradient */}
      <LinearGradient
        colors={["rgba(99,102,241,0.25)", "rgba(139,92,246,0.08)", "rgba(0,0,0,0)"]}
        locations={[0, 0.5, 1]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 380 }}
      />

      {/* Glow Orbs */}
      <GlowOrb size={300} color="rgba(99,102,241,0.1)" top={-80} left={SCREEN_WIDTH / 2 - 150} delay={0} />
      <GlowOrb size={200} color="rgba(139,92,246,0.08)" top={250} left={-60} delay={1500} />
      <GlowOrb size={180} color="rgba(6,182,212,0.06)" top={500} left={SCREEN_WIDTH - 100} delay={2500} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6366f1"
            colors={["#6366f1"]}
          />
        }
      >
        {/* ── Header  */}
        <Animated.View
          entering={FadeInDown.delay(0).duration(500)}
          style={{ paddingHorizontal: 20, paddingTop: 56, paddingBottom: 4 }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: "#10b981",
                  }}
                />
                <Text style={{ fontSize: 11, color: "#10b981", fontWeight: "700", letterSpacing: 1.5, textTransform: "uppercase" }}>
                  Location Active
                </Text>
              </View>
              <Text style={{ fontSize: 28, fontWeight: "900", color: "#fff", marginTop: 4, letterSpacing: -0.8 }}>
                Explore Gyms
              </Text>
              <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 2, fontWeight: "400" }}>
                {filtered.length} gym{filtered.length !== 1 ? "s" : ""}{cityLabel ? ` near ${cityLabel}` : " nearby"}
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: "rgba(255,255,255,0.05)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.1)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="options-outline" size={20} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ── Stats Row  */}
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          style={{ flexDirection: "row", gap: 10, paddingHorizontal: 20, marginTop: 16, marginBottom: 20 }}
        >
          <StatBadge icon="business-outline" value={gyms.length} label="Total Gyms" color="#6366f1" />
          <StatBadge icon="checkmark-circle-outline" value={openGymsCount} label="Open Now" color="#10b981" />
          <StatBadge
            icon="shield-checkmark-outline"
            value={gyms.filter((g) => g.isVerified).length}
            label="Verified"
            color="#06b6d4"
          />
        </Animated.View>

        {/* ── Search Bar  */}
        <Animated.View
          entering={FadeInDown.delay(150).springify()}
          style={{ paddingHorizontal: 20, marginBottom: 14 }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              backgroundColor: "rgba(255,255,255,0.06)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.1)",
              borderRadius: 16,
              paddingHorizontal: 14,
              paddingVertical: 10,
            }}
          >
            <Ionicons name="search-outline" size={18} color="rgba(255,255,255,0.4)" />
            <TextInput
              ref={searchRef}
              value={search}
              onChangeText={setSearch}
              placeholder="Search by name, area, city…"
              placeholderTextColor="rgba(255,255,255,0.25)"
              style={{ flex: 1, color: "#fff", fontSize: 14, fontWeight: "500" }}
              returnKeyType="search"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.35)" />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* ── Quick Toggle Filters  */}
        <Animated.View
          entering={FadeInDown.delay(200).springify()}
          style={{ paddingHorizontal: 20, marginBottom: 10 }}
        >
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 2 }}>
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => setShowOpenOnly((v) => !v)}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 5,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: showOpenOnly ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.05)",
                  borderWidth: 1,
                  borderColor: showOpenOnly ? "rgba(16,185,129,0.45)" : "rgba(255,255,255,0.08)",
                }}
              >
                <View
                  style={{
                    width: 6, height: 6, borderRadius: 3,
                    backgroundColor: showOpenOnly ? "#10b981" : "rgba(255,255,255,0.3)",
                  }}
                />
                <Text style={{ fontSize: 12, fontWeight: "700", color: showOpenOnly ? "#34d399" : "rgba(255,255,255,0.45)" }}>
                  Open Now
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => setShowVerifiedOnly((v) => !v)}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 5,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: showVerifiedOnly ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.05)",
                  borderWidth: 1,
                  borderColor: showVerifiedOnly ? "rgba(99,102,241,0.45)" : "rgba(255,255,255,0.08)",
                }}
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={12}
                  color={showVerifiedOnly ? "#a5b4fc" : "rgba(255,255,255,0.4)"}
                />
                <Text style={{ fontSize: 12, fontWeight: "700", color: showVerifiedOnly ? "#a5b4fc" : "rgba(255,255,255,0.45)" }}>
                  Verified
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ── Sort Row ────────────────────────────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(250).springify()}
          style={{ marginBottom: 14 }}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 4 }}>
            {SORT_OPTIONS.map((s) => (
              <SortPill key={s.key} label={s.label} active={sortBy === s.key} onPress={() => setSortBy(s.key)} />
            ))}
          </ScrollView>
        </Animated.View>

        {/* ── Amenity Filter Chips ─────────────────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(300).springify()}
          style={{ marginBottom: 20 }}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 2 }}>
            {AMENITY_FILTERS.map((f) => (
              <FilterChip
                key={f.key}
                label={f.key}
                icon={f.icon}
                active={activeFilters.includes(f.key)}
                onPress={() => toggleFilter(f.key)}
              />
            ))}
          </ScrollView>
        </Animated.View>

        {/* ── Active Filter Summary ────────────────────────────────────────── */}
        {(activeFilters.length > 0 || showOpenOnly || showVerifiedOnly) && (
          <Animated.View
            entering={FadeIn.duration(300)}
            style={{
              marginHorizontal: 20,
              marginBottom: 14,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              backgroundColor: "rgba(99,102,241,0.08)",
              borderWidth: 1,
              borderColor: "rgba(99,102,241,0.2)",
              borderRadius: 12,
              paddingVertical: 8,
              paddingHorizontal: 12,
            }}
          >
            <Ionicons name="filter" size={13} color="#a5b4fc" />
            <Text style={{ flex: 1, fontSize: 12, color: "rgba(165,180,252,0.8)", fontWeight: "600" }}>
              {filtered.length} result{filtered.length !== 1 ? "s" : ""} with active filters
            </Text>
            <TouchableOpacity
              onPress={() => {
                setActiveFilters([]);
                setShowOpenOnly(false);
                setShowVerifiedOnly(false);
              }}
            >
              <Text style={{ fontSize: 12, color: "#f87171", fontWeight: "700" }}>Clear All</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ── Gym Cards ───────────────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: 20 }}>
          {filtered.length === 0 ? (
            <Animated.View
              entering={FadeIn.duration(400)}
              style={{ alignItems: "center", paddingVertical: 60 }}
            >
              <LinearGradient
                colors={["rgba(99,102,241,0.15)", "rgba(139,92,246,0.08)"]}
                style={{
                  width: 80, height: 80, borderRadius: 24,
                  alignItems: "center", justifyContent: "center",
                  borderWidth: 1, borderColor: "rgba(99,102,241,0.2)",
                  marginBottom: 16,
                }}
              >
                <Ionicons name="search-outline" size={34} color="rgba(165,180,252,0.6)" />
              </LinearGradient>
              <Text style={{ fontSize: 18, fontWeight: "800", color: "#fff", marginBottom: 6 }}>
                No gyms found
              </Text>
              <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", textAlign: "center", maxWidth: 240 }}>
                Try adjusting your search or removing some filters
              </Text>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setSearch("");
                  setActiveFilters([]);
                  setShowOpenOnly(false);
                  setShowVerifiedOnly(false);
                }}
                style={{ marginTop: 20, overflow: "hidden", borderRadius: 14 }}
              >
                <LinearGradient
                  colors={["#6366f1", "#8b5cf6"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ paddingHorizontal: 24, paddingVertical: 12 }}
                >
                  <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>Reset Filters</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            filtered.map((gym, index) => (
              <GymCard
                key={gym._id}
                gym={gym}
                index={index}
                onPress={(g) => navigation.navigate("GymInfo", { gymId: g._id })}
                onSave={(id, saved) => console.log("Saved:", id, saved)}
              />
            ))
          )}
        </View>

        {/* ── Bottom Tip ──────────────────────────────────────────────────── */}
        {filtered.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(400).springify()}
            style={{
              marginHorizontal: 20,
              marginTop: 4,
              marginBottom: 12,
              padding: 14,
              borderRadius: 14,
              backgroundColor: "rgba(6,182,212,0.06)",
              borderWidth: 1,
              borderColor: "rgba(6,182,212,0.15)",
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Ionicons name="information-circle-outline" size={18} color="#06b6d4" />
            <Text style={{ flex: 1, fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 18 }}>
              Distances based on your current location. Pull down to refresh availability.
            </Text>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
};

export default ExploreGymsScreen;
