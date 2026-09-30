import { BetRateConfig, BetType, RegionInfo, SpecificPrizeOption, CustomerBetTicket } from '../types/lottery';
import { getYesterdayDateString } from '../utils/formatters';

export const REGIONS: RegionInfo[] = [
  {
    id: 'MN',
    name: 'Miền Nam',
    shortName: 'MN',
    totalPrizes: 18,
    description: '18 giải mở thưởng mỗi đài (G8 đến Đặc Biệt)',
  },
  {
    id: 'MT',
    name: 'Miền Trung',
    shortName: 'MT',
    totalPrizes: 18,
    description: '18 giải mở thưởng mỗi đài (G8 đến Đặc Biệt)',
  },
  {
    id: 'MB',
    name: 'Miền Bắc',
    shortName: 'MB',
    totalPrizes: 27,
    description: '27 giải mở thưởng (G7 đến Đặc Biệt, Hà Nội)',
  },
];

export const SPECIFIC_PRIZES: SpecificPrizeOption[] = [
  { id: 'g8', name: 'Giải 8 (Đầu MN/MT)', numDigits: 2, prizesCountMN: 1, prizesCountMB: 0 },
  { id: 'g7', name: 'Giải 7', numDigits: 2, prizesCountMN: 1, prizesCountMB: 4 },
  { id: 'g6', name: 'Giải 6', numDigits: 3, prizesCountMN: 3, prizesCountMB: 3 },
  { id: 'g5', name: 'Giải 5', numDigits: 4, prizesCountMN: 1, prizesCountMB: 6 },
  { id: 'g4', name: 'Giải 4', numDigits: 4, prizesCountMN: 7, prizesCountMB: 4 },
  { id: 'g3', name: 'Giải 3', numDigits: 5, prizesCountMN: 2, prizesCountMB: 6 },
  { id: 'g2', name: 'Giải 2', numDigits: 5, prizesCountMN: 1, prizesCountMB: 2 },
  { id: 'g1', name: 'Giải Nhất', numDigits: 5, prizesCountMN: 1, prizesCountMB: 1 },
  { id: 'db', name: 'Giải Đặc Biệt (Chót)', numDigits: 2, prizesCountMN: 1, prizesCountMB: 1 },
];

