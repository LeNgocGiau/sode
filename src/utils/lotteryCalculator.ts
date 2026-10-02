import { BetRateConfig, BetType, CheoCombination, GroupedBetItem, ParsedBetItem, RegionType } from '../types/lottery';
import { BET_TYPE_DEFINITIONS, SPECIFIC_PRIZES } from '../data/defaultConfig';

/**
 * Clean and extract numbers from a text string.
 * Supports space, comma, dot, dash, newline separators.
 * e.g. "75 10 86 72" -> ["75", "10", "86", "72"]
 */
export function extractNumbersFromString(input: string): string[] {
  if (!input) return [];
  // Split by non-digit characters
  const rawParts = input.trim().split(/[^0-9]+/);
  // Filter empty strings and keep leading zeroes if any (e.g. "05", "00")
  return rawParts.filter((item) => item.length > 0);
}

export interface SmartParsedLine {
  rawLine: string;
  numbers: string[];
  betType?: BetType;
  specificPrizeId?: string;
  unitPrice?: number;
  hasSmartSyntax: boolean;
}

function normalizeVietnamese(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}

const SMART_BET_PATTERNS: {
  regex: RegExp;
  betType: BetType;
  specificPrizeId?: string;
}[] = [
  { regex: /\b(bao\s*lo\s*5\s*cuoi|bao\s*5\s*cuoi|lo\s*5\s*cuoi|5\s*cuoi|b5c)\b/i, betType: 'bao_5_cuoi' },
  { regex: /\b(12\s*lo\s*dau|12\s*giai\s*dau|12\s*dau|12d)\b/i, betType: '12_dau' },
  { regex: /\b(12\s*lo\s*cuoi|12\s*giai\s*cuoi|12\s*cuoi|12c)\b/i, betType: '12_cuoi' },
  { regex: /\b(xiu\s*chu\s*dau\s*duoi|xc\s*dau\s*duoi|xc\s*dd|xiu\s*chu\s*dd)\b/i, betType: 'xiu_chu_dau_duoi' },
  { regex: /\b(xiu\s*chu\s*dau|xc\s*dau|xcd)\b/i, betType: 'xiu_chu_dau' },
  { regex: /\b(xiu\s*chu\s*duoi|xc\s*duoi|xiu\s*chu\s*db|xc\s*db|xiu\s*chu|xc|3\s*cang\s*db|3\s*cang\s*de|3\s*cang)\b/i, betType: 'xiu_chu_duoi' },
  { regex: /\b(bao\s*lo\s*3\s*chan|bao\s*lo\s*3\s*so|bao\s*3\s*chan|bao\s*3\s*so|lo\s*3\s*chan|lo\s*3\s*so|3\s*chan)\b/i, betType: '3_chan_lo' },
  { regex: /\b(bao\s*lo\s*2\s*chan|bao\s*lo\s*2\s*so|bao\s*2\s*chan|bao\s*2\s*so|lo\s*2\s*chan|lo\s*2\s*so|2\s*chan|bao\s*lo|bao|bl|lo)\b/i, betType: '2_chan_lo' },
  { regex: /\b(dau\s*duoi|dd)\b/i, betType: 'dau_duoi' },
  { regex: /\b(dau\s*g8|dau\s*g7)\b/i, betType: 'dau_g8' },
  { regex: /\b(g8|giai\s*8)\b/i, betType: 'giai_cu_the', specificPrizeId: 'g8' },
  { regex: /\b(g7|giai\s*7)\b/i, betType: 'giai_cu_the', specificPrizeId: 'g7' },
  { regex: /\b(g6|giai\s*6)\b/i, betType: 'giai_cu_the', specificPrizeId: 'g6' },
  { regex: /\b(g5|giai\s*5)\b/i, betType: 'giai_cu_the', specificPrizeId: 'g5' },
  { regex: /\b(g4|giai\s*4)\b/i, betType: 'giai_cu_the', specificPrizeId: 'g4' },
  { regex: /\b(g3|giai\s*3)\b/i, betType: 'giai_cu_the', specificPrizeId: 'g3' },
  { regex: /\b(g2|giai\s*2)\b/i, betType: 'giai_cu_the', specificPrizeId: 'g2' },
  { regex: /\b(g1|giai\s*1|giai\s*nhat)\b/i, betType: 'giai_cu_the', specificPrizeId: 'g1' },
  { regex: /\b(gdb|giai\s*dac\s*biet)\b/i, betType: 'giai_cu_the', specificPrizeId: 'db' },
  { regex: /\b(chot\s*dac\s*biet|chot\s*db|dac\s*biet|chot|db|de|duoi)\b/i, betType: 'chot_db' },
  { regex: /\b(dau)\b/i, betType: 'dau_g8' },
  { regex: /\b(da\s*cheo|lo\s*da|da\s*vong|da|cheo|dv|dx)\b/i, betType: 'cheo_2_5' },
  { regex: /\b(xien\s*3|xien\s*ba|x3)\b/i, betType: 'xien_3' },
];

/**
 * Parse single or multi-line input that may contain natural syntax such as:
 * "78 87 94 64 13 bao lô 5k"
 * "169 847 Đb 2k"
 * "16 đá 58 3k"
 */
