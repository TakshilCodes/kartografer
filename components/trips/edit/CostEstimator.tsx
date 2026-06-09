import { IndianRupee } from "lucide-react";

type CostBreakdown = {
  transportCost: string;
  stayCost: string;
  foodCost: string;
  activityCost: string;
  miscCost: string;
  totalEstimatedCost: string;
  userBudget: string | null;
  budgetStatus: string;
};

type CostEstimatorProps = {
  costBreakdown: CostBreakdown | null;
  userBudget: string | null;
  daysCount: number;
  peopleCount: number;
};

function getNumberValue(value: string | null | undefined) {
  if (!value) return 0;

  const numberValue = Number(value);

  return Number.isNaN(numberValue) ? 0 : numberValue;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatOptionalCurrency(amount: number) {
  if (amount <= 0) return "Not set";

  return formatCurrency(amount);
}

function getBudgetStatusLabel(status: string) {
  switch (status) {
    case "BUDGET_FRIENDLY":
      return "Budget friendly";
    case "UNDER_BUDGET":
      return "Under budget";
    case "SLIGHTLY_OVER":
      return "Slightly over";
    case "OVER_BUDGET":
      return "Over budget";
    default:
      return "Budget unknown";
  }
}

function getBudgetStatusClass(status: string) {
  switch (status) {
    case "BUDGET_FRIENDLY":
    case "UNDER_BUDGET":
      return "bg-success text-success-foreground";
    case "SLIGHTLY_OVER":
      return "bg-warning text-warning-foreground";
    case "OVER_BUDGET":
      return "bg-danger text-danger-foreground";
    default:
      return "border border-border bg-card text-secondary-foreground";
  }
}

export default function CostEstimator({
  costBreakdown,
  userBudget,
  daysCount,
  peopleCount,
}: CostEstimatorProps) {
  const transportCost = getNumberValue(costBreakdown?.transportCost);
  const stayCost = getNumberValue(costBreakdown?.stayCost);
  const foodCost = getNumberValue(costBreakdown?.foodCost);
  const activityCost = getNumberValue(costBreakdown?.activityCost);
  const miscCost = getNumberValue(costBreakdown?.miscCost);
  const totalEstimatedCost = getNumberValue(
    costBreakdown?.totalEstimatedCost
  );
  const budgetAmount = getNumberValue(costBreakdown?.userBudget ?? userBudget);
  const budgetStatus = costBreakdown?.budgetStatus ?? "UNKNOWN";
  const usedPercent =
    budgetAmount > 0
      ? Math.min(100, Math.round((totalEstimatedCost / budgetAmount) * 100))
      : 0;
  const remainingAmount = budgetAmount - totalEstimatedCost;

  const costItems = [
    {
      label: "Stay",
      value: formatCurrency(stayCost),
    },
    {
      label: "Transport",
      value: formatCurrency(transportCost),
    },
    {
      label: "Meals",
      value: formatCurrency(foodCost),
    },
    {
      label: "Activities",
      value: formatCurrency(activityCost),
    },
  ];

  if (miscCost > 0) {
    costItems.push({
      label: "Misc",
      value: formatCurrency(miscCost),
    });
  }

  return (
    <section className="min-w-0 overflow-hidden rounded-[26px] border border-border bg-card shadow-sm">
      <div className="border-b border-border bg-card-secondary/50 px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-primary" />
                <p className="text-xs font-black uppercase tracking-[0.18em] text-secondary-foreground">
                  Cost estimator
                </p>
              </div>

              <h2 className="text-xl font-black text-foreground">
                Estimated trip cost: {formatCurrency(totalEstimatedCost)}
              </h2>

              <p className="mt-1 text-xs font-semibold text-secondary-foreground">
                Budget: {formatOptionalCurrency(budgetAmount)} - {peopleCount}{" "}
                {peopleCount === 1 ? "person" : "people"} - {daysCount}{" "}
                {daysCount === 1 ? "day" : "days"}
              </p>
            </div>

            <span
              className={`w-fit rounded-full px-3 py-1.5 text-xs font-black ${getBudgetStatusClass(
                budgetStatus
              )}`}
            >
              {getBudgetStatusLabel(budgetStatus)}
            </span>
          </div>

          {budgetAmount > 0 ? (
            <div>
              <div className="h-2 overflow-hidden rounded-full bg-card">
                <div
                  className={`h-full rounded-full ${
                    budgetStatus === "OVER_BUDGET"
                      ? "bg-danger"
                      : budgetStatus === "SLIGHTLY_OVER"
                        ? "bg-warning"
                        : "bg-success"
                  }`}
                  style={{
                    width: `${usedPercent}%`,
                  }}
                />
              </div>

              <p className="mt-2 text-xs font-bold text-secondary-foreground">
                {remainingAmount >= 0
                  ? `${formatCurrency(remainingAmount)} remaining`
                  : `${formatCurrency(Math.abs(remainingAmount))} over budget`}
              </p>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {costItems.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-border bg-card px-3 py-2.5"
              >
                <p className="text-[11px] font-bold text-secondary-foreground">
                  {item.label}
                </p>
                <p className="mt-0.5 text-sm font-black text-foreground">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
