export const TradingViewStaticChart = () => {
  return (
    <div className="min-h-[420px] overflow-hidden rounded-lg border border-slate-800 bg-slate-950 shadow-md">
      <iframe
        title="TradingView BTC/USDT Chart"
        className="h-full w-full"
        src="https://s.tradingview.com/widgetembed/?symbol=BINANCE:BTCUSDT&interval=60&hidesidetoolbar=1&symboledit=1&saveimage=0&toolbarbg=rgba(0,0,0,1)&studies=[]&theme=dark&style=1&timezone=Etc%2FUTC&withdateranges=1&hideideas=1&hidevolume=0"
        loading="lazy"
        frameBorder="0"
        allowTransparency={true}
        allowFullScreen={true}
      ></iframe>
    </div>
  );
};
