
import { GoogleGenAI, Type } from "@google/genai";
import { ConstructionTask } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeSchedule = async (tasks: ConstructionTask[]) => {
  const prompt = `
    你是一位資深的工地主任與排程專家。請分析以下施工項目的數據，特別注意項目間的相依性 (dependencies)：
    ${JSON.stringify(tasks)}
    
    請針對目前的進度與關聯性提供：
    1. 關鍵路徑分析：哪些項目的延誤會引發連鎖反應，導致整體工期延誤？
    2. 相依性檢查：是否有後續項目在欠缺前置項目的情況下就強行開工？
    3. 優化建議：如何重新安排工序以緩解瓶頸？
    
    請用繁體中文回答，並以條列式呈現，語氣專業且務實。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "無法生成 AI 建議，請檢查網路連線。";
  }
};
