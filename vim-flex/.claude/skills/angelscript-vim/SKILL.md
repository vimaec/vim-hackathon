---
name: angelscript-vim
description: Write AngelScript plugins for VIM Flex. Use when creating BIM visualization tools, custom UI panels, or workflow plugins for the VIM Flex 3D viewer.
---

# AngelScript Plugin Development for VIM Flex

**Requires Developer Mode.** Plugin development uses `vim_write_script_file`, `vim_patch_script_file`, and `vim_compile`, which are only available when VIM Flex is running in Developer Mode. If these tools return errors about Query Mode, ask the user to enable Developer Mode under Settings > Developer Settings.

Create plugins that add workflows, UI panels, and data visualizations to VIM Flex.

## ⚠️ CRITICAL: Read the READMEs Before Writing Code!

**Before writing any plugin code, read these files for proven patterns:**
- **`Scripts/README.md`** — Full reference for every service, component, widget, type, and enum
- **`SamplePlugins/README.md`** — Plugin file structure, lifecycle patterns, TreeTable usage, and SQL templates

These contain working examples grounded in actual code. Don't guess at APIs.

## ⚠️ CRITICAL: Check as.predefined First!

**The `as.predefined` file in the VIM Flex installation folder is the authoritative API reference.**

Before asking "does this function exist?" or "what's the signature?", check `as.predefined`. It contains:
- All ImGui functions and their exact signatures
- All VimFlex namespace functions (SaveFileDialog, OpenFileDialog, etc.)
- All Scene namespace classes and methods
- Camera data structures with position/direction/up vectors
- All available UI widgets and parameters

**Location:** `"%ProgramFiles%\VIM\VIM Flex\as.predefined`

## Plugin Structure

Every plugin has three files:

```
MyPlugin/
├── MyPluginPlugin.as      # Registration and lifecycle
├── MyPluginDataService.as # SQL queries and data processing
└── MyPluginView.as        # ImGui UI rendering
```

## Plugin.as Template

```angelscript
#include "MyPluginView.as"
#include "../Main.as"
#include "../BuiltinPlugins.as"

namespace MyPluginPlugin
{
    MyPluginView@ myPluginView;

    Scene::EventToken@ gHandlePluginInit = VimFlex::OnPluginInit().Subscribe(
        Scene::Event::EventCallback(HandlePluginInit));

    Scene::EventToken@ gHandlePluginShutdown = VimFlex::OnPluginShutdown().Subscribe(
        Scene::Event::EventCallback(HandlePluginShutdown));

    void HandlePluginInit()
    {
        @myPluginView = MyPluginView(g_app);
        g_app.views.AddDockableWindow(myPluginView);

        auto@ builtInViews = BuiltinPlugins::GetBuiltInViews();

        g_app.AddWorkflow(
            "My Plugin",           // Workflow name in menu
            false,                 // Not default
            builtInViews,          // Standard views
            {
                myPluginView,
                BuiltinPlugins::elementTreeView,
                BuiltinPlugins::parameterView
            },
            false
        );
    }

    void HandlePluginShutdown()
    {
        if (gHandlePluginInit !is null) { gHandlePluginInit.Unsubscribe(); @gHandlePluginInit = null; }
        if (gHandlePluginShutdown !is null) { gHandlePluginShutdown.Unsubscribe(); @gHandlePluginShutdown = null; }
        if (myPluginView !is null) { myPluginView.Destroy(); @myPluginView = null; }
    }
}
```

## DataService.as Pattern

