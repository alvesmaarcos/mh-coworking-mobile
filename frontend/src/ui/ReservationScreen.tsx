import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Feather from "@expo/vector-icons/Feather";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { AvailableHour, Room } from "../domain/models";
import { dateKey, formatPrice } from "../domain/reservations";
import { ApiClient, ApiError } from "../infrastructure/api";
import { Button } from "./components/Button";
import { colors } from "./theme";

export function ReservationScreen({
  api,
  token,
  room,
  onBack,
  onConfirmed,
}: {
  api: ApiClient;
  token: string;
  room: Room;
  onBack: () => void;
  onConfirmed: () => void;
}) {
  const [selectedDate, setSelectedDate] = useState(() => dateKey(new Date()));
  const [hours, setHours] = useState<AvailableHour[]>([]);
  const [selectedHours, setSelectedHours] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [revision, setRevision] = useState(0);
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dates = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 15 }, (_, index) => {
      const date = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      date.setDate(date.getDate() + index);
      return date;
    });
  }, []);

  const reload = useCallback(() => setRevision((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    api
      .availableHours(room.id, selectedDate, controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) setHours(value);
      })
      .catch((cause) => {
        if (!controller.signal.aborted) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Não foi possível carregar os horários.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [api, room.id, selectedDate, revision]);

  useEffect(
    () => () => {
      if (successTimer.current) clearTimeout(successTimer.current);
    },
    [],
  );

  function chooseDate(value: string) {
    setSelectedDate(value);
    setSelectedHours([]);
    setNotice("");
  }

  function toggleHour(hour: number) {
    setNotice("");
    setSelectedHours((current) =>
      current.includes(hour)
        ? current.filter((value) => value !== hour)
        : [...current, hour].sort((a, b) => a - b),
    );
  }

  async function confirmReservation() {
    if (!selectedHours.length || submitting) return;
    setSubmitting(true);
    setNotice("");
    let created = 0;
    const failures: { hour: number; cause: unknown }[] = [];

    for (const hour of selectedHours) {
      try {
        await api.createReservation(token, {
          sala_id: room.id,
          data: selectedDate,
          hora: hour,
        });
        created += 1;
      } catch (cause) {
        failures.push({ hour, cause });
      }
    }

    setSubmitting(false);
    if (failures.length) {
      const conflict = failures.some(
        ({ cause }) => cause instanceof ApiError && cause.status === 409,
      );
      const firstError = failures.find(({ cause }) => cause instanceof Error)
        ?.cause;
      const failedHours = failures.map(({ hour }) => `${hour}h`).join(", ");
      setSelectedHours([]);
      setNotice(
        conflict
          ? `${created ? `${created} horário(s) reservado(s). ` : ""}Um ou mais horários já foram ocupados. Atualizamos a disponibilidade; escolha novamente.`
          : `${created ? `${created} horário(s) reservado(s). ` : ""}Não foi possível reservar ${failedHours}.${firstError instanceof Error ? ` ${firstError.message}` : ""}`,
      );
      reload();
      return;
    }

    setNotice("Reserva confirmada com sucesso.");
    successTimer.current = setTimeout(onConfirmed, 900);
  }

  const selectedTotal = selectedHours.length * (room.valor_hora ?? 0);

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar para os detalhes da sala"
          onPress={onBack}
          style={styles.backButton}
        >
          <Feather name="chevron-left" size={22} color={colors.navy} />
        </Pressable>
        <Text accessibilityRole="header" numberOfLines={1} style={styles.title}>
          {room.nome}
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={styles.sectionLabel}>ESCOLHA A DATA</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateList}
        >
          {dates.map((date) => {
            const value = dateKey(date);
            const selected = value === selectedDate;
            const weekday = new Intl.DateTimeFormat("pt-BR", {
              weekday: "short",
            })
              .format(date)
              .replace(".", "")
              .slice(0, 3)
              .toUpperCase();
            const label = new Intl.DateTimeFormat("pt-BR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            }).format(date);
            return (
              <Pressable
                key={value}
                accessibilityRole="button"
                accessibilityLabel={`Selecionar ${label}`}
                accessibilityState={{ selected }}
                onPress={() => chooseDate(value)}
                style={[styles.dateCard, selected && styles.selectedDateCard]}
              >
                <Text style={[styles.weekday, selected && styles.selectedText]}>
                  {weekday}
                </Text>
                <Text style={[styles.dayNumber, selected && styles.selectedText]}>
                  {date.getDate()}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={[styles.sectionLabel, styles.hoursLabel]}>
          HORÁRIOS DISPONÍVEIS
        </Text>
        {loading ? (
          <View style={styles.state}>
            <ActivityIndicator
              accessibilityLabel="Carregando horários disponíveis"
              color={colors.navy}
            />
            <Text style={styles.stateText}>Carregando horários…</Text>
          </View>
        ) : error ? (
          <View style={styles.state}>
            <Text accessibilityRole="alert" style={styles.error}>
              {error}
            </Text>
            <Button title="Tentar novamente" secondary onPress={reload} />
          </View>
        ) : (
          <View style={styles.hoursGrid}>
            {hours.map(({ hora, reservado }) => {
              const selected = selectedHours.includes(hora);
              const label = `${hora}h - ${hora + 1}h`;
              return (
                <Pressable
                  key={hora}
                  accessibilityRole="button"
                  accessibilityLabel={label}
                  accessibilityState={{
                    selected,
                    disabled: reservado || submitting,
                  }}
                  disabled={reservado || submitting}
                  onPress={() => toggleHour(hora)}
                  style={[
                    styles.hourCard,
                    reservado && styles.unavailableHour,
                    selected && styles.selectedHour,
                  ]}
                >
                  <Text
                    style={[
                      styles.hourText,
                      reservado && styles.unavailableText,
                      selected && styles.selectedText,
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
        {notice ? (
          <Text
            accessibilityLiveRegion="polite"
            accessibilityRole={notice.startsWith("Reserva confirmada") ? "text" : "alert"}
            style={[
              styles.notice,
              !notice.startsWith("Reserva confirmada") && styles.error,
            ]}
          >
            {notice}
          </Text>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.total}>
          <Text style={styles.totalLabel}>TOTAL</Text>
          <Text style={styles.totalPrice}>{formatPrice(selectedTotal)}</Text>
        </View>
        <View style={styles.confirmButton}>
          <Button
            title="Confirmar reserva"
            orange
            busy={submitting}
            disabled={!selectedHours.length || loading || Boolean(error)}
            onPress={() => void confirmReservation()}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.white },
  header: {
    minHeight: 76,
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
  title: { flex: 1, color: colors.navy, fontSize: 20, fontWeight: "700" },
  content: { flex: 1 },
  contentContainer: { paddingBottom: 20 },
  sectionLabel: {
    color: colors.gray,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.8,
    marginHorizontal: 18,
    marginTop: 16,
  },
  dateList: { gap: 9, paddingHorizontal: 18, paddingVertical: 13 },
  dateCard: {
    width: 58,
    height: 70,
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.white,
  },
  selectedDateCard: { backgroundColor: colors.navy, borderColor: colors.navy },
  weekday: { color: colors.gray, fontSize: 11, fontWeight: "600" },
  dayNumber: { color: colors.navy, fontSize: 17, fontWeight: "700" },
  selectedText: { color: colors.white },
  hoursLabel: { marginTop: 12 },
  hoursGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 13,
    paddingTop: 13,
    rowGap: 10,
  },
  hourCard: {
    width: "31.8%",
    minHeight: 44,
    marginHorizontal: "0.75%",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.white,
  },
  selectedHour: { backgroundColor: colors.orange, borderColor: colors.orange },
  unavailableHour: {
    borderColor: colors.disabledBorder,
    backgroundColor: colors.soft,
  },
  hourText: { color: colors.navy, fontSize: 13, fontWeight: "500" },
  unavailableText: { color: colors.disabledText },
  state: {
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 28,
    gap: 12,
  },
  stateText: { color: colors.gray, fontSize: 13, textAlign: "center" },
  error: { color: colors.error, textAlign: "center", lineHeight: 21 },
  notice: {
    color: colors.navy,
    fontSize: 13,
    lineHeight: 19,
    marginHorizontal: 18,
    marginTop: 14,
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 17,
    paddingTop: 12,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
    backgroundColor: colors.white,
  },
  total: { gap: 3 },
  totalLabel: {
    color: colors.gray,
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.7,
  },
  totalPrice: { color: colors.navy, fontSize: 20, fontWeight: "700" },
  confirmButton: { flex: 1 },
});
