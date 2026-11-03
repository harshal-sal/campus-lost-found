import { Item, ItemMatch } from '../types';

const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'as', 'at',
  'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'could', 'did', 'do', 'does', 'doing', 'down', 'during',
  'each', 'few', 'for', 'from', 'further',
  'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how',
  'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself',
  'just', 'me', 'more', 'most', 'my', 'myself',
  'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'our', 'ours', 'ourselves', 'out', 'over', 'own',
  'same', 'she', 'should', 'so', 'some', 'such',
  'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too',
  'under', 'until', 'up', 'very', 'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'you', 'your', 'yours'
]);

function extractKeywords(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
}

export function calculateItemSimilarity(
  lostItem: Item,
  foundItem: Item
): { score: number; confidence: 'high' | 'medium' | 'low'; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // 1. Category Matching (Max 35 points)
  if (lostItem.category_id === foundItem.category_id) {
    score += 35;
    reasons.push('Same item category match');
  }

  // 2. Keyword Overlap in Title & Description (Max 30 points)
  const lostTokens = new Set([
    ...extractKeywords(lostItem.title),
    ...extractKeywords(lostItem.description),
    ...extractKeywords(lostItem.distinguishing_features || ''),
  ]);

  const foundTokens = new Set([
    ...extractKeywords(foundItem.title),
    ...extractKeywords(foundItem.description),
    ...extractKeywords(foundItem.distinguishing_features || ''),
  ]);

  const commonTokens = [...lostTokens].filter((token) => foundTokens.has(token));
  if (commonTokens.length > 0) {
    const keywordScore = Math.min(30, commonTokens.length * 8);
    score += keywordScore;
    reasons.push(`Matched keywords: ${commonTokens.slice(0, 4).join(', ')}`);
  }

  // 3. Location Matching (Max 20 points)
  if (lostItem.location_id === foundItem.location_id) {
    score += 20;
    reasons.push('Reported at the same campus building / location');
  } else if (
    lostItem.location_detail &&
    foundItem.location_detail &&
    extractKeywords(lostItem.location_detail).some((w) =>
      extractKeywords(foundItem.location_detail || '').includes(w)
    )
  ) {
    score += 10;
    reasons.push('Similar room / area details reported');
  }

  // 4. Date Proximity (Max 15 points)
  // Found date should typically be the same day or after the lost date
  const lostDate = new Date(lostItem.date_occurred).getTime();
  const foundDate = new Date(foundItem.date_occurred).getTime();

  if (!isNaN(lostDate) && !isNaN(foundDate)) {
    const diffDays = Math.abs(foundDate - lostDate) / (1000 * 60 * 60 * 24);
    if (diffDays <= 0.5) {
      score += 15;
      reasons.push('Identical date of occurrence');
    } else if (diffDays <= 2) {
      score += 12;
      reasons.push('Dates within 48 hours of each other');
    } else if (diffDays <= 5) {
      score += 8;
      reasons.push('Dates within 5 days of each other');
    } else if (diffDays <= 14) {
      score += 4;
      reasons.push('Reported within the same 2-week window');
    }
  }

  const finalScore = Math.min(100, Math.round(score));
  let confidence: 'high' | 'medium' | 'low' = 'low';
  if (finalScore >= 70) {
    confidence = 'high';
  } else if (finalScore >= 45) {
    confidence = 'medium';
  }

  return {
    score: finalScore,
    confidence,
    reasons,
  };
}

export function findMatchesForSingleItem(
  targetItem: Item,
  allItems: Item[]
): ItemMatch[] {
  const matches: ItemMatch[] = [];
  const oppositeType = targetItem.type === 'lost' ? 'found' : 'lost';

  // Find candidate items of opposite type that are active
  const candidates = allItems.filter(
    (item) =>
      item.type === oppositeType &&
      item.id !== targetItem.id &&
      item.status !== 'closed' &&
      item.status !== 'rejected' &&
      item.is_approved
  );

  for (const candidate of candidates) {
    const lostItem = targetItem.type === 'lost' ? targetItem : candidate;
    const foundItem = targetItem.type === 'found' ? targetItem : candidate;

    const { score, confidence, reasons } = calculateItemSimilarity(lostItem, foundItem);

    if (score >= 30) {
      matches.push({
        id: `match-${lostItem.id}-${foundItem.id}`,
        lost_item_id: lostItem.id,
        found_item_id: foundItem.id,
        similarity_score: score,
        confidence,
        match_reasons: reasons,
        status: 'potential',
        created_at: new Date().toISOString(),
        lost_item: lostItem,
        found_item: foundItem,
      });
    }
  }

  return matches.sort((a, b) => b.similarity_score - a.similarity_score);
}