```angelscript
// Define a class matching your SQL columns
// CRITICAL: Use 'string', NOT 'hstring' — hstring returns empty in data classes!
class MyDataRow
{
    uint32 elementIndex;
    string name;
    int count;
    float area;
}

class MyDataService
{
    array<MyDataRow> data;   // value types, NOT handles (array<MyDataRow@> would break DeserializeFromQuery)
    private Scene::VimData@ _vimData;
    private bool _dataLoaded = false;

    void SetVimData(Scene::VimData@ vimData)
    {
        @_vimData = vimData;
        _dataLoaded = false;
        data.resize(0);
    }

    bool IsDataLoaded() { return _dataLoaded; }

    void LoadData()
    {
        if (_vimData is null) return;

        // Strings are VARCHAR — no CAST needed (Feb 2026)
        string query =
            "SELECT e.index as elementIndex, r.name, r.area " +
            "FROM Rooms r " +
            "JOIN Elements e ON r.elementIndex = e.index " +
            "WHERE r.name LIKE '%OFFICE%'";

        data.DeserializeFromQuery(_vimData, query);
        _dataLoaded = true;
    }

    // Helper to get element indices for 3D selection
    array<uint32>@ GetElementIndices()
    {
        array<uint32> result;
        for (uint i = 0; i < data.length(); i++)
            result.insertLast(data[i].elementIndex);
        return result;
    }
}
```

## View.as Pattern

```angelscript
#include "MyDataService.as"
#include "../core/Window.as"
#include "../core/IRenderContext.as"
#include "../BuiltinPlugins.as"

class MyPluginView : Window
{
    private App@ _app;
    private MyDataService@ _dataService;
    private Scene::EventToken@ _dataChangedToken = null;
    private bool _destroyed = false;

    MyPluginView(App@ app)
    {
        super("My Plugin", ImGuiWindowFlags::ImGuiWindowFlags_None, false, true);
        @_app = app;
        @_dataService = MyDataService();
    }

    ~MyPluginView() { Destroy(); }

    void Destroy() override
    {
        if (_destroyed) return;
        _destroyed = true;
        if (_dataChangedToken !is null) { _dataChangedToken.Unsubscribe(); @_dataChangedToken = null; }
        @_dataService = null;
        @_app = null;
    }

    void Open() override
    {
        isVisible = true;
        if (_dataChangedToken is null && _app !is null)
        {
            @_dataChangedToken = _app.GetAppScene().GetVimDataService().OnVimDataChanged().Subscribe(
                Scene::Event::EventCallback(OnVimDataChanged));
        }
        RefreshData();
    }

    void Close() override
    {
        isVisible = false;
        if (_dataChangedToken !is null) { _dataChangedToken.Unsubscribe(); @_dataChangedToken = null; }
    }

    void RegisterDockingRegion() override
    {
        ImGui::DockBuilderDockWindow(_windowName, VimFlex::Docking::RegionBottom);
    }

    void RefreshData()
    {
        if (_app is null || _dataService is null) return;
        auto@ vimData = _app.GetAppScene().GetVimData().GetData();
        if (vimData is null) return;
        _dataService.SetVimData(vimData);
        _dataService.LoadData();
    }

    private void OnVimDataChanged() { RefreshData(); }

    bool Render(const IRenderContext& ctx) override
    {
        // Window base class calls ImGui::Begin/End — do NOT call them here.
        // Just render content directly:
        Style::SectionText("My Plugin");

        if (!_dataService.IsDataLoaded())
        {
            ImGui::TextDisabled("No data loaded.");
            return true;
        }

        // Your UI here
        for (uint i = 0; i < _dataService.data.length(); i++)
        {
            ImGui::Text(_dataService.data[i].name);
        }
        return true;
    }
}
```

## 3D Selection and Isolation

Use the MCP tools for selection and visibility from agent context. From within AngelScript plugins, use `GetInteractionService()` for high-level isolation/visibility - it correctly handles ghost mode, auto-sections, and room elements. Use low-level scene services only for direct per-element state control:

```angelscript
// Select elements in 3D view
void SelectElements(array<uint>@ elementIndices)
{
    if (elementIndices is null || elementIndices.length() == 0) return;

    Scene::SceneItemSet@ itemSet = Scene::SceneItemSet();
    itemSet.Add(elementIndices);

    _app.GetAppScene().GetSelectionService().Apply(itemSet);
}

// Isolate (hide everything except selection) then frame
void IsolateElements(array<uint>@ elementIndices)
{
    if (elementIndices is null || elementIndices.length() == 0) return;

    Scene::SceneItemSet@ itemSet = Scene::SceneItemSet();
    itemSet.Add(elementIndices);

    auto@ appScene = _app.GetAppScene();
    appScene.GetSelectionService().Apply(itemSet);
    appScene.GetInteractionService().IsolateSelection();
    appScene.GetInteractionService().FrameSelection();
}

// Show all (reset visibility)
void ShowAll()
{
    _app.GetAppScene().GetInteractionService().ShowAll();
}
```

