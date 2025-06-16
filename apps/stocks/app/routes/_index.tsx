import { Link } from "react-router";

export const meta = () => {
  return [
    { title: "Stock Articles" },
    { name: "description", content: "Browse stock articles and analysis" },
  ];
};

const STOCK_SYMBOLS = [
  "AAPL",
  "GOOGL",
  "MSFT",
  "TSLA",
  "NVDA",
];

export default function HomePage() {
  return (
    <div style={{ fontFamily: "Inter, system-ui, Avenir, Helvetica, Arial, sans-serif", padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Stock Articles</h1>
      <p>Select a stock symbol to view its article:</p>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {STOCK_SYMBOLS.map((symbol) => (
          <li key={symbol} style={{ margin: "0.5rem 0" }}>
            <Link 
              to={`/stock/${symbol}`}
              style={{ 
                color: "#0066cc", 
                textDecoration: "none",
                fontSize: "1.1rem"
              }}
            >
              {symbol}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}