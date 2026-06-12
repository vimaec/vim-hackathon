# AngelScript VIM Flex API Reference

Detailed reference for VIM Flex plugin development.

## ⚠️ Primary API Reference: as.predefined

**Always check `as.predefined` first!** Located at `"%ProgramFiles%\VIM\VIM Flex\as.predefined`

This file contains the complete VIM Flex API:
- All ImGui functions with exact signatures
- All VimFlex namespace functions (SaveFileDialog, OpenFileDialog, etc.)
- All Scene classes and methods
- Camera data with position/direction/up vectors
- All available widgets and their parameters

## ImGui Widgets

### Text
```angelscript
ImGui::Text("Plain text");
ImGui::TextDisabled("Gray text");
ImGui::TextColored(color(255, 100, 100, 255), "Red text");
ImGui::PushFont(Style::GetFontBold());
ImGui::Text("Bold text");
ImGui::PopFont();
```

### Buttons
```angelscript
if (ImGui::Button("Click Me"))
{
    // Handle click
}

if (ImGui::SmallButton("Small"))
{
    // Handle click
}
```

### Inputs
```angelscript
// Text input - uses in/out pattern, not a bool ref
string searchIn = "";
string searchOut = "";
if (ImGui::InputText("Search", searchIn, searchOut))
{
    searchIn = searchOut;  // commit the new value
}

// Checkbox
bool checked = false;
bool checkedOut = false;
if (ImGui::Checkbox("Enable", checked, checkedOut))
{
    checked = checkedOut;
}

// Radio buttons
int selected = 0;
if (ImGui::RadioButton("Option A", selected == 0)) selected = 0;
ImGui::SameLine();
if (ImGui::RadioButton("Option B", selected == 1)) selected = 1;
```

### Layout
```angelscript
ImGui::SameLine();                    // Next widget on same line
Style::VSpace();                      // Vertical spacing
ImGui::Separator();                   // Horizontal line
ImGui::Dummy(float2(100, 20));        // Empty space

// Child regions (scrollable)
ImGui::BeginChild("ChildName", float2(200, 0), ImGuiChildFlags::ImGuiChildFlags_Borders);
// ... content ...
ImGui::EndChild();
```

### Tables
```angelscript
int flags = ImGuiTableFlags::ImGuiTableFlags_Borders |
            ImGuiTableFlags::ImGuiTableFlags_RowBg |
            ImGuiTableFlags::ImGuiTableFlags_ScrollY |
            ImGuiTableFlags::ImGuiTableFlags_Sortable |
            ImGuiTableFlags::ImGuiTableFlags_Resizable;

if (ImGui::BeginTable("TableID", 3, flags))
{
    // Column setup
    ImGui::TableSetupColumn("Name", ImGuiTableColumnFlags::ImGuiTableColumnFlags_WidthStretch);
    ImGui::TableSetupColumn("Count", ImGuiTableColumnFlags::ImGuiTableColumnFlags_WidthFixed, 60);
    ImGui::TableSetupColumn("Value", ImGuiTableColumnFlags::ImGuiTableColumnFlags_WidthFixed, 80);
    ImGui::TableSetupScrollFreeze(0, 1);  // Freeze header row
    ImGui::TableHeadersRow();

    // Rows
    for (uint i = 0; i < data.length(); i++)
    {
        ImGui::TableNextRow();
        ImGui::TableNextColumn();
        ImGui::Text(data[i].name);
        ImGui::TableNextColumn();
        ImGui::Text(Util::FormatInt(data[i].count));
        ImGui::TableNextColumn();
        ImGui::Text(Util::FormatDecimal(data[i].value, 2));
    }

    ImGui::EndTable();
}
```

### Selectable Rows
```angelscript
ImGui::TableNextColumn();
bool isSelected = (selectedIndex == int(i));
if (ImGui::Selectable(text + "##" + i, isSelected,
    ImGuiSelectableFlags::ImGuiSelectableFlags_SpanAllColumns))
{
    selectedIndex = int(i);
    // Handle selection
}
```

### Tree Nodes (Outside Tables Only)

**WARNING:** TreeNode does NOT render triangles inside BeginTable()!
For hierarchical tables, use TreeTable instead (see below).

```angelscript
// Only use TreeNode OUTSIDE of tables
if (ImGui::TreeNode("Parent##id"))
{
    ImGui::Text("Child content");
    ImGui::TreePop();
}

// With flags for default open
if (ImGui::TreeNodeEx("Parent", ImGuiTreeNodeFlags::ImGuiTreeNodeFlags_DefaultOpen))
{
    ImGui::Text("Child content");
    ImGui::TreePop();
}
```

