---
name: powerbi-report
description: Design PowerBI reports from BIM data with ASCII mockups. Use when proposing report layouts, connecting VIM data to PowerBI, or creating dashboards for BIM managers.
---

# PowerBI Report Design from BIM Data

Help users design and build PowerBI reports from VIM Flex BIM data.

## Report Design Process

### Step 1: Understand the Audience

Ask these questions:
- "Who will use this report?" (Executives? Project managers? Field crews?)
- "What decisions will they make with this data?"
- "How often will they view it?" (Daily? Weekly? One-time?)

### Step 2: Define the Data

Before designing visuals, understand the data:
- What tables are needed? (Elements, Rooms, Levels, etc.)
- What calculations? (Counts, sums, averages?)
- What filters? (Level, Category, Phase, Date?)

### Step 3: ASCII Mockup First

ALWAYS sketch the report in ASCII before building:

```
+================================================================+
|  PROJECT NAME - BIM MODEL HEALTH DASHBOARD                     |
|================================================================|
|                                                                 |
|  [KPI Cards Row]                                                |
|  +----------+ +----------+ +----------+ +----------+            |
|  | 24,567   | | 98.2%    | | 47       | | 3        |            |
|  | Elements | | Complete | | Warnings | | Critical |            |
|  +----------+ +----------+ +----------+ +----------+            |
|                                                                 |
|  [Main Visuals]                                                 |
|  +---------------------------+ +---------------------------+    |
|  |  ELEMENTS BY CATEGORY     | |  COMPLETION BY LEVEL      |    |
|  |  [Bar Chart]              | |  [Stacked Bar]            |    |
|  |  ████████████ Walls 2,450 | |  L01 ████████░░ 85%       |    |
|  |  ████████ Doors 1,089     | |  L02 ██████████ 100%      |    |
|  |  ██████ Windows 817       | |  L03 ████░░░░░░ 45%       |    |
|  |  ████ Equipment 543       | |  L04 ██░░░░░░░░ 22%       |    |
|  +---------------------------+ +---------------------------+    |
|                                                                 |
|  [Detail Table]                                                 |
|  +----------------------------------------------------------+  |
|  | Category | Family | Type | Count | % Complete | Issues   |  |
|  |----------|--------|------|-------|------------|----------|  |
|  | Walls    | Basic  | 8"   | 450   | 95%        | 23       |  |
|  | Doors    | Single | 36"  | 289   | 100%       | 0        |  |
|  +----------------------------------------------------------+  |
|                                                                 |
|  [Filters]                                                      |
|  Level: [All v]  Category: [All v]  Phase: [All v]             |
+================================================================+
```

### Step 4: Build Iteratively

1. Import data (CSV from VIM or direct connection)
2. Build one visual at a time
3. Test with real data
4. Add filters
5. Refine layout

## Common BIM Report Templates

### Template 1: Element Quantities Dashboard

**Purpose:** Show what's in the model for estimation/scheduling

```
+================================================================+
|  ELEMENT QUANTITIES - [Project Name]                           |
|================================================================|
|                                                                 |
|  +----------+ +----------+ +----------+                         |
|  | 24,567   | | 12       | | 847      |                         |
|  | Elements | | Levels   | | Types    |                         |
|  +----------+ +----------+ +----------+                         |
|                                                                 |
|  +---------------------------+ +---------------------------+    |
|  |  BY CATEGORY (Pie)        | |  BY LEVEL (Bar)           |    |
|  |                           | |                           |    |
|  |     ████ Walls 35%        | |  L06 ████████ 4,521       |    |
|  |    █████ MEP 28%          | |  L05 ███████ 4,102        |    |
|  |   ██████ Struct 22%       | |  L04 ██████ 3,891         |    |
|  |  ███████ Other 15%        | |  ...                      |    |
|  +---------------------------+ +---------------------------+    |
|                                                                 |
|  [Drill-down Table: Category > Family > Type > Count]          |
|  +----------------------------------------------------------+  |
|  | + Walls (2,450)                                          |  |
|  |   + Basic Wall (1,892)                                   |  |
|  |     - Generic 8"    (892)                                |  |
|  |     - Exterior 12"  (500)                                |  |
|  |     - Interior 4"   (500)                                |  |
|  +----------------------------------------------------------+  |
+================================================================+
```

