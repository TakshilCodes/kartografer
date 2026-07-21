export type CostedTransport = {
  costType: string;
  pricePerPerson: unknown;
  totalCost: unknown;
};

export type CostedStay = {
  pricePerNight: unknown;
  nights: number | null;
  totalCost: unknown;
};

export function getMoneyNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return 0;

  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : 0;
}

export function getNullableMoneyNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;

  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? roundMoney(numberValue) : null;
}

export function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateTransportCost(
  transport: CostedTransport,
  peopleCount: number,
) {
  if (transport.costType === "PER_PERSON") {
    return roundMoney(getMoneyNumber(transport.pricePerPerson) * peopleCount);
  }

  return roundMoney(getMoneyNumber(transport.totalCost));
}

export function calculateStayCost(stay: CostedStay) {
  const explicitTotal = getMoneyNumber(stay.totalCost);

  if (explicitTotal > 0) {
    return roundMoney(explicitTotal);
  }

  const nights = stay.nights === null ? 1 : Math.max(stay.nights, 0);

  return roundMoney(getMoneyNumber(stay.pricePerNight) * nights);
}

export function calculateSelectedCostTotals({
  peopleCount,
  transports,
  stays,
  meals,
  activities,
}: {
  peopleCount: number;
  transports: CostedTransport[];
  stays: CostedStay[];
  meals: Array<{ estimatedCost: unknown }>;
  activities: Array<{ estimatedCost: unknown }>;
}) {
  const transport = roundMoney(
    transports.reduce(
      (total, item) => total + calculateTransportCost(item, peopleCount),
      0,
    ),
  );
  const staysTotal = roundMoney(
    stays.reduce((total, item) => total + calculateStayCost(item), 0),
  );

  // These fields are trip totals in the existing calculator. Preserve that
  // behavior rather than multiplying them by the traveller count here.
  const mealsTotal = roundMoney(
    meals.reduce(
      (total, item) => total + getMoneyNumber(item.estimatedCost),
      0,
    ),
  );
  const activitiesTotal = roundMoney(
    activities.reduce(
      (total, item) => total + getMoneyNumber(item.estimatedCost),
      0,
    ),
  );

  return {
    transport,
    stays: staysTotal,
    meals: mealsTotal,
    activities: activitiesTotal,
    total: roundMoney(transport + staysTotal + mealsTotal + activitiesTotal),
  };
}
