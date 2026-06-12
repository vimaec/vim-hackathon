---
name: model-comparison
description: Compare VIM models - clash detection, version diffs, design options. Use when analyzing differences between two or more VIM files or design states.
---

# Model Comparison Patterns

Technical reference for comparing VIM models, detecting clashes, and analyzing differences.

## VIM Flex Comparison Features

### Built-in Workflows

| Workflow | Purpose | Location |
|----------|---------|----------|
| ClashView | Visualize and manage clash detection results | Built-in (Scripts/views/) |
| DiffView | Compare two VIM files side-by-side | Built-in (Scripts/views/) |
| DesignCompare | Compare design options between two VIM models | UserPlugins |

### Dual Viewport Pattern

VIM Flex supports side-by-side comparison:
```
┌─────────────────┬─────────────────┐
│    Viewport 1   │    Viewport 2   │
│    (Model A)    │    (Model B)    │
│                 │                 │
│  [3D View]      │  [3D View]      │
│                 │                 │
└─────────────────┴─────────────────┘
```

Camera can be synced or independent between viewports.

## Clash Detection

### ⚠️ IMPORTANT: Clashes Are API-Based, NOT SQL Tables

Clash detection results come from `VimFlex::RunClashTest()` — they populate **in-memory arrays**, not database tables. There is NO `Clashes` table in the VIM database. Clashes can be run in VIM Flex (current) or via VIM Server (future).

### Clash API (Verified from as.predefined)

```angelscript
// Run clash test between two element sets
VimFlex::RunClashTest(elementSetA, elementSetB);

// Result data structure:
class VimFlex::VimClashResult
{
    float distance;          // Distance between elements (0 = hard clash)
    float volume;            // Volume of intersection
    uint elementIndexA;      // Element from set A
    uint elementIndexB;      // Element from set B
    AABB aabb;              // Bounding box of clash region
}
```

### Clash Severity Classification

| Type | Definition | Priority |
|------|------------|----------|
| Hard Clash | Physical intersection (distance = 0, volume > 0) | Critical |
| Soft Clash | Clearance zone violation (distance < threshold) | High |
| Duplicate | Same element clashing with itself | Low (filter out) |

### Working with Clash Results

Since results are in-memory arrays, you process them in AngelScript:
```angelscript
// Group clashes by category using element lookups
// Query element categories for grouping:
string query = "SELECT e.\"index\", c.name as category, l.name as level "
    + "FROM Elements e "
    + "JOIN Categories c ON e.categoryIndex = c.index "
    + "LEFT JOIN Levels l ON e.levelIndex = l.index "
    + "WHERE e.\"index\" IN (...)";
```

The built-in **ClashView** (Scripts/views/ClashView.as) demonstrates the correct pattern for visualizing and managing clash results.

## Version Comparison (Diff)

### ⚠️ IMPORTANT: Diff Results Are API-Based, NOT SQL Tables

Version comparison results come from `VimFlex::RunDiffTest()` — they populate **in-memory arrays**, not database tables. There is NO `DiffResults` table in the VIM database.

### Diff API (Verified from as.predefined)

```angelscript
// Run diff between two VIM models
VimFlex::RunDiffTest(vimA, vimB);

// Result data structures:
class VimFlex::VimDiffElement
{
    Element@ mElement;       // The element that was added/removed
}

class VimFlex::VimDiffElementModified
{
    VimDiffElement@ diffElementA;    // Element in version A
    VimDiffElement@ diffElementB;    // Element in version B
    VimDiffType hasModifiedGeometry; // VimDiffType_NotChanged / _Added / _Removed / _Modified
    array<VimModifiedParameter>@ modifiedParameters;  // What parameters changed
}

class VimFlex::VimModifiedParameter
{
    VimDiffType vimDiffType;   // NotChanged, Added, Removed, Modified
    string group;              // Parameter group
    Parameter@ parameterA;     // Value in version A
    Parameter@ parameterB;     // Value in version B
}

enum VimFlex::VimDiffType
{
    NotChanged,
    Added,
    Removed,
    Modified
}
```

### Diff Results Structure

The diff produces three arrays:
- **addedArray** — Elements in V2 not in V1
- **removedArray** — Elements in V1 not in V2
- **modifiedArray** — Elements in both but changed (with parameter-level detail)

### Matching Elements Across Versions

Elements are matched by:
1. **Revit UniqueId** (preferred - stable across versions)
2. **Element parameters** (name + type + location)

### What Can Change

- **Geometry** - Shape, size, location (`hasModifiedGeometry`)
- **Parameters** - Property values (`modifiedParameters` array)
- **Type** - Family type assignment changed
- **Level** - Level assignment changed
- **Phase** - Phase assignment changed

The built-in **DiffView** (Scripts/views/DiffView.as) demonstrates the correct pattern. Color coding: Green (added), Red (removed), Yellow (modified).

## Design Options

### ⚠️ New Schema — Use designOptionIndex

The Elements table has `designOptionIndex` (UINTEGER foreign key to DesignOption table), NOT a direct string column. The DesignOption table is new and may not exist in all models.

### DesignOptions Table (Plural)

```sql
-- Check if design options exist in the model
SELECT * FROM DesignOptions LIMIT 5
```

| Column | Type | Notes |
|--------|------|-------|
| index | UINTEGER | Primary key |
| isPrimary | BOOLEAN | Whether this is the primary option |
| elementIndex | UINTEGER | Link to Elements table |

