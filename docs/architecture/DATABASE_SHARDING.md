# Database Sharding Strategy

## Overview
This document outlines the sharding strategy for scaling the Hello database as it grows beyond a single server's capacity.

## When to Shard
Consider sharding when:
- Database size > 500GB
- Query performance degrades despite optimization
- Single server cannot handle write load
- Geographic distribution requirements

## Sharding Key Selection

### Primary Sharding Key: `user_id`
**Rationale:**
- Most queries filter by user
- Even distribution of data
- Natural partition boundary
- Minimizes cross-shard queries

### Tables to Shard
1. **calls** - Shard by `user_id`
2. **contacts** - Shard by `user_id`
3. **transcriptions** - Shard by `user_id` (via calls)
4. **audit_logs** - Shard by `user_id`

### Tables to Keep Global
1. **users** - Small, frequently joined
2. **system_config** - Shared configuration
3. **feature_flags** - Shared state

## Shard Architecture

```
┌─────────────────┐
│  Application    │
│     Layer       │
└────────┬────────┘
         │
    ┌────▼────┐
    │ Vitess  │  (Sharding Proxy)
    └────┬────┘
         │
    ┌────┴───────────────────┐
    │                        │
┌───▼────┐            ┌──────▼──┐
│ Shard 0│            │ Shard 1 │
│ (0-50%)│            │(51-100%)│
└────────┘            └─────────┘
```

## Sharding Function

```sql
-- Hash-based sharding
CREATE OR REPLACE FUNCTION get_shard_id(user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (hashtext(user_id::text) % 256);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Range-based sharding (alternative)
CREATE OR REPLACE FUNCTION get_shard_by_range(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  user_created_at TIMESTAMP;
BEGIN
  SELECT created_at INTO user_created_at 
  FROM users WHERE id = user_id;
  
  IF user_created_at < '2024-01-01' THEN
    RETURN 0;
  ELSIF user_created_at < '2025-01-01' THEN
    RETURN 1;
  ELSE
    RETURN 2;
  END IF;
END;
$$ LANGUAGE plpgsql;
```

## Migration Strategy

### Phase 1: Preparation (2 weeks)
1. Add shard_id column to all tables
2. Create sharding functions
3. Update application to be shard-aware
4. Set up monitoring

### Phase 2: Dual-Write (1 month)
1. Write to both old and new shards
2. Validate data consistency
3. Monitor performance

### Phase 3: Migration (3 months)
1. Migrate historical data in batches
2. Use pt-online-schema-change for zero downtime
3. Validate data integrity

### Phase 4: Cutover (1 week)
1. Switch reads to sharded tables
2. Monitor for issues
3. Decommission old tables

## Handling Cross-Shard Queries

### Approach 1: Denormalization
Store frequently joined data together:
```sql
-- Instead of joining users and calls across shards
-- Store user data in calls table
ALTER TABLE calls ADD COLUMN user_name TEXT;
ALTER TABLE calls ADD COLUMN user_email TEXT;
```

### Approach 2: Application-Level Join
```typescript
async function getCalls WithUsers(userIds: string[]) {
  // Group by shard
  const shardMap = new Map();
  for (const userId of userIds) {
    const shardId = getShardId(userId);
    if (!shardMap.has(shardId)) {
      shardMap.set(shardId, []);
    }
    shardMap.get(shardId).push(userId);
  }
  
  // Query each shard
  const results = await Promise.all(
    Array.from(shardMap.entries()).map(([shardId, ids]) =>
      queryShardqueries(shardId, ids)
    )
  );
  
  // Merge results
  return results.flat();
}
```

### Approach 3: Global Secondary Index
Maintain a global index for cross-shard queries:
```sql
CREATE TABLE global_user_index (
  user_id UUID PRIMARY KEY,
  shard_id INTEGER NOT NULL,
  email TEXT,
  created_at TIMESTAMP
);
```

## Rebalancing Strategy

### Triggers for Rebalancing
- Shard size difference > 30%
- Hot spots detected
- New shards added

### Rebalancing Process
1. Identify users to move
2. Dual-write to new shard
3. Copy historical data
4. Switch reads to new shard
5. Remove from old shard

## Monitoring

### Key Metrics
- Shard size distribution
- Query latency per shard
- Cross-shard query frequency
- Rebalancing progress

### Alerts
- Shard size imbalance > 30%
- Shard query time > 100ms (p95)
- Cross-shard queries > 10% of total

## Tools

### Vitess
- Transparent sharding proxy
- Automatic query routing
- Built-in resharding tools

### Citus
- PostgreSQL extension
- Distributed tables
- Parallel query execution

### Custom Solution
- Application-level routing
- Simpler but more code
- Full control

## Recommendations

1. **Start Simple**: Use Vitess for automatic sharding
2. **Monitor First**: Collect metrics before sharding
3. **Test Thoroughly**: Validate with production-like data
4. **Plan for Growth**: Design for 10x current scale

## References
- [Vitess Documentation](https://vitess.io/)
- [Citus Documentation](https://docs.citusdata.com/)
- [PostgreSQL Partitioning](https://www.postgresql.org/docs/current/ddl-partitioning.html)
