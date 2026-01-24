import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useChartTool } from "../../contexts/ChartToolContext";

interface ChartTool {
	id: string;
	name: string;
	icon: string;
	tooltip: string;
}

const tools: ChartTool[] = [
	{ id: "cursor", name: "Cursor", icon: "⌖", tooltip: "Cursor / Selection" },
	{ id: "crosshair", name: "Crosshair", icon: "✛", tooltip: "Crosshair" },
	{ id: "trend", name: "Trend Line", icon: "⟋", tooltip: "Trend Line" },
	{ id: "horizontal", name: "Horizontal Line", icon: "─", tooltip: "Horizontal Line" },
	{ id: "vertical", name: "Vertical Line", icon: "│", tooltip: "Vertical Line" },
	{ id: "rectangle", name: "Rectangle", icon: "▭", tooltip: "Rectangle" },
	{ id: "circle", name: "Circle", icon: "○", tooltip: "Circle" },
	{ id: "triangle", name: "Triangle", icon: "△", tooltip: "Triangle" },
	{ id: "fibonacci", name: "Fibonacci", icon: "φ", tooltip: "Fibonacci Retracement" },
	{ id: "measure", name: "Measure", icon: "📏", tooltip: "Measure Tool" },
];

export const ChartToolbar = () => {
	const { activeTool, setActiveTool, clearDrawings, drawingsVisible, toggleDrawingsVisibility } = useChartTool();

	return (
		<div className="flex w-14 flex-col border-r border-slate-800 bg-slate-900">
			{/* Toolbar Header */}
			<div className="relative z-50 flex h-14 items-center justify-center border-b border-slate-800 bg-slate-900">
				<div className="text-xs font-semibold text-slate-500">Tools</div>
			</div>

			{/* Tool Buttons */}
			<div className="flex flex-col gap-1 p-2">
				{tools.map((tool) => (
					<button
						key={tool.id}
						onClick={() => setActiveTool(tool.id)}
						className={`group relative flex h-10 w-10 items-center justify-center rounded-md text-lg transition-all z-50 ${
							activeTool === tool.id
								? "bg-sky-600 text-white shadow-lg shadow-sky-600/30"
								: "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
						}`}
						title={tool.tooltip}
						type="button"
					>
						{tool.icon}
						
						{/* Tooltip */}
						<div className="pointer-events-none absolute left-full ml-2 hidden whitespace-nowrap rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-200 shadow-lg group-hover:block">
							{tool.tooltip}
							<div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-800" />
						</div>
					</button>
				))}

				{/* Visibility Toggle - Above Eraser */}
				<button
					onClick={toggleDrawingsVisibility}
					className="group relative flex h-10 w-10 items-center justify-center rounded-md text-slate-400 transition-all z-50 hover:bg-slate-800 hover:text-slate-200"
					title={drawingsVisible ? "Hide Drawings" : "Show Drawings"}
					type="button"
				>
					{drawingsVisible ? (
						<VisibilityIcon className="h-5 w-5" />
					) : (
						<VisibilityOffIcon className="h-5 w-5" />
					)}
					
					{/* Tooltip */}
					<div className="pointer-events-none absolute left-full ml-2 hidden whitespace-nowrap rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-200 shadow-lg group-hover:block">
						{drawingsVisible ? "Hide Drawings" : "Show Drawings"}
						<div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-800" />
					</div>
				</button>

				{/* Eraser Tool */}
				<button
					onClick={() => setActiveTool("eraser")}
					className={`group relative flex h-10 w-10 items-center justify-center rounded-md text-lg transition-all z-50 ${
						activeTool === "eraser"
							? "bg-sky-600 text-white shadow-lg shadow-sky-600/30"
							: "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
					}`}
					title="Remove Drawings"
					type="button"
				>
					🗑
					
					{/* Tooltip */}
					<div className="pointer-events-none absolute left-full ml-2 hidden whitespace-nowrap rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-200 shadow-lg group-hover:block">
						Remove Drawings
						<div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-800" />
					</div>
				</button>
			</div>
		</div>
	);
};