export function parseSmartBetLines(input: string): SmartParsedLine[] {
  if (!input || !input.trim()) return [];

  const rawLines = input
    .split(/\r?\n|;/)
    .map((l) => l.trim())
    .filter(Boolean);

  return rawLines
    .map((rawLine): SmartParsedLine => {
      // Normalize while keeping character length 1-to-1 with NFD stripped string
      let working = normalizeVietnamese(rawLine);
      let detectedBetType: BetType | undefined;
      let detectedSpecificPrizeId: string | undefined;
      let detectedUnitPrice: number | undefined;

      // 1. Detect money with explicit suffix (e.g. 5k, 2k, 3k, 10n, 2.000d)
      const moneySuffixRegex = /\b(\d+(?:[.,]\d+)?)\s*(k|n|ng|ngan|nghin|tr|trieu|d)\b/i;
      const moneyMatch = working.match(moneySuffixRegex);
      if (moneyMatch && moneyMatch.index !== undefined) {
        const rawNumStr = moneyMatch[1];
        const unit = moneyMatch[2].toLowerCase();
        if (unit === 'd') {
          const digits = rawNumStr.replace(/\D/g, '');
          detectedUnitPrice = parseInt(digits, 10) || 0;
        } else if (unit === 'tr' || unit === 'trieu') {
          const val = parseFloat(rawNumStr.replace(',', '.'));
          detectedUnitPrice = Math.round(val * 1000000);
        } else {
          // k, n, ng, ngan, nghin
          // Check if rawNumStr is thousand-dotted like "2.000k" vs decimal "2.5k"
          if (/^\d{1,3}(\.\d{3})+$/.test(rawNumStr)) {
            detectedUnitPrice = parseInt(rawNumStr.replace(/\./g, ''), 10);
          } else {
            const val = parseFloat(rawNumStr.replace(',', '.'));
            detectedUnitPrice = Math.round(val * 1000);
          }
        }
        // Replace matched money token with spaces so its digits aren't extracted as lottery numbers
        working =
          working.slice(0, moneyMatch.index) +
          ' '.repeat(moneyMatch[0].length) +
          working.slice(moneyMatch.index + moneyMatch[0].length);
      }

      // 2. Detect bet type keyword
      for (const pattern of SMART_BET_PATTERNS) {
        const match = working.match(pattern.regex);
        if (match && match.index !== undefined) {
          detectedBetType = pattern.betType;
          if (pattern.specificPrizeId) {
            detectedSpecificPrizeId = pattern.specificPrizeId;
          }
          // Remove the matched bet type phrase so digits inside "5 cuoi", "12 dau", "2 chan", "g8" aren't extracted as bet numbers
          working =
            working.slice(0, match.index) +
            ' '.repeat(match[0].length) +
            working.slice(match.index + match[0].length);
          break;
        }
      }

      // 3. If no suffix money was found, but a bet type WAS found, check if the line ends with a thousand-formatted amount (e.g. "2.000" or "5000")
      if (!detectedUnitPrice && detectedBetType) {
        const trailingMoneyRegex = /(\d{1,3}(?:\.\d{3})+|\b\d{4,})\s*$/;
        const trailingMatch = working.match(trailingMoneyRegex);
        if (trailingMatch && trailingMatch.index !== undefined) {
          const digits = trailingMatch[1].replace(/\D/g, '');
          const parsedVal = parseInt(digits, 10);
          if (parsedVal >= 1000) {
            detectedUnitPrice = parsedVal;
            working =
              working.slice(0, trailingMatch.index) +
              ' '.repeat(trailingMatch[0].length) +
              working.slice(trailingMatch.index + trailingMatch[0].length);
          }
        }
      }

      // 4. Extract remaining numbers as the lottery numbers to bet
      const numbers = working
        .trim()
        .split(/[^0-9]+/)
        .filter((item) => item.length > 0);

      const hasSmartSyntax = Boolean(detectedBetType || detectedUnitPrice);

      return {
        rawLine,
        numbers,
        betType: detectedBetType,
        specificPrizeId: detectedSpecificPrizeId,
        unitPrice: detectedUnitPrice,
        hasSmartSyntax,
      };
    })
    .filter((line) => line.numbers.length > 0 || line.hasSmartSyntax);
}

/**
 * Generate 2-element combinations from an array of numbers (for Chéo / Đá)
 * C(n, 2)
 */
export function generatePairs(numbers: string[]): CheoCombination[] {
  const uniqueNumbers = Array.from(new Set(numbers));
  const combinations: CheoCombination[] = [];
  
  for (let i = 0; i < uniqueNumbers.length; i++) {
    for (let j = i + 1; j < uniqueNumbers.length; j++) {
      combinations.push({
        pair: [uniqueNumbers[i], uniqueNumbers[j]],
        label: `${uniqueNumbers[i]} - ${uniqueNumbers[j]}`,
      });
    }
  }
  return combinations;
}

/**
 * Calculate the number of prizes for a specific bet type, region, and rate configs
 */
