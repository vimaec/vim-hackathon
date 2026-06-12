---
name: quantity-takeoff
description: Extract quantities from BIM models for estimation and takeoffs. Use when counting elements, measuring areas, or generating material quantities for contractors.
---

# Quantity Takeoff from BIM

Help contractors and estimators extract quantities from BIM models.

## Critical: Physical Elements Only

**ALWAYS filter for physical elements:**

```sql
WHERE e.domain = 'Physical-Visible'
```

This excludes definition elements (Family, FamilySymbol, *Type) that are NOT physical objects.

## The Hierarchy: Category > Family > Type

BIM elements are organized hierarchically:

```
Category (e.g., "Walls")
  +-- Family (e.g., "Basic Wall")
        +-- Type (e.g., "Generic - 8\"")
              +-- Instances (actual placed elements)
```

**Always present this hierarchy** - it's how estimators think.

## Estimation Methods

### 1. COUNT Method (Per Item)
For discrete items: doors, windows, fixtures, equipment

```sql
SELECT
    c.name as category,
    e.familyName as family,
    e.familyTypeName as type,
    COUNT(*) as quantity,
    'EA' as unit
FROM Elements e
JOIN Categories c ON e.categoryIndex = c.index
WHERE e.domain = 'Physical-Visible'
  AND c.name IN ('Doors', 'Windows', 'Plumbing Fixtures')
GROUP BY c.name, e.familyName, e.familyTypeName
```

**Cost calculation:** `Quantity (EA) x Unit Price = Total`

### 2. AREA Method (Per Square Foot/Meter)
For surface-based items: flooring, ceilings, roofing, painting

```sql
SELECT
    c.name as category,
    e.familyTypeName as type,
    SUM(CAST(SPLIT_PART(p.value, '|', 1) AS REAL)) as area_sqft,
    'SF' as unit
FROM Elements e
JOIN Categories c ON e.categoryIndex = c.index
JOIN Parameters p ON p.elementIndex = e."index"
JOIN ParameterDescriptors pd ON p.parameterDescriptorIndex = pd.index
WHERE e.domain = 'Physical-Visible'
  AND pd.name = 'Area'
GROUP BY c.name, e.familyTypeName
```

**Cost calculation:** `Area (SF) x Unit Price ($/SF) = Total`

### 3. LENGTH Method (Per Linear Foot/Meter)
For linear items: walls, pipes, ducts, mullions, railings

```sql
SELECT
    c.name as category,
    e.familyTypeName as type,
    SUM(CAST(SPLIT_PART(p.value, '|', 1) AS REAL)) as length_ft,
    'LF' as unit
FROM Elements e
JOIN Categories c ON e.categoryIndex = c.index
JOIN Parameters p ON p.elementIndex = e."index"
JOIN ParameterDescriptors pd ON p.parameterDescriptorIndex = pd.index
WHERE e.domain = 'Physical-Visible'
  AND pd.name = 'Length'
GROUP BY c.name, e.familyTypeName
```

**Cost calculation:** `Length (LF) x Unit Price ($/LF) = Total`

## Core Quantity Query

```sql
SELECT
    c.name as category,
    e.familyName as family,
    e.familyTypeName as type,
    COUNT(*) as count
FROM Elements e
JOIN Categories c ON e.categoryIndex = c.index
WHERE e.domain = 'Physical-Visible'
GROUP BY c.name, e.familyName, e.familyTypeName
ORDER BY c.name, count DESC
```

## Quantities by Level

Contractors need quantities per floor for scheduling:

```sql
SELECT
    l.name as level,
    c.name as category,
    COUNT(*) as count
FROM Elements e
JOIN Categories c ON e.categoryIndex = c.index
LEFT JOIN Levels l ON e.levelIndex = l.index
WHERE e.domain = 'Physical-Visible'
GROUP BY l.name, c.name
ORDER BY l.elevation, c.name
```

## Common Categories by Trade

**Architectural:**
- Walls, Floors, Ceilings, Roofs
- Doors, Windows
- Stairs, Railings
- Casework

**Structural:**
- Structural Framing, Structural Columns
- Structural Foundations

**MEP (Mechanical):**
- Mechanical Equipment, Ducts, Duct Fittings
- Air Terminals

**MEP (Electrical):**
- Electrical Equipment, Lighting Fixtures
- Cable Trays, Conduits

**MEP (Plumbing):**
- Plumbing Fixtures, Pipes, Pipe Fittings
- Sprinklers

## Area-Based Quantities

For flooring, painting, etc.:

```sql
SELECT l.name as level, SUM(r.area) as floor_area
FROM Rooms r
JOIN Elements e ON r.elementIndex = e.index
LEFT JOIN Levels l ON e.levelIndex = l.index
GROUP BY l.name
ORDER BY l.elevation
```

## Cost Loading from Excel

Load unit costs from Excel and apply to quantities:

```sql
SELECT
    bim.category,
    bim.family,
    bim.type,
    bim.quantity,
    costs.unit,
    costs.unit_price,
    CASE
        WHEN costs.estimation_method = 'COUNT' THEN bim.quantity * costs.unit_price
        WHEN costs.estimation_method = 'AREA' THEN bim.area * costs.unit_price
        WHEN costs.estimation_method = 'LENGTH' THEN bim.length * costs.unit_price
        ELSE bim.quantity * costs.unit_price
    END as total_cost
FROM (
    SELECT c.name as category, e.familyName as family, e.familyTypeName as type,
           COUNT(*) as quantity
    FROM Elements e
    JOIN Categories c ON e.categoryIndex = c.index
    WHERE e.domain = 'Physical-Visible'
    GROUP BY c.name, e.familyName, e.familyTypeName
) bim
LEFT JOIN read_xlsx('estimation_database.xlsx') costs
    ON bim.family = costs.family AND bim.type = costs.type
```

## Element-Level Export Format

For detailed cost tracking with traceability:

```
ElementIndex | RevitId | Category | Family | Type | EstMethod | Quantity | Unit | UnitPrice | TotalCost
1234         | abc-123 | Casework | Bench  | J.BEN-01 | COUNT | 1 | EA | $2,959.71 | $2,959.71
2345         | def-456 | Ceilings | Compound | I.CPB-01 | AREA | 188.5 | SF | $14.04 | $2,647.54
```

## What Contractors Need

1. **Counts** - How many doors, windows, fixtures
2. **By Type** - Different door types have different costs
3. **By Level** - Phasing and logistics
4. **By Trade** - For subcontractor bidding
5. **Exportable** - They'll put this in their own spreadsheets

## Trade Mapping

If asked to map to construction trades, **ask the user** for their trade breakdown. Common mappings:

- Structural: Structural Framing, Columns, Foundations
- Mechanical: Ducts, Mechanical Equipment, Air Terminals
- Electrical: Cable Trays, Lighting, Electrical Equipment
- Plumbing: Pipes, Plumbing Fixtures
- Fire Protection: Sprinklers, Fire Protection

But don't assume - firms organize trades differently.

## Output Format

Present quantities in clear tables:
- Category | Family | Type | Count | Unit
- Level | Category | Count
- Totals at bottom

Always offer to export to CSV/Excel for their estimating software.

*Last updated: 15 March 2026*
