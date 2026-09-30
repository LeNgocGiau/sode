import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CustomerBetTicket, BetRateConfig, RegionType } from './types/lottery';
import { DEFAULT_RATE_CONFIGS, INITIAL_SAMPLE_TICKETS } from './data/defaultConfig';
import { getTodayDateString, getYesterdayDateString, formatCurrency, formatDateDisplay } from './utils/formatters';

import { Header } from './components/Header';
import { DailySummaryCards } from './components/DailySummaryCards';
import { BetEntryForm } from './components/BetEntryForm';
import { CustomerBetList } from './components/CustomerBetList';
import { NumberStatistics } from './components/NumberStatistics';
import { HistoryDateManager } from './components/HistoryDateManager';
import { RateConfigModal } from './components/RateConfigModal';
import { ReceiptModal } from './components/ReceiptModal';
import { NotificationToast, ToastMessage } from './components/NotificationToast';
import { LoginScreen } from './components/LoginScreen';

const STORAGE_KEY_TICKETS = 'sode_pro_tickets_v1';
const STORAGE_KEY_RATES = 'sode_pro_rates_v1';
const STORAGE_KEY_AUTH_SESSION = 'sode_pro_auth_session_v1';

export default function App() {
  // 0. Authentication state (SĐT: 0964184548, MK: 0964184548, remember device)
  const [authUserPhone, setAuthUserPhone] = useState<string | null>(() => {
    try {
      const savedSession = localStorage.getItem(STORAGE_KEY_AUTH_SESSION);
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (parsed && parsed.isAuthenticated && parsed.phone === '0964184548') {
          return parsed.phone;
        }
      }
    } catch (e) {
      console.error('Failed to read auth session', e);
    }
    return null;
  });

  // 1. Date state (always starts at today's date so new day starts at 0đ)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return getTodayDateString();
  });
  const currentTodayRef = useRef<string>(getTodayDateString());

  // 2. Active Tab & Region Filter (controlled by clicking top summary cards)
  const [activeTab, setActiveTab] = useState<'bets' | 'stats' | 'history' | 'rates'>('bets');
  const [selectedRegionFilter, setSelectedRegionFilter] = useState<'ALL' | RegionType>('ALL');

  // 3. Tickets state (migrate sample demo tickets to yesterday so today starts at 0đ)
  const [tickets, setTickets] = useState<CustomerBetTicket[]>(() => {
    const todayStr = getTodayDateString();
    const yesterdayStr = getYesterdayDateString();
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TICKETS);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((t: CustomerBetTicket) => {
            if ((t.id === 'ticket-demo-1' || t.id === 'ticket-demo-2') && t.date === todayStr) {
              return { ...t, date: yesterdayStr };
            }
            return t;
          });
        }
      }
    } catch (e) {
      console.error('Failed to load tickets from localStorage', e);
    }
    return INITIAL_SAMPLE_TICKETS;
  });

  // 4. Rate Configurations state
  const [rateConfigs, setRateConfigs] = useState<BetRateConfig[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RATES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load rates from localStorage', e);
    }
    return DEFAULT_RATE_CONFIGS;
  });

  // 5. Toast Notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // 6. Modals & Editing state
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [receiptTicket, setReceiptTicket] = useState<CustomerBetTicket | null>(null);
  const [editingTicket, setEditingTicket] = useState<CustomerBetTicket | null>(null);

  // Ref to form for quick jump
  const formRef = useRef<HTMLDivElement>(null);

  // Sync tickets with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TICKETS, JSON.stringify(tickets));
    } catch (e) {
      console.error('Failed to save tickets to localStorage', e);
    }
  }, [tickets]);

  // Sync rateConfigs with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_RATES, JSON.stringify(rateConfigs));
    } catch (e) {
      console.error('Failed to save rates to localStorage', e);
    }
  }, [rateConfigs]);

  // Toast trigger helper
  const showToast = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    const newToast: ToastMessage = {
      id: `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type,
      title,
      message,
    };
    setToasts((prev) => [...prev, newToast]);
  };

  // Automatic midnight (00:00 / qua 12 giờ hôm sau) date rollover to reset all 4 summary cards to 0đ for the new day
  useEffect(() => {
    const checkMidnightRollover = () => {
      const latestToday = getTodayDateString();
      if (latestToday !== currentTodayRef.current) {
        currentTodayRef.current = latestToday;
        setSelectedDate(latestToday);
        showToast(
          'info',
          'Đã sang ngày mới (Qua 12h đêm)',
          `Sổ cược ngày mới (${formatDateDisplay(latestToday)}) đã tự động reset về 0 ₫. Bạn có thể vào mục Lịch Sử Ngày để xem lại các ngày trước.`
        );
      }
    };

    const intervalId = setInterval(checkMidnightRollover, 10000);
    window.addEventListener('focus', checkMidnightRollover);
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', checkMidnightRollover);
    };
  }, []);

  // Login & Logout handlers
  const handleLoginSuccess = (phone: string, rememberDevice: boolean) => {
    setAuthUserPhone(phone);
    try {
      if (rememberDevice) {
        localStorage.setItem(
          STORAGE_KEY_AUTH_SESSION,
          JSON.stringify({
            isAuthenticated: true,
            phone,
            rememberDevice: true,
            loginAt: Date.now(),
          })
        );
      } else {
        localStorage.removeItem(STORAGE_KEY_AUTH_SESSION);
      }
    } catch (e) {
      console.error('Failed to save auth session', e);
    }
    showToast(
      'success',
      'Đăng nhập thành công!',
      `Chào mừng chủ sổ (${phone}). ${
        rememberDevice ? 'Đã ghi nhớ đăng nhập trên thiết bị này.' : ''
      }`
    );
  };

  const handleLogout = () => {
    setAuthUserPhone(null);
    try {
      localStorage.removeItem(STORAGE_KEY_AUTH_SESSION);
    } catch (e) {
      console.error('Failed to clear auth session', e);
    }
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Save new ticket
  const handleSaveTicket = (newTicket: CustomerBetTicket) => {
    setTickets((prev) => [newTicket, ...prev]);

    showToast(
      'success',
      'Đã thêm vào sổ thành công!',
      `Khách: ${newTicket.customerName} (${newTicket.region})\nĐã lưu ${newTicket.items.length} mục cược (${newTicket.totalPrizesAccumulated} giải) · Tổng tiền: ${formatCurrency(newTicket.totalAmount)}`
    );
  };

  // Start editing a saved ticket in the main form
  const handleEditTicket = (ticket: CustomerBetTicket) => {
    setEditingTicket(ticket);
    setActiveTab('bets');
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 60);
    showToast(
      'info',
      'Đang chỉnh sửa vé cược',
      `Đã tải vé của khách [${ticket.customerName}] lên form để bạn chỉnh sửa và cập nhật.`
    );
  };

  // Save updated ticket (from main form or inline row edit)
  const handleUpdateTicket = (updatedTicket: CustomerBetTicket) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === updatedTicket.id ? updatedTicket : t))
    );
    if (editingTicket?.id === updatedTicket.id) {
      setEditingTicket(null);
    }
    showToast(
      'success',
      'Đã cập nhật vé thành công!',
      `Khách: ${updatedTicket.customerName} (${updatedTicket.region})\nĐã cập nhật ${updatedTicket.items.length} mục cược (${updatedTicket.totalPrizesAccumulated} giải) · Tổng tiền mới: ${formatCurrency(updatedTicket.totalAmount)}`
    );
  };

  // Delete single ticket
  const handleDeleteTicket = (ticketId: string) => {
    const target = tickets.find((t) => t.id === ticketId);
    setTickets((prev) => prev.filter((t) => t.id !== ticketId));
    if (editingTicket?.id === ticketId) {
      setEditingTicket(null);
    }
    showToast(
      'info',
      'Đã xóa vé cược',
      target
        ? `Đã xóa vé cược của khách ${target.customerName} (${formatCurrency(target.totalAmount)}) khỏi sổ.`
        : 'Vé cược đã được gỡ khỏi sổ sách.'
    );
  };

  // Delete a grouped row (multiple items) inside a ticket
  const handleDeleteTicketGroup = (ticketId: string, itemIds: string[]) => {
    const targetTicket = tickets.find((t) => t.id === ticketId);
    if (!targetTicket) return;

    const idSet = new Set(itemIds);
    const remainingItems = targetTicket.items.filter((i) => !idSet.has(i.id));

    if (remainingItems.length === 0) {
      setTickets((prev) => prev.filter((t) => t.id !== ticketId));
      if (editingTicket?.id === ticketId) {
        setEditingTicket(null);
      }
      showToast(
        'info',
        'Đã xóa vé cược',
        `Đã xóa dòng cuối cùng và gỡ vé của khách ${targetTicket.customerName} khỏi sổ.`
      );
      return;
    }

    const newTotalAmount = remainingItems.reduce((sum, i) => sum + i.itemTotal, 0);
    const newTotalPrizes = remainingItems.reduce((sum, i) => sum + i.prizesCount, 0);

    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              items: remainingItems,
              totalAmount: newTotalAmount,
              totalPrizesAccumulated: newTotalPrizes,
            }
          : t
      )
    );

    showToast(
      'info',
      'Đã xóa dòng cược',
      `Đã xóa dòng (${itemIds.length} số) khỏi vé của ${targetTicket.customerName}. Tổng mới: ${formatCurrency(newTotalAmount)}`
    );
  };

  // Delete single bet item inside a ticket
  const handleDeleteTicketItem = (ticketId: string, itemId: string) => {
    const targetTicket = tickets.find((t) => t.id === ticketId);
    if (!targetTicket) return;

    const removedItem = targetTicket.items.find((i) => i.id === itemId);
    const remainingItems = targetTicket.items.filter((i) => i.id !== itemId);

    if (remainingItems.length === 0) {
      setTickets((prev) => prev.filter((t) => t.id !== ticketId));
      showToast(
        'info',
        'Đã xóa vé cược',
        `Đã xóa mục cuối cùng và gỡ vé của khách ${targetTicket.customerName} khỏi sổ.`
      );
      return;
    }

    const newTotalAmount = remainingItems.reduce((sum, i) => sum + i.itemTotal, 0);
    const newTotalPrizes = remainingItems.reduce((sum, i) => sum + i.prizesCount, 0);

    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              items: remainingItems,
              totalAmount: newTotalAmount,
              totalPrizesAccumulated: newTotalPrizes,
            }
          : t
      )
    );

    showToast(
      'info',
      'Đã xóa mục cược',
      `Đã xóa số [${removedItem?.number || ''}] khỏi vé của ${targetTicket.customerName}. Tổng mới: ${formatCurrency(newTotalAmount)}`
    );
  };

  // Delete multiple selected tickets
  const handleDeleteMultipleTickets = (ticketIds: string[]) => {
    if (ticketIds.length === 0) return;
    const idSet = new Set(ticketIds);
    setTickets((prev) => prev.filter((t) => !idSet.has(t.id)));
    showToast(
      'info',
      'Đã xóa các vé đã chọn',
      `Đã xóa thành công ${ticketIds.length} vé cược khỏi sổ sách.`
    );
  };

  // Delete all tickets for a specific date
  const handleDeleteTicketsForDate = (date: string) => {
    const count = tickets.filter((t) => t.date === date).length;
    setTickets((prev) => prev.filter((t) => t.date !== date));
    showToast(
      'info',
      'Đã xóa sổ cược ngày',
      `Đã xóa toàn bộ ${count} vé cược của ngày ${formatDateDisplay(date)}.`
    );
  };

  // Clear all tickets across all dates
  const handleClearAllTickets = () => {
    const totalCount = tickets.length;
    setTickets([]);
    showToast(
      'info',
      'Đã xóa toàn bộ sổ cược',
      `Đã xóa tất cả ${totalCount} vé cược trong lịch sử.`
    );
  };

  // Reset sample tickets
  const handleResetSampleTickets = () => {
    const todayStr = getTodayDateString();
    const samplesWithSelectedDate = INITIAL_SAMPLE_TICKETS.map((t) => ({
      ...t,
      date: selectedDate || todayStr,
    }));
    setTickets(samplesWithSelectedDate);
    showToast('success', 'Đã khôi phục vé mẫu', 'Đã nạp lại các vé cược mẫu để bạn tham khảo.');
  };

  // Save updated rate configurations
  const handleSaveRateConfigs = (newConfigs: BetRateConfig[]) => {
    setRateConfigs(newConfigs);
    showToast('success', 'Đã lưu bảng giá', 'Bảng giá cược và tỷ lệ số giải đã được cập nhật thành công.');
  };

  // Restore data from JSON backup
  const handleRestoreData = (restoredTickets: CustomerBetTicket[]) => {
    setTickets(restoredTickets);
  };

  // List of existing customer names for autocomplete
  const existingCustomerNames = useMemo(() => {
    const set = new Set<string>();
    tickets.forEach((t) => {
      if (t.customerName) set.add(t.customerName.trim());
    });
    return Array.from(set);
  }, [tickets]);

  // Quick jump to add form
  const handleQuickAdd = () => {
    setActiveTab('bets');
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const todayDateStr = getTodayDateString();
  const isViewingHistoryDate = selectedDate !== todayDateStr;

  const handleReturnToToday = () => {
    setSelectedDate(todayDateStr);
    showToast(
      'info',
      'Đã quay về ngày hôm nay',
      `Đang hiển thị sổ cược hôm nay (${formatDateDisplay(todayDateStr)}).`
    );
  };

  if (!authUserPhone) {
    return (
      <>
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
        <NotificationToast toasts={toasts} onDismiss={handleDismissToast} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'rates') {
            setIsRateModalOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        onQuickAdd={handleQuickAdd}
        onOpenRates={() => setIsRateModalOpen(true)}
        userPhone={authUserPhone}
        onLogout={handleLogout}
        isViewingHistoryDate={isViewingHistoryDate}
        onReturnToToday={handleReturnToToday}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5">
        {/* Daily KPI summary cards */}
        <DailySummaryCards
          tickets={tickets}
          selectedDate={selectedDate}
          selectedRegionFilter={selectedRegionFilter}
          onSelectRegionFilter={(region) => setSelectedRegionFilter(region)}
          activeTab={activeTab}
          onOpenFullStats={() => setActiveTab('stats')}
        />

        {/* Tab 1: Bets Entry & Customer List */}
        {activeTab === 'bets' && (
          <div>
            {/* Bet Entry Form */}
            <div ref={formRef}>
              <BetEntryForm
                selectedDate={selectedDate}
                rateConfigs={rateConfigs}
                existingCustomerNames={existingCustomerNames}
                editingTicket={editingTicket}
                onSaveTicket={handleSaveTicket}
                onUpdateTicket={handleUpdateTicket}
                onCancelEditTicket={() => {
                  setEditingTicket(null);
                  showToast('info', 'Đã hủy chỉnh sửa', 'Đã thoát chế độ chỉnh sửa vé cược.');
                }}
                onShowToast={showToast}
                onOpenReceipt={(t) => setReceiptTicket(t)}
              />
            </div>

            {/* Customer Bet Tickets List */}
            <div className="mt-6">
              <div className="flex items-center justify-between pb-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Sổ Ghi Vé Cược Khách Hàng (Chia Theo Từng Giải & Từng Miền)
                </h3>
              </div>

              <CustomerBetList
                tickets={tickets}
                selectedDate={selectedDate}
                regionFilter={selectedRegionFilter}
                onRegionFilterChange={(region) => setSelectedRegionFilter(region)}
                rateConfigs={rateConfigs}
                editingTicketId={editingTicket?.id || null}
                onEditTicket={handleEditTicket}
                onUpdateTicket={handleUpdateTicket}
                onDeleteTicket={handleDeleteTicket}
                onDeleteTicketItem={handleDeleteTicketItem}
                onDeleteTicketGroup={handleDeleteTicketGroup}
                onDeleteMultipleTickets={handleDeleteMultipleTickets}
                onDeleteTicketsForDate={handleDeleteTicketsForDate}
                onResetSampleTickets={handleResetSampleTickets}
                onOpenReceipt={(t) => setReceiptTicket(t)}
                onCopyTextSuccess={(msg) => showToast('success', 'Đã chép nội dung', msg)}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Number Statistics (Gom số theo ngày & theo khách) */}
        {activeTab === 'stats' && (
          <NumberStatistics
            tickets={tickets}
            selectedDate={selectedDate}
            onSelectDate={(newDate) => setSelectedDate(newDate)}
            regionFilter={selectedRegionFilter}
            onRegionFilterChange={(region) => setSelectedRegionFilter(region)}
            onCopySuccess={(msg) => showToast('success', 'Gom số thành công', msg)}
          />
        )}

        {/* Tab 3: History by Date */}
        {activeTab === 'history' && (
          <HistoryDateManager
            tickets={tickets}
            selectedDate={selectedDate}
            onSelectDate={(newDate, switchToBetsTab) => {
              setSelectedDate(newDate);
              if (switchToBetsTab) {
                setActiveTab('bets');
              }
              showToast(
                'info',
                'Đang xem lịch sử ngày',
                `Đã hiển thị số liệu ngày ${formatDateDisplay(newDate)} lên các ô tổng tiền và chi tiết bên dưới.`
              );
            }}
            onRestoreData={handleRestoreData}
            onDeleteTicketsForDate={handleDeleteTicketsForDate}
            onClearAllTickets={handleClearAllTickets}
            onShowToast={showToast}
          />
        )}
      </main>

      {/* Rate Config Modal */}
      <RateConfigModal
        isOpen={isRateModalOpen}
        onClose={() => setIsRateModalOpen(false)}
        rateConfigs={rateConfigs}
        onSaveRateConfigs={handleSaveRateConfigs}
      />

      {/* Receipt Modal */}
      <ReceiptModal
        ticket={receiptTicket}
        onClose={() => setReceiptTicket(null)}
        onCopySuccess={(msg) => showToast('success', 'Biên lai', msg)}
      />

      {/* Toast Notifications */}
      <NotificationToast toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
}
