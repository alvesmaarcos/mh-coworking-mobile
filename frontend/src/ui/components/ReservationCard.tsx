import Feather from '@expo/vector-icons/Feather';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Reservation } from '../../domain/models';
import { formatDate, formatPrice } from '../../domain/reservations';
import { colors } from '../theme';

export function ReservationCard({ reservation, completed, onCancel }: { reservation: Reservation; completed: boolean; onCancel: (value: Reservation) => void }) {
  return <View style={styles.card}>
    <View style={styles.heading}>
      <Text style={styles.name}>{reservation.sala_nome}</Text>
      {completed ? <View style={styles.badge}><Text style={styles.badgeText}>Concluída</Text></View> : null}
    </View>
    <View style={styles.details}>
      <View style={styles.detail}><Feather name="calendar" size={14} color={colors.icon} /><Text style={styles.meta}>{formatDate(reservation.data)}</Text></View>
      <View style={styles.detail}><Feather name="clock" size={14} color={colors.icon} /><Text style={styles.meta}>{reservation.hora}h</Text></View>
    </View>
    <View style={styles.footer}>
      <Text style={styles.price}>{formatPrice(reservation.valor)}</Text>
      {!completed ? <Pressable accessibilityRole="button" accessibilityLabel={`Cancelar reserva de ${reservation.sala_nome} em ${formatDate(reservation.data)} às ${reservation.hora}h`}
        onPress={() => onCancel(reservation)} style={({ pressed }) => [styles.cancel, pressed && { opacity: 0.5 }]}>
        <Text style={styles.cancelText}>Cancelar reserva</Text>
      </Pressable> : null}
    </View>
  </View>;
}
const styles = StyleSheet.create({
  card: { borderWidth: 1, borderColor: colors.border, borderRadius: 11, paddingHorizontal: 10, paddingTop: 14, paddingBottom: 6, minHeight: 130, backgroundColor: colors.white },
  heading: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  name: { color: colors.navy, fontSize: 15, lineHeight: 20, fontWeight: '700', flex: 1 },
  badge: { backgroundColor: colors.badge, borderRadius: 4, paddingHorizontal: 11, paddingVertical: 3 },
  badgeText: { color: colors.navy, fontSize: 9, fontWeight: '700' },
  details: { flexDirection: 'row', gap: 14, marginTop: 8 }, detail: { flexDirection: 'row', gap: 3, alignItems: 'center' },
  meta: { color: colors.gray, fontSize: 14 }, footer: { marginTop: 18, minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  price: { color: colors.orange, fontSize: 16, fontWeight: '700', marginLeft: 3 },
  cancel: { minHeight: 44, paddingHorizontal: 8, justifyContent: 'center' }, cancelText: { color: colors.navy, fontSize: 12, fontWeight: '600', textDecorationLine: 'underline' },
});
