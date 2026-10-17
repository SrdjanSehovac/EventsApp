import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../theme';
import { openLegalDoc } from './openLegalDoc';
import { MINIMUM_AGE, type LegalDoc } from './versions';

export type LegalConsentState = {
  termsAndPrivacy: boolean;
  disclaimer: boolean;
  age: boolean;
};

export const EMPTY_CONSENT: LegalConsentState = {
  termsAndPrivacy: false,
  disclaimer: false,
  age: false,
};

export function consentComplete(c: LegalConsentState): boolean {
  return c.termsAndPrivacy && c.disclaimer && c.age;
}

type Part = string | { doc: LegalDoc; label: string };

function Row({
  checked,
  onToggle,
  parts,
  a11y,
  testID,
}: {
  checked: boolean;
  onToggle: () => void;
  parts: Part[];
  a11y: string;
  testID: string;
}) {
  const { colors, typography, spacing, radius } = useTheme();
  return (
    <View style={[styles.row, { marginBottom: spacing.md }]}>
      <Pressable
        testID={testID}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        accessibilityLabel={a11y}
        onPress={onToggle}
        hitSlop={10}
        style={[
          styles.box,
          {
            borderRadius: radius.sm,
            borderColor: checked ? colors.primary : colors.textMuted,
            backgroundColor: checked ? colors.primary : 'transparent',
          },
        ]}
      >
        {checked ? <Ionicons name="checkmark" size={16} color={colors.onPrimary} /> : null}
      </Pressable>
      <Text
        onPress={onToggle}
        style={[typography.body, { color: colors.text, flex: 1, marginLeft: spacing.md }]}
      >
        {parts.map((p, i) =>
          typeof p === 'string' ? (
            <Text key={i}>{p}</Text>
          ) : (
            <Text
              key={i}
              accessibilityRole="link"
              onPress={() => void openLegalDoc(p.doc)}
              style={{ color: colors.primary, fontWeight: '700', textDecorationLine: 'underline' }}
            >
              {p.label}
            </Text>
          ),
        )}
      </Text>
    </View>
  );
}

/** The three required, unticked-by-default agreement boxes. */
export function LegalConsent({
  value,
  onChange,
}: {
  value: LegalConsentState;
  onChange: (next: LegalConsentState) => void;
}) {
  const { colors, typography, spacing } = useTheme();
  const toggle = (key: keyof LegalConsentState) => onChange({ ...value, [key]: !value[key] });
  return (
    <View style={{ marginTop: spacing.sm, marginBottom: spacing.lg }}>
      <Row
        testID="consent-terms"
        checked={value.termsAndPrivacy}
        onToggle={() => toggle('termsAndPrivacy')}
        a11y="I agree to the Terms of Use and Privacy Policy"
        parts={[
          'I agree to the ',
          { doc: 'terms', label: 'Terms of Use' },
          ' and ',
          { doc: 'privacy', label: 'Privacy Policy' },
          '.',
        ]}
      />
      <Row
        testID="consent-disclaimer"
        checked={value.disclaimer}
        onToggle={() => toggle('disclaimer')}
        a11y="I understand Jaunta only lists events and I attend at my own risk"
        parts={[
          'I understand Jaunta only lists events and does not run them, and I attend at my own risk (',
          { doc: 'disclaimer', label: 'Event Liability Disclaimer' },
          ').',
        ]}
      />
      <Row
        testID="consent-age"
        checked={value.age}
        onToggle={() => toggle('age')}
        a11y={`I am ${MINIMUM_AGE} or older`}
        parts={[`I am ${MINIMUM_AGE} or older.`]}
      />
      <Text style={[typography.caption, { color: colors.textMuted }]}>
        All three are required to create an account.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  box: {
    width: 24,
    height: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
});
