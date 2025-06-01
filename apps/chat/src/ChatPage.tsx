import { useState } from 'react';
import IMChatView, { HotelComparison } from './IMChatView';
import HotelComparisonView from './HotelComparison';

export function ChatPage() {
  const [comparisonResult, setComparisonResult] =
    useState<HotelComparison | null>(null);

  const handleHotelComparison = (comparison: HotelComparison) => {
    setComparisonResult(comparison);
  };

  const handleCloseComparison = () => {
    setComparisonResult(null);
  };

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100%',
        gap: '0',
        overflow: 'hidden',
      }}
    >
      <IMChatView onHotelComparison={handleHotelComparison} />

      {comparisonResult ? (
        <div
          style={{
            width: '50%',
            height: '100vh',
            borderTopLeftRadius: 0,
            borderBottomLeftRadius: 0,
          }}
        >
          <HotelComparisonView
            comparison={comparisonResult}
            onClose={handleCloseComparison}
          />
        </div>
      ) : (
        <div
          style={{
            width: '50%',
            height: '100vh',
            backgroundColor: '#f8f9fa',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '16px',
            borderTopRightRadius: '12px',
            borderBottomRightRadius: '12px',
            border: '1px solid #e1e5e9',
            borderLeft: 'none',
          }}
        >
          <div
            style={{
              fontSize: '48px',
              opacity: 0.3,
            }}
          >
            📊
          </div>
          <div
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#666',
              textAlign: 'center',
            }}
          >
            Hotel Comparison
          </div>
          <div
            style={{
              fontSize: '14px',
              color: '#999',
              textAlign: 'center',
              maxWidth: '300px',
              lineHeight: 1.5,
            }}
          >
            Select 2 or more hotels from the chat to see a detailed comparison
            here
          </div>
        </div>
      )}
    </div>
  );
} 