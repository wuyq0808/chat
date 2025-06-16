import { Link, useLoaderData } from "react-router";
import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { getCachedArticle } from "../services/cacheService";
import { triggerBackgroundRefresh } from "../services/backgroundRefresh";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";

interface LoaderData {
  symbol: string;
  article: string | null;
  lastUpdated?: string;
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) {
    return [{ title: "Stock Not Found" }];
  }
  return [
    { title: data.symbol },
    { name: "description", content: `Investment analysis and insights for ${data.symbol} stock` },
  ];
};

export async function loader({ params }: LoaderFunctionArgs): Promise<LoaderData | null> {
  const symbol = params.symbol?.toUpperCase();
  
  if (!symbol) {
    throw new Response("Not Found", { status: 404 });
  }

  // Check cache and trigger background refresh if needed
  const cached = await getCachedArticle(symbol);
  if (cached) {
    // If cached content exists but is expired, trigger background refresh
    if (cached.isExpired) {
      console.log(`🔄 Cache expired for ${symbol}, triggering background refresh`);
      triggerBackgroundRefresh(symbol);
    }
    
    return {
      symbol,
      article: cached.content,
      lastUpdated: format(new Date(cached.timestamp), 'yyyy/MM/dd HH:mm:ss'),
    };
  }

  // No cache exists - trigger background refresh to create it
  console.log(`📝 No cache found for ${symbol}, triggering background refresh to create cache`);
  triggerBackgroundRefresh(symbol);
  
  return {
    symbol,
    article: null,
  };
}

export default function StockPage() {
  const data = useLoaderData<typeof loader>();

  if (!data || !data.article) {
    return (
      <div style={{ fontFamily: "Inter, system-ui, Avenir, Helvetica, Arial, sans-serif", padding: "2rem" }}>
        <h1>{data?.symbol}</h1>
        <div style={{ 
          backgroundColor: "#f0f8ff", 
          border: "1px solid #0066cc", 
          borderRadius: "8px", 
          padding: "1.5rem", 
          marginBottom: "2rem" 
        }}>
          <h3 style={{ marginTop: 0, color: "#0066cc" }}>📝 Generating Article...</h3>
          <p style={{ margin: 0 }}>
            We're generating a fresh analysis for {data?.symbol}. 
            Please check back in a minute for the latest market insights and investment analysis.
          </p>
        </div>
        <Link to="/" style={{ color: "#0066cc", textDecoration: "none" }}>
          ← Back to List
        </Link>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "Inter, system-ui, Avenir, Helvetica, Arial, sans-serif", padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <Link to="/" style={{ color: "#0066cc", textDecoration: "none", marginBottom: "1rem", display: "inline-block" }}>
        ← Back to List
      </Link>
      
      <h1>{data.symbol}</h1>
      
      <div style={{ 
        backgroundColor: "#f5f5f5", 
        padding: "0.75rem 1rem", 
        borderRadius: "6px", 
        marginBottom: "1rem",
        fontSize: "0.9rem",
        color: "#666"
      }}>
        <strong>Last Updated:</strong> {data.lastUpdated || 'No timestamp available'}
      </div>
      
      <article style={{ lineHeight: 1.6 }}>
        <ReactMarkdown>{data.article}</ReactMarkdown>
      </article>
    </div>
  );
}

