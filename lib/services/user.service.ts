import { unstable_cache } from "next/cache";

import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";

export type UserSettings = {
  id: string;
  name: string;
  email: string;
  baseCurrency: "USD" | "BIRR";
  usdToBirrRate: string;
};

export async function getUserSettings(
  userId: string
): Promise<UserSettings | null> {
  const cacheKey = ["settings", userId];

  const cached = unstable_cache(
    async () => {
      const user = await prisma.user.findFirst({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          baseCurrency: true,
          usdToBirrRate: true,
        },
      });

      if (!user) {
        return null;
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        baseCurrency: user.baseCurrency,
        usdToBirrRate: user.usdToBirrRate.toString(),
      };
    },
    cacheKey,
    { tags: ["settings", userId] }
  );

  return cached();
}

export type UserCurrencySettings = {
  baseCurrency: "USD" | "BIRR";
  usdToBirrRate: Prisma.Decimal;
};

export async function getUserCurrencySettings(
  userId: string
): Promise<UserCurrencySettings> {
  const cacheKey = ["settings", userId, "currency"];

  const cached = unstable_cache(
    async () => {
      const user = await prisma.user.findFirst({
        where: { id: userId },
        select: {
          baseCurrency: true,
          usdToBirrRate: true,
        },
      });

      return {
        baseCurrency: user?.baseCurrency ?? "USD",
        usdToBirrRate: user?.usdToBirrRate ?? new Prisma.Decimal(120),
      };
    },
    cacheKey,
    { tags: ["settings", userId] }
  );

  return cached();
}
