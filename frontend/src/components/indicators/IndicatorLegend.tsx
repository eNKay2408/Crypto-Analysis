import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

interface IndicatorLegendProps {
  indicators: Array<{
    id: string;
    type: string;
    enabled: boolean;
    category: "main" | "sub";
    settings: {
      period?: number;
      color?: string;
    };
  }>;
  currentValues: Map<string, number | null>;
  onToggleVisibility: (id: string) => void;
  visibleIndicators?: Set<string>;
}

export const IndicatorLegend = ({ 
  indicators, 
  currentValues, 
  onToggleVisibility,
  visibleIndicators = new Set()
}: IndicatorLegendProps) => {
  const activeIndicators = indicators.filter((ind) => ind.enabled && ind.category === "main");

  if (activeIndicators.length === 0) return null;

  const getIndicatorLabel = (indicator: any) => {
    if (indicator.type === "MA" || indicator.type === "EMA" || indicator.type === "SMA") {
      return `${indicator.type}(${indicator.settings.period || 20})`;
    }
    if (indicator.type === "BOLL") {
      return `BOLL(${indicator.settings.period || 20})`;
    }
    return indicator.type;
  };

  return (
    <div className="absolute left-2 top-2 z-20 flex flex-wrap gap-2 rounded-lg bg-slate-900/90 px-3 py-2 text-xs backdrop-blur-sm">
      {activeIndicators.map((indicator) => {
        const value = currentValues.get(indicator.id);
        const label = getIndicatorLabel(indicator);
        
        return (
          <div key={indicator.id} className="flex items-center gap-1.5">
            {/* Eye icon to toggle visibility */}
            <button
              onClick={() => onToggleVisibility(indicator.id)}
              className="flex h-4 w-4 items-center justify-center text-slate-400 transition-colors hover:text-slate-200"
              title="Toggle visibility"
            >
              {visibleIndicators.has(indicator.id) ? (
                <VisibilityIcon className="h-2 w-2" />
              ) : (
                <VisibilityOffIcon className="h-2 w-2" />
              )}
            </button>
            
            {/* Indicator label */}
            <span className="text-slate-400">{label}:</span>
            
            {/* Indicator value */}
            <span
              className="font-medium tabular-nums"
              style={{ color: indicator.settings.color || "#fff" }}
            >
              {value !== null && value !== undefined ? value.toFixed(2) : "--"}
            </span>
          </div>
        );
      })}
    </div>
  );
};
