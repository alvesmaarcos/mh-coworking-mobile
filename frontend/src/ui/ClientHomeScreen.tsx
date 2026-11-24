import { useCallback, useEffect, useState } from 'react';
import Feather from '@expo/vector-icons/Feather';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { Room, Session } from '../domain/models';
import { filterRooms } from '../domain/rooms';
import { ApiClient } from '../infrastructure/api';
import { BottomNavigation, type AppTab } from './components/BottomNavigation';
import { Button } from './components/Button';
import { RoomCard } from './components/RoomCard';
import { ReservationScreen } from './ReservationScreen';
import { RoomDetailsScreen } from './RoomDetailsScreen';
import { colors } from './theme';

const logo = require('../../assets/logo.png');

export function ClientHomeScreen({
  api,
  session,
  onLogout,
  onNavigate,
}: {
  api: ApiClient;
  session: Session;
  onLogout: () => void;
  onNavigate: (tab: AppTab) => void;
}) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [query, setQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [reservationRoom, setReservationRoom] = useState<Room | null>(null);
  const reload = useCallback(() => setRevision(value => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    api.rooms(controller.signal)
      .then(value => {
        if (!controller.signal.aborted) setRooms(value);
      })
      .catch(cause => {
        if (!controller.signal.aborted) {
          setError(cause instanceof Error ? cause.message : 'Não foi possível carregar as salas.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [api, revision]);

  if (reservationRoom) {
    return <ReservationScreen
      api={api}
      token={session.token}
      room={reservationRoom}
      onBack={() => setReservationRoom(null)}
      onConfirmed={() => {
        setReservationRoom(null);
        setSelectedRoom(null);
        onNavigate('rooms');
      }}
    />;
  }

  if (selectedRoom) {
    return <RoomDetailsScreen
      api={api}
      room={selectedRoom}
      onBack={() => setSelectedRoom(null)}
      onReserve={setReservationRoom}
    />;
  }

  const visibleRooms = filterRooms(rooms, query);
  return <View style={styles.page}>
    <View style={styles.header}>
      <View style={styles.brandRow}>
        <Image source={logo} style={styles.logo} resizeMode="contain" accessibilityLabel="Logo Monte Horebe Coworking" />
        <Text style={styles.brand}>Monte Horebe</Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Sair da conta" onPress={onLogout} style={styles.logout}>
        <Text style={styles.logoutText}>Sair</Text>
      </Pressable>
    </View>
    <View style={styles.welcome}>
      <View style={styles.badge}>
        <Feather name="user" size={14} color={colors.navy} />
        <Text style={styles.badgeText}>Área do cliente</Text>
      </View>
      <Text accessibilityRole="header" style={styles.greeting}>Olá, {session.usuario.nome}!</Text>
      <Text style={styles.description}>Encontre o espaço ideal para você.</Text>
    </View>
    <Text accessibilityRole="header" style={styles.title}>Espaços disponíveis</Text>
    <View style={[styles.search, searchFocused && styles.searchFocused]}>
      <Feather name="search" size={17} color={colors.gray} />
      <TextInput
        accessibilityLabel="Buscar sala"
        value={query}
        onChangeText={setQuery}
        placeholder="Buscar sala..."
        placeholderTextColor="#929292"
        onFocus={() => setSearchFocused(true)}
        onBlur={() => setSearchFocused(false)}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        style={styles.searchInput}
      />
    </View>
    <FlatList
      style={styles.list}
      data={loading || error ? [] : visibleRooms}
      keyExtractor={room => String(room.id)}
      contentContainerStyle={styles.listContent}
      ItemSeparatorComponent={Separator}
      renderItem={({ item }) => <RoomCard
        room={item}
        imageUrl={api.assetUrl(item.imagem_url)}
        onPress={() => setSelectedRoom(item)}
      />}
      refreshing={loading}
      onRefresh={reload}
      ListEmptyComponent={loading ? (
        <View style={styles.state}>
          <ActivityIndicator accessibilityLabel="Carregando salas" color={colors.navy} />
          <Text style={styles.stateText}>Carregando salas…</Text>
        </View>
      ) : error ? (
        <View style={styles.state}>
          <Text accessibilityRole="alert" style={styles.error}>{error}</Text>
          <Button title="Tentar novamente" secondary onPress={reload} />
        </View>
      ) : (
        <View style={styles.state}>
          <Feather name="home" size={28} color={colors.icon} />
          <Text style={styles.stateTitle}>{query.trim() ? 'Nenhuma sala encontrada' : 'Nenhum espaço disponível'}</Text>
          <Text style={styles.stateText}>
            {query.trim() ? 'Tente buscar por outro nome ou característica.' : 'As salas disponíveis aparecerão aqui.'}
          </Text>
        </View>
      )}
    />
    <BottomNavigation active="rooms" onSelect={onNavigate} disabledTabs={['reservations']} />
  </View>;
}

function Separator() {
  return <View style={{ height: 14 }} />;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.white },
  header: { marginTop: 24, paddingHorizontal: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 40, height: 20 },
  brand: { fontSize: 20, fontWeight: '800', color: colors.navy },
  logout: { minHeight: 44, minWidth: 44, justifyContent: 'center', alignItems: 'flex-end' },
  logoutText: { color: colors.muted, fontSize: 14, fontWeight: '600' },
  welcome: { paddingHorizontal: 20, paddingTop: 16 },
  badge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.badge, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  badgeText: { color: colors.navy, fontSize: 12, fontWeight: '700' },
  greeting: { color: colors.navy, fontSize: 22, fontWeight: '700', marginTop: 8 },
  description: { color: colors.muted, fontSize: 14, marginTop: 2 },
  title: { color: colors.navy, fontSize: 20, fontWeight: '700', marginHorizontal: 15, marginTop: 20 },
  search: { height: 37, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 9, marginHorizontal: 13, marginTop: 12, paddingHorizontal: 10, gap: 10 },
  searchFocused: { borderColor: colors.orange },
  searchInput: { flex: 1, color: colors.navy, fontSize: 12, paddingVertical: 0, borderWidth: 0, outlineStyle: 'none', outlineWidth: 0 } as any,
  list: { flex: 1 },
  listContent: { paddingHorizontal: 17, paddingTop: 18, paddingBottom: 20, flexGrow: 1 },
  state: { alignItems: 'center', paddingHorizontal: 18, paddingVertical: 28, gap: 12 },
  stateTitle: { color: colors.navy, fontSize: 16, fontWeight: '600', textAlign: 'center' },
  stateText: { color: colors.gray, fontSize: 13, textAlign: 'center', lineHeight: 19 },
  error: { color: colors.error, textAlign: 'center', lineHeight: 21 },
});
