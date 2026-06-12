---
name: ui-ux-standard
description: Reference for building consistent, theme-safe workflows in VIM Flex. Covers the color system, typography, controls, layout, and data display patterns sourced from the production codebase (CardUtils.as, Card.as, Style namespace, widget library). Use when building or reviewing VIM Flex UI.
---

# VIM Flex UI/UX Standard

Reference for building consistent, theme-safe workflows in VIM Flex.
All patterns sourced from the production codebase (CardUtils.as, Card.as, Style namespace, widget library).

---

## 1. Color System

### 1.1 Theme-Aware Text Colors

VIM Flex supports Light and Dark themes. **Never hardcode text colors.** Use the theme-aware accessor functions from `CardUtils.as`:

| Function | Purpose | Light Mode RGB | Dark Mode RGB |
|----------|---------|---------------|--------------|
| `CardTextPrimary()` | Headlines, values, high-contrast text | `(20, 25, 40)` | `(232, 236, 244)` |
| `CardTextSecondary()` | Descriptions, subtitles, supporting text | `(70, 80, 100)` | `(136, 146, 168)` |
| `CardTextDim()` | Disabled text, hints, labels, metadata | `(100, 110, 135)` | `(80, 88, 112)` |
| `CardBorder()` | Lines, separators, panel borders | `(195, 200, 215)` | `(37, 42, 56)` |

**Usage:**
```angelscript
// Primary text (titles, values)
ImGui::PushStyleColor(ImGuiCol::ImGuiCol_Text, CardTextPrimary());
ImGui::Text("Model Summary");
ImGui::PopStyleColor();

// Secondary text (descriptions)
ImGui::PushStyleColor(ImGuiCol::ImGuiCol_Text, CardTextSecondary());
ImGui::TextWrapped("This report covers all physical elements.");
ImGui::PopStyleColor();

// Dim text (labels, hints)
ImGui::PushStyleColor(ImGuiCol::ImGuiCol_Text, CardTextDim());
ImGui::Text("Last updated: Jan 15");
ImGui::PopStyleColor();

// Quick disabled text (auto-dims in both themes)
ImGui::TextDisabled("No data available");
```

### 1.2 Theme Detection

```angelscript
if (Style::IsLightColorTheme())
    // light-specific logic
else
    // dark-specific logic
```

### 1.3 Style Namespace Colors (All Theme-Aware)

Every `Style::GetColor*()` function automatically returns the correct color for the active theme. You never need to check `IsLightColorTheme()` when using these.

**Text colors:**

| Function | Use For |
|----------|---------|
| `Style::GetColorText()` | Standard body text |
| `Style::GetColorTextTitle()` | Title/heading text |
| `Style::GetColorTextSection()` | Section header text |
| `Style::GetColorTextError()` | Error messages (red tone) |
| `Style::GetColorTextPositive()` | Success indicators (green tone) |

**Interactive colors:**

| Function | Use For |
|----------|---------|
| `Style::GetColorAction()` | Interactive elements, links, active state |
| `Style::GetColorActionText()` | Text on interactive/action elements |
| `Style::GetColorActionHover()` | Hover state |
| `Style::GetColorActionActive()` | Pressed state |
| `Style::GetColorActionInactive()` | Disabled interactive elements |
| `Style::GetColorDisabled()` | Disabled controls |

**Surface colors:**

| Function | Use For |
|----------|---------|
| `Style::GetColorFrame()` | Card/panel background fill |
| `Style::GetColorBackground()` | Window/viewport background |
| `Style::GetColorHeader()` | Header background |
| `Style::GetColorHeaderHover()` | Header hover state |
| `Style::GetColorHeaderActive()` | Header active/selected (e.g., TreeTable selected row) |
| `Style::GetColorBorder()` | Borders, separator lines |

**Priority order for choosing colors:**
1. **`Style::GetColor*()`** - use first, covers most UI needs
2. **`CardText*()` / `CardBorder()`** - for card-specific text hierarchy
3. **`CARD_*` accent constants** - for data visualization, charts, severity
4. **`Style::IsLightColorTheme()` ternary** - only for custom colors not covered above

### 1.4 Accent Palette (7 Named Colors)

These are **static** (same in both themes) and designed for sufficient contrast in both modes:

| Constant | Hex | RGB | Use |
|----------|-----|-----|-----|
| `CARD_BLUE` | `#4A90D9` | `(74, 144, 217)` | Default accent, primary metrics |
| `CARD_CYAN` | `#38BDF8` | `(56, 189, 248)` | Secondary data series |
| `CARD_TEAL` | `#2DD4BF` | `(45, 212, 191)` | Success, low severity |
| `CARD_AMBER` | `#F59E0B` | `(245, 158, 11)` | Warning, medium severity |
| `CARD_ROSE` | `#F43F5E` | `(244, 63, 94)` | Error, high severity |
| `CARD_VIOLET` | `#8B5CF6` | `(139, 92, 246)` | Tertiary accent |
| `CARD_EMERALD` | `#34D399` | `(52, 211, 153)` | Positive delta, on-track |

