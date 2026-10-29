import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format, parseISO, subYears } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { TextField } from '@/components/TextField';
import {
  activityLevelOptions,
  sexOptions,
} from '@/domain/labels';
import {
  calculateAge,
  cmToIn,
  inToCm,
  kgToLb,
  lbToKg,
} from '@/domain/calculations';
import type { ActivityLevel, Profile, ProfileUpdate, Sex } from '@/domain/types';
import { radius, spacing } from '@/theme';
import { useTheme } from '@/theme/useTheme';
import { formatInputNumber, parseDecimal } from '@/utils/numbers';

type ProfileFormProps = {
  initialProfile: Profile;
  submitLabel: string;
  onSubmit: (update: ProfileUpdate) => void;
};

export function ProfileForm({ initialProfile, submitLabel, onSubmit }: ProfileFormProps) {
  const { colors } = useTheme();
  const unitSystem = initialProfile.unitSystem;

  const [name, setName] = useState(initialProfile.name);
  const [birthDate, setBirthDate] = useState<Date | null>(
    initialProfile.birthDate ? parseISO(initialProfile.birthDate) : null,
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [height, setHeight] = useState(
    initialProfile.heightCm === null
      ? ''
      : formatInputNumber(
          unitSystem === 'metric' ? initialProfile.heightCm : cmToIn(initialProfile.heightCm),
          1,
        ),
  );
  const [sex, setSex] = useState<Sex>(initialProfile.sex);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(
    initialProfile.activityLevel,
  );
  const [goalWeight, setGoalWeight] = useState(
    initialProfile.goalWeightKg === null
      ? ''
      : formatInputNumber(
          unitSystem === 'metric' ? initialProfile.goalWeightKg : kgToLb(initialProfile.goalWeightKg),
          1,
        ),
  );
  const [weeklyGoal, setWeeklyGoal] = useState(String(initialProfile.weeklyGoal));
  const [error, setError] = useState<string | null>(null);

  const age = birthDate ? calculateAge(format(birthDate, 'yyyy-MM-dd')) : null;
  const weightUnit = unitSystem === 'metric' ? 'kg' : 'lb';
  const heightUnit = unitSystem === 'metric' ? 'cm' : 'in';

  function handleDateChange(event: DateTimePickerEvent, selected?: Date) {
    setShowDatePicker(false);
    if (event.type === 'set' && selected) {
      setBirthDate(selected);
    }
  }

  function handleSubmit() {
    const heightValue = parseDecimal(height);
    const goalValue = parseDecimal(goalWeight);
    const weeklyValue = parseDecimal(weeklyGoal);

    if (heightValue === null) {
      setError('Ingresá tu altura para poder calcular el IMC.');
      return;
    }

    const heightCm = unitSystem === 'metric' ? heightValue : inToCm(heightValue);
    if (heightCm < 80 || heightCm > 250) {
      setError('La altura parece fuera de rango. Revisá el valor.');
      return;
    }

    if (goalValue !== null && goalValue <= 0) {
      setError('El peso objetivo debe ser mayor que cero.');
      return;
    }

    const weekly = weeklyValue === null ? 3 : Math.round(weeklyValue);
    if (weekly < 1 || weekly > 14) {
      setError('La meta semanal debe estar entre 1 y 14 sesiones.');
      return;
    }

    setError(null);
    onSubmit({
      name: name.trim(),
      birthDate: birthDate ? format(birthDate, 'yyyy-MM-dd') : null,
      sex,
      heightCm,
      activityLevel,
      goalWeightKg:
        goalValue === null ? null : unitSystem === 'metric' ? goalValue : lbToKg(goalValue),
      weeklyGoal: weekly,
      onboarded: true,
    });
  }

  return (
    <View style={styles.container}>
      <TextField
        label="Nombre"
        placeholder="Tu nombre"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        hint="Opcional, se usa para personalizar la app."
      />

      <View style={styles.field}>
        <AppText variant="label">Fecha de nacimiento</AppText>
        <Pressable
          accessibilityRole="button"
          onPress={() => setShowDatePicker(true)}
          style={[
            styles.dateButton,
            { backgroundColor: colors.backgroundAlt, borderColor: colors.border },
          ]}>
          <MaterialCommunityIcons name="calendar-blank-outline" size={20} color={colors.textMuted} />
          <AppText variant="body" color={birthDate ? 'text' : 'textMuted'}>
            {birthDate
              ? format(birthDate, "d 'de' MMMM 'de' yyyy", { locale: es })
              : 'Seleccionar fecha'}
          </AppText>
          {age !== null ? (
            <AppText variant="caption" color="textMuted" style={styles.dateAge}>
              {age} años
            </AppText>
          ) : null}
        </Pressable>
        {showDatePicker ? (
          <DateTimePicker
            value={birthDate ?? subYears(new Date(), 30)}
            mode="date"
            display="default"
            maximumDate={new Date()}
            onChange={handleDateChange}
          />
        ) : null}
      </View>

      <TextField
        label={`Altura (${heightUnit})`}
        placeholder={unitSystem === 'metric' ? 'Ej. 175' : 'Ej. 69'}
        value={height}
        onChangeText={setHeight}
        keyboardType="decimal-pad"
        hint="La usamos para calcular tu IMC."
      />

      <View style={styles.field}>
        <AppText variant="label">Sexo</AppText>
        <View style={styles.chips}>
          {sexOptions.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              selected={sex === option.value}
              onPress={() => setSex(option.value)}
            />
          ))}
        </View>
      </View>

      <View style={styles.field}>
        <AppText variant="label">Nivel de actividad</AppText>
        <View style={styles.chips}>
          {activityLevelOptions.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              selected={activityLevel === option.value}
              onPress={() => setActivityLevel(option.value)}
            />
          ))}
        </View>
      </View>

      <View style={styles.row}>
        <TextField
          label={`Peso objetivo (${weightUnit})`}
          placeholder="Opcional"
          value={goalWeight}
          onChangeText={setGoalWeight}
          keyboardType="decimal-pad"
          containerStyle={styles.rowField}
        />
        <TextField
          label="Meta semanal"
          placeholder="3"
          value={weeklyGoal}
          onChangeText={setWeeklyGoal}
          keyboardType="number-pad"
          hint="Sesiones por semana"
          containerStyle={styles.rowField}
        />
      </View>

      {error ? (
        <AppText variant="caption" color="danger">
          {error}
        </AppText>
      ) : null}

      <Button label={submitLabel} onPress={handleSubmit} size="lg" />
    </View>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  container: {
    gap: spacing.lg,
  },
  dateAge: {
    marginLeft: 'auto',
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
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  rowField: {
    flex: 1,
  },
});