### Hierarchical Tables: TreeTable

**For hierarchical data with expand/collapse triangles, use the TreeTable widget.**

```angelscript
#include "../widgets/TreeTable.as"

TreeTable@ _table;

// Initialize - call from OnVimDataChanged
// Step 1: create flat denormalized temp table
string tableName = "MyTreeTable";
vimData.DataQueryGeneric(
    "CREATE OR REPLACE TABLE " + tableName + " AS SELECT "
    "    e.index AS elementIndex, "
    "    COALESCE(cat.name, '<unknown>') AS Category, "
    "    COALESCE(e.familyName, '<unknown>') AS Family, "
    "    COALESCE(e.familyTypeName, '<unknown>') AS Type, "
    "    1 AS Count "
    "FROM Elements e "
    "LEFT JOIN Categories cat ON e.categoryIndex = cat.index "
    "WHERE e.domain = 'Physical-Visible'"
);

// Step 2: configure then Init
// SetFilterColumns() and SetDisplayColumnAggregation() MUST come before Init()
@_table = TreeTable();
_table.tableId = "##MyTree";
_table.sendSelectionEvents = true;
_table.respondToSelectionEvents = true;
_table.showFooter = true;
_table.footerLabel = "TOTAL";

_table.SetDisplayColumnAggregation(0, TreeTableAggOp_Sum);
_table.SetDisplayColumnFormat(0, TreeTableFormat_Integer);

_table.Init(vimData, tableName,
    {"Category", "Family", "Type"},   // hierarchy columns (must exist in temp table)
    {"Count"},                         // display columns (must exist in temp table)
    scene, "elementIndex");

// In Render():
_table.Render();

// In Destroy() - required:
if (_table !is null) { _table.Destroy(); @_table = null; }
```

See `Scripts/README.md` for the full TreeTable API.

### Tooltips
```angelscript
ImGui::Text("Hover me");
if (ImGui::IsItemHovered())
{
    ImGui::SetTooltip("This is a tooltip");
}
```

### Popups (Modal)
```angelscript
// State tracking (no IsPopupOpen available)
private bool _showPopup = false;

// Open the popup
if (ImGui::Button("Open"))
{
    _showPopup = true;
}

// Render the popup (use 4-parameter or 2-parameter signature, NOT 3)
if (_showPopup)
{
    ImGui::OpenPopup("MyPopup##UniqueID");
    ImGui::SetNextWindowSize(float2(500, 300));

    bool openedOut = true;
    if (ImGui::BeginPopupModal("MyPopup##UniqueID", _showPopup, openedOut, ImGuiWindowFlags_None))
    {
        ImGui::Text("Popup content here");

        if (ImGui::Button("Close"))
        {
            _showPopup = false;
            ImGui::CloseCurrentPopup();
        }
        ImGui::EndPopup();
    }
}
```

### Clipboard
```angelscript
// Copy text to clipboard
ImGui::SetClipboardText("Text to copy");

// Example: Copy button
if (ImGui::Button("Copy to Clipboard"))
{
    ImGui::SetClipboardText(_generatedText);
}
```

### Disabled State
```angelscript
// BeginDisabled REQUIRES a boolean parameter
bool isDisabled = _data.length() == 0;
ImGui::BeginDisabled(isDisabled);
if (ImGui::Button("Process Data"))
{
    // Only clickable when not disabled
}
ImGui::EndDisabled();
```

### Colors
```angelscript
// RGBA color
color red = color(255, 0, 0, 255);
color semiTransparent = color(100, 150, 200, 128);

// Push/pop style colors
ImGui::PushStyleColor(ImGuiCol::ImGuiCol_Text, color(255, 200, 0, 255));
ImGui::Text("Yellow text");
ImGui::PopStyleColor();

// Multiple colors
ImGui::PushStyleColor(ImGuiCol::ImGuiCol_Button, color(100, 50, 50, 255));
ImGui::PushStyleColor(ImGuiCol::ImGuiCol_ButtonHovered, color(150, 75, 75, 255));
if (ImGui::Button("Styled Button")) { }
ImGui::PopStyleColor(2);
```

