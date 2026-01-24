import { useState } from "react";

interface Coin {
	symbol: string;
	name: string;
	icon: string;
}

const popularCoins: Coin[] = [
	{ symbol: "BTC/USDT", name: "Bitcoin", icon: "₿" },
	{ symbol: "ETH/USDT", name: "Ethereum", icon: "Ξ" },
	{ symbol: "BNB/USDT", name: "Binance Coin", icon: "🔶" },
	{ symbol: "SOL/USDT", name: "Solana", icon: "◎" },
	{ symbol: "XRP/USDT", name: "Ripple", icon: "✕" },
	{ symbol: "ADA/USDT", name: "Cardano", icon: "₳" },
	{ symbol: "DOGE/USDT", name: "Dogecoin", icon: "Ð" },
	{ symbol: "MATIC/USDT", name: "Polygon", icon: "⬡" },
	{ symbol: "DOT/USDT", name: "Polkadot", icon: "●" },
	{ symbol: "AVAX/USDT", name: "Avalanche", icon: "🔺" },
];

interface CoinSelectorProps {
	selectedCoin: string;
	onCoinChange: (coin: string) => void;
}

export const CoinSelector = ({ selectedCoin, onCoinChange }: CoinSelectorProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");

	const filteredCoins = popularCoins.filter(
		(coin) =>
			coin.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
			coin.name.toLowerCase().includes(searchQuery.toLowerCase())
	);

	const selectedCoinData = popularCoins.find((c) => c.symbol === selectedCoin) || popularCoins[0];

	return (
		<>
			{/* Selector Button - Always visible */}
			<button
				onClick={() => setIsOpen(true)}
				className="flex h-9 items-center gap-2 rounded-lg px-4 transition-all hover:bg-slate-700"
				type="button"
			>
				<div className="flex flex-col items-start">
					<span className="text-sm font-semibold text-slate-100">
						{selectedCoinData.symbol}
					</span>
					<span className="text-xs text-slate-400">{selectedCoinData.name}</span>
				</div>
				<svg
					className={`ml-2 h-4 w-4 text-slate-400 transition-transform ${
						isOpen ? "rotate-180" : ""
					}`}
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M19 9l-7 7-7-7"
					/>
				</svg>
			</button>

			{/* Overlay and Modal - Only show when open */}
			{isOpen && (
				<>
					{/* Overlay */}
					<div
						className="fixed inset-0 z-40 bg-black/50"
						onClick={() => {
							setIsOpen(false);
							setSearchQuery("");
						}}
					/>

					{/* Modal */}
					<div className="fixed left-1/2 top-1/2 z-50 w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-700 bg-slate-800 shadow-2xl">
				{/* Header */}
				<div className="flex items-center justify-between border-b border-slate-700 p-4">
					<h3 className="text-base font-semibold text-slate-100">Select Cryptocurrency</h3>
					<button
						onClick={() => {
							setIsOpen(false);
							setSearchQuery("");
						}}
						className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-200"
					>
						✕
					</button>
				</div>

				{/* Search Input */}
				<div className="border-b border-slate-700 p-4">
					<input
						type="text"
						placeholder="Search cryptocurrency..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
						autoFocus
					/>
				</div>

				{/* Coin List */}
				<div className="max-h-96 overflow-y-auto p-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-700/50 [&::-webkit-scrollbar-thumb]:bg-slate-600 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-500">
					{filteredCoins.length > 0 ? (
						<div className="space-y-1">
							{filteredCoins.map((coin) => (
								<button
									key={coin.symbol}
									onClick={() => {
										onCoinChange(coin.symbol);
										setIsOpen(false);
										setSearchQuery("");
									}}
									className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-all ${
										selectedCoin === coin.symbol
											? "bg-sky-600 text-white"
											: "text-slate-200 hover:bg-slate-700/50"
									}`}
									type="button"
								>
									<div className="flex-1">
										<div className="font-semibold text-sm">{coin.symbol}</div>
										<div className={`text-xs ${selectedCoin === coin.symbol ? "text-sky-100" : "text-slate-400"}`}>
											{coin.name}
										</div>
									</div>
									{selectedCoin === coin.symbol && (
										<svg
											className="h-5 w-5"
											fill="currentColor"
											viewBox="0 0 20 20"
										>
											<path
												fillRule="evenodd"
												d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
												clipRule="evenodd"
											/>
										</svg>
									)}
								</button>
							))}
						</div>
					) : (
						<div className="p-8 text-center text-sm text-slate-400">
							No cryptocurrencies found
						</div>
					)}
					</div>
				</div>
				</>
			)}
		</>
	);
};
