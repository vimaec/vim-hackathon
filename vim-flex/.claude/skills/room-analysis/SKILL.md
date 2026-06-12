---
name: room-analysis
description: Analyze room and space data in BIM models. Use when exploring rooms, comparing to space programs, validating areas, or understanding building layout.
---

# Room and Space Analysis

Help users understand and analyze room/space data in their BIM models.

## Philosophy: Show, Don't Assume

**Never hardcode room categorizations.** Room naming conventions vary wildly:
- "OFFICE 101" vs "101 - OFFICE" vs "OFF-101"
- "LAB" vs "LABORATORY" vs "RESEARCH LAB"
- Departments, codes, abbreviations all differ by firm

Instead:
1. Query the actual room data
2. Show what's there
3. Let the user tell you how THEY categorize things
4. Or help them compare to an external space program

## Standard Room Data Fields

From Revit/BIM models, rooms typically have:
- **Name** - Descriptive name
- **Number** - Room number/ID
- **Area** - Calculated area (SF or SM)
- **Perimeter** - Room perimeter
- **Level** - Which floor
- **Department** - Organizational grouping (if used)
- **Occupancy** - Code classification (if used)

## Useful Queries

### List all rooms with basic data
```sql
SELECT r.name, r.number, r.area, l.name as level
FROM Rooms r
JOIN Elements e ON r.elementIndex = e.index
LEFT JOIN Levels l ON e.levelIndex = l.index
ORDER BY l.elevation, r.number
```

### Room count and area by level
```sql
SELECT l.name as level, COUNT(*) as rooms, SUM(r.area) as total_area
FROM Rooms r
JOIN Elements e ON r.elementIndex = e.index
LEFT JOIN Levels l ON e.levelIndex = l.index
GROUP BY l.name
ORDER BY l.elevation
```

### Find unique room name patterns
```sql
SELECT DISTINCT r.name FROM Rooms r ORDER BY r.name
```

### Search rooms by name
```sql
SELECT r.name, r.number, r.area
FROM Rooms r
WHERE r.name LIKE '%CONFERENCE%'
```

## Space Program Comparison

If the user has an Excel space program, use `read_xlsx()` to load it:

```sql
SELECT * FROM read_xlsx('path/to/program.xlsx')
```

Then compare:
1. What rooms are in the program but missing from model?
2. What rooms are in the model but not in program?
3. Where do areas differ?

## COBie Space Data

For facility management handover (COBie format), spaces need:
- Space name and number
- Floor/level assignment
- Gross and usable area
- Room type/category
- Zone assignments

Query this data and help format for COBie export if needed.

## What Users Actually Want

Based on research, users want to:
1. **See what's there** - Raw room list with all data
2. **Group and sort** - By level, by name pattern, by area range
3. **Compare to program** - Model vs requirements
4. **Export** - Get data into Excel for their own analysis
5. **Navigate** - Click room, see it in 3D

## Don't Do This

❌ Auto-categorize rooms by name patterns (your guesses will be wrong)
❌ Calculate "efficiency" with hardcoded formulas
❌ Assume room naming conventions
❌ Hide the raw data behind summaries

## Do This Instead

✅ Show all rooms with sortable columns
✅ Let users filter by typing
✅ Ask "How do you categorize rooms?" if they want groupings
✅ Compare to their Excel program if they have one
✅ Provide the data, let them decide what it means

*Last updated: 15 March 2026*
