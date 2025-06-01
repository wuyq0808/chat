import { useState, useRef, useEffect } from 'react';

import { GoogleGenAI } from '@google/genai';

import './IMChatView.scss';

// Initialize Gemini AI with API key
const getGenAI = () => {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('VITE_GEMINI_API_KEY environment variable is not set');
      return null;
    }
    return new GoogleGenAI({
      apiKey: apiKey,
    });
  } catch (error) {
    console.error('Failed to initialize Google AI:', error);
    return null;
  }
};

const genAI = getGenAI();

// Add new type for hotel recommendations
type HotelRecommendation = {
  id: string;
  name: string;
  imageUrl: string;
  rating?: number;
  price?: string;
  location?: string;
};

// Add new type for comparison result
type HotelComparison = {
  hotels: HotelRecommendation[];
  comparisonData: {
    bestPrice: HotelRecommendation;
    bestRating: HotelRecommendation;
    summary: string;
    pros: string[];
    cons: string[];
  };
  timestamp: Date;
};

// Add new type for API response
type ChatApiResponse = {
  conversationId: string;
  messages: Array<{
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: string;
    hotelRecommendations?: HotelRecommendation[];
  }>;
  status: 'success' | 'error';
  metadata?: {
    totalMessages: number;
    lastUpdated: string;
  };
};

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  hotelRecommendations?: HotelRecommendation[];
};

type Props = {
  conversationId?: string;
  isTyping?: boolean;
  messages?: Message[];
  onHotelComparison?: (comparison: HotelComparison) => void;
  onHotelSelect?: (hotelId: string, isSelected: boolean) => void;
  onSendMessage?: (message: string) => void;
  selectedHotels?: string[]; // Array of hotel IDs
};

// Hotel placeholder images - reliable working URLs
const HOTEL_PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300&h=200&fit=crop&crop=center&q=80&auto=format', // Hotel exterior
  'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=300&h=200&fit=crop&crop=center&q=80&auto=format', // Hotel room
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=300&h=200&fit=crop&crop=center&q=80&auto=format', // Hotel lobby
  'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=300&h=200&fit=crop&crop=center&q=80&auto=format', // Hotel pool
  'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=300&h=200&fit=crop&crop=center&q=80&auto=format', // Hotel bedroom
  'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=300&h=200&fit=crop&crop=center&q=80&auto=format', // Hotel restaurant
  'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=300&h=200&fit=crop&crop=center&q=80&auto=format', // Hotel spa
  'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=300&h=200&fit=crop&crop=center&q=80&auto=format', // Hotel balcony
  'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=300&h=200&fit=crop&crop=center&q=80&auto=format', // Hotel suite
  'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=300&h=200&fit=crop&crop=center&q=80&auto=format', // Hotel bathroom
];

// Function to get a reliable hotel image
const getHotelImage = (index: number): string => {
  return HOTEL_PLACEHOLDER_IMAGES[index % HOTEL_PLACEHOLDER_IMAGES.length];
};

