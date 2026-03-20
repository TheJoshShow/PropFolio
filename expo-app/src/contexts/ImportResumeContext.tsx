/**
 * Single source of truth for "pending import to resume after paywall": one blocked import stored
 * when the server returns blocked_upgrade_required. Import screen runs it once after purchase
 * then clears. Prevents duplicate imports; no hidden retry loops.
 */

import React, { createContext, useCallback, useContext, useState } from 'react';
import type { PropertyImportData } from '../services/importLimits';

export interface PendingImport {
  importData: PropertyImportData;
  addressLine: string;
}

interface ImportResumeContextValue {
  /** Set when user hits blocked_upgrade_required and we open paywall; cleared after one resume execute or on dismiss. */
  pendingImport: PendingImport | null;
  setPendingImport: (value: PendingImport | null) => void;
}

const ImportResumeContext = createContext<ImportResumeContextValue | null>(null);

export function ImportResumeProvider({ children }: { children: React.ReactNode }) {
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);
  const stableSet = useCallback((value: PendingImport | null) => {
    setPendingImport(value);
  }, []);
  const value: ImportResumeContextValue = {
    pendingImport,
    setPendingImport: stableSet,
  };
  return (
    <ImportResumeContext.Provider value={value}>
      {children}
    </ImportResumeContext.Provider>
  );
}

export function useImportResume(): ImportResumeContextValue {
  const ctx = useContext(ImportResumeContext);
  if (!ctx) throw new Error('useImportResume must be used within ImportResumeProvider');
  return ctx;
}
