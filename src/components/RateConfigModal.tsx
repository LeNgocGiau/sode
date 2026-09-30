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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:px-6 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-base font-bold text-white">Cấu Hình Bảng Giá Cược 3 Miền</h3>
              <p className="text-xs text-slate-400">
                Tự động tính tiền cược dựa trên số giải và tỷ lệ ăn thưởng được cài đặt
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Region Switcher */}
        <div className="px-6 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Chọn miền cấu hình:</span>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              {REGIONS.map((r) => (
                <button
                  type="button"
                  key={r.id}
                  onClick={() => setSelectedRegion(r.id)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                    selectedRegion === r.id
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {r.name} ({r.totalPrizes} Lô)
                </button>
              ))}
            </div>
          </div>

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

        {/* Table list of configs for selected region */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          <div className="rounded-xl border border-slate-800 overflow-hidden">
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
        <div className="p-4 sm:px-6 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>Mọi thay đổi sẽ tự động áp dụng cho các vé cược mới tạo</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Lưu Cấu Hình Bảng Giá</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
