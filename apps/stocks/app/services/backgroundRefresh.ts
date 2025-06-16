import { generateStockArticle } from './geminiService';
import { setCachedArticle } from './cacheService';
import { Mutex } from 'async-mutex';

// Single shared mutex for all refresh operations
const refreshMutex = new Mutex();
const runningRefreshJobs = new Set<string>();

export async function triggerBackgroundRefresh(symbol: string) {
  // Quick check outside mutex - if already running, don't even queue
  if (runningRefreshJobs.has(symbol)) {
    console.log(`⏭️ Background refresh already running for ${symbol}, skipping queue`);
    return;
  }

  // Acquire shared mutex lock
  return await refreshMutex.runExclusive(async () => {
    // Double-check inside critical section
    if (runningRefreshJobs.has(symbol)) {
      console.log(`🔄 Background refresh already in progress for ${symbol}`);
      return;
    }

    // Mark symbol as running
    runningRefreshJobs.add(symbol);
    console.log(`🚀 Starting background refresh for ${symbol}...`);

    try {
      await refreshStockContent(symbol);
      console.log(`✅ Background refresh completed for ${symbol}`);
    } catch (error) {
      console.error(`❌ Background refresh failed for ${symbol}:`, error);
    } finally {
      // Always remove from running jobs when complete
      runningRefreshJobs.delete(symbol);
    }
  });
}

async function refreshStockContent(symbol: string) {
  try {
    const article = await generateStockArticle(symbol);

    if (article) {
      await setCachedArticle(symbol, article, null);
      console.log(`📄 Fresh content cached for ${symbol}`);
    } else {
      console.log(`⚠️ Failed to generate article for ${symbol}`);
    }
  } catch (error) {
    console.error(`❌ Error refreshing ${symbol}:`, error);
    throw error;
  }
}