export const BET_TYPE_DEFINITIONS: {
  type: BetType;
  label: string;
  category: '2so' | '3so' | 'dacbiet' | 'xien_da' | 'khac';
  badge: string;
  defaultDigits: number;
  description: string;
  getPrizesCount: (region: 'MN' | 'MT' | 'MB', specificPrizeId?: string) => number;
}[] = [
  {
    type: '2_chan_lo',
    label: '2 Chân (Bao Lô 2 Số)',
    category: '2so',
    badge: '18/27 giải',
    defaultDigits: 2,
    description: 'Đánh 2 số cuối của tất cả các giải (MN/MT: 18 giải, MB: 27 giải)',
    getPrizesCount: (region) => (region === 'MB' ? 27 : 18),
  },
  {
    type: 'bao_5_cuoi',
    label: 'Bao Lô 5 Cuối',
    category: '2so',
    badge: '5 giải',
    defaultDigits: 2,
    description: 'Bao 5 giải cuối mở thưởng (5 giải x tiền cược)',
    getPrizesCount: () => 5,
  },
  {
    type: '12_dau',
    label: '12 Đầu (12 Lô Đầu)',
    category: '2so',
    badge: '12 giải',
    defaultDigits: 2,
    description: 'Đánh 12 giải đầu tiên mở thưởng',
    getPrizesCount: () => 12,
  },
  {
    type: '12_cuoi',
    label: '12 Cuối (12 Lô Cuối)',
    category: '2so',
    badge: '12 giải',
    defaultDigits: 2,
    description: 'Đánh 12 giải cuối cùng mở thưởng',
    getPrizesCount: () => 12,
  },
  {
    type: 'dau_g8',
    label: 'Đầu (Giải 8 / G7)',
    category: 'dacbiet',
    badge: '1/4 giải',
    defaultDigits: 2,
    description: 'Miền Nam/Trung: Giải 8 (1 giải). Miền Bắc: Giải 7 (4 giải)',
    getPrizesCount: (region) => (region === 'MB' ? 4 : 1),
  },
  {
    type: 'chot_db',
    label: 'Chót ĐB (Đuôi / Đề)',
    category: 'dacbiet',
    badge: '1 giải',
    defaultDigits: 2,
    description: '2 số cuối giải Đặc Biệt (1 giải)',
    getPrizesCount: () => 1,
  },
  {
    type: 'dau_duoi',
    label: 'Đầu Đuôi',
    category: 'dacbiet',
    badge: '2 giải',
    defaultDigits: 2,
    description: 'Gồm Giải 8 và Giải Đặc Biệt (MN/MT: 2 giải, MB: 5 giải)',
    getPrizesCount: (region) => (region === 'MB' ? 5 : 2),
  },
  {
    type: '3_chan_lo',
    label: '3 Chân (Bao Lô 3 Số)',
    category: '3so',
    badge: '17/23 giải',
    defaultDigits: 3,
    description: '3 số cuối các giải từ 3 chữ số trở lên (MN/MT: 17 giải, MB: 23 giải)',
    getPrizesCount: (region) => (region === 'MB' ? 23 : 17),
  },
  {
    type: 'xiu_chu_dau',
    label: 'Xỉu Chủ Đầu (XC Đầu)',
    category: '3so',
    badge: '1 giải',
    defaultDigits: 3,
    description: 'Giải 7 Miền Nam / Trung (1 giải 3 chữ số)',
    getPrizesCount: () => 1,
  },
  {
    type: 'xiu_chu_duoi',
    label: 'Xỉu Chủ Đuôi / 3 Càng ĐB',
    category: '3so',
    badge: '1 giải',
    defaultDigits: 3,
    description: '3 số cuối Giải Đặc Biệt (1 giải)',
    getPrizesCount: () => 1,
  },
  {
    type: 'xiu_chu_dau_duoi',
    label: 'Xỉu Chủ Đầu Đuôi',
    category: '3so',
    badge: '2 giải',
    defaultDigits: 3,
    description: 'Gồm XC Đầu + XC Đuôi (2 giải)',
    getPrizesCount: () => 2,
  },
  {
    type: 'giai_cu_the',
    label: 'Giải Cụ Thể (G8, G7, G6...)',
    category: 'dacbiet',
    badge: 'Tùy chọn',
    defaultDigits: 2,
    description: 'Chỉ định đánh riêng vào một giải cụ thể (G8, G7, G4, ĐB...)',
    getPrizesCount: (region, specificPrizeId) => {
      const prize = SPECIFIC_PRIZES.find((p) => p.id === specificPrizeId);
      if (!prize) return 1;
      return region === 'MB' ? prize.prizesCountMB : prize.prizesCountMN;
    },
  },
  {
    type: 'cheo_2_5',
    label: 'Chéo 2 con đến 5 con (Lô Đá)',
    category: 'xien_da',
    badge: 'Tổ hợp cặp',
    defaultDigits: 2,
    description: 'Tự động tạo các cặp chéo (2 con: 1 cặp, 3 con: 3 cặp, 4 con: 6 cặp, 5 con: 10 cặp)',
    getPrizesCount: (region) => (region === 'MB' ? 27 : 18),
  },
  {
    type: 'xien_3',
    label: 'Xiên 3 Con',
    category: 'xien_da',
    badge: '1 vòng xiên',
    defaultDigits: 2,
    description: 'Đánh bộ 3 con cùng nổ (1 vòng xiên tính theo tiền cấu hình)',
    getPrizesCount: () => 1,
  },
];

