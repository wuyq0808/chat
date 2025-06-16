import { promises as fs } from "fs";
import path from "path";

const CACHE_DIR = path.join(process.cwd(), ".cache", "articles");
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

interface CachedArticle {
  content: string;
  timestamp: number;
  stockInfo?: any;
  isExpired?: boolean;
}

async function ensureCacheDir() {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  } catch (error) {
    console.error("Error creating cache directory:", error);
  }
}

export async function getCachedArticle(symbol: string): Promise<CachedArticle | null> {
  try {
    await ensureCacheDir();
    const filePath = path.join(CACHE_DIR, `${symbol}.json`);
    const fileContent = await fs.readFile(filePath, "utf-8");
    const cached: CachedArticle = JSON.parse(fileContent);
    
    // Return cached data with expiration status
    return {
      ...cached,
      isExpired: Date.now() - cached.timestamp > CACHE_DURATION
    };
  } catch (error) {
    // File doesn't exist or error reading
    return null;
  }
}

export async function setCachedArticle(
  symbol: string, 
  content: string,
  stockInfo?: any
): Promise<void> {
  try {
    await ensureCacheDir();
    const filePath = path.join(CACHE_DIR, `${symbol}.json`);
    const cacheData: CachedArticle = {
      content,
      timestamp: Date.now(),
      stockInfo,
    };
    
    await fs.writeFile(filePath, JSON.stringify(cacheData, null, 2));
  } catch (error) {
    console.error("Error caching article:", error);
  }
}

export async function clearCache(): Promise<void> {
  try {
    await ensureCacheDir();
    const files = await fs.readdir(CACHE_DIR);
    
    for (const file of files) {
      if (file.endsWith(".json")) {
        await fs.unlink(path.join(CACHE_DIR, file));
      }
    }
  } catch (error) {
    console.error("Error clearing cache:", error);
  }
}