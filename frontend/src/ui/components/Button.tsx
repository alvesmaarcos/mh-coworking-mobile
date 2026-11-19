import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../theme';

export function Button({ title, onPress, busy = false, secondary = false, disabled = false }: {
  title: string; onPress: () => void; busy?: boolean; secondary?: boolean; disabled?: boolean;
}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ disabled: disabled || busy, busy }}
    disabled={disabled || busy} onPress={onPress} style={({ pressed }) => [styles.button, secondary && styles.secondary, (pressed || disabled || busy) && styles.dim]}>
    {busy ? <ActivityIndicator color={secondary ? colors.navy : colors.white} /> : <Text style={[styles.label, secondary && styles.secondaryLabel]}>{title}</Text>}
  </Pressable>;
}
const styles = StyleSheet.create({
  button: { minHeight: 48, borderRadius: 10, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  secondary: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.selectedBorder },
  label: { color: colors.white, fontSize: 15, fontWeight: '600' }, secondaryLabel: { color: colors.navy }, dim: { opacity: 0.6 },
});
