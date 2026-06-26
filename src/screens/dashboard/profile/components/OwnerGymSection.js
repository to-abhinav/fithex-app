
import { View, Text } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SettingsRow } from "../primitives";

const OwnerGymSection = ({ user, navigation }) => (
  <Animated.View entering={FadeInDown.delay(500).springify()} style={{ marginHorizontal: 20, marginBottom: 14 }}>
    <View
      style={{
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.07)',
        borderRadius: 20,
        paddingHorizontal: 18,
        paddingTop: 6,
        paddingBottom: 6,
      }}
    >
      <Text
        style={{
          fontSize: 10,
          color: 'rgba(255,255,255,0.25)',
          textTransform: 'uppercase',
          letterSpacing: 1.5,
          fontWeight: '700',
          paddingTop: 14,
          paddingBottom: 6,
        }}
      >
        Gym Management
      </Text>

      <SettingsRow
        icon="business-outline"
        label="My Gym"
        onPress={() => navigation.navigate('Main', { screen: 'MyGym' })}
        delay={520}
      />

      {user?.gymId && (
        <SettingsRow
          icon="shield-checkmark-outline"
          label="Gym Status"
          value="Active"
          delay={540}
        />
      )}
    </View>
  </Animated.View>
);

export default OwnerGymSection;
