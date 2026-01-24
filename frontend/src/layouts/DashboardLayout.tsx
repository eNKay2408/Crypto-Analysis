import type { ReactNode } from "react";
import { Header } from "../components/layout/Header";
import { ChartToolbar } from "../components/chart/ChartToolbar";
import { RightNavigationPanel } from "../components/layout/RightNavigationPanel";
import { ChartToolProvider } from "../contexts/ChartToolContext";
import { IndicatorProvider } from "../contexts/IndicatorContext";

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <IndicatorProvider>
      <ChartToolProvider>
        <div className="flex h-screen flex-col bg-slate-950">
          <Header />
          <div className="flex min-h-0 flex-1">
            {/* Left Toolbar */}
            <ChartToolbar />
            
            {/* Main Content */}
            <main className="min-w-0 flex-1 overflow-auto">{children}</main>
            
            {/* Right Navigation Panel */}
            <RightNavigationPanel />
          </div>
        </div>
      </ChartToolProvider>
    </IndicatorProvider>
  );
};

