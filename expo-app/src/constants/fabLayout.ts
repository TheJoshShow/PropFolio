/**
 * Shared layout for `ImportFab` (Home + Portfolio).
 * FAB sits just above the tab bar with a small gap; SafeAreaView(edges bottom) already
 * pads the scene above the home indicator, so we do not add full insets.bottom again.
 */
import { spacing } from '../theme';

export const IMPORT_FAB_SIZE = 56;

/** Vertical gap from the bottom of the tab screen content to the FAB’s bottom edge (lower = FAB sits lower). */
export const IMPORT_FAB_BOTTOM_GAP = spacing.s;

/**
 * Extra bottom padding for ScrollView/FlatList so the last item clears the FAB + breathing room.
 * ≈ FAB height + gap above tab + margin.
 */
export const IMPORT_FAB_SCROLL_INSET = IMPORT_FAB_SIZE + IMPORT_FAB_BOTTOM_GAP + spacing.m;
