import React, { useState, useMemo } from 'react';
import { BetRateConfig, BetType, CustomerBetTicket, GroupedBetItem, RegionType } from '../types/lottery';
import { BET_TYPE_DEFINITIONS } from '../data/defaultConfig';
import { formatCurrency, formatDateDisplay, formatNumberWithDots, formatShortPrice, parseCurrencyInput } from '../utils/formatters';
import { buildBetItems, extractNumbersFromString, groupBetItems } from '../utils/lotteryCalculator';
import { 
  Copy, 
  Printer, 
  Trash2, 
  Search, 
  Filter, 
  Clock, 
  Check, 
  AlertCircle,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  Pencil,
  X
} from 'lucide-react';

interface CustomerBetListProps {
  tickets: CustomerBetTicket[];
  selectedDate: string;
  regionFilter?: 'ALL' | RegionType;
  onRegionFilterChange?: (region: 'ALL' | RegionType) => void;
  rateConfigs?: BetRateConfig[];
  editingTicketId?: string | null;
  onEditTicket?: (ticket: CustomerBetTicket) => void;
  onUpdateTicket?: (updatedTicket: CustomerBetTicket) => void;
  onDeleteTicket: (ticketId: string) => void;
  onDeleteTicketItem?: (ticketId: string, itemId: string) => void;
  onDeleteTicketGroup?: (ticketId: string, itemIds: string[]) => void;
  onDeleteTicketsForDate?: (date: string) => void;
  onDeleteMultipleTickets?: (ticketIds: string[]) => void;
  onResetSampleTickets?: () => void;
  onOpenReceipt: (ticket: CustomerBetTicket) => void;
  onCopyTextSuccess: (msg: string) => void;
}