**Cycling through palette** for charts with many series:
```angelscript
color c = CardPaletteColor(seriesIndex);  // cycles through 15 extended colors
```

**Alpha helper** (adjust opacity of any accent):
```angelscript
color semiTransparent = CardAlpha(CARD_BLUE, 80);  // 80/255 opacity
```

### 1.5 Severity Colors

| Severity | Constant | Color |
|----------|----------|-------|
| High | `CARD_SEVERITY_HIGH` | Rose `#F43F5E` |
| Medium | `CARD_SEVERITY_MEDIUM` | Amber `#F59E0B` |
| Low | `CARD_SEVERITY_LOW` | Teal `#2DD4BF` |

```angelscript
color sevColor = GetCardSeverityColor(CARD_SEVERITY_HIGH);
string sevLabel = GetCardSeverityLabel(CARD_SEVERITY_HIGH);  // "HIGH PRIORITY"
```

---

## 2. Typography

### 2.1 Font Hierarchy

All fonts accessed via `Style::Get*()` - never instantiate fonts directly.

| Function | Weight | Use |
|----------|--------|-----|
| `Style::GetFontSmall()` | Regular | Captions, fine print |
| `Style::GetFontRegular()` | Regular | Body text (default) |
| `Style::GetFontRegularLarge()` | Regular | Emphasized body text |
| `Style::GetFontBoldSmall()` | **Bold** | Bold captions |
| `Style::GetFontBold()` | **Bold** | Labels, emphasis |
| `Style::GetFontBoldLarge()` | **Bold** | Card titles, stat values, section headers |
| `Style::GetFontIconSmall()` | Icon | Small icons (Segoe MDL2) |
| `Style::GetFontIconRegular()` | Icon | Standard icons |
| `Style::GetFontIconLarge()` | Icon | Prominent icons |

### 2.2 Font Usage Pattern

```angelscript
// Section header
ImGui::PushFont(Style::GetFontBoldLarge());
ImGui::Text("Element Summary");
ImGui::PopFont();

// Body text - no PushFont needed, uses default regular font

// Small caption
ImGui::PushFont(Style::GetFontSmall());
ImGui::TextDisabled("Updated 2 minutes ago");
ImGui::PopFont();
```

**Rule:** Every `PushFont` must have a matching `PopFont`. Forgetting `PopFont` corrupts the font stack for the rest of the frame.

### 2.3 Text Rendering Functions

| Function | Behavior |
|----------|----------|
| `ImGui::Text(s)` | Single line, no wrap, clips at window edge |
| `ImGui::TextWrapped(s)` | Multi-line, wraps at available width |
| `ImGui::TextDisabled(s)` | Auto-dimmed in both themes (use for secondary info) |
| `ImGui::CalcTextSize(s, false, wrapWidth)` | Measure text before rendering (for layout math) |

### 2.4 Section Headers

Use the `CardSectionHeader` function for consistent section styling:

```angelscript
CardSectionHeader("Fire Rating Status", CARD_ROSE);
// Renders: [colored dot] BOLD TITLE
//          ----------------------------
```

Pattern: colored dot + bold large text + thin separator line + spacing below.

---

## 3. Controls

### 3.1 Checkboxes

```angelscript
bool newVal = currentVal;
if (ImGui::Checkbox("Show Grid", currentVal, newVal))
{
    currentVal = newVal;
}
```

Note: ImGui uses a 3-parameter pattern - `label`, input `value`, output `valueOut`. Returns `true` when the state changes.

### 3.2 Toggle Buttons

```angelscript
VimFlex::ToggleButton("Loop", _loopPlayback);
```

Visually distinct from checkboxes - appears as a highlighted button when active.

### 3.3 Dropdowns / Combos

**Simple dropdown:**
```angelscript
if (ImGui::BeginCombo("Theme", currentThemeName))
{
    for (uint i = 0; i < options.length(); i++)
    {
        if (ImGui::Selectable(options[i], i == selectedIndex))
            selectedIndex = i;
    }
    ImGui::EndCombo();
}
```

### 3.4 Buttons

| Function | Style | Use |
|----------|-------|-----|
| `VimFlex::ButtonPrimary(label, enabled, size)` | Blue filled | Primary actions: Run, Save, Apply |
| `VimFlex::ButtonSecondary(label, enabled)` | Gray outline | Secondary actions: Cancel, Close, Reset |
| `VimFlex::IconButtonPrimary(icon, enabled, size)` | Blue icon | Icon-only primary action |
| `VimFlex::IconButtonTransparent(icon, color, enabled, size, tooltip)` | No background | Toolbar icons, inline actions |

**Sizing:**
```angelscript
float2(-1, 0)    // full width, auto height
float2(100, 0)   // fixed 100px width
float2(0, 0)     // auto-size to content
```

### 3.5 Input Fields

**Sliders** (constrained range):
```angelscript
float outVal = currentVal;
if (ImGui::SliderFloat("Opacity", currentVal, outVal, 0.0f, 1.0f))
    currentVal = outVal;
```

### 3.6 Collapsing Headers

