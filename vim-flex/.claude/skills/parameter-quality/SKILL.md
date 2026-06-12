---
name: parameter-quality
description: Reference for parameter quality analysis, classification, and cleanup recommendations. Use when auditing Revit parameters, finding empty data, or analyzing parameter health.
---

# Parameter Quality Analysis

Technical reference for understanding, classifying, and auditing Revit parameters in VIM.

## VIM Parameter Schema

### Tables

```
ParameterDescriptors (definitions)
├── index (PK)
├── name (VARCHAR) - Parameter name
├── groupName (VARCHAR) - "Identity Data", "Dimensions", etc.
├── parameterType (VARCHAR) - "autodesk.spec:spec.string-2.0.0", etc.
├── isInstance (BOOLEAN) - true = instance, false = type
├── isShared (BOOLEAN) - true = shared parameter
├── isReadOnly (BOOLEAN) - true = cannot edit
├── flags (INTEGER) - internal flags
├── guid (VARCHAR) - Revit GUID (negative = built-in)
└── displayUnitIndex (UINTEGER) - unit display

Parameters (values)
├── index (PK)
├── value (VARCHAR) - The actual value (always string)
├── parameterDescriptorIndex → ParameterDescriptors.index
└── elementIndex → Elements.index
```

### Key Relationships

```
Elements ←─┐
           │
Parameters ├── parameterDescriptorIndex → ParameterDescriptors
           │
           └── elementIndex → Elements.index
                              └── categoryIndex → Categories.index
```

## Parameter Type Classification

### By GUID Pattern

```sql
CASE
    WHEN guid LIKE '-%' THEN 'Built-in'      -- Negative number
    WHEN LENGTH(guid) > 20 THEN 'Shared'     -- Full GUID
    ELSE 'Project'                            -- Short or empty
END as parameterSource
```

| Source | GUID Example | Can Delete? | Typical Count |
|--------|-------------|-------------|---------------|
| Built-in | `-1005182` | NO | 500-800 |
| Shared | `550e8400-e29b-41d4...` | YES | 50-500 |
| Project | `12345` or empty | YES | 50-300 |

### By Instance vs Type

| isInstance | Meaning | Example |
|-----------|---------|---------|
| `true` | Value per element | Mark, Comments, Room Number |
| `false` | Value per type | Type Name, Width, Material |

### By Group

Common `groupName` values:
- `Identity Data` - Mark, Comments, etc.
- `Dimensions` - Width, Height, Length
- `Constraints` - Level, Offset, Host
- `Graphics` - Visibility, Line patterns
- `Materials and Finishes` - Material assignments
- `Structural` - Structural properties
- `Electrical` - Circuit, Panel
- `Mechanical` - Flow, Pressure
- `IFC Parameters` - IFC export settings

## Suspicious Value Patterns

### Definitively Empty

```sql
WHERE p.value = ''
   OR p.value IS NULL
```

### Effectively Empty (Suspicious)

```sql
WHERE p.value IN (
    '',             -- Empty string
    '0',            -- Zero (context-dependent)
    '-1',           -- Unset reference
    'None',         -- Placeholder
    'Not Set',      -- Placeholder
    '<none>',       -- Revit default
    'Default',      -- Generic default
    'Select Family',-- Unselected family
    'N/A',          -- Not applicable
    '---',          -- Placeholder
    'TBD',          -- To be determined
    'TBC'           -- To be confirmed
)
```

### Context-Dependent Zeros

Zero is suspicious for:
- Areas (should have area > 0)
- Lengths (should have dimension > 0)
- Counts (may be valid)

Zero is valid for:
- Offsets (0 offset is common)
- Rotations (0° is valid)
- Booleans (0 = false)

## Core Audit Queries

### 1. Parameter Overview

```sql
SELECT
    CASE
        WHEN pd.guid LIKE '-%' THEN 'Built-in'
        WHEN pd.isShared = true THEN 'Shared'
        ELSE 'Project'
    END as paramSource,
    COUNT(DISTINCT pd.index) as uniqueParams,
    COUNT(*) as totalValues
FROM Parameters p
JOIN ParameterDescriptors pd ON p.parameterDescriptorIndex = pd.index
GROUP BY paramSource
```

### 2. Empty Parameter Analysis

