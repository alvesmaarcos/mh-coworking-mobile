import { useCallback, useEffect, useState } from "react";
import Feather from "@expo/vector-icons/Feather";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { Room } from "../domain/models";
import { formatPrice } from "../domain/reservations";
import { ApiClient } from "../infrastructure/api";
import { Button } from "./components/Button";
import { colors } from "./theme";

export function RoomDetailsScreen({
  api,
  room: initialRoom,
  onBack,
  onReserve,
}: {
  api: ApiClient;
  room: Room;
  onBack: () => void;
  onReserve: (room: Room) => void;
}) {
  const [room, setRoom] = useState(initialRoom);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);
  const reload = useCallback(() => setRevision((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    api
      .room(initialRoom.id, controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) {
          setRoom(value);
          setImageFailed(false);
        }
      })
      .catch((cause) => {
        if (!controller.signal.aborted) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Não foi possível carregar os detalhes da sala.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [api, initialRoom.id, revision]);

  const attributes = (room.atributos ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const imageUrl = api.assetUrl(room.imagem_url);

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar para a lista de salas"
          onPress={onBack}
          style={styles.backButton}
        >
          <Feather name="chevron-left" size={22} color={colors.navy} />
        </Pressable>
        <Text accessibilityRole="header" style={styles.title}>
          Detalhes da sala
        </Text>
      </View>

      {loading ? (
        <View style={styles.state}>
          <ActivityIndicator
            accessibilityLabel="Carregando detalhes da sala"
            color={colors.navy}
          />
          <Text style={styles.stateText}>Carregando sala…</Text>
        </View>
      ) : error ? (
        <View style={styles.state}>
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
          <Button title="Tentar novamente" secondary onPress={reload} />
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
        >
          {imageUrl && !imageFailed ? (
            <Image
              accessibilityRole="image"
              accessibilityLabel={`Foto de ${room.nome}`}
              source={{ uri: imageUrl }}
              onError={() => setImageFailed(true)}
              style={styles.image}
            />
          ) : (
            <View style={[styles.image, styles.imageFallback]}>
              <Feather name="image" size={32} color={colors.gray} />
            </View>
          )}

          <View style={styles.body}>
            <Text style={styles.name}>{room.nome}</Text>
            {attributes.length ? (
              <View style={styles.attributes}>
                {attributes.map((attribute, index) => (
                  <View key={`${attribute}-${index}`} style={styles.attribute}>
                    <Text style={styles.attributeText}>{attribute}</Text>
                  </View>
                ))}
              </View>
            ) : null}
            {room.descricao ? (
              <Text style={styles.description}>{room.descricao}</Text>
            ) : null}
            <View style={styles.divider} />
            <Text style={styles.valueLabel}>VALOR</Text>
            {room.valor_hora !== undefined ? (
              <View style={styles.priceRow}>
                <Text style={styles.price}>{formatPrice(room.valor_hora)}</Text>
                <Text style={styles.perHour}>/hora</Text>
              </View>
            ) : null}
            <View style={styles.reserve}>
              <Button
                title="Reservar horário"
                orange
                onPress={() => onReserve(room)}
              />
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.white },
  header: {
    height: 76,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: colors.navy, fontSize: 20, fontWeight: "700" },
  content: { flex: 1 },
  contentContainer: { paddingBottom: 24 },
  image: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: colors.surface,
  },
  imageFallback: { alignItems: "center", justifyContent: "center" },
  body: { paddingHorizontal: 18, paddingTop: 18 },
  name: { color: colors.navy, fontSize: 20, lineHeight: 26, fontWeight: "700" },
  attributes: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
  },
  attribute: {
    backgroundColor: colors.badge,
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  attributeText: {
    color: colors.navy,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "600",
  },
  description: {
    color: colors.gray,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 18,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginTop: 20,
  },
  valueLabel: {
    color: colors.gray,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.8,
    marginTop: 18,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 4,
    gap: 5,
  },
  price: { color: colors.orange, fontSize: 28, lineHeight: 34, fontWeight: "700" },
  perHour: { color: colors.gray, fontSize: 13 },
  reserve: { marginTop: 28 },
  state: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    gap: 12,
  },
  stateText: { color: colors.gray, fontSize: 13, textAlign: "center" },
  error: { color: colors.error, textAlign: "center", lineHeight: 21 },
});
