import { useState } from 'react';
import Feather from '@expo/vector-icons/Feather';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Room } from '../../domain/models';
import { formatPrice } from '../../domain/reservations';
import { colors } from '../theme';

export function RoomCard({ room, imageUrl, onPress }: { room: Room; imageUrl: string | null; onPress?: () => void }) {
  const [imageFailed, setImageFailed] = useState(false);
  const attributes = (room.atributos ?? '').split(',').map(value => value.trim()).filter(Boolean);
  return <Pressable accessibilityRole="button" accessibilityLabel={`Ver detalhes de ${room.nome}`} onPress={onPress} disabled={!onPress}
    style={({ pressed }) => [styles.card, pressed && onPress ? styles.pressed : null]}>
    {imageUrl && !imageFailed
      ? <Image accessibilityRole="image" accessibilityLabel={`Foto de ${room.nome}`} source={{ uri: imageUrl }} onError={() => setImageFailed(true)} style={styles.image} />
      : <View style={[styles.image, styles.imageFallback]}><Feather name="image" size={26} color={colors.gray} /></View>}
    <View style={styles.content}>
      <Text style={styles.name}>{room.nome}</Text>
      {room.descricao ? <Text numberOfLines={2} style={styles.description}>{room.descricao}</Text> : null}
      {attributes.length ? <View style={styles.attributes}>{attributes.map((attribute, index) =>
        <View key={`${attribute}-${index}`} style={styles.attribute}><Text style={styles.attributeText}>{attribute}</Text></View>)}</View> : null}
      {room.valor_hora !== undefined ? <View style={styles.priceRow}>
        <Text style={styles.price}>{formatPrice(room.valor_hora)}</Text><Text style={styles.perHour}>/h</Text>
      </View> : null}
    </View>
  </Pressable>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 4,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 3,
    elevation: 3,
  },
  pressed: { opacity: 0.75 },
  image: { width: '100%', height: 82, borderRadius: 7, backgroundColor: colors.surface },
  imageFallback: { alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 4, paddingTop: 6, paddingBottom: 2 },
  name: { color: colors.navy, fontSize: 13, lineHeight: 17, fontWeight: '700' },
  description: { color: colors.gray, fontSize: 9, lineHeight: 12, marginTop: 2 },
  attributes: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 5 },
  attribute: { backgroundColor: colors.badge, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  attributeText: { color: colors.navy, fontSize: 8, lineHeight: 11, fontWeight: '600' },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'flex-end', marginTop: 2, gap: 2 },
  price: { color: colors.orange, fontSize: 10, fontWeight: '700' },
  perHour: { color: colors.gray, fontSize: 8 },
});
