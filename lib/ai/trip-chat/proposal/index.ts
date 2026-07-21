import type { TripChatContext } from "../context";
import { parseTripChatProposalResponse } from "../semantic";
import { compileSemanticTripProposal } from "./compiler";
import { validateAiTripResponse } from "./validation";
import type { ValidatedRecommendation } from "./types";

export * from "./types";
export { compileSemanticTripProposal } from "./compiler";
export type { CompiledSemanticTripProposal } from "./compiler";
export { buildProposalCostPreview, validateAiTripResponse } from "./validation";
export {
  buildTruthfulAssistantMessage,
  createStoredTripChatPayload,
  parseStoredTripChatPayload,
} from "./storage";

export function processSemanticTripProposalAttempt({
  text,
  context,
  previousRecommendations = [],
}: {
  text: string;
  context: TripChatContext;
  previousRecommendations?: ValidatedRecommendation[];
}) {
  const parsedProposal = parseTripChatProposalResponse(text);
  const compiled = compileSemanticTripProposal({
    proposal: parsedProposal.proposal,
    context,
  });
  const preservePreviousRecommendations =
    parsedProposal.proposal.plan.extendTrip !== null ||
    parsedProposal.proposal.plan.edits.length > 0;
  const validation = validateAiTripResponse({
    rawRecommendations: compiled.rawRecommendations,
    rawChanges: compiled.rawChanges,
    context,
    proposalExpected: false,
    previousRecommendations: preservePreviousRecommendations
      ? previousRecommendations
      : [],
    compilerRejectionReasons: [
      ...parsedProposal.rejectedEditReasons,
      ...compiled.rejectedEdits,
    ],
  });

  return { parsedProposal, compiled, validation };
}