export function getPrizesForBetType(
  betType: BetType,
  region: RegionType,
  specificPrizeId?: string,
  rateConfigs?: BetRateConfig[]
): number {
  // If user has customized rate configs, try to find it
  if (rateConfigs) {
    const customConfig = rateConfigs.find(
      (c) => c.region === region && c.betType === betType
    );
    if (customConfig && customConfig.defaultPrizesCount > 0) {
      return customConfig.defaultPrizesCount;
    }
  }

  // Fallback to definition formula
  const def = BET_TYPE_DEFINITIONS.find((d) => d.type === betType);
  if (!def) return 1;
  return def.getPrizesCount(region, specificPrizeId);
}

/**
 * Build parsed bet items from an array of numbers and user selections
 */
export function buildBetItems(
  numbers: string[],
  betType: BetType,
  region: RegionType,
  unitPrice: number,
  specificPrizeId?: string,
  rateConfigs?: BetRateConfig[]
): ParsedBetItem[] {
  if (numbers.length === 0 || unitPrice <= 0) return [];

  const def = BET_TYPE_DEFINITIONS.find((d) => d.type === betType);
  const typeName = def ? def.label : betType;

  // Case 1: Chéo 2 con đến 5 con (Lô đá)
  if (betType === 'cheo_2_5') {
    const pairs = generatePairs(numbers);
    if (pairs.length === 0) return [];

    const prizesPerPair = getPrizesForBetType(betType, region, specificPrizeId, rateConfigs);
    
    return pairs.map((combo, index) => {
      const itemTotal = prizesPerPair * unitPrice;
      return {
        id: `cheo-${index}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        number: combo.label,
        betType,
        betTypeName: `Đá Chéo (${combo.label})`,
        prizesCount: prizesPerPair,
        unitPrice,
        itemTotal,
        notes: `Cặp đá: ${combo.label} (${prizesPerPair} vòng x ${new Intl.NumberFormat('vi-VN').format(unitPrice)}₫)`,
      };
    });
  }

  // Case 2: Xiên 3 con
  if (betType === 'xien_3') {
    const groupLabel = numbers.join(' - ');
    const prizesCount = getPrizesForBetType(betType, region, specificPrizeId, rateConfigs);
    const itemTotal = prizesCount * unitPrice;

    return [
      {
        id: `xien3-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        number: groupLabel,
        betType,
        betTypeName: 'Xiên 3 Con',
        prizesCount,
        unitPrice,
        itemTotal,
        notes: `Bộ xiên 3: ${groupLabel} (${prizesCount} vòng x ${new Intl.NumberFormat('vi-VN').format(unitPrice)}₫)`,
      },
    ];
  }

  // Case 3: Regular bet types (2 chân, bao 5 cuối, 12 đầu, 12 cuối, chót ĐB, G8, xỉu chủ...)
  const prizesCount = getPrizesForBetType(betType, region, specificPrizeId, rateConfigs);

  let specificPrizeName = '';
  if (betType === 'giai_cu_the' && specificPrizeId) {
    const prize = SPECIFIC_PRIZES.find((p) => p.id === specificPrizeId);
    if (prize) specificPrizeName = prize.name;
  }

  return numbers.map((num, index) => {
    const itemTotal = prizesCount * unitPrice;
    const finalTypeName = specificPrizeName ? `Giải: ${specificPrizeName}` : typeName;

    return {
      id: `item-${index}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      number: num,
      betType,
      betTypeName: finalTypeName,
      specificPrizeId,
      prizesCount,
      unitPrice,
      itemTotal,
      notes: `${prizesCount} giải x ${new Intl.NumberFormat('vi-VN').format(unitPrice)}₫`,
    };
  });
}

/**
 * Group bet items that share the same betType, specificPrizeId, prizesCount, and unitPrice
 * into a single summary row (e.g. "77, 66, 55 | Bao Lô 5 Cuối | 5 giải | 2.000 ₫ | 30.000 ₫")
 * while keeping the individual items array for expanding details.
 */
export function groupBetItems(items: ParsedBetItem[]): GroupedBetItem[] {
  const map = new Map<string, GroupedBetItem>();

  items.forEach((item) => {
    const cleanTypeName = item.betType === 'cheo_2_5' ? 'Đá Chéo (Lô Đá)' : item.betTypeName;
    const key = `${item.betType}__${cleanTypeName}__${item.specificPrizeId || ''}__${item.prizesCount}__${item.unitPrice}`;

    const existing = map.get(key);
    if (existing) {
      existing.numbers.push(item.number);
      existing.numbersLabel = existing.numbers.join(', ');
      existing.totalPrizes += item.prizesCount;
      existing.groupTotal += item.itemTotal;
      existing.items.push(item);
    } else {
      map.set(key, {
        groupKey: key,
        numbers: [item.number],
        numbersLabel: item.number,
        betType: item.betType,
        betTypeName: cleanTypeName,
        specificPrizeId: item.specificPrizeId,
        prizesCount: item.prizesCount,
        totalPrizes: item.prizesCount,
        unitPrice: item.unitPrice,
        groupTotal: item.itemTotal,
        items: [item],
      });
    }
  });

  return Array.from(map.values());
}

