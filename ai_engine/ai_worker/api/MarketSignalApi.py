from fastapi import FastAPI, Query

from ai_worker.db_manager.PostgresqlDbManager import PostgresqlDbManager

app = FastAPI(title="Crypto Sentiment Signal API")
db = PostgresqlDbManager()


def calculate_signal(current_mas, prev_mas, threshold_greed=0.7, threshold_fear=0.3):
    if current_mas >= threshold_greed:
        return {
            "signal": "WARNING",
            "advice": "Gradual profit-taking (Extreme Greed)",
            "color": "red"
        }

    if current_mas <= threshold_fear:
        return {
            "signal": "RECOMMEND",
            "advice": "Buy the dip / Monitor closely (Extreme Fear)",
            "color": "green"
        }

    # Trend detection (Bullish sentiment growth)
    if current_mas > prev_mas:
        return {
            "signal": "HOLD",
            "advice": "Maintain position (Positive momentum)",
            "color": "blue"
        }

    # Sideways market
    return {
        "signal": "NEUTRAL",
        "advice": "Market is range-bound / No clear trend",
        "color": "gray"
    }


@app.get("/api/v1/sentiment/signal")
async def get_sentiment_signal(
        symbol: str = Query(..., examples=["BTC"]),
        window_h: int = Query(4, examples=[4])  # Default window time is 4h
):
    # Query SQL with Window Function to calculate Moving Average
    query = f"""
        SELECT 
            bucket,
            weighted_avg_sentiment,
            AVG(weighted_avg_sentiment) OVER (
                ORDER BY bucket 
                ROWS BETWEEN {window_h - 1} PRECEDING AND CURRENT ROW
            ) AS mas_value
        FROM sentiment_hourly_metrics
        WHERE target_entity = '{symbol.upper()}'
        ORDER BY bucket DESC
        LIMIT 2;
    """

    with db.conn.cursor() as cursor:
        cursor.execute(query)
        rows = cursor.fetchall()

    if not rows or len(rows) < 1:
        return {"error": "There are not enough data to calculate sentiment signal"}

    latest_data = rows[0]
    # Index 2 is mas_value from Window Function
    current_mas = latest_data[2]

    if current_mas is None:
        return {
            "symbol": symbol.upper(),
            "error": "Sentiment data in this window time is blank",
        }

    # Get previous columns to calculate trends
    prev_data = rows[1] if len(rows) > 1 else rows[0]
    prev_mas = prev_data[2] if prev_data[2] is not None else current_mas

    # Get recommend signal
    strategy = calculate_signal(current_mas, prev_mas)

    return {
        "symbol": symbol.upper(),
        "window": f"{window_h}h",
        "current_mas": round(current_mas, 4),
        "article_count_last_hour": latest_data[1],
        "recommendation": strategy
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
