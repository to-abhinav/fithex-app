
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Platform,
  Dimensions,
  StyleSheet,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, { SlideInDown, Easing } from "react-native-reanimated";

const ImagePickerModal = ({
  visible,
  onClose,
  avatars,
  user,
  uploading,
  selectedAvatarId,
  pickerTab,
  onTabChange,
  onAvatarSelect,
  onPickImage,
}) => (
  <Modal
    visible={visible}
    transparent
    animationType="none"
    statusBarTranslucent
    onRequestClose={() => !uploading && onClose()}
  >
    <TouchableOpacity
      activeOpacity={1}
      onPress={() => !uploading && onClose()}
      style={{
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "flex-end",
      }}
    >
      {/* Sheet content — stop propagation */}
      <TouchableOpacity activeOpacity={1} onPress={() => {}}>
        <Animated.View
          entering={SlideInDown.duration(350).easing(Easing.out(Easing.cubic))}
          style={{
            backgroundColor: "#111118",
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            borderWidth: 1,
            borderColor: "rgba(99,102,241,0.15)",
            borderBottomWidth: 0,
            paddingBottom: Platform.OS === "ios" ? 40 : 24,
            maxHeight: Dimensions.get("window").height * 0.80,
          }}
        >
          <View style={{ alignItems: "center", paddingTop: 12, paddingBottom: 8 }}>
            <View
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: "rgba(255,255,255,0.15)",
              }}
            />
          </View>

          <Text
            style={{
              textAlign: "center",
              fontSize: 17,
              fontWeight: "800",
              color: "#fff",
              letterSpacing: -0.3,
              marginBottom: 16,
            }}
          >
            Change Profile Photo
          </Text>

          <View
            style={{
              flexDirection: "row",
              marginHorizontal: 20,
              marginBottom: 18,
              backgroundColor: "rgba(255,255,255,0.05)",
              borderRadius: 14,
              padding: 4,
            }}
          >
            {["avatar", "upload"].map((tab) => (
              <TouchableOpacity
                key={tab}
                activeOpacity={0.8}
                onPress={() => onTabChange(tab)}
                style={{ flex: 1 }}
              >
                {pickerTab === tab ? (
                  <LinearGradient
                    colors={["#6366f1", "#8b5cf6"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      borderRadius: 11,
                      paddingVertical: 10,
                      alignItems: "center",
                      flexDirection: "row",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    <Ionicons
                      name={tab === "avatar" ? "people" : "cloud-upload"}
                      size={14}
                      color="#fff"
                    />
                    <Text style={{ fontSize: 13, fontWeight: "700", color: "#fff" }}>
                      {tab === "avatar" ? "Choose Avatar" : "Upload Photo"}
                    </Text>
                  </LinearGradient>
                ) : (
                  <View
                    style={{
                      borderRadius: 11,
                      paddingVertical: 10,
                      alignItems: "center",
                      flexDirection: "row",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    <Ionicons
                      name={tab === "avatar" ? "people-outline" : "cloud-upload-outline"}
                      size={14}
                      color="rgba(255,255,255,0.4)"
                    />
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "600",
                        color: "rgba(255,255,255,0.4)",
                      }}
                    >
                      {tab === "avatar" ? "Choose Avatar" : "Upload Photo"}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {pickerTab === "avatar" ? (
            <FlatList
              data={avatars}
              keyExtractor={(item) => item.id}
              numColumns={4}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }}
              columnWrapperStyle={{ gap: 12, marginBottom: 12 }}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={{ alignItems: "center", paddingVertical: 32 }}>
                  <ActivityIndicator size="small" color="#6366f1" />
                  <Text
                    style={{
                      color: "rgba(255,255,255,0.3)",
                      fontSize: 12,
                      marginTop: 10,
                    }}
                  >
                    Loading avatars…
                  </Text>
                </View>
              }
              renderItem={({ item }) => {
                const isSelected = user?.profileImage === item.url;
                const isSelecting = selectedAvatarId === item.id && uploading;
                return (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => onAvatarSelect(item.id)}
                    disabled={uploading}
                    style={{ flex: 1, alignItems: "center" }}
                  >
                    <View
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: 36,
                        borderWidth: 2.5,
                        borderColor: isSelected ? "#6366f1" : "rgba(255,255,255,0.08)",
                        padding: 3,
                        backgroundColor: isSelected
                          ? "rgba(99,102,241,0.12)"
                          : "rgba(255,255,255,0.03)",
                      }}
                    >
                      <Image
                        source={{ uri: item.url }}
                        style={{
                          width: "100%",
                          height: "100%",
                          borderRadius: 34,
                        }}
                        resizeMode="cover"
                      />
                      {isSelecting && (
                        <View
                          style={{
                            ...StyleSheet.absoluteFillObject,
                            borderRadius: 34,
                            backgroundColor: "rgba(0,0,0,0.5)",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <ActivityIndicator size="small" color="#fff" />
                        </View>
                      )}
                    </View>
                    {isSelected && (
                      <View
                        style={{
                          position: "absolute",
                          bottom: -2,
                          right: "50%",
                          marginRight: -10,
                          width: 20,
                          height: 20,
                          borderRadius: 10,
                          backgroundColor: "#6366f1",
                          borderWidth: 2,
                          borderColor: "#111118",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Ionicons name="checkmark" size={11} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          ) : (
            <View style={{ paddingHorizontal: 20, gap: 12 }}>
              {/* Camera */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => onPickImage(true)}
                disabled={uploading}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 14,
                  backgroundColor: "rgba(255,255,255,0.04)",
                  borderWidth: 1,
                  borderColor: "rgba(99,102,241,0.2)",
                  borderRadius: 16,
                  paddingVertical: 16,
                  paddingHorizontal: 18,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    backgroundColor: "rgba(99,102,241,0.12)",
                    borderWidth: 1,
                    borderColor: "rgba(99,102,241,0.25)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="camera-outline" size={22} color="#a5b4fc" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff" }}>
                    Take Photo
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: "rgba(255,255,255,0.35)",
                      marginTop: 2,
                    }}
                  >
                    Use your camera to snap a new pic
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.2)" />
              </TouchableOpacity>

              {/* Photo Library */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => onPickImage(false)}
                disabled={uploading}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 14,
                  backgroundColor: "rgba(255,255,255,0.04)",
                  borderWidth: 1,
                  borderColor: "rgba(139,92,246,0.2)",
                  borderRadius: 16,
                  paddingVertical: 16,
                  paddingHorizontal: 18,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    backgroundColor: "rgba(139,92,246,0.12)",
                    borderWidth: 1,
                    borderColor: "rgba(139,92,246,0.25)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="images-outline" size={22} color="#c4b5fd" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff" }}>
                    Choose from Library
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: "rgba(255,255,255,0.35)",
                      marginTop: 2,
                    }}
                  >
                    Pick an existing photo from your gallery
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.2)" />
              </TouchableOpacity>

              {/* Upload in progress overlay */}
              {uploading && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    paddingVertical: 14,
                  }}
                >
                  <ActivityIndicator size="small" color="#6366f1" />
                  <Text
                    style={{
                      color: "rgba(255,255,255,0.5)",
                      fontSize: 13,
                      fontWeight: "600",
                    }}
                  >
                    Uploading…
                  </Text>
                </View>
              )}
            </View>
          )}
        </Animated.View>
      </TouchableOpacity>
    </TouchableOpacity>
  </Modal>
);

export default ImagePickerModal;