```sql
SELECT
    pd.name,
    pd.groupName,
    CASE WHEN pd.guid LIKE '-%' THEN 'Built-in' ELSE 'Deletable' END as source,
    COUNT(*) as total,
    SUM(CASE WHEN p.value = '' OR p.value IS NULL THEN 1 ELSE 0 END) as empty,
    ROUND(100.0 * SUM(CASE WHEN p.value = '' OR p.value IS NULL THEN 1 ELSE 0 END) / COUNT(*), 1) as emptyPct
FROM Parameters p
JOIN ParameterDescriptors pd ON p.parameterDescriptorIndex = pd.index
GROUP BY pd.name, pd.groupName, source
HAVING emptyPct > 50
ORDER BY total DESC
LIMIT 30
```

### 3. Category Spread Analysis (Bloat Detection)

```sql
SELECT
    pd.name,
    pd.isShared,
    COUNT(DISTINCT c.name) as categoryCount,
    GROUP_CONCAT(DISTINCT c.name) as categories,
    COUNT(*) as totalInstances
FROM Parameters p
JOIN ParameterDescriptors pd ON p.parameterDescriptorIndex = pd.index
JOIN Elements e ON p.elementIndex = e."index"
JOIN Categories c ON e.categoryIndex = c.index
WHERE pd.guid NOT LIKE '-%'  -- Exclude built-in
GROUP BY pd.name, pd.isShared
HAVING categoryCount > 5
ORDER BY categoryCount DESC
```

### 4. Parameter Fill Rates by Category

```sql
SELECT
    c.name as category,
    pd.name as parameter,
    COUNT(*) as elements,
    SUM(CASE WHEN p.value != '' AND p.value IS NOT NULL THEN 1 ELSE 0 END) as filled,
    ROUND(100.0 * SUM(CASE WHEN p.value != '' AND p.value IS NOT NULL THEN 1 ELSE 0 END) / COUNT(*), 1) as fillPct
FROM Parameters p
JOIN ParameterDescriptors pd ON p.parameterDescriptorIndex = pd.index
JOIN Elements e ON p.elementIndex = e."index"
JOIN Categories c ON e.categoryIndex = c.index
WHERE c.name IN ('Walls', 'Doors', 'Windows', 'Rooms')
GROUP BY c.name, pd.name
HAVING fillPct < 50 AND elements > 10
ORDER BY c.name, fillPct
```

### 5. Shared Parameter Inventory

```sql
SELECT
    pd.name,
    pd.guid,
    pd.groupName,
    pd.isInstance,
    COUNT(*) as valueCount
FROM ParameterDescriptors pd
JOIN Parameters p ON p.parameterDescriptorIndex = pd.index
WHERE pd.isShared = true
GROUP BY pd.name, pd.guid, pd.groupName, pd.isInstance
ORDER BY valueCount DESC
```

### 6. Value Distribution for Specific Parameter

```sql
SELECT
    p.value,
    COUNT(*) as occurrences
FROM Parameters p
JOIN ParameterDescriptors pd ON p.parameterDescriptorIndex = pd.index
WHERE pd.name = '[PARAMETER_NAME]'
GROUP BY p.value
ORDER BY occurrences DESC
LIMIT 20
```

## Built-in Parameters Reference

### Always Empty (Safe to Ignore)

| Parameter | Why Empty |
|-----------|-----------|
| Edited by | Only during active worksharing edit |
| Designed by | Manual entry, rarely used |
| Approved by | Manual entry, rarely used |
| IFC Predefined Type | Only for IFC export |
| Export to IFC As | Only for IFC export |
| Image | Element thumbnail, rarely used |
| Structural | Boolean, often default |

### Should Be Filled (Flag if Empty)

| Parameter | Impact if Empty |
|-----------|-----------------|
| Mark | Can't schedule/tag elements |
| Assembly Code | Cost estimation fails |
| Keynote | Keynoting broken |
| Phase Created | Phasing incorrect |
| Type Mark | Type scheduling fails |
| Room Number | Room schedules incomplete |
| Room Name | Room schedules incomplete |

### Geometry Parameters (Zero May Be Valid)

