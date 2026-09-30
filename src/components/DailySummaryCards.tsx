import React, { useMemo, useState } from 'react';
import { CustomerBetTicket, GroupedBetItem, ParsedBetItem, RegionType } from '../types/lottery';
import { formatCurrency, formatDateDisplay } from '../utils/formatters';
import { groupBetItems } from '../utils/lotteryCalculator';
import { Coins, Users, Ticket, MapPin, BarChart3, Layers, Flame, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';

interface DailySummaryCardsProps {
  tickets: CustomerBetTicket[];
  selectedDate: string;
  selectedRegionFilter: 'ALL' | RegionType;
  onSelectRegionFilter: (region: 'ALL' | RegionType) => void;
  activeTab?: 'bets' | 'stats' | 'history' | 'rates';
  onOpenFullStats?: () => void;
}

interface QuickGroupedStatRow {
  id: string;
  customerName: string;
  region: RegionType;
  numbersLabel: string;
  betTypeName: string;
  prizesCount: number;
  totalPrizes: number;
  unitPrice: number;
  groupTotal: number;
  items: ParsedBetItem[];
}

export const DailySummaryCards: React.FC<DailySummaryCardsProps> = ({
  tickets,
  selectedDate,
  selectedRegionFilter,
  onSelectRegionFilter,
  activeTab,
  onOpenFullStats,
}) => {
  const [expandedQuickGroupIds, setExpandedQuickGroupIds] = useState<Record<string, boolean>>({});

  const toggleExpandQuickGroup = (id: string) => {
    setExpandedQuickGroupIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };
  // Filter tickets for selected date
  const dateTickets = useMemo(
    () => tickets.filter((t) => t.date === selectedDate),
    [tickets, selectedDate]
  );

  const ticketsMN = useMemo(() => dateTickets.filter((t) => t.region === 'MN'), [dateTickets]);
  const ticketsMT = useMemo(() => dateTickets.filter((t) => t.region === 'MT'), [dateTickets]);
  const ticketsMB = useMemo(() => dateTickets.filter((t) => t.region === 'MB'), [dateTickets]);

  const totalAmountAll = useMemo(
    () => dateTickets.reduce((sum, t) => sum + t.totalAmount, 0),
    [dateTickets]
  );
  const totalAmountMN = useMemo(
    () => ticketsMN.reduce((sum, t) => sum + t.totalAmount, 0),
    [ticketsMN]
  );
  const totalAmountMT = useMemo(
    () => ticketsMT.reduce((sum, t) => sum + t.totalAmount, 0),
    [ticketsMT]
  );
  const totalAmountMB = useMemo(
    () => ticketsMB.reduce((sum, t) => sum + t.totalAmount, 0),
    [ticketsMB]
  );

  const uniqueCustomersAll = useMemo(
    () => new Set(dateTickets.map((t) => t.customerName.trim().toLowerCase())).size,
    [dateTickets]
  );
  const totalBetItemsAll = useMemo(
    () => dateTickets.reduce((sum, t) => sum + t.items.length, 0),
    [dateTickets]
  );

  // Detailed statistics for the currently lit/selected card
  const activeCardTickets = useMemo(() => {
    if (selectedRegionFilter === 'MN') return ticketsMN;
    if (selectedRegionFilter === 'MT') return ticketsMT;
    if (selectedRegionFilter === 'MB') return ticketsMB;
    return dateTickets;
  }, [selectedRegionFilter, dateTickets, ticketsMN, ticketsMT, ticketsMB]);

  const activeCardStats = useMemo(() => {
    const totalAmount = activeCardTickets.reduce((sum, t) => sum + t.totalAmount, 0);
    const totalPrizes = activeCardTickets.reduce((sum, t) => sum + t.totalPrizesAccumulated, 0);
    const totalItems = activeCardTickets.reduce((sum, t) => sum + t.items.length, 0);
    const uniqueCustomers = new Set(
      activeCardTickets.map((t) => t.customerName.trim().toLowerCase())
    ).size;

    // Group by BetTypeName
    const byBetTypeMap = new Map<
      string,
      { betTypeName: string; count: number; totalPrizes: number; totalAmount: number }
    >();

    // Group by Number
    const byNumberMap = new Map<
      string,
      { number: string; count: number; totalPrizes: number; totalAmount: number }
    >();

    activeCardTickets.forEach((ticket) => {
      ticket.items.forEach((item) => {
        // Bet type aggregation
        const typeKey = item.betType === 'cheo_2_5' ? 'Đá Chéo' : item.betTypeName;
        const prevType = byBetTypeMap.get(typeKey) || {
          betTypeName: typeKey,
          count: 0,
          totalPrizes: 0,
          totalAmount: 0,
        };
        prevType.count += 1;
        prevType.totalPrizes += item.prizesCount;
        prevType.totalAmount += item.itemTotal;
        byBetTypeMap.set(typeKey, prevType);

        // Number aggregation
        const numKey = item.number.trim();
        const prevNum = byNumberMap.get(numKey) || {
          number: numKey,
          count: 0,
          totalPrizes: 0,
          totalAmount: 0,
        };
        prevNum.count += 1;
        prevNum.totalPrizes += item.prizesCount;
        prevNum.totalAmount += item.itemTotal;
        byNumberMap.set(numKey, prevNum);
      });
    });

    // Grouped customer batches (1 row per customer + betType + unitPrice)
    const groupedCustomerMap = new Map<string, QuickGroupedStatRow>();
    activeCardTickets.forEach((ticket) => {
      const grps: GroupedBetItem[] = groupBetItems(ticket.items);
      grps.forEach((grp) => {
        const mergeKey = `${ticket.customerName.trim().toLowerCase()}__${ticket.region}__${grp.groupKey}`;
        const existing = groupedCustomerMap.get(mergeKey);
        if (!existing) {
          groupedCustomerMap.set(mergeKey, {
            id: mergeKey,
            customerName: ticket.customerName,
            region: ticket.region,
            numbersLabel: grp.numbersLabel,
            betTypeName: grp.betTypeName,
            prizesCount: grp.prizesCount,
            totalPrizes: grp.totalPrizes,
            unitPrice: grp.unitPrice,
            groupTotal: grp.groupTotal,
            items: [...grp.items],
          });
        } else {
          existing.items.push(...grp.items);
          existing.totalPrizes += grp.totalPrizes;
          existing.groupTotal += grp.groupTotal;
          existing.numbersLabel = existing.items.map((i) => i.number).join(', ');
        }
      });
    });

    const groupedCustomerRows = Array.from(groupedCustomerMap.values()).sort(
      (a, b) => b.groupTotal - a.groupTotal
    );

    const betTypesBreakdown = Array.from(byBetTypeMap.values()).sort(
      (a, b) => b.totalAmount - a.totalAmount
    );
    const topNumbers = Array.from(byNumberMap.values())
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 8);

    return {
      totalAmount,
      totalPrizes,
      totalItems,
      uniqueCustomers,
      ticketsCount: activeCardTickets.length,
      betTypesBreakdown,
      groupedCustomerRows,
      topNumbers,
      uniqueNumbersCount: byNumberMap.size,
    };
  }, [activeCardTickets]);

  const isAllSelected = selectedRegionFilter === 'ALL';
  const isMNSelected = selectedRegionFilter === 'MN';
  const isMTSelected = selectedRegionFilter === 'MT';
  const isMBSelected = selectedRegionFilter === 'MB';

  const activeRegionMeta = {
    ALL: {
      title: 'Tất Cả 3 Miền (Bắc - Trung - Nam)',
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      borderClass: 'border-amber-500/40 bg-slate-900/95',
      accentText: 'text-amber-300',
    },
    MN: {
      title: 'Miền Nam (18 Lô)',
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      borderClass: 'border-emerald-500/50 bg-emerald-950/15',
      accentText: 'text-emerald-300',
    },
    MT: {
      title: 'Miền Trung (18 Lô)',
      badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      borderClass: 'border-cyan-500/50 bg-cyan-950/15',
      accentText: 'text-cyan-300',
    },
    MB: {
      title: 'Miền Bắc (27 Lô)',
      badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      borderClass: 'border-rose-500/50 bg-rose-950/15',
      accentText: 'text-rose-300',
    },
  }[selectedRegionFilter];

  return (
    <div className="mb-6 space-y-3">
      {/* 4 Interactive Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Card 1: Total All Customers */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onSelectRegionFilter('ALL')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onSelectRegionFilter('ALL');
          }}
          className={`lg:col-span-2 p-4 rounded-xl border relative overflow-hidden transition-all duration-200 cursor-pointer select-none ${
            isAllSelected
              ? 'bg-gradient-to-br from-amber-500/20 via-slate-900 to-slate-950 border-amber-400 ring-2 ring-amber-400/40 shadow-lg shadow-amber-500/15 scale-[1.01]'
              : 'bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800 hover:border-amber-500/40 opacity-80 hover:opacity-100'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-amber-400 font-medium">
            <div className="flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>TỔNG TIỀN TẤT CẢ KHÁCH</span>
              {isAllSelected && (
                <span className="ml-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-pulse" />
                  ĐANG CHỌN
                </span>
              )}
            </div>
            <span className="text-slate-400 font-mono text-[11px]">
              {formatDateDisplay(selectedDate)}
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-amber-300 tabular-nums tracking-tight">
              {formatCurrency(totalAmountAll)}
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-amber-400/80" />
              <span>{uniqueCustomersAll} khách hàng</span>
            </div>
            <span aria-hidden="true" className="text-slate-700">·</span>
            <div className="flex items-center gap-1">
              <Ticket className="w-3.5 h-3.5 text-amber-400/80" />
              <span>{dateTickets.length} vé ({totalBetItemsAll} con số)</span>
            </div>
          </div>
        </div>

        {/* Card 2: Miền Nam */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onSelectRegionFilter('MN')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onSelectRegionFilter('MN');
          }}
          className={`p-4 rounded-xl border flex flex-col justify-between transition-all duration-200 cursor-pointer select-none ${
            isMNSelected
              ? 'bg-gradient-to-br from-emerald-500/25 via-slate-900 to-slate-950 border-emerald-400 ring-2 ring-emerald-400/40 shadow-lg shadow-emerald-500/15 scale-[1.02]'
              : 'bg-slate-900/90 border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900 opacity-80 hover:opacity-100'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              Miền Nam (18 Lô)
            </span>
            <div className="flex items-center gap-1.5">
              {isMNSelected && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
              )}
              <span
                className={`text-[11px] font-mono px-1.5 py-0.5 rounded ${
                  isMNSelected
                    ? 'bg-emerald-400 text-slate-950 font-bold'
                    : 'text-slate-400 bg-slate-950'
                }`}
              >
                {ticketsMN.length} vé
              </span>
            </div>
          </div>
          <div className="mt-2">
            <div
              className={`text-lg font-bold font-mono tabular-nums ${
                isMNSelected ? 'text-emerald-300' : 'text-white'
              }`}
            >
              {formatCurrency(totalAmountMN)}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-0.5">
              <span>
                {totalAmountAll > 0
                  ? `${Math.round((totalAmountMN / totalAmountAll) * 100)}% tổng ngày`
                  : '0%'}
              </span>
              {isMNSelected && (
                <span className="text-[10px] font-bold text-emerald-300 uppercase">
                  ● Đang xem
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Card 3: Miền Trung */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onSelectRegionFilter('MT')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onSelectRegionFilter('MT');
          }}
          className={`p-4 rounded-xl border flex flex-col justify-between transition-all duration-200 cursor-pointer select-none ${
            isMTSelected
              ? 'bg-gradient-to-br from-cyan-500/25 via-slate-900 to-slate-950 border-cyan-400 ring-2 ring-cyan-400/40 shadow-lg shadow-cyan-500/15 scale-[1.02]'
              : 'bg-slate-900/90 border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900 opacity-80 hover:opacity-100'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="text-cyan-400 font-bold flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              Miền Trung (18 Lô)
            </span>
            <div className="flex items-center gap-1.5">
              {isMTSelected && (
                <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" />
              )}
              <span
                className={`text-[11px] font-mono px-1.5 py-0.5 rounded ${
                  isMTSelected
                    ? 'bg-cyan-400 text-slate-950 font-bold'
                    : 'text-slate-400 bg-slate-950'
                }`}
              >
                {ticketsMT.length} vé
              </span>
            </div>
          </div>
          <div className="mt-2">
            <div
              className={`text-lg font-bold font-mono tabular-nums ${
                isMTSelected ? 'text-cyan-300' : 'text-white'
              }`}
            >
              {formatCurrency(totalAmountMT)}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-0.5">
              <span>
                {totalAmountAll > 0
                  ? `${Math.round((totalAmountMT / totalAmountAll) * 100)}% tổng ngày`
                  : '0%'}
              </span>
              {isMTSelected && (
                <span className="text-[10px] font-bold text-cyan-300 uppercase">
                  ● Đang xem
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Card 4: Miền Bắc */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onSelectRegionFilter('MB')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onSelectRegionFilter('MB');
          }}
          className={`p-4 rounded-xl border flex flex-col justify-between transition-all duration-200 cursor-pointer select-none ${
            isMBSelected
              ? 'bg-gradient-to-br from-rose-500/25 via-slate-900 to-slate-950 border-rose-400 ring-2 ring-rose-400/40 shadow-lg shadow-rose-500/15 scale-[1.02]'
              : 'bg-slate-900/90 border-slate-800 hover:border-rose-500/50 hover:bg-slate-900 opacity-80 hover:opacity-100'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="text-rose-400 font-bold flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              Miền Bắc (27 Lô)
            </span>
            <div className="flex items-center gap-1.5">
              {isMBSelected && (
                <span className="w-2 h-2 rounded-full bg-rose-400 shadow-[0_0_8px_#fb7185] animate-pulse" />
              )}
              <span
                className={`text-[11px] font-mono px-1.5 py-0.5 rounded ${
                  isMBSelected
                    ? 'bg-rose-400 text-slate-950 font-bold'
                    : 'text-slate-400 bg-slate-950'
                }`}
              >
                {ticketsMB.length} vé
              </span>
            </div>
          </div>
          <div className="mt-2">
            <div
              className={`text-lg font-bold font-mono tabular-nums ${
                isMBSelected ? 'text-rose-300' : 'text-white'
              }`}
            >
              {formatCurrency(totalAmountMB)}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-0.5">
              <span>
                {totalAmountAll > 0
                  ? `${Math.round((totalAmountMB / totalAmountAll) * 100)}% tổng ngày`
                  : '0%'}
              </span>
              {isMBSelected && (
                <span className="text-[10px] font-bold text-rose-300 uppercase">
                  ● Đang xem
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Live Statistics Breakdown Panel for the Selected/Lit Card */}
      <div
        className={`rounded-xl border p-3 sm:p-4 transition-all duration-200 overflow-hidden ${activeRegionMeta.borderClass}`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
            <BarChart3 className={`w-4 h-4 shrink-0 ${activeRegionMeta.accentText}`} />
            <span className="text-xs sm:text-sm font-bold text-white">
              Thống Kê Số Liệu Của Ô:
            </span>
            <span
              className={`text-[11px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full border max-w-full truncate ${activeRegionMeta.badgeClass}`}
            >
              {activeRegionMeta.title}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 sm:gap-3 text-xs font-mono bg-slate-950/70 sm:bg-transparent p-2 sm:p-0 rounded-lg border border-slate-800/80 sm:border-0">
            <span className="text-slate-300">
              Khách: <strong className="text-white">{activeCardStats.uniqueCustomers}</strong>
            </span>
            <span className="hidden sm:inline text-slate-700">·</span>
            <span className="text-slate-300">
              Số vé: <strong className="text-white">{activeCardStats.ticketsCount} vé</strong>
            </span>
            <span className="hidden sm:inline text-slate-700">·</span>
            <span className="text-slate-300">
              Tổng giải: <strong className="text-white">{activeCardStats.totalPrizes} giải</strong>
            </span>
            <span className="hidden sm:inline text-slate-700">·</span>
            <span className="text-slate-300">
              Tổng tiền:{' '}
              <strong className={`${activeRegionMeta.accentText} text-xs sm:text-sm tabular-nums`}>
                {formatCurrency(activeCardStats.totalAmount)}
              </strong>
            </span>
          </div>
        </div>

        {activeCardStats.ticketsCount === 0 ? (
          <div className="py-4 text-center text-xs text-slate-400">
            Chưa có số liệu vé cược nào cho <strong>{activeRegionMeta.title}</strong> trong ngày{' '}
            {formatDateDisplay(selectedDate)}.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-3">
            {/* Breakdown by Bet Type */}
            <div className="lg:col-span-5 space-y-2 min-w-0">
              <div className="text-[11px] font-semibold text-slate-400 uppercase font-mono flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">
                  Thống kê theo hình thức cược ({activeCardStats.betTypesBreakdown.length} loại)
                </span>
              </div>
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-0.5">
                {activeCardStats.betTypesBreakdown.map((bt) => (
                  <div
                    key={bt.betTypeName}
                    className="flex items-center justify-between gap-2 bg-slate-950/80 border border-slate-800/80 rounded-lg px-2.5 py-2 text-xs"
                  >
                    <div className="min-w-0 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <span className="font-medium text-slate-200 break-words">
                        {bt.betTypeName}
                      </span>
                      <span className="self-start text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 shrink-0">
                        {bt.count} số · {bt.totalPrizes} giải
                      </span>
                    </div>
                    <span className="font-mono font-bold text-amber-300 tabular-nums shrink-0">
                      {formatCurrency(bt.totalAmount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Breakdown by Grouped Customer Rows in this Card */}
            <div className="lg:col-span-7 space-y-2 min-w-0">
              <div className="flex items-center justify-between flex-wrap gap-1.5">
                <div className="text-[11px] font-semibold text-slate-400 uppercase font-mono flex items-center gap-1.5 min-w-0">
                  <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="break-words">
                    Thống kê con số & khách đánh ({activeCardStats.groupedCustomerRows.length} dòng)
                  </span>
                </div>
                {activeTab !== 'stats' && onOpenFullStats && (
                  <button
                    type="button"
                    onClick={onOpenFullStats}
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 hover:underline cursor-pointer shrink-0"
                  >
                    <span>Mở bảng gom số đầy đủ</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-0.5">
                {activeCardStats.groupedCustomerRows.map((row) => {
                  const isExpanded = !!expandedQuickGroupIds[row.id];
                  return (
                    <div
                      key={row.id}
                      className="bg-slate-950/90 border border-slate-800/90 rounded-lg overflow-hidden"
                    >
                      <div
                        onClick={() => toggleExpandQuickGroup(row.id)}
                        className="p-2.5 cursor-pointer hover:bg-slate-900/80 transition-colors space-y-1.5"
                      >
                        {/* Top line: Customer + BetType + Count on left, Group Total + Expand icon on right */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                            <span className="text-xs font-bold text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-800 max-w-full truncate">
                              {row.customerName}
                            </span>
                            <span className="text-xs text-slate-300 font-medium">
                              {row.betTypeName}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              {row.items.length} số
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="font-mono font-bold text-xs sm:text-sm text-amber-300 tabular-nums">
                              {formatCurrency(row.groupTotal)}
                            </span>
                            <button
                              type="button"
                              className={`p-1 rounded border transition-colors ${
                                isExpanded
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                              }`}
                              title="Xem chi tiết từng con số"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5 text-amber-400" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Bottom line: Numbers list wrapped cleanly + formula */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-0.5">
                          <div className="font-mono font-bold text-xs sm:text-sm text-amber-300 tracking-wide break-words leading-relaxed">
                            {row.numbersLabel}
                          </div>
                          <span className="text-[11px] font-mono text-slate-400 shrink-0 tabular-nums">
                            {row.prizesCount} giải × {formatCurrency(row.unitPrice)}
                          </span>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="bg-slate-950 border-t border-slate-800/80 px-2.5 py-1.5 divide-y divide-slate-900 font-mono text-[11px]">
                          {row.items.map((item) => (
                            <div
                              key={item.id}
                              className="py-1 flex items-center justify-between gap-2 text-slate-300"
                            >
                              <span className="font-bold text-amber-200 shrink-0">
                                Số {item.number}
                              </span>
                              <span className="text-slate-400 tabular-nums text-right">
                                {item.prizesCount} giải × {formatCurrency(item.unitPrice)} ={' '}
                                <strong className="text-white">{formatCurrency(item.itemTotal)}</strong>
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

