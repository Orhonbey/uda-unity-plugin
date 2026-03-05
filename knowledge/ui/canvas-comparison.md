---
title: UI System Comparison
since: "2021.1"
stable: "2022.2"
deprecated_alternatives: []
unity_docs:
  - https://docs.unity3d.com/6000.0/Documentation/Manual/UIToolkitsComparison.html
api_refs:
  - class: Canvas
    namespace: UnityEngine
    url: https://docs.unity3d.com/6000.0/Documentation/ScriptReference/Canvas.html
  - class: UIDocument
    namespace: UnityEngine.UIElements
    url: https://docs.unity3d.com/6000.0/Documentation/ScriptReference/UIElements.UIDocument.html
last_verified: "2026-03-05"
---

# UI System Comparison

## Overview

Unity offers two primary UI systems: **UI Toolkit** (modern, web-tech based) and **uGUI** (Canvas-based, traditional). Choosing the right system depends on your project requirements, Unity version, team expertise, and specific use cases.

## Decision Matrix

| Feature | UI Toolkit | uGUI (Canvas) |
|---------|------------|---------------|
| **Runtime Support** | 2021.1+ (stable 2022.2+) | All Unity versions |
| **Performance** | Excellent for complex UIs | Good, can degrade with complexity |
| **World Space UI** | Limited support | Full support |
| **Learning Curve** | Moderate (web/CSS knowledge helps) | Unity-specific concepts |
| **Visual Editor** | UI Builder (dedicated tool) | In-Scene editing |
| **Styling System** | USS (CSS-like) | Component-based |
| **Animation** | USS transitions, limited | Full Animator integration |
| **Asset Store Assets** | Growing ecosystem | Extensive library |
| **Editor Extensions** | Native, excellent | Limited/awkward |
| **Text Rendering** | TextCore (sharp at all sizes) | TextMeshPro (required for quality) |
| **Data Binding** | Built-in (Unity 6+) | Requires custom implementation |
| **Layout System** | Flexbox-based | RectTransform anchors |

## Detailed Comparison

### Performance

**UI Toolkit Advantages:**
- Retained-mode rendering (batched automatically)
- GPU-based rendering for most elements
- Better handling of large, complex UIs
- No Canvas rebuild overhead

**uGUI Advantages:**
- Immediate-mode for simple UIs can be faster
- More predictable performance characteristics
- Better for small UI counts

### World Space UI

**UI Toolkit:**
- Panel Renderer supports world space (2023.1+)
- Limited compared to uGUI
- Best for simple world-space elements

**uGUI:**
- Full world space support with Screen Space - Overlay, Screen Space - Camera, World Space
- Essential for in-game displays, nameplates, interactive world UI

### Development Workflow

**UI Toolkit:**
```
1. Design layout in UI Builder
2. Write UXML structure
3. Create USS stylesheets
4. Write C# controller
5. Wire logic in code
```

**uGUI:**
```
1. Create Canvas in scene
2. Add UI elements as GameObjects
3. Configure RectTransforms
4. Add components/scripts
5. Wire in Inspector or code
```

## Recommendations

### Choose UI Toolkit When:
- Starting a new project with Unity 2022.2+
- Building complex menu systems, inventories, HUDs
- Need consistent styling across many UI screens
- Want better separation of layout/style/logic
- Building Editor tools or extensions
- Team has web/CSS experience
- Performance of complex UIs is critical

### Choose uGUI (Canvas) When:
- Working on existing uGUI project
- Need extensive world-space UI
- Heavy use of animation/Animator
- Relying on specific Asset Store packages
- Team already proficient with uGUI
- Need features not yet in UI Toolkit

## Migration Notes

### No Automatic Migration
There is **no automatic conversion tool** between uGUI and UI Toolkit. Migration requires manual recreation:

1. Rebuild layouts in UI Builder
2. Convert component logic to UQuery-based controllers
3. Replace UnityEvents with C# events or new patterns
4. Recreate animations using USS transitions

### Gradual Migration Strategy
- Keep existing uGUI for stable features
- Use UI Toolkit for new screens/panels
- Gradually replace uGUI components
- Maintain both systems during transition period

## Version-Specific Considerations

### Unity 2021.1 - 2022.1
- UI Toolkit runtime support is experimental
- Limited feature set
- Consider uGUI for production

### Unity 2022.2+
- UI Toolkit runtime support is stable
- Recommended for new projects
- Feature parity sufficient for most games

### Unity 6 (6000.0+)
- Data binding system
- Enhanced runtime support
- World space improvements
- Best version for UI Toolkit adoption

## Quick Decision Guide

```
New project (2022.2+)?
├── Yes → UI Toolkit (unless world-space heavy)
└── No → Continue below

Heavy world-space UI needs?
├── Yes → uGUI
└── No → Continue below

Existing uGUI codebase?
├── Yes → Stick with uGUI or gradual migration
└── No → UI Toolkit
```

## Summary

Both systems are viable and officially supported. UI Toolkit represents Unity's future direction but uGUI remains fully supported. For new projects starting with Unity 2022.2 or later, UI Toolkit is generally recommended unless you have specific requirements that only uGUI fulfills.