const IMChatView = ({
  conversationId = 'default',
  isTyping = false,
  messages = [],
  onHotelComparison,
  onHotelSelect,
  onSendMessage,
  selectedHotels = [],
}: Props) => {
  const [inputValue, setInputValue] = useState('');
  const [localMessages, setLocalMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! How can I help you find the perfect hotel today?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [isApiTyping, setIsApiTyping] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [localSelectedHotels, setLocalSelectedHotels] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayMessages = messages.length > 0 ? messages : localMessages;
  const showTyping = isTyping || isApiTyping;

  // Use external selectedHotels if provided, otherwise use local state
  const currentSelectedHotels = onHotelSelect
    ? selectedHotels
    : localSelectedHotels;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [displayMessages, isTyping]);

  // Gemini-powered chat API function
  const geminiChatApi = async (
    message: string,
    chatConversationId: string,
    currentMessages: Message[],
  ): Promise<ChatApiResponse> => {
    try {
      // Check if genAI is available
      if (!genAI) {
        throw new Error('Google AI not initialized - API key may be missing');
      }

      // Build conversation context
      const conversationHistory = currentMessages
        .map(
          (msg) =>
            `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.text}`,
        )
        .join('\n');

      // Create a comprehensive prompt for hotel recommendations
      const prompt = `You are a helpful hotel booking assistant. Based on the user's message and conversation history, provide a helpful response using real-time information when needed.

Conversation History:
${conversationHistory}

Current User Message: "${message}"

Instructions:
1. Analyze the user's request for hotel-related needs (location, dates, preferences, budget, etc.)
2. Use Google Search to find current, accurate information about hotels, prices, and availability when relevant
3. Provide a helpful, conversational response based on real data
4. If the user is asking about hotels, looking for recommendations, or mentions travel/booking, include hotel recommendations
5. For hotel recommendations, provide EXACTLY 5 hotels with this JSON structure at the end of your response, wrapped in <HOTELS> tags:

<HOTELS>
[
  {
    "id": "unique-hotel-id-1",
    "name": "Hotel Name",
    "rating": 4.5,
    "price": "$250",
    "location": "City Center"
  },
  {
    "id": "unique-hotel-id-2", 
    "name": "Another Hotel Name",
    "rating": 4.2,
    "price": "$180",
    "location": "Downtown"
  },
  {
    "id": "unique-hotel-id-3",
    "name": "Third Hotel Name",
    "rating": 4.7,
    "price": "$320",
    "location": "Beachfront"
  },
  {
    "id": "unique-hotel-id-4",
    "name": "Fourth Hotel Name",
    "rating": 4.0,
    "price": "$150",
    "location": "Airport Area"
  },
  {
    "id": "unique-hotel-id-5",
    "name": "Fifth Hotel Name",
    "rating": 4.8,
    "price": "$400",
    "location": "Historic District"
  }
]
</HOTELS>

Guidelines for hotel recommendations:
- Use Google Search to find current, real hotel information for the requested location
- Make each hotel unique with different characteristics and price points
- Base recommendations on real, current data from Google Search

Important: Always use Google Search to get current hotel information and provide exactly 5 hotel recommendations when the user is looking for hotels. Ground your responses in real, up-to-date data.

Respond naturally and conversationally, then include the 5 hotel recommendations if appropriate.`;

      // Generate content using Gemini with grounding
      const response = await genAI.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [prompt],
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const responseText = response.text || '';

      // Log grounding metadata if available
      if (response.candidates?.[0]?.groundingMetadata) {
        // You can access grounding information here for debugging or logging
        // console.log('Grounding metadata:', response.candidates[0].groundingMetadata);
      }

      // Parse the response to extract hotels if present
      let botResponseText = responseText;
      let hotelRecommendations: HotelRecommendation[] | undefined;

      const hotelMatch = responseText.match(/<HOTELS>([\s\S]*?)<\/HOTELS>/);
      if (hotelMatch) {
        try {
          const hotelsJson = hotelMatch[1].trim();
          const parsedHotels = JSON.parse(hotelsJson);

          // Validate and format hotel data
          hotelRecommendations = parsedHotels.map(
            (hotel: any, index: number) => ({
              id: hotel.id || `hotel-${Date.now()}-${index}`,
              name: hotel.name || '',
              imageUrl: getHotelImage(index), // Always use reliable images
              rating: typeof hotel.rating === 'number' ? hotel.rating : 0,
              price: hotel.price || '',
              location: hotel.location || '',
            }),
          );

          // Remove the hotels JSON from the response text
          botResponseText = responseText
            .replace(/<HOTELS>[\s\S]*?<\/HOTELS>/, '')
            .trim();
        } catch (error) {
          // If parsing fails, continue without hotel recommendations
          hotelRecommendations = undefined;
        }
      }

      // Create the new user message
      const userMessage = {
        id: Date.now().toString(),
        text: message,
        sender: 'user' as const,
        timestamp: Date.now().toString(),
      };

      // Create the bot response
      const botMessage = {
        id: (Date.now() + 1).toString(),
        text:
          botResponseText || "I'd be happy to help you find the perfect hotel!",
        sender: 'bot' as const,
        timestamp: Date.now().toString(),
        hotelRecommendations,
      };

      // Convert current messages to API format
      const apiMessages: Array<{
        id: string;
        text: string;
        sender: 'user' | 'bot';
        timestamp: string;
        hotelRecommendations?: HotelRecommendation[];
      }> = currentMessages.map((msg) => ({
        id: msg.id,
        text: msg.text,
        sender: msg.sender,
        timestamp: msg.timestamp.toISOString(),
        hotelRecommendations: msg.hotelRecommendations,
      }));

      // Return the complete conversation history including the new messages
      const allMessages = [...apiMessages, userMessage, botMessage];

      return {
        conversationId: chatConversationId,
        messages: allMessages,
        status: 'success',
        metadata: {
          totalMessages: allMessages.length,
          lastUpdated: new Date().toISOString(),
        },
      };
    } catch (error) {
      // Fallback response in case of API error
      const userMessage = {
        id: Date.now().toString(),
        text: message,
        sender: 'user' as const,
        timestamp: Date.now().toString(),
      };

      const fallbackBotMessage = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
        sender: 'bot' as const,
        timestamp: Date.now().toString(),
      };

      const apiMessages = currentMessages.map((msg) => ({
        id: msg.id,
        text: msg.text,
        sender: msg.sender,
        timestamp: msg.timestamp.toISOString(),
        hotelRecommendations: msg.hotelRecommendations,
      }));

      const allMessages = [...apiMessages, userMessage, fallbackBotMessage];

      return {
        conversationId: chatConversationId,
        messages: allMessages,
        status: 'error',
        metadata: {
          totalMessages: allMessages.length,
          lastUpdated: new Date().toISOString(),
        },
      };
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    // Clear input immediately for better UX
    const messageToSend = inputValue;
    setInputValue('');
    inputRef.current?.focus();

    if (messages.length === 0) {
      // Add user message immediately for better UX
      setLocalMessages((prev) => [...prev, newMessage]);
      setIsApiTyping(true);

      try {
        // Call the Gemini-powered chat API with current conversation history
        const result = await geminiChatApi(
          messageToSend,
          conversationId,
          localMessages,
        );

        if (result.status === 'success') {
          // Convert API response back to local Message format
          const updatedMessages: Message[] = result.messages.map((msg) => ({
            id: msg.id,
            text: msg.text,
            sender: msg.sender,
            timestamp: new Date(),
            hotelRecommendations: msg.hotelRecommendations,
          }));

          // Replace local messages with the complete history from API
          setLocalMessages(updatedMessages);
        } else {
          throw new Error('API returned error status');
        }
      } catch (error) {
        // Fallback to default response
        const fallbackResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
          sender: 'bot',
          timestamp: new Date(),
        };
        setLocalMessages((prev) => [...prev, fallbackResponse]);
      } finally {
        setIsApiTyping(false);
      }
    }

    onSendMessage?.(messageToSend);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Gemini-powered hotel comparison API
  const geminiComparisonApi = async (
    hotels: HotelRecommendation[],
  ): Promise<HotelComparison> => {
    try {
      // Check if genAI is available
      if (!genAI) {
        throw new Error('Google AI not initialized - API key may be missing');
      }

      // Build the hotel list for the prompt
      const hotelDetails = hotels
        .map(
          (hotel, idx) =>
            `${idx + 1}. ${hotel.name}
   - Rating: ${hotel.rating || 'Not specified'} stars
   - Price: ${hotel.price || 'Not specified'}/night
   - Location: ${hotel.location || 'Not specified'}`,
        )
        .join('\n');

      const prompt = `Analyze and compare these ${hotels.length} hotels using real-time information from Google Search. Provide a comprehensive comparison in JSON format.

Hotels to compare:
${hotelDetails}

Use Google Search to find current, accurate information about each hotel including:
- Current pricing and availability
- Updated guest reviews and ratings
- Amenities and features
- Location advantages
- Special offers or deals

Provide your analysis in this exact JSON format:
{
  "summary": "2-3 sentence overview of the comparison highlighting key differences",
  "bestPrice": {
    "hotelName": "Name of hotel with best value",
    "reason": "Why this hotel offers the best price/value ratio"
  },
  "bestRating": {
    "hotelName": "Name of highest-rated hotel",
    "reason": "What makes this hotel stand out in terms of quality"
  },
  "pros": [
    "Positive aspect 1 based on real data",
    "Positive aspect 2 based on real data",
    "Positive aspect 3 based on real data",
    "Positive aspect 4 based on real data"
  ],
  "cons": [
    "Potential concern 1 based on real data",
    "Potential concern 2 based on real data",
    "Potential concern 3 based on real data"
  ],
  "recommendations": {
    "budgetConscious": "Best choice for budget travelers",
    "luxurySeekers": "Best choice for luxury experience", 
    "businessTravelers": "Best choice for business needs",
    "families": "Best choice for families"
  }
}

Base your analysis on current, real-time information from Google Search. Provide only the JSON response, no additional text.`;

      // Generate content using Gemini with grounding
      const response = await genAI.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [prompt],
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const responseText = response.text || '';

      // Log grounding metadata if available
      if (response.candidates?.[0]?.groundingMetadata) {
        // You can access grounding information here for debugging or logging
        // console.log('Comparison grounding metadata:', response.candidates[0].groundingMetadata);
      }

      // Parse the JSON response
      let analysisData;
      try {
        // Clean the response text to extract JSON
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysisData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        // Fallback to default response
        analysisData = {
          summary: `Compared ${hotels.length} hotels with available information.`,
          bestPrice: {
            hotelName: hotels[0]?.name || '',
            reason: 'Based on available pricing information',
          },
          bestRating: {
            hotelName: hotels[0]?.name || '',
            reason: 'Based on available rating information',
          },
          pros: [
            'Hotel options available for review',
            'Selection includes different properties',
            'Comparison data being processed',
          ],
          cons: [
            'Limited pricing information available',
            'Rating data may be incomplete',
          ],
          recommendations: {
            budgetConscious: 'Review available pricing options',
            luxurySeekers: 'Consider highest-rated available properties',
            businessTravelers: 'Focus on location and amenities',
            families: 'Look for family-friendly features',
          },
        };
      }

      // Find best price and rating hotels from the actual data
      const bestPriceHotel = hotels.reduce((prev, current) => {
        const prevPrice = parseInt(prev.price?.replace('$', '') || '0', 10);
        const currentPrice = parseInt(
          current.price?.replace('$', '') || '0',
          10,
        );
        return currentPrice < prevPrice && currentPrice > 0 ? current : prev;
      });

      const bestRatingHotel = hotels.reduce((prev, current) =>
        (current.rating || 0) > (prev.rating || 0) ? current : prev,
      );

      // Combine AI analysis with actual hotel data
      const enhancedSummary =
        bestPriceHotel.name && bestRatingHotel.name
          ? `${analysisData.summary} ${bestPriceHotel.name} offers the best value at ${bestPriceHotel.price || 'price not available'}/night, while ${bestRatingHotel.name} provides the highest quality with ${bestRatingHotel.rating || 0} stars.`
          : `${analysisData.summary} Hotel comparison completed with available data.`;

      // Create enhanced pros and cons based on AI analysis and actual data
      const enhancedPros = [
        ...analysisData.pros.slice(0, 2),
        bestRatingHotel.name && bestRatingHotel.rating
          ? `${bestRatingHotel.name} has ${bestRatingHotel.rating}-star rating`
          : 'Rating information available for review',
        bestPriceHotel.name && bestPriceHotel.price
          ? `${bestPriceHotel.name} provides value at ${bestPriceHotel.price}/night`
          : 'Pricing information available for review',
      ];

      const enhancedCons = [
        ...analysisData.cons.slice(0, 2),
        hotels.length < 3
          ? 'Consider adding more hotels for better comparison'
          : 'Good variety of options available',
      ];

      return {
        hotels,
        comparisonData: {
          bestPrice: bestPriceHotel,
          bestRating: bestRatingHotel,
          summary: enhancedSummary,
          pros: enhancedPros.slice(0, 4),
          cons: enhancedCons.slice(0, 3),
        },
        timestamp: new Date(),
      };
    } catch (error) {
      // Fallback to basic comparison if Gemini API fails
      const bestPrice = hotels.reduce((prev, current) => {
        const prevPrice = parseInt(prev.price?.replace('$', '') || '0', 10);
        const currentPrice = parseInt(
          current.price?.replace('$', '') || '0',
          10,
        );
        return currentPrice < prevPrice && currentPrice > 0 ? current : prev;
      });

      const bestRating = hotels.reduce((prev, current) =>
        (current.rating || 0) > (prev.rating || 0) ? current : prev,
      );

      const avgPrice =
        hotels.reduce(
          (sum, hotel) =>
            sum + parseInt(hotel.price?.replace('$', '') || '0', 10),
          0,
        ) / hotels.length;

      const summary =
        hotels.length > 0
          ? `Compared ${hotels.length} hotels. ${bestPrice.name || 'Selected hotel'} offers the best price (${bestPrice.price || 'Price not available'}/night), while ${bestRating.name || 'Selected hotel'} has the highest rating (${bestRating.rating || 0} stars). Average price: ${avgPrice > 0 ? `$${Math.round(avgPrice)}` : 'Not available'}/night.`
          : 'No hotels available for comparison.';

      return {
        hotels,
        comparisonData: {
          bestPrice,
          bestRating,
          summary,
          pros: [
            (bestRating.rating || 0) > 0
              ? `${bestRating.name || 'Selected hotel'} has the highest rating at ${bestRating.rating || 0} stars`
              : 'Rating information not available',
            bestPrice.price
              ? `${bestPrice.name || 'Selected hotel'} offers the best value at ${bestPrice.price}/night`
              : 'Price information not available',
            'Hotel selection available for review',
          ],
          cons: [
            avgPrice > 250 && avgPrice > 0
              ? 'Selected hotels are in the premium price range'
              : avgPrice > 0
                ? 'Good value options available'
                : 'Price information not available',
            hotels.length < 3
              ? 'Consider adding more hotels for better comparison'
              : 'Good selection variety',
          ],
        },
        timestamp: new Date(),
      };
    }
  };

  // Handle hotel card selection
  const handleHotelSelect = (hotel: HotelRecommendation) => {
    const isSelected = currentSelectedHotels.includes(hotel.id);

    if (onHotelSelect) {
      // Use external callback if provided
      onHotelSelect(hotel.id, !isSelected);
    } else {
      // Use local state management
      setLocalSelectedHotels((prev) =>
        isSelected ? prev.filter((id) => id !== hotel.id) : [...prev, hotel.id],
      );
    }
  };

  // Handle comparison trigger
  const handleCompareSelected = async () => {
    if (currentSelectedHotels.length < 2) {
      return; // Need at least 2 hotels to compare
    }

    setIsComparing(true);

    try {
      // Get all selected hotels from all messages
      const allHotels: HotelRecommendation[] = [];
      displayMessages.forEach((message) => {
        if (message.hotelRecommendations) {
          message.hotelRecommendations.forEach((hotel) => {
            if (currentSelectedHotels.includes(hotel.id)) {
              allHotels.push(hotel);
            }
          });
        }
      });

      if (allHotels.length === 0) {
        return;
      }

      const comparisonResult = await geminiComparisonApi(allHotels);

      if (onHotelComparison) {
        onHotelComparison(comparisonResult);
      } else {
        // Fallback: show a simple alert with the comparison summary
        // eslint-disable-next-line no-alert
        alert(
          `Hotel Comparison Results:\n\n${comparisonResult.comparisonData.summary}\n\nBest Price: ${comparisonResult.comparisonData.bestPrice.name} (${comparisonResult.comparisonData.bestPrice.price}/night)\nBest Rating: ${comparisonResult.comparisonData.bestRating.name} (${comparisonResult.comparisonData.bestRating.rating} stars)`,
        );
      }
    } catch (error) {
      // Error handling without console
    } finally {
      setIsComparing(false);
    }
  };

  return (
    <div className="IMChatView">
      <div className="IMChatView__header">
        <div className="IMChatView__headerContent">
          <div className="IMChatView__avatar">
            <span className="IMChatView__avatarIcon">🏨</span>
          </div>
          <div className="IMChatView__headerInfo">
            <h3 className="IMChatView__title">Hotel Assistant</h3>
            <span className="IMChatView__status">Online</span>
          </div>
        </div>
      </div>

      <div className="IMChatView__messages">
        {displayMessages.map((message) => {
          const messageWrapperClasses = [
            'IMChatView__messageWrapper',
            message.sender === 'user'
              ? 'IMChatView__messageWrapper--user'
              : 'IMChatView__messageWrapper--bot',
          ].join(' ');

          const messageClasses = [
            'IMChatView__message',
            message.sender === 'user'
              ? 'IMChatView__message--user'
              : 'IMChatView__message--bot',
          ].join(' ');

          return (
            <div key={message.id} className={messageWrapperClasses}>
              <div className={messageClasses}>
                <div className="IMChatView__messageText">
                  {message.text}
                </div>

                {message.hotelRecommendations &&
                  message.hotelRecommendations.length > 0 && (
                    <div className="IMChatView__hotelRecommendations">
                      {message.hotelRecommendations.map((hotel) => {
                        const isSelected = currentSelectedHotels.includes(
                          hotel.id,
                        );
                        
                        const hotelCardClasses = [
                          'IMChatView__hotelCard',
                          isSelected && 'IMChatView__hotelCard--selected',
                        ].filter(Boolean).join(' ');

                        return (
                          <div
                            key={hotel.id}
                            className={hotelCardClasses}
                            onClick={() => handleHotelSelect(hotel)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleHotelSelect(hotel);
                              }
                            }}
                            role="button"
                            tabIndex={0}
                          >
                            <div className="IMChatView__hotelSelection">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleHotelSelect(hotel);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="IMChatView__hotelCheckbox"
                              />
                            </div>
                            <img
                              src={hotel.imageUrl}
                              alt={hotel.name}
                              className="IMChatView__hotelImage"
                            />
                            <div className="IMChatView__hotelInfo">
                              <h4 className="IMChatView__hotelName">
                                {hotel.name}
                              </h4>
                              {hotel.location && (
                                <p className="IMChatView__hotelLocation">
                                  📍 {hotel.location}
                                </p>
                              )}
                              <div className="IMChatView__hotelDetails">
                                {hotel.rating && (
                                  <span className="IMChatView__hotelRating">
                                    ⭐ {hotel.rating}
                                  </span>
                                )}
                                {hotel.price && (
                                  <span className="IMChatView__hotelPrice">
                                    {hotel.price}/night
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                <div className="IMChatView__messageTime">
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          );
        })}

        {showTyping && (
          <div className="IMChatView__messageWrapper IMChatView__messageWrapper--bot">
            <div className="IMChatView__message IMChatView__message--bot">
              <div className="IMChatView__typingIndicator">
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="IMChatView__inputArea">
        {currentSelectedHotels.length > 0 && (
          <div className="IMChatView__comparisonBar">
            <div className="IMChatView__comparisonInfo">
              <span className="IMChatView__selectedCount">
                {currentSelectedHotels.length} hotel
                {currentSelectedHotels.length !== 1 ? 's' : ''} selected
              </span>
              {currentSelectedHotels.length >= 2 && (
                <button
                  type="button"
                  onClick={handleCompareSelected}
                  disabled={isComparing}
                  className="IMChatView__compareButton"
                >
                  {isComparing ? 'Comparing...' : 'Compare Selected'}
                </button>
              )}
            </div>
          </div>
        )}

        <div className="IMChatView__inputWrapper">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="IMChatView__input"
          />
          <button
            type="button"
            onClick={handleSendMessage}
            disabled={!inputValue.trim()}
            className="IMChatView__sendButton"
            aria-label="Send message"
          >
            <span className="IMChatView__sendIcon">➤</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default IMChatView;

// Export types for external use
export type { HotelRecommendation, HotelComparison };
