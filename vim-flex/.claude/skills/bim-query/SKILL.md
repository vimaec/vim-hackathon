---
name: bim-query
description: Query BIM data from VIM files using SQL. Use when the user wants to explore model data, find elements, count quantities, or analyze the building model.
---

# BIM Data Querying for VIM Flex

You have access to VIM Flex's MCP tools to query BIM model data using SQL.

## Critical: Physical Element Filtering

**NEVER count definition elements as physical objects!** The VIM database contains both:
- **Instance elements** (actual physical objects in the model)
- **Definition elements** (Family, FamilySymbol, *Type - templates, not real objects)

### Element Domain (✅ NOW AVAILABLE - Use This!)

The `domain` column classifies elements by type. **Always use this for filtering:**

```sql
-- Count only physical-visible elements (walls, doors, etc.)
SELECT c.name as category, COUNT(*) as count
FROM Elements e
JOIN Categories c ON e.categoryIndex = c.index
WHERE e.domain = 'Physical-Visible'
GROUP BY c.name
ORDER BY count DESC
```

**Domain Values (confirmed Feb 2026):**
| Domain | Description | Use For |
|--------|-------------|---------|
| `Physical-Visible` | Real objects you can see | ✅ Main counting (walls, doors, furniture) |
| `Conceptual` | Analytical/conceptual elements | Analysis, not physical counts |
| `Rooms` | Room/space elements | Space analysis |
| `Link-Visible` | Elements from linked models | Coordination |
| `Group` | Group elements | Group analysis |
| `Topography` | Site/terrain elements | Site work |
| (empty) | Unclassified | Review case-by-case |

## Element Domain Usage Examples

**Count physical elements by category:**
```sql
SELECT c.name, COUNT(*) as count
FROM Elements e
JOIN Categories c ON e.categoryIndex = c.index
WHERE e.domain = 'Physical-Visible'
GROUP BY c.name
ORDER BY count DESC
```

**Include rooms in the count:**
```sql
WHERE e.domain IN ('Physical-Visible', 'Rooms')
```

**Get all domain types in a model:**
```sql
SELECT domain, COUNT(*) as cnt
FROM Elements
GROUP BY domain
ORDER BY cnt DESC
```

## VIM Database Schema

### Elements Table (Denormalized)

The Elements table has **denormalized** family/type names - no JOINs needed:

```sql
SELECT
    e."index",
    e.name,
    e.familyName,      -- VARCHAR, directly usable
    e.familyTypeName,  -- VARCHAR, directly usable
    e.categoryIndex,
    e.levelIndex,      -- UINTEGER -> Levels.index (join directly: LEFT JOIN Levels l ON e.levelIndex = l.index)
    e.domain           -- 'Physical-Visible', 'Rooms', etc.
FROM Elements e
```

**No more familyIndex/familyTypeIndex foreign keys** - use the direct VARCHAR columns.

### Core Tables

| Table | Key Columns | Notes |
|-------|-------------|-------|
| Elements | index, name, familyName, familyTypeName, categoryIndex, levelIndex, domain, kind, owner | Main element data |
| FamilyInstances | index, elementIndex, hostIndex, superComponentElementIndex | Parent-child relationships via hostIndex |
| Categories | index, name | Revit categories |
| Levels | index, name, elevation | Building levels |
| Rooms | elementIndex, name, number, area, perimeter | Room data |
| Parameters | elementIndex, parameterDescriptorIndex, value | Parameter values |
| ParameterDescriptors | index, name | Parameter definitions |
| Vims | index, name | Loaded VIM file paths |
| Materials | elementIndex, name, materialCategory | Material assignments |
| BimDocuments | index, name | Source documents |
| MaterialsInElement | area, volume, isPaint, materialIndex, elementIndex | Material quantities per element |
| Groups | position_xyz, groupType, elementIndex | Revit groups |
| AssemblyInstances | position_xyz, assemblyTypeName, elementIndex | Assembly instances |
| Phases | elementIndex | Project phases |
| DesignOptions | isPrimary, elementIndex | Design options |
| Systems | systemType, familyTypeIndex, elementIndex | MEP systems |
| ElementsInSystem | roles, systemIndex, elementIndex | Element-system membership |
| Views | title, viewType, elementIndex, cameraIndex | Revit views |
| Grids | startPoint_xyz, endPoint_xyz, isCurved, elementIndex | Grid lines |
| ElementHierarchy | element, descendant, distance | Element parent-child closure table |