**Data needed:**
```sql
SELECT c.name as Category, e.familyName as Family,
       e.familyTypeName as Type, l.name as Level, COUNT(*) as Count
FROM Elements e
JOIN Categories c ON e.categoryIndex = c.index
LEFT JOIN Levels l ON e.levelIndex = l.index
WHERE e.domain = 'Physical-Visible'
GROUP BY c.name, e.familyName, e.familyTypeName, l.name
```

### Template 2: Parameter Validation Report

**Purpose:** Check BIM data quality against BEP requirements

```
+================================================================+
|  PARAMETER VALIDATION - [Project Name]                         |
|================================================================|
|                                                                 |
|  +----------+ +----------+ +----------+ +----------+            |
|  | 98.2%    | | 1.8%     | | 423      | | 12       |            |
|  | Complete | | Missing  | | Elements | | Params   |            |
|  |          | |          | | w/Issues | | Checked  |            |
|  +----------+ +----------+ +----------+ +----------+            |
|                                                                 |
|  +---------------------------+                                  |
|  |  COMPLETION BY PARAMETER  |                                  |
|  |  [Horizontal Bar Chart]   |                                  |
|  |                           |                                  |
|  |  Assembly Code  ████████████████████░░░░░ 92%                |
|  |  Mark           ████████████████████████ 100%                |
|  |  Phase Created  ████████████████████░░░░ 95%                 |
|  |  Comments       ██████████░░░░░░░░░░░░░░ 45%                 |
|  +---------------------------+                                  |
|                                                                 |
|  [Elements Missing Required Parameters]                         |
|  +----------------------------------------------------------+  |
|  | Element ID | Category | Type | Missing Parameter         |  |
|  |------------|----------|------|---------------------------|  |
|  | 1234567    | Walls    | 8"   | Assembly Code             |  |
|  | 1234568    | Doors    | 36"  | Comments                  |  |
|  +----------------------------------------------------------+  |
+================================================================+
```

### Template 3: Schedule Lookahead (3-Day)

**Purpose:** Show field crews what's being installed this week

```
+================================================================+
|  3-DAY LOOKAHEAD - [Date Range]                                |
|================================================================|
|                                                                 |
|  [Timeline Header]                                              |
|  | Today (Feb 4) | Tomorrow | Feb 6 |                          |
|                                                                 |
|  +---------------------------+                                  |
|  |  MECHANICAL (45 items)    |                                  |
|  |  ██████████████████████░░░|████░░░░░░░░░░░░░░|░░░░░░░░░░░░░░|
|  |  L03: 23 units            | L04: 12          | L05: 10      |
|  +---------------------------+                                  |
|                                                                 |
|  +---------------------------+                                  |
|  |  ELECTRICAL (28 items)    |                                  |
|  |  ░░░░░░░░░░░░░░░░░░░░░░░░░|████████████████░░|██████████████|
|  |  -                        | L03: 18          | L04: 10      |
|  +---------------------------+                                  |
|                                                                 |
|  [Detail by Day/Discipline]                                     |
|  +----------------------------------------------------------+  |
|  | Date    | Discipline | Level | Activity       | Count    |  |
|  |---------|------------|-------|----------------|----------|  |
|  | Feb 4   | Mechanical | L03   | Install AHU    | 23       |  |
|  | Feb 5   | Electrical | L03   | Run conduit    | 18       |  |
|  +----------------------------------------------------------+  |
+================================================================+
```

### Template 4: Cost Estimation Summary

**Purpose:** Show estimated costs by category and level

