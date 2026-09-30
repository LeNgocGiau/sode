import React, { useState, useRef, useEffect, useMemo, useId } from 'react';
import { Search, X, Check, ChevronDown, CheckSquare, Square, Trash2 } from 'lucide-react';

export interface MultiSelectOption<T = string> {
  value: T;
  label: string;
  badge?: string;
  category?: string;
  description?: string;
  disabled?: boolean;
}

export interface SearchableMultiSelectProps<T = string> {
  options: MultiSelectOption<T>[];
  selectedValues: T[];
  onChange: (newSelected: T[]) => void;
  label?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  noResultsText?: string;
  className?: string;
  disabled?: boolean;
  maxTagsShown?: number;
  renderOptionExtra?: (option: MultiSelectOption<T>) => React.ReactNode;
}

/**
 * Remove Vietnamese accents and convert to lowercase for flexible search
 */
function normalizeSearchText(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .trim();
}

export function SearchableMultiSelect<T extends string | number>({
  options,
  selectedValues,
  onChange,
  label,
  placeholder = 'Chọn một hoặc nhiều hình thức...',
  searchPlaceholder = 'Nhập từ khóa tìm kiếm (vd: bao lo, 2 chan, dac biet)...',
  noResultsText = 'No results found (Không tìm thấy kết quả phù hợp)',
  className = '',
  disabled = false,
  maxTagsShown = 6,
  renderOptionExtra,
}: SearchableMultiSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const componentId = useId();

  // Filtered options based on real-time search (case-insensitive + tone-insensitive)
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;

    const normalizedQuery = normalizeSearchText(searchQuery);

    return options.filter((option) => {
      const normalizedLabel = normalizeSearchText(option.label);
      const normalizedBadge = normalizeSearchText(option.badge || '');
      const normalizedDesc = normalizeSearchText(option.description || '');
      const normalizedVal = normalizeSearchText(String(option.value));

      return (
        normalizedLabel.includes(normalizedQuery) ||
        normalizedBadge.includes(normalizedQuery) ||
        normalizedDesc.includes(normalizedQuery) ||
        normalizedVal.includes(normalizedQuery)
      );
    });
  }, [options, searchQuery]);

  // Keep highlighted index in bounds when list changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredOptions.length]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Auto focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Scroll highlighted item into view if navigating with keyboard
  useEffect(() => {
    if (isOpen && listRef.current && filteredOptions.length > 0) {
      const itemElement = listRef.current.children[highlightedIndex] as HTMLElement;
      if (itemElement) {
        itemElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen, filteredOptions.length]);

  // Toggle single option
  const toggleOption = (val: T) => {
    if (disabled) return;
    const isAlreadySelected = selectedValues.includes(val);
    if (isAlreadySelected) {
      onChange(selectedValues.filter((v) => v !== val));
    } else {
      onChange([...selectedValues, val]);
    }
  };

  // Remove single selected tag
  const handleRemoveTag = (e: React.MouseEvent, val: T) => {
    e.stopPropagation();
    if (disabled) return;
    onChange(selectedValues.filter((v) => v !== val));
  };

  // Select all currently filtered options
  const handleSelectAll = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (disabled) return;
    const allFilteredVals = filteredOptions.map((o) => o.value);
    const newSelected = Array.from(new Set([...selectedValues, ...allFilteredVals]));
    onChange(newSelected);
  };

  // Clear all selected options
  const handleClearAll = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (disabled) return;
    onChange([]);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : Math.max(0, filteredOptions.length - 1)));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredOptions.length > 0 && filteredOptions[highlightedIndex]) {
          toggleOption(filteredOptions[highlightedIndex].value);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchQuery('');
        break;
      default:
        break;
    }
  };

  // Selected option details
  const selectedOptionsMap = useMemo(() => {
    const map = new Map<T, MultiSelectOption<T>>();
    options.forEach((opt) => map.set(opt.value, opt));
    return map;
  }, [options]);

  const areAllFilteredSelected = useMemo(() => {
    if (filteredOptions.length === 0) return false;
    return filteredOptions.every((opt) => selectedValues.includes(opt.value));
  }, [filteredOptions, selectedValues]);

  return (
    <div className={`relative ${className}`} ref={containerRef} onKeyDown={handleKeyDown}>
      {/* Optional Top Label */}
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-semibold text-slate-200">
            {label}
          </label>
          {selectedValues.length > 0 && (
            <span className="text-[11px] font-mono text-amber-400">
              Đã chọn: <strong className="text-white">{selectedValues.length}</strong> hình thức
            </span>
          )}
        </div>
      )}

      {/* Selected Tags Display (inside/top area) */}
      {selectedValues.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mb-2 p-2 bg-slate-950/70 border border-slate-800 rounded-lg">
          <div className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <span>Đang chọn ({selectedValues.length}):</span>
          </div>

          {selectedValues.slice(0, maxTagsShown).map((val) => {
            const opt = selectedOptionsMap.get(val);
            const labelText = opt ? opt.label : String(val);
            const badgeText = opt?.badge;

            return (
              <span
                key={String(val)}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-amber-500/15 border border-amber-500/40 text-amber-200 shadow-sm transition-all animate-in fade-in duration-150"
              >
                <span className="font-semibold">{labelText}</span>
                {badgeText && (
                  <span className="text-[10px] font-mono px-1 py-0.2 bg-amber-400/20 rounded text-amber-300">
                    {badgeText}
                  </span>
                )}
                <button
                  type="button"
                  onClick={(e) => handleRemoveTag(e, val)}
                  disabled={disabled}
                  className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-amber-400/30 text-amber-300 hover:text-white transition-colors"
                  aria-label={`Bỏ chọn ${labelText}`}
                  title="Bỏ chọn"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}

          {selectedValues.length > maxTagsShown && (
            <span className="text-[11px] font-mono text-slate-400 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">
              +{selectedValues.length - maxTagsShown} mục khác
            </span>
          )}

          {/* Quick Clear All Button */}
          <button
            type="button"
            onClick={handleClearAll}
            className="ml-auto text-[11px] font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2 py-0.5 rounded flex items-center gap-1 transition-colors"
            title="Xóa toàn bộ các lựa chọn"
          >
            <Trash2 className="w-3 h-3" />
            <span>Xóa tất cả</span>
          </button>
        </div>
      )}

      {/* Main Trigger Box */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => {
          if (!disabled) setIsOpen(!isOpen);
        }}
        className={`w-full flex items-center justify-between min-h-[42px] px-3 py-2 rounded-lg border text-sm transition-all cursor-pointer select-none ${
          disabled
            ? 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed opacity-60'
            : isOpen
            ? 'bg-slate-900 border-amber-500 ring-2 ring-amber-500/20 text-white'
            : 'bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-700'
        }`}
      >
        <div className="flex-1 truncate mr-2">
          {selectedValues.length === 0 ? (
            <span className="text-slate-500 text-xs sm:text-sm">{placeholder}</span>
          ) : (
            <span className="text-xs sm:text-sm text-slate-200 font-medium">
              Đã chọn <strong className="text-amber-400 font-bold">{selectedValues.length}</strong> hình thức cược
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 text-slate-400">
          {selectedValues.length > 0 && (
            <span
              onClick={handleClearAll}
              role="button"
              className="p-1 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors text-xs"
              title="Xóa tất cả lựa chọn"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-amber-400' : ''}`}
          />
        </div>
      </div>

      {/* Floating Dropdown Panel */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl shadow-black/80 overflow-hidden flex flex-col max-h-[360px] animate-in fade-in-50 zoom-in-95 duration-150">
          {/* 1. Search Bar & Action Buttons */}
          <div className="p-2.5 border-b border-slate-800 bg-slate-950/90 space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full bg-slate-900 border border-slate-700/80 focus:border-amber-400 rounded-lg pl-9 pr-8 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-white"
                  title="Xóa từ khóa"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Action Toolbar: Select All, Clear All, Counter */}
            <div className="flex items-center justify-between text-xs pt-1 px-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 hover:text-amber-300 hover:underline transition-colors"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Chọn tất cả ({filteredOptions.length})</span>
                </button>

                <span className="text-slate-700" aria-hidden="true">|</span>

                <button
                  type="button"
                  onClick={handleClearAll}
                  disabled={selectedValues.length === 0}
                  className={`flex items-center gap-1 text-[11px] font-semibold transition-colors ${
                    selectedValues.length > 0
                      ? 'text-rose-400 hover:text-rose-300 hover:underline'
                      : 'text-slate-600 cursor-not-allowed'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All (Xóa hết)</span>
                </button>
              </div>

              <div className="text-[11px] font-mono text-slate-400">
                <span className="text-amber-400 font-bold">{selectedValues.length}</span>/{options.length}
              </div>
            </div>
          </div>

          {/* 2. Scrollable Options List with Checkboxes */}
          <div
            ref={listRef}
            role="listbox"
            aria-multiselectable="true"
            className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-1.5 focus:outline-none"
          >
            {filteredOptions.length === 0 ? (
              <div className="py-8 px-4 text-center text-slate-400">
                <div className="text-xs font-semibold text-slate-300 mb-1">{noResultsText}</div>
                <p className="text-[11px] text-slate-500">
                  Thử tìm với từ khóa khác (ví dụ: "bao", "lo", "chan", "dac biet", "xiu chu"...)
                </p>
              </div>
            ) : (
              filteredOptions.map((opt, index) => {
                const isChecked = selectedValues.includes(opt.value);
                const isHighlighted = index === highlightedIndex;

                return (
                  <div
                    key={String(opt.value)}
                    role="option"
                    aria-selected={isChecked}
                    onClick={() => toggleOption(opt.value)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`flex items-start gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors text-xs select-none ${
                      isChecked
                        ? 'bg-amber-500/10 text-white'
                        : isHighlighted
                        ? 'bg-slate-800/70 text-slate-100'
                        : 'text-slate-300 hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Checkbox with accessible visual representation */}
                    <div className="pt-0.5 shrink-0">
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                          isChecked
                            ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-sm'
                            : 'bg-slate-950 border-slate-700 text-transparent'
                        }`}
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    </div>

                    {/* Option Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`font-semibold truncate ${isChecked ? 'text-amber-300' : 'text-slate-200'}`}>
                          {opt.label}
                        </span>
                        {opt.badge && (
                          <span
                            className={`shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                              isChecked
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-slate-950 text-slate-400 border-slate-800'
                            }`}
                          >
                            {opt.badge}
                          </span>
                        )}
                      </div>

                      {opt.description && (
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 font-normal">
                          {opt.description}
                        </p>
                      )}

                      {renderOptionExtra && renderOptionExtra(opt)}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* 3. Dropdown Footer with keyboard hint and Close button */}
          <div className="p-2 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="hidden sm:inline font-mono text-[10px]">
              ↑/↓: di chuyển · Enter: chọn · Esc: đóng
            </span>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setSearchQuery('');
              }}
              className="w-full sm:w-auto ml-auto px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-md transition-colors text-xs"
            >
              Đóng & Áp Dụng ({selectedValues.length})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
