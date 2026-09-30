import React, { useState, useMemo, useEffect } from 'react';
import { CustomerBetTicket, GroupedBetItem, NumberStatisticRow, ParsedBetItem, RegionType } from '../types/lottery';
import { formatCurrency, formatDateDisplay, getTodayDateString, getYesterdayDateString } from '../utils/formatters';
import { groupBetItems } from '../utils/lotteryCalculator';
import { 
  Search, 
  ArrowUpDown, 
  Flame, 
  Filter, 
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Layers,
  Hash,
  Users,
  Calendar,
  MapPin
} from 'lucide-react';

interface NumberStatisticsProps {
  tickets: CustomerBetTicket[];
  selectedDate: string;
  onSelectDate?: (date: string) => void;
  regionFilter?: 'ALL' | RegionType;
  onRegionFilterChange?: (region: 'ALL' | RegionType) => void;
  onCopySuccess: (msg: string) => void;
}

interface GroupedCustomerStatRow {
  id: string;
  customerName: string;
  date: string;
  region: RegionType;
  stationName?: string;
  numbersLabel: string;
  betTypeName: string;
  digits: number;
  prizesCount: number;
  totalPrizes: number;
  unitPrice: number;
  groupTotal: number;
  items: ParsedBetItem[];
}

interface CustomerSummaryStatRow {
  customerKey: string;
  customerName: string;
  ticketCount: number;
  totalNumbers: number;
  totalPrizes: number;
  amountMN: number;
  amountMT: number;
  amountMB: number;
  totalAmount: number;
  groupedRows: GroupedCustomerStatRow[];
}

interface DateSummaryStatRow {
  date: string;
  customerCount: number;
  ticketCount: number;
  totalNumbers: number;
  totalPrizes: number;
  amountMN: number;
  amountMT: number;
  amountMB: number;
  totalAmount: number;
  groupedRows: GroupedCustomerStatRow[];
}