```
+================================================================+
|  COST ESTIMATION - [Project Name]                              |
|================================================================|
|                                                                 |
|  +----------+ +----------+ +----------+                         |
|  | $4.6M    | | $2.1M    | | 13,702   |                         |
|  | Total    | | Remaining| | Elements |                         |
|  +----------+ +----------+ +----------+                         |
|                                                                 |
|  +---------------------------+ +---------------------------+    |
|  |  COST BY CATEGORY         | |  COST BY LEVEL            |    |
|  |  [Treemap]                | |  [Stacked Bar]            |    |
|  |  +--------+--------+      | |                           |    |
|  |  | MEP    | Struct |      | |  L01 ████ $890K           |    |
|  |  | $1.8M  | $1.2M  |      | |  L02 ████████ $1.2M       |    |
|  |  +--------+--------+      | |  L03 ██████████████ $1.8M |    |
|  |  | Arch   | Other  |      | |  ...                      |    |
|  |  | $1.1M  | $0.5M  |      | |                           |    |
|  +---------------------------+ +---------------------------+    |
|                                                                 |
|  [Cost Breakdown Table]                                         |
|  +----------------------------------------------------------+  |
|  | Category | Type      | Qty  | Method | Unit $  | Total $ |  |
|  |----------|-----------|------|--------|---------|---------|  |
|  | Casework | J.BEN-01  | 45   | COUNT  | $2,959  | $133K   |  |
|  | Ceilings | I.CPB-01  | 12K  | AREA   | $14/SF  | $168K   |  |
|  | Mullions | E.WMF-02  | 2.4K | LENGTH | $96/LF  | $231K   |  |
|  +----------------------------------------------------------+  |
+================================================================+
```

## PowerBI Best Practices

### Data Model Tips

1. **Star Schema** - Fact table (Elements) with dimension tables (Categories, Levels, Types)
2. **Calculated Columns** - Add domain classification, cost calculations
3. **Measures** - Use DAX for dynamic aggregations

### Visual Selection

| Data Type | Best Visual |
|-----------|-------------|
| Parts of whole | Pie, Donut, Treemap |
| Comparison | Bar chart (horizontal for labels) |
| Trend over time | Line chart |
| Ranking | Bar chart sorted |
| Geographic | Map (if coordinates available) |
| KPIs | Card visuals |
| Detail drill-down | Matrix or Table |

### Filter Strategy

- **Page-level filters** for context (Project, Phase)
- **Visual-level filters** for focus (Top 10, exclude nulls)
- **Slicers** for user interaction (Level, Category, Date)

## Connecting VIM Data

### Get VIM File Path for PowerBI Queries
```sql
SELECT name FROM Vims
```
Returns the full path of loaded VIM files - use this to generate dynamic file references.

### Option 1: CSV Export
1. Run SQL query in VIM Flex
2. Export to CSV
3. Import CSV into PowerBI
4. Refresh manually when model changes

### Option 2: Parquet Files
1. VIM exports to Parquet format
2. PowerBI imports Parquet directly
3. Better for large datasets

### Option 3: PowerBI MCP (if available)
Use the PowerBI MCP tools to:
- Create measures
- Build relationships
- Deploy to Fabric

## Report Checklist

Before sharing a report:
- [ ] Title clearly states purpose
- [ ] KPIs at top answer "what's the summary?"
- [ ] Visuals answer specific questions
- [ ] Drill-down available for details
- [ ] Filters are intuitive
- [ ] Data source and date shown
- [ ] Colors are consistent
- [ ] Mobile-friendly if needed

---

## PowerBI M Code Generation from AngelScript

VIM Flex plugins can generate PowerBI M code for one-click import of exported CSVs.

### Path Escaping for M Code

Windows paths need double backslashes in M code strings:

```angelscript
string EscapePathForMCode(const string&in path)
{
    return path.Replace("\\", "\\\\");
}

// Example:
// Input:  "C:\Users\Data\export.csv"
// Output: "C:\\Users\\Data\\export.csv"
```

### Get VIM File Directory