### Drawing
```angelscript
float2 pos = ImGui::GetCursorScreenPos();
auto@ drawList = ImGui::GetWindowDrawList();

// Rectangle
drawList.AddRectFilled(pos, float2(pos.x + 100, pos.y + 20), color(100, 150, 200, 255), 4);
drawList.AddRect(pos, float2(pos.x + 100, pos.y + 20), color(200, 200, 200, 255), 4);

// Line
drawList.AddLine(pos, float2(pos.x + 50, pos.y + 50), color(255, 255, 255, 255), 2);

// Reserve space
ImGui::Dummy(float2(100, 20));
```

## Scene Interaction

### Selection
```angelscript
// Create item set
Scene::SceneItemSet@ itemSet = Scene::SceneItemSet();

// Add single element
array<uint32> elements = { elementIndex };
itemSet.Add(elements);

// Add multiple elements
array<uint32> manyElements;
manyElements.insertLast(index1);
manyElements.insertLast(index2);
itemSet.Add(manyElements);

// Apply selection
_app.GetAppScene().GetSelectionService().Apply(itemSet);

// Clear selection
_app.GetAppScene().GetSelectionService().Clear();
```

### Isolation & Framing
```angelscript
// Use InteractionService - handles ghost mode, auto-section, room elements correctly
auto@ interaction = _app.GetAppScene().GetInteractionService();

// Select elements, then isolate (hides everything else)
_app.GetAppScene().GetSelectionService().Apply(itemSet);
interaction.IsolateSelection();

// Frame camera on isolated elements
interaction.FrameSelection();

// Show all (reset isolation)
interaction.ShowAll();

// Frame all elements in scene
interaction.FrameAll();

// Frame specific elements without isolation (low-level, bypasses ghost/section logic)
_app.GetAppScene().GetSceneViewComponent().FrameSceneItems(itemSet);
```

### Full Select + Isolate + Frame Pattern
```angelscript
void SelectAndIsolate(array<uint>@ elements)
{
    if (elements is null || elements.length() == 0) return;

    Scene::SceneItemSet@ itemSet = Scene::SceneItemSet();
    itemSet.Add(elements);

    auto@ appScene = _app.GetAppScene();
    appScene.GetSelectionService().Apply(itemSet);
    appScene.GetInteractionService().IsolateSelection();
    appScene.GetInteractionService().FrameSelection();
}
```

## Data Types

### string (NOT hstring!)
**CRITICAL:** Always use `string` in data classes for `DeserializeFromQuery`. Using `hstring` returns empty values!
```angelscript
// CORRECT
class MyRow { string name; }

// BROKEN — returns empty
class MyRow { hstring name; }
```

### dictionary
```angelscript
dictionary d;
d["key"] = "value";
d["count"] = 42;

string val;
if (d.get("key", val))
{
    // val = "value"
}

array<string> keys = d.getKeys();
```

### Arrays
```angelscript
array<int> numbers;
numbers.insertLast(1);
numbers.insertLast(2);
numbers.resize(10);
numbers.sortAsc();

uint len = numbers.length();
```

## Utility Functions

```angelscript
// UI display only (adds thousands separators):
Util::FormatInt(12345)           // "12,345"
Util::FormatDecimal(3.14159, 2)  // "3.14" (may add commas for large numbers!)

// For CSV/SQL — use shared StringUtils.as (no thousands separators):
#include "../shared/StringUtils.as"
FormatCSVNumber(1234.5, 2)       // "1234.50" (safe for CSV/SQL)
EscapeCSVField("value, with comma") // "\"value, with comma\"" (RFC 4180)
StripBOM(fileContent)            // Strips UTF-8 BOM + zero-width chars
EscapeSqlString("it's")          // "it''s"
```

**CRITICAL:** `Util::FormatDecimal` may produce "1,234.56" which breaks CSV fields and SQL VALUES clauses.
Use `FormatCSVNumber()` for any machine-readable output.

## Window Docking Regions

```angelscript
VimFlex::Docking::RegionBottom   // Bottom panel
VimFlex::Docking::RegionLeft     // Left sidebar
VimFlex::Docking::RegionRight    // Right sidebar
```

## Event Handling

```angelscript
// Subscribe to VIM data changes
Scene::EventToken@ _token;

void Subscribe()
{
    @_token = _app.GetAppScene().GetVimDataService().OnVimDataChanged().Subscribe(
        Scene::Event::EventCallback(OnDataChanged));
}

void OnDataChanged()
{
    RefreshData();
}

void Unsubscribe()
{
    if (_token !is null)
    {
        _token.Unsubscribe();
        @_token = null;
    }
}
```

*Last updated: 15 March 2026*
