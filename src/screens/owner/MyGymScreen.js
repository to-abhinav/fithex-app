import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
  StyleSheet,
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
  Easing,
  interpolate,
} from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";

import { getMyGym } from "../../api/gymService";
import colors from "../../theme/colors";
import CreateWizard from "./components/CreateWizard";
import GymDashboard from "./components/GymDashboard";
import EditTabs from "./components/EditTabs";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

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

const MyGymScreen = () => {
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gym, setGym] = useState(null);
  const [gymId, setGymId] = useState(null);
  const [editing, setEditing] = useState(false);

  const fetchGym = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyGym();
      const gymData = data?.gym || data;
      if (gymData && gymData._id) {
        setGym(gymData);
        setGymId(gymData._id);
      } else {
        setGym(null);
        setGymId(null);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setGym(null);
        setGymId(null);
      } else {
        const msg =
          err.response?.data?.message ||
          err.message ||
          "Failed to load your gym";
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGym();
  }, [fetchGym]);

  const handleGymCreated = useCallback(() => {
    setEditing(false);
    fetchGym();
  }, [fetchGym]);

  const handleGymUpdated = useCallback(() => {
    fetchGym();
  }, [fetchGym]);

  const handleEdit = useCallback(() => {
    setEditing(true);
  }, []);

  const handleDoneEditing = useCallback(() => {
    setEditing(false);
    fetchGym();
  }, [fetchGym]);

  // Loading 
  if (loading) {
    return (
      <View style={styles.fullScreenCenter}>
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={[`${colors.primary}33`, "rgba(0,0,0,0)"]}
          style={StyleSheet.absoluteFillObject}
        />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading your gym…</Text>
      </View>
    );
  }

  // error 
  if (error) {
    return (
      <View style={styles.fullScreenCenter}>
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={[`${colors.primary}33`, "rgba(0,0,0,0)"]}
          style={StyleSheet.absoluteFillObject}
        />

        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          style={styles.errorCard}
        >
          <View style={styles.errorIconWrap}>
            <Ionicons
              name="alert-circle-outline"
              size={44}
              color={colors.danger}
            />
          </View>

          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>{error}</Text>

          <TouchableOpacity
            onPress={fetchGym}
            activeOpacity={0.85}
            style={styles.retryButton}
          >
            <Ionicons name="refresh-outline" size={18} color={colors.textPrimary} />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.goBackLink}
          >
            <Text style={styles.goBackText}>Go Back</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  // title and mode 
  const getTitle = () => {
    if (!gym) return "Create Gym";
    return editing ? "Edit Gym" : "My Gym";
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={[
          `${colors.primary}47`,
          `${colors.secondary}1F`,
          "rgba(0,0,0,0)",
        ]}
        locations={[0, 0.45, 1]}
        style={styles.bgGradient}
      />

      <GlowOrb size={300} color={`${colors.primary}24`} top={-80} left={SCREEN_WIDTH / 2 - 150} delay={0} />
      <GlowOrb size={220} color={`${colors.secondary}1A`} top={200} left={-80} delay={1200} />
      <GlowOrb size={180} color={`${colors.accent}14`} top={500} left={SCREEN_WIDTH - 120} delay={2400} />

      <Animated.View
        entering={FadeInDown.delay(0).duration(600)}
        style={styles.topBar}
      >
        <TouchableOpacity
          onPress={() => {
            if (editing) {
              handleDoneEditing();
            } else {
              navigation.goBack();
            }
          }}
          activeOpacity={0.8}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.topBarLabel}>GYM MANAGEMENT</Text>
          <Text style={styles.topBarTitle}>{getTitle()}</Text>
        </View>

        {gym && (
          <TouchableOpacity
            onPress={editing ? handleDoneEditing : handleEdit}
            activeOpacity={0.8}
            style={[styles.topBarAction, editing && styles.topBarActionDone]}
          >
            <Ionicons
              name={editing ? "checkmark" : "create-outline"}
              size={18}
              color={editing ? colors.success : colors.primary}
            />
            <Text style={[styles.topBarActionText, editing && { color: colors.success }]}>
              {editing ? "Done" : "Edit"}
            </Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      {gym === null ? (
        <CreateWizard onGymCreated={handleGymCreated} />
      ) : editing ? (
        <EditTabs gym={gym} onGymUpdated={handleGymUpdated} />
      ) : (
        <GymDashboard gym={gym} onEdit={handleEdit} onRefresh={fetchGym} />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  fullScreenCenter: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },

  bgGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 360,
  },

  loadingText: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 14,
    fontWeight: "500",
  },

  errorCard: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    paddingVertical: 36,
    paddingHorizontal: 32,
    marginHorizontal: 32,
  },
  errorIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: `${colors.danger}18`,
    borderWidth: 1,
    borderColor: `${colors.danger}30`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: colors.primary,
  },
  retryButtonText: {
    color: colors.textPrimary,
    fontWeight: "700",
    fontSize: 14,
  },
  goBackLink: {
    marginTop: 16,
  },
  goBackText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "500",
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 14,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: `${colors.primary}1A`,
    borderWidth: 1,
    borderColor: `${colors.primary}40`,
    alignItems: "center",
    justifyContent: "center",
  },
  topBarLabel: {
    fontSize: 10,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 2,
    fontWeight: "700",
  },
  topBarTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.textPrimary,
    marginTop: 1,
  },
  topBarAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: `${colors.primary}1A`,
    borderWidth: 1,
    borderColor: `${colors.primary}40`,
  },
  topBarActionDone: {
    backgroundColor: `${colors.success}1A`,
    borderColor: `${colors.success}40`,
  },
  topBarActionText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
});

export default MyGymScreen;
