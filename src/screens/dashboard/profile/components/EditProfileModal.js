
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Platform,
  Dimensions,
  Modal,
  KeyboardAvoidingView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, { SlideInDown, Easing } from "react-native-reanimated";
import { FITNESS_GOALS } from "../helpers";

const EditProfileModal = ({
  visible,
  onClose,
  editForm,
  onChangeForm,
  onSave,
  saving,
}) => (
  <Modal
    visible={visible}
    transparent
    animationType="none"
    statusBarTranslucent
    onRequestClose={() => !saving && onClose()}
  >
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => !saving && onClose()}
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.65)",
          justifyContent: "flex-end",
        }}
      >
        {/* Sheet — stop propagation */}
        <TouchableOpacity activeOpacity={1} onPress={() => {}}>
          <Animated.View
            entering={SlideInDown.duration(380).easing(Easing.out(Easing.cubic))}
            style={{
              backgroundColor: "#111118",
              borderTopLeftRadius: 30,
              borderTopRightRadius: 30,
              borderWidth: 1,
              borderColor: "rgba(99,102,241,0.2)",
              borderBottomWidth: 0,
              paddingBottom: Platform.OS === "ios" ? 44 : 28,
              maxHeight: Dimensions.get("window").height * 0.88,
            }}
          >
            {/* Handle */}
            <View style={{ alignItems: "center", paddingTop: 12, paddingBottom: 4 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.15)" }} />
            </View>

            {/* Header */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 22, paddingBottom: 18, paddingTop: 10 }}>
              <View>
                <Text style={{ fontSize: 20, fontWeight: "900", color: "#fff", letterSpacing: -0.5 }}>Edit Profile</Text>
                <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>Update your personal info</Text>
              </View>
              <TouchableOpacity
                onPress={() => !saving && onClose()}
                style={{
                  width: 36, height: 36, borderRadius: 12,
                  backgroundColor: "rgba(255,255,255,0.06)",
                  borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
                  alignItems: "center", justifyContent: "center",
                }}
              >
                <Ionicons name="close" size={18} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 16, paddingBottom: 8 }}>

              {/* Name */}
              <View>
                <Text style={{ fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,0.4)", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 }}>Display Name</Text>
                <View style={{
                  flexDirection: "row", alignItems: "center", gap: 12,
                  backgroundColor: "rgba(255,255,255,0.04)",
                  borderWidth: 1, borderColor: "rgba(99,102,241,0.25)",
                  borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
                }}>
                  <Ionicons name="person-outline" size={16} color="rgba(165,180,252,0.6)" />
                  <TextInput
                    value={editForm.name}
                    onChangeText={(v) => onChangeForm((p) => ({ ...p, name: v }))}
                    placeholder="Your full name"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    style={{ flex: 1, fontSize: 14, fontWeight: "600", color: "#fff" }}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              {/* Age + Gender row */}
              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,0.4)", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 }}>Age</Text>
                  <View style={{
                    flexDirection: "row", alignItems: "center", gap: 10,
                    backgroundColor: "rgba(255,255,255,0.04)",
                    borderWidth: 1, borderColor: "rgba(99,102,241,0.25)",
                    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
                  }}>
                    <Ionicons name="calendar-outline" size={15} color="rgba(165,180,252,0.6)" />
                    <TextInput
                      value={editForm.age}
                      onChangeText={(v) => onChangeForm((p) => ({ ...p, age: v.replace(/[^0-9]/g, "") }))}
                      placeholder="e.g. 25"
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      keyboardType="numeric"
                      style={{ flex: 1, fontSize: 14, fontWeight: "600", color: "#fff" }}
                    />
                  </View>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,0.4)", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 }}>Gender</Text>
                  <View style={{ flexDirection: "row", gap: 6 }}>
                    {["male", "female", "other"].map((g) => (
                      <TouchableOpacity
                        key={g}
                        onPress={() => onChangeForm((p) => ({ ...p, gender: p.gender === g ? "" : g }))}
                        style={{
                          flex: 1,
                          paddingVertical: 11, borderRadius: 12,
                          alignItems: "center", justifyContent: "center",
                          backgroundColor: editForm.gender === g ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.04)",
                          borderWidth: 1,
                          borderColor: editForm.gender === g ? "rgba(99,102,241,0.6)" : "rgba(255,255,255,0.08)",
                        }}
                      >
                        <Text style={{
                          fontSize: 10, fontWeight: "700",
                          color: editForm.gender === g ? "#a5b4fc" : "rgba(255,255,255,0.35)",
                          textTransform: "capitalize",
                        }}>
                          {g === "male" ? "♂" : g === "female" ? "♀" : "⚬"}{"\n"}{g}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              {/* Height + Weight row */}
              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,0.4)", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 }}>Height (cm)</Text>
                  <View style={{
                    flexDirection: "row", alignItems: "center", gap: 10,
                    backgroundColor: "rgba(255,255,255,0.04)",
                    borderWidth: 1, borderColor: "rgba(99,102,241,0.25)",
                    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
                  }}>
                    <Ionicons name="resize-outline" size={15} color="rgba(165,180,252,0.6)" />
                    <TextInput
                      value={editForm.heightCm}
                      onChangeText={(v) => onChangeForm((p) => ({ ...p, heightCm: v.replace(/[^0-9.]/g, "") }))}
                      placeholder="e.g. 175"
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      keyboardType="decimal-pad"
                      style={{ flex: 1, fontSize: 14, fontWeight: "600", color: "#fff" }}
                    />
                  </View>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,0.4)", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 }}>Weight (kg)</Text>
                  <View style={{
                    flexDirection: "row", alignItems: "center", gap: 10,
                    backgroundColor: "rgba(255,255,255,0.04)",
                    borderWidth: 1, borderColor: "rgba(99,102,241,0.25)",
                    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
                  }}>
                    <Ionicons name="scale-outline" size={15} color="rgba(165,180,252,0.6)" />
                    <TextInput
                      value={editForm.weight}
                      onChangeText={(v) => onChangeForm((p) => ({ ...p, weight: v.replace(/[^0-9.]/g, "") }))}
                      placeholder="e.g. 70"
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      keyboardType="decimal-pad"
                      style={{ flex: 1, fontSize: 14, fontWeight: "600", color: "#fff" }}
                    />
                  </View>
                </View>
              </View>

              {/* Goal Weight */}
              <View>
                <Text style={{ fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,0.4)", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 }}>Goal Weight (kg)</Text>
                <View style={{
                  flexDirection: "row", alignItems: "center", gap: 12,
                  backgroundColor: "rgba(255,255,255,0.04)",
                  borderWidth: 1, borderColor: "rgba(99,102,241,0.25)",
                  borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
                }}>
                  <Ionicons name="flag-outline" size={16} color="rgba(165,180,252,0.6)" />
                  <TextInput
                    value={editForm.goalWeight}
                    onChangeText={(v) => onChangeForm((p) => ({ ...p, goalWeight: v.replace(/[^0-9.]/g, "") }))}
                    placeholder="e.g. 65"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    keyboardType="decimal-pad"
                    style={{ flex: 1, fontSize: 14, fontWeight: "600", color: "#fff" }}
                  />
                </View>
              </View>

              {/* Fitness Goal */}
              <View>
                <Text style={{ fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,0.4)", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 10 }}>Fitness Goal</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {FITNESS_GOALS.map((g) => {
                    const active = editForm.fitnessGoal === g.key;
                    return (
                      <TouchableOpacity
                        key={g.key}
                        onPress={() => onChangeForm((p) => ({ ...p, fitnessGoal: p.fitnessGoal === g.key ? "" : g.key }))}
                        style={{
                          flexDirection: "row", alignItems: "center", gap: 6,
                          paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
                          backgroundColor: active ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)",
                          borderWidth: 1,
                          borderColor: active ? "rgba(99,102,241,0.55)" : "rgba(255,255,255,0.08)",
                        }}
                      >
                        <Ionicons name={g.icon} size={13} color={active ? "#a5b4fc" : "rgba(255,255,255,0.35)"} />
                        <Text style={{ fontSize: 12, fontWeight: "700", color: active ? "#a5b4fc" : "rgba(255,255,255,0.4)" }}>
                          {g.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Save button */}
              <TouchableOpacity
                onPress={onSave}
                disabled={saving}
                activeOpacity={0.85}
                style={{ marginTop: 4 }}
              >
                <LinearGradient
                  colors={saving ? ["#3d3d5c", "#3d3d5c"] : ["#4f46e5", "#7c3aed"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    borderRadius: 16, paddingVertical: 15,
                    alignItems: "center", flexDirection: "row",
                    justifyContent: "center", gap: 8,
                  }}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="rgba(255,255,255,0.6)" />
                  ) : (
                    <Ionicons name="checkmark-circle" size={18} color="#fff" />
                  )}
                  <Text style={{ fontSize: 15, fontWeight: "800", color: saving ? "rgba(255,255,255,0.4)" : "#fff", letterSpacing: 0.2 }}>
                    {saving ? "Saving…" : "Save Changes"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

            </ScrollView>
          </Animated.View>
        </TouchableOpacity>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  </Modal>
);

export default EditProfileModal;
