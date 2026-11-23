import Feather from '@expo/vector-icons/Feather';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';

export type AppTab = 'rooms' | 'reservations' | 'profile';

const items = [
  { key: 'rooms', label: 'Salas', icon: 'home' },
  { key: 'reservations', label: 'Reservas', icon: 'calendar' },
  { key: 'profile', label: 'Perfil', icon: 'user' },
] as const;

export function BottomNavigation({
  active,
  onSelect,
  disabledTabs = [],
}: {
  active: AppTab;
  onSelect: (tab: AppTab) => void;
  disabledTabs?: readonly AppTab[];
}) {
  const insets = useSafeAreaInsets();
  return <View style={[styles.navigation, { paddingBottom: Math.max(insets.bottom, 8) }]}>
    {items.map(item => {
      const selected = item.key === active;
      const disabled = disabledTabs.includes(item.key);
      const content = <>
        <Feather name={item.icon} size={item.key === 'reservations' ? 24 : 23} color={selected ? '#080808' : colors.gray} />
        <Text style={[styles.label, selected && styles.activeLabel]}>{item.label}</Text>
      </>;
      return disabled
        ? <View key={item.key} accessibilityLabel={item.label} accessibilityState={{ disabled: true }} style={styles.item}>{content}</View>
        : <Pressable key={item.key} accessibilityRole="tab" accessibilityLabel={item.label} accessibilityState={{ selected }}
          onPress={() => onSelect(item.key)} style={styles.item}>{content}</Pressable>;
    })}
  </View>;
}

const styles = StyleSheet.create({
  navigation: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#C7C7C7', paddingTop: 12, backgroundColor: colors.white },
  item: { flex: 1, minHeight: 43, alignItems: 'center', gap: 4 },
  label: { fontSize: 9, fontWeight: '600', color: colors.gray },
  activeLabel: { color: '#080808', fontWeight: '700' },
});
