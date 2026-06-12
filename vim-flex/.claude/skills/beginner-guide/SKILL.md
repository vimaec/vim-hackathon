---
name: beginner-guide
description: Guide new BIM managers and analysts through VIM Flex and PowerBI workflows. Use when users are learning to create reports, validate models, or demonstrate BIM value.
---

# BIM Analysis Beginner's Guide

Help new BIM managers and analysts get started with VIM Flex MCP for data extraction, validation, and reporting.

## Who This Is For

- **BIM Managers** starting to use data-driven workflows
- **New hires** learning to demonstrate BIM value
- **PowerBI beginners** connecting to BIM data
- **Anyone** who needs to extract accurate measures from models

## First Steps: Discovery Questions

When a user is new to analyzing a model, ask these questions to understand their needs:

### 1. What's Your Goal?

| Goal | Next Questions |
|------|----------------|
| "Count elements" | Which categories? Physical only? By level? |
| "Compare to schedule" | Do you have an Excel file? What columns? |
| "Create report" | For who? What format? What data? |
| "Validate parameters" | Which parameters? Against what standard? |
| "Estimate costs" | Do you have a pricing database? COUNT/AREA/LENGTH? |

### 2. Understand the Model First

**ALWAYS start by exploring the model:**

```sql
-- What categories are in this model?
SELECT c.name, COUNT(*) as count
FROM Elements e
JOIN Categories c ON e.categoryIndex = c.index
WHERE e.domain = 'Physical-Visible'
GROUP BY c.name
ORDER BY count DESC
LIMIT 20
```

This shows the user what they're working with before diving into specifics.

### 3. Ask About Their Data Sources

- "Do you have an Excel file with a space program, schedule, or cost database?"
- "What are the column names in your spreadsheet?"
- "Is there a BIM Execution Plan (BEP) that defines required parameters?"

## Common Use Cases

### Use Case 1: IDS / Mandatory Parameter Validation

**Goal:** Check if required parameters are filled in according to BIM Execution Plan

**Discovery questions:**
- "What parameters are required by your BEP?"
- "Should blank values be flagged, or specific invalid values?"
- "Do you want results by Level, Category, or both?"

**Example workflow:**
```sql
-- Find elements missing a required parameter
SELECT
    e."index" as elementIndex,
    c.name as category,
    e.familyTypeName as type,
    l.name as level
FROM Elements e
JOIN Categories c ON e.categoryIndex = c.index
LEFT JOIN Levels l ON e.levelIndex = l.index
LEFT JOIN Parameters p ON p.elementIndex = e."index"
LEFT JOIN ParameterDescriptors pd ON p.parameterDescriptorIndex = pd.index
    AND pd.name = 'Assembly Code'  -- The required parameter
WHERE e.domain = 'Physical-Visible'
  AND (p.value IS NULL OR p.value = '' OR p.value = '|')
```

### Use Case 2: Clash Detection Reports

**Goal:** Present clash detection results in a usable format

**Discovery questions:**
- "Where are your clash results? (Navisworks export? VIM internal?)"
- "How should clashes be grouped? By discipline? By Level?"
- "Do you need element details or just counts?"

### Use Case 3: 3-Day Lookahead Visuals

**Goal:** Show what's being built in the next 3 days, per discipline

**Discovery questions:**
- "Do you have a schedule linked to elements? (Synchro, P6, Excel?)"
- "What date field should I use for filtering?"
- "Which disciplines/trades do you want to separate?"

**Workflow:**
1. Load schedule Excel with dates
2. Filter to next 3 days
3. Match to BIM elements by ID/Mark
4. Group by discipline
5. Select/isolate in 3D

### Use Case 4: Estimation / Cost Loading

**Goal:** Apply unit costs to BIM quantities

**Discovery questions:**
- "Do you have a pricing database (Excel/CSV)?"
- "What estimation method per item? COUNT, AREA, or LENGTH?"
- "Should totals be by Category, Level, or Phase?"

**Key concept - Estimation Methods:**
| Method | Use For | Calculation |
|--------|---------|-------------|
| COUNT | Doors, fixtures | Quantity x Unit Price |
| AREA | Flooring, ceilings | Area (SF) x Price per SF |
| LENGTH | Walls, pipes | Length (LF) x Price per LF |

### Use Case 5: BIM Audit / Model Health Check

**Goal:** Evaluate model quality against BEP requirements

**Discovery questions:**
- "Do you have a BEP or checklist to audit against?"
- "What's the priority: parameter completeness? naming conventions? geometry?"
- "Should I flag issues or just report statistics?"

**Common audit checks:**
- Elements without levels assigned
- Rooms without numbers
- Missing required parameters
- Duplicate element names
- Family naming convention compliance

## PowerBI Integration Tips

### Connecting VIM Data to PowerBI

**Option 1: CSV Export**
1. Run query in VIM Flex
2. Export results to CSV
3. Import CSV into PowerBI

**Option 2: Direct Query (if available)**
- Use PowerBI MCP to connect to semantic model
- Run DAX queries against imported VIM data

### ASCII Report Proposals

Before building a PowerBI report, sketch it in ASCII:

```
+--------------------------------------------------+
|  ELEMENT COUNT BY CATEGORY                        |
|                                                   |
|  [Pie Chart]      | Category        | Count      |
|                   |-----------------|------------|
|   Walls 45%       | Walls           | 2,450      |
|   Doors 20%       | Doors           | 1,089      |
|   Windows 15%     | Windows         |   817      |
|   Other 20%       | MEP Equipment   |   543      |
|                   | ...             |   ...      |
+--------------------------------------------------+
|  FILTER: [Level v] [Category v] [Phase v]        |
+--------------------------------------------------+
```

This helps users visualize the report before building it.

## Teaching Principles

1. **Show, don't tell** - Run actual queries, display real data
2. **Start simple** - One table, one chart, then add complexity
3. **Explain the "why"** - Why domain = 'Physical-Visible'? Why this JOIN?
4. **Offer alternatives** - "You could also group by Level if that helps"
5. **Encourage exploration** - "What else would you like to see?"

## Red Flags to Watch For

- **Counting without domain filter** - Will include non-physical definitions
- **Assuming parameter names** - Always query ParameterDescriptors first
- **Hardcoding categories** - Different models have different categories
- **Trusting names** - Room names, element names vary wildly

## Building Confidence

For new users, start with wins:

1. "Let's see how many doors are in your model" (simple count)
2. "Now let's break that down by type" (hierarchy)
3. "And by level" (spatial breakdown)
4. "Now you have a quantities report!"

Then build complexity:
- Add filters
- Compare to Excel
- Calculate costs
- Visualize in 3D

*Last updated: 15 March 2026*
