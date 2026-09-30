import React, { useState, useMemo, useEffect } from 'react';
import { 
  BetRateConfig, 
  BetType, 
  CustomerBetTicket, 
  GroupedBetItem,
  ParsedBetItem, 
  RegionType 
} from '../types/lottery';
import { 
  BET_TYPE_DEFINITIONS, 
  REGIONS, 
  SPECIFIC_PRIZES 
} from '../data/defaultConfig';
import { 
  buildBetItems, 
  extractNumbersFromString,
  groupBetItems
} from '../utils/lotteryCalculator';
import { 
  formatCurrency, 
  formatNumberWithDots, 
  parseCurrencyInput 
} from '../utils/formatters';
import { 
  Plus, 
  Trash2, 
  CheckCircle, 
  Calculator, 
  ArrowRight, 
  Sparkles,
  Layers,
  Clock,
  RotateCcw,
  X,
  CheckCheck,
  AlertCircle,
  CheckCircle2,
  Printer,
  ChevronDown,
  ChevronUp,
  Pencil,
  Check
} from 'lucide-react';
import { SearchableMultiSelect, MultiSelectOption } from './SearchableMultiSelect';

interface BetEntryFormProps {
  selectedDate: string;
  rateConfigs: BetRateConfig[];
  existingCustomerNames: string[];
  onSaveTicket: (ticket: CustomerBetTicket) => void;
  editingTicket?: CustomerBetTicket | null;
  onUpdateTicket?: (ticket: CustomerBetTicket) => void;
  onCancelEditTicket?: () => void;
  onShowToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
  onOpenReceipt?: (ticket: CustomerBetTicket) => void;
  presetCustomerName?: string;
  presetRegion?: RegionType;
}

