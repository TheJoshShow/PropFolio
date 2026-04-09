import type { WelcomeFeatureVariant } from './WelcomeFeatureCard';

export type WelcomeFeatureItem = {
  variant: WelcomeFeatureVariant;
  title: string;
  description: string;
};

export const WELCOME_FEATURE_ITEMS: readonly WelcomeFeatureItem[] = [
  {
    variant: 'import',
    title: 'Import Properties in Seconds',
    description: 'Quickly add properties and get to analyzing faster.',
  },
  {
    variant: 'scores',
    title: 'Get Instant Deal Scores',
    description: 'Know which deals are worth your time.',
  },
  {
    variant: 'roi',
    title: 'Analyze Cash Flow & ROI',
    description: 'Make smarter investment decisions with confidence.',
  },
];
