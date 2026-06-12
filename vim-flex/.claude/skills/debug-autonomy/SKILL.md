---
name: debug-autonomy
description: Autonomous debugging patterns for VIM Flex development. Reference for compile errors, recovery strategies, and WIGGUM loop patterns.
---

# Debug Autonomy for VIM Flex

Reference material for autonomous debugging without human intervention.

## VIM Flex Process Management

### Launch with MCP Server (REQUIRED)
```bash
""%ProgramFiles%\VIM\VIM Flex\VIM Flex.exe"" --start-mcp-server=true --show-console=true
```

### Launch with Model Pre-loaded (RECOMMENDED)
```bash
""%ProgramFiles%\VIM\VIM Flex\VIM Flex.exe"" "C:\path\to\model.vim" --start-mcp-server=true --show-console=true
```

**Always open VIM Flex with a model!** This ensures:
- You can test queries immediately
- You can see runtime errors with real data
- You don't forget to load a model for testing

### Launch with Console Logging (FOR DEBUGGING CRASHES)
```bash
# Run from terminal to see live console output:
""%ProgramFiles%\VIM\VIM Flex\VIM Flex.exe"" "C:\path\to\model.vim" --start-mcp-server=true --show-console=true 2>&1
```

This captures stdout/stderr so you can see:
- Script compilation errors
- Runtime exceptions
- Null pointer crashes
- The exact moment of crash

**Tip:** Use `timeout 30` prefix if you want to auto-kill after testing:
```bash
timeout 30 ""%ProgramFiles%\VIM\VIM Flex\VIM Flex.exe"" "model.vim" --start-mcp-server=true --show-console=true 2>&1
```

### Kill VIM Flex (PowerShell - Most Reliable)
```bash
powershell -Command "Stop-Process -Name 'VIM Flex' -Force"
```

### Check if Running
```bash
tasklist | grep -i "VIM Flex"
```

### Full Restart Sequence
```bash
powershell -Command "Stop-Process -Name 'VIM Flex' -Force" 2>/dev/null
sleep 2
start "" ""%ProgramFiles%\VIM\VIM Flex\VIM Flex.exe"" --start-mcp-server=true --show-console=true
sleep 3  # Wait for MCP to be ready
```

## Compile Error Patterns

### Error Format
```
[ERR] path/to/file.as:LINE Error message
[WRN] path/to/file.as:LINE Warning message
```

### Common Errors and Fixes

| Error Message | Cause | Fix |
|---------------|-------|-----|
| `Type 'hstring' not found` | Old string type | Change `hstring` to `string` |
| `No member named 'familyIndex'` | Schema changed | Use `familyName` VARCHAR column |
| `No member named 'familyTypeIndex'` | Schema changed | Use `familyTypeName` VARCHAR column |
| `Cannot convert 'hstring' to 'string'` | Type mismatch | Remove hstring, use string |
| `Identifier 'GroupFilterWidget' not declared` | Old API removed | Use TreeTable instead |
| `No matching signatures to 'ToString'` | Method removed | Remove .ToString() call |
| `No member named 'index' in array` | Wrong index access | Use `[]` operator or `.length()` |
| `Unexpected token '}'` | Syntax error | Check for missing semicolons or braces |
| Duplicate function `EscapeCSVField` | Duplicate of shared utility | Remove private method, `#include "../shared/StringUtils.as"` |
| CSV numbers have commas | `Util::FormatDecimal` adds thousands separator | Use `FormatCSVNumber()` from shared/StringUtils.as |

### Data Class Pattern (CRITICAL)

```angelscript
// WRONG - Returns empty data
class MyRow
{
    hstring name;     // hstring doesn't work!
    hstring category;
}

// CORRECT - Works properly
class MyRow
{
    string name;      // Use string
    string category;
}
```

## Query Testing via MCP

### Basic Connection Test
```sql
SELECT COUNT(*) FROM Elements
```
Expected: Returns a number (even 0 is OK - means connection works)

