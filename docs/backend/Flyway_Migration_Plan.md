# Flyway Database Migration Plan

Complete guide for setting up and using Flyway for database version control in the Crypto Analysis project.

---

## What is Flyway?

Flyway is a database migration tool that:

- ✅ Tracks database schema changes
- ✅ Applies migrations in order
- ✅ Ensures consistency across environments
- ✅ Supports rollbacks and versioning

---

## Step 1: Add Flyway Dependency

### Update `pom.xml`

Add this dependency:

```xml
<!-- Flyway for database migrations -->
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-core</artifactId>
</dependency>

<!-- Flyway PostgreSQL support -->
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-database-postgresql</artifactId>
</dependency>
```

---

## Step 2: Configure Flyway

### Update `application.properties`

Add these configurations:

```properties
# Flyway Configuration
spring.flyway.enabled=true
spring.flyway.locations=classpath:db/migration
spring.flyway.baseline-on-migrate=true
spring.flyway.baseline-version=0
spring.flyway.validate-on-migrate=true
spring.flyway.out-of-order=false

# JPA Configuration (IMPORTANT!)
spring.jpa.hibernate.ddl-auto=validate
# Change from 'update' to 'validate' - Flyway manages schema now!
```

**Important:** Set `spring.jpa.hibernate.ddl-auto=validate` so Hibernate doesn't auto-create tables. Flyway will manage all schema changes.

---

## Step 3: Create Migration Directory Structure

Create this folder structure:

```
src/main/resources/
└── db/
    └── migration/
        ├── V1__create_symbols_table.sql
        ├── V2__create_klines_table.sql
        ├── V3__create_watchlist_table.sql
        └── V4__add_indexes.sql
```

**Naming Convention:**

- `V` = Versioned migration
- `1` = Version number (incremental)
- `__` = Double underscore separator
- `description` = What the migration does
- `.sql` = SQL file

---

## Step 4: Create Migration Files

### V1\_\_create_symbols_table.sql

```sql
-- Migration: Create symbols table
-- Version: 1
-- Description: Store trading symbol metadata from Binance

CREATE TABLE symbols (
    id BIGSERIAL PRIMARY KEY,
    symbol VARCHAR(20) UNIQUE NOT NULL,
    base_asset VARCHAR(10) NOT NULL,
    quote_asset VARCHAR(10) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'TRADING',
    price_precision INT NOT NULL DEFAULT 2,
    quantity_precision INT NOT NULL DEFAULT 8,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add comment
COMMENT ON TABLE symbols IS 'Trading symbols metadata from Binance exchange';
COMMENT ON COLUMN symbols.symbol IS 'Trading pair symbol (e.g., BTCUSDT)';
COMMENT ON COLUMN symbols.status IS 'Symbol status: TRADING, BREAK, HALT';
```

---

### V2\_\_create_klines_table.sql

```sql
-- Migration: Create klines table
-- Version: 2
-- Description: Store historical candlestick data

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
    CONSTRAINT uk_klines_symbol_interval_time UNIQUE (symbol, interval, open_time)
);

-- Add comments
COMMENT ON TABLE klines IS 'Historical candlestick (kline) data';
COMMENT ON COLUMN klines.interval IS 'Kline interval: 1m, 5m, 15m, 1h, 4h, 1d, etc.';
COMMENT ON COLUMN klines.open_time IS 'Kline open time in milliseconds';
```

---

### V3\_\_create_watchlist_table.sql

```sql
-- Migration: Create watchlist table
-- Version: 3
-- Description: Store user watchlist symbols

CREATE TABLE watchlist (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL DEFAULT 1,
    symbol VARCHAR(20) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_watchlist_user_symbol UNIQUE (user_id, symbol)
);

-- Add comments
COMMENT ON TABLE watchlist IS 'User watchlist for tracking favorite symbols';
COMMENT ON COLUMN watchlist.user_id IS 'User ID (default 1 for single-user mode)';
COMMENT ON COLUMN watchlist.sort_order IS 'Display order in watchlist';
```

---

### V4\_\_add_indexes.sql

