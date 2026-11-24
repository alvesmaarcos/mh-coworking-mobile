import { useState, type ComponentProps } from 'react';
import Feather from '@expo/vector-icons/Feather';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { Room } from '../domain/models';
import { parsePrice, ROOM_PHOTOS } from '../domain/rooms';
import { ApiClient } from '../infrastructure/api';
import { Button } from './components/Button';
import { Dialog } from './components/Dialog';
import { colors } from './theme';

/** Cadastro (sem `room`) e edição (com `room`) de sala no mesmo formulário. */
export function RoomFormSheet({ api, token, room, onClose, onSaved }: {
  api: ApiClient; token: string; room?: Room; onClose: () => void; onSaved: () => void;
}) {
  const [nome, setNome] = useState(room?.nome ?? '');
  const [descricao, setDescricao] = useState(room?.descricao ?? '');
  const [atributos, setAtributos] = useState(room?.atributos ?? '');
  const [valor, setValor] = useState(room?.valor_hora !== undefined ? String(room.valor_hora) : '');
  const [imagem, setImagem] = useState(room?.imagem_url ?? null);
  const [picking, setPicking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const preview = api.assetUrl(imagem);

  async function submit() {
    const valor_hora = parsePrice(valor);
    if (!nome.trim()) return setError('Informe o nome da sala.');
    if (valor_hora === null) return setError('Informe um valor por hora maior que zero.');
    const input = { nome: nome.trim(), descricao: descricao.trim() || null, atributos: atributos.trim() || null, valor_hora, imagem_url: imagem };
    setBusy(true);
    setError('');
    try {
      await (room ? api.updateRoom(token, room.id, input) : api.createRoom(token, input));
      onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível salvar a sala.');
      setBusy(false);
    }
  }

  return <Dialog sheet visible title={room ? 'Editar sala' : 'Cadastrar nova sala'} onClose={onClose} dismissible={!busy}>
    <Field label="NOME" value={nome} onChangeText={setNome} editable={!busy} />
    <Field label="DESCRIÇÃO" value={descricao} onChangeText={setDescricao} editable={!busy} multiline />
    <Field label="ATRIBUTOS" value={atributos} onChangeText={setAtributos} editable={!busy} placeholder="Ex.: Climatizada, TV ampla, 6 cadeiras" />
    <Field label="VALOR DA HORA (R$)" value={valor} onChangeText={setValor} editable={!busy} keyboardType="decimal-pad" />
    <View style={styles.field}>
      <Text style={styles.label}>FAZER UPLOAD FOTO DE CAPA +</Text>
      {preview ? <Image accessibilityLabel="Foto de capa selecionada" source={{ uri: preview }} style={styles.preview} /> : null}
      <Pressable accessibilityRole="button" disabled={busy} onPress={() => setPicking(value => !value)} style={({ pressed }) => [styles.upload, pressed && styles.pressed]}>
        <Text style={styles.uploadText}>{picking ? 'FECHAR FOTOS' : imagem ? 'TROCAR FOTO +' : 'CARREGAR FOTO +'}</Text>
      </Pressable>
      {picking ? <View style={styles.grid}>{ROOM_PHOTOS.map(path => {
        const selected = path === imagem;
        return <Pressable key={path} accessibilityRole="button" accessibilityLabel={`Usar foto ${path.split('/').pop()}`} accessibilityState={{ selected }}
          onPress={() => { setImagem(path); setPicking(false); }} style={[styles.thumbWrap, selected && styles.thumbSelected]}>
          <Image source={{ uri: api.assetUrl(path)! }} style={styles.thumb} />
          {selected ? <View style={styles.check}><Feather name="check" size={12} color={colors.white} /></View> : null}
        </Pressable>;
      })}</View> : null}
    </View>
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    <Button orange title={room ? 'Salvar alterações' : 'Cadastrar sala'} busy={busy} onPress={submit} />
    <Pressable accessibilityRole="button" disabled={busy} onPress={onClose} style={styles.cancel}>
      <Text style={styles.cancelText}>Cancelar</Text>
    </Pressable>
  </Dialog>;
}

function Field({ label, multiline, ...props }: { label: string } & ComponentProps<typeof TextInput>) {
  return <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <TextInput accessibilityLabel={label} placeholderTextColor="#929292" multiline={multiline}
      style={[styles.input, multiline && styles.multiline]} {...props} />
  </View>;
}

const styles = StyleSheet.create({
  field: { gap: 8 },
  label: { fontSize: 11, fontWeight: '700', color: '#1A1A1A', letterSpacing: 0.6 },
  input: { minHeight: 42, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, color: colors.navy, fontSize: 13 },
  multiline: { minHeight: 56, paddingTop: 10, textAlignVertical: 'top' },
  preview: { width: '100%', height: 110, borderRadius: 8, backgroundColor: colors.surface },
  upload: { minHeight: 32, borderWidth: 1, borderColor: colors.border, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  uploadText: { fontSize: 10, fontWeight: '600', color: colors.gray, letterSpacing: 1 },
  pressed: { opacity: 0.7 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  thumbWrap: { width: '31.5%', aspectRatio: 1.4, borderRadius: 6, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' },
  thumbSelected: { borderColor: colors.orange },
  thumb: { width: '100%', height: '100%', backgroundColor: colors.surface },
  check: { position: 'absolute', top: 4, right: 4, width: 18, height: 18, borderRadius: 9, backgroundColor: colors.orange, alignItems: 'center', justifyContent: 'center' },
  error: { color: colors.error, lineHeight: 20 },
  cancel: { alignItems: 'center', paddingVertical: 4 },
  cancelText: { color: colors.navy, fontSize: 15, fontWeight: '700' },
});
