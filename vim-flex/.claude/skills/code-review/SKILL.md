---
name: code-review
description: Evaluate AngelScript plugin code for maintainability, readability, and correctness. Produces a score and actionable feedback. Use after writing or modifying plugins, or when asked to review code quality.
---

# Code Maintainability Review

## When to Use
- After creating or modifying a plugin
- When user asks to check maintainability or review code
- Before marking a plugin as shipping quality

## Evaluation Criteria

### 1. Readability (25%)

**Function Length**
- GOOD: Under 60 lines
- ACCEPTABLE: 60-100 lines
- BAD: Over 100 lines - split into helpers

**Nesting Depth**
- GOOD: Max 3 levels of nesting (if/for/while)
- BAD: 4+ levels - extract inner logic to named functions

**Naming Clarity**
- Variables describe what they hold, not how they're used
- Functions describe what they do (verb + noun)
- No single-letter variables except loop counters (i, j, k)
- No abbreviations that aren't universal (ok: idx, len, btn)

### 2. Modularity (25%)

**Three-File Separation**
Check that the plugin follows the standard pattern:
- `{Name}Plugin.as` - ONLY registration and lifecycle
- `{Name}DataService.as` - ONLY SQL queries, data classes, data transformation
- `{Name}View.as` - ONLY ImGui rendering and user interaction

Flag violations:
- SQL queries in the View file
- ImGui rendering in the DataService
- Business logic in the Plugin file
- View file over 800 lines (split into tabs/sections)

**Single Responsibility**
- Each class does one thing
- Data classes are pure data (no methods beyond simple getters)

### 3. Fragility (20%)

**Magic Numbers**
- BAD: `if (count > 1000)` or `color(255, 128, 0, 200)`
- GOOD: `if (count > LARGE_MODEL_THRESHOLD)` or `CARD_AMBER`

**Duplicated Code**
- Flag any block of 5+ lines that appears more than once
- Should be extracted to a shared function

**Error Handling**
- Null checks on `@` handle references before use
- COALESCE in SQL for columns that may be null
- Graceful "no data" state in Views (don't render empty tables)

### 4. API Correctness (20%)

**Auto-Fail Items (fix immediately, no scoring needed):**
- [ ] Uses `hstring` in data classes (must be `string` for DeserializeFromQuery)
- [ ] Uses `ImGui::ButtonPrimary()` (must be `VimFlex::ButtonPrimary()`)
- [ ] Uses `ImGui::BeginPopupModal()` with 3 args (must use 4 args or 2 args, not 3)
- [ ] Uses `ImGui::BeginDisabled()` with no args (must pass `true`)
- [ ] Uses `ImGui::IsPopupOpen()` (doesn't exist, use bool state)
- [ ] Queries `Elements.familyIndex` (doesn't exist, use `familyName` VARCHAR)
- [ ] Missing `WHERE e.domain = 'Physical-Visible'` on element counts
- [ ] Missing event token storage (must store `Scene::EventToken@` and Unsubscribe in Destroy)
- [ ] Calls `ImGui::Begin/End` inside `Render()` (Window base class handles this)

**Pattern Correctness:**
- Uses `string` (not `hstring`) for all DeserializeFromQuery data classes
- Proper cleanup in shutdown (unsubscribe events, destroy views, null handles)
- TreeTable: SetFilterColumns and SetDisplayColumnAggregation called before Init()
- Trailing commas absent from array literals (AngelScript bug: adds null entry)

### 5. Documentation (10%)

**File Header**
- Each .as file should have a 2-5 line comment block explaining what the file does

**Complex Logic**
- Any non-obvious algorithm gets a comment explaining WHY, not WHAT
- SQL queries over 10 lines get a brief comment about what they produce

**NOT Required (don't penalize):**
- Per-function docstrings
- Type annotations (AngelScript is statically typed)
- Inline comments on obvious code

## Scoring

Calculate each dimension score (0-100), then weighted average:

```
Score = (Readability x 0.25) + (Modularity x 0.25) + (Fragility x 0.20) + (API_Correctness x 0.20) + (Documentation x 0.10)
```

| Grade | Score | Action |
|-------|-------|--------|
| A | 90-100 | Ship-ready, no changes needed |
| B | 75-89 | Minor issues, fix if convenient |
| C | 60-74 | Needs attention, human review recommended |
| D | 0-59 | Must fix before completing task |

## Auto-Fix Loop

When score < 75 after writing or modifying a plugin:
1. Read the specific issues flagged
2. Fix the top 3 issues by impact
3. Re-run maintainability check
4. Repeat until score >= 75 or 3 iterations max
5. Report final score to user

## How to Run

### Step 1: Read All Plugin Files
```
vim_batch_read of {Name}Plugin.as, {Name}DataService.as, {Name}View.as
```

### Step 2: Run API Correctness Checks First
Binary pass/fail - any auto-fail item means immediate fix.

### Step 3: Score Each Dimension

### Step 4: Produce Report
```
## Maintainability Report: {Plugin Name}
**Score: {N}/100 (Grade {X})**

### Issues Found
1. [CRITICAL] {issue} - {file}:{line}
2. [WARNING] {issue} - {file}:{line}
3. [INFO] {suggestion} - {file}:{line}

### Dimension Scores
- Readability: {N}/100
- Modularity: {N}/100
- Fragility: {N}/100
- API Correctness: {N}/100
- Documentation: {N}/100

### Recommendations
- {Top priority fix}
- {Second priority fix}
- {Third priority fix}
```