### Querying Design Options

**List elements with design options:**
```sql
SELECT e."index", e.name, e.familyName, e.designOptionIndex
FROM Elements e
WHERE e.designOptionIndex IS NOT NULL
  AND e.domain = 'Physical-Visible'
```

**Compare quantities between options:**
```sql
SELECT
    e.designOptionIndex,
    c.name as category,
    COUNT(*) as count
FROM Elements e
JOIN Categories c ON e.categoryIndex = c.index
WHERE e.domain = 'Physical-Visible'
  AND e.designOptionIndex IS NOT NULL
GROUP BY e.designOptionIndex, c.name
ORDER BY e.designOptionIndex, count DESC
```

### DesignCompare Plugin (UserPlugins)

The existing DesignCompare plugin in `UserPlugins/DesignCompare/` provides:
- Side-by-side dual viewport comparison
- Quantity comparison (Count, Length, Area, Volume) between two VIM models
- CSV export of comparison results

### Revit Design Options Concept

```
Main Model (always visible)
    │
    ├── Option Set 1: "Facade Treatment"
    │   ├── Option 1A: "Glass Curtain Wall"
    │   └── Option 1B: "Precast Panels"
    │
    └── Option Set 2: "Lobby Layout"
        ├── Option 2A: "Open Atrium"
        └── Option 2B: "Reception Desk"
```

## Comparison Report Templates

### Clash Report

```
+================================================================+
|  CLASH DETECTION REPORT                                         |
|  Project: [Name]  |  Date: [Date]  |  Models: [A] vs [B]       |
|================================================================|
|                                                                 |
|  SUMMARY                                                        |
|  Total Clashes: [N]                                            |
|  - Hard Clashes (distance=0): [N]                              |
|  - Soft Clashes (distance<threshold): [N]                      |
|                                                                 |
|  BY DISCIPLINE PAIR                                            |
|  +----------------------------------------------------------+ |
|  | Discipline A    | Discipline B    | Count | % of Total   | |
|  |-----------------|-----------------|-------|--------------|  |
|  | Mechanical      | Structural      | 45    | 35%          | |
|  | Plumbing        | Structural      | 28    | 22%          | |
|  +----------------------------------------------------------+ |
|                                                                 |
|  TOP PROBLEM AREAS (by location)                               |
|  1. Level 3, Zone B - 34 clashes                               |
|  2. Level 2, Mechanical Room - 28 clashes                      |
|                                                                 |
+================================================================+
```

### Version Diff Report

```
+================================================================+
|  MODEL COMPARISON REPORT                                        |
|  From: [V1 Name/Date]  →  To: [V2 Name/Date]                   |
|================================================================|
|                                                                 |
|  CHANGE SUMMARY                                                |
|  +----------+ +----------+ +----------+ +----------+           |
|  | 156      | | 23       | | 163      | | 4,521    |           |
|  | Added    | | Removed  | | Modified | | Same     |           |
|  +----------+ +----------+ +----------+ +----------+           |
|                                                                 |
|  CHANGES BY CATEGORY                                           |
|  +----------------------------------------------------------+ |
|  | Category        | Added | Removed | Modified | Total     | |
|  |-----------------|-------|---------|----------|-----------|  |
|  | Walls           | 12    | 3       | 45       | 60        | |
|  | Doors           | 8     | 0       | 12       | 20        | |
|  | Mechanical Eq.  | 89    | 15      | 67       | 171       | |
|  +----------------------------------------------------------+ |
|                                                                 |
|  SIGNIFICANT CHANGES                                           |
|  - 15 mechanical units removed (design revision)               |
|  - 89 new duct runs added (MEP coordination)                   |
|  - 45 wall modifications (architectural updates)               |
|                                                                 |
+================================================================+
```

### Design Option Comparison

```
+================================================================+
|  DESIGN OPTION COMPARISON                                       |
|  Options: [A] vs [B]                                           |
|================================================================|
|                                                                 |
|  QUANTITIES                                                    |
|  +----------------------------------------------------------+ |
|  | Category        | Option A | Option B | Difference       | |
|  |-----------------|----------|----------|------------------|  |
|  | Walls           | 45       | 67       | +22 in B         | |
|  | Glazing (SF)    | 2,400    | 1,800    | -600 in B        | |
|  | Floor Area (SF) | 12,500   | 11,800   | -700 in B        | |
|  +----------------------------------------------------------+ |
|                                                                 |
|  COST ESTIMATE                                                 |
|  Option A: $2.4M                                               |
|  Option B: $2.8M                                               |
|  Delta: +$400K for Option B                                    |
|                                                                 |
|  TRADE-OFFS                                                    |
|  Option A: More glass, open feel, higher energy cost           |
|  Option B: More walls, better acoustics, lower energy cost     |
|                                                                 |
+================================================================+
```

## Best Practices

### Before Comparison
1. Verify both models are loaded/accessible
2. Confirm comparison scope (whole model vs subset)
3. Understand the purpose (coordination? documentation? decision?)

### During Comparison
1. Start with summary counts
2. Group by meaningful categories
3. Highlight outliers and critical items
4. Don't dump raw data

### After Comparison
1. Provide actionable insights
2. Offer drill-down options
3. Enable 3D visualization of findings
4. Support export for meetings/documentation

*Last updated: 15 March 2026*
