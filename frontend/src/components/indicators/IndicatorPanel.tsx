import { useState } from "react";
import FunctionsIcon from '@mui/icons-material/Functions';
import { useIndicators } from "../../contexts/IndicatorContext";

export const IndicatorPanel = () => {
  const { indicators, toggleIndicator } = useIndicators();
  const [isOpen, setIsOpen] = useState(false);

  const mainIndicators = indicators.filter((ind) => ind.category === "main");
  const subIndicators = indicators.filter((ind) => ind.category === "sub");

  return (
    <>
      {/* Selector Button - Always visible */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex h-9 items-center gap-2 rounded-lg px-4 text-sm font-medium text-slate-200 transition-all hover:bg-slate-700"
      >
        <FunctionsIcon className="h-5 w-5" />
        <span>Indicator</span>
      </button>

      {/* Overlay and Modal - Only show when open */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal */}
          <div className="fixed left-1/2 top-1/2 z-50 w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-700 bg-slate-800 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-700 p-4">
              <h3 className="text-base font-semibold text-slate-100">Indicator</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="max-h-96 overflow-y-auto p-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-700/50 [&::-webkit-scrollbar-thumb]:bg-slate-600 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-500">
          {/* Main Indicators */}
          <div className="mb-4">
            <div className="mb-2 text-xs font-medium text-slate-400">Main Indicator</div>
            <div className="space-y-2">
              {mainIndicators.map((indicator) => (
                <label
                  key={indicator.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md p-2 transition-colors hover:bg-slate-700/50"
                >
                  <input
                    type="checkbox"
                    checked={indicator.enabled}
                    onChange={() => toggleIndicator(indicator.id)}
                    className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-sky-600 focus:ring-2 focus:ring-sky-600 focus:ring-offset-0"
                  />
                  <span className="text-sm text-slate-200">
                    {indicator.type}
                    {indicator.type === "MA" && " (Moving Average)"}
                    {indicator.type === "EMA" && " (Exponential Moving Average)"}
                    {indicator.type === "SMA" && " (Simple Moving Average)"}
                    {indicator.type === "BOLL" && " (Bollinger Bands)"}
                    {indicator.type === "SAR" && " (Stop and Reverse)"}
                    {indicator.type === "BBI" && " (Bull Bear Index)"}
                  </span>
                  {indicator.enabled && (
                    <div
                      className="ml-auto h-3 w-3 rounded-full"
                      style={{ backgroundColor: indicator.settings.color }}
                    />
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Sub Indicators */}
          <div>
            <div className="mb-2 text-xs font-medium text-slate-400">Sub Indicator</div>
            <div className="space-y-2">
              {subIndicators.map((indicator) => (
                <label
                  key={indicator.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md p-2 transition-colors hover:bg-slate-700/50"
                >
                  <input
                    type="checkbox"
                    checked={indicator.enabled}
                    onChange={() => toggleIndicator(indicator.id)}
                    className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-sky-600 focus:ring-2 focus:ring-sky-600 focus:ring-offset-0"
                  />
                  <span className="text-sm text-slate-200">
                    {indicator.type === "VOL" && "VOL (Volume)"}
                    {indicator.type === "MA" && indicator.id === "vol-ma" && "MA (Volume Moving Average)"}
                  </span>
                  {indicator.enabled && (
                    <div
                      className="ml-auto h-3 w-3 rounded-full"
                      style={{ backgroundColor: indicator.settings.color }}
                    />
                  )}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
        </>
      )}
    </>
  );
};
