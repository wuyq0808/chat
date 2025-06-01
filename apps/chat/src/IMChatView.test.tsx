import React from 'react';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import IMChatView from './IMChatView';

describe('IMChatView', () => {
  it('renders the chat interface correctly', () => {
    render(<IMChatView />);

    expect(screen.getByText('Hotel Assistant')).toBeInTheDocument();
    expect(screen.getByText('Online')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Type your message...'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Send message' }),
    ).toBeInTheDocument();
  });

  it('displays initial bot message', () => {
    render(<IMChatView />);

    expect(
      screen.getByText(
        'Hello! How can I help you find the perfect hotel today?',
      ),
    ).toBeInTheDocument();
  });

  it('allows user to type and send messages', async () => {
    const user = userEvent.setup();
    const mockOnSendMessage = jest.fn();

    render(<IMChatView onSendMessage={mockOnSendMessage} />);

    const input = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByRole('button', { name: 'Send message' });

    // Type a message
    await user.type(input, 'Hello, I need help finding a hotel');

    // Send the message
    await user.click(sendButton);

    expect(mockOnSendMessage).toHaveBeenCalledWith(
      'Hello, I need help finding a hotel',
    );
  });

  it('sends message on Enter key press', async () => {
    const user = userEvent.setup();
    const mockOnSendMessage = jest.fn();

    render(<IMChatView onSendMessage={mockOnSendMessage} />);

    const input = screen.getByPlaceholderText('Type your message...');

    // Type a message and press Enter
    await user.type(input, 'Test message{enter}');

    expect(mockOnSendMessage).toHaveBeenCalledWith('Test message');
  });

  it('disables send button when input is empty', () => {
    render(<IMChatView />);

    const sendButton = screen.getByRole('button', { name: 'Send message' });

    expect(sendButton).toBeDisabled();
  });

  it('enables send button when input has text', async () => {
    const user = userEvent.setup();
    render(<IMChatView />);

    const input = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByRole('button', { name: 'Send message' });

    await user.type(input, 'Test');

    expect(sendButton).not.toBeDisabled();
  });

  it('displays typing indicator when isTyping is true', () => {
    render(<IMChatView isTyping />);

    const typingIndicator = document.querySelector(
      '.IMChatView__typingIndicator',
    );

    expect(typingIndicator).toBeInTheDocument();
  });

  it('displays custom messages when provided', () => {
    const customMessages = [
      {
        id: '1',
        text: 'Custom message 1',
        sender: 'user' as const,
        timestamp: new Date(),
      },
      {
        id: '2',
        text: 'Custom message 2',
        sender: 'bot' as const,
        timestamp: new Date(),
      },
    ];

    render(<IMChatView messages={customMessages} />);

    expect(screen.getByText('Custom message 1')).toBeInTheDocument();
    expect(screen.getByText('Custom message 2')).toBeInTheDocument();
  });

  it('clears input after sending message', async () => {
    const user = userEvent.setup();
    render(<IMChatView />);

    const input = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByRole('button', { name: 'Send message' });

    await user.type(input, 'Test message');
    await user.click(sendButton);

    expect(input).toHaveValue('');
  });

  it('adds user message to local state when no external messages provided', async () => {
    const user = userEvent.setup();
    render(<IMChatView />);

    const input = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByRole('button', { name: 'Send message' });

    await user.type(input, 'User test message');
    await user.click(sendButton);

    expect(screen.getByText('User test message')).toBeInTheDocument();
  });

  it('simulates bot response after user message', async () => {
    const user = userEvent.setup();
    render(<IMChatView />);

    const input = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByRole('button', { name: 'Send message' });

    await user.type(input, 'User test message');
    await user.click(sendButton);

    // Wait for bot response - the API now returns the complete conversation history
    await waitFor(
      () => {
        // Check that user message is still there
        expect(screen.getByText('User test message')).toBeInTheDocument();

        // Check that a bot response appears (any of the possible responses)
        const possibleResponses = [
          "Thanks for your message! I'm here to help you with hotel recommendations and bookings.",
          "I'd be happy to help you find the perfect hotel. What type of accommodation are you looking for?",
          'Great! Let me help you with that. Do you have any specific preferences for location or amenities?',
          'I can assist you with finding hotels, checking availability, and making reservations. What would you like to know?',
          "That's a great question! I can help you compare different hotels and find the best deals.",
          'Here are some great hotel recommendations for you:',
          'I found these amazing hotels that match your preferences:',
          'Based on your request, here are my top hotel suggestions:',
          'These hotels are highly rated and available for your dates:',
          "I've curated these excellent hotel options for you:",
        ];

        const botResponseExists = possibleResponses.some(
          (response) => screen.queryByText(response) !== null,
        );

        expect(botResponseExists).toBe(true);
      },
      { timeout: 3000 },
    );
  });

  it('displays hotel recommendations when bot provides them', async () => {
    const user = userEvent.setup();
    render(<IMChatView />);

    const input = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByRole('button', { name: 'Send message' });

    // Use a message that's likely to trigger hotel recommendations
    await user.type(input, 'I need hotel recommendations');
    await user.click(sendButton);

    // Wait for bot response with potential hotel recommendations
    await waitFor(
      () => {
        // Check that user message is there
        expect(
          screen.getByText('I need hotel recommendations'),
        ).toBeInTheDocument();

        // Check if hotel cards are displayed (they might appear based on the random logic)
        const hotelCards = document.querySelectorAll('.IMChatView__hotelCard');

        // If hotel recommendations are shown, verify their structure
        if (hotelCards.length > 0) {
          // Check that hotel images are present
          const hotelImages = document.querySelectorAll(
            '.IMChatView__hotelImage',
          );

          expect(hotelImages.length).toBeGreaterThan(0);

          // Check that hotel names are present
          const hotelNames = document.querySelectorAll(
            '.IMChatView__hotelName',
          );

          expect(hotelNames.length).toBeGreaterThan(0);

          // Verify that each hotel card has the expected structure
          hotelCards.forEach((card) => {
            expect(
              card.querySelector('.IMChatView__hotelImage'),
            ).toBeInTheDocument();
            expect(
              card.querySelector('.IMChatView__hotelInfo'),
            ).toBeInTheDocument();
            expect(
              card.querySelector('.IMChatView__hotelName'),
            ).toBeInTheDocument();
          });
        }

        // At minimum, a bot response should be present
        const botMessages = document.querySelectorAll(
          '.IMChatView__message--bot',
        );

        expect(botMessages.length).toBeGreaterThan(1); // Initial message + new response
      },
      { timeout: 3000 },
    );
  });

  it('displays custom messages with hotel recommendations when provided', () => {
    const customMessages = [
      {
        id: '1',
        text: 'Here are some hotel recommendations:',
        sender: 'bot' as const,
        timestamp: new Date(),
        hotelRecommendations: [
          {
            id: 'hotel-1',
            name: 'Test Hotel',
            imageUrl: 'https://example.com/hotel.jpg',
            rating: 4.5,
            price: '$200',
            location: 'Downtown',
          },
          {
            id: 'hotel-2',
            name: 'Another Hotel',
            imageUrl: 'https://example.com/hotel2.jpg',
            rating: 4.2,
            price: '$150',
            location: 'Beachfront',
          },
        ],
      },
    ];

    render(<IMChatView messages={customMessages} />);

    expect(
      screen.getByText('Here are some hotel recommendations:'),
    ).toBeInTheDocument();
    expect(screen.getByText('Test Hotel')).toBeInTheDocument();
    expect(screen.getByText('Another Hotel')).toBeInTheDocument();
    expect(screen.getByText('📍 Downtown')).toBeInTheDocument();
    expect(screen.getByText('📍 Beachfront')).toBeInTheDocument();
    expect(screen.getByText('⭐ 4.5')).toBeInTheDocument();
    expect(screen.getByText('⭐ 4.2')).toBeInTheDocument();
    expect(screen.getByText('$200/night')).toBeInTheDocument();
    expect(screen.getByText('$150/night')).toBeInTheDocument();

    // Check that hotel images are rendered
    const hotelImages = screen.getAllByRole('img');

    expect(hotelImages).toHaveLength(2);
    expect(hotelImages[0]).toHaveAttribute('alt', 'Test Hotel');
    expect(hotelImages[1]).toHaveAttribute('alt', 'Another Hotel');
  });

  it('handles hotel selection and shows comparison bar', async () => {
    const user = userEvent.setup();
    const mockOnHotelSelect = jest.fn();
    const selectedHotels = ['hotel-1'];

    const customMessages = [
      {
        id: '1',
        text: 'Here are some hotel recommendations:',
        sender: 'bot' as const,
        timestamp: new Date(),
        hotelRecommendations: [
          {
            id: 'hotel-1',
            name: 'Test Hotel',
            imageUrl: 'https://example.com/hotel.jpg',
            rating: 4.5,
            price: '$200',
            location: 'Downtown',
          },
          {
            id: 'hotel-2',
            name: 'Another Hotel',
            imageUrl: 'https://example.com/hotel2.jpg',
            rating: 4.2,
            price: '$150',
            location: 'Beachfront',
          },
        ],
      },
    ];

    render(
      <IMChatView
        messages={customMessages}
        selectedHotels={selectedHotels}
        onHotelSelect={mockOnHotelSelect}
      />,
    );

    // Check that comparison bar is shown
    expect(screen.getByText('1 hotel selected')).toBeInTheDocument();

    // Check that checkboxes are present
    const checkboxes = screen.getAllByRole('checkbox');

    expect(checkboxes).toHaveLength(2);
    expect(checkboxes[0]).toBeChecked(); // First hotel should be selected
    expect(checkboxes[1]).not.toBeChecked();

    // Click on the second hotel to select it
    const secondHotelCard = screen
      .getByText('Another Hotel')
      .closest('.IMChatView__hotelCard');
    await user.click(secondHotelCard!);

    expect(mockOnHotelSelect).toHaveBeenCalledWith('hotel-2', true);
  });

  it('shows compare button when multiple hotels are selected', () => {
    const selectedHotels = ['hotel-1', 'hotel-2'];

    const customMessages = [
      {
        id: '1',
        text: 'Here are some hotel recommendations:',
        sender: 'bot' as const,
        timestamp: new Date(),
        hotelRecommendations: [
          {
            id: 'hotel-1',
            name: 'Test Hotel',
            imageUrl: 'https://example.com/hotel.jpg',
            rating: 4.5,
            price: '$200',
            location: 'Downtown',
          },
          {
            id: 'hotel-2',
            name: 'Another Hotel',
            imageUrl: 'https://example.com/hotel2.jpg',
            rating: 4.2,
            price: '$150',
            location: 'Beachfront',
          },
        ],
      },
    ];

    render(
      <IMChatView messages={customMessages} selectedHotels={selectedHotels} />,
    );

    expect(screen.getByText('2 hotels selected')).toBeInTheDocument();
    expect(screen.getByText('Compare Selected')).toBeInTheDocument();
  });

  it('calls onHotelComparison when compare button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnHotelComparison = jest.fn();
    const selectedHotels = ['hotel-1', 'hotel-2'];

    const customMessages = [
      {
        id: '1',
        text: 'Here are some hotel recommendations:',
        sender: 'bot' as const,
        timestamp: new Date(),
        hotelRecommendations: [
          {
            id: 'hotel-1',
            name: 'Test Hotel',
            imageUrl: 'https://example.com/hotel.jpg',
            rating: 4.5,
            price: '$200',
            location: 'Downtown',
          },
          {
            id: 'hotel-2',
            name: 'Another Hotel',
            imageUrl: 'https://example.com/hotel2.jpg',
            rating: 4.2,
            price: '$150',
            location: 'Beachfront',
          },
        ],
      },
    ];

    render(
      <IMChatView
        messages={customMessages}
        selectedHotels={selectedHotels}
        onHotelComparison={mockOnHotelComparison}
      />,
    );

    const compareButton = screen.getByText('Compare Selected');
    await user.click(compareButton);

    // Wait for the comparison API simulation to complete
    await waitFor(
      () => {
        expect(mockOnHotelComparison).toHaveBeenCalledWith(
          expect.objectContaining({
            hotels: expect.arrayContaining([
              expect.objectContaining({ id: 'hotel-1', name: 'Test Hotel' }),
              expect.objectContaining({ id: 'hotel-2', name: 'Another Hotel' }),
            ]),
            comparisonData: expect.objectContaining({
              bestPrice: expect.any(Object),
              bestRating: expect.any(Object),
              summary: expect.any(String),
              pros: expect.any(Array),
              cons: expect.any(Array),
            }),
            timestamp: expect.any(Date),
          }),
        );
      },
      { timeout: 3000 },
    );
  });
});
