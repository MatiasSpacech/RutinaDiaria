import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import {
  AppText,
  Button,
  Card,
  PageHeader,
  Screen,
  TextField,
} from '@/components';
import {
  createMeasurement,
  deleteMeasurement,
  getMeasurement,
  updateMeasurement,
} from '@/db/repositories/measurements';
import {
  calculateBmi,
  classifyBmi,
  cmToIn,
  formatBmiValue,
  inToCm,
  kgToLb,
  lbToKg,
} from '@/domain/calculations';
import { useAppStore } from '@/store/app';
import { radius, spacing } from '@/theme';
import { useTheme } from '@/theme/useTheme';
import { formatInputNumber, parseDecimal } from '@/utils/numbers';

function displayValue(value: number | null, unitSystem: 'metric' | 'imperial', kind: 'weight' | 'length') {
  if (value === null) return '';
  if (unitSystem === 'metric') return formatInputNumber(value, 1);
  return formatInputNumber(kind === 'weight' ? kgToLb(value) : cmToIn(value), 1);
}

export default function MeasurementFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { colors } = useTheme();
  const profile = useAppStore((state) => state.profile);
  const unitSystem = profile?.unitSystem ?? 'metric';
  const isEditing = Boolean(id);

  const existing = id ? getMeasurement(Number(id)) : null;
  const [measuredAt, setMeasuredAt] = useState<Date>(
    existing ? parseISO(existing.measuredAt) : new Date(),
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [weight, setWeight] = useState(displayValue(existing?.weightKg ?? null, unitSystem, 'weight'));
  const [waist, setWaist] = useState(displayValue(existing?.waistCm ?? null, unitSystem, 'length'));
  const [hip, setHip] = useState(displayValue(existing?.hipCm ?? null, unitSystem, 'length'));
  const [chest, setChest] = useState(displayValue(existing?.chestCm ?? null, unitSystem, 'length'));
  const [arm, setArm] = useState(displayValue(existing?.armCm ?? null, unitSystem, 'length'));
  const [thigh, setThigh] = useState(displayValue(existing?.thighCm ?? null, unitSystem, 'length'));
  const [bodyFat, setBodyFat] = useState(
    existing?.bodyFatPct === null || existing?.bodyFatPct === undefined
      ? ''
      : formatInputNumber(existing.bodyFatPct, 1),
  );
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [error, setError] = useState<string | null>(null);

  const weightUnit = unitSystem === 'metric' ? 'kg' : 'lb';
  const lengthUnit = unitSystem === 'metric' ? 'cm' : 'in';

  const weightDisplayValue = parseDecimal(weight);
  const weightKg =
    weightDisplayValue === null
      ? null
      : unitSystem === 'metric'
        ? weightDisplayValue
        : lbToKg(weightDisplayValue);
  const bmi = calculateBmi(weightKg, profile?.heightCm ?? null);
  const bmiClassification = classifyBmi(bmi);

  function parseLength(value: string): number | null {
    const parsed = parseDecimal(value);
    if (parsed === null) return null;
    return unitSystem === 'metric' ? parsed : inToCm(parsed);
  }

  function handleSave() {
    const waistCm = parseLength(waist);
    const hipCm = parseLength(hip);
    const chestCm = parseLength(chest);
    const armCm = parseLength(arm);
    const thighCm = parseLength(thigh);
    const bodyFatValue = parseDecimal(bodyFat);

    if (weightDisplayValue !== null && weightDisplayValue <= 0) {
      setError('El peso debe ser mayor que cero.');
      return;
    }
    if (bodyFatValue !== null && (bodyFatValue < 0 || bodyFatValue > 70)) {
      setError('El porcentaje de grasa debe estar entre 0 y 70.');
      return;
    }
    if (
      weightDisplayValue === null &&
      waistCm === null &&
      hipCm === null &&
      chestCm === null &&
      armCm === null &&
      thighCm === null &&
      bodyFatValue === null
    ) {
      setError('Cargá al menos una medida.');
      return;
    }

    const input = {
      measuredAt: format(measuredAt, 'yyyy-MM-dd'),
      weightKg,
      waistCm,
      hipCm,
      chestCm,
      armCm,
      thighCm,
      bodyFatPct: bodyFatValue,
      notes: notes.trim() || null,
    };

    if (existing) {
      updateMeasurement(existing.id, input);
    } else {
      createMeasurement(input);
    }
    router.back();
  }

  function handleDelete() {
    if (!existing) return;
    Alert.alert('Eliminar medición', '¿Querés eliminar esta medición?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          deleteMeasurement(existing.id);
          router.back();
        },
      },
    ]);
  }

  return (
    <Screen>
      <PageHeader
        title={isEditing ? 'Editar medición' : 'Nueva medición'}
        subtitle={format(measuredAt, "EEEE d 'de' MMMM", { locale: es })}
        onBack={() => router.back()}
      />

      {bmi && bmiClassification ? (
        <Card style={[styles.bmiCard, { backgroundColor: colors.primarySoft }]}>
          <View>
            <AppText variant="label" color="textSecondary">
              IMC CALCULADO
            </AppText>
            <AppText variant="title">{formatBmiValue(bmi)}</AppText>
          </View>
          <View style={[styles.bmiBadge, { backgroundColor: colors.surface }]}>
            <AppText variant="label">{bmiClassification.label}</AppText>
          </View>
        </Card>
      ) : (
        <Card style={styles.hintCard}>
          <AppText variant="caption" color="textSecondary">
            Cargá tu peso y asegurate de tener la altura en tu perfil para ver el IMC.
          </AppText>
        </Card>
      )}

      <Card style={styles.formCard}>
        <View style={styles.field}>
          <AppText variant="label">Fecha</AppText>
          <Pressable
            accessibilityRole="button"
            onPress={() => setShowDatePicker(true)}
            style={[
              styles.dateButton,
              { backgroundColor: colors.backgroundAlt, borderColor: colors.border },
            ]}>
            <MaterialCommunityIcons
              name="calendar-blank-outline"
              size={20}
              color={colors.textMuted}
            />
            <AppText variant="body">
              {format(measuredAt, "d 'de' MMMM 'de' yyyy", { locale: es })}
            </AppText>
          </Pressable>
          {showDatePicker ? (
            <DateTimePicker
              value={measuredAt}
              mode="date"
              display="default"
              maximumDate={new Date()}
              onValueChange={(_, selected) => {
                setShowDatePicker(false);
                setMeasuredAt(selected);
              }}
              onDismiss={() => setShowDatePicker(false)}
            />
          ) : null}
        </View>

        <View style={styles.row}>
          <TextField
            label={`Peso (${weightUnit})`}
            placeholder="Ej. 75.5"
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
            containerStyle={styles.rowField}
          />
          <TextField
            label="% de grasa"
            placeholder="Opcional"
            value={bodyFat}
            onChangeText={setBodyFat}
            keyboardType="decimal-pad"
            containerStyle={styles.rowField}
          />
        </View>

        <AppText variant="label" color="textSecondary">
          MEDIDAS ({lengthUnit.toUpperCase()})
        </AppText>
        <View style={styles.row}>
          <TextField
            label="Cintura"
            value={waist}
            onChangeText={setWaist}
            keyboardType="decimal-pad"
            containerStyle={styles.rowField}
          />
          <TextField
            label="Cadera"
            value={hip}
            onChangeText={setHip}
            keyboardType="decimal-pad"
            containerStyle={styles.rowField}
          />
        </View>
        <View style={styles.row}>
          <TextField
            label="Pecho"
            value={chest}
            onChangeText={setChest}
            keyboardType="decimal-pad"
            containerStyle={styles.rowField}
          />
          <TextField
            label="Brazo"
            value={arm}
            onChangeText={setArm}
            keyboardType="decimal-pad"
            containerStyle={styles.rowField}
          />
        </View>
        <TextField
          label="Muslo"
          value={thigh}
          onChangeText={setThigh}
          keyboardType="decimal-pad"
        />
        <TextField
          label="Notas"
          placeholder="¿Cómo te sentiste esta semana?"
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        {error ? (
          <AppText variant="caption" color="danger">
            {error}
          </AppText>
        ) : null}

        <Button label={isEditing ? 'Guardar cambios' : 'Guardar medición'} onPress={handleSave} size="lg" />
        {isEditing ? (
          <Button label="Eliminar medición" variant="ghost" onPress={handleDelete} />
        ) : null}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  bmiBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  bmiCard: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateButton: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 50,
    paddingHorizontal: spacing.lg,
  },
  field: {
    gap: spacing.sm,
  },
  formCard: {
    gap: spacing.lg,
  },
  hintCard: {
    padding: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  rowField: {
    flex: 1,
  },
});
