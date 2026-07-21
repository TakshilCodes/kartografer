import type {
  TripAiChange,
  TripAiRecommendation,
} from "@/lib/ai/schemas/trip-ai-change.schema";

export type ProposalResponseMode = "ANSWER" | "PROPOSAL" | "PROPOSAL_FAILED";

export type ValidatedRecommendation = TripAiRecommendation & {
  resolvedTitle: string;
  storedCost: number | null;
  costVerified: boolean;
};

export type ProposalChangeCostPreview = {
  changeIndex: number;
  type: TripAiChange["type"];
  label: string;
  beforeCost: number | null;
  afterCost: number | null;
  delta: number | null;
  costVerified: boolean;
  // A user-approved AI estimate that will update an existing stored price on Apply.
  isAiPriceEstimate?: boolean;
  aiEstimatedCost?: number | null;
};

export type ProposalCostPreview = {
  currency: string;
  currentTripTotal: number;
  changes: ProposalChangeCostPreview[];
  verifiedTotalDelta: number;
  resultingEstimatedTotal: number;
  resultingRemainingBudget: number | null;
  resultingExceededBy: number | null;
  unknownCostChangeCount: number;
  aiEstimatedChangeCount?: number;
  aiEstimatedTotal?: number;
};

export type ProposalResultMetadata = {
  responseMode: ProposalResponseMode;
  proposalCreated: boolean;
  validChangeCount: number;
  rejectedChangeCount: number;
  rejectionReasons: string[];
  warnings: string[];
};

export type StoredTripChatPayloadV2 = {
  version: 2;
  recommendations: ValidatedRecommendation[];
  changes: TripAiChange[];
  result: ProposalResultMetadata;
  costPreview: ProposalCostPreview | null;
};

export type ProposalValidationResult = {
  recommendations: ValidatedRecommendation[];
  changes: TripAiChange[];
  result: ProposalResultMetadata;
  costPreview: ProposalCostPreview;
};
