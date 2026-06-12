---
name: camera-views
description: Manipulate cameras and create 2D views in VIM Flex. Use when setting up plan views, section cuts, or controlling viewport cameras programmatically.
---

# Camera and View Manipulation in VIM Flex

## Overview

This skill covers:
1. Reading Revit view data from VIM files
2. Manipulating VIM Flex camera programmatically
3. Creating 2D plan views (orthographic top-down with section cut)
4. Section box / clipping planes

## VIM Database: View Data (VERIFIED)

### Camera Elements (Category = 'Cameras')

VIM stores Revit 3D views as Camera elements:

```sql
-- List all cameras/3D views
SELECT e."index", e.name, e.familyName, e.familyTypeName
FROM Elements e
JOIN Categories c ON e.categoryIndex = c.index
WHERE c.name = 'Cameras'
```

Example output:
| index | name | familyName | familyTypeName |
|-------|------|------------|----------------|
| 66 | {3D} | 3D View | WK - Working |
| 15313 | {3D - gavin-bimguru} | 3D View | WK - Working |

### Camera Parameters

```sql
-- Get camera position data
SELECT e.name, pd.name as param, p.value
FROM Elements e
JOIN Categories c ON e.categoryIndex = c.index
JOIN Parameters p ON p.elementIndex = e."index"
JOIN ParameterDescriptors pd ON p.parameterDescriptorIndex = pd.index
WHERE c.name = 'Cameras'
AND pd.name IN ('Eye Elevation', 'Target Elevation', 'Projection Mode')
```

**Key Parameters:**
| Parameter | Example Value | Notes |
|-----------|---------------|-------|
| Projection Mode | `0\|Orthographic` | 0=Orthographic, 1=Perspective |
| Eye Elevation | `35.67\|10874` | Raw feet \| Display mm |
| Target Elevation | `20.63\|6288` | Look-at point Z |
| Camera Position | `0\|Adjusting` | Position mode |

### View Elements (Category = 'Views')

```sql
SELECT e."index", e.name, pd.name, p.value
FROM Elements e
JOIN Categories c ON e.categoryIndex = c.index
JOIN Parameters p ON p.elementIndex = e."index"
JOIN ParameterDescriptors pd ON p.parameterDescriptorIndex = pd.index
WHERE c.name = 'Views'
```

**View Parameters Available:**
| Parameter | Example Value | Notes |
|-----------|---------------|-------|
| Section Box | `1\|Yes` | Section box active |
| Far Clip Offset | `1000\|304800` | Far clip in feet |
| View Scale | `100\| 1 : 100` | Scale factor |
| Crop View | `0\|No` | Crop region active |
| Detail Level | `2\|Medium` | Coarse/Medium/Fine |
| Projection Mode | `0\|Orthographic` | Projection type |
| Eye Elevation | `697.8\|212694` | Camera Z position |
| Target Elevation | `12.94\|3944` | Look-at Z |

### Levels Table (for plan view elevation)

```sql
SELECT "index", name, elevation FROM Levels ORDER BY elevation
```

**Example (Hospital model):**
| index | name | elevation (ft) |
|-------|------|----------------|
| 0 | Ground Floor | 0.0 |
| 1 | Level 1 | 12.47 |
| 2 | Level 2 | 24.11 |
| 3 | Roof Level | 35.76 |

## VIM Flex Camera API

### CameraComponent

```angelscript
// Get camera from AppScene
auto@ camera = _appScene.GetCamera();

// Camera state object controls position/orientation
auto@ state = Scene::Components::CameraState();
camera.SetStateObject(state);
```

### CameraState Properties (TODO: Verify exact API)

```angelscript
Scene::Components::CameraState@ state;

// Properties to investigate:
// state.position     - float3 camera position
// state.target       - float3 look-at point
// state.up           - float3 up vector
// state.fov          - float field of view (for perspective)
// state.orthographic - bool (true for 2D view)
// state.orthoSize    - float (orthographic zoom)
```

### SceneViewComponent

```angelscript
auto@ sceneView = _appScene.GetSceneViewComponent();

// Frame to bounding box
sceneView.FrameAABB(aabb, animationDuration);

// Frame selection
sceneView.FrameSceneItems(itemSet);
```

### Framing and Visibility

