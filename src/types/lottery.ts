export type RegionType = 'MN' | 'MT' | 'MB';

export interface RegionInfo {
  id: RegionType;
  name: string;
  shortName: string;
  totalPrizes: number; // 18 for MN/MT, 27 for MB
  description: string;
}

export type BetType = 
  | '2_chan_lo'         // Bao lô 2 con (MN/MT: 18 giải, MB: 27 giải)
  | '3_chan_lo'         // Bao lô 3 con (MN/MT: 17 giải, MB: 23 giải)
  | 'giai_cu_the'       // Giải cụ thể (chọn G8, G7, G6, G5, G4, G3, G2, G1, ĐB)
  | 'dau_g8'            // Đầu (G8 MN/MT = 1 giải, G7 MB = 4 giải)
  | 'chot_db'           // Chót/Đuôi Đặc biệt (1 giải)
  | 'dau_duoi'          // Đầu Đuôi (G8 + ĐB = 2 giải)
  | 'cheo_2_5'          // Lô đá chéo 2 con đến 5 con
  | 'xien_3'            // Xiên 3 con
  | '12_dau'            // 12 lô đầu
  | '12_cuoi'           // 12 lô cuối
  | 'bao_5_cuoi'        // Bao lô 5 cuối (ví dụ của người dùng: 5 giải cuối)
  | 'xiu_chu_dau'       // Xỉu chủ đầu (G7 MN/MT: 1 giải)
  | 'xiu_chu_duoi'      // Xỉu chủ đuôi (ĐB 3 số: 1 giải)
  | 'xiu_chu_dau_duoi'; // Xỉu chủ đầu đuôi (2 giải)

export interface SpecificPrizeOption {
  id: string;
  name: string;
  numDigits: number; // 2, 3, 4 digits
  prizesCountMN: number; // số giải ở MN/MT
  prizesCountMB: number; // số giải ở MB
}

export interface BetRateConfig {
  region: RegionType;
  betType: BetType;
  name: string;
  description: string;
  defaultPrizesCount: number; // Số giải mở thưởng tương ứng
  costMultiplier: number;     // Hệ số tiền tính (mặc định 1.0 hoặc theo quy ước điểm)
  payoutRate: number;         // Tỷ lệ trúng thưởng (VD: 1 ăn 75, 1 ăn 80, 1 ăn 650...)
}

export interface ParsedBetItem {
  id: string;
  number: string;             // Con số đánh (vd: "75", "778")
  betType: BetType;
  betTypeName: string;
  specificPrizeId?: string;   // Nếu là giải cụ thể
  prizesCount: number;        // Số giải tính (vd: bao 5 cuối -> 5 giải, chót ĐB -> 1 giải)
  unitPrice: number;          // Tiền cược trên 1 giải của con đó (vd: 2.000 đ)
  itemTotal: number;          // Thành tiền = prizesCount * unitPrice
  notes?: string;
}

export interface GroupedBetItem {
  groupKey: string;
  numbers: string[];
  numbersLabel: string;       // VD: "77, 66, 55"
  betType: BetType;
  betTypeName: string;        // VD: "Bao Lô 5 Cuối"
  specificPrizeId?: string;
  prizesCount: number;        // Số giải mỗi con (VD: 5 giải)
  totalPrizes: number;        // Tổng số giải cả nhóm (VD: 15 giải)
  unitPrice: number;          // Tiền 1 giải (VD: 2.000 đ)
  groupTotal: number;         // Tổng thành tiền cả nhóm (VD: 30.000 đ)
  items: ParsedBetItem[];     // Các dòng chi tiết bên trong để sổ xuống
}

export interface CheoCombination {
  pair: [string, string];
  label: string;
}

export interface CustomerBetTicket {
  id: string;
  customerName: string;
  date: string;               // YYYY-MM-DD
  region: RegionType;
  stationName?: string;       // Tên đài (vd: TP.HCM, Tiền Giang, Hà Nội...)
  items: ParsedBetItem[];
  totalAmount: number;
  totalPrizesAccumulated: number;
  createdAt: number;
  notes?: string;
}

export interface NumberStatisticRow {
  number: string;
  digits: number;             // 2 số hoặc 3 số
  totalAmount: number;
  totalPrizes: number;
  timesBet: number;           // Số lượt đánh con này
  customers: { customerName: string; amount: number; betTypeName: string }[];
}

export interface DailySummary {
  date: string;
  totalAmountAll: number;
  totalAmountMB: number;
  totalAmountMT: number;
  totalAmountMN: number;
  totalCustomers: number;
  totalTickets: number;
}