export const DEFAULT_RATE_CONFIGS: BetRateConfig[] = [
  // Miền Nam
  { region: 'MN', betType: '2_chan_lo', name: 'Bao lô 2 chân MN', description: '18 giải', defaultPrizesCount: 18, costMultiplier: 1.0, payoutRate: 75 },
  { region: 'MN', betType: 'bao_5_cuoi', name: 'Bao lô 5 cuối MN', description: '5 giải cuối', defaultPrizesCount: 5, costMultiplier: 1.0, payoutRate: 75 },
  { region: 'MN', betType: '12_dau', name: '12 đầu MN', description: '12 giải đầu', defaultPrizesCount: 12, costMultiplier: 1.0, payoutRate: 75 },
  { region: 'MN', betType: '12_cuoi', name: '12 cuối MN', description: '12 giải cuối', defaultPrizesCount: 12, costMultiplier: 1.0, payoutRate: 75 },
  { region: 'MN', betType: 'dau_g8', name: 'Đầu G8 MN', description: 'Giải 8 (1 giải)', defaultPrizesCount: 1, costMultiplier: 1.0, payoutRate: 75 },
  { region: 'MN', betType: 'chot_db', name: 'Chót ĐB MN', description: 'Giải Đặc Biệt (1 giải)', defaultPrizesCount: 1, costMultiplier: 1.0, payoutRate: 75 },
  { region: 'MN', betType: 'dau_duoi', name: 'Đầu Đuôi MN', description: 'G8 + ĐB (2 giải)', defaultPrizesCount: 2, costMultiplier: 1.0, payoutRate: 75 },
  { region: 'MN', betType: '3_chan_lo', name: 'Bao lô 3 chân MN', description: '17 giải', defaultPrizesCount: 17, costMultiplier: 1.0, payoutRate: 650 },
  { region: 'MN', betType: 'xiu_chu_dau', name: 'Xỉu chủ đầu MN', description: 'G7 (1 giải)', defaultPrizesCount: 1, costMultiplier: 1.0, payoutRate: 650 },
  { region: 'MN', betType: 'xiu_chu_duoi', name: 'Xỉu chủ đuôi MN', description: 'ĐB 3 số (1 giải)', defaultPrizesCount: 1, costMultiplier: 1.0, payoutRate: 650 },
  { region: 'MN', betType: 'xiu_chu_dau_duoi', name: 'Xỉu chủ đầu đuôi MN', description: '2 giải', defaultPrizesCount: 2, costMultiplier: 1.0, payoutRate: 650 },
  { region: 'MN', betType: 'cheo_2_5', name: 'Đá chéo MN', description: 'Theo cặp x 18 vòng', defaultPrizesCount: 18, costMultiplier: 1.0, payoutRate: 750 },
  { region: 'MN', betType: 'xien_3', name: 'Xiên 3 MN', description: '1 vòng xiên 3', defaultPrizesCount: 1, costMultiplier: 1.0, payoutRate: 4000 },

  // Miền Bắc
  { region: 'MB', betType: '2_chan_lo', name: 'Bao lô 2 chân MB', description: '27 giải', defaultPrizesCount: 27, costMultiplier: 1.0, payoutRate: 80 },
  { region: 'MB', betType: 'bao_5_cuoi', name: 'Bao lô 5 cuối MB', description: '5 giải cuối', defaultPrizesCount: 5, costMultiplier: 1.0, payoutRate: 80 },
  { region: 'MB', betType: '12_dau', name: '12 đầu MB', description: '12 giải đầu', defaultPrizesCount: 12, costMultiplier: 1.0, payoutRate: 80 },
  { region: 'MB', betType: '12_cuoi', name: '12 cuối MB', description: '12 giải cuối', defaultPrizesCount: 12, costMultiplier: 1.0, payoutRate: 80 },
  { region: 'MB', betType: 'dau_g8', name: 'Đầu G7 MB', description: 'Giải 7 (4 giải)', defaultPrizesCount: 4, costMultiplier: 1.0, payoutRate: 80 },
  { region: 'MB', betType: 'chot_db', name: 'Chót ĐB / Đề MB', description: 'Giải Đặc Biệt (1 giải)', defaultPrizesCount: 1, costMultiplier: 1.0, payoutRate: 80 },
  { region: 'MB', betType: 'dau_duoi', name: 'Đầu Đuôi MB', description: 'G7 + ĐB (5 giải)', defaultPrizesCount: 5, costMultiplier: 1.0, payoutRate: 80 },
  { region: 'MB', betType: '3_chan_lo', name: 'Bao lô 3 chân MB', description: '23 giải', defaultPrizesCount: 23, costMultiplier: 1.0, payoutRate: 700 },
  { region: 'MB', betType: 'xiu_chu_duoi', name: '3 Càng Đề MB', description: '3 số ĐB (1 giải)', defaultPrizesCount: 1, costMultiplier: 1.0, payoutRate: 700 },
  { region: 'MB', betType: 'cheo_2_5', name: 'Đá chéo MB', description: 'Theo cặp x 27 vòng', defaultPrizesCount: 27, costMultiplier: 1.0, payoutRate: 800 },
  { region: 'MB', betType: 'xien_3', name: 'Xiên 3 MB', description: 'Xiên 3 MB (1 vòng)', defaultPrizesCount: 1, costMultiplier: 1.0, payoutRate: 4500 },

  // Miền Trung
  { region: 'MT', betType: '2_chan_lo', name: 'Bao lô 2 chân MT', description: '18 giải', defaultPrizesCount: 18, costMultiplier: 1.0, payoutRate: 75 },
  { region: 'MT', betType: 'bao_5_cuoi', name: 'Bao lô 5 cuối MT', description: '5 giải cuối', defaultPrizesCount: 5, costMultiplier: 1.0, payoutRate: 75 },
  { region: 'MT', betType: '12_dau', name: '12 đầu MT', description: '12 giải đầu', defaultPrizesCount: 12, costMultiplier: 1.0, payoutRate: 75 },
  { region: 'MT', betType: '12_cuoi', name: '12 cuối MT', description: '12 giải cuối', defaultPrizesCount: 12, costMultiplier: 1.0, payoutRate: 75 },
  { region: 'MT', betType: 'dau_g8', name: 'Đầu G8 MT', description: 'Giải 8 (1 giải)', defaultPrizesCount: 1, costMultiplier: 1.0, payoutRate: 75 },
  { region: 'MT', betType: 'chot_db', name: 'Chót ĐB MT', description: 'Giải Đặc Biệt (1 giải)', defaultPrizesCount: 1, costMultiplier: 1.0, payoutRate: 75 },
  { region: 'MT', betType: 'dau_duoi', name: 'Đầu Đuôi MT', description: 'G8 + ĐB (2 giải)', defaultPrizesCount: 2, costMultiplier: 1.0, payoutRate: 75 },
  { region: 'MT', betType: '3_chan_lo', name: 'Bao lô 3 chân MT', description: '17 giải', defaultPrizesCount: 17, costMultiplier: 1.0, payoutRate: 650 },
  { region: 'MT', betType: 'xiu_chu_dau', name: 'Xỉu chủ đầu MT', description: 'G7 (1 giải)', defaultPrizesCount: 1, costMultiplier: 1.0, payoutRate: 650 },
  { region: 'MT', betType: 'xiu_chu_duoi', name: 'Xỉu chủ đuôi MT', description: 'ĐB 3 số (1 giải)', defaultPrizesCount: 1, costMultiplier: 1.0, payoutRate: 650 },
  { region: 'MT', betType: 'cheo_2_5', name: 'Đá chéo MT', description: 'Theo cặp x 18 vòng', defaultPrizesCount: 18, costMultiplier: 1.0, payoutRate: 750 },
  { region: 'MT', betType: 'xien_3', name: 'Xiên 3 MT', description: 'Xiên 3 MT (1 vòng)', defaultPrizesCount: 1, costMultiplier: 1.0, payoutRate: 4000 },
];

