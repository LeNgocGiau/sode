import React, { useMemo, useRef, useState } from 'react';
import { CustomerBetTicket } from '../types/lottery';
import { formatCurrency, formatDateDisplay, getTodayDateString } from '../utils/formatters';
import { groupBetItems } from '../utils/lotteryCalculator';
import { 
  Calendar, 
  Users, 
  Ticket, 
  ChevronRight, 
  ChevronDown,
  ChevronUp,
  Download, 
  Upload, 
  Trash2,
  AlertCircle,
  Coins,
  MapPin,
  BookOpen,
  RotateCcw
} from 'lucide-react';

interface HistoryDateManagerProps {
  tickets: CustomerBetTicket[];
  selectedDate: string;
  onSelectDate: (date: string, switchToBetsTab?: boolean) => void;
  onRestoreData: (tickets: CustomerBetTicket[]) => void;
  onDeleteTicketsForDate?: (date: string) => void;
  onClearAllTickets?: () => void;
  onShowToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

interface DateHistoryItem {
  date: string;
  totalAmount: number;
  totalAmountMN: number;
  totalAmountMT: number;
  totalAmountMB: number;
  customerCount: number;
  ticketCount: number;
  numberCount: number;
}

export const HistoryDateManager: React.FC<HistoryDateManagerProps> = ({
  tickets,
  selectedDate,
  onSelectDate,
  onRestoreData,
  onDeleteTicketsForDate,
  onClearAllTickets,
  onShowToast,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmDeleteDate, setConfirmDeleteDate] = useState<string | null>(null);
  const [showConfirmClearAll, setShowConfirmClearAll] = useState(false);
  const [expandedDate, setExpandedDate] = useState<string | null>(selectedDate);
  const [expandedHistoryGroupKeys, setExpandedHistoryGroupKeys] = useState<Record<string, boolean>>({});

  const handleToggleDateDetail = (date: string) => {
    if (expandedDate === date) {
      // Đóng ô chi tiết thông tin lại khi đang mở
      setExpandedDate(null);
    } else {
      // Mở ô chi tiết thông tin của ngày này
      setExpandedDate(date);
      onSelectDate(date, false);
    }
  };

  const toggleHistoryGroupExpand = (key: string) => {
    setExpandedHistoryGroupKeys((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Group tickets by date
  const dateHistories: DateHistoryItem[] = useMemo(() => {
    const map = new Map<string, DateHistoryItem>();

    tickets.forEach((ticket) => {
      const d = ticket.date;
      const current = map.get(d) || {
        date: d,
        totalAmount: 0,
        totalAmountMN: 0,
        totalAmountMT: 0,
        totalAmountMB: 0,
        customerCount: 0,
        ticketCount: 0,
        numberCount: 0,
      };

      current.totalAmount += ticket.totalAmount;
      if (ticket.region === 'MN') current.totalAmountMN += ticket.totalAmount;
      if (ticket.region === 'MT') current.totalAmountMT += ticket.totalAmount;
      if (ticket.region === 'MB') current.totalAmountMB += ticket.totalAmount;
      current.ticketCount += 1;
      current.numberCount += ticket.items.length;

      map.set(d, current);
    });

    // Calculate unique customers for each date
    const result = Array.from(map.values()).map((item) => {
      const dayTickets = tickets.filter((t) => t.date === item.date);
      const uniqueNames = new Set(dayTickets.map((t) => t.customerName.trim().toLowerCase()));
      return {
        ...item,
        customerCount: uniqueNames.size,
      };
    });

    // Sort descending by date
    result.sort((a, b) => b.date.localeCompare(a.date));
    return result;
  }, [tickets]);

  // Export full JSON backup
  const handleExportBackup = () => {
    const dataStr = JSON.stringify(tickets, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sode-pro-backup-${getTodayDateString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    onShowToast('success', 'Xuất sao lưu thành công', 'File backup đã được tải về máy của bạn an toàn.');
  };

  // Import JSON backup
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          onRestoreData(parsed);
          onShowToast('success', 'Nhập dữ liệu thành công', `Đã phục hồi ${parsed.length} vé cược từ file sao lưu!`);
        } else {
          onShowToast('error', 'Lỗi định dạng', 'File sao lưu không đúng định dạng danh sách vé cược.');
        }
      } catch (err) {
        onShowToast('error', 'Lỗi đọc file', 'Không thể giải mã nội dung file JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-4">
      {/* Top Banner and Backup Actions */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-400" />
            <span>Lịch Sử Ghi Số Theo Từng Ngày Cụ Thể</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Dữ liệu được lưu trữ an toàn trên thiết bị của bạn. Dễ dàng tra cứu doanh thu và con số các ngày trước.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportFile}
            accept=".json"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-amber-400" />
            <span>Nhập File Backup</span>
          </button>

          <button
            type="button"
            onClick={handleExportBackup}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Tải Bản Sao Lưu</span>
          </button>

          {tickets.length > 0 && onClearAllTickets && (
            <button
              type="button"
              onClick={() => setShowConfirmClearAll(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-300 bg-rose-500/15 hover:bg-rose-500/25 rounded-lg border border-rose-500/30 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Xóa Toàn Bộ Sổ</span>
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Modal for Clear All History */}
      {showConfirmClearAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Xác nhận xóa toàn bộ sổ lịch sử?</h4>
                <p className="text-xs text-slate-300 mt-1">
                  Hành động này sẽ xóa toàn bộ <strong className="text-rose-400">{tickets.length} vé cược</strong> của tất cả các ngày. Hãy tải bản sao lưu trước nếu cần giữ lại dữ liệu.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowConfirmClearAll(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearAllTickets?.();
                  setShowConfirmClearAll(false);
                }}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xác nhận xóa toàn bộ</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Date History Cards Grid */}
      <div className="space-y-3">
        {dateHistories.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
            <Calendar className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p className="text-sm font-medium text-slate-300">Chưa có lịch sử ngày nào</p>
            <p className="text-xs text-slate-500 mt-1">
              Các ngày cược bạn ghi chép sẽ tự động tập hợp lại tại đây.
            </p>
          </div>
        ) : (
          dateHistories.map((item) => {
            const isSelected = expandedDate === item.date;
            const isToday = item.date === getTodayDateString();
            const dayTickets = tickets.filter((t) => t.date === item.date);

            return (
              <div
                key={item.date}
                className={`bg-slate-900 border rounded-xl overflow-hidden transition-all ${
                  isSelected
                    ? 'border-amber-500 ring-1 ring-amber-500/30 shadow-lg shadow-amber-500/10'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="p-4 sm:px-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Date and badges */}
                  <div
                    onClick={() => handleToggleDateDetail(item.date)}
                    className="flex items-start sm:items-center gap-3 cursor-pointer"
                  >
                    <div
                      className={`w-12 h-12 rounded-xl border flex flex-col items-center justify-center font-mono ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                          : 'bg-slate-950 border-slate-800 text-amber-400'
                      }`}
                    >
                      <span className="text-[10px] text-slate-400 uppercase">Ngày</span>
                      <span className="text-base font-bold">
                        {item.date.split('-')[2]}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-white tracking-wide">
                          {formatDateDisplay(item.date)}
                        </span>
                        {isToday && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            HÔM NAY
                          </span>
                        )}
                        {isSelected && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-400 text-slate-950 shadow-sm flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-pulse" />
                            ĐANG XEM
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-500" />
                          {item.customerCount} khách
                        </span>
                        <span aria-hidden="true" className="text-slate-700">·</span>
                        <span className="flex items-center gap-1">
                          <Ticket className="w-3.5 h-3.5 text-slate-500" />
                          {item.ticketCount} vé ({item.numberCount} số)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Breakdown by 3 Regions */}
                  <div
                    onClick={() => handleToggleDateDetail(item.date)}
                    className="grid grid-cols-3 gap-2 py-1.5 px-3 bg-slate-950/70 rounded-lg border border-slate-800/80 text-xs cursor-pointer"
                  >
                    <div>
                      <div className="text-[10px] text-emerald-400 font-medium">Miền Nam</div>
                      <div className="font-mono font-semibold text-slate-200 tabular-nums">
                        {formatCurrency(item.totalAmountMN)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-cyan-400 font-medium">Miền Trung</div>
                      <div className="font-mono font-semibold text-slate-200 tabular-nums">
                        {formatCurrency(item.totalAmountMT)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-rose-400 font-medium">Miền Bắc</div>
                      <div className="font-mono font-semibold text-slate-200 tabular-nums">
                        {formatCurrency(item.totalAmountMB)}
                      </div>
                    </div>
                  </div>

                  {/* Total and Action */}
                  <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">TỔNG NGÀY:</span>
                      <span className="text-base font-bold font-mono text-amber-300 tabular-nums">
                        {formatCurrency(item.totalAmount)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleDateDetail(item.date)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                        }`}
                      >
                        <span>{isSelected ? 'Đang Xem' : 'Xem Chi Tiết'}</span>
                        {isSelected ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => onSelectDate(item.date, true)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-950 hover:bg-slate-800 text-amber-300 border border-slate-800 transition-colors cursor-pointer"
                        title="Mở trong tab Ghi Số & Sổ Cược"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Mở Sổ</span>
                      </button>

                      {onDeleteTicketsForDate && (
                        confirmDeleteDate === item.date ? (
                          <div className="flex items-center gap-1 bg-rose-950/60 border border-rose-500/40 rounded-lg px-2 py-1">
                            <span className="text-[11px] text-rose-200 font-medium">Xóa ngày này?</span>
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteTicketsForDate(item.date);
                                setConfirmDeleteDate(null);
                              }}
                              className="px-2 py-0.5 text-[11px] font-bold bg-rose-600 hover:bg-rose-500 text-white rounded transition-colors"
                            >
                              Xóa
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteDate(null)}
                              className="px-1.5 py-0.5 text-[11px] text-slate-300 hover:text-white rounded transition-colors"
                            >
                              Hủy
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteDate(item.date)}
                            className="p-2 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-rose-400 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 transition-colors"
                            title={`Xóa toàn bộ vé ngày ${formatDateDisplay(item.date)}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Detailed Panel when user clicks "Đang Xem / Xem Chi Tiết" */}
                {isSelected && (
                  <div className="border-t border-amber-500/30 bg-slate-950/80 p-4 sm:p-5 space-y-4 animate-in fade-in duration-150">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <Coins className="w-4 h-4 text-amber-400" />
                        <span className="text-xs sm:text-sm font-bold text-amber-300 uppercase">
                          Chi Tiết Số Tiền Từng Đài & Tất Cả Khách Ngày {formatDateDisplay(item.date)}
                        </span>
                      </div>

                      {!isToday && (
                        <button
                          type="button"
                          onClick={() => onSelectDate(getTodayDateString(), false)}
                          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                          <span>Quay Về Hôm Nay ({formatDateDisplay(getTodayDateString())})</span>
                        </button>
                      )}
                    </div>

                    {/* 4 Detailed KPI Boxes for this specific date */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/40">
                        <div className="text-[11px] font-semibold text-amber-300 flex items-center justify-between">
                          <span>TỔNG TIỀN TẤT CẢ KHÁCH</span>
                          <span className="font-mono">{item.customerCount} khách</span>
                        </div>
                        <div className="text-lg font-bold font-mono text-white mt-1 tabular-nums">
                          {formatCurrency(item.totalAmount)}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {item.ticketCount} vé · {item.numberCount} con số
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                        <div className="text-[11px] font-semibold text-emerald-300 flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> Miền Nam (18 Lô)
                          </span>
                          <span className="font-mono">
                            {dayTickets.filter((t) => t.region === 'MN').length} vé
                          </span>
                        </div>
                        <div className="text-lg font-bold font-mono text-white mt-1 tabular-nums">
                          {formatCurrency(item.totalAmountMN)}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {item.totalAmount > 0
                            ? `${Math.round((item.totalAmountMN / item.totalAmount) * 100)}% tổng ngày`
                            : '0% tổng ngày'}
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                        <div className="text-[11px] font-semibold text-cyan-300 flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> Miền Trung (18 Lô)
                          </span>
                          <span className="font-mono">
                            {dayTickets.filter((t) => t.region === 'MT').length} vé
                          </span>
                        </div>
                        <div className="text-lg font-bold font-mono text-white mt-1 tabular-nums">
                          {formatCurrency(item.totalAmountMT)}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {item.totalAmount > 0
                            ? `${Math.round((item.totalAmountMT / item.totalAmount) * 100)}% tổng ngày`
                            : '0% tổng ngày'}
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30">
                        <div className="text-[11px] font-semibold text-rose-300 flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> Miền Bắc (27 Lô)
                          </span>
                          <span className="font-mono">
                            {dayTickets.filter((t) => t.region === 'MB').length} vé
                          </span>
                        </div>
                        <div className="text-lg font-bold font-mono text-white mt-1 tabular-nums">
                          {formatCurrency(item.totalAmountMB)}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {item.totalAmount > 0
                            ? `${Math.round((item.totalAmountMB / item.totalAmount) * 100)}% tổng ngày`
                            : '0% tổng ngày'}
                        </div>
                      </div>
                    </div>

                    {/* Customer Tickets for this History Date (Mobile Cards + Desktop Table) */}
                    <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
                      {/* Mobile View: Zero-overflow stacked cards */}
                      <div className="md:hidden divide-y divide-slate-800">
                        {dayTickets.map((t) => {
                          const grouped = groupBetItems(t.items);
                          return (
                            <div key={t.id} className="p-3 space-y-2.5">
                              {/* Mobile Card Top Header */}
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-sans font-bold text-amber-300 text-sm truncate">
                                      {t.customerName}
                                    </span>
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                                        t.region === 'MN'
                                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                          : t.region === 'MT'
                                          ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                                          : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                                      }`}
                                    >
                                      {t.region}
                                    </span>
                                    {t.stationName && (
                                      <span className="text-slate-400 text-[11px]">
                                        ({t.stationName})
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="text-right shrink-0">
                                  <div className="font-mono font-bold text-amber-300 text-sm tabular-nums">
                                    {formatCurrency(t.totalAmount)}
                                  </div>
                                  <div className="text-[11px] font-mono text-slate-400 tabular-nums">
                                    Tổng {t.totalPrizesAccumulated} giải
                                  </div>
                                </div>
                              </div>

                              {/* Mobile Grouped Bet Lines */}
                              <div className="space-y-1.5">
                                {grouped.map((g) => {
                                  const grpKey = `${t.id}__${g.groupKey}`;
                                  const isGrpExpanded = !!expandedHistoryGroupKeys[grpKey];
                                  return (
                                    <div
                                      key={g.groupKey}
                                      className="rounded-lg bg-slate-950/90 border border-slate-800/90 overflow-hidden"
                                    >
                                      <div
                                        onClick={() => toggleHistoryGroupExpand(grpKey)}
                                        className="p-2 flex items-start justify-between gap-2 cursor-pointer active:bg-slate-900"
                                      >
                                        <div className="min-w-0 space-y-0.5">
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                            <strong className="font-mono text-amber-200 text-xs sm:text-sm break-words">
                                              {g.numbersLabel}
                                            </strong>
                                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono">
                                              {g.items.length} số
                                            </span>
                                          </div>
                                          <div className="text-[11px] text-slate-300">
                                            {g.betTypeName}{' '}
                                            <span className="text-slate-400 font-mono">
                                              ({g.items.length} số x {g.prizesCount} giải x {formatCurrency(g.unitPrice)})
                                            </span>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-1.5 shrink-0">
                                          <strong className="font-mono text-xs text-white tabular-nums">
                                            {formatCurrency(g.groupTotal)}
                                          </strong>
                                          <span className="p-0.5 rounded bg-slate-900 border border-slate-800 text-amber-400">
                                            {isGrpExpanded ? (
                                              <ChevronUp className="w-3.5 h-3.5" />
                                            ) : (
                                              <ChevronDown className="w-3.5 h-3.5" />
                                            )}
                                          </span>
                                        </div>
                                      </div>

                                      {isGrpExpanded && (
                                        <div className="border-t border-slate-800/80 bg-slate-950 px-2.5 py-1.5 divide-y divide-slate-900 font-mono text-[11px]">
                                          {g.items.map((subItem) => (
                                            <div
                                              key={subItem.id}
                                              className="py-1 flex items-center justify-between gap-2 text-slate-300"
                                            >
                                              <span>
                                                <strong className="text-amber-200">Số {subItem.number}</strong>
                                              </span>
                                              <span className="text-slate-400 tabular-nums">
                                                {subItem.prizesCount} giải x {formatCurrency(subItem.unitPrice)} ={' '}
                                                <strong className="text-white">{formatCurrency(subItem.itemTotal)}</strong>
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
                          );
                        })}
                      </div>

                      {/* Desktop View: Clean Table */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-mono border-b border-slate-800">
                            <tr>
                              <th className="py-2 px-3 w-10 text-center">STT</th>
                              <th className="py-2 px-3">Khách Hàng</th>
                              <th className="py-2 px-3">Đài / Miền</th>
                              <th className="py-2 px-3">Các Dòng Số Đã Ghi (Bấm vào dòng để sổ chi tiết)</th>
                              <th className="py-2 px-3 text-right">Tổng Số Giải</th>
                              <th className="py-2 px-3 text-right">Tổng Tiền Khách</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 font-mono">
                            {dayTickets.map((t, tIdx) => {
                              const grouped = groupBetItems(t.items);
                              return (
                                <tr key={t.id} className="hover:bg-slate-800/40 align-top">
                                  <td className="py-2.5 px-3 text-center text-slate-500">
                                    {tIdx + 1}
                                  </td>
                                  <td className="py-2.5 px-3 font-sans font-bold text-amber-300">
                                    {t.customerName}
                                  </td>
                                  <td className="py-2.5 px-3 font-sans whitespace-nowrap">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                        t.region === 'MN'
                                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                          : t.region === 'MT'
                                          ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                                          : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                                      }`}
                                    >
                                      {t.region}
                                    </span>
                                    {t.stationName && (
                                      <span className="ml-1.5 text-slate-400 text-[11px]">
                                        ({t.stationName})
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3 space-y-1.5">
                                    {grouped.map((g) => {
                                      const grpKey = `${t.id}__${g.groupKey}`;
                                      const isGrpExpanded = !!expandedHistoryGroupKeys[grpKey];
                                      return (
                                        <div
                                          key={g.groupKey}
                                          className="rounded-lg bg-slate-950/70 border border-slate-800/80 overflow-hidden"
                                        >
                                          <div
                                            onClick={() => toggleHistoryGroupExpand(grpKey)}
                                            className="px-2.5 py-1.5 flex items-center justify-between gap-2 text-xs cursor-pointer hover:bg-slate-900/80 transition-colors"
                                          >
                                            <div>
                                              <strong className="text-amber-200">{g.numbersLabel}</strong>{' '}
                                              <span className="text-slate-400 font-sans">
                                                — {g.betTypeName} ({g.items.length} số x {g.prizesCount} giải x{' '}
                                                {formatCurrency(g.unitPrice)} ={' '}
                                                <strong className="text-white">
                                                  {formatCurrency(g.groupTotal)}
                                                </strong>
                                                )
                                              </span>
                                            </div>
                                            <span className="p-0.5 rounded bg-slate-900 border border-slate-800 text-amber-400 shrink-0">
                                              {isGrpExpanded ? (
                                                <ChevronUp className="w-3.5 h-3.5" />
                                              ) : (
                                                <ChevronDown className="w-3.5 h-3.5" />
                                              )}
                                            </span>
                                          </div>
                                          {isGrpExpanded && (
                                            <div className="border-t border-slate-800/80 bg-slate-950 px-3 py-1.5 divide-y divide-slate-900 text-[11px]">
                                              {g.items.map((subItem) => (
                                                <div
                                                  key={subItem.id}
                                                  className="py-1 flex items-center justify-between text-slate-300"
                                                >
                                                  <span>
                                                    <strong className="text-amber-200">↳ Số: {subItem.number}</strong>{' '}
                                                    <span className="text-slate-400 font-sans">({subItem.betTypeName})</span>
                                                  </span>
                                                  <span className="text-slate-400 tabular-nums">
                                                    {subItem.prizesCount} giải x {formatCurrency(subItem.unitPrice)} ={' '}
                                                    <strong className="text-white">{formatCurrency(subItem.itemTotal)}</strong>
                                                  </span>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </td>
                                  <td className="py-2.5 px-3 text-right text-slate-300 tabular-nums whitespace-nowrap">
                                    {t.totalPrizesAccumulated} giải
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-bold text-amber-300 text-sm tabular-nums whitespace-nowrap">
                                    {formatCurrency(t.totalAmount)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
