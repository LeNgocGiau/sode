import React, { useState } from 'react';
import { BetRateConfig, RegionType } from '../types/lottery';
import { REGIONS, DEFAULT_RATE_CONFIGS } from '../data/defaultConfig';
import { Settings2, X, RotateCcw, Check, HelpCircle } from 'lucide-react';

interface RateConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  rateConfigs: BetRateConfig[];
  onSaveRateConfigs: (newConfigs: BetRateConfig[]) => void;
}

export const RateConfigModal: React.FC<RateConfigModalProps> = ({
  isOpen,
  onClose,
  rateConfigs,
  onSaveRateConfigs,
}) => {
  const [selectedRegion, setSelectedRegion] = useState<RegionType>('MN');
  const [currentConfigs, setCurrentConfigs] = useState<BetRateConfig[]>(rateConfigs);
  const [confirmReset, setConfirmReset] = useState(false);

  if (!isOpen) return null;

  const handlePrizesChange = (betType: string, newCount: number) => {
    setCurrentConfigs((prev) =>
      prev.map((c) =>
        c.region === selectedRegion && c.betType === betType
          ? { ...c, defaultPrizesCount: Math.max(1, newCount) }
          : c
      )
    );
  };

  const handlePayoutChange = (betType: string, newRate: number) => {
    setCurrentConfigs((prev) =>
      prev.map((c) =>
        c.region === selectedRegion && c.betType === betType
          ? { ...c, payoutRate: Math.max(1, newRate) }
          : c
      )
    );
  };

  const handleResetToDefault = () => {
    setCurrentConfigs(DEFAULT_RATE_CONFIGS);
    setConfirmReset(false);
  };

  const handleSave = () => {
    onSaveRateConfigs(currentConfigs);
    onClose();
  };

  const regionConfigs = currentConfigs.filter((c) => c.region === selectedRegion);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-3.5 sm:px-6 sm:py-4 border-b border-slate-800 flex items-start sm:items-center justify-between gap-2 bg-slate-950">
          <div className="flex items-start sm:items-center gap-2.5 min-w-0">
            <Settings2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-white leading-tight">
                Cấu Hình Bảng Giá Cược 3 Miền
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 leading-snug">
                Tự động tính tiền cược dựa trên số giải và tỷ lệ ăn thưởng
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Region Switcher */}
        <div className="p-3 sm:px-6 sm:py-3 bg-slate-900 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Chọn miền cấu hình:</span>
              {/* Mobile reset button inline with label */}
              <div className="sm:hidden">
                {confirmReset ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleResetToDefault}
                      className="px-2 py-0.5 text-[11px] font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded transition-colors"
                    >
                      Đồng ý
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmReset(false)}
                      className="px-2 py-0.5 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
                    >
                      Hủy
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmReset(true)}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-amber-400 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Mặc định gốc</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 sm:flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              {REGIONS.map((r) => (
                <button
                  type="button"
                  key={r.id}
                  onClick={() => setSelectedRegion(r.id)}
                  className={`px-2 sm:px-3 py-1.5 sm:py-1 text-[11px] sm:text-xs font-semibold rounded-md transition-colors text-center truncate ${
                    selectedRegion === r.id
                      ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {r.name} ({r.totalPrizes} Lô)
                </button>
              ))}
            </div>
          </div>

          {/* Desktop reset button */}
          <div className="hidden sm:block shrink-0">
            {confirmReset ? (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-amber-300">Khôi phục mặc định?</span>
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="px-2 py-0.5 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded transition-colors"
                >
                  Đồng ý
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="px-2 py-0.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
                >
                  Hủy
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-amber-400 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Mặc định gốc</span>
              </button>
            )}
          </div>
        </div>

        {/* Content list of configs for selected region */}
        <div className="p-3 sm:p-6 overflow-y-auto flex-1 bg-slate-950/40">
          {/* Mobile Card Layout (< sm) */}
          <div className="sm:hidden space-y-2.5">
            {regionConfigs.map((cfg) => (
              <div
                key={`${cfg.region}-${cfg.betType}`}
                className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-white">{cfg.name}</span>
                  <span className="text-[11px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 shrink-0">
                    {cfg.description}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-0.5 font-mono">
                  <div className="bg-slate-950/90 border border-slate-800/90 rounded-lg px-2.5 py-1.5 flex items-center justify-between gap-1.5">
                    <span className="text-[10px] text-slate-400 font-sans">Số giải:</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={cfg.defaultPrizesCount}
                        onChange={(e) =>
                          handlePrizesChange(cfg.betType, parseInt(e.target.value, 10) || 1)
                        }
                        className="w-12 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-right text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-400 tabular-nums"
                      />
                      <span className="text-slate-400 text-[10px] font-sans">giải</span>
                    </div>
                  </div>

                  <div className="bg-slate-950/90 border border-slate-800/90 rounded-lg px-2.5 py-1.5 flex items-center justify-between gap-1.5">
                    <span className="text-[10px] text-slate-400 font-sans">1 ăn:</span>
                    <input
                      type="number"
                      min={1}
                      max={9999}
                      value={cfg.payoutRate}
                      onChange={(e) =>
                        handlePayoutChange(cfg.betType, parseInt(e.target.value, 10) || 1)
                      }
                      className="w-16 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-right text-xs text-emerald-300 font-bold focus:outline-none focus:border-emerald-400 tabular-nums"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table Layout (>= sm) */}
          <div className="hidden sm:block rounded-xl border border-slate-800 overflow-hidden bg-slate-900">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-mono border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Hình Thức Cách Chơi</th>
                  <th className="py-2.5 px-3 text-right">Số Giải / Số Vòng Tính Tiền</th>
                  <th className="py-2.5 px-3 text-right">Tỷ Lệ Ăn Thưởng (1 ăn ...)</th>
                  <th className="py-2.5 px-3">Mô Tả Quy Cách</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {regionConfigs.map((cfg) => (
                  <tr key={`${cfg.region}-${cfg.betType}`} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-semibold text-white font-sans">
                      {cfg.name}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={cfg.defaultPrizesCount}
                          onChange={(e) =>
                            handlePrizesChange(cfg.betType, parseInt(e.target.value, 10) || 1)
                          }
                          className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-right text-amber-300 font-bold focus:outline-none focus:border-amber-400 tabular-nums"
                        />
                        <span className="text-slate-400 text-[11px]">giải</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-slate-500 text-[11px]">1 ăn</span>
                        <input
                          type="number"
                          min={1}
                          max={9999}
                          value={cfg.payoutRate}
                          onChange={(e) =>
                            handlePayoutChange(cfg.betType, parseInt(e.target.value, 10) || 1)
                          }
                          className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-right text-emerald-300 font-bold focus:outline-none focus:border-emerald-400 tabular-nums"
                        />
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 font-sans text-[11px]">
                      {cfg.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:px-6 sm:py-4 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="text-[11px] sm:text-xs text-slate-400 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>Mọi thay đổi sẽ tự động áp dụng cho các vé cược mới tạo</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2 text-xs font-medium text-slate-300 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              className="flex-[2] sm:flex-initial flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-colors"
            >
              <Check className="w-4 h-4 shrink-0" />
              <span>Lưu Cấu Hình Bảng Giá</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
