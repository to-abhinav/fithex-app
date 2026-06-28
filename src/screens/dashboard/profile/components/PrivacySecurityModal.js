
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

const PrivacySecurityModal = ({
  visible,
  onClose,
  passwordForm,
  showPasswords,
  onTogglePasswordVisibility,
  onChangePasswordForm,
  onSubmitPassword,
  passwordSaving,
  showDeleteConfirm,
  deletePassword,
  showDeletePassword,
  deleteLoading,
  onDeleteAccount,
  onConfirmDelete,
  onCancelDelete,
  onSetDeletePassword,
  onToggleDeletePassword,
}) => (
  <Modal
    visible={visible}
    transparent
    animationType="none"
    statusBarTranslucent
    onRequestClose={() => !passwordSaving && !deleteLoading && onClose()}
  >
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => !passwordSaving && !deleteLoading && onClose()}
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.65)",
          justifyContent: "flex-end",
        }}
      >
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
                <Text style={{ fontSize: 20, fontWeight: "900", color: "#fff", letterSpacing: -0.5 }}>Privacy & Security</Text>
                <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>Manage your account security</Text>
              </View>
              <TouchableOpacity
                onPress={() => !passwordSaving && !deleteLoading && onClose()}
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

              <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: 1.5, fontWeight: "700" }}>Change Password</Text>

              <View>
                <Text style={{ fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,0.4)", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 }}>Current Password</Text>
                <View style={{
                  flexDirection: "row", alignItems: "center", gap: 12,
                  backgroundColor: "rgba(255,255,255,0.04)",
                  borderWidth: 1, borderColor: "rgba(99,102,241,0.25)",
                  borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
                }}>
                  <Ionicons name="lock-closed-outline" size={16} color="rgba(165,180,252,0.6)" />
                  <TextInput
                    value={passwordForm.current}
                    onChangeText={(v) => onChangePasswordForm((p) => ({ ...p, current: v }))}
                    placeholder="Enter current password"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    secureTextEntry={!showPasswords.current}
                    style={{ flex: 1, fontSize: 14, fontWeight: "600", color: "#fff" }}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => onTogglePasswordVisibility("current")}>
                    <Ionicons name={showPasswords.current ? "eye-off-outline" : "eye-outline"} size={18} color="rgba(255,255,255,0.3)" />
                  </TouchableOpacity>
                </View>
              </View>

              <View>
                <Text style={{ fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,0.4)", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 }}>New Password</Text>
                <View style={{
                  flexDirection: "row", alignItems: "center", gap: 12,
                  backgroundColor: "rgba(255,255,255,0.04)",
                  borderWidth: 1, borderColor: "rgba(99,102,241,0.25)",
                  borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
                }}>
                  <Ionicons name="key-outline" size={16} color="rgba(165,180,252,0.6)" />
                  <TextInput
                    value={passwordForm.new}
                    onChangeText={(v) => onChangePasswordForm((p) => ({ ...p, new: v }))}
                    placeholder="Min 6 characters"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    secureTextEntry={!showPasswords.new}
                    style={{ flex: 1, fontSize: 14, fontWeight: "600", color: "#fff" }}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => onTogglePasswordVisibility("new")}>
                    <Ionicons name={showPasswords.new ? "eye-off-outline" : "eye-outline"} size={18} color="rgba(255,255,255,0.3)" />
                  </TouchableOpacity>
                </View>
              </View>

              <View>
                <Text style={{ fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,0.4)", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 }}>Confirm New Password</Text>
                <View style={{
                  flexDirection: "row", alignItems: "center", gap: 12,
                  backgroundColor: "rgba(255,255,255,0.04)",
                  borderWidth: 1, borderColor: "rgba(99,102,241,0.25)",
                  borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
                }}>
                  <Ionicons name="checkmark-circle-outline" size={16} color="rgba(165,180,252,0.6)" />
                  <TextInput
                    value={passwordForm.confirm}
                    onChangeText={(v) => onChangePasswordForm((p) => ({ ...p, confirm: v }))}
                    placeholder="Re-enter new password"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    secureTextEntry={!showPasswords.confirm}
                    style={{ flex: 1, fontSize: 14, fontWeight: "600", color: "#fff" }}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => onTogglePasswordVisibility("confirm")}>
                    <Ionicons name={showPasswords.confirm ? "eye-off-outline" : "eye-outline"} size={18} color="rgba(255,255,255,0.3)" />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                onPress={onSubmitPassword}
                disabled={passwordSaving}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={passwordSaving ? ["#3d3d5c", "#3d3d5c"] : ["#4f46e5", "#7c3aed"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    borderRadius: 16, paddingVertical: 15,
                    alignItems: "center", flexDirection: "row",
                    justifyContent: "center", gap: 8,
                  }}
                >
                  {passwordSaving ? (
                    <ActivityIndicator size="small" color="rgba(255,255,255,0.6)" />
                  ) : (
                    <Ionicons name="shield-checkmark" size={18} color="#fff" />
                  )}
                  <Text style={{ fontSize: 15, fontWeight: "800", color: passwordSaving ? "rgba(255,255,255,0.4)" : "#fff", letterSpacing: 0.2 }}>
                    {passwordSaving ? "Updating…" : "Update Password"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.06)", marginVertical: 4 }} />

              <Text style={{ fontSize: 10, color: "rgba(248,113,113,0.6)", textTransform: "uppercase", letterSpacing: 1.5, fontWeight: "700" }}>Danger Zone</Text>

              <View style={{
                backgroundColor: "rgba(239,68,68,0.06)",
                borderWidth: 1,
                borderColor: "rgba(239,68,68,0.18)",
                borderRadius: 18,
                padding: 16,
              }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <View style={{
                    width: 36, height: 36, borderRadius: 12,
                    backgroundColor: "rgba(239,68,68,0.12)",
                    borderWidth: 1, borderColor: "rgba(239,68,68,0.25)",
                    alignItems: "center", justifyContent: "center",
                  }}>
                    <Ionicons name="warning-outline" size={18} color="#f87171" />
                  </View>
                  <Text style={{ fontSize: 15, fontWeight: "800", color: "#f87171" }}>Delete Account</Text>
                </View>

                <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 18, marginBottom: 14 }}>
                  This will permanently delete your account and all associated data. This action cannot be undone.
                </Text>

                {!showDeleteConfirm ? (
                  <TouchableOpacity
                    onPress={onDeleteAccount}
                    activeOpacity={0.85}
                  >
                    <View style={{
                      borderRadius: 14, paddingVertical: 13,
                      alignItems: "center", flexDirection: "row",
                      justifyContent: "center", gap: 8,
                      backgroundColor: "rgba(239,68,68,0.15)",
                      borderWidth: 1,
                      borderColor: "rgba(239,68,68,0.3)",
                    }}>
                      <Ionicons name="trash-outline" size={16} color="#f87171" />
                      <Text style={{ fontSize: 14, fontWeight: "700", color: "#f87171" }}>Delete My Account</Text>
                    </View>
                  </TouchableOpacity>
                ) : (
                  <View>
                    <Text style={{ fontSize: 12, fontWeight: "700", color: "rgba(248,113,113,0.8)", marginBottom: 10 }}>
                      Enter your password to confirm:
                    </Text>
                    <View style={{
                      flexDirection: "row", alignItems: "center", gap: 12,
                      marginBottom: 12,
                      backgroundColor: "rgba(239,68,68,0.08)",
                      borderWidth: 1,
                      borderColor: "rgba(239,68,68,0.25)",
                      borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11,
                    }}>
                      <Ionicons name="lock-closed-outline" size={16} color="rgba(248,113,113,0.6)" />
                      <TextInput
                        value={deletePassword}
                        onChangeText={onSetDeletePassword}
                        placeholder="Your password"
                        placeholderTextColor="rgba(248,113,113,0.3)"
                        secureTextEntry={!showDeletePassword}
                        autoCapitalize="none"
                        style={{
                          flex: 1, fontSize: 14, fontWeight: "600",
                          color: "rgba(255,255,255,0.8)",
                        }}
                      />
                      <TouchableOpacity onPress={onToggleDeletePassword}>
                        <Ionicons name={showDeletePassword ? "eye-off-outline" : "eye-outline"} size={18} color="rgba(248,113,113,0.4)" />
                      </TouchableOpacity>
                    </View>
                    <View style={{ flexDirection: "row", gap: 10 }}>
                      <TouchableOpacity
                        onPress={onCancelDelete}
                        style={{ flex: 1 }}
                        activeOpacity={0.8}
                      >
                        <View style={{
                          borderRadius: 12, paddingVertical: 12,
                          alignItems: "center",
                          backgroundColor: "rgba(255,255,255,0.06)",
                          borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
                        }}>
                          <Text style={{ fontSize: 13, fontWeight: "700", color: "rgba(255,255,255,0.5)" }}>Cancel</Text>
                        </View>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={onConfirmDelete}
                        disabled={deleteLoading || !deletePassword.trim()}
                        style={{ flex: 1 }}
                        activeOpacity={0.85}
                      >
                        <View style={{
                          borderRadius: 12, paddingVertical: 12,
                          alignItems: "center", flexDirection: "row",
                          justifyContent: "center", gap: 6,
                          backgroundColor: deletePassword.trim() ? "rgba(220,38,38,0.8)" : "rgba(239,68,68,0.12)",
                          borderWidth: 1,
                          borderColor: deletePassword.trim() ? "rgba(220,38,38,0.9)" : "rgba(239,68,68,0.2)",
                        }}>
                          {deleteLoading ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <>
                              <Ionicons name="trash" size={14} color={deletePassword.trim() ? "#fff" : "rgba(248,113,113,0.4)"} />
                              <Text style={{ fontSize: 13, fontWeight: "700", color: deletePassword.trim() ? "#fff" : "rgba(248,113,113,0.4)" }}>Confirm Delete</Text>
                            </>
                          )}
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>

            </ScrollView>
          </Animated.View>
        </TouchableOpacity>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  </Modal>
);

export default PrivacySecurityModal;