## Hierarchical Tables with Expand/Collapse (TreeTable)

**For hierarchical data with proper triangle expand/collapse, use the TreeTable widget.**

DO NOT use `ImGui::TreeNode()` inside `ImGui::BeginTable()` - it won't render triangles!

TreeTable requires a **flat denormalized temp table** created via SQL first. `Init()` takes the temp table name - `SetFilterColumns()` and aggregation settings **must** be called before `Init()`.

```angelscript
#include "../widgets/TreeTable.as"

TreeTable@ _table;

void InitTable(Scene::VimData@ vimData, Scene::Scene@ scene, VimData@ vimDataWrapper)
{
    if (_table !is null)
    {
        _table.Destroy();
        @_table = null;
    }

    // Step 1: create flat denormalized temp table
    string tableName = "MyTree";
    vimData.DataQueryGeneric(
        "CREATE OR REPLACE TABLE " + tableName + " AS SELECT "
        "    e.index AS elementIndex, "
        "    COALESCE(cat.name, '<unknown>') AS Category, "
        "    COALESCE(e.familyName, '<unknown>') AS Family, "
        "    COALESCE(e.familyTypeName, '<unknown>') AS Type, "
        "    COALESCE(level.name, '<unknown>') AS Level, "
        "    1 AS Count "
        "FROM Elements e "
        "LEFT JOIN Categories cat ON e.categoryIndex = cat.index "
        "LEFT JOIN Levels level ON e.levelIndex = level.index "
        "WHERE e.domain = 'Physical-Visible'"
    );

    // Step 2: configure then Init (SetFilterColumns and aggregation MUST come before Init)
    @_table = TreeTable();
    _table.tableId = "##MyTree";
    _table.sendSelectionEvents = true;
    _table.respondToSelectionEvents = true;
    _table.showFooter = true;
    _table.footerLabel = "TOTAL";

    _table.SetFilterColumns(vimDataWrapper, {"Category", "Level"});
    _table.SetDisplayColumnAggregation(0, TreeTableAggOp_Sum);
    _table.SetDisplayColumnFormat(0, TreeTableFormat_Integer);

    _table.Init(vimData, tableName,
        {"Category", "Family", "Type"},   // hierarchy columns (must exist in temp table)
        {"Count"},                         // display columns (must exist in temp table)
        scene, "elementIndex");            // elementIndex for 3D selection sync
}

// In Render():
if (_table !is null)
    _table.Render();

// In Destroy() - always call this:
if (_table !is null)
{
    _table.Destroy();
    @_table = null;
}
```

See `Scripts/README.md` for the full TreeTable API including aggregation ops, format options, and filter setup. For standard element trees, prefer `ElementTreeCard` from `Scripts/widgets/cards/ElementTreeCard.as` - it handles the SQL, rebuild on data change, filter UI, drill up/down, and export automatically.

## ImGui Table Pattern (Flat Data Only)

For flat, non-hierarchical tables:

```angelscript
int tableFlags = ImGuiTableFlags::ImGuiTableFlags_Borders |
                 ImGuiTableFlags::ImGuiTableFlags_RowBg |
                 ImGuiTableFlags::ImGuiTableFlags_ScrollY |
                 ImGuiTableFlags::ImGuiTableFlags_Sortable;

// Use float2(0, 0) to fill remaining window space
float2 tableSize = float2(0, 0);

if (ImGui::BeginTable("MyTable", 3, tableFlags, tableSize))
{
    // Freeze header row (0 columns, 1 row frozen)
    ImGui::TableSetupScrollFreeze(0, 1);

    ImGui::TableSetupColumn("Name", ImGuiTableColumnFlags::ImGuiTableColumnFlags_WidthStretch);
    ImGui::TableSetupColumn("Count", ImGuiTableColumnFlags::ImGuiTableColumnFlags_WidthFixed, 60);
    ImGui::TableSetupColumn("Area", ImGuiTableColumnFlags::ImGuiTableColumnFlags_WidthFixed, 80);
    ImGui::TableHeadersRow();

    for (uint i = 0; i < data.length(); i++)
    {
        ImGui::TableNextRow();
        ImGui::TableNextColumn();

        // Selectable row
        if (ImGui::Selectable(data[i].name + "##" + i, false,
            ImGuiSelectableFlags::ImGuiSelectableFlags_SpanAllColumns))
        {
            // Handle click
            SelectElement(data[i].elementIndex);
        }

        ImGui::TableNextColumn();
        ImGui::Text(Util::FormatInt(data[i].count));

        ImGui::TableNextColumn();
        ImGui::Text(Util::FormatDecimal(data[i].area, 1));
    }

    ImGui::EndTable();
}
```