```angelscript
// InteractionService is the correct high-level API for isolation/visibility.
// It handles ghost mode, auto-sections, room elements, and state management correctly.
auto@ interaction = _appScene.GetInteractionService();

// Frame all elements
interaction.FrameAll();

// Frame current selection
interaction.FrameSelection();

// Show all (reset visibility / isolation)
interaction.ShowAll();

// Hide current selection
interaction.HideSelection();

// Isolate current selection (hide everything else)
interaction.IsolateSelection();

// Toggle auto-isolate behavior
interaction.SetAutoIsolate(true);
bool autoIsolate = interaction.GetAutoIsolate();

// State queries
bool hasSel = interaction.HasSelection();
bool allVisible = interaction.IsAllVisible();
bool selHidden = interaction.IsSelectionHidden();
```

## Creating a 2D Plan View

### Concept

A plan view in Revit:
1. Camera looks **straight down** (-Z direction)
2. Camera uses **orthographic** projection (no perspective)
3. **Cut plane** typically 4' (1.2m) above floor level
4. Only elements **below cut plane** are fully visible
5. Elements **above cut plane** are hidden or shown dashed

### Implementation Strategy

```angelscript
void SetPlanView(float levelElevation, float cutOffset = 5.0f)
{
    auto@ camera = _appScene.GetCamera();

    // Get model bounds from VIM data
    // Use: _appScene.GetVimDataService().GetGlobalBoundingBox(true)
    // or query Elements: SELECT MIN(location_x), MAX(location_x), ... FROM Elements WHERE domain='Physical-Visible'
    float3 modelMin, modelMax;
    GetModelBounds(modelMin, modelMax);

    // Camera position: high above, looking straight down
    float cutHeight = levelElevation + cutOffset;  // 5' above level
    float3 cameraPos = float3(
        (modelMin.x + modelMax.x) / 2,  // center X
        (modelMin.y + modelMax.y) / 2,  // center Y
        cutHeight + 1000.0f  // high above for orthographic
    );

    // Look at: center of level plane
    float3 target = float3(
        (modelMin.x + modelMax.x) / 2,
        (modelMin.y + modelMax.y) / 2,
        cutHeight
    );

    // Up vector: Y+ (project north up)
    float3 up = float3(0, 1, 0);

    // TODO: Set camera position/orientation
    // TODO: Enable orthographic mode
    // TODO: Set clipping plane at cutHeight
}
```

### Section Box / Clipping (TODO: Find API)

```angelscript
// Option 1: VisibilityService
auto@ visibility = _appScene.GetVisibilityService();
// visibility.SetClipPlane(normal, distance)?
// visibility.SetSectionBox(aabb)?

// Option 2: RenderSettings
auto@ renderSettings = _appScene.GetRenderSettingsService();
// renderSettings.SetClipPlane(...)?

// Option 3: SceneViewComponent
auto@ sceneView = _appScene.GetSceneViewComponent();
// sceneView.SetClipPlane(...)?
```

## 2D View Workflow Plugin

### UI Concept

```
┌─────────────────────────────────────────────────────────┐
│ 2D PLAN VIEW                                             │
├─────────────────────────────────────────────────────────┤
│ Level: [▼ Ground Floor - 0'    ]                        │
│                                                          │
│ Cut Height: [  5.0  ] ft above level                    │
│                                                          │
│ [Apply Plan View]  [Reset to 3D]  [Frame Level]         │
├─────────────────────────────────────────────────────────┤
│ Active View: Plan @ Ground Floor + 5'                   │
│ Camera: (125.4, 89.2, 1005.0) looking at (125.4, 89.2, 5.0)│
└─────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Query Levels** from VIM database on Open
2. **Populate dropdown** with level names + elevations
3. **User selects level** → calculate cut height
4. **Apply Plan View**:
   - Position camera above model center
   - Set orthographic projection
   - Set clipping plane at cut height
   - Hide elements above cut
5. **Reset to 3D** → restore perspective, show all

## Files

| File | Purpose |
|------|---------|
| `SamplePlugins/PlanView/PlanViewPlugin.as` | Plugin registration |
| `SamplePlugins/PlanView/PlanViewView.as` | UI with level selector |
| `SamplePlugins/PlanView/PlanViewDataService.as` | Query levels, bounds |

## References

- `DesignCompare/DesignCompareViewport.as` - Independent viewport with camera
- `shared/ElementPreviewView.as` - Simple isolated element view
- `Example/ExampleChartView.as` - Custom scene with own camera

## Next Steps

1. **Research camera API** - Find exact methods for position/projection
2. **Research clipping API** - Find section plane/box methods
3. **Create proof-of-concept** - Simple level selector that isolates by level
4. **Add camera control** - Position camera for plan view

*Last updated: 15 March 2026*
