export const runtime = "nodejs";

const schema = {
  version: "MG-AIOS v2",
  principle: "Property first. AI first, human confirms.",
  priorityFormula: "dealValue * probability * urgency * overdueDays",
  models: {
    Property: [
      "ownerContactIds",
      "buyerContactIds",
      "tenantContactIds",
      "repairIds",
      "journeyIds",
      "fileIds",
      "financialIds",
      "aiAnalysis",
    ],
    Contact: ["roles", "phone", "line", "email", "job", "birthday", "tags", "aiSummary"],
    Journey: [
      "type",
      "stage",
      "nextAction",
      "probability",
      "aiSuggestion",
      "reminderDate",
      "completedRecords",
      "history",
    ],
    Repair: [
      "propertyId",
      "issue",
      "photoUrls",
      "videoUrls",
      "status",
      "quote",
      "scheduledDate",
      "completedDate",
      "warranty",
      "vendor",
      "cost",
      "aiReminder",
    ],
    AiCenter: [
      "summarize",
      "rankTopFive",
      "generateLineMessage",
      "generateFollowUpSuggestion",
      "predictDealProbability",
      "detectRisk",
    ],
  },
};

export async function GET() {
  return new Response(JSON.stringify(schema, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