### Physical Elements Test
```sql
SELECT COUNT(*) FROM Elements WHERE domain = 'Physical-Visible'
```

### Schema Discovery
```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'main' ORDER BY table_name
```

### Sample Data
```sql
SELECT * FROM Elements LIMIT 5
```

## Recovery Strategies

### Problem: Compile Error Won't Go Away

1. Read full error message carefully
2. Read the file, find the exact line
3. Look at surrounding context (5 lines before/after)
4. Check if similar pattern exists elsewhere in codebase
5. Check Scripts/LESSONS_LEARNED.md for known fixes

### Problem: VIM Flex Crashes on Start

1. **Run with console logging** to see the crash:
   ```bash
   ""%ProgramFiles%\VIM\VIM Flex\VIM Flex.exe"" "model.vim" --start-mcp-server=true --show-console=true 2>&1
   ```
2. Check for infinite loops in script code
3. Check for null pointer access in Open() methods
4. Remove recent changes, test incrementally
5. Check UserPlugins folder for syntax errors in ANY file

### Problem: VIM Flex Crashes at Runtime (e.g., clicking a button)

1. **Run with console logging** and reproduce the crash
2. Common cause: **Null pointer dereference** - calling methods on null objects
3. Check for patterns like `scene.GetVimData().GetData()` - add null checks:
   ```angelscript
   auto@ container = scene.GetVimData();
   if (container is null) return;
   auto@ data = container.GetData();
   if (data is null) return;
   ```
4. Search for similar patterns in the file and fix all of them

### Problem: MCP Not Responding

1. Verify VIM Flex is running: `tasklist | grep "VIM Flex"`
2. Verify MCP flag was used: `--start-mcp-server=true`
3. Kill and restart VIM Flex
4. Wait 5 seconds after start before MCP calls

### Problem: Query Returns Empty

1. Is a VIM model loaded?
2. Is the table name correct?
3. Are column names correct? (check schema)
4. Is the WHERE clause filtering everything out?

### Problem: Stuck in Loop

If the same error keeps occurring after 5 attempts:
1. STOP making changes
2. Read the FULL file, not just the error line
3. Check for multiple instances of the same problem
4. Report status and ask for help

## WIGGUM Philosophy

**W**iggum **I**terative **G**rowth through **U**nderstanding **M**istakes

1. **TRY** - Make an attempt based on current knowledge
2. **FAIL** - Capture the error (don't hide it)
3. **LEARN** - Parse the error, understand what went wrong
4. **FIX** - Apply a targeted fix
5. **RETRY** - Go back to step 1

### Key Principles

- **Errors are information** - Don't fear them, read them
- **Small changes** - Fix one thing at a time
- **Test often** - Compile after each change
- **Don't guess** - If unsure, read more code first
- **Know when to stop** - After 10 failed attempts, report and pause

## File Locations Reference

| Item | Path |
|------|------|
| VIM Flex EXE | `"%ProgramFiles%\VIM\VIM Flex\VIM Flex.exe"` |
| UserPlugins | `%LOCALAPPDATA%\VIM\VIM Flex\UserPlugins\` |
| Built-in Scripts | `"%ProgramFiles%\VIM\VIM Flex\Scripts\` |
| Lessons Learned | `%ProgramFiles%\VIM\VIM Flex\Scripts\LESSONS_LEARNED.md` |

## Compile via MCP (No Restart Needed)

Use `vim-flex:vim_compile()` to test compilation without restarting VIM Flex.

This is MUCH faster than:
1. Kill VIM Flex
2. Restart VIM Flex
3. Wait for startup
4. See error in console

Instead:
1. Edit file
2. Call compile via MCP
3. See error immediately
4. Fix and repeat

Only restart VIM Flex when you need to test RUNTIME behavior (UI, 3D view, etc.)

*Last updated: 15 March 2026*
