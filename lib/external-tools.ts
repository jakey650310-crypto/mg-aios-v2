export type ExternalToolKey =
  | "ieasy"
  | "aiEcosystem"
  | "chatgpt"
  | "googleCalendar"
  | "line"
  | "591"
  | "facebook";

export type ExternalToolConfig = {
  label: string;
  description: string;
  url: string;
  deepLink?: string;
};

const publicEnv = process.env;

export const externalTools: Record<ExternalToolKey, ExternalToolConfig> = {
  ieasy: {
    label: "住商 ieasy+",
    description: "開啟住商 ieasy+，處理物件、客戶與公司作業。",
    url: publicEnv.NEXT_PUBLIC_IEASY_URL || "https://apps.apple.com/tw/app/%E4%BD%8F%E5%95%86ieasy/id1441509709",
    deepLink: publicEnv.NEXT_PUBLIC_IEASY_DEEP_LINK || undefined,
  },
  aiEcosystem: {
    label: "AI 生態圈",
    description: "開啟 AI 生態圈，查看工作任務、物件與客戶需求。",
    url: publicEnv.NEXT_PUBLIC_AI_ECOSYSTEM_URL || "https://apps.apple.com/tw/app/ai%E7%94%9F%E6%85%8B%E5%9C%88/id6749877054",
    deepLink: publicEnv.NEXT_PUBLIC_AI_ECOSYSTEM_DEEP_LINK || undefined,
  },
  chatgpt: { label: "ChatGPT", description: "開啟 ChatGPT，進行分析、策略與文案工作。", url: "https://chatgpt.com/" },
  googleCalendar: { label: "Google Calendar", description: "開啟 Google 行事曆，查看與安排案件行程。", url: "https://calendar.google.com/calendar/u/0/r" },
  line: { label: "LINE", description: "開啟 LINE，聯絡客戶與合作夥伴。", url: "https://line.me/" },
  "591": { label: "591", description: "開啟 591，處理物件刊登。", url: "https://www.591.com.tw/" },
  facebook: { label: "Facebook", description: "開啟 Facebook，處理社群內容。", url: "https://www.facebook.com/" },
};

export function openExternalTool(key: ExternalToolKey): boolean {
  const tool = externalTools[key];
  if (typeof window === "undefined" || !tool.url) return false;

  if (tool.deepLink) {
    const deepLinkWindow = window.open(tool.deepLink, "_blank", "noopener,noreferrer");
    window.setTimeout(() => {
      if (deepLinkWindow && !deepLinkWindow.closed) deepLinkWindow.location.href = tool.url;
    }, 1200);
    return Boolean(deepLinkWindow);
  }

  return Boolean(window.open(tool.url, "_blank", "noopener,noreferrer"));
}