/**
 * Initial sample tickets that demonstrate the exact user examples:
 * 1. Customer "Anh Ba (Chợ Lớn)":
 *    - 75, 10, 86, 72 bao lô 5 cuối con 2k (4 con x 5 giải x 2.000 = 40.000 đ)
 *    - 778, 694 đặc biệt 10k (2 con x 1 giải x 10.000 = 20.000 đ)
 *    -> Tổng cộng khách này = 60.000 đ
 * 2. Customer "Chị Mai (Hà Nội)" - Miền Bắc:
 *    - 19, 91 bao lô 2 chân con 5k (2 con x 27 giải x 5.000 = 270.000 đ)
 *    - 38, 83 chót ĐB con 20k (2 con x 1 giải x 20.000 = 40.000 đ)
 *    -> Tổng cộng = 310.000 đ
 * 3. Customer "Chú Tuấn (Đà Nẵng)" - Miền Trung:
 *    - Đá chéo 3 con: 23, 45, 67 con 1k (3 cặp x 18 giải x 1.000 = 54.000 đ)
 */
export const INITIAL_SAMPLE_TICKETS: CustomerBetTicket[] = [
  {
    id: 'ticket-demo-1',
    customerName: 'Anh Ba (Chợ Lớn)',
    date: getYesterdayDateString(),
    region: 'MN',
    stationName: 'TP.HCM / Đồng Tháp',
    items: [
      {
        id: 'item-1-1',
        number: '75',
        betType: 'bao_5_cuoi',
        betTypeName: 'Bao Lô 5 Cuối',
        prizesCount: 5,
        unitPrice: 2000,
        itemTotal: 10000,
        notes: '5 giải x 2.000₫',
      },
      {
        id: 'item-1-2',
        number: '10',
        betType: 'bao_5_cuoi',
        betTypeName: 'Bao Lô 5 Cuối',
        prizesCount: 5,
        unitPrice: 2000,
        itemTotal: 10000,
        notes: '5 giải x 2.000₫',
      },
      {
        id: 'item-1-3',
        number: '86',
        betType: 'bao_5_cuoi',
        betTypeName: 'Bao Lô 5 Cuối',
        prizesCount: 5,
        unitPrice: 2000,
        itemTotal: 10000,
        notes: '5 giải x 2.000₫',
      },
      {
        id: 'item-1-4',
        number: '72',
        betType: 'bao_5_cuoi',
        betTypeName: 'Bao Lô 5 Cuối',
        prizesCount: 5,
        unitPrice: 2000,
        itemTotal: 10000,
        notes: '5 giải x 2.000₫',
      },
      {
        id: 'item-1-5',
        number: '778',
        betType: 'chot_db',
        betTypeName: 'Chót ĐB (Đặc Biệt)',
        prizesCount: 1,
        unitPrice: 10000,
        itemTotal: 10000,
        notes: '1 giải x 10.000₫',
      },
      {
        id: 'item-1-6',
        number: '694',
        betType: 'chot_db',
        betTypeName: 'Chót ĐB (Đặc Biệt)',
        prizesCount: 1,
        unitPrice: 10000,
        itemTotal: 10000,
        notes: '1 giải x 10.000₫',
      },
    ],
    totalAmount: 60000,
    totalPrizesAccumulated: 22,
    createdAt: Date.now() - 1000 * 60 * 45,
    notes: 'Ví dụ chuẩn: 75 10 86 72 bao 5 cuối 2k + 778 694 đặc biệt 10k',
  },
  {
    id: 'ticket-demo-2',
    customerName: 'Chị Mai (Hà Nội)',
    date: getYesterdayDateString(),
    region: 'MB',
    stationName: 'Miền Bắc (Hà Nội)',
    items: [
      {
        id: 'item-2-1',
        number: '19',
        betType: '2_chan_lo',
        betTypeName: '2 Chân (Bao Lô MB)',
        prizesCount: 27,
        unitPrice: 5000,
        itemTotal: 135000,
        notes: '27 giải x 5.000₫',
      },
      {
        id: 'item-2-2',
        number: '91',
        betType: '2_chan_lo',
        betTypeName: '2 Chân (Bao Lô MB)',
        prizesCount: 27,
        unitPrice: 5000,
        itemTotal: 135000,
        notes: '27 giải x 5.000₫',
      },
      {
        id: 'item-2-3',
        number: '38',
        betType: 'chot_db',
        betTypeName: 'Đề / Chót ĐB MB',
        prizesCount: 1,
        unitPrice: 20000,
        itemTotal: 20000,
        notes: '1 giải x 20.000₫',
      },
      {
        id: 'item-2-4',
        number: '83',
        betType: 'chot_db',
        betTypeName: 'Đề / Chót ĐB MB',
        prizesCount: 1,
        unitPrice: 20000,
        itemTotal: 20000,
        notes: '1 giải x 20.000₫',
      },
    ],
    totalAmount: 310000,
    totalPrizesAccumulated: 56,
    createdAt: Date.now() - 1000 * 60 * 120,
    notes: 'Khách cược lớn đài Miền Bắc',
  },
];