export const NumberStatistics: React.FC<NumberStatisticsProps> = ({
  tickets,
  selectedDate,
  onSelectDate,
  regionFilter: externalRegionFilter,
  onRegionFilterChange,
  onCopySuccess,
}) => {
  const [viewMode, setViewMode] = useState<'grouped' | 'by_customer' | 'by_date' | 'single_number'>('grouped');
  const [filterType, setFilterType] = useState<'ALL' | '2_DIGITS' | '3_DIGITS' | 'CHEO_XIEN'>('ALL');
  const [internalRegionFilter, setInternalRegionFilter] = useState<'ALL' | RegionType>('ALL');
  const regionFilter = externalRegionFilter !== undefined ? externalRegionFilter : internalRegionFilter;

  // Date filter inside NumberStatistics: defaults to selectedDate, or can be 'ALL_DATES' or any date
  const [statsDateFilter, setStatsDateFilter] = useState<string>(selectedDate);
  // Customer filter inside NumberStatistics: 'ALL' or specific customer name (lowercase key)
  const [selectedCustomerFilter, setSelectedCustomerFilter] = useState<string>('ALL');

  // Sync statsDateFilter when parent selectedDate changes
  useEffect(() => {
    setStatsDateFilter(selectedDate);
  }, [selectedDate]);

  const handleDateFilterChange = (newDate: string) => {
    setStatsDateFilter(newDate);
    if (newDate !== 'ALL_DATES' && onSelectDate) {
      onSelectDate(newDate);
    }
  };

  const setRegionFilter = (newRegion: 'ALL' | RegionType) => {
    if (onRegionFilterChange) {
      onRegionFilterChange(newRegion);
    } else {
      setInternalRegionFilter(newRegion);
    }
  };

  const [sortBy, setSortBy] = useState<'amount' | 'times' | 'number'>('amount');
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);
  const [expandedRowIds, setExpandedRowIds] = useState<Record<string, boolean>>({});
  const [expandedCustomerKeys, setExpandedCustomerKeys] = useState<Record<string, boolean>>({});
  const [expandedDateKeys, setExpandedDateKeys] = useState<Record<string, boolean>>({});

  const toggleExpandRow = (id: string) => {
    setExpandedRowIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleExpandCustomer = (key: string) => {
    setExpandedCustomerKeys((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleExpandDate = (dateStr: string) => {
    setExpandedDateKeys((prev) => ({
      ...prev,
      [dateStr]: !prev[dateStr],
    }));
  };

  const regionLabel =
    regionFilter === 'ALL'
      ? 'Tất Cả 3 Miền'
      : regionFilter === 'MN'
      ? 'Miền Nam (18 Lô)'
      : regionFilter === 'MT'
      ? 'Miền Trung (18 Lô)'
      : 'Miền Bắc (27 Lô)';

  // Available dates across all tickets
  const availableDates = useMemo(() => {
    const set = new Set<string>();
    set.add(getTodayDateString());
    tickets.forEach((t) => {
      if (t.date) set.add(t.date);
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [tickets]);

  // Tickets filtered by date + region (before customer filter, used to populate customer pills)
  const dateAndRegionTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (statsDateFilter !== 'ALL_DATES' && t.date !== statsDateFilter) return false;
      if (regionFilter !== 'ALL' && t.region !== regionFilter) return false;
      return true;
    });
  }, [tickets, statsDateFilter, regionFilter]);

  // Available customers in the currently selected date + region
  const availableCustomers = useMemo(() => {
    const map = new Map<string, { key: string; name: string; totalAmount: number; ticketCount: number }>();
    dateAndRegionTickets.forEach((t) => {
      const cleanName = t.customerName.trim() || 'Khách vãng lai';
      const key = cleanName.toLowerCase();
      const prev = map.get(key) || { key, name: cleanName, totalAmount: 0, ticketCount: 0 };
      prev.totalAmount += t.totalAmount;
      prev.ticketCount += 1;
      map.set(key, prev);
    });
    return Array.from(map.values()).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [dateAndRegionTickets]);

  // Reset customer filter if selected customer is no longer in list
  useEffect(() => {
    if (
      selectedCustomerFilter !== 'ALL' &&
      !availableCustomers.some((c) => c.key === selectedCustomerFilter)
    ) {
      setSelectedCustomerFilter('ALL');
    }
  }, [availableCustomers, selectedCustomerFilter]);

  // Final filtered tickets by Date + Region + Customer
  const dayTickets = useMemo(() => {
    return dateAndRegionTickets.filter((t) => {
      if (selectedCustomerFilter !== 'ALL') {
        const key = (t.customerName.trim() || 'Khách vãng lai').toLowerCase();
        if (key !== selectedCustomerFilter) return false;
      }
      return true;
    });
  }, [dateAndRegionTickets, selectedCustomerFilter]);

  // 1. Grouped rows by customer + date + region + betType + unitPrice
  const groupedCustomerRows = useMemo(() => {
    const mergedMap = new Map<string, GroupedCustomerStatRow>();

    dayTickets.forEach((ticket) => {
      const ticketGroups: GroupedBetItem[] = groupBetItems(ticket.items);
      ticketGroups.forEach((grp) => {
        const mergeKey = `${ticket.date}__${ticket.customerName.trim().toLowerCase()}__${ticket.region}__${grp.groupKey}`;
        const existing = mergedMap.get(mergeKey);

        const sampleNum = grp.items[0]?.number || '';
        const digits = sampleNum.includes('-') ? 99 : sampleNum.length;

        if (!existing) {
          mergedMap.set(mergeKey, {
            id: mergeKey,
            customerName: ticket.customerName,
            date: ticket.date,
            region: ticket.region,
            stationName: ticket.stationName,
            numbersLabel: grp.numbersLabel,
            betTypeName: grp.betTypeName,
            digits,
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

    return Array.from(mergedMap.values());
  }, [dayTickets]);

  // 1b. Customer Summary rows (Thống kê tổng hợp theo từng khách)
  const customerSummaryRows: CustomerSummaryStatRow[] = useMemo(() => {
    const map = new Map<string, CustomerSummaryStatRow>();

    dayTickets.forEach((ticket) => {
      const cleanName = ticket.customerName.trim() || 'Khách vãng lai';
      const key = cleanName.toLowerCase();
      const current = map.get(key) || {
        customerKey: key,
        customerName: cleanName,
        ticketCount: 0,
        totalNumbers: 0,
        totalPrizes: 0,
        amountMN: 0,
        amountMT: 0,
        amountMB: 0,
        totalAmount: 0,
        groupedRows: [],
      };

      current.ticketCount += 1;
      current.totalNumbers += ticket.items.length;
      current.totalPrizes += ticket.totalPrizesAccumulated;
      if (ticket.region === 'MN') current.amountMN += ticket.totalAmount;
      if (ticket.region === 'MT') current.amountMT += ticket.totalAmount;
      if (ticket.region === 'MB') current.amountMB += ticket.totalAmount;
      current.totalAmount += ticket.totalAmount;

      map.set(key, current);
    });

    // Attach grouped rows for each customer
    groupedCustomerRows.forEach((row) => {
      const key = (row.customerName.trim() || 'Khách vãng lai').toLowerCase();
      const target = map.get(key);
      if (target) {
        target.groupedRows.push(row);
      }
    });

    const list = Array.from(map.values());
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      return list
        .filter(
          (c) =>
            c.customerName.toLowerCase().includes(q) ||
            c.groupedRows.some(
              (r) =>
                r.numbersLabel.toLowerCase().includes(q) ||
                r.betTypeName.toLowerCase().includes(q)
            )
        )
        .sort((a, b) => b.totalAmount - a.totalAmount);
    }

    return list.sort((a, b) => b.totalAmount - a.totalAmount);
  }, [dayTickets, groupedCustomerRows, searchTerm]);

  // 1c. Date Summary rows (Thống kê tổng hợp theo từng ngày)
  const dateSummaryRows: DateSummaryStatRow[] = useMemo(() => {
    // Filter tickets by region and customer (ignoring single date filter if user wants to see all dates in by_date mode, or respecting statsDateFilter)
    const relevantTickets = tickets.filter((t) => {
      if (regionFilter !== 'ALL' && t.region !== regionFilter) return false;
      if (selectedCustomerFilter !== 'ALL') {
        const key = (t.customerName.trim() || 'Khách vãng lai').toLowerCase();
        if (key !== selectedCustomerFilter) return false;
      }
      return true;
    });

    const map = new Map<string, DateSummaryStatRow>();
    const custSetByDate = new Map<string, Set<string>>();

    relevantTickets.forEach((ticket) => {
      const d = ticket.date;
      const current = map.get(d) || {
        date: d,
        customerCount: 0,
        ticketCount: 0,
        totalNumbers: 0,
        totalPrizes: 0,
        amountMN: 0,
        amountMT: 0,
        amountMB: 0,
        totalAmount: 0,
        groupedRows: [],
      };

      current.ticketCount += 1;
      current.totalNumbers += ticket.items.length;
      current.totalPrizes += ticket.totalPrizesAccumulated;
      if (ticket.region === 'MN') current.amountMN += ticket.totalAmount;
      if (ticket.region === 'MT') current.amountMT += ticket.totalAmount;
      if (ticket.region === 'MB') current.amountMB += ticket.totalAmount;
      current.totalAmount += ticket.totalAmount;

      const cSet = custSetByDate.get(d) || new Set<string>();
      cSet.add((ticket.customerName.trim() || 'Khách vãng lai').toLowerCase());
      custSetByDate.set(d, cSet);
      current.customerCount = cSet.size;

      // Build grouped rows for this date
      const tGroups = groupBetItems(ticket.items);
      tGroups.forEach((grp) => {
        const mergeKey = `${ticket.date}__${ticket.customerName.trim().toLowerCase()}__${ticket.region}__${grp.groupKey}`;
        const existingGrp = current.groupedRows.find((g) => g.id === mergeKey);
        const sampleNum = grp.items[0]?.number || '';
        const digits = sampleNum.includes('-') ? 99 : sampleNum.length;

        if (!existingGrp) {
          current.groupedRows.push({
            id: mergeKey,
            customerName: ticket.customerName,
            date: ticket.date,
            region: ticket.region,
            stationName: ticket.stationName,
            numbersLabel: grp.numbersLabel,
            betTypeName: grp.betTypeName,
            digits,
            prizesCount: grp.prizesCount,
            totalPrizes: grp.totalPrizes,
            unitPrice: grp.unitPrice,
            groupTotal: grp.groupTotal,
            items: [...grp.items],
          });
        } else {
          existingGrp.items.push(...grp.items);
          existingGrp.totalPrizes += grp.totalPrizes;
          existingGrp.groupTotal += grp.groupTotal;
          existingGrp.numbersLabel = existingGrp.items.map((i) => i.number).join(', ');
        }
      });

      map.set(d, current);
    });

    return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [tickets, regionFilter, selectedCustomerFilter]);

  // Filter and sort grouped rows
  const filteredGroupedRows = useMemo(() => {
    let result = groupedCustomerRows.filter((row) => {
      if (filterType === '2_DIGITS' && (row.digits !== 2 || row.numbersLabel.includes('-'))) return false;
      if (filterType === '3_DIGITS' && (row.digits !== 3 || row.numbersLabel.includes('-'))) return false;
      if (filterType === 'CHEO_XIEN' && !row.numbersLabel.includes('-')) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const matchNum = row.numbersLabel.toLowerCase().includes(q);
        const matchCust = row.customerName.toLowerCase().includes(q);
        const matchType = row.betTypeName.toLowerCase().includes(q);
        if (!matchNum && !matchCust && !matchType) return false;
      }

      return true;
    });

    result.sort((a, b) => {
      if (sortBy === 'amount') return b.groupTotal - a.groupTotal;
      if (sortBy === 'times') return b.items.length - a.items.length;
      if (sortBy === 'number') return a.numbersLabel.localeCompare(b.numbersLabel);
      return 0;
    });

    return result;
  }, [groupedCustomerRows, filterType, searchTerm, sortBy]);

  // 2. Single number aggregation across all tickets (for Top 5 hot numbers & optional single-number view)
  const statsMap = useMemo(() => {
    const map = new Map<string, NumberStatisticRow>();

    dayTickets.forEach((ticket) => {
      ticket.items.forEach((item) => {
        const numKey = item.number.trim();
        const existing = map.get(numKey) || {
          number: numKey,
          digits: numKey.includes('-') ? 99 : numKey.length,
          totalAmount: 0,
          totalPrizes: 0,
          timesBet: 0,
          customers: [],
        };

        existing.totalAmount += item.itemTotal;
        existing.totalPrizes += item.prizesCount;
        existing.timesBet += 1;
        existing.customers.push({
          customerName: ticket.customerName,
          amount: item.itemTotal,
          betTypeName: item.betTypeName,
        });

        map.set(numKey, existing);
      });
    });

    return Array.from(map.values());
  }, [dayTickets]);

  // Total amount of day tickets
  const totalDayAmount = useMemo(() => {
    return dayTickets.reduce((sum, t) => sum + t.totalAmount, 0);
  }, [dayTickets]);

  // Filter and sort single number stats
  const filteredStats = useMemo(() => {
    let result = statsMap.filter((row) => {
      if (filterType === '2_DIGITS' && (row.digits !== 2 || row.number.includes('-'))) return false;
      if (filterType === '3_DIGITS' && (row.digits !== 3 || row.number.includes('-'))) return false;
      if (filterType === 'CHEO_XIEN' && !row.number.includes('-')) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const matchNum = row.number.toLowerCase().includes(q);
        const matchCust = row.customers.some((c) => c.customerName.toLowerCase().includes(q));
        if (!matchNum && !matchCust) return false;
      }

      return true;
    });

    result.sort((a, b) => {
      if (sortBy === 'amount') return b.totalAmount - a.totalAmount;
      if (sortBy === 'times') return b.timesBet - a.timesBet;
      if (sortBy === 'number') return a.number.localeCompare(b.number);
      return 0;
    });

    return result;
  }, [statsMap, filterType, searchTerm, sortBy]);

  // Top heavy/hot grouped batches
  const topHeavyGroups = useMemo(() => {
    return [...groupedCustomerRows].sort((a, b) => b.groupTotal - a.groupTotal).slice(0, 5);
  }, [groupedCustomerRows]);

  // Copy summary table for contractor/balancing
  const handleCopyGomSo = () => {
    const dateLabel =
      statsDateFilter === 'ALL_DATES' ? 'Tất cả các ngày' : formatDateDisplay(statsDateFilter);
    let text = `📊 BẢNG GOM SỐ & THỐNG KÊ NGÀY: ${dateLabel} (${regionLabel})\n`;
    text += `💰 Tổng cược toàn bảng: ${formatCurrency(totalDayAmount)}\n`;
    text += `--------------------------------\n`;

    if (viewMode === 'grouped' || viewMode === 'by_customer' || viewMode === 'by_date') {
      filteredGroupedRows.forEach((row, idx) => {
        text += `${idx + 1}. Khách ${row.customerName} (${formatDateDisplay(row.date)}): [${row.numbersLabel}] - ${row.betTypeName}\n`;
        text += `   👉 ${row.items.length} số x ${row.prizesCount} giải x ${formatCurrency(row.unitPrice)} = ${formatCurrency(row.groupTotal)}\n`;
      });
    } else {
      filteredStats.forEach((s, idx) => {
        const custNames = Array.from(new Set(s.customers.map((c) => c.customerName))).join(', ');
        text += `${idx + 1}. [${s.number}] - ${s.timesBet} lần - ${formatCurrency(s.totalAmount)} (${custNames})\n`;
      });
    }

    navigator.clipboard.writeText(text);
    setCopied(true);
    onCopySuccess('Đã sao chép bảng gom số vào clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const todayStr = getTodayDateString();
  const yesterdayStr = getYesterdayDateString();

  return (
    <div className="space-y-4">
      {/* Top Control Panel: Thống Kê Theo Ngày & Thống Kê Theo Khách */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        {/* Row A: Thống Kê Theo Ngày */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Calendar className="w-4 h-4" />
              <span>Thống Kê Theo Ngày:</span>
            </span>

            <button
              type="button"
              onClick={() => handleDateFilterChange(todayStr)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                statsDateFilter === todayStr
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-sm'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              Hôm nay ({formatDateDisplay(todayStr)})
            </button>

            <button
              type="button"
              onClick={() => handleDateFilterChange(yesterdayStr)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                statsDateFilter === yesterdayStr
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-sm'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              Hôm qua ({formatDateDisplay(yesterdayStr)})
            </button>

            {availableDates
              .filter((d) => d !== todayStr && d !== yesterdayStr)
              .slice(0, 4)
              .map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleDateFilterChange(d)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold border transition-colors ${
                    statsDateFilter === d
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-sm'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {formatDateDisplay(d)}
                </button>
              ))}

            <button
              type="button"
              onClick={() => handleDateFilterChange('ALL_DATES')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                statsDateFilter === 'ALL_DATES'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-sm'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              Tất Cả Các Ngày ({availableDates.length} ngày)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 whitespace-nowrap">Chọn ngày bất kỳ:</span>
            <input
              type="date"
              value={statsDateFilter === 'ALL_DATES' ? todayStr : statsDateFilter}
              onChange={(e) => {
                if (e.target.value) handleDateFilterChange(e.target.value);
              }}
              className="bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-2.5 py-1 text-xs font-mono text-white focus:outline-none"
            />
          </div>
        </div>

        {/* Row B: Thống Kê Theo Khách Hàng */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider mr-1">
              <Users className="w-4 h-4" />
              <span>Thống Kê Theo Khách:</span>
            </span>

            <button
              type="button"
              onClick={() => setSelectedCustomerFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                selectedCustomerFilter === 'ALL'
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold shadow-sm'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              Tất Cả Khách ({availableCustomers.length})
            </button>

            {availableCustomers.map((cust) => (
              <button
                key={cust.key}
                type="button"
                onClick={() => setSelectedCustomerFilter(cust.key)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
                  selectedCustomerFilter === cust.key
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold shadow-sm'
                    : 'bg-slate-950 text-slate-200 border-slate-800 hover:border-emerald-500/40'
                }`}
              >
                <span>{cust.name}</span>
                <span
                  className={`font-mono text-[10px] px-1.5 py-0.2 rounded ${
                    selectedCustomerFilter === cust.key
                      ? 'bg-slate-950/20 text-slate-950 font-bold'
                      : 'bg-slate-900 text-amber-300'
                  }`}
                >
                  {formatCurrency(cust.totalAmount)}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Header and Hot Numbers Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Hot / Risk Grouped Batches */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 flex-wrap gap-2">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Top 5 Dòng Cược Đang "Nặng Tiền" Nhất —</span>
              <span className="text-amber-300">[{regionLabel}]</span>
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {statsDateFilter === 'ALL_DATES'
                ? 'Tất cả các ngày'
                : `Ngày ${formatDateDisplay(statsDateFilter)}`}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 mt-3">
            {topHeavyGroups.length === 0 ? (
              <div className="col-span-5 text-center text-xs text-slate-500 py-2">
                Chưa có dữ liệu cược cho {regionLabel} trong bộ lọc này
              </div>
            ) : (
              topHeavyGroups.map((hot, idx) => (
                <div
                  key={hot.id}
                  onClick={() => toggleExpandRow(hot.id)}
                  className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 hover:border-amber-500/40 flex flex-col justify-between cursor-pointer transition-colors"
                  title="Bấm để xem chi tiết từng số ở bảng dưới"
                >
                  <div className="flex items-center justify-between text-[11px] gap-1">
                    <span className="w-4 h-4 rounded-full bg-slate-800 text-amber-400 font-mono text-[10px] flex items-center justify-center font-bold shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-slate-300 text-[10px] font-semibold truncate">
                      {hot.customerName}
                    </span>
                  </div>
                  <div className="my-1.5 text-center font-mono font-bold text-sm text-amber-300 truncate">
                    {hot.numbersLabel}
                  </div>
                  <div className="text-center text-[10px] text-slate-400 truncate mb-1">
                    {hot.betTypeName} ({hot.items.length} số)
                  </div>
                  <div className="text-center font-mono text-xs font-bold text-white tabular-nums pt-1 border-t border-slate-900">
                    {formatCurrency(hot.groupTotal)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Summary Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Tổng quan gom số:</span>
              <span className="text-xs font-bold text-amber-300">{regionLabel}</span>
            </div>
            <div className="mt-1 text-2xl font-bold font-mono text-amber-300 tabular-nums">
              {formatCurrency(totalDayAmount)}
            </div>
            <div className="mt-2 text-xs text-slate-400 space-y-1">
              <div>
                Khách đang lọc:{' '}
                <strong className="text-emerald-300">
                  {selectedCustomerFilter === 'ALL'
                    ? `Tất cả (${availableCustomers.length} khách)`
                    : availableCustomers.find((c) => c.key === selectedCustomerFilter)?.name ||
                      '1 khách'}
                </strong>
              </div>
              <div>
                Số dòng đã gom:{' '}
                <strong className="text-white">
                  {groupedCustomerRows.length} dòng ({statsMap.length} con số)
                </strong>
              </div>
              <div>
                Tổng số vé cược:{' '}
                <strong className="text-white">{dayTickets.length} vé</strong>
              </div>
            </div>
          </div>

          <button
            onClick={handleCopyGomSo}
            disabled={filteredGroupedRows.length === 0}
            className="mt-3 flex items-center justify-center gap-1.5 w-full py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Đã sao chép</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-amber-400" />
                <span>Copy Bảng Gom Số ({regionLabel})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm con số (vd: 19, 91...), tên khách (vd: Mai) hoặc cách chơi..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
            />
          </div>

          {/* Region Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-xs text-slate-400 flex items-center gap-1 mr-1 whitespace-nowrap">
              <Filter className="w-3.5 h-3.5 text-slate-500" /> Miền:
            </span>
            {(['ALL', 'MN', 'MT', 'MB'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRegionFilter(r)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                  regionFilter === r
                    ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {r === 'ALL' ? 'Tất Cả 3 Miền' : r === 'MN' ? 'Miền Nam' : r === 'MT' ? 'Miền Trung' : 'Miền Bắc'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-2.5 pt-2 border-t border-slate-800/80">
          {/* Category Filter */}
          <div className="flex items-center gap-1 overflow-x-auto w-full lg:w-auto">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                filterType === 'ALL'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Tất Cả ({viewMode === 'grouped' ? groupedCustomerRows.length : statsMap.length})
            </button>
            <button
              onClick={() => setFilterType('2_DIGITS')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                filterType === '2_DIGITS'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              2 Chân (00-99)
            </button>
            <button
              onClick={() => setFilterType('3_DIGITS')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                filterType === '3_DIGITS'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              3 Chân (3 Càng)
            </button>
            <button
              onClick={() => setFilterType('CHEO_XIEN')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                filterType === 'CHEO_XIEN'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Đá Chéo / Xiên
            </button>
          </div>

          {/* View Mode & Sort selector */}
          <div className="flex items-center gap-2 flex-wrap self-end lg:self-auto">
            <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 flex-wrap">
              <button
                type="button"
                onClick={() => setViewMode('grouped')}
                className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                  viewMode === 'grouped'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3 h-3" />
                <span>Gom 1 Dòng Theo Khách</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('by_customer')}
                className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                  viewMode === 'by_customer'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-3 h-3" />
                <span>Bảng Tổng Theo Khách</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('by_date')}
                className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                  viewMode === 'by_date'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Calendar className="w-3 h-3" />
                <span>Bảng Tổng Theo Ngày</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('single_number')}
                className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                  viewMode === 'single_number'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Hash className="w-3 h-3" />
                <span>Tách Từng Số Lẻ</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 whitespace-nowrap flex items-center gap-1">
                <ArrowUpDown className="w-3 h-3 text-slate-500" /> Xếp:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-white focus:outline-none"
              >
                <option value="amount">Tiền Cược Nhiều Nhất</option>
                <option value="times">Số Lượng Nhiều Nhất</option>
                <option value="number">Thứ Tự Con Số</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Statistics Table (Mobile Cards + Desktop Table) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {/* Mobile Zero-Overflow Cards View */}
        <div className="md:hidden divide-y divide-slate-800">
          {viewMode === 'grouped' ? (
            filteredGroupedRows.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                Không có dòng cược nào phù hợp tiêu chí lọc
              </div>
            ) : (
              filteredGroupedRows.map((row) => {
                const isExpanded = !!expandedRowIds[row.id];
                const percent =
                  totalDayAmount > 0
                    ? ((row.groupTotal / totalDayAmount) * 100).toFixed(1)
                    : '0';

                return (
                  <div key={row.id} className="p-3 space-y-2">
                    <div
                      onClick={() => toggleExpandRow(row.id)}
                      className="flex items-start justify-between gap-2 cursor-pointer"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-white bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            {row.customerName}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                            {row.region}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {formatDateDisplay(row.date)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-bold text-amber-300 text-sm tracking-wide break-words">
                            {row.numbersLabel}
                          </span>
                          {row.items.length > 1 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-sans">
                              {row.items.length} số
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-200 font-medium">
                          {row.betTypeName}{' '}
                          <span className="text-[11px] font-mono text-slate-400 font-normal">
                            ({row.items.length} số x {row.prizesCount} giải x {formatCurrency(row.unitPrice)})
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="font-mono font-bold text-white text-sm tabular-nums">
                          {formatCurrency(row.groupTotal)}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono text-amber-400/90 tabular-nums">
                            {percent}%
                          </span>
                          <button
                            type="button"
                            className={`p-1 rounded border transition-colors ${
                              isExpanded
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5 text-amber-400" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="rounded-lg bg-slate-950 border border-slate-800 px-2.5 py-1.5 divide-y divide-slate-900 font-mono text-[11px]">
                        {row.items.map((item) => (
                          <div
                            key={item.id}
                            className="py-1 flex items-center justify-between gap-2 text-slate-300"
                          >
                            <span>
                              <strong className="text-amber-200">Số {item.number}</strong>
                            </span>
                            <span className="text-slate-400 tabular-nums">
                              {item.prizesCount} giải x {formatCurrency(item.unitPrice)} ={' '}
                              <strong className="text-white">{formatCurrency(item.itemTotal)}</strong>
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )
          ) : viewMode === 'by_customer' ? (
            customerSummaryRows.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                Chưa có dữ liệu khách hàng trong bộ lọc này
              </div>
            ) : (
              customerSummaryRows.map((cust) => {
                const isCustExpanded = !!expandedCustomerKeys[cust.customerKey];
                return (
                  <div key={cust.customerKey} className="p-3 space-y-2.5">
                    <div
                      onClick={() => toggleExpandCustomer(cust.customerKey)}
                      className="flex items-start justify-between gap-2 cursor-pointer"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-amber-300 text-sm">
                            {cust.customerName}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 font-mono">
                            {cust.ticketCount} vé · {cust.groupedRows.length} dòng
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Tổng {cust.totalNumbers} con số · {cust.totalPrizes} giải
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="font-mono font-bold text-amber-300 text-sm tabular-nums">
                          {formatCurrency(cust.totalAmount)}
                        </span>
                        <span className="p-1 rounded bg-slate-800 text-amber-400 border border-slate-700">
                          {isCustExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 p-2 rounded-lg bg-slate-950 border border-slate-800/80 text-[11px] font-mono">
                      <div>
                        <div className="text-[10px] text-emerald-400 font-sans">Miền Nam</div>
                        <div className="text-slate-200 font-semibold tabular-nums">
                          {formatCurrency(cust.amountMN)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-cyan-400 font-sans">Miền Trung</div>
                        <div className="text-slate-200 font-semibold tabular-nums">
                          {formatCurrency(cust.amountMT)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-rose-400 font-sans">Miền Bắc</div>
                        <div className="text-slate-200 font-semibold tabular-nums">
                          {formatCurrency(cust.amountMB)}
                        </div>
                      </div>
                    </div>

                    {isCustExpanded && (
                      <div className="rounded-lg bg-slate-950 border border-emerald-500/30 p-2 space-y-1.5">
                        {cust.groupedRows.map((grp) => (
                          <div
                            key={grp.id}
                            className="p-2 rounded bg-slate-900/90 border border-slate-800 flex items-start justify-between gap-2 text-xs"
                          >
                            <div className="min-w-0">
                              <div className="font-mono font-bold text-amber-300 break-words">
                                {grp.numbersLabel}{' '}
                                <span className="text-[10px] text-slate-400 font-sans">
                                  ({grp.items.length} số · {grp.region})
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-300 mt-0.5">
                                {grp.betTypeName} ({grp.prizesCount} giải x {formatCurrency(grp.unitPrice)})
                              </div>
                            </div>
                            <div className="text-right shrink-0 font-mono">
                              <div className="font-bold text-white tabular-nums">
                                {formatCurrency(grp.groupTotal)}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {formatDateDisplay(grp.date)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )
          ) : viewMode === 'by_date' ? (
            dateSummaryRows.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                Chưa có dữ liệu ngày nào
              </div>
            ) : (
              dateSummaryRows.map((dRow) => {
                const isDateExpanded = !!expandedDateKeys[dRow.date];
                return (
                  <div key={dRow.date} className="p-3 space-y-2.5">
                    <div
                      onClick={() => toggleExpandDate(dRow.date)}
                      className="flex items-start justify-between gap-2 cursor-pointer"
                    >
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-bold text-amber-300 text-sm">
                            {formatDateDisplay(dRow.date)}
                          </span>
                          {dRow.date === todayStr && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              Hôm nay
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {dRow.customerCount} khách · {dRow.ticketCount} vé · {dRow.totalNumbers} số ({dRow.totalPrizes} giải)
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="font-mono font-bold text-amber-300 text-sm tabular-nums">
                          {formatCurrency(dRow.totalAmount)}
                        </span>
                        <span className="p-1 rounded bg-slate-800 text-amber-400 border border-slate-700">
                          {isDateExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 p-2 rounded-lg bg-slate-950 border border-slate-800/80 text-[11px] font-mono">
                      <div>
                        <div className="text-[10px] text-emerald-400 font-sans">Miền Nam</div>
                        <div className="text-slate-200 font-semibold tabular-nums">
                          {formatCurrency(dRow.amountMN)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-cyan-400 font-sans">Miền Trung</div>
                        <div className="text-slate-200 font-semibold tabular-nums">
                          {formatCurrency(dRow.amountMT)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-rose-400 font-sans">Miền Bắc</div>
                        <div className="text-slate-200 font-semibold tabular-nums">
                          {formatCurrency(dRow.amountMB)}
                        </div>
                      </div>
                    </div>

                    {isDateExpanded && (
                      <div className="rounded-lg bg-slate-950 border border-cyan-500/30 p-2 space-y-1.5">
                        {dRow.groupedRows.map((grp) => (
                          <div
                            key={grp.id}
                            className="p-2 rounded bg-slate-900/90 border border-slate-800 flex items-start justify-between gap-2 text-xs"
                          >
                            <div className="min-w-0">
                              <div className="text-[11px] text-slate-300">
                                Khách:{' '}
                                <strong className="text-amber-300">{grp.customerName}</strong> ({grp.region})
                              </div>
                              <div className="font-mono font-bold text-amber-200 break-words mt-0.5">
                                {grp.numbersLabel} ({grp.items.length} số)
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {grp.betTypeName} · {grp.prizesCount} giải x {formatCurrency(grp.unitPrice)}
                              </div>
                            </div>
                            <div className="font-mono font-bold text-white tabular-nums shrink-0">
                              {formatCurrency(grp.groupTotal)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )
          ) : filteredStats.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              Không có con số nào phù hợp tiêu chí lọc
            </div>
          ) : (
            filteredStats.map((row) => {
              const percent =
                totalDayAmount > 0
                  ? ((row.totalAmount / totalDayAmount) * 100).toFixed(1)
                  : '0';
              return (
                <div key={row.number} className="p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-300 text-base">
                        {row.number}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                        {row.number.includes('-')
                          ? 'Đá/Xiên'
                          : row.digits === 3
                          ? '3 Càng'
                          : '2 Chân'}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {row.timesBet} lượt · {row.totalPrizes} giải
                      </span>
                    </div>
                    <div className="text-right font-mono">
                      <div className="font-bold text-white text-sm tabular-nums">
                        {formatCurrency(row.totalAmount)}
                      </div>
                      <div className="text-[10px] text-amber-400/80 tabular-nums">
                        {percent}% bảng
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {row.customers.map((c, cIdx) => (
                      <span
                        key={cIdx}
                        className="text-[11px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-300"
                      >
                        <strong>{c.customerName}</strong> ({formatCurrency(c.amount)})
                      </span>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          {viewMode === 'grouped' ? (
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-mono border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center">STT</th>
                  <th className="py-2.5 px-3">Con Số Đánh (Đã Gom 1 Dòng)</th>
                  <th className="py-2.5 px-3">Hình Thức Cược</th>
                  <th className="py-2.5 px-3 text-right">Số Giải</th>
                  <th className="py-2.5 px-3 text-right">Tiền 1 Giải</th>
                  <th className="py-2.5 px-3 text-right">Tổng Thành Tiền</th>
                  <th className="py-2.5 px-3 text-right">% Bảng</th>
                  <th className="py-2.5 px-3">Khách Hàng & Ngày</th>
                  <th className="py-2.5 px-2 w-16 text-center">Chi Tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredGroupedRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-500 font-sans">
                      Không có dòng cược nào phù hợp tiêu chí lọc
                    </td>
                  </tr>
                ) : (
                  filteredGroupedRows.map((row, idx) => {
                    const isExpanded = !!expandedRowIds[row.id];
                    const percent =
                      totalDayAmount > 0
                        ? ((row.groupTotal / totalDayAmount) * 100).toFixed(1)
                        : '0';

                    return (
                      <React.Fragment key={row.id}>
                        {/* Main Grouped Customer Row */}
                        <tr
                          onClick={() => toggleExpandRow(row.id)}
                          className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                        >
                          <td className="py-2.5 px-3 text-center text-slate-400 font-bold">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-amber-300 text-sm tracking-wider">
                                {row.numbersLabel}
                              </span>
                              {row.items.length > 1 && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-sans">
                                  {row.items.length} số
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-200 font-sans font-medium">
                            {row.betTypeName}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-300 tabular-nums">
                            <div>{row.prizesCount} giải</div>
                            {row.items.length > 1 && (
                              <div className="text-[10px] text-slate-500">
                                ({row.items.length} số = {row.totalPrizes} giải)
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-300 tabular-nums">
                            {formatCurrency(row.unitPrice)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-white tabular-nums text-sm">
                            {formatCurrency(row.groupTotal)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-amber-400/80 tabular-nums">
                            {percent}%
                          </td>
                          <td className="py-2.5 px-3 text-slate-300 font-sans">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800 text-slate-200">
                                <strong className="text-amber-300">{row.customerName}</strong>{' '}
                                <span className="text-slate-400 font-mono text-[11px]">
                                  ({formatCurrency(row.groupTotal)})
                                </span>
                              </span>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                                {row.region}
                              </span>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                                {formatDateDisplay(row.date)}
                              </span>
                            </div>
                          </td>
                          <td
                            className="py-2.5 px-2 text-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpandRow(row.id);
                            }}
                          >
                            <button
                              type="button"
                              className={`p-1 rounded border transition-colors ${
                                isExpanded
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                              }`}
                              title="Bấm mũi tên để xem chi tiết từng con số"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5 text-amber-400" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
                              )}
                            </button>
                          </td>
                        </tr>

                        {/* Expanded Detailed Breakdown Sub-rows for each number */}
                        {isExpanded &&
                          row.items.map((item, subIdx) => {
                            const itemPercent =
                              totalDayAmount > 0
                                ? ((item.itemTotal / totalDayAmount) * 100).toFixed(1)
                                : '0';
                            return (
                              <tr
                                key={item.id}
                                className="bg-slate-950/90 hover:bg-slate-900/90 text-[11px] border-l-2 border-l-amber-500/50"
                              >
                                <td className="py-1.5 px-3 text-center text-slate-600">
                                  {idx + 1}.{subIdx + 1}
                                </td>
                                <td className="py-1.5 px-3 font-bold text-amber-200 pl-6">
                                  ↳ Số: {item.number}
                                </td>
                                <td className="py-1.5 px-3 text-slate-400 font-sans">
                                  {item.betTypeName}
                                </td>
                                <td className="py-1.5 px-3 text-right text-slate-400 tabular-nums">
                                  {item.prizesCount} giải
                                </td>
                                <td className="py-1.5 px-3 text-right text-slate-500 tabular-nums">
                                  {formatCurrency(item.unitPrice)}
                                </td>
                                <td className="py-1.5 px-3 text-right font-semibold text-slate-200 tabular-nums">
                                  {formatCurrency(item.itemTotal)}
                                </td>
                                <td className="py-1.5 px-3 text-right text-slate-500 tabular-nums">
                                  {itemPercent}%
                                </td>
                                <td className="py-1.5 px-3 text-slate-400 font-sans">
                                  Khách: <strong className="text-slate-200">{row.customerName}</strong> ({formatDateDisplay(row.date)})
                                </td>
                                <td></td>
                              </tr>
                            );
                          })}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          ) : viewMode === 'by_customer' ? (
            /* View Mode 2: Bảng Tổng Hợp Theo Khách Hàng */
            <table className="w-full text-xs text-left min-w-[680px]">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-mono border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center">STT</th>
                  <th className="py-2.5 px-3">Tên Khách Hàng</th>
                  <th className="py-2.5 px-3 text-center">Số Vé / Số Dòng</th>
                  <th className="py-2.5 px-3 text-right text-emerald-400">Miền Nam</th>
                  <th className="py-2.5 px-3 text-right text-cyan-400">Miền Trung</th>
                  <th className="py-2.5 px-3 text-right text-rose-400">Miền Bắc</th>
                  <th className="py-2.5 px-3 text-right">Tổng Tiền Khách</th>
                  <th className="py-2.5 px-2 w-20 text-center">Chi Tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {customerSummaryRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500 font-sans">
                      Chưa có dữ liệu khách hàng trong bộ lọc này
                    </td>
                  </tr>
                ) : (
                  customerSummaryRows.map((cust, idx) => {
                    const isCustExpanded = !!expandedCustomerKeys[cust.customerKey];
                    return (
                      <React.Fragment key={cust.customerKey}>
                        <tr
                          onClick={() => toggleExpandCustomer(cust.customerKey)}
                          className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                        >
                          <td className="py-3 px-3 text-center text-slate-400 font-bold">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-3 font-sans">
                            <div className="font-bold text-amber-300 text-sm">
                              {cust.customerName}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Tổng {cust.totalNumbers} con số · {cust.totalPrizes} giải
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center text-slate-300">
                            <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-xs">
                              {cust.ticketCount} vé · {cust.groupedRows.length} dòng gom
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right text-emerald-300 tabular-nums">
                            {formatCurrency(cust.amountMN)}
                          </td>
                          <td className="py-3 px-3 text-right text-cyan-300 tabular-nums">
                            {formatCurrency(cust.amountMT)}
                          </td>
                          <td className="py-3 px-3 text-right text-rose-300 tabular-nums">
                            {formatCurrency(cust.amountMB)}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-amber-300 text-sm tabular-nums">
                            {formatCurrency(cust.totalAmount)}
                          </td>
                          <td className="py-3 px-2 text-center">
                            <button
                              type="button"
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700"
                              title="Bấm để xem các dòng cược đã gom của khách này"
                            >
                              {isCustExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                        </tr>

                        {isCustExpanded &&
                          cust.groupedRows.map((grp, gIdx) => (
                            <tr
                              key={grp.id}
                              className="bg-slate-950/90 text-[11px] border-l-2 border-l-emerald-500/60"
                            >
                              <td className="py-2 px-3 text-center text-slate-500">
                                {idx + 1}.{gIdx + 1}
                              </td>
                              <td className="py-2 px-3 pl-6 font-bold text-amber-300">
                                ↳ Dãy số: {grp.numbersLabel}{' '}
                                <span className="text-[10px] text-slate-400 font-sans">
                                  ({grp.items.length} số)
                                </span>
                              </td>
                              <td className="py-2 px-3 text-center text-slate-200 font-sans">
                                {grp.betTypeName} ({grp.region})
                              </td>
                              <td colSpan={3} className="py-2 px-3 text-right text-slate-400">
                                {grp.items.length} số x {grp.prizesCount} giải ({grp.totalPrizes} giải) x{' '}
                                {formatCurrency(grp.unitPrice)}
                              </td>
                              <td className="py-2 px-3 text-right font-bold text-white tabular-nums">
                                {formatCurrency(grp.groupTotal)}
                              </td>
                              <td className="py-2 px-2 text-center text-[10px] text-slate-500">
                                {formatDateDisplay(grp.date)}
                              </td>
                            </tr>
                          ))}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          ) : viewMode === 'by_date' ? (
            /* View Mode 3: Bảng Tổng Hợp Theo Ngày */
            <table className="w-full text-xs text-left min-w-[680px]">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-mono border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center">STT</th>
                  <th className="py-2.5 px-3">Ngày Ghi Sổ</th>
                  <th className="py-2.5 px-3 text-center">Khách / Vé</th>
                  <th className="py-2.5 px-3 text-right text-emerald-400">Miền Nam</th>
                  <th className="py-2.5 px-3 text-right text-cyan-400">Miền Trung</th>
                  <th className="py-2.5 px-3 text-right text-rose-400">Miền Bắc</th>
                  <th className="py-2.5 px-3 text-right">Tổng Tiền Ngày</th>
                  <th className="py-2.5 px-2 w-24 text-center">Chi Tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {dateSummaryRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500 font-sans">
                      Chưa có dữ liệu ngày nào
                    </td>
                  </tr>
                ) : (
                  dateSummaryRows.map((dRow, idx) => {
                    const isDateExpanded = !!expandedDateKeys[dRow.date];
                    return (
                      <React.Fragment key={dRow.date}>
                        <tr
                          onClick={() => toggleExpandDate(dRow.date)}
                          className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                        >
                          <td className="py-3 px-3 text-center text-slate-400 font-bold">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-amber-300 text-sm flex items-center gap-2">
                              <span>{formatDateDisplay(dRow.date)}</span>
                              {dRow.date === todayStr && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-sans">
                                  Hôm nay
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-sans">
                              {dRow.totalNumbers} con số · {dRow.totalPrizes} giải
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center text-slate-300 font-sans">
                            {dRow.customerCount} khách · {dRow.ticketCount} vé
                          </td>
                          <td className="py-3 px-3 text-right text-emerald-300 tabular-nums">
                            {formatCurrency(dRow.amountMN)}
                          </td>
                          <td className="py-3 px-3 text-right text-cyan-300 tabular-nums">
                            {formatCurrency(dRow.amountMT)}
                          </td>
                          <td className="py-3 px-3 text-right text-rose-300 tabular-nums">
                            {formatCurrency(dRow.amountMB)}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-amber-300 text-sm tabular-nums">
                            {formatCurrency(dRow.totalAmount)}
                          </td>
                          <td className="py-3 px-2 text-center">
                            <button
                              type="button"
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700"
                              title="Bấm để sổ chi tiết các dòng cược của ngày này"
                            >
                              {isDateExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                        </tr>

                        {isDateExpanded &&
                          dRow.groupedRows.map((grp, gIdx) => (
                            <tr
                              key={grp.id}
                              className="bg-slate-950/90 text-[11px] border-l-2 border-l-cyan-500/60"
                            >
                              <td className="py-2 px-3 text-center text-slate-500">
                                {idx + 1}.{gIdx + 1}
                              </td>
                              <td className="py-2 px-3 pl-6 font-sans">
                                Khách: <strong className="text-amber-300">{grp.customerName}</strong> ({grp.region})
                              </td>
                              <td className="py-2 px-3 font-bold text-amber-200">
                                {grp.numbersLabel} ({grp.items.length} số)
                              </td>
                              <td colSpan={3} className="py-2 px-3 text-right text-slate-300 font-sans">
                                {grp.betTypeName} · {grp.prizesCount} giải x {formatCurrency(grp.unitPrice)}
                              </td>
                              <td className="py-2 px-3 text-right font-bold text-white tabular-nums">
                                {formatCurrency(grp.groupTotal)}
                              </td>
                              <td></td>
                            </tr>
                          ))}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-mono border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3 w-12 text-center">STT</th>
                  <th className="py-2.5 px-4">Con Số Lẻ</th>
                  <th className="py-2.5 px-3 text-center">Loại</th>
                  <th className="py-2.5 px-3 text-right">Lượt Đánh</th>
                  <th className="py-2.5 px-3 text-right">Tổng Số Giải</th>
                  <th className="py-2.5 px-4 text-right">Tổng Thành Tiền</th>
                  <th className="py-2.5 px-3 text-right">% Chiếm Bảng</th>
                  <th className="py-2.5 px-4">Danh Sách Khách Hàng Đã Đánh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredStats.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      Không có con số nào phù hợp tiêu chí lọc
                    </td>
                  </tr>
                ) : (
                  filteredStats.map((row, idx) => {
                    const percent =
                      totalDayAmount > 0
                        ? ((row.totalAmount / totalDayAmount) * 100).toFixed(1)
                        : '0';

                    return (
                      <tr key={row.number} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 text-center text-slate-500">{idx + 1}</td>
                        <td className="py-2.5 px-4 font-bold text-amber-300 text-sm tracking-wider">
                          {row.number}
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-400">
                          {row.number.includes('-')
                            ? 'Đá/Xiên'
                            : row.digits === 3
                            ? '3 Càng'
                            : '2 Chân'}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-300 tabular-nums">
                          {row.timesBet} lượt
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-300 tabular-nums">
                          {row.totalPrizes} giải
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold text-white tabular-nums text-sm">
                          {formatCurrency(row.totalAmount)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-amber-400/80 tabular-nums">
                          {percent}%
                        </td>
                        <td className="py-2.5 px-4 text-slate-300 font-sans">
                          <div className="flex flex-wrap gap-1.5">
                            {row.customers.map((c, cIdx) => (
                              <span
                                key={cIdx}
                                className="text-[11px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-300"
                              >
                                <strong>{c.customerName}</strong> ({formatCurrency(c.amount)})
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
