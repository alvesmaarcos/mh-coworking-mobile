import Feather from '@expo/vector-icons/Feather';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Session } from '../domain/models';
import { colors } from './theme';

const logo = require('../../assets/logo.png');

export function ClientHomeScreen({ session, onLogout }: { session: Session; onLogout: () => void }) {
  const insets = useSafeAreaInsets();
  return <View style={styles.page}>
    <View style={styles.header}>
      <View style={styles.brandRow}>
        <Image source={logo} style={styles.logo} resizeMode="contain" accessibilityLabel="Logo Monte Horebe Coworking" />
        <Text accessibilityRole="header" style={styles.title}>Monte Horebe</Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Sair da conta" onPress={onLogout} style={styles.logout}>
        <Text style={styles.logoutText}>Sair</Text>
      </Pressable>
    </View>
    <View style={styles.content}>
      <View style={styles.card}>
        <View style={styles.badge}>
          <Feather name="user" size={14} color={colors.navy} />
          <Text style={styles.badgeText}>Área do cliente</Text>
        </View>
        <Text style={styles.greeting}>Olá, {session.usuario.nome}!</Text>
        <Text style={styles.email}>{session.usuario.email}</Text>
        <Text style={styles.description}>
          Sua conta está autenticada com acesso de cliente. As telas de salas, reservas e perfil do cliente serão integradas aqui nas próximas etapas.
        </Text>
      </View>
    </View>
    <View style={[styles.navigation, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View accessibilityLabel="Salas, indisponível nesta etapa" accessibilityState={{ disabled: true }} style={styles.navItem}>
        <Feather name="home" size={23} color={colors.gray} />
        <Text style={styles.navText}>Salas</Text>
      </View>
      <View accessibilityLabel="Minhas reservas, indisponível nesta etapa" accessibilityState={{ disabled: true }} style={styles.navItem}>
        <Feather name="calendar" size={24} color={colors.gray} />
        <Text style={styles.navText}>Reservas</Text>
      </View>
      <View accessibilityLabel="Perfil, indisponível nesta etapa" accessibilityState={{ disabled: true }} style={styles.navItem}>
        <Feather name="user" size={24} color={colors.gray} />
        <Text style={styles.navText}>Perfil</Text>
      </View>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.white },
  header: { marginTop: 32, paddingHorizontal: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 40, height: 20 },
  title: { fontSize: 20, fontWeight: '800', color: colors.navy },
  logout: { minHeight: 44, minWidth: 44, justifyContent: 'center', alignItems: 'flex-end' },
  logoutText: { color: colors.muted, fontSize: 14, fontWeight: '600' },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  card: { backgroundColor: colors.soft, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: colors.selectedBorder, gap: 10 },
  badge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.badge, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  badgeText: { color: colors.navy, fontSize: 12, fontWeight: '700' },
  greeting: { color: colors.navy, fontSize: 22, fontWeight: '700', marginTop: 4 },
  email: { color: colors.muted, fontSize: 14 },
  description: { color: colors.gray, fontSize: 14, lineHeight: 22, marginTop: 4 },
  navigation: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#C7C7C7', paddingTop: 12, backgroundColor: colors.white },
  navItem: { flex: 1, minHeight: 43, alignItems: 'center', gap: 4 },
  navText: { fontSize: 9, fontWeight: '600', color: colors.gray },
});
