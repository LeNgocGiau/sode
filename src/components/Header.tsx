import React from 'react';
import { BookOpen, Calendar, BarChart3, Settings2, PlusCircle, Sparkles, LogOut, RotateCcw } from 'lucide-react';
import { formatDateDisplay, getTodayDateString } from '../utils/formatters';

interface HeaderProps {
  activeTab: 'bets' | 'stats' | 'history' | 'rates';
  setActiveTab: (tab: 'bets' | 'stats' | 'history' | 'rates') => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  onQuickAdd: () => void;
  onOpenRates: () => void;
  userPhone?: string;
  onLogout?: () => void;
  isViewingHistoryDate?: boolean;
  onReturnToToday?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  selectedDate,
  setSelectedDate,
  onQuickAdd,
  onOpenRates,
  userPhone,
  onLogout,
  isViewingHistoryDate = false,
  onReturnToToday,
}) => {
  const todayStr = getTodayDateString();

  return (
    <header className="border-b border-slate-800 bg-slate-900/95 sticky top-0 z-40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Zone 1: Brand title */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-amber-500/20 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-tight">SỔ ĐỀ PRO</h1>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                  3 MIỀN B-T-N
                </span>
              </div>
              <p className="text-xs text-slate-400">Ghi chép chính xác · Tự động tính tiền · Gom số</p>
            </div>
          </div>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="lg:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 text-xs font-medium transition-colors"
              title="Đăng xuất tài khoản"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Thoát</span>
            </button>
          )}
        </div>

        {/* Zone 2: Navigation tabs */}
        <nav className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab('bets')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === 'bets'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Ghi Số & Sổ Cược</span>
          </button>

          <button
            onClick={() => setActiveTab('stats')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === 'stats'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Thống Kê Con Số</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === 'history'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Lịch Sử Ngày</span>
          </button>

          <button
            onClick={onOpenRates}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === 'rates'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Bảng Giá Cược</span>
          </button>
        </nav>

        {/* Zone 3: Date status and primary quick actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs ${
              isViewingHistoryDate
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                : 'bg-slate-950 border-slate-800 text-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">
              {isViewingHistoryDate ? 'Đang xem lịch sử:' : 'Hôm nay:'}
            </span>
            <span className="font-mono font-bold">
              {formatDateDisplay(selectedDate)}
            </span>
            {isViewingHistoryDate && onReturnToToday && (
              <button
                type="button"
                onClick={onReturnToToday}
                className="ml-1 px-1.5 py-0.5 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 font-sans font-bold text-[10px] flex items-center gap-0.5 transition-colors"
                title={`Quay về ngày hôm nay (${formatDateDisplay(todayStr)})`}
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Về hôm nay</span>
              </button>
            )}
          </div>

          <button
            onClick={onQuickAdd}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-colors whitespace-nowrap cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Ghi Số Mới</span>
          </button>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-800 hover:border-rose-500/40 text-xs font-medium transition-colors cursor-pointer"
              title={`Đăng xuất (${userPhone || '0964184548'})`}
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span className="font-mono text-[11px]">{userPhone || '0964184548'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
