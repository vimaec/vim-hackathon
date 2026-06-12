---
name: powerbi-pbip-reader
description: Read, analyze, and document Power BI PBIP (Power BI Project) files. Parses report pages, visuals, semantic model tables, measures, relationships, and TMDL definitions. Use when asked to examine a PBIP directory, document a PowerBI report, understand a PowerBI data model, or recreate PowerBI reports in VIM Flex.
---

# PowerBI PBIP Reader and Analyzer

## When This Skill Applies
- User asks to read, document, or analyze a Power BI PBIP directory
- User asks to understand or inventory a PowerBI report's pages, visuals, or data model
- User asks to recreate PowerBI visuals in VIM Flex
- User mentions PBIP, TMDL, semantic model, or PowerBI report structure

## PBIP Directory Structure

```
ProjectName.pbip                          # Project file (JSON pointer)
ProjectName.Report/                       # Report definition
  definition/
    report.json                           # Theme, settings, background
    version.json                          # Schema version
    pages/
      pages.json                          # Page order + active page
      {pageId}/
        page.json                         # Page name, dimensions, background
        visuals/
          {visualId}/
            visual.json                   # Visual type, position, data, formatting
    bookmarks/
      {bookmarkId}.bookmark.json          # Saved view states
ProjectName.SemanticModel/                # Data model
  definition/
    database.tmdl                         # Compatibility level, culture
    model.tmdl                            # Query groups, table references
    expressions.tmdl                      # Named M expressions, parameters
    relationships.tmdl                    # All relationship definitions
    cultures/
      en-US.tmdl                          # Translations
    tables/
      TableName.tmdl                      # Table columns, measures, partitions
```

## How to Read a PBIP Report

### Step 1: Identify Pages
Read `pages/pages.json` for the ordered page list, then read each `{pageId}/page.json` for:
- `displayName` - human-readable page name
- `height`, `width` - canvas dimensions
- `displayOption` - "FitToPage", "FitToWidth", etc.

### Step 2: Read Visual Definitions
Each visual.json contains:
- `position` - x, y, z, height, width
- `visual.visualType` - the chart/control type
- `visual.query.queryState` - data field bindings (Category, Rows, Values, Y, etc.)
- `visual.objects` - visual-specific formatting
- `visual.drillFilterOtherVisuals` - cross-filtering behavior

### Key Visual Types
| PowerBI Type | `visualType` Value | Description |
|---|---|---|
| Card/KPI | `card` | Single big number |
| Pie/Donut Chart | `pieChart` | Category breakdown |
| Pivot Table | `pivotTable` | Hierarchical matrix with row/column groups |
| Table | `tableEx` | Flat data table |
| Slicer | `slicer` | Filter control (dropdown, list, slider) |
| Bar Chart | `barChart` / `clusteredBarChart` | Horizontal bars |
| Column Chart | `columnChart` / `clusteredColumnChart` | Vertical bars |
| Line Chart | `lineChart` | Trend lines |
| Text Box | `textbox` | Static text/title |

### Aggregation Functions
| Function ID | Meaning |
|---|---|
| 0 | Sum |
| 2 | Count (non-null) |
| 3 | Min |
| 4 | Max |
| 5 | CountNonNull (distinct) |
| 6 | Average |

### Step 3: Read Semantic Model
Read TMDL files in `SemanticModel/definition/tables/` for:
- Column definitions (name, dataType, formatString, summarizeBy)
- Measures (DAX expressions)
- Partitions (M/Power Query source expressions)

Read `relationships.tmdl` for table join definitions.

### Step 4: Map Data Fields
Each visual projection references:
- `Entity` - the table name
- `Property` - the column/measure name
- `Aggregation.Function` - how values are aggregated

## Documenting a Report Page

For each page, produce a structured summary:

```markdown
## Page: {displayName}
**Dimensions:** {width} x {height} | **Visuals:** {count}

### Layout Map
[ASCII art or description of visual placement]

### Visuals
| # | Type | Position | Data Fields | Title |
|---|------|----------|-------------|-------|
| 1 | card | (496,80) 320x128 | COUNT(Warnings.Warning) | "Warnings" |

### Filters and Interactions
- Slicer A filters by Model + Workset
- Pie charts drill-filter other visuals
```

## Recreating in VIM Flex

When translating PowerBI visuals to VIM Flex AngelScript:

| PowerBI Visual | VIM Flex Equivalent |
|---|---|
| Card (KPI) | `StatCard` from `widgets/cards/StatCard.as` |
| Pie/Donut Chart | `DonutChart` from `widgets/cards/DonutChart.as` |
| Pivot Table | `TreeTable` widget (hierarchical grouping with expand/collapse) |
| Table | `DataTable` from `widgets/cards/DataTable.as` |
| Slicer (dropdown) | `ImGui::BeginCombo()` / `ImGui::EndCombo()` |
| Slicer (checkbox) | `ImGui::Checkbox()` or FilterWidget |
| Bar Chart | `BarChart` from `widgets/cards/BarChart.as` |
| Stacked Bar | `StackedBarChart` from `widgets/cards/StackedBarChart.as` |
| Text Box | `SectionHeader` from `widgets/cards/SectionHeader.as` |
| 3D Viewer | Native VIM Flex viewport (element selection/highlighting) |

### SQL Translation
PowerBI DAX aggregations translate to DuckDB SQL:
- `Count of Column` -> `COUNT(column)`
- `Sum of Column` -> `SUM(column)`
- `Min of Column` -> `MIN(column)`
- PowerBI cross-filter -> DuckDB WHERE clauses driven by UI selection state

### Color Translation
PowerBI conditional formatting colors -> VIM Flex card constants:
- Red (#DE4038, #F50000) -> `CARD_ROSE`
- Orange (#FF8838) -> `CARD_AMBER`
- Yellow (#FFC533, #FFB700) -> `CARD_AMBER`
- Green -> `CARD_EMERALD`
- Blue -> `CARD_BLUE`