### Parent-Child Element Relationships

Some elements contain child elements (e.g., curtain walls contain panels and mullions). Use `FamilyInstances.hostIndex` to find these relationships:

**Find children of a parent element (e.g., curtain wall):**
```sql
SELECT child."index", child.name, child.familyName, c.name as category
FROM FamilyInstances fi
JOIN Elements child ON fi.elementIndex = child."index"
LEFT JOIN Categories c ON child.categoryIndex = c."index"
WHERE fi.hostIndex = :parentElementIndex
```

**Common parent-child patterns:**
| Parent Category | Child Categories |
|-----------------|------------------|
| Walls (Curtain Wall family) | Curtain Panels, Curtain Wall Mullions, Curtain Wall Grids |
| Stairs | Stair Runs, Stair Landings, Railings |
| Railings | Balusters, Rails |
| Roofs | Roof Fascia, Roof Soffit |

**Key insight:** Parent elements may have no visible geometry while their children have the actual geometry. When selecting/displaying a parent, you may need to include its children.

**Check if element has children:**
```sql
SELECT COUNT(*) as childCount
FROM FamilyInstances fi
WHERE fi.hostIndex = :elementIndex
AND fi.hostIndex != 4294967295  -- NULL value in unsigned int
```

**Note:** `hostIndex = 4294967295` means NULL (unsigned int max value).

### Get Loaded VIM File Path

```sql
SELECT name FROM Vims
```
Returns the full path(s) of loaded VIM files - useful for generating export paths or PowerBI queries.

### String Columns are VARCHAR

As of February 2026, all strings are `VARCHAR` - **no CAST required!**

```sql
-- Works directly (no CAST needed)
SELECT * FROM Rooms WHERE name LIKE '%OFFICE%'
```

## Common Query Patterns

### Count physical elements by category
```sql
SELECT c.name, COUNT(*) as count
FROM Elements e
JOIN Categories c ON e.categoryIndex = c.index
WHERE e.domain = 'Physical-Visible'
GROUP BY c.name
ORDER BY count DESC
```

### Element hierarchy (Category > Family > Type)
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

### Elements by level
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

### Room data with levels
```sql
SELECT r.name, r.number, r.area, l.name as level
FROM Rooms r
JOIN Elements e ON r.elementIndex = e.index
LEFT JOIN Levels l ON e.levelIndex = l.index
ORDER BY l.elevation, r.number
```

### Search by name pattern
```sql
SELECT r.elementIndex, r.name, r.number, r.area
FROM Rooms r
WHERE r.name LIKE '%OFFICE%'
```

### Get parameter values
```sql
SELECT
    e.name as elementName,
    pd.name as parameterName,
    p.value
FROM Parameters p
JOIN ParameterDescriptors pd ON p.parameterDescriptorIndex = pd.index
JOIN Elements e ON p.elementIndex = e."index"
WHERE pd.name = 'Area'
LIMIT 100
```

## Parameter Value Format

Revit stores parameter values as `rawValue|displayValue`:
- `"30|30' - 0\""` - raw=30 feet, display="30' - 0""
- `"740.74|740.74 SF"` - raw=740.74 sq ft

**To extract numeric value:**
```sql
CAST(SPLIT_PART(p.value, '|', 1) AS REAL) as numericValue
```

## Approach

1. **Start by exploring** - Query to understand what's in the model
2. **Always filter for physical elements** - Use `WHERE e.domain = 'Physical-Visible'`
3. **Show the hierarchy** - Category > Family > Type is standard BIM breakdown
4. **Let users refine** - Present data, let them decide how to filter
5. **Use denormalized columns** - `e.familyName`, `e.familyTypeName` directly

## Don't Assume

- Room naming conventions vary by project/firm
- Category usage varies by discipline (Arch vs MEP vs Structural)
- Parameters may or may not be filled in
- Always query first, then respond based on actual data

*Last updated: 15 March 2026*
