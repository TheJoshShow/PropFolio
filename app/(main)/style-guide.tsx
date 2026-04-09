import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import { useLayoutEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppBackButton, HeaderActionSpacer } from '@/components/navigation';
import {
  AppButton,
  AppTextField,
  BottomSheetContainer,
  Card,
  EmptyState,
  FloatingActionButton,
  ListRow,
  LoadingState,
  MetricCard,
  MetricRow,
  PrimaryButton,
  PropertySummaryCard,
  Screen,
  ScoreBadge,
  SecondaryButton,
  SectionCard,
  SectionHeader,
  SettingsRow,
  TabPill,
  TabPillRow,
  TabSwitcher,
  TopBar,
} from '@/components/ui';
import { colors, layout, radius, semantic, shadowStyle, spacing, textPresets, typography } from '@/theme';

export default function StyleGuideScreen() {
  const navigation = useNavigation();
  const [tab, setTab] = useState(0);
  const [segTab, setSegTab] = useState('fin');

  useLayoutEffect(() => {
    navigation.setOptions({ title: 'Style guide' });
  }, [navigation]);

  return (
    <Screen scroll safeAreaEdges={['bottom', 'left', 'right']} contentContainerStyle={styles.scroll}>
      <Text style={styles.hero}>Design system</Text>
      <Text style={styles.heroSub}>
        Internal reference — tokens and primitives for PropFolio. Not shipped to end users.
      </Text>

      <SectionHeader title="Color tokens" subtitle="Backgrounds, text, accents" />
      <View style={styles.swatchRow}>
        <View style={[styles.swatch, { backgroundColor: colors.backgroundPrimary }]}>
          <Text style={styles.swatchLabel}>bg primary</Text>
        </View>
        <View style={[styles.swatch, { backgroundColor: colors.backgroundSecondary }]}>
          <Text style={styles.swatchLabel}>bg secondary</Text>
        </View>
        <View style={[styles.swatch, { backgroundColor: colors.surfaceCard, borderWidth: 1, borderColor: colors.border }]}>
          <Text style={styles.swatchLabel}>card</Text>
        </View>
      </View>
      <View style={styles.swatchRow}>
        <View style={[styles.swatch, { backgroundColor: colors.textPrimary }]}>
          <Text style={[styles.swatchLabel, { color: colors.surfaceCard }]}>text</Text>
        </View>
        <View style={[styles.swatch, { backgroundColor: colors.accentCta }]}>
          <Text style={[styles.swatchLabel, { color: colors.onCta }]}>CTA</Text>
        </View>
        <View style={[styles.swatch, { backgroundColor: colors.accentScore }]}>
          <Text style={[styles.swatchLabel, { color: colors.surfaceCard }]}>score</Text>
        </View>
      </View>
      <View style={styles.inlineRow}>
        <Text style={styles.textPrimarySample}>Primary navy</Text>
        <Text style={styles.textSecondarySample}>Secondary</Text>
        <Text style={styles.textMutedSample}>Muted</Text>
      </View>
      <View style={styles.inlineRow}>
        <Text style={styles.success}>Success</Text>
        <Text style={styles.warning}>Warning</Text>
        <Text style={styles.danger}>Danger</Text>
      </View>

      <SectionHeader title="Typography" />
      <Text style={typography.screenTitle}>Screen title</Text>
      <Text style={[typography.screenTitleSmall, styles.spacingTop]}>Screen title small</Text>
      <Text style={[typography.sectionHeader, styles.spacingTop]}>Section header</Text>
      <Text style={[typography.cardTitle, styles.spacingTop]}>Card title</Text>
      <Text style={[typography.metricLabel, styles.spacingTop]}>Metric label</Text>
      <Text style={[typography.body, styles.spacingTop]}>Body — primary narrative copy.</Text>
      <Text style={[typography.bodySecondary, styles.spacingTop]}>
        Body secondary — supporting lines.
      </Text>
      <Text style={[typography.caption, styles.spacingTop]}>Caption and footnotes.</Text>

      <SectionHeader title="Text presets (design system)" subtitle="textPresets.*" />
      <Text style={[textPresets.pageTitle, styles.spacingTop]}>Page title</Text>
      <Text style={[textPresets.cardTitle, styles.spacingTop]}>Card title preset</Text>
      <Text style={[textPresets.metricLabel, styles.spacingTop]}>Metric label preset</Text>
      <Text style={[textPresets.metricValue, styles.spacingTop]}>$350,000</Text>

      <SectionHeader title="Semantic palette" subtitle="semantic.* — new code should prefer this" />
      <View style={styles.swatchRow}>
        <View style={[styles.swatch, { backgroundColor: semantic.background }]}>
          <Text style={styles.swatchLabel}>background</Text>
        </View>
        <View style={[styles.swatch, { backgroundColor: semantic.surface, borderWidth: 1, borderColor: semantic.border }]}>
          <Text style={styles.swatchLabel}>surface</Text>
        </View>
        <View style={[styles.swatch, { backgroundColor: semantic.accentGold }]}>
          <Text style={[styles.swatchLabel, { color: semantic.accentGoldText }]}>gold</Text>
        </View>
      </View>

      <SectionHeader title="Spacing & radius" />
      <View style={styles.spacingDemo}>
        <View style={[styles.spacer, { width: spacing.xs, height: spacing.xs }]} />
        <View style={[styles.spacer, { width: spacing.sm, height: spacing.sm }]} />
        <View style={[styles.spacer, { width: spacing.md, height: spacing.md }]} />
        <View style={[styles.spacer, { width: spacing.lg, height: spacing.lg }]} />
        <View style={[styles.spacer, { width: spacing.xl, height: spacing.xl }]} />
      </View>
      <View style={styles.radiusRow}>
        <View style={[styles.radiusBox, { borderRadius: radius.sm }]} />
        <View style={[styles.radiusBox, { borderRadius: radius.md }]} />
        <View style={[styles.radiusBox, { borderRadius: radius.card }]} />
        <View style={[styles.radiusBox, { borderRadius: radius.lg }]} />
        <View style={[styles.radiusBox, { borderRadius: radius.xl }]} />
      </View>

      <SectionHeader title="Elevation" />
      <View style={styles.elevationRow}>
        <View style={[styles.elevCard, shadowStyle('none')]}>
          <Text style={styles.elevLabel}>none</Text>
        </View>
        <View style={[styles.elevCard, shadowStyle('xs')]}>
          <Text style={styles.elevLabel}>xs</Text>
        </View>
        <View style={[styles.elevCard, shadowStyle('sm')]}>
          <Text style={styles.elevLabel}>sm</Text>
        </View>
        <View style={[styles.elevCard, shadowStyle('md')]}>
          <Text style={styles.elevLabel}>md</Text>
        </View>
      </View>

      <SectionHeader title="Buttons" />
      <View style={styles.btnCol}>
        <PrimaryButton label="PrimaryButton" onPress={() => {}} />
        <SecondaryButton label="SecondaryButton" onPress={() => {}} />
        <AppButton label="Primary (via AppButton)" onPress={() => {}} />
        <AppButton label="Secondary" variant="secondary" onPress={() => {}} />
        <AppButton label="Ghost" variant="ghost" onPress={() => {}} />
        <AppButton label="Destructive" variant="destructive" onPress={() => {}} />
        <AppButton label="Loading" loading onPress={() => {}} />
      </View>

      <SectionHeader title="Inputs" />
      <AppTextField label="Email" variant="outline" placeholder="you@example.com" />
      <View style={styles.fieldGap} />
      <AppTextField label="Filled" variant="filled" placeholder="Notes" />
      <View style={styles.fieldGap} />
      <AppTextField
        label="Search addresses"
        variant="search"
        leftAccessory={<Text style={styles.searchIcon}>⌕</Text>}
      />

      <SectionHeader title="Cards & badges" />
      <MetricCard label="NOI (monthly)" value="$4,200" valueTone="success" style={styles.cardGap} />
      <MetricCard label="Cap rate" value="7.2%" style={styles.cardGap} />
      <View style={styles.badgeRow}>
        <ScoreBadge score={8.7} />
        <ScoreBadge score={6.2} size="sm" />
      </View>
      <PropertySummaryCard
        style={styles.cardGap}
        address="245 Maple Street"
        score={8.7}
        rentLabel="$2,400/mo"
        valueLabel="$350,000"
        tags={
          <>
            <View style={styles.tag}>
              <Text style={styles.tagText}>Strong score</Text>
            </View>
            <View style={styles.tag}>
              <Text style={styles.tagText}>7.2% cap</Text>
            </View>
          </>
        }
      />

      <SectionHeader title="Tabs" />
      <TabSwitcher
        style={styles.tabRow}
        items={[
          { key: 'fin', label: 'Financials' },
          { key: 'mkt', label: 'Market Data' },
          { key: 'ren', label: 'Renovation' },
        ]}
        selectedKey={segTab}
        onSelect={setSegTab}
      />
      <TabPillRow style={[styles.tabRow, styles.spacingTop]}>
        <TabPill label="Financials" selected={tab === 0} onPress={() => setTab(0)} />
        <TabPill label="Market" selected={tab === 1} onPress={() => setTab(1)} />
        <TabPill label="Renovation" selected={tab === 2} onPress={() => setTab(2)} />
      </TabPillRow>

      <SectionHeader title="Primitives: TopBar, SectionCard, rows" />
      <TopBar
        title="Modal title"
        left={<AppBackButton onPress={() => {}} accessibilityLabel="Demo back" />}
        right={<HeaderActionSpacer />}
      />
      <SectionCard title="SectionCard" style={styles.cardGap} elevation="xs">
        <MetricRow
          label="Full address"
          value="245 Maple St"
          leftIcon={<Ionicons name="location-outline" size={20} color={semantic.navy} />}
          showSeparator
        />
        <MetricRow
          label="Cash flow"
          value="$1,100/mo"
          valueTone="success"
          showSeparator={false}
        />
      </SectionCard>
      <SectionCard style={styles.cardGap} padding="sm" elevation="none">
        <ListRow
          title="Personal information"
          leftIcon={<Ionicons name="person-outline" size={22} color={semantic.textSecondary} />}
          onPress={() => {}}
          showSeparator
        />
        <ListRow
          title="Currency"
          value="USD ($)"
          onPress={() => {}}
          showSeparator={false}
        />
      </SectionCard>
      <EmptyState
        title="No properties yet"
        message="Import a listing to see scores and cash flow."
        actionLabel="Import"
        onAction={() => {}}
        style={styles.cardGap}
      />
      <LoadingState message="Loading portfolio…" />

      <SectionHeader title="Settings rows" />
      <Card elevation="none" style={styles.flushCard}>
        <SettingsRow label="Personal Information" isFirst onPress={() => {}} />
        <SettingsRow label="Security" onPress={() => {}} />
        <SettingsRow label="Notifications" onPress={() => {}} />
      </Card>

      <SectionHeader title="Bottom sheet shell" />
      <BottomSheetContainer>
        <Text style={typography.bodySecondary}>
          Use as the top-level child of a modal screen or with a future bottom-sheet library.
        </Text>
      </BottomSheetContainer>

      <SectionHeader title="Floating action" />
      <View style={styles.fabDemo}>
        <FloatingActionButton accessibilityLabel="Add property" onPress={() => {}} />
      </View>

      <View style={{ height: spacing.xxxl }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingTop: spacing.md,
  },
  hero: {
    ...typography.screenTitleSmall,
    marginBottom: spacing.xs,
  },
  heroSub: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  spacingTop: {
    marginTop: spacing.xs,
  },
  swatchRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  swatch: {
    flex: 1,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxs,
  },
  swatchLabel: {
    ...typography.captionSmall,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  inlineRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  textPrimarySample: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  textSecondarySample: {
    ...typography.body,
    color: colors.textSecondary,
  },
  textMutedSample: {
    ...typography.caption,
  },
  success: {
    ...typography.bodyMedium,
    color: colors.success,
  },
  warning: {
    ...typography.bodyMedium,
    color: colors.warning,
  },
  danger: {
    ...typography.bodyMedium,
    color: colors.danger,
  },
  spacingDemo: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  spacer: {
    backgroundColor: colors.accentScoreMuted,
    borderRadius: 2,
  },
  radiusRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  radiusBox: {
    width: 48,
    height: 48,
    backgroundColor: colors.surfaceCard,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  elevationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  elevCard: {
    width: 72,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceCard,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  elevLabel: {
    ...typography.captionSmall,
  },
  btnCol: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  fieldGap: {
    height: spacing.md,
  },
  searchIcon: {
    fontSize: 18,
    color: colors.textMuted,
  },
  cardGap: {
    marginBottom: spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceMuted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  tagText: {
    ...typography.captionSmall,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  tabRow: {
    marginBottom: spacing.lg,
  },
  flushCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  fabDemo: {
    alignItems: 'flex-end',
    marginBottom: layout.listContentBottom,
  },
});
