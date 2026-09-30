import React, { useState } from 'react';
import { CustomerBetTicket } from '../types/lottery';
import { formatCurrency, formatDateDisplay, formatShortPrice } from '../utils/formatters';
import { groupBetItems } from '../utils/lotteryCalculator';
import { Printer, Copy, Check, X, Sparkles, MapPin, Calendar, Clock, ChevronDown, ChevronUp } from 'lucide-react';

interface ReceiptModalProps {
  ticket: CustomerBetTicket | null;
  onClose: () => void;
  onCopySuccess: (msg: string) => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  ticket,
  onClose,
  onCopySuccess,
}) => {
  const [copied, setCopied] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});

  if (!ticket) return null;

  const regionNames = { MN: 'MIỀN NAM', MT: 'MIỀN TRUNG', MB: 'MIỀN BẮC' };
  const groupedItems = groupBetItems(ticket.items);

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyZalo = () => {
    let text = `📅 Ngày: ${formatDateDisplay(ticket.date)} | Đài: ${regionNames[ticket.region]} (${ticket.stationName || ''})\n`;
    text += `--------------------------------\n`;

    groupedItems.forEach((group) => {
      text += `[${group.numbersLabel}] - ${group.betTypeName} - ${formatShortPrice(group.unitPrice)}\n`;
      text += `   👉 ${group.items.length} số x ${group.prizesCount} giải x ${formatCurrency(group.unitPrice)} = ${formatCurrency(group.groupTotal)}\n`;
    });

    text += `--------------------------------\n`;
    text += `💰 TỔNG TIỀN: ${formatCurrency(ticket.totalAmount)}\n`;
    text += `⏰ Ghi nhận lúc: ${new Date(ticket.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    onCopySuccess('Đã sao chép biên lai vé cược (đã ẩn tên khách) để gửi Zalo/SMS!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Top Bar */}
        <div className="p-3.5 sm:px-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
              Biên Lai Cược Khách Hàng
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Receipt Paper Container */}
        <div className="p-3 sm:p-5 overflow-y-auto flex-1 bg-slate-950 text-slate-100">
          <div
            id="printable-receipt"
            className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 sm:p-5 shadow-sm space-y-3.5"
          >
            {/* Store and Receipt Header */}
            <div className="text-center pb-3 border-b border-dashed border-slate-700">
              <div className="text-sm sm:text-base font-bold text-amber-400 tracking-wider">
                SỔ GHI SỐ ĐỀ & TÍNH TIỀN TỰ ĐỘNG
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Biên Lai Chi Tiết Vé Cược</div>
              <div className="mt-2 text-base sm:text-lg font-bold text-white tracking-wide break-words">
                KHÁCH: {ticket.customerName.toUpperCase()}
              </div>
            </div>

            {/* Meta details */}
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 py-1.5 border-b border-slate-800">
              <div className="flex items-center gap-1.5 min-w-0">
                <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">
                  Ngày: <strong className="text-white">{formatDateDisplay(ticket.date)}</strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5 justify-end sm:justify-start min-w-0">
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">
                  Giờ:{' '}
                  <strong className="text-white">
                    {new Date(ticket.createdAt).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5 col-span-2 min-w-0">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="break-words">
                  Đài: <strong className="text-white">{regionNames[ticket.region]}</strong>
                  {ticket.stationName && !regionNames[ticket.region].includes(ticket.stationName)
                    ? ` (${ticket.stationName})`
                    : ''}
                </span>
              </div>
            </div>

            {/* Zero-Overflow Itemized List */}
            <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl bg-slate-950/50 overflow-hidden">
              {groupedItems.map((group) => {
                const isExpanded = !!expandedKeys[group.groupKey];
                return (
                  <div key={group.groupKey} className="p-3 space-y-2">
                    <div
                      onClick={() => toggleExpand(group.groupKey)}
                      className="cursor-pointer space-y-1.5"
                    >
                      {/* Row 1: Bet Type + Group Total */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                          <span className="text-xs font-bold text-slate-200">
                            {group.betTypeName}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            {group.items.length} số
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="font-mono font-bold text-sm text-amber-300 tabular-nums">
                            {formatCurrency(group.groupTotal)}
                          </span>
                          <span className="p-0.5 rounded bg-slate-800/80 text-slate-300">
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5 text-amber-400" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Row 2: Numbers (wrapped cleanly, never overflows) */}
                      <div className="font-mono font-bold text-amber-300 text-xs sm:text-sm break-words leading-relaxed bg-slate-900/90 px-2.5 py-1.5 rounded-lg border border-slate-800/80">
                        {group.numbersLabel}
                      </div>

                      {/* Row 3: Formula summary */}
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                        <span>
                          {group.items.length} số × {group.prizesCount} giải ({group.totalPrizes} giải)
                        </span>
                        <span className="tabular-nums">
                          × {formatCurrency(group.unitPrice)}/giải
                        </span>
                      </div>
                    </div>

                    {/* Expanded Sub-items */}
                    {isExpanded && (
                      <div className="rounded-lg bg-slate-900 border border-slate-800 px-2.5 py-1.5 divide-y divide-slate-800/70 font-mono text-[11px]">
                        {group.items.map((item) => (
                          <div
                            key={item.id}
                            className="py-1 flex items-center justify-between gap-2 text-slate-300"
                          >
                            <span className="font-bold text-amber-200">
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

            {/* Summary Block */}
            <div className="pt-3 border-t border-dashed border-slate-700 space-y-1.5">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Tổng số con số đánh:</span>
                <span className="font-mono font-semibold text-slate-200">{ticket.items.length} số</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Tổng tích lũy số giải:</span>
                <span className="font-mono font-semibold text-slate-200">{ticket.totalPrizesAccumulated} giải</span>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-slate-800 text-sm gap-2">
                <span className="font-bold text-white uppercase font-mono text-xs sm:text-sm">
                  TỔNG TIỀN PHẢI THU:
                </span>
                <span className="text-lg sm:text-xl font-bold font-mono text-amber-300 tabular-nums">
                  {formatCurrency(ticket.totalAmount)}
                </span>
              </div>
            </div>

            <div className="text-center pt-1 text-[11px] text-slate-500 italic">
              Chúc quý khách may mắn và phát tài!
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-3.5 sm:px-5 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-2">
          <button
            onClick={handleCopyZalo}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 text-xs font-semibold rounded-lg border transition-colors ${
              copied
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Đã sao chép</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Sao Chép Zalo/SMS</span>
              </>
            )}
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-colors shrink-0"
          >
            <Printer className="w-4 h-4 shrink-0" />
            <span>In Hóa Đơn</span>
          </button>
        </div>
      </div>
    </div>
  );
};
