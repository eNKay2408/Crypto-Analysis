## Crypto Analysis Frontend

Simple React + Vite + TypeScript dashboard shell with:

- Header / Sidebar / Content layout
- React Router for pages
- Static TradingView chart embedded via iframe

### Cách chạy

1. Cài dependency:

```bash
cd frontend
npm install
```

2. Chạy dev server:

```bash
npm run dev
```

3. Mở browser tại địa chỉ mà Vite in ra (mặc định là `http://localhost:5173`).

### Cấu trúc quan trọng

- **`src/layouts/DashboardLayout.tsx`**: Khung layout chính (Header, Sidebar, Content).
- **`src/components/layout/Header.tsx`**: Header top.
- **`src/components/layout/Sidebar.tsx`**: Sidebar (menu trái).
- **`src/pages/DashboardPage.tsx`**: Trang Dashboard mặc định chứa TradingView chart.
- **`src/components/tradingview/TradingViewStaticChart.tsx`**: Component tích hợp TradingView dạng iframe tĩnh.

Bạn có thể nhân bản pattern ở `DashboardPage` để tạo thêm pages mới và thêm route trong `App.tsx`.
