import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateStockArticle(symbol: string): Promise<string | null> {
  try {
    const prompt = `Generate a focused stock analysis article about ${symbol} with emphasis on recent developments and price movements.

    Focus on:
    1. **Recent News & Events** (Last 7 days): What are the most recent news stories, earnings reports, announcements, or market events affecting ${symbol}?
    
    2. **Price Trend Analysis**: 
       - Current stock price and recent performance (1 day, 1 week, 1 month)
       - What are the specific reasons driving the current price trend?
       - Are there particular catalysts causing price movements?
    
    3. **Market Context**: How is ${symbol} performing relative to its sector and the broader market?
    
    4. **Key Takeaways**: What should investors know about ${symbol} right now?
    
    Please search for the most current information available and focus on recent developments rather than general company information. Use a concise, news-focused format suitable for investors who want to understand current market dynamics.
    
    IMPORTANT: 
    - Return the content in proper Markdown format with appropriate headers, lists, and formatting
    - Start directly with the analysis content using Markdown headers (##, ###, etc.)
    - Do not include any introductory phrases like "Okay, I will generate..." or "Here's a stock analysis article about..."
    - Do not include a main title like "${symbol} Stock Analysis" or similar - begin immediately with the first section
    - Do not include reference numbers or citations like [1], [2], [7], [8] - write the content without source references
    - Begin immediately with the first section as a Markdown header (## Recent News & Events, etc.)`;

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