```sql
-- Migration: Add performance indexes
-- Version: 4
-- Description: Add indexes for query optimization

-- Index for klines queries (most important!)
CREATE INDEX idx_klines_symbol_interval_time
ON klines(symbol, interval, open_time DESC);

-- Index for symbol lookups
CREATE INDEX idx_symbols_status
ON symbols(status)
WHERE status = 'TRADING';

-- Index for watchlist queries
CREATE INDEX idx_watchlist_user_id
ON watchlist(user_id, sort_order);

-- Add comments
COMMENT ON INDEX idx_klines_symbol_interval_time IS 'Optimize kline queries by symbol, interval, and time';
COMMENT ON INDEX idx_symbols_status IS 'Partial index for active trading symbols';
COMMENT ON INDEX idx_watchlist_user_id IS 'Optimize watchlist queries by user';
```

---

## Step 5: Migration Naming Conventions

### Version Numbers

**Sequential numbering:**

```
V1__initial_schema.sql
V2__add_users_table.sql
V3__add_indexes.sql
V4__add_column_to_symbols.sql
```

**Date-based (recommended for teams):**

```
V20251228_1__create_symbols_table.sql
V20251228_2__create_klines_table.sql
V20251229_1__add_indexes.sql
```

### Description Rules

✅ **Good:**

- `V1__create_symbols_table.sql`
- `V2__add_price_precision_column.sql`
- `V3__create_index_on_klines.sql`

❌ **Bad:**

- `V1__migration.sql` (not descriptive)
- `V1_create_table.sql` (single underscore)
- `V1__Create_Symbols_Table.sql` (use lowercase)

---

## Step 6: Common Migration Patterns

### Add Column

**V5\_\_add_symbol_type_column.sql**

```sql
-- Add symbol_type column to symbols table
ALTER TABLE symbols
ADD COLUMN symbol_type VARCHAR(20) DEFAULT 'SPOT';

COMMENT ON COLUMN symbols.symbol_type IS 'Symbol type: SPOT, FUTURES, MARGIN';
```

---

### Modify Column

**V6\_\_modify_volume_precision.sql**

```sql
-- Increase volume precision from 8 to 12 decimals
ALTER TABLE klines
ALTER COLUMN volume TYPE DECIMAL(30, 12);
```

---

### Add Constraint

**V7\_\_add_foreign_key_constraint.sql**

```sql
-- Add foreign key from watchlist to symbols
ALTER TABLE watchlist
ADD CONSTRAINT fk_watchlist_symbol
FOREIGN KEY (symbol)
REFERENCES symbols(symbol)
ON DELETE CASCADE;
```

---

### Data Migration

**V8\_\_migrate_old_data.sql**

```sql
-- Migrate old data format to new format
UPDATE klines
SET quote_volume = volume * close_price
WHERE quote_volume IS NULL;
```

---

## Step 7: Rollback Migrations (Undo)

Flyway supports undo migrations (paid version) or manual rollbacks.

### Manual Rollback Pattern

**V5\_\_add_symbol_type_column.sql** (forward)

```sql
ALTER TABLE symbols ADD COLUMN symbol_type VARCHAR(20);
```

**U5\_\_remove_symbol_type_column.sql** (undo)

```sql
ALTER TABLE symbols DROP COLUMN symbol_type;
```

---

## Step 8: Testing Migrations

### Local Testing

1. **Clean database:**

```bash
mvn flyway:clean
```

2. **Run migrations:**

```bash
mvn flyway:migrate
```

3. **Check status:**

```bash
mvn flyway:info
```

### Validation

```bash
# Validate migrations without applying
mvn flyway:validate
```

---

## Step 9: Flyway Commands

### Maven Commands

| Command               | Description                      |
| --------------------- | -------------------------------- |
| `mvn flyway:migrate`  | Apply pending migrations         |
| `mvn flyway:info`     | Show migration status            |
| `mvn flyway:validate` | Validate applied migrations      |
| `mvn flyway:clean`    | Drop all objects (⚠️ DANGEROUS!) |
| `mvn flyway:baseline` | Baseline existing database       |
| `mvn flyway:repair`   | Repair metadata table            |

### Spring Boot Auto-Migration

Flyway runs automatically on application startup when:

- `spring.flyway.enabled=true`
- Pending migrations exist

