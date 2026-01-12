-- Create ENUM type for symbol status (if not exists)
DO $$ BEGIN
    CREATE TYPE symbol_status AS ENUM (
        'PRE_TRADING',
        'TRADING',
        'POST_TRADING',
        'END_OF_DAY',
        'HALT',
        'AUCTION_MATCH',
        'BREAK'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE symbols (
    id BIGSERIAL PRIMARY KEY,
    symbol VARCHAR(20) UNIQUE NOT NULL,
    base_asset VARCHAR(10) NOT NULL,
    quote_asset VARCHAR(10) NOT NULL,
    status symbol_status NOT NULL DEFAULT 'TRADING',
    price_precision INT NOT NULL DEFAULT 2,
    quantity_precision INT NOT NULL DEFAULT 8,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE klines (
    id BIGSERIAL PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL,
    interval VARCHAR(10) NOT NULL,
    open_time BIGINT NOT NULL,
    close_time BIGINT NOT NULL,
    open_price DECIMAL(20, 8) NOT NULL,
    high_price DECIMAL(20, 8) NOT NULL,
    low_price DECIMAL(20, 8) NOT NULL,
    close_price DECIMAL(20, 8) NOT NULL,
    volume DECIMAL(20, 8) NOT NULL,
    quote_volume DECIMAL(20, 8),
    trades_count INT,
    taker_buy_base_volume DECIMAL(20, 8),
    taker_buy_quote_volume DECIMAL(20, 8),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_klines_symbol_interval_time UNIQUE (symbol, interval, open_time)
);

CREATE TABLE watchlist (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL DEFAULT 1,
    symbol VARCHAR(20) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_watchlist_user_symbol UNIQUE (user_id, symbol)
);

-- Index for klines queries
CREATE INDEX idx_klines_symbol_interval_time ON klines (
    symbol,
    interval,
    open_time DESC
);

-- Index for symbol lookups
CREATE INDEX idx_symbols_status ON symbols (status)
WHERE
    status = 'TRADING';

-- Index for watchlist queries
CREATE INDEX idx_watchlist_user_id ON watchlist (user_id, sort_order);