export const BetEntryForm: React.FC<BetEntryFormProps> = ({
  selectedDate,
  rateConfigs,
  existingCustomerNames,
  onSaveTicket,
  editingTicket = null,
  onUpdateTicket,
  onCancelEditTicket,
  onShowToast,
  onOpenReceipt,
  presetCustomerName = '',
  presetRegion = 'MN',
}) => {
  // Customer & Ticket Header state
  const [customerName, setCustomerName] = useState(presetCustomerName);
  const [region, setRegion] = useState<RegionType>(presetRegion);
  const [stationName, setStationName] = useState('');

  // Number input and Multi-Bet Selection state (always start empty so user selects explicitly)
  const [numbersInput, setNumbersInput] = useState('');
  const [selectedBetTypes, setSelectedBetTypes] = useState<BetType[]>([]);
  const [specificPrizeId, setSpecificPrizeId] = useState<string>('g8');
  
  // Money input with 3-digit thousand formatting
  const [moneyDisplay, setMoneyDisplay] = useState('2.000');
  const [numericMoney, setNumericMoney] = useState(2000);

  // Staged items for the current customer ticket
  const [stagedItems, setStagedItems] = useState<ParsedBetItem[]>([]);
  const [confirmClearStaged, setConfirmClearStaged] = useState(false);

  // Expand/collapse state for grouped rows in Preview and Staged tables
  const [expandedPreviewKeys, setExpandedPreviewKeys] = useState<Record<string, boolean>>({});
  const [expandedStagedKeys, setExpandedStagedKeys] = useState<Record<string, boolean>>({});

  // Inline editing state for a staged group
  const [editingGroupKey, setEditingGroupKey] = useState<string | null>(null);
  const [editGroupNumbers, setEditGroupNumbers] = useState<string>('');
  const [editGroupBetType, setEditGroupBetType] = useState<BetType>('bao_5_cuoi');
  const [editGroupSpecificPrizeId, setEditGroupSpecificPrizeId] = useState<string>('g8');
  const [editGroupMoneyDisplay, setEditGroupMoneyDisplay] = useState<string>('2.000');
  const [editGroupNumericMoney, setEditGroupNumericMoney] = useState<number>(2000);

  // Inline feedback banner state when saving or encountering validation errors
  const [lastSavedTicket, setLastSavedTicket] = useState<CustomerBetTicket | null>(null);
  const [lastSavedWasUpdate, setLastSavedWasUpdate] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Load editingTicket into form when user clicks "Sửa vé" from CustomerBetList
  useEffect(() => {
    if (editingTicket) {
      setCustomerName(editingTicket.customerName);
      setRegion(editingTicket.region);
      setStationName(editingTicket.stationName || '');
      setStagedItems(editingTicket.items);
      setNumbersInput('');
      setSelectedBetTypes([]);
      setEditingGroupKey(null);
      setLastSavedTicket(null);
      setFormError(null);
    }
  }, [editingTicket]);

  // Convert BET_TYPE_DEFINITIONS into options for SearchableMultiSelect
  const betTypeOptions: MultiSelectOption<BetType>[] = useMemo(() => {
    return BET_TYPE_DEFINITIONS.map((def) => {
      const prizeCount = def.getPrizesCount(region, specificPrizeId);
      return {
        value: def.type,
        label: def.label,
        badge: `${def.badge} (${prizeCount} giải)`,
        description: def.description,
        category: def.category,
      };
    });
  }, [region, specificPrizeId]);

  // Update preset when passed from parent
  useEffect(() => {
    if (presetCustomerName && !editingTicket) {
      setCustomerName(presetCustomerName);
    }
    if (presetRegion && !editingTicket) {
      setRegion(presetRegion);
    }
  }, [presetCustomerName, presetRegion, editingTicket]);

  // Clear error when user types
  useEffect(() => {
    if (numbersInput || stagedItems.length > 0) {
      setFormError(null);
    }
  }, [numbersInput, stagedItems.length, selectedBetTypes.length, numericMoney]);

  // Handle money input changes, automatically formatting with dots every 3 digits
  const handleMoneyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    
    // Check if user is typing shortcut like 2k, 10k, 1.5tr
    if (/[kmtr]/i.test(rawVal)) {
      setMoneyDisplay(rawVal);
      const parsed = parseCurrencyInput(rawVal);
      setNumericMoney(parsed);
      return;
    }

    // Clean dots and get raw numeric value
    const digitsOnly = rawVal.replace(/\D/g, '');
    if (!digitsOnly) {
      setMoneyDisplay('');
      setNumericMoney(0);
      return;
    }

    const num = parseInt(digitsOnly, 10);
    setNumericMoney(num);
    setMoneyDisplay(formatNumberWithDots(num));
  };

  // Handle money input in inline group editor
  const handleEditGroupMoneyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    if (/[kmtr]/i.test(rawVal)) {
      setEditGroupMoneyDisplay(rawVal);
      setEditGroupNumericMoney(parseCurrencyInput(rawVal));
      return;
    }
    const digitsOnly = rawVal.replace(/\D/g, '');
    if (!digitsOnly) {
      setEditGroupMoneyDisplay('');
      setEditGroupNumericMoney(0);
      return;
    }
    const num = parseInt(digitsOnly, 10);
    setEditGroupNumericMoney(num);
    setEditGroupMoneyDisplay(formatNumberWithDots(num));
  };

  // Quick money adder buttons
  const setQuickMoney = (amount: number) => {
    setNumericMoney(amount);
    setMoneyDisplay(formatNumberWithDots(amount));
  };

  // Parsed numbers from input
  const extractedNumbers = useMemo(() => {
    return extractNumbersFromString(numbersInput);
  }, [numbersInput]);

  // Remove a specific number from the current input string
  const handleRemoveNumberFromInput = (numToRemove: string) => {
    const remaining = extractedNumbers.filter((n) => n !== numToRemove);
    setNumbersInput(remaining.join(' '));
  };

  // Real-time preview of the current bet entry before adding (calculated across all selected bet types)
  const previewItems = useMemo(() => {
    if (extractedNumbers.length === 0 || numericMoney <= 0 || selectedBetTypes.length === 0) return [];
    
    const allItems: ParsedBetItem[] = [];
    selectedBetTypes.forEach((bType) => {
      const items = buildBetItems(
        extractedNumbers,
        bType,
        region,
        numericMoney,
        specificPrizeId,
        rateConfigs
      );
      allItems.push(...items);
    });

    return allItems;
  }, [extractedNumbers, selectedBetTypes, region, numericMoney, specificPrizeId, rateConfigs]);

  // Grouped preview items (gom lại 1 dòng duy nhất cho mỗi hình thức & đơn giá)
  const groupedPreviewItems = useMemo(() => {
    return groupBetItems(previewItems);
  }, [previewItems]);

  // Grouped staged items
  const groupedStagedItems = useMemo(() => {
    return groupBetItems(stagedItems);
  }, [stagedItems]);

  const previewTotalAmount = useMemo(() => {
    return previewItems.reduce((sum, item) => sum + item.itemTotal, 0);
  }, [previewItems]);

  const previewTotalPrizes = useMemo(() => {
    return previewItems.reduce((sum, item) => sum + item.prizesCount, 0);
  }, [previewItems]);

  const toggleExpandPreview = (groupKey: string) => {
    setExpandedPreviewKeys((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  const toggleExpandStaged = (groupKey: string) => {
    setExpandedStagedKeys((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  // Add current preview to staged ticket & reset step 3 (selectedBetTypes = []) as requested
  const handleAddPreviewToTicket = () => {
    if (previewItems.length === 0) return;
    const countAdded = previewItems.length;
    setStagedItems((prev) => [...prev, ...previewItems]);
    // Reset trống lại ô nhập số VÀ ô 3. Chọn Hình Thức Cách Chơi bắt user chọn lại
    setNumbersInput('');
    setSelectedBetTypes([]);
    setConfirmClearStaged(false);
    setLastSavedTicket(null);
    onShowToast?.(
      'info',
      'Đã thêm đợt cược vào vé',
      `Đã gom ${countAdded} mục cược (${formatCurrency(previewTotalAmount)}) vào vé. Vui lòng chọn lại Hình Thức Cách Chơi cho đợt tiếp theo hoặc nhấn Hoàn Thành.`
    );
  };

  // Remove a whole group from preview
  const handleRemovePreviewGroup = (group: GroupedBetItem) => {
    if (selectedBetTypes.length > 1) {
      setSelectedBetTypes((prev) => prev.filter((t) => t !== group.betType));
    } else {
      setNumbersInput('');
    }
  };

  // Remove single staged item
  const handleRemoveStagedItem = (id: string) => {
    setStagedItems((prev) => prev.filter((item) => item.id !== id));
    onShowToast?.('info', 'Đã xóa mục cược', 'Đã gỡ 1 con số khỏi danh sách chờ.');
  };

  // Remove a whole grouped row from staged items
  const handleRemoveStagedGroup = (group: GroupedBetItem) => {
    const idsToRemove = new Set(group.items.map((i) => i.id));
    setStagedItems((prev) => prev.filter((item) => !idsToRemove.has(item.id)));
    if (editingGroupKey === group.groupKey) {
      setEditingGroupKey(null);
    }
    onShowToast?.(
      'info',
      'Đã xóa nhóm số cược',
      `Đã xóa dòng [${group.numbersLabel}] (${group.betTypeName}) khỏi vé.`
    );
  };

  // Start inline editing a staged group
  const handleStartEditStagedGroup = (group: GroupedBetItem) => {
    setEditingGroupKey(group.groupKey);
    const rawNumbers =
      group.betType === 'cheo_2_5' || group.betType === 'xien_3'
        ? Array.from(new Set(group.numbers.join(' ').split(/[^0-9]+/).filter(Boolean))).join(' ')
        : group.numbers.join(', ');
    setEditGroupNumbers(rawNumbers);
    setEditGroupBetType(group.betType);
    setEditGroupSpecificPrizeId(group.specificPrizeId || 'g8');
    setEditGroupNumericMoney(group.unitPrice);
    setEditGroupMoneyDisplay(formatNumberWithDots(group.unitPrice));
  };

  // Save inline edit of a staged group
  const handleSaveEditStagedGroup = (oldGroup: GroupedBetItem) => {
    const parsedNums = extractNumbersFromString(editGroupNumbers);
    if (parsedNums.length === 0 || editGroupNumericMoney <= 0) {
      onShowToast?.('error', 'Dữ liệu sửa chưa hợp lệ', 'Vui lòng nhập ít nhất 1 con số và số tiền lớn hơn 0đ.');
      return;
    }

    const updatedItems = buildBetItems(
      parsedNums,
      editGroupBetType,
      region,
      editGroupNumericMoney,
      editGroupSpecificPrizeId,
      rateConfigs
    );

    const oldIds = new Set(oldGroup.items.map((i) => i.id));
    setStagedItems((prev) => {
      const firstIndex = prev.findIndex((i) => oldIds.has(i.id));
      const filtered = prev.filter((i) => !oldIds.has(i.id));
      if (firstIndex === -1) return [...filtered, ...updatedItems];
      return [
        ...filtered.slice(0, firstIndex),
        ...updatedItems,
        ...filtered.slice(firstIndex),
      ];
    });

    setEditingGroupKey(null);
    onShowToast?.(
      'success',
      'Đã cập nhật dòng cược',
      `Đã sửa thành: ${parsedNums.join(', ')} - ${formatCurrency(
        updatedItems.reduce((s, i) => s + i.itemTotal, 0)
      )}`
    );
  };

  // Load a staged group back up to the top form inputs for editing
  const handleLoadGroupToMainInputs = (group: GroupedBetItem) => {
    const rawNumbers =
      group.betType === 'cheo_2_5' || group.betType === 'xien_3'
        ? Array.from(new Set(group.numbers.join(' ').split(/[^0-9]+/).filter(Boolean))).join(' ')
        : group.numbers.join(' ');
    setNumbersInput(rawNumbers);
    setSelectedBetTypes([group.betType]);
    if (group.specificPrizeId) {
      setSpecificPrizeId(group.specificPrizeId);
    }
    setNumericMoney(group.unitPrice);
    setMoneyDisplay(formatNumberWithDots(group.unitPrice));

    const idsToRemove = new Set(group.items.map((i) => i.id));
    setStagedItems((prev) => prev.filter((item) => !idsToRemove.has(item.id)));
    setEditingGroupKey(null);
    onShowToast?.(
      'info',
      'Đã đưa lên ô nhập để sửa',
      `Đang sửa dãy số [${rawNumbers}] trên form chính.`
    );
  };

  // Clear all staged without window.confirm
  const handleClearStaged = () => {
    if (stagedItems.length === 0) return;
    if (!confirmClearStaged) {
      setConfirmClearStaged(true);
      return;
    }
    setStagedItems([]);
    setConfirmClearStaged(false);
    setEditingGroupKey(null);
    onShowToast?.('info', 'Đã xóa toàn bộ mục chờ', 'Đã xóa tất cả các mục đang chờ trong vé hiện tại.');
  };

  // Clear numbers input
  const handleClearNumbersInput = () => {
    setNumbersInput('');
    onShowToast?.('info', 'Đã xóa dãy số', 'Đã làm trống ô nhập dãy số.');
  };

  // Total accumulated for the ticket
  const stagedTotalAmount = useMemo(() => {
    return stagedItems.reduce((sum, item) => sum + item.itemTotal, 0);
  }, [stagedItems]);

  const stagedTotalPrizes = useMemo(() => {
    return stagedItems.reduce((sum, item) => sum + item.prizesCount, 0);
  }, [stagedItems]);

  // Final submit of complete ticket (Create new OR Update existing)
  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Combine both already-staged items AND any currently previewed items in the input box
    const itemsToSave = [...stagedItems, ...previewItems];

    if (itemsToSave.length === 0) {
      const errMsg =
        extractedNumbers.length === 0
          ? 'Vui lòng nhập ít nhất 1 con số đánh (ví dụ: 75 10) trước khi lưu vào sổ!'
          : selectedBetTypes.length === 0
          ? 'Vui lòng chọn ít nhất 1 hình thức cách chơi ở mục 3 (ví dụ: Bao 5 cuối, 2 Chân Lô...)!'
          : 'Vui lòng nhập số tiền cược hợp lệ (lớn hơn 0đ)!';
      setFormError(errMsg);
      onShowToast?.('error', 'Chưa thể lưu vé cược', errMsg);
      return;
    }

    const finalCustomer = customerName.trim() || 'Khách vãng lai';
    const totalAmount = itemsToSave.reduce((sum, item) => sum + item.itemTotal, 0);
    const totalPrizesAccumulated = itemsToSave.reduce((sum, item) => sum + item.prizesCount, 0);

    if (editingTicket && onUpdateTicket) {
      const updatedTicket: CustomerBetTicket = {
        ...editingTicket,
        customerName: finalCustomer,
        date: selectedDate,
        region,
        stationName:
          stationName.trim() ||
          (region === 'MB' ? 'Miền Bắc' : region === 'MN' ? 'Miền Nam' : 'Miền Trung'),
        items: itemsToSave,
        totalAmount,
        totalPrizesAccumulated,
        notes: `Cập nhật lúc ${new Date().toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
        })}`,
      };

      onUpdateTicket(updatedTicket);
      setLastSavedTicket(updatedTicket);
      setLastSavedWasUpdate(true);
      setFormError(null);
      setStagedItems([]);
      setConfirmClearStaged(false);
      setNumbersInput('');
      setSelectedBetTypes([]);
      setStationName('');
      return;
    }

    const newTicket: CustomerBetTicket = {
      id: `ticket-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      customerName: finalCustomer,
      date: selectedDate,
      region,
      stationName: stationName.trim() || (region === 'MB' ? 'Miền Bắc' : region === 'MN' ? 'Miền Nam' : 'Miền Trung'),
      items: itemsToSave,
      totalAmount,
      totalPrizesAccumulated,
      createdAt: Date.now(),
      notes: `Ghi lúc ${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`,
    };

    onSaveTicket(newTicket);
    setLastSavedTicket(newTicket);
    setLastSavedWasUpdate(false);
    setFormError(null);

    // Reset inputs
    setStagedItems([]);
    setConfirmClearStaged(false);
    setNumbersInput('');
    setSelectedBetTypes([]);
    setStationName('');
  };

  // Quick helper to fill sample requested by user:
  // "75 10 86 72 bao lô 5 cuối con 2k"
  const handleFillExampleUser = () => {
    setCustomerName('Anh Ba (Ví dụ)');
    setRegion('MN');
    setNumbersInput('75 10 86 72');
    setSelectedBetTypes(['bao_5_cuoi']);
    setNumericMoney(2000);
    setMoneyDisplay('2.000');
  };

  // Quick helper for 2nd part of example:
  // "778 694 đặc biệt 10k"
  const handleFillExampleSpecial = () => {
    setNumbersInput('778 694');
    setSelectedBetTypes(['chot_db']);
    setNumericMoney(10000);
    setMoneyDisplay('10.000');
  };

  return (
    <div
      className={`bg-slate-900 border rounded-xl p-3 sm:p-5 shadow-sm mb-6 transition-all ${
        editingTicket
          ? 'border-amber-500 ring-2 ring-amber-500/20'
          : 'border-slate-800'
      }`}
    >
      {/* Active Ticket Editing Mode Banner */}
      {editingTicket && (
        <div className="mb-4 p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-in fade-in duration-150">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0">
              <Pencil className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-amber-300">
                ĐANG CHỈNH SỬA & CẬP NHẬT VÉ CỦA KHÁCH: [{editingTicket.customerName}]
              </div>
              <p className="text-[11px] text-slate-300">
                Bạn có thể sửa tên khách, thêm/xóa/sửa các dòng số bên dưới rồi nhấn <strong>"Cập Nhật & Lưu Vào Sổ"</strong>.
              </p>
            </div>
          </div>

          {onCancelEditTicket && (
            <button
              type="button"
              onClick={() => {
                setStagedItems([]);
                setNumbersInput('');
                setSelectedBetTypes([]);
                setCustomerName('');
                setStationName('');
                setEditingGroupKey(null);
                onCancelEditTicket();
              }}
              className="self-end sm:self-auto px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" />
              <span>Hủy chỉnh sửa</span>
            </button>
          )}
        </div>
      )}

      {/* Top Header of Form */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-slate-800 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Calculator className="w-4 h-4 sm:w-5 h-5 text-amber-400" />
              <span>{editingTicket ? 'Chỉnh Sửa Vé Cược Khách Hàng' : 'Ghi Vé Cược & Tự Động Tính Tiền'}</span>
            </h2>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
            Nhập dãy số, chọn nhiều cách chơi cùng lúc, hệ thống tự động gom dòng và tính tổng tiền
          </p>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={handleFillExampleUser}
            className="text-[11px] px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition-colors whitespace-nowrap"
            title="Thử mẫu: 75 10 86 72 bao 5 cuối 2k"
          >
            Mẫu 1: 75 10 86 72 (Bao 5 cuối 2k)
          </button>
          <button
            type="button"
            onClick={handleFillExampleSpecial}
            className="text-[11px] px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition-colors whitespace-nowrap"
            title="Thử mẫu: 778 694 ĐB 10k"
          >
            Mẫu 2: 778 694 (ĐB 10k)
          </button>
        </div>
      </div>

      <form onSubmit={handleFinalSubmit} className="mt-4 space-y-4">
        {/* Row 1: Customer Name, Region, Station */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Customer Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Tên Khách Hàng <span className="text-slate-500 font-normal">(Mặc định: Khách vãng lai)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="VD: Anh Ba, Chị Lan..."
                list="customer-list"
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
              />
              {customerName && (
                <button
                  type="button"
                  onClick={() => setCustomerName('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5"
                  title="Xóa tên khách"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <datalist id="customer-list">
                {existingCustomerNames.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Region Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Đài / Miền Đánh <span className="text-amber-400">*</span>
            </label>
            <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              {REGIONS.map((reg) => (
                <button
                  type="button"
                  key={reg.id}
                  onClick={() => setRegion(reg.id)}
                  className={`py-1.5 px-2 text-xs font-semibold rounded-md transition-colors ${
                    region === reg.id
                      ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {reg.shortName} ({reg.totalPrizes}L)
                </button>
              ))}
            </div>
          </div>

          {/* Station Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Ghi Chú Đài (Tùy chọn)
            </label>
            <input
              type="text"
              value={stationName}
              onChange={(e) => setStationName(e.target.value)}
              placeholder="VD: Đài chính, TP.HCM, Vũng Tàu..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Row 2: Enter Numbers & Money with 3-digit thousand dots formatting */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 pt-1">
          {/* Numbers input */}
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300">
                1. Nhập Dãy Số Đánh (cách nhau bởi khoảng trắng, dấu phẩy hoặc dán tin nhắn)
              </label>
              <div className="flex items-center gap-2">
                {numbersInput && (
                  <button
                    type="button"
                    onClick={handleClearNumbersInput}
                    className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-0.5 hover:underline"
                    title="Xóa dãy số vừa nhập"
                  >
                    <X className="w-3 h-3" />
                    <span>Xóa số</span>
                  </button>
                )}
                {extractedNumbers.length > 0 && (
                  <span className="text-[11px] font-mono text-amber-400">
                    Đã nhận: <strong className="text-white">{extractedNumbers.length}</strong> con ({extractedNumbers.slice(0, 5).join(', ')}{extractedNumbers.length > 5 ? '...' : ''})
                  </span>
                )}
              </div>
            </div>
            <textarea
              rows={2}
              value={numbersInput}
              onChange={(e) => setNumbersInput(e.target.value)}
              placeholder="Ví dụ nhập: 75 10 86 72 hoặc 778 694..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg p-2.5 text-sm sm:text-base text-white font-mono placeholder-slate-600 focus:outline-none transition-colors"
            />
          </div>

          {/* Money Input with automatic 3-digit separator */}
          <div className="lg:col-span-4">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300">
                2. Tiền Cược / 1 Giải (Có dấu cách 3 số)
              </label>
              <span className="text-[11px] text-slate-400">Gõ tắt 2k, 10k...</span>
            </div>
            <div className="relative">
              <input
                type="text"
                value={moneyDisplay}
                onChange={handleMoneyChange}
                placeholder="2.000 hoặc 2k"
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg pl-3 pr-10 py-2 sm:py-2.5 text-base font-bold font-mono text-amber-300 placeholder-slate-600 focus:outline-none transition-colors tabular-nums"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                ₫/giải
              </span>
            </div>

            {/* Quick buttons */}
            <div className="flex items-center gap-1 mt-1.5 overflow-x-auto py-0.5">
              {[1000, 2000, 5000, 10000, 20000, 50000, 100000].map((amt) => (
                <button
                  type="button"
                  key={amt}
                  onClick={() => setQuickMoney(amt)}
                  className={`px-2 py-1 text-[11px] font-mono rounded border transition-colors whitespace-nowrap min-w-[36px] text-center ${
                    numericMoney === amt
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-sm'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {amt >= 1000 ? `${amt / 1000}k` : amt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Row 3: Searchable Multi-Select Dropdown for Bet Types (Cách Chơi) */}
        <div className="pt-1">
          <SearchableMultiSelect<BetType>
            label="3. Chọn Hình Thức Cách Chơi (Tự động tính số giải & thành tiền)"
            placeholder="-- Bấm vào đây để tìm và chọn một hoặc nhiều cách chơi --"
            searchPlaceholder="Tìm kiếm cách chơi: bao lo, 2 chan, 5 cuoi, de, dac biet, xiu chu..."
            noResultsText="No results found (Không tìm thấy hình thức phù hợp)"
            options={betTypeOptions}
            selectedValues={selectedBetTypes}
            onChange={(newSelected) => setSelectedBetTypes(newSelected)}
          />

          {/* Quick preset chips below the dropdown for rapid 1-tap toggling */}
          <div className="mt-2 flex items-center gap-1.5 overflow-x-auto py-1">
            <span className="text-[11px] text-slate-400 whitespace-nowrap shrink-0">
              Phổ biến:
            </span>
            {[
              { type: 'bao_5_cuoi' as BetType, label: 'Bao 5 cuối (5 giải)' },
              { type: '2_chan_lo' as BetType, label: '2 Chân Lô' },
              { type: 'chot_db' as BetType, label: 'Chót ĐB / Đề' },
              { type: 'dau_duoi' as BetType, label: 'Đầu Đuôi' },
              { type: 'xiu_chu_duoi' as BetType, label: 'Xỉu Chủ ĐB' },
              { type: 'cheo_2_5' as BetType, label: 'Đá Chéo' },
            ].map((preset) => {
              const isActive = selectedBetTypes.includes(preset.type);
              return (
                <button
                  type="button"
                  key={preset.type}
                  onClick={() => {
                    if (isActive) {
                      setSelectedBetTypes(selectedBetTypes.filter((t) => t !== preset.type));
                    } else {
                      setSelectedBetTypes([...selectedBetTypes, preset.type]);
                    }
                  }}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition-all whitespace-nowrap flex items-center gap-1 ${
                    isActive
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 font-semibold'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <span>{preset.label}</span>
                  {isActive && <CheckCheck className="w-3 h-3 text-amber-400" />}
                </button>
              );
            })}
          </div>

          {/* If Specific Prize is selected, show dropdown to choose which prize */}
          {selectedBetTypes.includes('giai_cu_the') && (
            <div className="mt-2.5 p-3 bg-slate-950 rounded-lg border border-slate-800 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <span className="text-xs text-amber-400 font-medium whitespace-nowrap">
                Chỉ định đánh riêng cho giải cụ thể:
              </span>
              <select
                value={specificPrizeId}
                onChange={(e) => setSpecificPrizeId(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                {SPECIFIC_PRIZES.map((prize) => (
                  <option key={prize.id} value={prize.id}>
                    {prize.name} ({region === 'MB' ? prize.prizesCountMB : prize.prizesCountMN} giải - {prize.numDigits} số)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Realtime Breakdown Preview Table for current input (Grouped into 1 row per betType) */}
        {groupedPreviewItems.length > 0 && (
          <div className="pt-2">
            <div className="flex items-center justify-between pb-1.5 flex-wrap gap-2">
              <span className="text-xs font-medium text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Xem Trước Đợt Nhập (Đã gom 1 dòng · Bấm mũi tên để sổ chi tiết từng số)</span>
              </span>
              <div className="text-xs font-mono text-slate-300">
                Tổng cộng đợt này: <strong className="text-amber-300 text-sm tabular-nums">{formatCurrency(previewTotalAmount)}</strong> ({previewTotalPrizes} giải)
              </div>
            </div>

            {/* Mobile Zero-Overflow Preview List */}
            <div className="md:hidden rounded-lg border border-slate-800 divide-y divide-slate-800 bg-slate-900/60">
              {groupedPreviewItems.map((group) => {
                const isExpanded = !!expandedPreviewKeys[group.groupKey];
                return (
                  <div key={group.groupKey} className="p-2.5 space-y-2">
                    <div
                      onClick={() => toggleExpandPreview(group.groupKey)}
                      className="flex items-start justify-between gap-2 cursor-pointer"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-bold text-amber-300 text-sm break-words">
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
                        <span className="font-mono font-bold text-amber-300 text-sm tabular-nums">
                          {formatCurrency(group.groupTotal)}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => toggleExpandPreview(group.groupKey)}
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
                          <button
                            type="button"
                            onClick={() => handleRemovePreviewGroup(group)}
                            className="p-1 rounded bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-700"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="rounded bg-slate-950 border border-slate-800 px-2.5 py-1.5 divide-y divide-slate-900 font-mono text-[11px]">
                        {group.items.map((item) => (
                          <div
                            key={item.id}
                            className="py-1 flex items-center justify-between gap-2 text-slate-300"
                          >
                            <span>
                              <strong className="text-amber-200">Số {item.number}</strong>
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400 tabular-nums">
                                {item.prizesCount} giải ={' '}
                                <strong className="text-white">{formatCurrency(item.itemTotal)}</strong>
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  if (item.number.includes(' - ')) {
                                    handleClearNumbersInput();
                                  } else {
                                    handleRemoveNumberFromInput(item.number);
                                  }
                                }}
                                className="text-slate-500 hover:text-rose-400 p-0.5"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop Preview Table */}
            <div className="hidden md:block overflow-x-auto rounded-lg border border-slate-800">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-mono border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-3 w-12 text-center">STT</th>
                    <th className="py-2 px-3">Con Số Đánh</th>
                    <th className="py-2 px-3">Hình Thức</th>
                    <th className="py-2 px-3 text-right">Số Giải</th>
                    <th className="py-2 px-3 text-right">Tiền 1 Giải</th>
                    <th className="py-2 px-3 text-right">Tổng Tiền</th>
                    <th className="py-2 px-2 w-24 text-center">Chi Tiết / Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/60 font-mono">
                  {groupedPreviewItems.map((group, gIdx) => {
                    const isExpanded = !!expandedPreviewKeys[group.groupKey];
                    return (
                      <React.Fragment key={group.groupKey}>
                        {/* Main Grouped Row */}
                        <tr
                          onClick={() => toggleExpandPreview(group.groupKey)}
                          className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                        >
                          <td className="py-2.5 px-3 text-center text-slate-400 font-bold">{gIdx + 1}</td>
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
                            {group.betTypeName}
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
                          <td className="py-2.5 px-3 text-right font-bold text-amber-300 text-sm tabular-nums">
                            {formatCurrency(group.groupTotal)}
                          </td>
                          <td
                            className="py-2.5 px-2 text-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => toggleExpandPreview(group.groupKey)}
                                className={`flex items-center gap-0.5 px-2 py-1 rounded text-[11px] font-sans font-medium border transition-colors ${
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
                                onClick={() => handleRemovePreviewGroup(group)}
                                className="text-slate-400 hover:text-rose-400 p-1 rounded hover:bg-slate-800 transition-colors"
                                title="Xóa dòng này"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expanded Detailed Breakdown Rows */}
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
                              <td className="py-1.5 px-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (item.number.includes(' - ')) {
                                      handleClearNumbersInput();
                                    } else {
                                      handleRemoveNumberFromInput(item.number);
                                    }
                                  }}
                                  className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-slate-800 transition-colors"
                                  title={`Bỏ số ${item.number}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-2 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleClearNumbersInput}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg border border-transparent hover:border-rose-500/30 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa đợt đang nhập</span>
              </button>

              <button
                type="button"
                onClick={handleAddPreviewToTicket}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 rounded-lg border border-amber-500/40 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span>Thêm đợt này vào vé của {customerName || 'khách'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Staged Items List in Current Customer Ticket (Grouped into 1 row per batch/type with Edit & Expand) */}
        {stagedItems.length > 0 && (
          <div className="pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between pb-2 flex-wrap gap-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>
                  Các Dòng Cược Trong Vé Của [{customerName || 'Khách'}] ({groupedStagedItems.length} dòng · {stagedItems.length} con số)
                </span>
              </span>

              {confirmClearStaged ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-rose-300 font-medium">Xác nhận xóa hết {stagedItems.length} mục?</span>
                  <button
                    type="button"
                    onClick={handleClearStaged}
                    className="px-2 py-0.5 text-[11px] font-bold bg-rose-600 hover:bg-rose-500 text-white rounded transition-colors"
                  >
                    Đồng ý xóa
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClearStaged(false)}
                    className="px-2 py-0.5 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
                  >
                    Hủy
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleClearStaged}
                  className="text-[11px] text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 px-2.5 py-1 rounded-md flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Xóa tất cả mục ({stagedItems.length})</span>
                </button>
              )}
            </div>

            {/* Mobile Zero-Overflow Staged List */}
            <div className="md:hidden rounded-lg border border-slate-800 max-h-96 overflow-y-auto divide-y divide-slate-800 bg-slate-900">
              {groupedStagedItems.map((group) => {
                const isExpanded = !!expandedStagedKeys[group.groupKey];
                const isEditingThisGroup = editingGroupKey === group.groupKey;

                return (
                  <div key={group.groupKey} className="p-2.5 space-y-2">
                    <div
                      onClick={() => {
                        if (!isEditingThisGroup) toggleExpandStaged(group.groupKey);
                      }}
                      className="flex items-start justify-between gap-2 cursor-pointer"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-bold text-amber-300 text-sm break-words">
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
                        <span className="font-mono font-bold text-amber-300 text-sm tabular-nums">
                          {formatCurrency(group.groupTotal)}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => toggleExpandStaged(group.groupKey)}
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

                          <button
                            type="button"
                            onClick={() =>
                              isEditingThisGroup
                                ? setEditingGroupKey(null)
                                : handleStartEditStagedGroup(group)
                            }
                            className={`p-1 rounded border transition-colors ${
                              isEditingThisGroup
                                ? 'bg-amber-500 text-slate-950 border-amber-400'
                                : 'bg-slate-800 text-amber-300 border-slate-700'
                            }`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveStagedGroup(group)}
                            className="p-1 rounded bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-700"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {isEditingThisGroup && (
                      <div className="bg-slate-950 border border-amber-500/40 rounded-lg p-2.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-300">
                            Sửa dòng: [{group.numbersLabel}]
                          </span>
                          <button
                            type="button"
                            onClick={() => handleLoadGroupToMainInputs(group)}
                            className="text-[11px] text-amber-400 hover:underline"
                          >
                            Đưa lên ô nhập trên
                          </button>
                        </div>
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editGroupNumbers}
                            onChange={(e) => setEditGroupNumbers(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                            placeholder="Dãy số"
                          />
                          <select
                            value={editGroupBetType}
                            onChange={(e) => setEditGroupBetType(e.target.value as BetType)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                          >
                            {BET_TYPE_DEFINITIONS.map((def) => (
                              <option key={def.type} value={def.type}>
                                {def.label} ({def.getPrizesCount(region, editGroupSpecificPrizeId)} giải)
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={editGroupMoneyDisplay}
                            onChange={handleEditGroupMoneyChange}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-mono font-bold"
                            placeholder="2.000"
                          />
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingGroupKey(null)}
                            className="px-3 py-1 rounded bg-slate-800 text-slate-300 text-xs"
                          >
                            Hủy
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEditStagedGroup(group)}
                            className="px-3 py-1 rounded bg-amber-400 text-slate-950 text-xs font-bold"
                          >
                            Lưu
                          </button>
                        </div>
                      </div>
                    )}

                    {isExpanded && (
                      <div className="rounded bg-slate-950 border border-slate-800 px-2.5 py-1.5 divide-y divide-slate-900 font-mono text-[11px]">
                        {group.items.map((item) => (
                          <div
                            key={item.id}
                            className="py-1 flex items-center justify-between gap-2 text-slate-300"
                          >
                            <span>
                              <strong className="text-amber-200">Số {item.number}</strong>
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400 tabular-nums">
                                {item.prizesCount} giải ={' '}
                                <strong className="text-white">{formatCurrency(item.itemTotal)}</strong>
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveStagedItem(item.id)}
                                className="text-slate-500 hover:text-rose-400 p-0.5"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop Staged Table */}
            <div className="hidden md:block overflow-x-auto rounded-lg border border-slate-800 max-h-80 overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-mono border-b border-slate-800 sticky top-0 z-10">
                  <tr>
                    <th className="py-2 px-3 w-10 text-center">STT</th>
                    <th className="py-2 px-3">Con Số Đánh</th>
                    <th className="py-2 px-3">Hình Thức</th>
                    <th className="py-2 px-3 text-right">Số Giải</th>
                    <th className="py-2 px-3 text-right">Tiền 1 Giải</th>
                    <th className="py-2 px-3 text-right">Tổng Tiền</th>
                    <th className="py-2 px-2 w-32 text-center">Chi Tiết / Sửa / Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900 font-mono">
                  {groupedStagedItems.map((group, gIdx) => {
                    const isExpanded = !!expandedStagedKeys[group.groupKey];
                    const isEditingThisGroup = editingGroupKey === group.groupKey;

                    return (
                      <React.Fragment key={group.groupKey}>
                        {/* Main Grouped Staged Row */}
                        <tr
                          onClick={() => {
                            if (!isEditingThisGroup) toggleExpandStaged(group.groupKey);
                          }}
                          className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                        >
                          <td className="py-2.5 px-3 text-center text-slate-400 font-bold">{gIdx + 1}</td>
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
                            {group.betTypeName}
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
                          <td className="py-2.5 px-3 text-right font-bold text-amber-300 text-sm tabular-nums">
                            {formatCurrency(group.groupTotal)}
                          </td>
                          <td
                            className="py-2.5 px-2 text-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => toggleExpandStaged(group.groupKey)}
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
                                  isEditingThisGroup
                                    ? setEditingGroupKey(null)
                                    : handleStartEditStagedGroup(group)
                                }
                                className={`p-1 rounded border transition-colors ${
                                  isEditingThisGroup
                                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                                    : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
                                }`}
                                title="Chỉnh sửa / Cập nhật dòng cược này"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleRemoveStagedGroup(group)}
                                className="text-slate-400 hover:text-rose-400 p-1 rounded hover:bg-slate-800 transition-colors"
                                title="Xóa dòng này"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Inline Editor Row for Updating a Staged Group */}
                        {isEditingThisGroup && (
                          <tr className="bg-slate-950 border-y border-amber-500/40 font-sans">
                            <td colSpan={7} className="p-3">
                              <div className="space-y-2.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                                    <Pencil className="w-3.5 h-3.5" />
                                    <span>Chỉnh sửa nhanh dòng cược: [{group.numbersLabel}]</span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleLoadGroupToMainInputs(group)}
                                    className="text-[11px] text-amber-400 hover:underline"
                                  >
                                    Đưa lên ô nhập chính ở trên
                                  </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                                  <div className="sm:col-span-5">
                                    <label className="block text-[11px] text-slate-400 mb-1">
                                      Dãy số đánh:
                                    </label>
                                    <input
                                      type="text"
                                      value={editGroupNumbers}
                                      onChange={(e) => setEditGroupNumbers(e.target.value)}
                                      className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
                                      placeholder="VD: 77, 66, 55"
                                    />
                                  </div>

                                  <div className="sm:col-span-4">
                                    <label className="block text-[11px] text-slate-400 mb-1">
                                      Hình thức cách chơi:
                                    </label>
                                    <select
                                      value={editGroupBetType}
                                      onChange={(e) => setEditGroupBetType(e.target.value as BetType)}
                                      className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                                    >
                                      {BET_TYPE_DEFINITIONS.map((def) => (
                                        <option key={def.type} value={def.type}>
                                          {def.label} ({def.getPrizesCount(region, editGroupSpecificPrizeId)} giải)
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
                                      value={editGroupMoneyDisplay}
                                      onChange={handleEditGroupMoneyChange}
                                      className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-mono font-bold focus:outline-none"
                                      placeholder="2.000"
                                    />
                                  </div>
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => setEditingGroupKey(null)}
                                    className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                                  >
                                    Hủy
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveEditStagedGroup(group)}
                                    className="flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Cập nhật dòng này</span>
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
                              <td className="py-1.5 px-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveStagedItem(item.id)}
                                  className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-slate-800 transition-colors"
                                  title={`Xóa số ${item.number}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Total Staged Footer */}
            <div className="mt-2 p-3 bg-slate-950 rounded-lg border border-amber-500/30 flex items-center justify-between">
              <div className="text-xs text-slate-300">
                Tổng cộng: <strong className="text-white">{groupedStagedItems.length} dòng ({stagedItems.length} số)</strong> · {stagedTotalPrizes} giải
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 uppercase font-mono">TỔNG TIỀN KHÁCH:</span>
                <span className="text-lg font-bold font-mono text-amber-300 tabular-nums">
                  {formatCurrency(stagedTotalAmount)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Inline Validation Error Banner */}
        {formError && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 flex items-center justify-between gap-3 animate-in fade-in duration-150">
            <div className="flex items-center gap-2.5 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="font-medium">{formError}</span>
            </div>
            <button
              type="button"
              onClick={() => setFormError(null)}
              className="text-rose-300 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Prominent Inline Success Notification Banner when Ticket is Saved or Updated */}
        {lastSavedTicket && (
          <div
            role="status"
            className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/50 text-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-emerald-950/30 animate-in fade-in duration-200"
          >
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-emerald-300 flex items-center gap-1.5">
                  <span>
                    {lastSavedWasUpdate
                      ? 'ĐÃ CẬP NHẬT VÉ VÀO SỔ THÀNH CÔNG!'
                      : 'ĐÃ THÊM VÀO SỔ THÀNH CÔNG!'}
                  </span>
                </div>
                <p className="text-xs text-slate-200 mt-0.5">
                  Khách: <strong className="text-white">{lastSavedTicket.customerName}</strong> · Đài:{' '}
                  <strong className="text-white">{lastSavedTicket.region}</strong> ·{' '}
                  <strong className="text-amber-300">{lastSavedTicket.items.length} mục cược</strong> ({lastSavedTicket.totalPrizesAccumulated} giải) · Tổng tiền:{' '}
                  <strong className="text-amber-300 font-mono text-sm">{formatCurrency(lastSavedTicket.totalAmount)}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              {onOpenReceipt && (
                <button
                  type="button"
                  onClick={() => onOpenReceipt(lastSavedTicket)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/40 text-xs font-semibold transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Xem biên lai</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setLastSavedTicket(null)}
                className="p-1.5 text-emerald-300 hover:text-white rounded-lg hover:bg-emerald-500/20 transition-colors"
                title="Đóng thông báo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Action Button Bar */}
        <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Ngày cược: <strong>{selectedDate}</strong> · Miền: <strong>{region}</strong></span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {editingTicket && onCancelEditTicket && (
              <button
                type="button"
                onClick={() => {
                  setStagedItems([]);
                  setNumbersInput('');
                  setSelectedBetTypes([]);
                  setCustomerName('');
                  setStationName('');
                  setEditingGroupKey(null);
                  onCancelEditTicket();
                }}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg border border-slate-700 transition-all text-sm cursor-pointer"
              >
                Hủy Sửa
              </button>
            )}

            <button
              type="submit"
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg shadow-md shadow-amber-500/20 transition-all text-sm cursor-pointer active:scale-[0.99]"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{editingTicket ? 'Cập Nhật & Lưu Thay Đổi' : 'Hoàn Thành & Lưu Vào Sổ'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
