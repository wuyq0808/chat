const { chromium } = require('playwright');
const { GoogleGenAI } = require('@google/genai');

// Initialize Gemini AI with API key from environment variable
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('Error: GEMINI_API_KEY environment variable is not set');
  console.error('Please set your Gemini API key: GEMINI_API_KEY=your-api-key-here node evaluate.js');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: apiKey });

function extractJsonFromResponse(response) {
  try {
    // First try to parse as direct JSON
    return JSON.parse(response);
  } catch {
    // If that fails, look for JSON within markdown code blocks
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1].trim());
      } catch (parseError) {
        console.warn('Could not parse JSON from code block:', parseError.message);
      }
    }
    
    // If no code blocks, try to find JSON-like content between { and }
    const jsonLikeMatch = response.match(/\{[\s\S]*\}/);
    if (jsonLikeMatch) {
      try {
        return JSON.parse(jsonLikeMatch[0]);
      } catch (parseError) {
        console.warn('Could not parse JSON-like content:', parseError.message);
      }
    }
    
    throw new Error('No valid JSON found in response');
  }
}

async function sendToGemini(content) {
  try {
    console.log('Sending content to Gemini...');
    
    // Generate content using the new API format with grounding
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [content],
      config: {
        tools: [{googleSearch: {}}],
      },
    });
    
    return response.text;
  } catch (error) {
    console.error('Error sending to Gemini:', error);
    throw error;
  }
}

async function launchBrowser(message) {
    console.log(`\n=== Testing message: "${message}" ===`);
    console.log('Launching browser...');
    const browser = await chromium.launch({ headless: false });
    
    try {
        const context = await browser.newContext();
        const page = await context.newPage();
        
        await page.goto('http://localhost:5000/hotels/search?entity_id=27544008&checkin=2024-11-05&checkout=2024-11-06&adults=2&rooms=1');
        
        console.log('Browser opened and navigated to the URL successfully!');
        
        // Wait for the page to load
        console.log('Waiting for page to load...');
        await page.waitForLoadState('domcontentloaded');
        console.log('Page loaded!');
        
        // Look for chat interface and interact with it
        console.log('Looking for chat interface...');
        
        // Wait for the chat input to be available
        const chatInput = await page.waitForSelector('input.IMChatView__input[placeholder="Type your message..."]', { timeout: 10000 });
        console.log('Found chat input!');
        
        // Type a message
        await chatInput.fill(message);
        console.log(`Typed message: "${message}"`);
        
        // Press Enter to send the message
        await chatInput.press('Enter');
        console.log('Message sent!');
        
        // Wait a moment to see the response
        await page.waitForTimeout(3000);
        
        // Wait for and capture the reply
        console.log('Waiting for chat reply...');
        
        // Wait specifically for the hotel recommendations div
        console.log('Looking for IMChatView__hotelRecommendations...');
        const replySelector = '.IMChatView__hotelRecommendations';
        
        // Wait for the specific hotel recommendations div to appear
        await page.waitForSelector(replySelector, { timeout: 15000 });
        const replyElement = await page.$(replySelector);
        
        if (replyElement) {
          const htmlContent = await replyElement.innerHTML();
          
          console.log('Sending hotel recommendations to Gemini...');
          const contentForGemini = `Hotel Recommendations from Chat:

${htmlContent}

Please evaluate these hotel recommendations as a whole based on the original user request: "${message}"

Analyze how well the overall set of recommendations matches the user's requirements and provide your response in the following JSON format:

{
  "summary": "A detailed explanation of how well the recommended hotels as a group align with the user's needs, including strengths and weaknesses of the recommendations and your reasoning for the overall evaluation",
  "score": [single number from 1-10 where 10 means the set of recommendations perfectly matches the user's request and 1 means the recommendations are completely irrelevant]
}

`;
          
          const geminiResponse = await sendToGemini(contentForGemini);
          
          try {
            // Extract JSON from Gemini response (handles markdown code blocks)
            const parsed = extractJsonFromResponse(geminiResponse);
            
            return {
              message: message,
              summary: parsed.summary || geminiResponse,
              score: parsed.score || 0
            };
          } catch (error) {
            console.warn('Could not parse JSON response, using raw response:', error.message);
            return {
              message: message,
              summary: geminiResponse,
              score: 0
            };
          }
        } else {
          throw new Error('Hotel recommendations element found but could not access it');
        }
    } finally {
        await browser.close();
    }
}

async function evaluate() {
    const testMessages = [
        "I need to stay near the sea in Shenzhen",
        "Looking for luxury hotels with swimming pool in Shenzhen",
        "Budget accommodation near business district in Shenzhen",
        "Family-friendly hotel with kids activities in Shenzhen",
        "Stay near the train station in Shenzhen"
    ];
    
    const results = [];
    let totalScore = 0;
    
    console.log('Starting evaluation with multiple test messages...\n');
    
    for (const message of testMessages) {
        try {
            const result = await launchBrowser(message);
            results.push(result);
            totalScore += result.score;
        } catch (error) {
            console.error(`Error testing message "${message}":`, error);
            results.push({
                message: message,
                summary: `Error: ${error.message}`,
                score: 0
            });
        }
    }
    
    const averageScore = totalScore / testMessages.length;
    
    console.log('\n=== FINAL EVALUATION RESULTS ===');
    console.log('\nIndividual results:');
    
    results.forEach((result, index) => {
        console.log(`${index + 1}. "${result.message}" - Score: ${result.score}/10`);
        console.log(`   Summary: ${result.summary}`);
    });
    
    console.log(`Total messages tested: ${testMessages.length}`);
    console.log(`Average score: ${averageScore.toFixed(2)}/10`);
}

evaluate();