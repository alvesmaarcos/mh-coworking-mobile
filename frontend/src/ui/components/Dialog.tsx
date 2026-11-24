import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

export function Dialog({ title, visible, onClose, children, dismissible = true, sheet = false }: {
  title: string; visible: boolean; onClose: () => void; children: ReactNode; dismissible?: boolean; sheet?: boolean;
}) {
  return <Modal visible={visible} transparent animationType={sheet ? 'slide' : 'fade'} onRequestClose={dismissible ? onClose : () => {}}>
    <View style={[styles.overlay, sheet && styles.sheetOverlay]}>
      <Pressable accessibilityLabel="Fechar janela" disabled={!dismissible} onPress={onClose} style={StyleSheet.absoluteFill} />
      <View accessibilityViewIsModal style={[styles.dialog, sheet && styles.sheet]}>
        <Text accessibilityRole="header" style={styles.title}>{title}</Text>
        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} keyboardShouldPersistTaps="handled">{children}</ScrollView>
      </View>
    </View>
  </Modal>;
}
const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(10,13,45,0.35)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  dialog: { width: '100%', maxWidth: 380, maxHeight: '85%', borderRadius: 18, padding: 22, backgroundColor: colors.white, gap: 16 },
  sheetOverlay: { justifyContent: 'flex-end', padding: 0 },
  sheet: { maxWidth: 600, maxHeight: '92%', borderBottomLeftRadius: 0, borderBottomRightRadius: 0, paddingBottom: 28 },
  title: { color: colors.navy, fontSize: 20, fontWeight: '700' },
  body: { flexShrink: 1 }, bodyContent: { gap: 16 },
});
