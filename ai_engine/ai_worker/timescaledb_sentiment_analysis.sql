-- 1. Tạo bảng với kiểu dữ liệu chuẩn PostgreSQL
CREATE TABLE sentiment_analysis (
    article_id VARCHAR(50),
    target_entity VARCHAR(10),
    sentiment_score FLOAT,
    sentiment_label VARCHAR(10),
    analyzed_at TIMESTAMPTZ NOT NULL, -- Bắt buộc NOT NULL cho cột thời gian
    weight FLOAT,
    confident_score FLOAT
);

-- 2. Biến bảng thành Hypertable
-- Lưu ý: Tên cột phải là 'analyzed_at'
SELECT create_hypertable('sentiment_analysis', 'analyzed_at', chunk_time_interval => INTERVAL '1 hour');

-- 3. Nén dữ liệu (Compression)
-- Segmentby giúp truy vấn theo entity nhanh hơn rất nhiều
ALTER TABLE sentiment_analysis SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'target_entity'
);

-- 4. Chính sách nén dữ liệu
-- Nén các chunk cũ hơn 2 giờ
SELECT add_compression_policy('sentiment_analysis', INTERVAL '2 hours');

-- 5. Chính sách xóa dữ liệu cũ (Retention)
SELECT add_retention_policy('sentiment_analysis', INTERVAL '7 days');

-- 6. Tạo Continuous Aggregate (Materialized View)
CREATE MATERIALIZED VIEW sentiment_analysis_by_status_1h
WITH (timescaledb.continuous) AS
SELECT
  time_bucket(INTERVAL '1 hour', analyzed_at) AS bucket,
  target_entity,
  sentiment_label,
  COUNT(*) as total
FROM sentiment_analysis
GROUP BY 1, 2, 3
WITH NO DATA;

-- 7. Thiết lập Materialized Only = False
-- Để khi query nó kết hợp cả dữ liệu cũ trong view và dữ liệu mới nhất trong hypertable
ALTER MATERIALIZED VIEW sentiment_analysis_by_status_1h
SET (timescaledb.materialized_only = FALSE);

-- 8. Chính sách tự động cập nhật View
SELECT add_continuous_aggregate_policy (
  'sentiment_analysis_by_status_1h',
  start_offset => INTERVAL '10 hours',
  end_offset => INTERVAL '0 minutes',
  schedule_interval => INTERVAL '10 minutes'
);



--
--9. View tính điểm trung bình có trọng số theo từng giờ
CREATE MATERIALIZED VIEW sentiment_hourly_metrics
WITH (timescaledb.continuous) AS
SELECT
  time_bucket(INTERVAL '1 hour', analyzed_at) AS bucket,
  target_entity,
  -- Công thức: Tổng (Điểm * Trọng số) / Tổng trọng số
  SUM(sentiment_score * weight) / NULLIF(SUM(weight), 0) AS weighted_avg_sentiment,
  COUNT(*) AS article_count,
  SUM(weight) AS total_weight
FROM sentiment_analysis
GROUP BY 1, 2
WITH NO DATA;

ALTER MATERIALIZED VIEW sentiment_hourly_metrics
SET (timescaledb.materialized_only = FALSE);

--10. Chính sách tự động cập nhật (mỗi 10 phút cập nhật dữ liệu của 24h qua)
SELECT add_continuous_aggregate_policy('sentiment_hourly_metrics',
  start_offset => INTERVAL '24 hours',
  end_offset => INTERVAL '0 minutes',
  schedule_interval => INTERVAL '10 minutes');
