import { useEffect, useState, useSyncExternalStore } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import Feather from '@expo/vector-icons/Feather';
import { SessionStore } from './src/application/session';
import { sessionStorage } from './src/infrastructure/storage';
import { ApiClient } from './src/infrastructure/api';
import { LoginScreen } from './src/ui/LoginScreen';
import { PasswordRecoveryScreen } from './src/ui/PasswordRecoveryScreen';
import { ReservationsScreen } from './src/ui/ReservationsScreen';
import { RoomsScreen } from './src/ui/RoomsScreen';
import type { AppTab } from './src/ui/components/BottomNavigation';
import { colors } from './src/ui/theme';

export default function App() {
  const [auth] = useState(() => new SessionStore(sessionStorage));
  const [api] = useState(() => new ApiClient(
    process.env.EXPO_PUBLIC_API_URL || (Platform.OS === 'web' ? '/api' : Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000'),
    token => auth.expire(token),
  ));
  const snapshot = useSyncExternalStore(auth.subscribe, auth.getSnapshot, auth.getSnapshot);
  const [fontsLoaded, fontError] = useFonts(Feather.font);
  const [recovering, setRecovering] = useState(false);
  const [recoveryNotice, setRecoveryNotice] = useState('');
  const [activeTab, setActiveTab] = useState<AppTab>('rooms');
  useEffect(() => { void auth.restore(); }, [auth]);
  function logout() {
    setActiveTab('rooms');
    void auth.logout();
  }
  return <SafeAreaProvider>
    <StatusBar style="dark" />
    <View style={styles.background}><SafeAreaView edges={['top', 'left', 'right']} style={styles.app}>
      {snapshot.restoring || (!fontsLoaded && !fontError) ? <View style={styles.loading}><ActivityIndicator color={colors.navy} /><Text style={styles.loadingText}>Carregando…</Text></View> :
        snapshot.session ? activeTab === 'rooms'
          ? <RoomsScreen key={snapshot.session.token} api={api} onNavigate={setActiveTab} />
          : <ReservationsScreen key={snapshot.session.token} api={api} session={snapshot.session} onLogout={logout} onNavigate={setActiveTab} />
          : recovering ? <PasswordRecoveryScreen api={api} onCancel={() => setRecovering(false)} onDone={notice => { setRecoveryNotice(notice); setRecovering(false); }} />
            : <LoginScreen onLogin={(email, password) => auth.login(api, email, password)} onForgotPassword={() => { setRecoveryNotice(''); setRecovering(true); }} notice={recoveryNotice || snapshot.notice} />}
    </SafeAreaView></View>
  </SafeAreaProvider>;
}
const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: colors.soft, alignItems: 'center' },
  app: { flex: 1, width: '100%', maxWidth: 600, backgroundColor: colors.white },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14 }, loadingText: { color: colors.muted },
});