| Parameter | Zero Valid? |
|-----------|-------------|
| Offset from Host | Yes (flush with host) |
| Base Offset | Yes (at level) |
| Top Offset | Yes (at level) |
| Sill Height | Yes (floor-level windows) |
| Head Height | Rarely (check context) |
| Area | NO - indicates problem |
| Volume | NO - indicates problem |
| Length | NO - indicates problem |

## Health Score Calculation

### Per-Parameter Score

```
Score = fillRate * categoryAppropriatenessWeight

Where:
- fillRate = filledValues / totalValues (0-100%)
- categoryAppropriatenessWeight = 1.0 if expected categories, 0.5 if bloated
```

### Overall Model Score

```
Score = (healthyParams * 2 + sparseParams * 1 + emptyParams * 0) / totalDeletableParams

Tiers:
- 80-100: Excellent
- 60-79: Good
- 40-59: Fair
- 20-39: Poor
- 0-19: Critical
```

## Recommendations Matrix

| Condition | Source | Recommendation |
|-----------|--------|----------------|
| 100% empty | Built-in | Ignore (cannot delete) |
| 100% empty | Shared/Project | Remove parameter |
| 100% empty, many categories | Shared/Project | HIGH PRIORITY remove |
| 50-99% empty | Any | Review and decide |
| <50% empty | Any | Consider filling |
| Wrong categories | Shared/Project | Narrow scope |

## Client Template Comparison

### Template CSV Format

```csv
ParameterName,Required,Categories,Description
Assembly Code,Yes,"Walls,Floors,Ceilings",Required for cost estimation
Mark,Yes,All Physical,Required for scheduling
Room Number,Yes,Rooms,Required for space analysis
BG_DAT_FireRating,Yes,"Walls,Doors",Fire rating per client spec
```

### Comparison Query Pattern

```sql
-- Check required parameter fill rates
SELECT
    '[PARAM_NAME]' as requiredParam,
    c.name as category,
    COUNT(*) as elements,
    SUM(CASE WHEN p.value != '' AND p.value IS NOT NULL THEN 1 ELSE 0 END) as filled
FROM Elements e
JOIN Categories c ON e.categoryIndex = c.index
LEFT JOIN Parameters p ON p.elementIndex = e."index"
LEFT JOIN ParameterDescriptors pd ON p.parameterDescriptorIndex = pd.index
    AND pd.name = '[PARAM_NAME]'
WHERE c.name IN ('[CATEGORY_LIST]')
  AND e.domain = 'Physical-Visible'
GROUP BY c.name
```

## Pagination for Large Results

Always count before fetching:

```sql
-- Count first
SELECT COUNT(DISTINCT pd.name) FROM ParameterDescriptors pd

-- Then paginate
SELECT ... LIMIT 50 OFFSET 0
SELECT ... LIMIT 50 OFFSET 50
```

## Export Patterns

### Full Parameter Inventory to CSV

Query in batches and combine:
1. Parameter definitions (ParameterDescriptors)
2. Fill rates by parameter
3. Category distribution
4. Problem parameters list

### Element-Level Parameter Export

```sql
SELECT
    e.name as elementName,
    c.name as category,
    pd.name as parameter,
    p.value
FROM Elements e
JOIN Categories c ON e.categoryIndex = c.index
JOIN Parameters p ON p.elementIndex = e."index"
JOIN ParameterDescriptors pd ON p.parameterDescriptorIndex = pd.index
WHERE c.name = '[CATEGORY]'
  AND pd.name IN ('[PARAM1]', '[PARAM2]')
ORDER BY e.name, pd.name
```

## Common Issues and Solutions

### Issue: Parameter Applied to Everything

**Symptom:** Shared parameter with 50+ categories, mostly empty

**Solution:**
1. Identify intended categories
2. In Revit: Edit shared parameter → Remove from unwanted categories
3. Purge unused parameters

### Issue: Duplicate Parameters

**Symptom:** "Mark" and "Mark_Custom" both exist

**Solution:**
1. Identify which is actually used
2. Migrate data if needed
3. Remove duplicate

### Issue: Wrong Units Stored

**Symptom:** Length shows "3048" instead of "10 ft"

**Explanation:** Revit stores in feet internally. Display value uses displayUnitIndex.

**Solution:** Convert in queries if needed:
```sql
-- Convert feet to meters
CAST(p.value as REAL) * 0.3048 as valueMeters
```

*Last updated: 15 March 2026*
