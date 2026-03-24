/**
 * Explanation copy for deal scoring. Matches PropFolio DealScoreExplanations.
 */

import type { DealScoreBand, DealScoreFactor, DealScoreComponent } from './types';

export function scoreVsConfidenceOneLiner(): string {
  return 'Deal score: how the numbers look. Confidence: how much we trust the data.';
}

export function insufficientDataReason(): string {
  return 'We need at least cap rate or cash flow, DSCR, and data confidence to score this deal. Add or confirm those inputs to see a score.';
}

/** More specific copy when we already know which gates failed (mapping / missing inputs). */
export function insufficientDataReasonFromMissing(missing: string[]): string {
  if (missing.length === 0) return insufficientDataReason();
  const parts = missing.join(', ');
  return `We can’t show a deal score yet—missing: ${parts}. Listing price or estimated rent unlocks profitability and DSCR; confidence improves as more fields are confirmed.`;
}

export function bandSentence(band: DealScoreBand): string {
  switch (band) {
    case 'exceptional': return 'Exceptional deal';
    case 'strong': return 'Strong deal';
    case 'good': return 'Good deal';
    case 'fair': return 'Fair deal';
    case 'weak': return 'Weak deal';
    case 'poor': return 'Poor deal';
    case 'insufficientData': return 'Insufficient data to score';
    default: return 'Insufficient data to score';
  }
}

export function factorName(factor: DealScoreFactor): string {
  const names: Record<DealScoreFactor, string> = {
    capRate: 'Cap rate',
    monthlyCashFlow: 'Monthly cash flow',
    annualCashFlow: 'Annual cash flow',
    cashOnCashReturn: 'Cash on cash return',
    dscr: 'DSCR',
    expenseRatio: 'Expense ratio',
    vacancySensitivity: 'Vacancy sensitivity',
    renovationBurden: 'Renovation burden',
    purchaseDiscount: 'Purchase discount',
    rentCoverageStrength: 'Rent coverage',
    dataConfidence: 'Data confidence',
    marketTailwinds: 'Market tailwinds',
    downsideResilience: 'Downside resilience',
  };
  return names[factor] ?? factor;
}

export function summary(
  components: DealScoreComponent[],
  totalScore: number,
  band: DealScoreBand,
  wasCappedByConfidence: boolean
): string {
  if (wasCappedByConfidence) {
    return 'Your score is capped at 60 because data confidence is low. Improve data quality to unlock a higher score.';
  }
  const top = [...components]
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 2);
  const names = top.map((c) => factorName(c.id)).join(' and ');
  return `${bandSentence(band)} (${Math.round(totalScore)}/100). Strongest drivers: ${names}.`;
}