---

## Step 10: Best Practices

### ✅ DO:

1. **Always test migrations locally first**
2. **Use descriptive names**
3. **One logical change per migration**
4. **Add comments to SQL**
5. **Version control all migrations**
6. **Never modify applied migrations**
7. **Use transactions (default in Flyway)**
8. **Backup before production migrations**

### ❌ DON'T:

1. **Don't modify existing migrations** (create new ones)
2. **Don't use `flyway:clean` in production**
3. **Don't skip version numbers**
4. **Don't put multiple unrelated changes in one file**
5. **Don't forget to test rollback strategy**

---

## Step 11: Production Deployment Workflow

### Development

```bash
1. Create migration file (V5__add_feature.sql)
2. Test locally: mvn flyway:migrate
3. Verify: mvn flyway:info
4. Commit to Git
```

### Staging

```bash
1. Pull latest code
2. Flyway auto-runs on startup
3. Verify migrations applied
4. Test application
```

### Production

```bash
1. Backup database first!
2. Deploy application
3. Flyway auto-runs migrations
4. Monitor logs
5. Verify application health
```

---

## Step 12: Flyway Metadata Table

Flyway creates a `flyway_schema_history` table:

```sql
SELECT * FROM flyway_schema_history;
```

**Columns:**

- `installed_rank` - Order of execution
- `version` - Migration version
- `description` - Migration description
- `type` - SQL or Java
- `script` - Filename
- `checksum` - File checksum (detects changes)
- `installed_on` - When applied
- `execution_time` - How long it took
- `success` - Success/failure

---

## Step 13: Handling Conflicts

### Scenario: Two developers create V5

**Developer A:** `V5__add_column_a.sql`  
**Developer B:** `V5__add_column_b.sql`

**Solution:**

1. First to merge keeps V5
2. Second developer renames to V6
3. Rebase and test

---

## Step 14: Environment-Specific Migrations

### Using Profiles

**application-dev.properties:**

```properties
spring.flyway.locations=classpath:db/migration,classpath:db/migration/dev
```

**application-prod.properties:**

```properties
spring.flyway.locations=classpath:db/migration
```

**Directory structure:**

```
db/migration/
├── V1__create_tables.sql        (all environments)
├── V2__add_indexes.sql           (all environments)
└── dev/
    └── V100__insert_test_data.sql (dev only)
```

---

## Step 15: Troubleshooting

### Issue: Checksum Mismatch

**Error:**

```
Migration checksum mismatch for migration version 1
```

**Solution:**

```bash
# Repair metadata (updates checksums)
mvn flyway:repair
```

### Issue: Failed Migration

**Error:**

```
Migration V3 failed
```

**Solution:**

1. Fix the SQL error in V3
2. Run `mvn flyway:repair` to mark as failed
3. Create V4 to fix the issue
4. Or manually fix DB and repair

---

## Summary Checklist

- [ ] Add Flyway dependencies to `pom.xml`
- [ ] Configure Flyway in `application.properties`
- [ ] Set `spring.jpa.hibernate.ddl-auto=validate`
- [ ] Create `src/main/resources/db/migration/` folder
- [ ] Create V1\_\_create_symbols_table.sql
- [ ] Create V2\_\_create_klines_table.sql
- [ ] Create V3\_\_create_watchlist_table.sql
- [ ] Create V4\_\_add_indexes.sql
- [ ] Test with `mvn flyway:migrate`
- [ ] Verify with `mvn flyway:info`
- [ ] Commit migrations to Git
- [ ] Document migration process for team

---

## Quick Reference

### File Naming

```
V{version}__{description}.sql
V1__create_users_table.sql
V2__add_email_column.sql
```

### Migration Order

```
V1 → V2 → V3 → V4 → ...
(Applied in sequential order)
```

### Key Commands

```bash
mvn flyway:migrate   # Apply migrations
mvn flyway:info      # Check status
mvn flyway:validate  # Validate migrations
```

---

## Next Steps

1. Add Flyway dependency
2. Create migration files (V1-V4)
3. Test locally
4. Run application and verify tables created
5. Check `flyway_schema_history` table
6. Document for your team

Good luck with your migrations! 🚀
