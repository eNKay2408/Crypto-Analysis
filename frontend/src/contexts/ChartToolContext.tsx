import { createContext, useContext, useState, ReactNode } from "react";

interface ChartToolContextType {
	activeTool: string;
	setActiveTool: (tool: string) => void;
	drawings: Drawing[];
	addDrawing: (drawing: Drawing) => void;
	removeDrawing: (id: string) => void;
	clearDrawings: () => void;
	drawingsVisible: boolean;
	toggleDrawingsVisibility: () => void;
}

export interface Drawing {
	id: string;
	type: "trend" | "horizontal" | "vertical" | "rectangle" | "circle" | "triangle" | "fibonacci" | "text" | "measure";
	points: Array<{ time: number; price: number }>;
	color?: string;
	label?: string;
}

const ChartToolContext = createContext<ChartToolContextType | undefined>(undefined);

export const ChartToolProvider = ({ children }: { children: ReactNode }) => {
	const [activeTool, setActiveTool] = useState<string>("cursor");
	const [drawings, setDrawings] = useState<Drawing[]>([]);
	const [drawingsVisible, setDrawingsVisible] = useState<boolean>(true);

	const addDrawing = (drawing: Drawing) => {
		setDrawings((prev) => [...prev, drawing]);
	};

	const removeDrawing = (id: string) => {
		setDrawings((prev) => prev.filter((d) => d.id !== id));
	};

	const clearDrawings = () => {
		setDrawings([]);
	};

	const toggleDrawingsVisibility = () => {
		setDrawingsVisible((prev) => !prev);
	};

	return (
		<ChartToolContext.Provider
			value={{
				activeTool,
				setActiveTool,
				drawings,
				addDrawing,
				removeDrawing,
				clearDrawings,
				drawingsVisible,
				toggleDrawingsVisibility,
			}}
		>
			{children}
		</ChartToolContext.Provider>
	);
};

export const useChartTool = () => {
	const context = useContext(ChartToolContext);
	if (context === undefined) {
		throw new Error("useChartTool must be used within a ChartToolProvider");
	}
	return context;
};
