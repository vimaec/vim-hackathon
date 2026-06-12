---
name: excel-compare
description: Compare BIM model data to Excel spreadsheets. Use for space program validation, cost loading, schedule comparison, or any model-to-spreadsheet reconciliation.
---

# Excel to BIM Comparison

Compare external Excel data (space programs, cost databases, schedules) against the BIM model.

## Reading Excel Files

```sql
-- Read default sheet
SELECT * FROM read_xlsx('path/to/file.xlsx')

-- Read specific sheet
SELECT * FROM read_xlsx('path/to/file.xlsx', sheet='Sheet2')

-- Query and aggregate
SELECT category, SUM(amount)
FROM read_xlsx('budget.xlsx')
GROUP BY category
```

## Space Program Validation

Compare client's space program (Excel) to modeled rooms:

### 1. Load the program
```sql
SELECT * FROM read_xlsx('space_program.xlsx')
```

### 2. Query model rooms
```sql
SELECT r.name, r.number, r.area, l.name as level
FROM Rooms r
JOIN Elements e ON r.elementIndex = e.index
LEFT JOIN Levels l ON e.levelIndex = l.index
```

### 3. Compare and find gaps

**Rooms in program but not in model:**
```sql
SELECT p.room_name, p.required_area
FROM read_xlsx('program.xlsx') p
LEFT JOIN Rooms r ON r.name = p.room_name
WHERE r.elementIndex IS NULL
```

**Rooms in model but not in program:**
```sql
SELECT r.name, r.area
FROM Rooms r
LEFT JOIN read_xlsx('program.xlsx') p ON p.room_name = r.name
WHERE p.room_name IS NULL
```

**Area variance:**
```sql
SELECT
    p.room_name,
    p.required_area as programmed,
    r.area as actual,
    r.area - p.required_area as variance
FROM read_xlsx('program.xlsx') p
JOIN Rooms r ON r.name LIKE '%' || p.room_name || '%'
```

## Cost Loading

Load unit costs from Excel and apply to BIM quantities:

```sql
SELECT
    c.name as category,
    e.familyName as family,
    e.familyTypeName as type,
    COUNT(*) as quantity,
    costs.unit_price,
    costs.estimation_method,
    costs.unit,
    CASE
        WHEN costs.estimation_method = 'COUNT' THEN COUNT(*) * costs.unit_price
        ELSE COUNT(*) * costs.unit_price  -- Add AREA/LENGTH when available
    END as extended_cost
FROM Elements e
JOIN Categories c ON e.categoryIndex = c.index
LEFT JOIN read_xlsx('estimation_database.xlsx') costs
    ON e.familyName = costs.family
    AND e.familyTypeName = costs.type
WHERE e.domain = 'Physical-Visible'
GROUP BY c.name, e.familyName, e.familyTypeName, costs.unit_price, costs.estimation_method, costs.unit
ORDER BY extended_cost DESC
```

## Schedule Comparison

Compare model elements to construction schedule:

```sql
SELECT
    schedule.activity,
    schedule.planned_qty,
    bim.actual_qty,
    bim.actual_qty - schedule.planned_qty as variance
FROM read_xlsx('schedule.xlsx') schedule
LEFT JOIN (
    SELECT c.name as category, COUNT(*) as actual_qty
    FROM Elements e
    JOIN Categories c ON e.categoryIndex = c.index
    WHERE e.domain = 'Physical-Visible'
    GROUP BY c.name
) bim ON bim.category = schedule.category
```

## Tips for Matching

Excel data and BIM data often don't match exactly:

1. **Use LIKE for fuzzy matching:**
   ```sql
   WHERE r.name LIKE '%' || excel.name || '%'
   ```

2. **Normalize case if needed:**
   ```sql
   WHERE UPPER(r.name) = UPPER(excel.name)
   ```

3. **Join on room numbers (often more reliable than names):**
   ```sql
   JOIN ... ON r.number = excel.room_number
   ```

4. **Show unmatched items** so user can manually reconcile

## Workflow

1. Ask user for their Excel file path
2. Preview the Excel structure (columns, sample rows)
3. Preview the BIM data structure
4. Propose a join strategy
5. Run comparison
6. Present: matches, model-only, excel-only, variances
7. Let user export results

## Don't Assume Column Names

Excel files vary. Always:
1. Read and show available columns first
2. Ask user which columns to use for matching
3. Then build the comparison query

## Common Excel Structures

### Space Program
| Room Name | Number | Dept | Required Area | Notes |
|-----------|--------|------|---------------|-------|

### Cost Database
| Category | Family | Type | Estimation_Method | Unit | Unit_Price |
|----------|--------|------|-------------------|------|------------|

### Schedule
| Activity | Category | Level | Planned_Qty | Start_Date |
|----------|----------|-------|-------------|------------|

*Last updated: 15 March 2026*
