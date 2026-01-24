import { createContext, useContext, useState, ReactNode } from "react";

export type IndicatorType = "MA" | "EMA" | "SMA" | "BOLL" | "SAR" | "BBI" | "VOL";

export interface IndicatorSettings {
  period?: number;
  color?: string;
  lineWidth?: number;
  stdDev?: number; // For Bollinger Bands
}

export interface Indicator {
  id: string;
  type: IndicatorType;
  enabled: boolean;
  settings: IndicatorSettings;
  category: "main" | "sub";
}

interface IndicatorContextType {
  indicators: Indicator[];
  toggleIndicator: (id: string) => void;
  updateIndicatorSettings: (id: string, settings: Partial<IndicatorSettings>) => void;
  getActiveIndicators: (category?: "main" | "sub") => Indicator[];
}

const IndicatorContext = createContext<IndicatorContextType | undefined>(undefined);

const defaultIndicators: Indicator[] = [
  // Main Indicators
  { id: "ma", type: "MA", enabled: false, category: "main", settings: { period: 20, color: "#2196F3", lineWidth: 2 } },
  { id: "ema", type: "EMA", enabled: false, category: "main", settings: { period: 20, color: "#FF9800", lineWidth: 2 } },
  { id: "sma", type: "SMA", enabled: false, category: "main", settings: { period: 20, color: "#4CAF50", lineWidth: 2 } },
  { id: "boll", type: "BOLL", enabled: false, category: "main", settings: { period: 20, stdDev: 2, color: "#9C27B0", lineWidth: 1 } },
  { id: "sar", type: "SAR", enabled: false, category: "main", settings: { color: "#F44336", lineWidth: 2 } },
  { id: "bbi", type: "BBI", enabled: false, category: "main", settings: { color: "#00BCD4", lineWidth: 2 } },
  
  // Sub Indicators
  { id: "vol", type: "VOL", enabled: true, category: "sub", settings: { period: 5, color: "#607D8B", lineWidth: 1 } },
  { id: "vol-ma", type: "MA", enabled: false, category: "sub", settings: { period: 5, color: "#FFC107", lineWidth: 1 } },
];

export const IndicatorProvider = ({ children }: { children: ReactNode }) => {
  const [indicators, setIndicators] = useState<Indicator[]>(defaultIndicators);

  const toggleIndicator = (id: string) => {
    setIndicators((prev) =>
      prev.map((ind) =>
        ind.id === id ? { ...ind, enabled: !ind.enabled } : ind
      )
    );
  };

  const updateIndicatorSettings = (id: string, settings: Partial<IndicatorSettings>) => {
    setIndicators((prev) =>
      prev.map((ind) =>
        ind.id === id ? { ...ind, settings: { ...ind.settings, ...settings } } : ind
      )
    );
  };

  const getActiveIndicators = (category?: "main" | "sub") => {
    return indicators.filter(
      (ind) => ind.enabled && (!category || ind.category === category)
    );
  };

  return (
    <IndicatorContext.Provider
      value={{
        indicators,
        toggleIndicator,
        updateIndicatorSettings,
        getActiveIndicators,
      }}
    >
      {children}
    </IndicatorContext.Provider>
  );
};

export const useIndicators = () => {
  const context = useContext(IndicatorContext);
  if (context === undefined) {
    throw new Error("useIndicators must be used within an IndicatorProvider");
  }
  return context;
};
