import { colors } from '@/theme';
import type { PropertyStatus } from '@/types/property';

export type PortfolioScoreTier = 'excellent' | 'good' | 'needs_review';

/**
 * Map confidence (0–10 scale) + row status to a short UI label.
 * Tune thresholds in product policy without touching layout.
 */
export function portfolioScoreTier(
  confidence: number | null,
  status: PropertyStatus,
): PortfolioScoreTier {
  if (status === 'error') {
    return 'needs_review';
  }
  if (confidence == null || !Number.isFinite(confidence)) {
    return 'needs_review';
  }
  if (confidence >= 7.5) {
    return 'excellent';
  }
  if (confidence >= 6) {
    return 'good';
  }
  return 'needs_review';
}

export function portfolioScoreLabel(tier: PortfolioScoreTier): string {
  switch (tier) {
    case 'excellent':
      return 'Excellent';
    case 'good':
      return 'Good';
    default:
      return 'Needs review';
  }
}

export function portfolioScoreLabelColor(tier: PortfolioScoreTier): string {
  switch (tier) {
    case 'excellent':
      return colors.success;
    case 'good':
      return colors.textSecondary;
    default:
      return colors.warning;
  }
}

/** Card descriptor line, e.g. "Excellent score" vs "Needs review". */
export function portfolioScoreDescriptor(tier: PortfolioScoreTier, shortLabel: string): string {
  if (tier === 'needs_review') {
    return shortLabel;
  }
  return `${shortLabel} score`;
}
