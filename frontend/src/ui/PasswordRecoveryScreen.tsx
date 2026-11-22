import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { ApiClient } from '../infrastructure/api';
import { Button } from './components/Button';
import { colors } from './theme';

export function PasswordRecoveryScreen({ api, onDone, onCancel }: { api: ApiClient; onDone: (notice: string) => void; onCancel: () => void }) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function run(action: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError('');
    try { await action(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível concluir. Tente novamente.'); }
    finally { setBusy(false); }
  }
  const sendCode = () => run(async () => {
    if (!email.trim()) throw new Error('Informe seu e-mail.');
    await api.requestPasswordReset(email.trim());
    setCodeSent(true);
  });
  const reset = () => run(async () => {
    if (!/^\d{6}$/.test(code)) throw new Error('Informe o código de 6 dígitos.');
    if (password.length < 6) throw new Error('A nova senha deve ter pelo menos 6 caracteres.');
    await api.resetPassword(email.trim(), code, password);
    onDone('Senha alterada. Entre com a nova senha.');
  });
  return <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text accessibilityRole="header" style={styles.title}>Recuperar senha</Text>
      <Text style={styles.description}>{codeSent
        ? `Se ${email.trim()} estiver cadastrado, enviamos um código de 6 dígitos. Ele vale por 15 minutos.`
        : 'Informe seu e-mail para receber um código de recuperação.'}</Text>
      <View style={styles.field}>
        <Text style={styles.label}>E-mail</Text>
        <TextInput accessibilityLabel="E-mail" style={styles.input} value={email} onChangeText={setEmail} placeholder="Seu e-mail" placeholderTextColor={colors.gray}
          keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" textContentType="emailAddress" editable={!busy && !codeSent} onSubmitEditing={() => void sendCode()} />
      </View>
      {codeSent ? <>
        <View style={styles.field}>
          <Text style={styles.label}>Código</Text>
          <TextInput accessibilityLabel="Código" style={styles.input} value={code} onChangeText={value => setCode(value.replace(/\D/g, ''))} placeholder="000000" placeholderTextColor={colors.gray}
            keyboardType="number-pad" maxLength={6} autoComplete="one-time-code" textContentType="oneTimeCode" editable={!busy} />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Nova senha</Text>
          <TextInput accessibilityLabel="Nova senha" style={styles.input} value={password} onChangeText={setPassword} placeholder="Mínimo de 6 caracteres" placeholderTextColor={colors.gray}
            secureTextEntry autoCapitalize="none" autoComplete="new-password" textContentType="newPassword" editable={!busy} returnKeyType="go" onSubmitEditing={() => void reset()} />
        </View>
      </> : null}
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      <Button title={codeSent ? 'Redefinir senha' : 'Enviar código'} busy={busy} onPress={() => void (codeSent ? reset() : sendCode())} />
      {codeSent ? <Pressable accessibilityRole="link" onPress={() => void sendCode()} disabled={busy} style={styles.link}><Text style={styles.linkText}>Reenviar código</Text></Pressable> : null}
      <Pressable accessibilityRole="link" onPress={onCancel} disabled={busy} style={styles.link}><Text style={styles.linkText}>Voltar ao login</Text></Pressable>
    </ScrollView>
  </KeyboardAvoidingView>;
}
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.white }, content: { flexGrow: 1, justifyContent: 'center', padding: 28, paddingBottom: 48 },
  title: { color: colors.navy, fontSize: 24, fontWeight: '700', marginBottom: 10 }, description: { color: colors.gray, fontSize: 15, lineHeight: 23, marginBottom: 28 },
  field: { marginBottom: 20, gap: 8 }, label: { fontSize: 14, color: colors.navy, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 14, minHeight: 50, color: colors.navy, fontSize: 16 },
  error: { color: colors.error, lineHeight: 21, marginBottom: 18 },
  link: { alignSelf: 'center', padding: 12, marginTop: 4 }, linkText: { color: colors.navy, fontWeight: '600' },
});
