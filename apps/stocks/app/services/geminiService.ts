import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateStockArticle(symbol: string): Promise<string | null> {
  try {
    const prompt = `Generate a comprehensive investment article about ${symbol} stock. 
    Include the following sections:
    1. Company Overview
    2. Recent Performance and Market Trends
    3. Financial Health
    4. Growth Opportunities
    5. Risks and Challenges
    6. Analyst Opinions
    7. Investment Outlook
    
    Use current market data and provide specific insights. Write in a professional, informative tone suitable for investors.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [prompt],
      config: {
        tools: [{googleSearch: {}}],
      },
    });
    
    const content = response.text;
    return content || null;
  } catch (error) {
    console.error("Error generating stock article:", error);
    return null;
  }
}

export async function getStockInfo(symbol: string): Promise<any> {
  try {
    const prompt = `Provide current stock information for ${symbol} in JSON format including:
    - current price
    - day change (amount and percentage)
    - 52 week high/low
    - market cap
    - P/E ratio
    Return only valid JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [prompt],
      config: {
        tools: [{googleSearch: {}}],
      },
    });
    
    const content = response.text;
    
    try {
      return content ? JSON.parse(content) : null;
    } catch {
      return null;
    }
  } catch (error) {
    console.error("Error fetching stock info:", error);
    return null;
  }
}