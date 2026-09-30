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

