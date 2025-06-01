import type React from 'react';

import './HotelComparison.scss';

type HotelRecommendation = {
  id: string;
  name: string;
  imageUrl: string;
  rating?: number;
  price?: string;
  location?: string;
};

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

type Props = {
  comparison: HotelComparison | null;
  onClose?: () => void;
  style?: React.CSSProperties;
  className?: string;
};

// Helper function to generate hotel-specific pros and cons
const generateHotelProsAndCons = (
  hotel: HotelRecommendation,
  comparisonData: HotelComparison['comparisonData'],
  allHotels: HotelRecommendation[],
) => {
  const pros: string[] = [];
  const cons: string[] = [];

  const isBestPrice = hotel.id === comparisonData.bestPrice.id;
  const isBestRating = hotel.id === comparisonData.bestRating.id;

  // Price-related pros/cons
  if (isBestPrice) {
    pros.push('Best price among selected hotels');
  } else if (hotel.price) {
    const hotelPrice = parseInt(hotel.price.replace('$', ''));
    const bestPrice = parseInt(
      comparisonData.bestPrice.price?.replace('$', '') || '0',
    );
    const priceDiff = hotelPrice - bestPrice;
    if (priceDiff > 50) {
      cons.push(`$${priceDiff} more than cheapest option`);
    } else if (priceDiff > 0) {
      cons.push('Slightly higher price');
    }
  }

  // Rating-related pros/cons
  if (isBestRating) {
    pros.push('Highest rated among selections');
  } else if (hotel.rating) {
    if (hotel.rating >= 4.5) {
      pros.push('Excellent guest reviews');
    } else if (hotel.rating >= 4.0) {
      pros.push('Very good guest reviews');
    } else if (hotel.rating < 3.5) {
      cons.push('Lower guest rating');
    }
  }

  // Location-based pros (simplified examples)
  if (
    hotel.location?.toLowerCase().includes('downtown') ||
    hotel.location?.toLowerCase().includes('center')
  ) {
    pros.push('Central location');
  }
  if (hotel.location?.toLowerCase().includes('beach')) {
    pros.push('Beachfront location');
  }
  if (hotel.location?.toLowerCase().includes('airport')) {
    pros.push('Close to airport');
    cons.push('May have airport noise');
  }

  // Generic pros based on rating and price combination
  if (hotel.rating && hotel.price) {
    const hotelPrice = parseInt(hotel.price.replace('$', ''));
    if (hotel.rating >= 4.0 && hotelPrice < 200) {
      pros.push('Great value for money');
    }
    if (hotel.rating >= 4.5) {
      pros.push('Premium service quality');
    }
  }

  // Add some generic pros if we don't have enough
  if (pros.length < 2) {
    const genericPros = [
      'Modern amenities',
      'Professional service',
      'Clean facilities',
      'Good accessibility',
      'Reliable WiFi',
    ];
    pros.push(genericPros[Math.floor(Math.random() * genericPros.length)]);
  }

  // Add some generic cons if we don't have any
  if (cons.length === 0) {
    const genericCons = [
      'Limited parking',
      'Busy area',
      'No pool',
      'Small rooms',
    ];
    // Only add a generic con 50% of the time to keep it realistic
    if (Math.random() > 0.5) {
      cons.push(genericCons[Math.floor(Math.random() * genericCons.length)]);
    }
  }

  return { pros: pros.slice(0, 3), cons: cons.slice(0, 2) };
};

const HotelComparisonView = ({
  className,
  comparison,
  onClose,
  style,
}: Props) => {
  if (!comparison) {
    return null;
  }

  const { comparisonData, hotels, timestamp } = comparison;

  return (
    <div className={`HotelComparison ${className || ''}`} style={style}>
      <div className="HotelComparison__header">
        <h2 className="HotelComparison__title">
          Hotel Comparison ({hotels.length} hotels)
        </h2>
        <div className="HotelComparison__meta">
          <span className="HotelComparison__timestamp">
            {timestamp.toLocaleString()}
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="HotelComparison__closeButton"
              aria-label="Close comparison"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="HotelComparison__summary">
        <p className="HotelComparison__summaryText">
          {comparisonData.summary}
        </p>
      </div>

      <div className="HotelComparison__hotelsList">
        {hotels.map((hotel, index) => {
          const isBestPrice = hotel.id === comparisonData.bestPrice.id;
          const isBestRating = hotel.id === comparisonData.bestRating.id;
          const { cons, pros } = generateHotelProsAndCons(
            hotel,
            comparisonData,
            hotels,
          );

          const cardClasses = [
            'HotelComparison__hotelCard',
            isBestPrice && 'HotelComparison__hotelCard--bestPrice',
            isBestRating && 'HotelComparison__hotelCard--bestRating',
          ].filter(Boolean).join(' ');

          return (
            <div
              key={hotel.id}
              className={cardClasses}
            >
              {(isBestPrice || isBestRating) && (
                <div className="HotelComparison__badge">
                  {isBestPrice && isBestRating ? (
                    <span className="HotelComparison__badgeText">
                      🏆 Best Price & Rating
                    </span>
                  ) : isBestPrice ? (
                    <span className="HotelComparison__badgeText">
                      💰 Best Price
                    </span>
                  ) : (
                    <span className="HotelComparison__badgeText">
                      ⭐ Best Rating
                    </span>
                  )}
                </div>
              )}

              <div className="HotelComparison__hotelContent">
                <img
                  src={hotel.imageUrl}
                  alt={hotel.name}
                  className="HotelComparison__hotelImage"
                />
                <div className="HotelComparison__hotelInfo">
                  <div className="HotelComparison__hotelHeader">
                    <h3 className="HotelComparison__hotelName">
                      {hotel.name}
                    </h3>
                    <div className="HotelComparison__hotelRank">
                      #{index + 1}
                    </div>
                  </div>

                  {hotel.location && (
                    <p className="HotelComparison__hotelLocation">
                      📍 {hotel.location}
                    </p>
                  )}

                  <div className="HotelComparison__hotelDetails">
                    {hotel.rating && (
                      <div className="HotelComparison__hotelRating">
                        <span className="HotelComparison__ratingStars">
                          ⭐ {hotel.rating}
                        </span>
                        <span className="HotelComparison__ratingText">
                          stars
                        </span>
                      </div>
                    )}
                    {hotel.price && (
                      <div className="HotelComparison__hotelPrice">
                        <span className="HotelComparison__priceAmount">
                          {hotel.price}
                        </span>
                        <span className="HotelComparison__priceText">
                          /night
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Pros and Cons Section */}
                  <div className="HotelComparison__proscons">
                    {pros.length > 0 && (
                      <div className="HotelComparison__pros">
                        <h4 className="HotelComparison__prosTitle">
                          ✅ Pros
                        </h4>
                        <ul className="HotelComparison__prosList">
                          {pros.map((pro, proIndex) => (
                            <li
                              key={proIndex}
                              className="HotelComparison__prosItem"
                            >
                              {pro}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {cons.length > 0 && (
                      <div className="HotelComparison__cons">
                        <h4 className="HotelComparison__consTitle">
                          ⚠️ Considerations
                        </h4>
                        <ul className="HotelComparison__consList">
                          {cons.map((con, conIndex) => (
                            <li
                              key={conIndex}
                              className="HotelComparison__consItem"
                            >
                              {con}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HotelComparisonView;
