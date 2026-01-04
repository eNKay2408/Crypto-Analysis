import psycopg2
from psycopg2.extras import execute_values
from ai_worker.config import EnvironmentConfig


class PostgresqlDbManager:
    def __init__(self, uri=EnvironmentConfig.POSTGRESQL_DB_URI):
        self.conn = psycopg2.connect(uri)
        self.conn.autocommit = True

    def save_data(self, table_name, data_dict):
        """
        data_dict: {"article_id": "A1", "target_entity": "BTC", ...}
        """
        print(f"Saving data for {table_name}")
        columns = data_dict.keys()
        values = [data_dict[col] for col in columns]

        query = f"INSERT INTO {table_name} ({', '.join(columns)}) VALUES %s"

        with self.conn.cursor() as cursor:
            execute_values(cursor, query, [values])

    def is_exists(self, table_name, query_dict):
        """
        query_dict: {"article_id": "A1"}
        """
        where_clause = " AND ".join([f"{k} = %s" for k in query_dict.keys()])
        query = f"SELECT 1 FROM {table_name} WHERE {where_clause} LIMIT 1"

        with self.conn.cursor() as cursor:
            cursor.execute(query, list(query_dict.values()))
            return cursor.fetchone() is not None

    def close(self):
        if self.conn:
            self.conn.close()
