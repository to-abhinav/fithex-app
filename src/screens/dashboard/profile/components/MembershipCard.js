
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";

const MembershipCard = ({
  membership,
  membershipLoading,
  pendingRequest,
  cancellingRequest,
  onCancelRequest,
  navigation,
}) => (
  <Animated.View entering={FadeInDown.delay(580).springify()} style={{ marginHorizontal: 20, marginBottom: 14 }}>
    {membershipLoading ? (
      <View
        style={{
          backgroundColor: "rgba(255,255,255,0.03)",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.07)",
          borderRadius: 20,
          padding: 20,
          alignItems: "center",
          justifyContent: "center",
          minHeight: 120,
        }}
      >
        <ActivityIndicator size="small" color="#6366f1" />
        <Text style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, marginTop: 10, fontWeight: "500" }}>
          Loading membership…
        </Text>
      </View>
    ) : membership ? (
      <LinearGradient
        colors={
          membership.isExpired
            ? ["rgba(239,68,68,0.18)", "rgba(248,113,113,0.08)", "rgba(15,10,30,0.95)"]
            : ["rgba(99,102,241,0.22)", "rgba(139,92,246,0.12)", "rgba(15,10,30,0.95)"]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 20,
          padding: 20,
          borderWidth: 1,
          borderColor: membership.isExpired ? "rgba(239,68,68,0.25)" : "rgba(99,102,241,0.25)",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 14 }}>
          <View
            style={{
              width: 44, height: 44, borderRadius: 14,
              backgroundColor: membership.isExpired ? "rgba(239,68,68,0.15)" : "rgba(99,102,241,0.2)",
              borderWidth: 1,
              borderColor: membership.isExpired ? "rgba(239,68,68,0.25)" : "rgba(99,102,241,0.3)",
              alignItems: "center", justifyContent: "center",
              marginRight: 12,
            }}
          >
            <Ionicons
              name={membership.isExpired ? "alert-circle" : "diamond-outline"}
              size={20}
              color={membership.isExpired ? "#fca5a5" : "#a5b4fc"}
            />
          </View>

          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={{ fontSize: 18, fontWeight: "900", color: "#fff", letterSpacing: -0.5 }}>
                {membership.subscriptionPlan?.name || "Plan"}
              </Text>
              {membership.subscriptionPlan?.durationInMonths != null && (
                <View style={{
                  backgroundColor: membership.isExpired ? "rgba(239,68,68,0.15)" : "rgba(99,102,241,0.15)",
                  paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6,
                }}>
                  <Text style={{ fontSize: 9, fontWeight: "800", color: membership.isExpired ? "#f87171" : "#a5b4fc", letterSpacing: 0.5 }}>
                    {membership.subscriptionPlan.durationInMonths}mo
                  </Text>
                </View>
              )}
            </View>
            {membership.gymId?.name && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 }}>
                <Ionicons name="location-outline" size={10} color="rgba(255,255,255,0.3)" />
                <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", fontWeight: "500" }}>
                  {membership.gymId.name}
                </Text>
              </View>
            )}
          </View>

          <View style={{
            backgroundColor: membership.isExpired
              ? "rgba(239,68,68,0.15)"
              : membership.status === "active" ? "rgba(34,197,94,0.12)" : "rgba(250,204,21,0.12)",
            borderWidth: 1,
            borderColor: membership.isExpired
              ? "rgba(239,68,68,0.25)"
              : membership.status === "active" ? "rgba(34,197,94,0.25)" : "rgba(250,204,21,0.25)",
            borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
          }}>
            <Text style={{
              fontSize: 10, fontWeight: "800", letterSpacing: 0.8,
              color: membership.isExpired ? "#f87171" : membership.status === "active" ? "#4ade80" : "#fbbf24",
            }}>
              {membership.isExpired ? "EXPIRED" : membership.status === "active" ? "ACTIVE" : "INACTIVE"}
            </Text>
          </View>
        </View>

        <View style={{
          backgroundColor: "rgba(255,255,255,0.04)",
          borderRadius: 14, padding: 12,
          borderWidth: 1, borderColor: "rgba(255,255,255,0.06)",
          flexDirection: "row", alignItems: "center", gap: 12,
          marginBottom: 14,
        }}>
          {!membership.isExpired && membership.daysRemaining != null && (
            <View style={{
              width: 42, height: 42, borderRadius: 21,
              borderWidth: 2.5,
              borderColor: membership.daysRemaining > 7 ? "rgba(99,102,241,0.4)" : "rgba(250,204,21,0.4)",
              alignItems: "center", justifyContent: "center",
              backgroundColor: "rgba(0,0,0,0.2)",
            }}>
              <Text style={{ fontSize: 14, fontWeight: "900", color: membership.daysRemaining > 7 ? "#a5b4fc" : "#fbbf24" }}>
                {membership.daysRemaining}
              </Text>
              <Text style={{ fontSize: 7, fontWeight: "700", color: "rgba(255,255,255,0.3)", letterSpacing: 0.5, marginTop: -1 }}>
                days
              </Text>
            </View>
          )}
          {membership.isExpired && (
            <View style={{
              width: 42, height: 42, borderRadius: 21,
              borderWidth: 2.5, borderColor: "rgba(239,68,68,0.3)",
              alignItems: "center", justifyContent: "center",
              backgroundColor: "rgba(0,0,0,0.2)",
            }}>
              <Ionicons name="close-circle" size={18} color="#f87171" />
            </View>
          )}

          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.7)", marginBottom: 2 }}>
              {membership.isExpired ? "Membership Expired" : "Membership Active"}
            </Text>
            <Text style={{ fontSize: 11, color: membership.isExpired ? "rgba(248,113,113,0.7)" : "rgba(255,255,255,0.35)" }}>
              {membership.isExpired
                ? `Expired ${new Date(membership.expiryDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                : `Renews ${new Date(membership.expiryDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
              }
            </Text>
          </View>

          {membership.subscriptionPlan?.price != null && (
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ fontSize: 16, fontWeight: "900", color: "#fff" }}>
                ₹{membership.subscriptionPlan.price}
              </Text>
              <Text style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontWeight: "600" }}>
                / {membership.subscriptionMonths}mo
              </Text>
            </View>
          )}
        </View>

        {/* Features as pills */}
        {membership.subscriptionPlan?.features?.length > 0 && (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
            {membership.subscriptionPlan.features.slice(0, 5).map((feature, idx) => (
              <View key={idx} style={{
                flexDirection: "row", alignItems: "center", gap: 4,
                backgroundColor: membership.isExpired ? "rgba(239,68,68,0.08)" : "rgba(99,102,241,0.1)",
                borderWidth: 1,
                borderColor: membership.isExpired ? "rgba(239,68,68,0.15)" : "rgba(99,102,241,0.18)",
                borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
              }}>
                <Ionicons name="checkmark-circle" size={11} color={membership.isExpired ? "rgba(248,113,113,0.5)" : "rgba(165,180,252,0.6)"} />
                <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", fontWeight: "600" }}>
                  {feature}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* CTA */}
        <TouchableOpacity
          onPress={() => {
            const gymId = membership.gymId?._id || membership.gymId;
            if (gymId) {
              navigation.navigate("GymInfo", { gymId });
            } else {
              navigation.navigate("Main", { screen: "Explore" });
            }
          }}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={membership.isExpired ? ["#dc2626", "#b91c1c"] : ["#4f46e5", "#6366f1"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              borderRadius: 14, paddingVertical: 12,
              alignItems: "center", flexDirection: "row",
              justifyContent: "center", gap: 8,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: "700", color: "#fff", letterSpacing: 0.3 }}>
              {membership.isExpired ? "Renew Membership" : "Manage Subscription"}
            </Text>
            <Ionicons name="arrow-forward" size={14} color="rgba(255,255,255,0.8)" />
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    ) : pendingRequest ? (
      <LinearGradient
        colors={["rgba(245,158,11,0.18)", "rgba(251,191,36,0.08)", "rgba(15,10,30,0.95)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 20,
          padding: 20,
          borderWidth: 1,
          borderColor: "rgba(245,158,11,0.3)",
        }}
      >
        {/* Header row */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
          <View
            style={{
              width: 48, height: 48, borderRadius: 14,
              backgroundColor: "rgba(245,158,11,0.15)",
              borderWidth: 1, borderColor: "rgba(245,158,11,0.3)",
              alignItems: "center", justifyContent: "center",
              marginRight: 14,
            }}
          >
            <Ionicons name="time-outline" size={22} color="#fbbf24" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 17, fontWeight: "900", color: "#fff", letterSpacing: -0.3 }}>
              Pending Approval
            </Text>
            <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2, fontWeight: "400" }}>
              Awaiting gym owner review
            </Text>
          </View>
          {/* Pulsing status badge */}
          <View
            style={{
              flexDirection: "row", alignItems: "center", gap: 6,
              paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
              backgroundColor: "rgba(245,158,11,0.12)",
              borderWidth: 1, borderColor: "rgba(245,158,11,0.3)",
            }}
          >
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: "#fbbf24" }} />
            <Text style={{ fontSize: 10, fontWeight: "800", color: "#fbbf24", letterSpacing: 0.5 }}>PENDING</Text>
          </View>
        </View>

        {/* Request details */}
        <View
          style={{
            backgroundColor: "rgba(255,255,255,0.04)",
            borderRadius: 14, padding: 14,
            borderWidth: 1, borderColor: "rgba(255,255,255,0.06)",
            gap: 10, marginBottom: 16,
          }}
        >
          {pendingRequest.gymId?.name && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: "rgba(99,102,241,0.12)", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="business-outline" size={14} color="#a5b4fc" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.8 }}>Gym</Text>
                <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", fontWeight: "600", marginTop: 1 }}>
                  {pendingRequest.gymId.name}
                </Text>
              </View>
            </View>
          )}
          {pendingRequest.planId?.name && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: "rgba(245,158,11,0.12)", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="ribbon-outline" size={14} color="#fbbf24" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.8 }}>Plan</Text>
                <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", fontWeight: "600", marginTop: 1 }}>
                  {pendingRequest.planId.name}
                  {pendingRequest.planId.price != null && (
                    <Text style={{ color: "rgba(255,255,255,0.4)", fontWeight: "400" }}> · ₹{pendingRequest.planId.price.toLocaleString("en-IN")}</Text>
                  )}
                </Text>
              </View>
            </View>
          )}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: "rgba(16,185,129,0.1)", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="cash-outline" size={14} color="#34d399" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.8 }}>Payment Mode</Text>
              <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", fontWeight: "600", marginTop: 1 }}>
                {pendingRequest.paymentMode || "Offline"}
              </Text>
            </View>
          </View>
          {pendingRequest.createdAt && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: "rgba(167,139,250,0.1)", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="calendar-outline" size={14} color="#c4b5fd" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.8 }}>Submitted</Text>
                <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", fontWeight: "600", marginTop: 1 }}>
                  {new Date(pendingRequest.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </Text>
              </View>
            </View>
          )}
          {pendingRequest.note ? (
            <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
              <View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: "rgba(99,102,241,0.1)", alignItems: "center", justifyContent: "center", marginTop: 2 }}>
                <Ionicons name="chatbubble-ellipses-outline" size={13} color="#a5b4fc" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.8 }}>Your Message</Text>
                <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: "400", marginTop: 1, lineHeight: 19, fontStyle: "italic" }}>
                  "{pendingRequest.note}"
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* Info note */}
        <View
          style={{
            flexDirection: "row", alignItems: "flex-start", gap: 10,
            backgroundColor: "rgba(245,158,11,0.07)",
            borderRadius: 12, padding: 12,
            borderWidth: 1, borderColor: "rgba(245,158,11,0.15)",
            marginBottom: 14,
          }}
        >
          <Ionicons name="information-circle-outline" size={16} color="#fbbf24" style={{ marginTop: 1 }} />
          <Text style={{ flex: 1, fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 18, fontWeight: "400" }}>
            Your request is under review. The gym owner will approve it once your payment is verified.
            You'll receive a notification when approved.
          </Text>
        </View>

        {/* Cancel + Explore buttons */}
        <View style={{ gap: 10 }}>
          {/* Cancel request */}
          <TouchableOpacity
            onPress={onCancelRequest}
            disabled={cancellingRequest}
            activeOpacity={0.85}
            style={{
              flexDirection: "row", alignItems: "center", justifyContent: "center",
              gap: 8, paddingVertical: 13,
              backgroundColor: "rgba(239,68,68,0.1)",
              borderWidth: 1, borderColor: "rgba(239,68,68,0.3)",
              borderRadius: 14,
              opacity: cancellingRequest ? 0.6 : 1,
            }}
          >
            {cancellingRequest ? (
              <ActivityIndicator size="small" color="#f87171" />
            ) : (
              <Ionicons name="close-circle-outline" size={16} color="#f87171" />
            )}
            <Text style={{ fontSize: 13, fontWeight: "700", color: "#f87171" }}>
              {cancellingRequest ? "Cancelling…" : "Cancel Request"}
            </Text>
          </TouchableOpacity>

          {/* Explore other gyms */}
          <TouchableOpacity
            onPress={() => navigation.navigate("Main", { screen: "Explore" })}
            activeOpacity={0.85}
          >
            <View
              style={{
                flexDirection: "row", alignItems: "center", justifyContent: "center",
                gap: 8, paddingVertical: 12,
                backgroundColor: "rgba(255,255,255,0.05)",
                borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
                borderRadius: 14,
              }}
            >
              <Ionicons name="search-outline" size={14} color="rgba(255,255,255,0.5)" />
              <Text style={{ fontSize: 13, fontWeight: "600", color: "rgba(255,255,255,0.5)" }}>
                Explore Other Gyms
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    ) : (
      <LinearGradient
        colors={["rgba(99,102,241,0.08)", "rgba(139,92,246,0.04)", "rgba(0,0,0,0)"]}
        style={{
          borderRadius: 20, padding: 24,
          borderWidth: 1, borderColor: "rgba(99,102,241,0.15)",
          alignItems: "center",
        }}
      >
        <View style={{
          width: 56, height: 56, borderRadius: 28,
          backgroundColor: "rgba(99,102,241,0.1)",
          borderWidth: 1, borderColor: "rgba(99,102,241,0.2)",
          alignItems: "center", justifyContent: "center",
          marginBottom: 12,
        }}>
          <Ionicons name="barbell-outline" size={24} color="rgba(165,180,252,0.5)" />
        </View>

        <Text style={{ fontSize: 15, fontWeight: "800", color: "rgba(255,255,255,0.65)", marginBottom: 6 }}>
          No Active Plan
        </Text>
        <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textAlign: "center", marginBottom: 18, lineHeight: 18 }}>
          Explore nearby gyms and find the perfect plan
        </Text>

        <TouchableOpacity
          onPress={() => navigation.navigate("Main", { screen: "Explore" })}
          activeOpacity={0.85}
          style={{ width: "100%" }}
        >
          <LinearGradient
            colors={["#4f46e5", "#6366f1"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              borderRadius: 14, paddingVertical: 12,
              alignItems: "center", flexDirection: "row",
              justifyContent: "center", gap: 8,
            }}
          >
            <Ionicons name="search-outline" size={14} color="#fff" />
            <Text style={{ fontSize: 13, fontWeight: "700", color: "#fff" }}>
              Explore Gyms
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    )}
  </Animated.View>
);

export default MembershipCard;
