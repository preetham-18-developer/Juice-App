import { View, ActivityIndicator } from 'react-native';
import { COLORS } from '../src/theme/tokens';

export default function IndexScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF8E7' }}>
      <ActivityIndicator size="large" color={COLORS.primaryGreen} />
    </View>
  );
}
