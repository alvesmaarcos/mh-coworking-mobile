import { useCallback, useEffect, useRef, useState } from 'react';
import Feather from '@expo/vector-icons/Feather';
import { ActivityIndicator, AppState, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiClient, ApiError } from '../infrastructure/api';
import { Cancellation } from '../application/cancellation';
import type { Filters as FilterValues, Reservation, ReservationTab, Room, Session } from '../domain/models';
import { formatDate, selectReservations } from '../domain/reservations';
import { Button } from './components/Button';
import { Dialog } from './components/Dialog';
import { Filters } from './components/Filters';
import { ReservationCard } from './components/ReservationCard';
import { colors } from './theme';

export function ReservationsScreen({ api, session, onLogout }: { api: ApiClient; session: Session; onLogout: () => void }) {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<ReservationTab>('upcoming');
  const [filters, setFilters] = useState<FilterValues>({});
  const [rooms, setRooms] = useState<Room[]>([]);
  const [items, setItems] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [roomError, setRoomError] = useState('');
  const [notice, setNotice] = useState('');
  const [revision, setRevision] = useState(0);
  const [now, setNow] = useState(Date.now);
  const [selected, setSelected] = useState<Reservation | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const cancellation = useRef(new Cancellation());
  const mounted = useRef(true);
  const reload = useCallback(() => { setNow(Date.now()); setRevision(value => value + 1); }, []);

  useEffect(() => {
    mounted.current = true;
    const interval = setInterval(() => setNow(Date.now()), 60000);
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') reload(); });
    return () => { mounted.current = false; clearInterval(interval); subscription.remove(); };
  }, [reload]);

  useEffect(() => {
    const controller = new AbortController();
    setRoomError('');
    api.rooms(controller.signal).then(value => { if (!controller.signal.aborted) setRooms(value); }).catch(() => {
      if (!controller.signal.aborted) setRoomError('Não foi possível carregar as salas para o filtro.');
    });
    return () => controller.abort();
  }, [api, revision]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    api.reservations(session.token, { roomId: filters.roomId, date: filters.date }, controller.signal)
      .then(value => { if (!controller.signal.aborted) setItems(value); })
      .catch(cause => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Não foi possível carregar as reservas.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [api, session.token, filters.roomId, filters.date, revision]);

  function requestCancel(item: Reservation) { setSelected(item); setCancelError(''); }
  async function confirmCancel() {
    if (!selected) return;
    const id = selected.id;
    await cancellation.current.run(async () => {
      setCancelling(true);
      setCancelError('');
      try {
        await api.cancel(session.token, id);
        if (!mounted.current) return;
        setItems(current => current.filter(item => item.id !== id));
        setSelected(null);
        setNotice('Reserva cancelada.');
        reload();
      } catch (cause) {
        if (!mounted.current) return;
        const message = cause instanceof Error ? cause.message : 'Não foi possível cancelar a reserva.';
        if (cause instanceof ApiError && (cause.status === 400 || cause.status === 404)) {
          setSelected(null);
          setNotice(message);
          reload();
        } else { setCancelError(message); }
      } finally { if (mounted.current) setCancelling(false); }
    });
  }

  const visible = selectReservations(items, tab, now, filters);
  const listError = error || roomError;
  return <View style={styles.page}>
    <View style={styles.header}><Text accessibilityRole="header" style={styles.title}>Reservas</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Sair da conta" onPress={onLogout} style={styles.logout}><Text style={styles.logoutText}>Sair</Text></Pressable>
    </View>
    <View style={styles.tabs}>
      {([{ key: 'upcoming', title: 'Próximas' }, { key: 'history', title: 'Histórico' }] as const).map(item => <Pressable
        key={item.key} accessibilityRole="tab" accessibilityState={{ selected: tab === item.key }} onPress={() => { setTab(item.key); setNotice(''); }}
        style={[styles.tab, tab === item.key && styles.activeTab]}><Text style={[styles.tabText, tab === item.key && styles.activeTabText]}>{item.title}</Text></Pressable>)}
    </View>
    <Filters value={filters} rooms={rooms} onChange={value => { setFilters(value); setNotice(''); }} />
    {notice ? <Pressable accessibilityRole="button" accessibilityLabel={`${notice} Fechar aviso`} onPress={() => setNotice('')} style={styles.notice}><Text accessibilityLiveRegion="polite" style={styles.noticeText}>{notice}</Text><Feather name="x" size={16} color={colors.navy} /></Pressable> : null}
    <View style={styles.list}>
    <FlatList data={loading || error ? [] : visible} keyExtractor={item => String(item.id)} style={{ flex: 1 }} contentContainerStyle={styles.listContent}
      renderItem={({ item }) => <ReservationCard reservation={item} completed={tab === 'history'} onCancel={requestCancel} />}
      ItemSeparatorComponent={Separator} refreshing={loading} onRefresh={reload}
      ListHeaderComponent={listError ? <View style={styles.state}><Text accessibilityRole="alert" style={styles.error}>{listError}</Text><Button title="Tentar novamente" secondary onPress={reload} /></View> : undefined}
      ListEmptyComponent={loading ? <View style={styles.state}><ActivityIndicator accessibilityLabel="Carregando reservas" color={colors.navy} /><Text style={styles.emptyText}>Carregando reservas…</Text></View> : !error ?
        <View style={styles.state}><Feather name="calendar" size={30} color={colors.icon} /><Text style={styles.emptyTitle}>{tab === 'upcoming' ? 'Nenhuma reserva próxima' : 'Nenhuma reserva no histórico'}</Text><Text style={styles.emptyText}>{filters.roomId !== undefined || filters.date ? 'Não há reservas para os filtros selecionados.' : 'As reservas aparecerão aqui quando estiverem disponíveis.'}</Text></View> : undefined}
    />
    </View>
    <View style={[styles.navigation, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View accessibilityLabel="Salas, indisponível nesta etapa" accessibilityState={{ disabled: true }} style={styles.navItem}><Feather name="home" size={23} color={colors.gray} /><Text style={styles.navText}>Salas</Text></View>
      <View accessibilityRole="tab" accessibilityLabel="Reservas" accessibilityState={{ selected: true }} style={styles.navItem}><Feather name="calendar" size={24} color="#080808" /><Text style={[styles.navText, styles.navActive]}>Reservas</Text></View>
      <View accessibilityLabel="Perfil, indisponível nesta etapa" accessibilityState={{ disabled: true }} style={styles.navItem}><Feather name="user" size={24} color={colors.gray} /><Text style={styles.navText}>Perfil</Text></View>
    </View>
    <Dialog title="Cancelar reserva?" visible={selected !== null} dismissible={!cancelling} onClose={() => setSelected(null)}>
      {selected ? <Text style={styles.dialogText}>{selected.sala_nome}{'\n'}{formatDate(selected.data)} às {selected.hora}h{'\n\n'}A reserva será removida e o horário ficará disponível novamente.</Text> : null}
      {cancelError ? <Text accessibilityRole="alert" style={styles.error}>{cancelError}</Text> : null}
      <Button title="Confirmar cancelamento" busy={cancelling} onPress={() => void confirmCancel()} />
      <Button title="Manter reserva" secondary disabled={cancelling} onPress={() => setSelected(null)} />
    </Dialog>
  </View>;
}
function Separator() { return <View style={{ height: 18 }} />; }
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.white }, header: { marginTop: 41, paddingHorizontal: 27, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 25, fontWeight: '700', color: colors.navy }, logout: { minHeight: 44, minWidth: 44, justifyContent: 'center', alignItems: 'flex-end' }, logoutText: { color: colors.muted, fontSize: 13 },
  tabs: { flexDirection: 'row', marginTop: 24, marginBottom: 31, marginHorizontal: 28, gap: 28 },
  tab: { flex: 1, minHeight: 37, alignItems: 'center', justifyContent: 'center', borderRadius: 10, borderWidth: 1, borderColor: 'transparent' },
  activeTab: { borderColor: colors.selectedBorder, backgroundColor: colors.white, boxShadow: '0px 3px 4px rgba(0,0,0,0.08)' }, tabText: { color: colors.muted, fontSize: 17, fontWeight: '600' }, activeTabText: { color: colors.navy },
  list: { flex: 1, marginTop: 38 }, listContent: { paddingHorizontal: 17, paddingBottom: 24, flexGrow: 1 },
  state: { alignItems: 'center', paddingHorizontal: 18, paddingVertical: 28, gap: 14 }, emptyTitle: { fontWeight: '600', color: colors.navy, fontSize: 17, textAlign: 'center' }, emptyText: { fontSize: 14, color: colors.gray, textAlign: 'center', lineHeight: 21 },
  error: { color: colors.error, textAlign: 'center', lineHeight: 21 },
  notice: { marginHorizontal: 19, marginTop: 16, backgroundColor: colors.soft, padding: 12, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }, noticeText: { color: colors.navy, flex: 1, fontSize: 13 },
  navigation: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#C7C7C7', paddingTop: 12, backgroundColor: colors.white },
  navItem: { flex: 1, minHeight: 43, alignItems: 'center', gap: 4 }, navText: { fontSize: 9, fontWeight: '600', color: colors.gray }, navActive: { color: '#080808', fontWeight: '700' },
  dialogText: { fontSize: 15, color: colors.gray, lineHeight: 23 },
});
