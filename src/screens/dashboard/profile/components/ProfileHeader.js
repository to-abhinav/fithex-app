/**
 * ProfileHeader — Avatar, greeting, name, role badge, email, phone
 */
import { View, Text, Image, TouchableOpacity, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { getGreeting, DEFAULT_AVATAR } from "../helpers";
import { GlowOrb } from "../primitives";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const ProfileHeader = ({
  user,
  displayName,
  memberRole,
  memberSince,
  unreadCount,
  onOpenPicker,
  onNotifications,
}) => (
  <>
    <LinearGradient
      colors={["rgba(99,102,241,0.28)", "rgba(139,92,246,0.12)", "rgba(0,0,0,0)"]}
      locations={[0, 0.45, 1]}
      style={{ position: "absolute", top: 0, left: 0, right: 0, height: 360 }}
    />

    <GlowOrb size={300} color="rgba(99,102,241,0.14)" top={-80} left={SCREEN_WIDTH / 2 - 150} delay={0} />
    <GlowOrb size={220} color="rgba(139,92,246,0.10)" top={200} left={-80} delay={1200} />
    <GlowOrb size={180} color="rgba(6,182,212,0.08)"  top={500} left={SCREEN_WIDTH - 120} delay={2400} />

    <Animated.View
      entering={FadeInDown.delay(0).duration(600)}
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 24,
        paddingTop: 56,
        paddingBottom: 8,
      }}
    >
      <View>
        <Text
          style={{
            fontSize: 10,
            color: "rgba(255,255,255,0.28)",
            textTransform: "uppercase",
            letterSpacing: 2,
            fontWeight: "700",
          }}
        >
          My Profile
        </Text>
        <Text style={{ fontSize: 20, fontWeight: "800", color: "#fff", marginTop: 2 }}>
          {getGreeting()}
        </Text>
      </View>
      <TouchableOpacity
        onPress={onNotifications}
        activeOpacity={0.75}
        style={{
          width: 42,
          height: 42,
          borderRadius: 21,
          backgroundColor: "rgba(99,102,241,0.1)",
          borderWidth: 1,
          borderColor: "rgba(99,102,241,0.25)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="notifications-outline" size={20} color="rgba(165,180,252,0.85)" />
        {unreadCount > 0 && (
          <View
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: "#EF4444",
              borderWidth: 1.5,
              borderColor: "#09090f",
            }}
          />
        )}
      </TouchableOpacity>
    </Animated.View>

    <Animated.View
      entering={FadeInUp.delay(150).springify()}
      style={{ alignItems: "center", paddingTop: 20, paddingBottom: 32 }}
    >
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onOpenPicker}
        style={{ position: "relative", marginBottom: 16 }}
      >
        <LinearGradient
          colors={["#6366f1", "#8b5cf6", "#06b6d4"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 120,
            height: 120,
            borderRadius: 60,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Image
            source={{ uri: user?.profileImage || DEFAULT_AVATAR }}
            style={{
              width: 108,
              height: 108,
              borderRadius: 54,
              borderWidth: 3,
              borderColor: "#09090f",
            }}
          />
        </LinearGradient>
        <View
          style={{
            position: "absolute",
            bottom: 2,
            right: 2,
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: "#6366f1",
            borderWidth: 2.5,
            borderColor: "#09090f",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="camera" size={13} color="#fff" />
        </View>
      </TouchableOpacity>

      <Text
        style={{
          fontSize: 22,
          fontWeight: "800",
          color: "#fff",
          letterSpacing: -0.4,
        }}
      >
        {displayName}
      </Text>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          marginTop: 8,
          backgroundColor: "rgba(99,102,241,0.12)",
          borderWidth: 1,
          borderColor: "rgba(99,102,241,0.25)",
          borderRadius: 20,
          paddingHorizontal: 14,
          paddingVertical: 5,
        }}
      >
        <Ionicons name="shield-checkmark" size={12} color="#a5b4fc" />
        <Text style={{ fontSize: 12, fontWeight: "700", color: "#a5b4fc" }}>
          {memberRole} · Since {memberSince}
        </Text>
      </View>

      {/* Email */}
      {user?.email && (
        <Text
          style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.3)",
            marginTop: 8,
            fontWeight: "400",
          }}
        >
          {user.email}
        </Text>
      )}

      {/* Phone */}
      {user?.phone && (
        <Text
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.25)",
            marginTop: 4,
            fontWeight: "400",
          }}
        >
          {user.phone}
        </Text>
      )}
    </Animated.View>
  </>
);

export default ProfileHeader;
