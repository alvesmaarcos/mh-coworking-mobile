import { useRef, useState, type ComponentRef } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { RegistrationLoginError } from '../application/session';
import { Button } from './components/Button';
import { colors } from './theme';

type AuthMode = 'login' | 'register';

const logo = require('../../assets/logo.png');

export function LoginScreen({
  onLogin,
  onRegister,
  notice,
}: {
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (name: string, email: string, password: string) => Promise<void>;
  notice: string;
}) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [localNotice, setLocalNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const emailInput = useRef<ComponentRef<typeof TextInput>>(null);
  const passwordInput = useRef<ComponentRef<typeof TextInput>>(null);

  function switchMode(next: AuthMode) {
    if (busy || next === mode) return;
    setMode(next);
    setError('');
    setLocalNotice('');
  }

  async function submit() {
    if (submitting.current) return;
    const cleanEmail = email.trim();
    if (mode === 'register') {
      if (!name.trim() || !cleanEmail || !password) {
        setError('Informe seu nome completo, e-mail e senha.');
        return;
      }
      if (!cleanEmail.includes('@')) {
        setError('Informe um e-mail válido.');
        return;
      }
      if (password.length < 6) {
        setError('A senha deve conter pelo menos 6 caracteres.');
        return;
      }
    } else if (!cleanEmail || !password) {
      setError('Informe seu e-mail e sua senha.');
      return;
    }

    submitting.current = true;
    setBusy(true);
    setError('');
    setLocalNotice('');
    try {
      if (mode === 'register') {
        await onRegister(name, cleanEmail, password);
      } else {
        await onLogin(cleanEmail, password);
      }
    } catch (cause) {
      if (cause instanceof RegistrationLoginError) {
        setMode('login');
        setLocalNotice(cause.message);
      } else {
        setError(
          cause instanceof Error
            ? cause.message
            : mode === 'register'
              ? 'Não foi possível criar sua conta. Tente novamente.'
              : 'Não foi possível entrar. Tente novamente.',
        );
      }
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  const activeNotice = localNotice || notice;

  return <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.brand}>
        <Image source={logo} style={styles.logo} resizeMode="contain" accessibilityLabel="Logo Monte Horebe Coworking" />
        <Text accessibilityRole="header" style={styles.brandName}>{'Monte Horebe\nCoworking'}</Text>
        <Text style={styles.subtitle}>Reserve sua sala em poucos toques</Text>
      </View>

      <View accessibilityRole="tablist" style={styles.tabs}>
        {([
          { key: 'login', title: 'Entrar' },
          { key: 'register', title: 'Criar conta' },
        ] as const).map(item => {
          const active = mode === item.key;
          return <Pressable
            key={item.key}
            accessibilityRole="tab"
            accessibilityLabel={item.title}
            accessibilityState={{ selected: active, disabled: busy }}
            disabled={busy}
            onPress={() => switchMode(item.key)}
            style={[styles.tab, active && styles.activeTab]}
          >
            <Text style={[styles.tabText, active && styles.activeTabText]}>{item.title}</Text>
          </Pressable>;
        })}
      </View>

      <View style={styles.form}>
        {activeNotice ? <Text accessibilityRole="alert" style={styles.notice}>{activeNotice}</Text> : null}

        {mode === 'register' ? <View style={styles.field}>
          <Text style={styles.label}>NOME COMPLETO</Text>
          <TextInput
            accessibilityLabel="Nome completo"
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Seu nome"
            placeholderTextColor={styles.placeholder.color}
            autoCapitalize="words"
            autoCorrect={false}
            autoComplete="name"
            textContentType="name"
            editable={!busy}
            returnKeyType="next"
            onSubmitEditing={() => emailInput.current?.focus()}
          />
        </View> : null}

        <View style={styles.field}>
          <Text style={styles.label}>E-MAIL</Text>
          <TextInput
            ref={emailInput}
            accessibilityLabel="E-mail"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="seu@email.com"
            placeholderTextColor={styles.placeholder.color}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            editable={!busy}
            returnKeyType="next"
            onSubmitEditing={() => passwordInput.current?.focus()}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>SENHA</Text>
          <TextInput
            ref={passwordInput}
            accessibilityLabel="Senha"
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={styles.placeholder.color}
            secureTextEntry
            autoCapitalize="none"
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            textContentType={mode === 'register' ? 'newPassword' : 'password'}
            editable={!busy}
            returnKeyType="go"
            onSubmitEditing={() => void submit()}
          />
        </View>

        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}

        <View style={styles.submitWrap}>
          <Button
            title={mode === 'register' ? 'Criar conta' : 'Entrar'}
            accent
            busy={busy}
            onPress={() => void submit()}
          />
        </View>
      </View>
    </ScrollView>
  </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.white },
  content: { flexGrow: 1, paddingTop: 64, paddingBottom: 48 },
  brand: { alignItems: 'center', paddingHorizontal: 24, marginBottom: 32 },
  logo: { width: 104, height: 47, marginBottom: 18 },
  brandName: { color: colors.navy, fontWeight: '800', fontSize: 24, lineHeight: 28, textAlign: 'center', letterSpacing: -0.3 },
  subtitle: { color: colors.muted, marginTop: 8, fontSize: 13.5, fontWeight: '500', textAlign: 'center' },
  tabs: { flexDirection: 'row', marginHorizontal: 14, borderBottomWidth: 1, borderBottomColor: '#C5C7D4', gap: 16 },
  tab: { paddingHorizontal: 10, paddingBottom: 10, borderBottomWidth: 2.5, borderBottomColor: 'transparent', marginBottom: -1 },
  activeTab: { borderBottomColor: colors.orange },
  tabText: { color: colors.muted, fontSize: 16, fontWeight: '600' },
  activeTabText: { color: colors.navy, fontWeight: '700' },
  form: { paddingHorizontal: 24, paddingTop: 28 },
  field: { marginBottom: 20, gap: 8 },
  label: { fontSize: 12, color: '#1A1A1A', fontWeight: '700', letterSpacing: 0.4 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: '#FCFCFD',
    paddingHorizontal: 16,
    minHeight: 50,
    color: colors.navy,
    fontSize: 15,
  },
  placeholder: { color: '#B5B5B5' },
  submitWrap: { marginTop: 12 },
  error: { color: colors.error, fontSize: 14, lineHeight: 21, marginBottom: 12 },
  notice: { color: colors.navy, padding: 14, backgroundColor: colors.soft, borderRadius: 10, marginBottom: 20, fontSize: 14, lineHeight: 20 },
});
