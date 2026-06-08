import { IndianRupee } from "lucide-react";

type CostEstimatorProps = {
  totalBudget: string;
};

const costItems = [
  {
    label: "Stay",
    value: "₹16,500",
  },
  {
    label: "Transport",
    value: "₹12,200",
  },
  {
    label: "Meals",
    value: "₹4,600",
  },
  {
    label: "Activities",
    value: "₹3,200",
  },
];

export default function CostEstimator({ totalBudget }: CostEstimatorProps) {
  return (
    <section className="min-w-0 overflow-hidden rounded-[26px] border border-border bg-card shadow-sm">
      <div className="border-b border-border bg-card-secondary/50 px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-primary" />
              <p className="text-xs font-black uppercase tracking-[0.18em] text-secondary-foreground">
                Cost estimator
              </p>
            </div>

            <h2 className="text-xl font-black text-foreground">
              Estimated trip cost: {totalBudget}
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:w-130">
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