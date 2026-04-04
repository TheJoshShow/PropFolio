import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import { AppButton, AppTextField, BottomSheetContainer } from '@/components/ui';
import { defaultFinancing, defaultOperating, mergeUserAssumptions, normalizedInputsFromSnapshot } from '@/scoring';
import type { UserAssumptionOverrides } from '@/scoring';
import type { PropertySnapshotV1 } from '@/types/property';
import { colors, hitSlop, spacing, typography } from '@/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  snapshot: PropertySnapshotV1;
  userOverrides: UserAssumptionOverrides;
  onApply: (next: UserAssumptionOverrides) => void;
  onResetToImport: () => void;
};

function num(s: string): number | undefined {
  const t = s.trim();
  if (t === '') {
    return undefined;
  }
  const n = Number(t.replace(/,/g, ''));
  return Number.isFinite(n) ? n : undefined;
}

function pctToFrac(s: string): number | undefined {
  const n = num(s);
  return n === undefined ? undefined : n / 100;
}

/**
 * Assumptions & what-if editor — writes `UserAssumptionOverrides` only (deterministic engine).
 * Renovation line items (when added) merge in the Renovation analysis tab; scenario stress still uses Adjust inputs.
 */
export function AssumptionsEditorModal({
  visible,
  onClose,
  snapshot,
  userOverrides,
  onApply,
  onResetToImport,
}: Props) {
  const [purchase, setPurchase] = useState('');
  const [rent, setRent] = useState('');
  const [arv, setArv] = useState('');
  const [tax, setTax] = useState('');
  const [insurance, setInsurance] = useState('');
  const [hoa, setHoa] = useState('');
  const [otherOpex, setOtherOpex] = useState('');
  const [rehab, setRehab] = useState('');
  const [units, setUnits] = useState('1');
  const [vacancyPct, setVacancyPct] = useState('');
  const [maintPct, setMaintPct] = useState('');
  const [mgmtPct, setMgmtPct] = useState('');
  const [capexMo, setCapexMo] = useState('');
  const [ltvPct, setLtvPct] = useState('');
  const [ratePct, setRatePct] = useState('');
  const [amortYears, setAmortYears] = useState('');
  const [interestOnly, setInterestOnly] = useState(false);
  const [closingPct, setClosingPct] = useState('');

  useEffect(() => {
    if (!visible) {
      return;
    }
    const { normalized: rawN } = normalizedInputsFromSnapshot(snapshot);
    const merged = mergeUserAssumptions(rawN, defaultFinancing(), defaultOperating(), userOverrides);
    const n = merged.normalized;
    const f = merged.financing;
    const o = merged.operating;

    setPurchase(n.purchasePrice != null ? String(n.purchasePrice) : '');
    setRent(n.monthlyRentGross != null ? String(n.monthlyRentGross) : '');
    setArv(n.arv != null ? String(n.arv) : '');
    setTax(n.annualPropertyTax != null ? String(n.annualPropertyTax) : '');
    setInsurance(n.annualInsurance != null ? String(n.annualInsurance) : '');
    setHoa(n.annualHoa != null ? String(n.annualHoa) : '');
    setOtherOpex(n.annualOtherOperating != null ? String(n.annualOtherOperating) : '');
    setRehab(n.rehabBudget != null ? String(n.rehabBudget) : '');
    setUnits(String(n.unitCount || 1));
    setVacancyPct(String((o.vacancyRate * 100).toFixed(2)));
    setMaintPct(String((o.maintenancePctOfEgi * 100).toFixed(2)));
    setMgmtPct(String((o.managementPctOfEgi * 100).toFixed(2)));
    setCapexMo(String(o.capexReserveMonthly));
    setLtvPct(String((f.loanToValue * 100).toFixed(1)));
    setRatePct(String((f.interestRateAnnual * 100).toFixed(3)));
    setAmortYears(String(f.amortizationYears));
    setInterestOnly(f.interestOnly);
    setClosingPct(String((f.closingCostPctOfLoan * 100).toFixed(2)));
  }, [visible, snapshot, userOverrides]);

  const handleApply = () => {
    const inputs: NonNullable<UserAssumptionOverrides['inputs']> = { ...(userOverrides.inputs ?? {}) };
    const p = num(purchase);
    const r = num(rent);
    const a = num(arv);
    const t = num(tax);
    const ins = num(insurance);
    const h = num(hoa);
    const oo = num(otherOpex);
    const rb = num(rehab);
    const uc = num(units);

    if (p !== undefined) {
      inputs.purchasePrice = p;
    }
    if (r !== undefined) {
      inputs.monthlyRentGross = r;
    }
    if (a !== undefined) {
      inputs.arv = a;
    }
    if (t !== undefined) {
      inputs.annualPropertyTax = t;
    }
    if (ins !== undefined) {
      inputs.annualInsurance = ins;
    }
    if (h !== undefined) {
      inputs.annualHoa = h;
    }
    if (oo !== undefined) {
      inputs.annualOtherOperating = oo;
    }
    if (rb !== undefined) {
      inputs.rehabBudget = rb;
    }
    if (uc !== undefined && uc >= 1) {
      inputs.unitCount = Math.floor(uc);
    }

    const operating: NonNullable<UserAssumptionOverrides['operating']> = { ...(userOverrides.operating ?? {}) };
    const vp = pctToFrac(vacancyPct);
    const mp = pctToFrac(maintPct);
    const mgp = pctToFrac(mgmtPct);
    const cx = num(capexMo);
    if (vp !== undefined) {
      operating.vacancyRate = vp;
    }
    if (mp !== undefined) {
      operating.maintenancePctOfEgi = mp;
    }
    if (mgp !== undefined) {
      operating.managementPctOfEgi = mgp;
    }
    if (cx !== undefined) {
      operating.capexReserveMonthly = cx;
    }

    const financing: NonNullable<UserAssumptionOverrides['financing']> = { ...(userOverrides.financing ?? {}) };
    const ltv = pctToFrac(ltvPct);
    const ir = pctToFrac(ratePct);
    const am = num(amortYears);
    const cl = pctToFrac(closingPct);
    if (ltv !== undefined) {
      financing.loanToValue = ltv;
    }
    if (ir !== undefined) {
      financing.interestRateAnnual = ir;
    }
    if (am !== undefined) {
      financing.amortizationYears = am;
    }
    financing.interestOnly = interestOnly;
    if (cl !== undefined) {
      financing.closingCostPctOfLoan = cl;
    }

    onApply({
      inputs,
      operating,
      financing,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.kavRoot}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
      >
        <View style={styles.overlay}>
          <Pressable
            style={styles.dismiss}
            onPress={onClose}
            accessibilityLabel="Close assumptions"
            hitSlop={hitSlop}
          />
          <BottomSheetContainer contentBottomInset={spacing.xl}>
          <Text style={styles.sheetTitle}>Assumptions & what-if</Text>
          <Text style={styles.sheetSub}>
            Changes recalc instantly after you apply. Values are not sent to AI — only deterministic math.
          </Text>

          <ScrollView
            style={styles.formScroll}
            contentContainerStyle={styles.formScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.group}>Property</Text>
            <AppTextField label="Purchase / list price" keyboardType="decimal-pad" value={purchase} onChangeText={setPurchase} />
            <AppTextField label="Monthly rent (total)" keyboardType="decimal-pad" value={rent} onChangeText={setRent} />
            <AppTextField label="ARV (after repair value)" keyboardType="decimal-pad" value={arv} onChangeText={setArv} />
            <AppTextField label="Annual property tax" keyboardType="decimal-pad" value={tax} onChangeText={setTax} />
            <AppTextField label="Annual insurance" keyboardType="decimal-pad" value={insurance} onChangeText={setInsurance} />
            <AppTextField label="Annual HOA" keyboardType="decimal-pad" value={hoa} onChangeText={setHoa} />
            <AppTextField
              label="Other annual operating ($)"
              keyboardType="decimal-pad"
              value={otherOpex}
              onChangeText={setOtherOpex}
            />
            <AppTextField label="Rehab budget (one-time)" keyboardType="decimal-pad" value={rehab} onChangeText={setRehab} />
            <AppTextField label="Unit count" keyboardType="number-pad" value={units} onChangeText={setUnits} />

            <Text style={styles.group}>Operating</Text>
            <AppTextField label="Vacancy (%)" keyboardType="decimal-pad" value={vacancyPct} onChangeText={setVacancyPct} />
            <AppTextField label="Maintenance (% of EGI)" keyboardType="decimal-pad" value={maintPct} onChangeText={setMaintPct} />
            <AppTextField
              label="Management (% of EGI)"
              keyboardType="decimal-pad"
              value={mgmtPct}
              onChangeText={setMgmtPct}
            />
            <AppTextField label="CapEx reserve ($/mo)" keyboardType="decimal-pad" value={capexMo} onChangeText={setCapexMo} />

            <Text style={styles.group}>Financing</Text>
            <AppTextField label="Loan-to-value (%)" keyboardType="decimal-pad" value={ltvPct} onChangeText={setLtvPct} />
            <AppTextField label="Interest rate (annual %)" keyboardType="decimal-pad" value={ratePct} onChangeText={setRatePct} />
            <AppTextField label="Amortization (years)" keyboardType="decimal-pad" value={amortYears} onChangeText={setAmortYears} />
            <AppTextField
              label="Closing costs (% of loan)"
              keyboardType="decimal-pad"
              value={closingPct}
              onChangeText={setClosingPct}
            />
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Interest-only loan</Text>
              <Switch
                value={interestOnly}
                onValueChange={setInterestOnly}
                trackColor={{ false: colors.border, true: colors.accentScoreMuted }}
                thumbColor={colors.surfaceCard}
              />
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <AppButton label="Cancel" variant="ghost" onPress={onClose} />
            <AppButton label="Reset to import" variant="ghost" onPress={onResetToImport} />
            <AppButton label="Apply" onPress={handleApply} />
          </View>
        </BottomSheetContainer>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  kavRoot: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  dismiss: {
    flex: 1,
  },
  sheetTitle: {
    ...typography.cardTitle,
    marginBottom: spacing.xs,
  },
  sheetSub: {
    ...typography.caption,
    marginBottom: spacing.md,
  },
  formScroll: {
    maxHeight: 440,
    marginBottom: spacing.md,
  },
  formScrollContent: {
    paddingBottom: spacing.xl,
  },
  group: {
    ...typography.sectionHeader,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  switchLabel: {
    ...typography.body,
    flex: 1,
  },
  actions: {
    gap: spacing.sm,
  },
});