Export CSVs to the same folder as the VIM model:

```angelscript
string GetVimFileDirectory()
{
    auto@ vimData = _app.GetAppScene().GetVimData();
    if (vimData is null) return "";
    auto@ paths = vimData.vimFileNameArray;
    if (paths.length() == 0) return "";
    string fullPath = paths[0];
    int lastSlash = fullPath.findLast("\\");
    if (lastSlash < 0) lastSlash = fullPath.findLast("/");
    if (lastSlash >= 0) return fullPath.substr(0, lastSlash);
    return "";
}

string GetModelName()
{
    auto@ vimData = _app.GetAppScene().GetVimData();
    if (vimData is null) return "Model";
    auto@ paths = vimData.vimFileNameArray;
    if (paths.length() == 0) return "Model";
    string fullPath = paths[0];
    int lastSlash = fullPath.findLast("\\");
    if (lastSlash < 0) lastSlash = fullPath.findLast("/");
    if (lastSlash >= 0) return fullPath.substr(lastSlash + 1);
    return fullPath;
}
```

### M Code Template Generator

```angelscript
string GeneratePowerBIQuery(const string&in csvPath, const string&in queryName)
{
    string escapedPath = EscapePathForMCode(csvPath);
    string modelName = GetModelName();

    return "// " + queryName + " - Generated by VIM Flex\n" +
           "// Model: " + modelName + "\n" +
           "// Generated: " + GetCurrentTimestamp() + "\n" +
           "let\n" +
           "    Source = Csv.Document(\n" +
           "        File.Contents(\"" + escapedPath + "\"),\n" +
           "        [Delimiter=\",\", Encoding=1252, QuoteStyle=QuoteStyle.None]\n" +
           "    ),\n" +
           "    #\"Promoted Headers\" = Table.PromoteHeaders(Source, [PromoteAllScalars=true])\n" +
           "in\n" +
           "    #\"Promoted Headers\"";
}
```

### Copy to Clipboard Button

```angelscript
// State tracking
private string _lastExportPath = "";
private bool _showPowerBIPopup = false;
private string _powerBIQuery = "";

// After successful CSV export:
_lastExportPath = exportPath;

// "Copy PowerBI Query" button:
bool hasExport = !_lastExportPath.isEmpty();
ImGui::BeginDisabled(!hasExport);
if (ImGui::Button("Copy PowerBI Query"))
{
    _powerBIQuery = GeneratePowerBIQuery(_lastExportPath, "My Data");
    _showPowerBIPopup = true;
}
ImGui::EndDisabled();
if (!hasExport && ImGui::IsItemHovered())
{
    ImGui::SetTooltip("Export data first");
}

// Popup with copy functionality:
if (_showPowerBIPopup)
{
    ImGui::OpenPopup("PowerBI Query");
    bool openedOut = true;
    if (ImGui::BeginPopupModal("PowerBI Query", _showPowerBIPopup, openedOut, ImGuiWindowFlags_None))
    {
        ImGui::Text("Copy this query into PowerBI Advanced Editor:");
        string queryOut = _powerBIQuery;  // read-only, output discarded
        ImGui::InputTextMultiline("##query", _powerBIQuery, queryOut, float2(600, 300),
            ImGuiInputTextFlags::ImGuiInputTextFlags_ReadOnly);

        if (ImGui::Button("Copy to Clipboard"))
        {
            ImGui::SetClipboardText(_powerBIQuery);
        }
        ImGui::SameLine();
        if (ImGui::Button("Close"))
        {
            _showPowerBIPopup = false;
            ImGui::CloseCurrentPopup();
        }
        ImGui::EndPopup();
    }
}
```

### Workflow for Users

1. Export data from VIM Flex plugin (CSV saved next to model)
2. Click "Copy PowerBI Query" button
3. In PowerBI: Get Data → Blank Query → Advanced Editor
4. Paste the M code
5. Click Done - data imports automatically

*Last updated: 15 March 2026*
