import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { IconButton } from '@/components/IconButton';
import { TextField } from '@/components/TextField';
import { createExercise, listExercises } from '@/db/repositories/exercises';
import { muscleGroupLabels } from '@/domain/labels';
import type { Exercise } from '@/domain/types';
import { radius, spacing } from '@/theme';
import { useTheme } from '@/theme/useTheme';

type ExercisePickerModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
};

export function ExercisePickerModal({
  visible,
  onClose,
  onSelect,
}: ExercisePickerModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');

  const exercises = useMemo(
    () => (visible ? listExercises(search) : []),
    [visible, search],
  );

  const trimmedSearch = search.trim();

  function handleSelect(exercise: Exercise) {
    onSelect(exercise);
    setSearch('');
    onClose();
  }

  function handleCreate() {
    if (!trimmedSearch) return;
    const exercise = createExercise(trimmedSearch, 'otro');
    handleSelect(exercise);
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboard}>
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: colors.background,
                paddingBottom: insets.bottom + spacing.lg,
              },
            ]}>
            <View style={styles.header}>
              <View style={styles.headerText}>
                <AppText variant="subtitle">Elegir ejercicio</AppText>
                <AppText variant="caption" color="textSecondary">
                  Buscá en la biblioteca o creá uno personalizado.
                </AppText>
              </View>
              <IconButton
                name="close"
                accessibilityLabel="Cerrar"
                onPress={onClose}
              />
            </View>

            <TextField
              placeholder="Buscar ejercicio..."
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
              autoCapitalize="none"
            />

            <FlatList
              data={exercises}
              keyExtractor={(item) => String(item.id)}
              style={styles.list}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                trimmedSearch ? (
                  <View style={styles.empty}>
                    <AppText variant="body" color="textSecondary">
                      No encontramos “{trimmedSearch}”.
                    </AppText>
                    <Button
                      label={`Crear “${trimmedSearch}”`}
                      variant="secondary"
                      onPress={handleCreate}
                    />
                  </View>
                ) : (
                  <AppText variant="body" color="textSecondary">
                    No hay ejercicios disponibles.
                  </AppText>
                )
              }
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handleSelect(item)}
                  style={({ pressed }) => [
                    styles.exerciseRow,
                    { borderBottomColor: colors.border },
                    pressed && { backgroundColor: colors.backgroundAlt },
                  ]}>
                  <View style={[styles.exerciseIcon, { backgroundColor: colors.primarySoft }]}>
                    <MaterialCommunityIcons
                      name={item.isCustom ? 'pencil-outline' : 'dumbbell'}
                      size={18}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.exerciseText}>
                    <AppText variant="bodyStrong">{item.name}</AppText>
                    <AppText variant="caption" color="textMuted">
                      {muscleGroupLabels[item.muscleGroup] ?? item.muscleGroup}
                      {item.isCustom ? ' · Personalizado' : ''}
                    </AppText>
                  </View>
                  <MaterialCommunityIcons
                    name="plus-circle-outline"
                    size={22}
                    color={colors.primary}
                  />
                </Pressable>
              )}
            />
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  empty: {
    gap: spacing.md,
    paddingVertical: spacing.xl,
  },
  exerciseIcon: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  exerciseRow: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  exerciseText: {
    flex: 1,
    gap: 2,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
    gap: spacing.xs,
  },
  keyboard: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  list: {
    maxHeight: 460,
  },
  listContent: {
    paddingBottom: spacing.md,
  },
  overlay: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
});
