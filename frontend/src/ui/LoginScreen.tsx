import { useRef, useState, type ComponentRef } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from './components/Button';
import { colors } from './theme';

export function LoginScreen({ onLogin, notice }: { onLogin: (email: string, password: string) => Promise<void>; notice: string }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const passwordInput = useRef<ComponentRef<typeof TextInput>>(null);
  async function submit() {
    if (submitting.current) return;
    if (!email.trim() || !password) { setError('Informe seu e-mail e sua senha.'); return; }
    submitting.current = true;
    setBusy(true);
    setError('');
    try { await onLogin(email, password); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível entrar. Tente novamente.'); }
    finally { submitting.current = false; setBusy(false); }
  }
  return <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.brand}><Text style={styles.brandName}>MH Coworking</Text><Text style={styles.subtitle}>Área do administrador</Text></View>
      <Text accessibilityRole="header" style={styles.title}>Bem-vindo de volta</Text>
      <Text style={styles.description}>Entre para acompanhar e gerenciar as reservas.</Text>
      {notice ? <Text accessibilityRole="alert" style={styles.notice}>{notice}</Text> : null}
      <View style={styles.field}>
        <Text style={styles.label}>E-mail</Text>
        <TextInput accessibilityLabel="E-mail" style={styles.input} value={email} onChangeText={setEmail} placeholder="Seu e-mail" placeholderTextColor={colors.gray}
          keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" textContentType="emailAddress" editable={!busy} returnKeyType="next" onSubmitEditing={() => passwordInput.current?.focus()} />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Senha</Text>
        <TextInput ref={passwordInput} accessibilityLabel="Senha" style={styles.input} value={password} onChangeText={setPassword} placeholder="Sua senha" placeholderTextColor={colors.gray}
          secureTextEntry autoCapitalize="none" autoComplete="current-password" textContentType="password" editable={!busy} returnKeyType="go" onSubmitEditing={() => void submit()} />
      </View>
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      <Button title="Entrar" busy={busy} onPress={() => void submit()} />
    </ScrollView>
  </KeyboardAvoidingView>;
}
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.white }, content: { flexGrow: 1, justifyContent: 'center', padding: 28, paddingBottom: 48 },
  brand: { marginBottom: 52 }, brandName: { color: colors.navy, fontWeight: '800', fontSize: 26 }, subtitle: { color: colors.muted, marginTop: 6, fontSize: 14 },
  title: { color: colors.navy, fontSize: 24, fontWeight: '700', marginBottom: 10 }, description: { color: colors.gray, fontSize: 15, lineHeight: 23, marginBottom: 28 },
  field: { marginBottom: 20, gap: 8 }, label: { fontSize: 14, color: colors.navy, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 14, minHeight: 50, color: colors.navy, fontSize: 16 },
  error: { color: colors.error, lineHeight: 21, marginBottom: 18 }, notice: { color: colors.navy, padding: 14, backgroundColor: colors.soft, borderRadius: 8, marginBottom: 20 },
});
