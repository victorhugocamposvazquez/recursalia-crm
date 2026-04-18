'use client';

import { createContext, useContext } from 'react';
import type { FrontSitePayload } from '@/types';

const MarketingContentContext = createContext<FrontSitePayload | null>(null);

export function MarketingContentProvider({
  value,
  children,
}: {
  value: FrontSitePayload;
  children: React.ReactNode;
}) {
  return (
    <MarketingContentContext.Provider value={value}>{children}</MarketingContentContext.Provider>
  );
}

export function useMarketingContent(): FrontSitePayload {
  const ctx = useContext(MarketingContentContext);
  if (!ctx) {
    throw new Error('useMarketingContent debe usarse dentro de MarketingContentProvider');
  }
  return ctx;
}

/** Para piezas opcionales que puedan montarse fuera del provider en tests. */
export function useMarketingContentOptional(): FrontSitePayload | null {
  return useContext(MarketingContentContext);
}