```angelscript
if (ImGui::CollapsingHeader("Advanced Settings"))
{
    // Content shown when expanded
}
```

Use `ImGui::SetNextItemOpen(true, ImGuiCond::ImGuiCond_Always)` to programmatically expand/collapse.

---

## 4. Layout and Spacing

### 4.1 Spacing Constants

| Constant | Use |
|----------|-----|
| `Style::SpacingSmall` | Tight gaps, icon margins |
| `Style::SpacingRegular` | Inline spacing, control gaps |
| `Style::SpacingLarge` | Section padding, card margins |
| `Style::SpacingVeryLarge` | Major section breaks |

### 4.2 Vertical Spacing Helpers

```angelscript
Style::VSpaceSmall();
Style::VSpace();
Style::VSpaceLarge();
Style::VSpaceVeryLarge();
```

### 4.3 Horizontal Spacing Helpers

```angelscript
Style::HSpaceSmall();
Style::HSpace();
Style::HSpaceLarge();
```

### 4.4 Inline Layout

```angelscript
ImGui::Text("Label:");
ImGui::SameLine(0, 8);
ImGui::Text(value);
```

### 4.5 Card Defaults

From `Card.as` base class:

| Property | Default | Notes |
|----------|---------|-------|
| `paddingX` | `Style::SpacingLarge` | Horizontal content padding |
| `paddingY` | `Style::SpacingLarge` | Vertical content padding |
| `rounding` | `8.0f` | Corner radius |
| `borderThickness` | `1.0f` | Border width (0 = no border) |
| `glowEnabled` | `true` | Subtle glow effect |
| `glowOnHover` | `true` | Glow only on mouse hover |

---

## 5. Data Display

### 5.1 Number Formatting

| Function | Input | Output |
|----------|-------|--------|
| `CardFormatInt(1234567)` | `int` | `"1,234,567"` |
| `CardFormatFloat(3.14159, 2)` | `float, decimals` | `"3.14"` |
| `CardFormatPercent(85.5, 1)` | `float, decimals` | `"85.5%"` |

**Always use these** for user-facing numbers. Never display raw unformatted integers or floats.

### 5.2 StatCard Pattern

The standard way to show a prominent metric:

```angelscript
StatCard@ card = StatCard();
card.label = "Total Elements";
card.value = CardFormatInt(elementCount);
card.detail = "Physical-Visible only";
card.accentColor = CARD_BLUE;
```

Visual layout:
```
+-- [accent bar] --------------------+
| Total Elements  (dim)              |
| 14,125          (bold, blue)       |
| Physical-Visible only (dim)        |
+------------------------------------+
```

### 5.3 DataTable Pattern

For tabular data with inline bar charts:

```
+ CATEGORY ------ COUNT -- SHARE -- DISTRIBUTION -+
| Walls          1,234    35.2%    xxxxxxxxx--     |
| Doors            892    25.5%    xxxxxxx----     |
| Windows          654    18.7%    xxxxx------     |
+--------------------------------------------------+
```

- Header row: dim text (`CardTextDim()`)
- Data rows: label in primary, numbers in default, percentage colored by accent
- Bar fill: `CardAlpha(accentColor, 80)` for background, full accent for fill

---

## 6. Do / Don't Quick Reference

### Colors

| Do | Don't |
|----|-------|
| `CardTextPrimary()` for headlines | `color(255, 255, 255)` hardcoded white |
| `CardTextDim()` for labels | `color(128, 128, 128)` hardcoded gray |
| `CARD_ROSE` for errors | `color(255, 0, 0)` raw red |
| `Style::GetColorAction()` for links | Inline hex colors |
| `CardAlpha(accent, 80)` for transparency | Manual alpha math |

### Typography

| Do | Don't |
|----|-------|
| `Style::GetFontBoldLarge()` for titles | Hardcode pixel sizes |
| `ImGui::TextDisabled()` for secondary text | `PushStyleColor` with hardcoded gray |
| `ImGui::TextWrapped()` for long text | `Text()` that clips at edges |
| Always `PopFont()` after `PushFont()` | Leave unpaired push/pop |

### Controls

| Do | Don't |
|----|-------|
| `VimFlex::ButtonPrimary()` for actions | Raw `ImGui::Button()` with manual styling |
| `ImGui::ListClipper` for long lists | Render 1000+ items without virtualization |
| `ImGui::PushID()` for repeated controls | Duplicate widget IDs (causes click conflicts) |

### Layout

| Do | Don't |
|----|-------|
| `Style::SpacingLarge` for padding | `16` as magic number |
| `Style::VSpaceSmall()` for gaps | `ImGui::Dummy(float2(0, 8))` with magic number |
| `Style::Rounding` for corner radius | `8.0f` hardcoded |
| `VimFlex::DpiScale` for custom drawing | Assume 1x DPI scale |

### Data

| Do | Don't |
|----|-------|
| `CardFormatInt()` for display counts | Show raw `"14125"` |
| `CardFormatPercent()` for ratios | Manual string concat `"" + pct + "%"` |
