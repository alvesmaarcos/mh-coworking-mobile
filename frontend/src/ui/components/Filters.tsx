import { useState } from 'react';
import Feather from '@expo/vector-icons/Feather';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Filters as FilterValues, Room } from '../../domain/models';
import { dateKey, formatDate } from '../../domain/reservations';
import { colors } from '../theme';
import { Button } from './Button';
import { Dialog } from './Dialog';

export function Filters({ value, rooms, onChange }: { value: FilterValues; rooms: Room[]; onChange: (value: FilterValues) => void }) {
  const [picker, setPicker] = useState<'rooms' | 'date' | null>(null);
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const room = rooms.find(item => item.id === value.roomId);
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const leading = month.getDay();
  function openDate() {
    const [year, selectedMonth] = (value.date ?? dateKey(new Date())).split('-').map(Number);
    setMonth(new Date(year, selectedMonth - 1, 1));
    setPicker('date');
  }
  return <>
    <View style={styles.bar}>
      <Pressable hitSlop={{ top: 8, bottom: 8 }} accessibilityRole="button" accessibilityLabel={`Filtrar por sala: ${room?.nome ?? 'Todas'}`} onPress={() => setPicker('rooms')} style={[styles.filter, styles.divider]}>
        <Text numberOfLines={1} style={styles.filterText}>{room?.nome ?? 'Salas'}</Text><Feather name="chevron-down" size={19} color="#111" />
      </Pressable>
      <Pressable hitSlop={{ top: 8, bottom: 8 }} accessibilityRole="button" accessibilityLabel={`Filtrar por data: ${value.date ? formatDate(value.date) : 'Todas'}`} onPress={openDate} style={styles.filter}>
        <Text style={styles.filterText}>{value.date ? formatDate(value.date) : 'Data'}</Text><Feather name="chevron-down" size={19} color="#111" />
      </Pressable>
    </View>
    <Dialog title="Filtrar por sala" visible={picker === 'rooms'} onClose={() => setPicker(null)}>
      <View>
        {[{ id: undefined, nome: 'Todas as salas' }, ...rooms].map(item => <Pressable key={item.id ?? 'all'} accessibilityRole="radio" accessibilityState={{ checked: value.roomId === item.id }}
          onPress={() => { onChange({ ...value, roomId: item.id }); setPicker(null); }} style={styles.option}>
          <Text style={styles.optionText}>{item.nome}</Text>{value.roomId === item.id ? <Feather name="check" size={18} color={colors.navy} /> : null}
        </Pressable>)}
      </View>
      <Button title="Fechar" secondary onPress={() => setPicker(null)} />
    </Dialog>
    <Dialog title="Filtrar por data" visible={picker === 'date'} onClose={() => setPicker(null)}>
      <View style={styles.month}>
        <Pressable accessibilityRole="button" accessibilityLabel="Mês anterior" style={styles.arrow} onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><Feather name="chevron-left" size={22} color={colors.navy} /></Pressable>
        <Text style={styles.monthText}>{month.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Próximo mês" style={styles.arrow} onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><Feather name="chevron-right" size={22} color={colors.navy} /></Pressable>
      </View>
      <View style={styles.grid}>
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, index) => <View key={`weekday-${index}`} style={styles.day}><Text style={styles.weekday}>{day}</Text></View>)}
        {Array.from({ length: leading }, (_, i) => <View key={`empty-${i}`} style={styles.day} />)}
        {Array.from({ length: days }, (_, i) => {
          const key = dateKey(new Date(month.getFullYear(), month.getMonth(), i + 1));
          const selected = value.date === key;
          return <Pressable key={key} accessibilityRole="button" accessibilityLabel={formatDate(key)} accessibilityState={{ selected }}
            style={[styles.day, selected && styles.selectedDay]} onPress={() => { onChange({ ...value, date: key }); setPicker(null); }}>
            <Text style={[styles.dayText, selected && { color: colors.white }]}>{i + 1}</Text>
          </Pressable>;
        })}
      </View>
      <Button title="Todas as datas" secondary onPress={() => { onChange({ ...value, date: undefined }); setPicker(null); }} />
      <Button title="Fechar" secondary onPress={() => setPicker(null)} />
    </Dialog>
  </>;
}
const styles = StyleSheet.create({
  bar: { flexDirection: 'row', borderWidth: 1, borderColor: '#CBCBCB', borderRadius: 10, marginHorizontal: 19, minHeight: 30 },
  filter: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 28, paddingHorizontal: 10, gap: 4 },
  divider: { borderRightWidth: 1, borderRightColor: '#BDBDBD' }, filterText: { color: colors.navy, fontSize: 16, fontWeight: '700', textAlign: 'center', flex: 1 },
  option: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.border, gap: 8 },
  optionText: { color: colors.navy, fontSize: 16, flex: 1 }, month: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  arrow: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, monthText: { color: colors.navy, fontWeight: '600', textTransform: 'capitalize' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' }, day: { width: '14.2857%', height: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 22 },
  weekday: { color: colors.gray, fontSize: 12 }, dayText: { color: colors.navy, fontSize: 15 }, selectedDay: { backgroundColor: colors.navy },
});
