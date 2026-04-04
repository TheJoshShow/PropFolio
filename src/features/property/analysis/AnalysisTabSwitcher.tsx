import type { StyleProp, ViewStyle } from 'react-native';

import { TabSwitcher, type TabSwitcherItem } from '@/components/ui';

export const ANALYSIS_TAB_KEYS = ['financials', 'market', 'renovation'] as const;
export type AnalysisTabKey = (typeof ANALYSIS_TAB_KEYS)[number];

const ITEMS: TabSwitcherItem[] = [
  { key: 'financials', label: 'Financials' },
  { key: 'market', label: 'Market Data' },
  { key: 'renovation', label: 'Renovation' },
];

type Props = {
  selectedKey: AnalysisTabKey;
  onSelect: (key: AnalysisTabKey) => void;
  style?: StyleProp<ViewStyle>;
};

export function AnalysisTabSwitcher({ selectedKey, onSelect, style }: Props) {
  return (
    <TabSwitcher
      items={ITEMS}
      selectedKey={selectedKey}
      onSelect={(key) => {
        if (ANALYSIS_TAB_KEYS.includes(key as AnalysisTabKey)) {
          onSelect(key as AnalysisTabKey);
        }
      }}
      style={style}
      testID="propfolio.analysis.tabs"
    />
  );
}
