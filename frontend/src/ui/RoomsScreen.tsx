import { useCallback, useEffect, useState } from "react";
import Feather from "@expo/vector-icons/Feather";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { ApiClient } from "../infrastructure/api";
import type { Room, Session } from "../domain/models";
import { filterRooms } from "../domain/rooms";
import { BottomNavigation, type AppTab } from "./components/BottomNavigation";
import { Button } from "./components/Button";
import { RoomCard } from "./components/RoomCard";
import { RoomDetailsScreen } from "./RoomDetailsScreen";
import { ReservationScreen } from "./ReservationScreen";
import { colors } from "./theme";

export function RoomsScreen({
  api,
  session,
  onNavigate,
}: {
  api: ApiClient;
  session: Session;
  onNavigate: (tab: AppTab) => void;
}) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [query, setQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [reservationRoom, setReservationRoom] = useState<Room | null>(null);
  const reload = useCallback(() => setRevision((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    api
      .rooms(controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) setRooms(value);
      })
      .catch((cause) => {
        if (!controller.signal.aborted)
          setError(
            cause instanceof Error
              ? cause.message
              : "Não foi possível carregar as salas.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [api, revision]);

  if (reservationRoom) {
    return (
      <ReservationScreen
        api={api}
        token={session.token}
        room={reservationRoom}
        onBack={() => setReservationRoom(null)}
        onConfirmed={() => onNavigate("reservations")}
      />
    );
  }

  if (selectedRoom) {
    return (
      <RoomDetailsScreen
        api={api}
        room={selectedRoom}
        onBack={() => setSelectedRoom(null)}
        onReserve={setReservationRoom}
      />
    );
  }

  const visibleRooms = filterRooms(rooms, query);
  return (
    <View style={styles.page}>
      <Text accessibilityRole="header" style={styles.title}>
        Espaços disponíveis
      </Text>
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
        style={{ flex: 1 }}
        data={loading || error ? [] : visibleRooms}
        keyExtractor={(room) => String(room.id)}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={Separator}
        renderItem={({ item }) => (
          <RoomCard
            room={item}
            imageUrl={api.assetUrl(item.imagem_url)}
            onPress={() => setSelectedRoom(item)}
          />
        )}
        refreshing={loading}
        onRefresh={reload}
        ListEmptyComponent={
          loading ? (
            <View style={styles.state}>
              <ActivityIndicator
                accessibilityLabel="Carregando salas"
                color={colors.navy}
              />
              <Text style={styles.stateText}>Carregando salas…</Text>
            </View>
          ) : error ? (
            <View style={styles.state}>
              <Text accessibilityRole="alert" style={styles.error}>
                {error}
              </Text>
              <Button title="Tentar novamente" secondary onPress={reload} />
            </View>
          ) : (
            <View style={styles.state}>
              <Feather name="home" size={28} color={colors.icon} />
              <Text style={styles.stateTitle}>
                {query.trim()
                  ? "Nenhuma sala encontrada"
                  : "Nenhum espaço disponível"}
              </Text>
              <Text style={styles.stateText}>
                {query.trim()
                  ? "Tente buscar por outro nome ou característica."
                  : "As salas disponíveis aparecerão aqui."}
              </Text>
            </View>
          )
        }
      />
      <BottomNavigation active="rooms" onSelect={onNavigate} />
    </View>
  );
}

function Separator() {
  return <View style={{ height: 14 }} />;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.white, paddingTop: 38 },
  title: {
    color: colors.navy,
    fontSize: 20,
    fontWeight: "700",
    marginHorizontal: 15,
  },
  search: {
    height: 37,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9,
    marginHorizontal: 13,
    marginTop: 19,
    paddingHorizontal: 10,
    gap: 10,
  },
  searchFocused: { borderColor: colors.orange },
  searchInput: {
    flex: 1,
    color: colors.navy,
    fontSize: 12,
    paddingVertical: 0,
    borderWidth: 0,
    outlineStyle: "none",
  } as any,
  listContent: {
    paddingHorizontal: 17,
    paddingTop: 24,
    paddingBottom: 20,
    flexGrow: 1,
  },
  state: {
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 28,
    gap: 12,
  },
  stateTitle: {
    color: colors.navy,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  stateText: {
    color: colors.gray,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
  },
  error: { color: colors.error, textAlign: "center", lineHeight: 21 },
});