## Shared Utilities (StringUtils.as)

All CSV/string operations should use shared utilities from `SamplePlugins/shared/StringUtils.as`:

```angelscript
#include "../shared/StringUtils.as"
```

**Available functions:**
- `EscapeCSVField(string)` — RFC 4180 compliant CSV field escaping (handles commas, quotes, newlines)
- `SplitCSVLine(string)` — Parse CSV line respecting quoted fields
- `Trim(string)` — Trim whitespace
- `FormatCSVNumber(double value, int precision)` — Safe numeric formatting for CSV/SQL (NO thousands separators)
- `StripBOM(string)` — Strip UTF-8 BOM and zero-width characters from file content
- `EscapeSqlString(string)` — Escape single quotes for SQL
- `EscapePathForMCode(string)` — Double backslashes for PowerBI M code

### CSV Number Safety

**CRITICAL:** `Util::FormatDecimal` adds thousands separators (e.g., "1,234.56") which breaks CSV fields and SQL statements!

```angelscript
// ❌ WRONG — breaks CSV: "1,234.56" looks like two fields
line += Util::FormatDecimal(cost, 2);

// ✅ CORRECT — clean output: "1234.56"
line += FormatCSVNumber(cost, 2);
```

**Use `Util::FormatDecimal`** only for UI display (ImGui::Text, console logs, chart labels).
**Use `FormatCSVNumber`** for CSV export, SQL INSERT/UPDATE values, and any machine-readable output.

## Key APIs

- `Util::FormatInt(int)` - Format number with commas (UI display only!)
- `Util::FormatDecimal(float, decimals)` - Format decimal with commas (UI display only!)
- `FormatCSVNumber(double, int)` - Safe decimal format for CSV/SQL (from shared/StringUtils.as)
- `Style::VSpace()` - Vertical spacing
- `Style::GetFontBold()` - Bold font
- `ImGui::TextColored(color, text)` - Colored text
- `ImGui::TextDisabled(text)` - Gray text

## Large Model Handling

Models can have millions of elements. Be careful with:

### ❌ AVOID: GROUP_CONCAT on element IDs
```sql
-- DON'T DO THIS - crashes with large datasets!
SELECT GROUP_CONCAT(e."index") as elementIds FROM Elements e ...
```
This produces multi-megabyte strings that crash rendering.

### ✅ DO: Aggregate counts only, query IDs on-demand
```sql
-- Good: Returns fast, small result
SELECT c.name, COUNT(*) as cnt FROM Elements e
JOIN Categories c ON e.categoryIndex = c.index
GROUP BY c.name
```

Then query specific element IDs only when user clicks a row:
```angelscript
// Query element IDs only when needed for selection
string query = "SELECT e.\"index\" as idx FROM Elements e WHERE ...";
array<ElementQueryResult> results;
results.DeserializeFromQuery(vimData, query);
```

### Performance Guidelines
- GROUP BY queries on 2M+ elements: ~1 second (fast)
- 20K+ rows in ImGui table: works fine with ScrollY
- Never return all element IDs in a single query result

## File Location

Plugins go in:
```
C:\Users\{user}\AppData\Local\VIM\VIM Flex\UserPlugins\{PluginName}\
```

## Additional Resources

For detailed API reference including all ImGui widgets, scene interaction, and data types, see [REFERENCE.md](REFERENCE.md).

*Last updated: 15 March 2026*
