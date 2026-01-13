import { Prisma } from "@prisma/client";

export type BaseCurrency = "USD" | "BIRR";

export type CurrencySettings = {
  baseCurrency: BaseCurrency;
  usdToBirrRate: Prisma.Decimal;
};

const normalizeCurrency = (value?: string | null): BaseCurrency | null => {
  const normalized = value?.toUpperCase();
  if (normalized === "USD" || normalized === "BIRR") {
    return normalized;
  }
  return null;
};

export const convertToBaseCurrency = (
  amount: Prisma.Decimal,
  currency: string | null | undefined,
  settings: CurrencySettings
): Prisma.Decimal => {
  const from = normalizeCurrency(currency) ?? settings.baseCurrency;
  const rate = settings.usdToBirrRate;

  if (from === settings.baseCurrency) {
    return amount;
  }

  if (from === "USD" && settings.baseCurrency === "BIRR") {
    return amount.mul(rate);
  }

  if (from === "BIRR" && settings.baseCurrency === "USD") {
    return amount.div(rate);
  }

  return amount;
};

export const convertFromBaseCurrency = (
  amount: Prisma.Decimal,
  targetCurrency: BaseCurrency,
  settings: CurrencySettings
): Prisma.Decimal => {
  const base = settings.baseCurrency;
  const rate = settings.usdToBirrRate;

  if (base === targetCurrency) {
    return amount;
  }

  if (base === "USD" && targetCurrency === "BIRR") {
    return amount.mul(rate);
  }

  if (base === "BIRR" && targetCurrency === "USD") {
    return amount.div(rate);
  }

  return amount;
};
