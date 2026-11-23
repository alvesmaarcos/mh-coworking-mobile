import { useEffect, useRef, useState, type ComponentRef } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { Session, UpdateUserInput, User } from '../domain/models';
import { ApiClient } from '../infrastructure/api';
import { BottomNavigation, type AppTab } from './components/BottomNavigation';
import { Button } from './components/Button';
import { Dialog } from './components/Dialog';
import { colors } from './theme';

const DANGER_RED = '#E52E22';

function getInitial(name: string): string {
  const first = name.trim().charAt(0);
  return first ? first.toUpperCase() : '?';
}

export function ProfileScreen({
  api,
  session,
  onUserUpdated,
  onLogout,
  onAccountDeleted,
  onNavigate,
  disabledTabs = [],
}: {
  api: ApiClient;
  session: Session;
  onUserUpdated: (user: User) => Promise<void>;
  onLogout: () => void;
  onAccountDeleted: () => void;
  onNavigate: (tab: AppTab) => void;
  disabledTabs?: readonly AppTab[];
}) {
  const [name, setName] = useState(session.usuario.nome);
  const [email, setEmail] = useState(session.usuario.email);
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const dirty = useRef(false);
  const savingLock = useRef(false);
  const deletingLock = useRef(false);
  const mounted = useRef(true);
  const emailInput = useRef<ComponentRef<typeof TextInput>>(null);
  const passwordInput = useRef<ComponentRef<typeof TextInput>>(null);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    api
      .currentUser(session, controller.signal)
      .then((fresh) => {
        if (controller.signal.aborted || !mounted.current) return;
        if (!dirty.current) {
          setName(fresh.nome);
          setEmail(fresh.email);
        }
        if (
          fresh.nome !== session.usuario.nome ||
          fresh.email !== session.usuario.email ||
          fresh.tipo !== session.usuario.tipo
        ) {
          void onUserUpdated(fresh);
        }
      })
      .catch(() => {
        // Keep current session values visible if background refresh fails.
      });
    return () => controller.abort();
  }, [api, session.token, session.usuario.id]);

  function handleNameChange(value: string) {
    dirty.current = true;
    setName(value);
    if (error) setError('');
    if (notice) setNotice('');
  }

  function handleEmailChange(value: string) {
    dirty.current = true;
    setEmail(value);
    if (error) setError('');
    if (notice) setNotice('');
  }

  function handlePasswordChange(value: string) {
    dirty.current = true;
    setPassword(value);
    if (error) setError('');
    if (notice) setNotice('');
  }

  async function saveChanges() {
    if (savingLock.current || deletingLock.current) return;
    const cleanName = name.trim();
    const cleanEmail = email.trim();
    if (!cleanName || !cleanEmail) {
      setError('Informe seu nome completo e e-mail.');
      setNotice('');
      return;
    }
    if (!cleanEmail.includes('@')) {
      setError('Informe um e-mail válido.');
      setNotice('');
      return;
    }
    if (password.length > 0 && password.length < 6) {
      setError('A senha deve conter pelo menos 6 caracteres.');
      setNotice('');
      return;
    }

    const payload: UpdateUserInput = { nome: cleanName, email: cleanEmail };
    if (password.length > 0) payload.senha = password;

    savingLock.current = true;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const updated = await api.updateUser(session.token, session.usuario.id, payload);
      if (!mounted.current) return;
      await onUserUpdated(updated);
      if (!mounted.current) return;
      dirty.current = false;
      setName(updated.nome);
      setEmail(updated.email);
      setPassword('');
      setNotice('Alterações salvas com sucesso.');
    } catch (cause) {
      if (!mounted.current) return;
      setError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível salvar as alterações. Tente novamente.',
      );
    } finally {
      savingLock.current = false;
      if (mounted.current) setSaving(false);
    }
  }

  async function confirmDeleteAccount() {
    if (deletingLock.current || savingLock.current) return;
    deletingLock.current = true;
    setDeleting(true);
    setDeleteError('');
    try {
      await api.deleteUser(session.token, session.usuario.id);
      if (!mounted.current) return;
      setConfirmDelete(false);
      onAccountDeleted();
    } catch (cause) {
      if (!mounted.current) return;
      setDeleteError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível excluir sua conta. Tente novamente.',
      );
    } finally {
      deletingLock.current = false;
      if (mounted.current) setDeleting(false);
    }
  }

  const isAdmin = session.usuario.tipo === 'ADM';
  const busy = saving || deleting;

  return (
    <View style={styles.page}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text accessibilityRole="header" style={styles.title}>
            Perfil
          </Text>

          <View style={styles.identity}>
            <View style={styles.avatar} accessible={false}>
              <Text style={styles.avatarText}>{getInitial(session.usuario.nome)}</Text>
            </View>
            <Text style={styles.displayName}>{session.usuario.nome}</Text>
            <View style={[styles.roleBadge, isAdmin ? styles.adminBadge : styles.clientBadge]}>
              <Text style={[styles.roleBadgeText, isAdmin ? styles.adminBadgeText : styles.clientBadgeText]}>
                {isAdmin ? 'Administrador' : 'Cliente'}
              </Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>MEUS DADOS</Text>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>NOME COMPLETO</Text>
              <TextInput
                accessibilityLabel="Nome completo"
                style={styles.input}
                value={name}
                onChangeText={handleNameChange}
                autoCapitalize="words"
                autoCorrect={false}
                autoComplete="name"
                textContentType="name"
                editable={!busy}
                returnKeyType="next"
                onSubmitEditing={() => emailInput.current?.focus()}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>E-MAIL</Text>
              <TextInput
                ref={emailInput}
                accessibilityLabel="E-mail"
                style={styles.input}
                value={email}
                onChangeText={handleEmailChange}
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
              <Text style={styles.label}>NOVA SENHA</Text>
              <TextInput
                ref={passwordInput}
                accessibilityLabel="Nova senha"
                style={styles.input}
                value={password}
                onChangeText={handlePasswordChange}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="new-password"
                textContentType="newPassword"
                editable={!busy}
                returnKeyType="done"
                onSubmitEditing={() => void saveChanges()}
              />
            </View>

            {error ? (
              <Text accessibilityRole="alert" style={styles.error}>
                {error}
              </Text>
            ) : null}

            {notice ? (
              <Text accessibilityLiveRegion="polite" style={styles.notice}>
                {notice}
              </Text>
            ) : null}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Salvar alterações"
              accessibilityState={{ disabled: busy, busy: saving }}
              disabled={busy}
              onPress={() => void saveChanges()}
              style={({ pressed }) => [styles.primaryButton, (pressed || busy) && styles.dim]}
            >
              {saving ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.primaryButtonText}>Salvar alterações</Text>
              )}
            </Pressable>

            <View style={styles.divider} />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sair da conta"
              accessibilityState={{ disabled: busy }}
              disabled={busy}
              onPress={onLogout}
              style={({ pressed }) => [styles.logoutButton, (pressed || busy) && styles.dim]}
            >
              <Text style={styles.logoutButtonText}>Sair da conta</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Excluir minha conta"
              accessibilityState={{ disabled: busy }}
              disabled={busy}
              onPress={() => {
                setDeleteError('');
                setConfirmDelete(true);
              }}
              style={({ pressed }) => [styles.deleteButton, (pressed || busy) && styles.dim]}
            >
              <Text style={styles.deleteButtonText}>Excluir minha conta</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomNavigation active="profile" onSelect={onNavigate} disabledTabs={disabledTabs} />

      <Dialog
        title="Excluir minha conta?"
        visible={confirmDelete}
        dismissible={!deleting}
        onClose={() => {
          setConfirmDelete(false);
          setDeleteError('');
        }}
      >
        <Text style={styles.dialogText}>
          Essa ação é permanente e removerá sua conta do sistema. Deseja continuar?
        </Text>
        {deleteError ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {deleteError}
          </Text>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Confirmar exclusão"
          accessibilityState={{ disabled: deleting, busy: deleting }}
          disabled={deleting}
          onPress={() => void confirmDeleteAccount()}
          style={({ pressed }) => [styles.confirmDeleteButton, (pressed || deleting) && styles.dim]}
        >
          {deleting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.confirmDeleteButtonText}>Confirmar exclusão</Text>
          )}
        </Pressable>
        <Button
          title="Cancelar"
          secondary
          disabled={deleting}
          onPress={() => {
            setConfirmDelete(false);
            setDeleteError('');
          }}
        />
      </Dialog>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.white },
  flex: { flex: 1 },
  content: { flexGrow: 1, paddingTop: 32, paddingHorizontal: 24, paddingBottom: 28 },
  title: { fontSize: 25, fontWeight: '700', color: colors.navy },
  identity: { alignItems: 'center', marginTop: 22 },
  avatar: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.white, fontSize: 32, fontWeight: '800' },
  displayName: {
    marginTop: 12,
    fontSize: 22,
    fontWeight: '700',
    color: colors.navy,
    textAlign: 'center',
  },
  roleBadge: {
    marginTop: 6,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 6,
  },
  clientBadge: { backgroundColor: colors.badge },
  adminBadge: { backgroundColor: colors.navy },
  roleBadgeText: { fontSize: 12, fontWeight: '700' },
  clientBadgeText: { color: colors.navy },
  adminBadgeText: { color: colors.white },
  sectionTitle: {
    marginTop: 24,
    marginBottom: 14,
    fontSize: 13,
    fontWeight: '600',
    color: colors.muted,
    letterSpacing: 0.4,
  },
  form: { gap: 14 },
  field: { gap: 7 },
  label: { fontSize: 12, fontWeight: '700', color: '#1A1A1A', letterSpacing: 0.4 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    minHeight: 48,
    color: '#2B2B2B',
    fontSize: 15,
  },
  error: { color: colors.error, fontSize: 14, lineHeight: 20 },
  notice: {
    color: colors.navy,
    backgroundColor: colors.soft,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    lineHeight: 20,
  },
  primaryButton: {
    marginTop: 8,
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  primaryButtonText: { color: colors.white, fontSize: 15, fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#DFDFDF', marginVertical: 4 },
  logoutButton: {
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: colors.white,
    borderWidth: 1.2,
    borderColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  logoutButtonText: { color: colors.navy, fontSize: 15, fontWeight: '700' },
  deleteButton: {
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: colors.white,
    borderWidth: 1.2,
    borderColor: DANGER_RED,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  deleteButtonText: { color: DANGER_RED, fontSize: 15, fontWeight: '700' },
  confirmDeleteButton: {
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: DANGER_RED,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  confirmDeleteButtonText: { color: colors.white, fontSize: 15, fontWeight: '700' },
  dialogText: { fontSize: 15, color: colors.gray, lineHeight: 23 },
  dim: { opacity: 0.6 },
});