export const CustomerBetList: React.FC<CustomerBetListProps> = ({
  tickets,
  selectedDate,
  regionFilter: externalRegionFilter,
  onRegionFilterChange,
  rateConfigs = [],
  editingTicketId = null,
  onEditTicket,
  onUpdateTicket,
  onDeleteTicket,
  onDeleteTicketItem,
  onDeleteTicketGroup,
  onDeleteTicketsForDate,
  onDeleteMultipleTickets,
  onResetSampleTickets,
  onOpenReceipt,
  onCopyTextSuccess,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [internalRegionFilter, setInternalRegionFilter] = useState<'ALL' | RegionType>('ALL');
  const regionFilter = externalRegionFilter !== undefined ? externalRegionFilter : internalRegionFilter;

  const setRegionFilter = (newRegion: 'ALL' | RegionType) => {
    if (onRegionFilterChange) {
      onRegionFilterChange(newRegion);
    } else {
      setInternalRegionFilter(newRegion);
    }
  };
  const [copiedTicketId, setCopiedTicketId] = useState<string | null>(null);
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);
  const [showConfirmDeleteAll, setShowConfirmDeleteAll] = useState(false);
  const [showConfirmDeleteSelected, setShowConfirmDeleteSelected] = useState(false);
  const [confirmingTicketId, setConfirmingTicketId] = useState<string | null>(null);
  const [expandedGroupKeys, setExpandedGroupKeys] = useState<Record<string, boolean>>({});

  // State for inline editing a grouped row directly inside a saved ticket
  const [inlineEditingCompositeKey, setInlineEditingCompositeKey] = useState<string | null>(null);
  const [inlineEditNumbers, setInlineEditNumbers] = useState<string>('');
  const [inlineEditBetType, setInlineEditBetType] = useState<BetType>('bao_5_cuoi');
  const [inlineEditMoneyDisplay, setInlineEditMoneyDisplay] = useState<string>('2.000');
  const [inlineEditMoneyNumeric, setInlineEditMoneyNumeric] = useState<number>(2000);

  const toggleExpandGroup = (compositeKey: string) => {
    setExpandedGroupKeys((prev) => ({
      ...prev,
      [compositeKey]: !prev[compositeKey],
    }));
  };

  const handleStartInlineEditGroup = (compositeKey: string, group: GroupedBetItem) => {
    setInlineEditingCompositeKey(compositeKey);
    if (group.betType === 'cheo_2_5') {
      const uniqueNums = new Set<string>();
      group.items.forEach((item) => {
        item.number.split(' - ').forEach((n) => uniqueNums.add(n.trim()));
      });
      setInlineEditNumbers(Array.from(uniqueNums).join(', '));
    } else {
      setInlineEditNumbers(group.items.map((i) => i.number).join(', '));
    }
    setInlineEditBetType(group.betType);
    setInlineEditMoneyNumeric(group.unitPrice);
    setInlineEditMoneyDisplay(formatNumberWithDots(group.unitPrice));
  };

  const handleInlineMoneyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw.toLowerCase().endsWith('k')) {
      const parsed = parseCurrencyInput(raw);
      setInlineEditMoneyNumeric(parsed);
      setInlineEditMoneyDisplay(formatNumberWithDots(parsed));
      return;
    }
    const digitsOnly = raw.replace(/\D/g, '');
    if (!digitsOnly) {
      setInlineEditMoneyNumeric(0);
      setInlineEditMoneyDisplay('');
      return;
    }
    const num = parseInt(digitsOnly, 10);
    setInlineEditMoneyNumeric(num);
    setInlineEditMoneyDisplay(formatNumberWithDots(num));
  };

  const handleSaveInlineEditGroup = (ticket: CustomerBetTicket, group: GroupedBetItem) => {
    if (!onUpdateTicket) return;
    const nums = extractNumbersFromString(inlineEditNumbers);
    if (nums.length === 0 || inlineEditMoneyNumeric <= 0) return;

    const newItemsForGroup = buildBetItems(
      nums,
      inlineEditBetType,
      ticket.region,
      inlineEditMoneyNumeric,
      rateConfigs,
      group.specificPrizeId
    );

    if (newItemsForGroup.length === 0) return;

    const groupItemIds = new Set(group.items.map((i) => i.id));
    const firstIndex = ticket.items.findIndex((i) => groupItemIds.has(i.id));
    const remaining = ticket.items.filter((i) => !groupItemIds.has(i.id));

    let nextItems = [...remaining];
    if (firstIndex === -1) {
      nextItems = [...remaining, ...newItemsForGroup];
    } else {
      nextItems.splice(firstIndex, 0, ...newItemsForGroup);
    }

    const totalAmount = nextItems.reduce((sum, i) => sum + i.itemTotal, 0);
    const totalPrizesAccumulated = nextItems.reduce((sum, i) => sum + i.prizesCount, 0);

    onUpdateTicket({
      ...ticket,
      items: nextItems,
      totalAmount,
      totalPrizesAccumulated,
      notes: `Cập nhật lúc ${new Date().toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      })}`,
    });

    setInlineEditingCompositeKey(null);
  };

  // Filter tickets for current selected date and filters
  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      // Date match
      if (ticket.date !== selectedDate) return false;

      // Region filter
      if (regionFilter !== 'ALL' && ticket.region !== regionFilter) return false;

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchName = ticket.customerName.toLowerCase().includes(query);
        const matchNumber = ticket.items.some((item) => item.number.includes(query));
        const matchType = ticket.items.some((item) => item.betTypeName.toLowerCase().includes(query));
        if (!matchName && !matchNumber && !matchType) return false;
      }

      return true;
    });
  }, [tickets, selectedDate, regionFilter, searchTerm]);

  // Handle select all tickets
  const handleToggleSelectAll = () => {
    if (selectedTicketIds.length === filteredTickets.length) {
      setSelectedTicketIds([]);
    } else {
      setSelectedTicketIds(filteredTickets.map((t) => t.id));
    }
  };

  // Toggle single ticket selection
  const handleToggleSelectTicket = (id: string) => {
    setSelectedTicketIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Delete all tickets for current filter/date
  const handleDeleteAllCurrentDate = () => {
    if (regionFilter === 'ALL' && !searchTerm.trim() && onDeleteTicketsForDate) {
      onDeleteTicketsForDate(selectedDate);
    } else if (onDeleteMultipleTickets) {
      onDeleteMultipleTickets(filteredTickets.map((t) => t.id));
    } else {
      filteredTickets.forEach((t) => onDeleteTicket(t.id));
    }
    setSelectedTicketIds([]);
    setShowConfirmDeleteAll(false);
  };

  // Confirm and delete selected tickets without window.confirm
  const handleConfirmDeleteSelected = () => {
    if (selectedTicketIds.length === 0) return;
    if (onDeleteMultipleTickets) {
      onDeleteMultipleTickets(selectedTicketIds);
    } else {
      selectedTicketIds.forEach((id) => onDeleteTicket(id));
    }
    setSelectedTicketIds([]);
    setShowConfirmDeleteSelected(false);
  };

  // Generate crisp Zalo/SMS receipt message
  const handleCopyZalo = (ticket: CustomerBetTicket) => {
    const regionNames = { MN: 'MIỀN NAM', MT: 'MIỀN TRUNG', MB: 'MIỀN BẮC' };
    const dateFormatted = formatDateDisplay(ticket.date);
    const grouped = groupBetItems(ticket.items);

    let text = `📅 Ngày: ${dateFormatted} | Đài: ${regionNames[ticket.region]} (${ticket.stationName || ''})\n`;
    text += `--------------------------------\n`;

    grouped.forEach((group) => {
      text += `[${group.numbersLabel}] - ${group.betTypeName} - ${formatShortPrice(group.unitPrice)}\n`;
      text += `   👉 ${group.items.length} số x ${group.prizesCount} giải x ${formatCurrency(group.unitPrice)} = ${formatCurrency(group.groupTotal)}\n`;
    });

    text += `--------------------------------\n`;
    text += `💰 TỔNG TIỀN: ${formatCurrency(ticket.totalAmount)}\n`;
    text += `⏰ Ghi nhận lúc: ${new Date(ticket.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;

    navigator.clipboard.writeText(text);
    setCopiedTicketId(ticket.id);
    onCopyTextSuccess('Đã sao chép tin nhắn vé cược (đã ẩn tên khách)! Bạn có thể dán vào Zalo/SMS.');

    setTimeout(() => {
      setCopiedTicketId(null);
    }, 2500);
  };

  const getRegionBadge = (region: RegionType) => {
    switch (region) {
      case 'MN':
        return <span className="text-emerald-400 font-mono text-xs">Miền Nam (18 Lô)</span>;
      case 'MT':
        return <span className="text-cyan-400 font-mono text-xs">Miền Trung (18 Lô)</span>;
      case 'MB':
        return <span className="text-rose-400 font-mono text-xs">Miền Bắc (27 Lô)</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar: Search & Region Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên khách, con số (vd: 75) hoặc hình thức..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <span className="text-xs text-slate-400 flex items-center gap-1 mr-1 whitespace-nowrap">
            <Filter className="w-3.5 h-3.5 text-slate-500" /> Miền:
          </span>
          {(['ALL', 'MN', 'MT', 'MB'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRegionFilter(r)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                regionFilter === r
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {r === 'ALL' ? 'Tất Cả 3 Miền' : r === 'MN' ? 'Miền Nam' : r === 'MT' ? 'Miền Trung' : 'Miền Bắc'}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Action Bar & Total count */}
      {filteredTickets.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-950/80 rounded-xl border border-slate-800 text-xs">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300 font-medium">
              <input
                type="checkbox"
                checked={selectedTicketIds.length > 0 && selectedTicketIds.length === filteredTickets.length}
                onChange={handleToggleSelectAll}
                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-400"
              />
              <span>Chọn tất cả ({filteredTickets.length} vé)</span>
            </label>

            {selectedTicketIds.length > 0 && (
              <span className="text-amber-400 font-mono text-[11px]">
                (Đã chọn {selectedTicketIds.length} vé)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {selectedTicketIds.length > 0 && (
              <button
                type="button"
                onClick={() => setShowConfirmDeleteSelected(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 transition-colors text-xs font-medium cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Xóa {selectedTicketIds.length} vé đã chọn</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowConfirmDeleteAll(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-800/50 transition-colors text-xs font-medium cursor-pointer"
              title="Xóa toàn bộ các vé đã ghi trong ngày này"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Xóa tất cả vé ngày này</span>
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Delete Selected */}
      {showConfirmDeleteSelected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Xác nhận xóa vé đã chọn?</h4>
                <p className="text-xs text-slate-300 mt-1">
                  Bạn có chắc chắn muốn xóa <strong className="text-rose-400">{selectedTicketIds.length} vé cược</strong> đã chọn khỏi sổ sách không?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowConfirmDeleteSelected(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSelected}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xác nhận xóa ({selectedTicketIds.length} vé)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Delete All */}
      {showConfirmDeleteAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Xác nhận xóa tất cả vé?</h4>
                <p className="text-xs text-slate-300 mt-1">
                  Hành động này sẽ xóa toàn bộ <strong className="text-rose-400">{filteredTickets.length} vé cược</strong> của ngày <strong className="text-white">{formatDateDisplay(selectedDate)}</strong>. Sau khi xóa sẽ không thể phục hồi trừ khi bạn đã tải bản sao lưu.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowConfirmDeleteAll(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleDeleteAllCurrentDate}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xác nhận xóa hết</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket List */}
      {filteredTickets.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
          <FileSpreadsheet className="w-10 h-10 mx-auto text-slate-600 mb-2" />
          <p className="text-sm font-medium text-slate-300">Không có vé cược nào trong ngày {formatDateDisplay(selectedDate)}</p>
          <p className="text-xs text-slate-500 mt-1">
            {searchTerm ? 'Không tìm thấy kết quả phù hợp với từ khóa.' : 'Hãy sử dụng form bên trên để ghi lượt cược đầu tiên!'}
          </p>
          {tickets.length === 0 && onResetSampleTickets && (
            <button
              type="button"
              onClick={onResetSampleTickets}
              className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-medium transition-colors"
            >
              <span>Khôi phục vé mẫu để xem thử</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTickets.map((ticket, tIdx) => {
            const timeStr = new Date(ticket.createdAt).toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
            });
            const isTicketSelected = selectedTicketIds.includes(ticket.id);
            const isConfirmingDelete = confirmingTicketId === ticket.id;
            const isNewlyAdded = Date.now() - ticket.createdAt < 60000;
            const isCurrentlyEditing = editingTicketId === ticket.id;
            const groupedItems = groupBetItems(ticket.items);

            return (
              <div
                key={ticket.id}
                className={`bg-slate-900 border rounded-xl overflow-hidden shadow-sm transition-all ${
                  isCurrentlyEditing
                    ? 'border-amber-400 ring-2 ring-amber-500/30'
                    : isTicketSelected
                    ? 'border-amber-500/60 ring-1 ring-amber-500/20'
                    : isNewlyAdded
                    ? 'border-emerald-500/60 ring-1 ring-emerald-500/20'
                    : 'border-slate-800 hover:border-slate-700/80'
                }`}
              >
                {/* Ticket Top Header */}
                <div className="p-3 sm:px-4 bg-slate-950/70 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isTicketSelected}
                      onChange={() => handleToggleSelectTicket(ticket.id)}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-400 cursor-pointer"
                      aria-label="Chọn vé để xóa hàng loạt"
                    />

                    <span className="w-6 h-6 rounded-full bg-slate-800 text-amber-400 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                      {tIdx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-white tracking-wide">
                          {ticket.customerName}
                        </span>
                        {isCurrentlyEditing && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            ĐANG SỬA TRÊN FORM
                          </span>
                        )}
                        {isNewlyAdded && !isCurrentlyEditing && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            MỚI LƯU
                          </span>
                        )}
                        <span aria-hidden="true" className="text-slate-700">·</span>
                        {getRegionBadge(ticket.region)}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {timeStr}
                        </span>
                        {ticket.stationName && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>Đài: {ticket.stationName}</span>
                          </>
                        )}
                        {ticket.notes && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-slate-400 italic">{ticket.notes}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions for this ticket */}
                  <div className="flex items-center gap-1.5 self-end sm:self-auto flex-wrap">
                    {onEditTicket && (
                      <button
                        type="button"
                        onClick={() => onEditTicket(ticket)}
                        className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                          isCurrentlyEditing
                            ? 'bg-amber-500 text-slate-950 border-amber-400'
                            : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/40'
                        }`}
                        title="Chỉnh sửa / Cập nhật vé cược này"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>{isCurrentlyEditing ? 'Đang sửa' : 'Sửa vé'}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleCopyZalo(ticket)}
                      className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors ${
                        copiedTicketId === ticket.id
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                      }`}
                      title="Sao chép tin nhắn Zalo gửi khách"
                    >
                      {copiedTicketId === ticket.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Đã chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-amber-400" />
                          <span>Copy Zalo</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenReceipt(ticket)}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                      title="Xem và In biên lai cược"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-400" />
                      <span>Biên lai</span>
                    </button>

                    {isConfirmingDelete ? (
                      <div className="flex items-center gap-1 bg-rose-950/60 border border-rose-500/40 rounded-lg px-2 py-0.5">
                        <span className="text-[11px] text-rose-200 font-medium">Xóa vé này?</span>
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteTicket(ticket.id);
                            setConfirmingTicketId(null);
                            setSelectedTicketIds((prev) => prev.filter((id) => id !== ticket.id));
                          }}
                          className="px-2 py-0.5 text-[11px] font-bold bg-rose-600 hover:bg-rose-500 text-white rounded transition-colors"
                        >
                          Xóa
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmingTicketId(null)}
                          className="px-1.5 py-0.5 text-[11px] text-slate-300 hover:text-white rounded transition-colors"
                        >
                          Hủy
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmingTicketId(ticket.id)}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-rose-300 hover:text-white bg-rose-500/15 hover:bg-rose-600 border border-rose-500/30 rounded-lg transition-colors cursor-pointer"
                        title="Xóa vé này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa vé</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Mobile View: Zero-overflow stacked rows for Grouped Items */}
                <div className="md:hidden divide-y divide-slate-800/70 bg-slate-900/40">
                  {groupedItems.map((group) => {
                    const compositeKey = `${ticket.id}__${group.groupKey}`;
                    const isExpanded = !!expandedGroupKeys[compositeKey];
                    const isInlineEditing = inlineEditingCompositeKey === compositeKey;

                    return (
                      <div key={compositeKey} className="p-3 space-y-2">
                        <div
                          onClick={() => {
                            if (!isInlineEditing) toggleExpandGroup(compositeKey);
                          }}
                          className="flex items-start justify-between gap-2 cursor-pointer"
                        >
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono font-bold text-amber-300 text-sm tracking-wide break-words">
                                {group.numbersLabel}
                              </span>
                              {group.items.length > 1 && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-sans">
                                  {group.items.length} số
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-200 font-medium">
                              {group.betTypeName}
                            </div>
                            <div className="text-[11px] font-mono text-slate-400">
                              {group.items.length} số x {group.prizesCount} giải ({group.totalPrizes} giải) x{' '}
                              {formatCurrency(group.unitPrice)}
                            </div>
                          </div>

                          <div
                            className="flex flex-col items-end gap-1.5 shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="font-mono font-bold text-white text-sm tabular-nums">
                              {formatCurrency(group.groupTotal)}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => toggleExpandGroup(compositeKey)}
                                className={`p-1.5 rounded border transition-colors ${
                                  isExpanded
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                                }`}
                                title="Xem chi tiết từng con số"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-3.5 h-3.5 text-amber-400" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  isInlineEditing
                                    ? setInlineEditingCompositeKey(null)
                                    : handleStartInlineEditGroup(compositeKey, group)
                                }
                                className={`p-1.5 rounded border transition-colors ${
                                  isInlineEditing
                                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                                    : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
                                }`}
                                title="Sửa dòng cược này"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  if (onDeleteTicketGroup) {
                                    onDeleteTicketGroup(
                                      ticket.id,
                                      group.items.map((i) => i.id)
                                    );
                                  } else if (onDeleteTicketItem) {
                                    group.items.forEach((i) => onDeleteTicketItem(ticket.id, i.id));
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded transition-colors"
                                title={`Xóa dòng [${group.numbersLabel}]`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Mobile Inline Editor */}
                        {isInlineEditing && (
                          <div className="bg-slate-950 border border-amber-500/40 rounded-lg p-2.5 space-y-2.5">
                            <div className="flex items-center justify-between flex-wrap gap-1">
                              <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                                <Pencil className="w-3.5 h-3.5" />
                                <span>Sửa dòng: [{group.numbersLabel}]</span>
                              </span>
                              {onEditTicket && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setInlineEditingCompositeKey(null);
                                    onEditTicket(ticket);
                                  }}
                                  className="text-[11px] text-amber-400 hover:underline"
                                >
                                  Đưa lên Form trên
                                </button>
                              )}
                            </div>

                            <div className="space-y-2">
                              <div>
                                <label className="block text-[11px] text-slate-400 mb-1">
                                  Dãy số đánh:
                                </label>
                                <input
                                  type="text"
                                  value={inlineEditNumbers}
                                  onChange={(e) => setInlineEditNumbers(e.target.value)}
                                  className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
                                  placeholder="VD: 77, 66, 55"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] text-slate-400 mb-1">
                                  Hình thức cách chơi:
                                </label>
                                <select
                                  value={inlineEditBetType}
                                  onChange={(e) => setInlineEditBetType(e.target.value as BetType)}
                                  className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                                >
                                  {BET_TYPE_DEFINITIONS.map((def) => (
                                    <option key={def.type} value={def.type}>
                                      {def.label} ({def.getPrizesCount(ticket.region, group.specificPrizeId)} giải)
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-[11px] text-slate-400 mb-1">
                                  Tiền 1 giải (₫):
                                </label>
                                <input
                                  type="text"
                                  value={inlineEditMoneyDisplay}
                                  onChange={handleInlineMoneyChange}
                                  className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-mono font-bold focus:outline-none"
                                  placeholder="2.000"
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => setInlineEditingCompositeKey(null)}
                                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Hủy</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveInlineEditGroup(ticket, group)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Lưu Cập Nhật</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Mobile Expanded Sub-rows */}
                        {isExpanded && (
                          <div className="rounded-lg bg-slate-950 border border-slate-800 px-2.5 py-1.5 divide-y divide-slate-900 font-mono text-[11px]">
                            {group.items.map((item) => (
                              <div
                                key={item.id}
                                className="py-1.5 flex items-center justify-between gap-2"
                              >
                                <div className="min-w-0">
                                  <strong className="text-amber-200">Số {item.number}</strong>
                                  <span className="text-slate-400 ml-1.5">
                                    ({item.prizesCount} giải x {formatCurrency(item.unitPrice)})
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="font-bold text-slate-200 tabular-nums">
                                    {formatCurrency(item.itemTotal)}
                                  </span>
                                  {onDeleteTicketItem && (
                                    <button
                                      type="button"
                                      onClick={() => onDeleteTicketItem(ticket.id, item.id)}
                                      className="p-1 text-slate-500 hover:text-rose-400 rounded"
                                      title={`Xóa số ${item.number}`}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Desktop Table Breakdown of Grouped Items (Click arrow to expand individual numbers) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-950/40 text-slate-400 uppercase text-[10px] font-mono border-b border-slate-800/80">
                      <tr>
                        <th className="py-2 px-3 w-10 text-center">STT</th>
                        <th className="py-2 px-3">Con Số Đánh</th>
                        <th className="py-2 px-3">Hình Thức Cược</th>
                        <th className="py-2 px-3 text-right">Số Giải Mở</th>
                        <th className="py-2 px-3 text-right">Tiền 1 Giải</th>
                        <th className="py-2 px-3 text-right">Tổng Tiền</th>
                        <th className="py-2 px-2 w-28 text-center">Chi Tiết / Sửa / Xóa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50 bg-slate-900/40 font-mono">
                      {groupedItems.map((group, gIdx) => {
                        const compositeKey = `${ticket.id}__${group.groupKey}`;
                        const isExpanded = !!expandedGroupKeys[compositeKey];
                        const isInlineEditing = inlineEditingCompositeKey === compositeKey;

                        return (
                          <React.Fragment key={compositeKey}>
                            {/* Main Grouped Summary Row */}
                            <tr
                              onClick={() => {
                                if (!isInlineEditing) toggleExpandGroup(compositeKey);
                              }}
                              className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                            >
                              <td className="py-2.5 px-3 text-center text-slate-400 font-bold">
                                {gIdx + 1}
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-amber-300 text-sm tracking-wider">
                                    {group.numbersLabel}
                                  </span>
                                  {group.items.length > 1 && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-sans">
                                      {group.items.length} số
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-slate-200 font-sans font-medium">
                                <div>{group.betTypeName}</div>
                              </td>
                              <td className="py-2.5 px-3 text-right text-slate-300 tabular-nums">
                                <div>{group.prizesCount} giải</div>
                                {group.items.length > 1 && (
                                  <div className="text-[10px] text-slate-500">
                                    ({group.items.length} số = {group.totalPrizes} giải)
                                  </div>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-right text-slate-300 tabular-nums">
                                {formatCurrency(group.unitPrice)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-white text-sm tabular-nums">
                                {formatCurrency(group.groupTotal)}
                              </td>
                              <td
                                className="py-2.5 px-2 text-center"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => toggleExpandGroup(compositeKey)}
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

                                  <button
                                    type="button"
                                    onClick={() =>
                                      isInlineEditing
                                        ? setInlineEditingCompositeKey(null)
                                        : handleStartInlineEditGroup(compositeKey, group)
                                    }
                                    className={`p-1 rounded border transition-colors ${
                                      isInlineEditing
                                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                                        : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
                                    }`}
                                    title="Chỉnh sửa / Cập nhật dòng cược này"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (onDeleteTicketGroup) {
                                        onDeleteTicketGroup(
                                          ticket.id,
                                          group.items.map((i) => i.id)
                                        );
                                      } else if (onDeleteTicketItem) {
                                        group.items.forEach((i) => onDeleteTicketItem(ticket.id, i.id));
                                      }
                                    }}
                                    className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                                    title={`Xóa dòng [${group.numbersLabel}]`}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>

                            {/* Inline Editor Row for Updating a Grouped Row inside Saved Ticket */}
                            {isInlineEditing && (
                              <tr className="bg-slate-950 border-y border-amber-500/40 font-sans">
                                <td colSpan={7} className="p-3">
                                  <div className="space-y-2.5">
                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                      <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                                        <Pencil className="w-3.5 h-3.5" />
                                        <span>Chỉnh sửa & cập nhật dòng cược: [{group.numbersLabel}]</span>
                                      </span>
                                      {onEditTicket && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setInlineEditingCompositeKey(null);
                                            onEditTicket(ticket);
                                          }}
                                          className="text-[11px] text-amber-400 hover:underline"
                                        >
                                          Đưa toàn bộ vé lên Form trên để sửa chi tiết
                                        </button>
                                      )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                                      <div className="sm:col-span-5">
                                        <label className="block text-[11px] text-slate-400 mb-1">
                                          Dãy số đánh:
                                        </label>
                                        <input
                                          type="text"
                                          value={inlineEditNumbers}
                                          onChange={(e) => setInlineEditNumbers(e.target.value)}
                                          className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
                                          placeholder="VD: 77, 66, 55"
                                        />
                                      </div>

                                      <div className="sm:col-span-4">
                                        <label className="block text-[11px] text-slate-400 mb-1">
                                          Hình thức cách chơi:
                                        </label>
                                        <select
                                          value={inlineEditBetType}
                                          onChange={(e) => setInlineEditBetType(e.target.value as BetType)}
                                          className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                                        >
                                          {BET_TYPE_DEFINITIONS.map((def) => (
                                            <option key={def.type} value={def.type}>
                                              {def.label} ({def.getPrizesCount(ticket.region, group.specificPrizeId)} giải)
                                            </option>
                                          ))}
                                        </select>
                                      </div>

                                      <div className="sm:col-span-3">
                                        <label className="block text-[11px] text-slate-400 mb-1">
                                          Tiền 1 giải (₫):
                                        </label>
                                        <input
                                          type="text"
                                          value={inlineEditMoneyDisplay}
                                          onChange={handleInlineMoneyChange}
                                          className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-mono font-bold focus:outline-none"
                                          placeholder="2.000"
                                        />
                                      </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-2 pt-1">
                                      <button
                                        type="button"
                                        onClick={() => setInlineEditingCompositeKey(null)}
                                        className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                        <span>Hủy</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleSaveInlineEditGroup(ticket, group)}
                                        className="flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                        <span>Lưu Cập Nhật</span>
                                      </button>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}

                            {/* Expanded Detailed Breakdown Sub-rows */}
                            {isExpanded &&
                              group.items.map((item, idx) => (
                                <tr
                                  key={item.id}
                                  className="bg-slate-950/90 hover:bg-slate-900/90 text-[11px] border-l-2 border-l-amber-500/50"
                                >
                                  <td className="py-1.5 px-3 text-center text-slate-600">
                                    {gIdx + 1}.{idx + 1}
                                  </td>
                                  <td className="py-1.5 px-3 font-bold text-amber-200 pl-6">
                                    ↳ Số: {item.number}
                                  </td>
                                  <td className="py-1.5 px-3 text-slate-400 font-sans">
                                    <div>{item.betTypeName}</div>
                                    {item.notes && (
                                      <div className="text-[10px] text-slate-500 font-mono">
                                        {item.notes}
                                      </div>
                                    )}
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
                                  <td className="py-1.5 px-2 text-center">
                                    {onDeleteTicketItem && (
                                      <button
                                        type="button"
                                        onClick={() => onDeleteTicketItem(ticket.id, item.id)}
                                        className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                                        title={`Xóa mục số ${item.number}`}
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Ticket Footer: Total Amount for this customer */}
                <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="text-xs text-slate-400 flex items-center gap-2">
                    <span>Tổng: <strong className="text-slate-200">{groupedItems.length} dòng ({ticket.items.length} con số)</strong></span>
                    <span aria-hidden="true" className="text-slate-700">·</span>
                    <span>Tích lũy: <strong className="text-slate-200">{ticket.totalPrizesAccumulated} giải</strong></span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 uppercase font-mono tracking-wider">
                      TỔNG TIỀN KHÁCH [{ticket.customerName}]:
                    </span>
                    <span className="text-base sm:text-lg font-bold font-mono text-amber-300 tabular-nums">
                      {formatCurrency(ticket.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
