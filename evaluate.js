const { chromium } = require('playwright');
const { GoogleGenAI } = require('@google/genai');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

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
        
        await page.goto('http://localhost:4200');
        
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
        
        // Record start time for waiting for recommendations
        const waitStartTime = Date.now();
        
        // Wait for the specific hotel recommendations div to appear
        await page.waitForSelector(replySelector, { timeout: 15000 });
        const replyElement = await page.$(replySelector);
        
        // Record end time and calculate wait duration
        const waitEndTime = Date.now();
        const waitTimeMs = waitEndTime - waitStartTime;
        const waitTimeSeconds = (waitTimeMs / 1000).toFixed(2);
        
        console.log(`Hotel recommendations loaded in ${waitTimeSeconds} seconds`);
        
        let htmlContent = null;
        if (replyElement) {
          htmlContent = await replyElement.innerHTML();
        }
        
        await browser.close();
        
        if (htmlContent) {
          console.log('Sending hotel recommendations to Gemini...');
          const contentForGemini = `Hotel Recommendations from Chat:

${htmlContent}

Please evaluate these hotel recommendations as a whole based on the original user request: "${message}"

IMPORTANT INSTRUCTIONS:
- ONLY extract the hotel names from the provided recommendations
- IGNORE any ratings, prices, descriptions, or other information that may be present in the recommendations
- Use ONLY your internet search capabilities to find all information about these hotels (location, amenities, prices, ratings, etc.)
- Do NOT use any information from the recommendations except for the hotel names
- Base your entire analysis on what you find through internet search about these specific hotels

Note: The recommendations only provide hotel names without detailed information. Please use your internet search capabilities to look up these hotels and verify their actual details, amenities, and locations. Do NOT recommend adding more detailed information to the recommendations - instead, search for and use the information you find online to evaluate how well these specific hotels match the user's requirements.

Analyze how well the overall set of recommendations matches the user's requirements and provide your response in the following JSON format:

{
  "summary": "A detailed explanation of how well the recommended hotels as a group align with the user's needs, including strengths and weaknesses of the recommendations and your reasoning for the overall evaluation. Base your analysis on the actual hotel information you find through internet search.",
  "individual_hotels": [
    {
      "hotel_name": "Name of the hotel",
      "analysis": "Detailed analysis of how well this specific hotel matches the user's requirements based on internet search results",
      "score": "Individual score from 1-10 for this hotel"
    }
  ],
  "overall_score": "Single number from 1-10 where 10 means the set of recommendations perfectly matches the user's request and 1 means the recommendations are completely irrelevant"
}

`;
          
          const geminiResponse = await sendToGemini(contentForGemini);
          
          try {
            // Extract JSON from Gemini response (handles markdown code blocks)
            const parsed = extractJsonFromResponse(geminiResponse);
            
            return {
              message: message,
              summary: parsed.summary || geminiResponse,
              score: parsed.overall_score || parsed.score || 0,
              individual_hotels: parsed.individual_hotels || [],
              waitTimeSeconds: parseFloat(waitTimeSeconds)
            };
          } catch (error) {
            console.warn('Could not parse JSON response, using raw response:', error.message);
            return {
              message: message,
              summary: geminiResponse,
              score: 0,
              individual_hotels: [],
              waitTimeSeconds: parseFloat(waitTimeSeconds)
            };
          }
        } else {
          throw new Error('Hotel recommendations element found but could not access its content');
        }
    } catch (error) {
        console.error(`Error testing message "${message}":`, error);
        return {
            message: message,
            summary: `Error: ${error.message}`,
            score: 0,
            individual_hotels: [],
            waitTimeSeconds: 0
        };
    } finally {
        // Always close browser, even if an error occurred
        try {
            await browser.close();
        } catch (closeError) {
            console.warn('Browser may have already been closed:', closeError.message);
        }
    }
}

async function generatePDFReport(results, averageScore, averageWaitTime) {
    console.log('\nGenerating PDF report...');
    
    // Create a new PDF document
    const doc = new PDFDocument({ margin: 50 });
    const reportPath = path.join(__dirname, 'evaluation-report.pdf');
    
    // Pipe the PDF to a file
    doc.pipe(fs.createWriteStream(reportPath));
    
    // Add title
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .text('Hotel Chat Evaluation Report', { align: 'center' });
    
    // Add generation timestamp
    doc.fontSize(12)
       .font('Helvetica')
       .text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' })
       .moveDown(2);
    
    // Add summary section
    doc.fontSize(18)
       .font('Helvetica-Bold')
       .text('Summary')
       .moveDown(0.5);
    
    doc.fontSize(12)
       .font('Helvetica')
       .text(`Total Test Messages: ${results.length}`)
       .text(`Average Score: ${averageScore.toFixed(2)}/10`)
       .text(`Average Response Time: ${averageWaitTime} seconds`)
       .moveDown(1);
    
    // Add individual test results
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text('Test Results')
       .moveDown(0.5);
    
    results.forEach((result, index) => {
        // Check if we need a new page
        if (doc.y > 700) {
            doc.addPage();
        }
        
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text(`Test ${index + 1}: "${result.message}"`)
           .moveDown(0.3);
        
        doc.fontSize(12)
           .font('Helvetica')
           .text(`Score: ${result.score}/10`)
           .text(`Response Time: ${result.waitTimeSeconds} seconds`)
           .moveDown(0.3);
        
        doc.font('Helvetica-Bold')
           .text('Summary:')
           .font('Helvetica')
           .text(result.summary, { 
               width: 500,
               lineGap: 2
           })
           .moveDown(1);
        
        // Add individual hotel analysis if available
        if (result.individual_hotels && result.individual_hotels.length > 0) {
            doc.font('Helvetica-Bold')
               .text('Individual Hotel Analysis:')
               .moveDown(0.3);
            
            result.individual_hotels.forEach((hotel, hotelIndex) => {
                // Check if we need a new page
                if (doc.y > 680) {
                    doc.addPage();
                }
                
                doc.fontSize(11)
                   .font('Helvetica-Bold')
                   .text(`${hotelIndex + 1}. ${hotel.hotel_name} - Score: ${hotel.score}/10`)
                   .font('Helvetica')
                   .text(hotel.analysis, { 
                       width: 500,
                       lineGap: 1,
                       indent: 20
                   })
                   .moveDown(0.5);
            });
            
            doc.moveDown(0.5);
        }
    });
    
    // Finalize the PDF
    doc.end();
    
    console.log(`PDF report generated: ${reportPath}`);
    return reportPath;
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
    let totalWaitTime = 0;
    
    console.log('Starting evaluation with multiple test messages...\n');
    
    for (const message of testMessages) {
        try {
            const result = await launchBrowser(message);
            results.push(result);
            totalScore += result.score;
            totalWaitTime += result.waitTimeSeconds;
        } catch (error) {
            console.error(`Error testing message "${message}":`, error);
            results.push({
                message: message,
                summary: `Error: ${error.message}`,
                score: 0,
                individual_hotels: [],
                waitTimeSeconds: 0
            });
        }
    }
    
    const averageScore = totalScore / testMessages.length;
    const averageWaitTime = (totalWaitTime / testMessages.length).toFixed(2);
    
    // Generate PDF report
    try {
        await generatePDFReport(results, averageScore, averageWaitTime);
    } catch (error) {
        console.error('Error generating PDF report:', error);
    }
}

evaluate();