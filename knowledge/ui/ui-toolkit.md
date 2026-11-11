---
title: UI Toolkit
since: "2021.1"
stable: "2022.2"
deprecated_alternatives: []
unity_docs:
  - https://docs.unity3d.com/6000.0/Documentation/Manual/UIElements.html
api_refs:
  - class: VisualElement
    namespace: UnityEngine.UIElements
    url: https://docs.unity3d.com/6000.0/Documentation/ScriptReference/UIElements.VisualElement.html
  - class: UIDocument
    namespace: UnityEngine.UIElements
    url: https://docs.unity3d.com/6000.0/Documentation/ScriptReference/UIElements.UIDocument.html
  - class: UQueryBuilder<T>
    namespace: UnityEngine.UIElements
    url: https://docs.unity3d.com/6000.0/Documentation/ScriptReference/UIElements.UQueryBuilder_1.html
last_verified: "2026-03-05"
---

# UI Toolkit

## Overview

UI Toolkit is Unity's modern UI system using web technologies (UXML for layout, USS for styling). It offers superior performance for complex UIs, better separation of concerns, and a more flexible styling system compared to uGUI. Runtime support was added in 2021.1 and stabilized in 2022.2.

## Key Concepts

### UXML (Unity XML)
Declarative markup for UI layout. Similar to HTML with VisualElements instead of divs.

### USS (Unity Style Sheets)
CSS-inspired styling system with selectors, properties, and variables.

### VisualElement
Base class for all UI Toolkit elements. Everything in the hierarchy is a VisualElement.

### UIDocument
Component that renders UI Toolkit in a scene. Attached to a GameObject.

### UQuery
System for finding elements in the hierarchy, similar to DOM queries.

## Code Examples

### Basic UXML Document

```xml
<?xml version="1.0" encoding="utf-8"?>
<UXML xmlns:ui="UnityEngine.UIElements" xmlns:uie="UnityEditor.UIElements">
    <ui:VisualElement name="root" class="main-container">
        <ui:VisualElement name="header" class="header">
            <ui:Label name="title-label" text="Main Menu" class="title" />
        </ui:VisualElement>
        
        <ui:VisualElement name="content" class="content">
            <ui:Button name="start-button" text="Start Game" class="menu-button primary" />
            <ui:Button name="settings-button" text="Settings" class="menu-button" />
            <ui:Button name="quit-button" text="Quit" class="menu-button" />
        </ui:VisualElement>
        
        <ui:VisualElement name="footer" class="footer">
            <ui:Label name="version-label" text="v1.0.0" class="version" />
        </ui:VisualElement>
    </ui:VisualElement>
</UXML>
```

### USS Stylesheet

```css
/* Variables */
:root {
    --primary-color: #4A90D9;
    --secondary-color: #2C3E50;
    --text-color: #FFFFFF;
    --bg-color: #1A1A1A;
    --button-hover: #5AA0E9;
    --spacing: 10px;
}

/* Main container */
.main-container {
    flex-grow: 1;
    background-color: var(--bg-color);
    flex-direction: column;
    padding: var(--spacing);
}

/* Header */
.header {
    height: 80px;
    background-color: var(--secondary-color);
    justify-content: center;
    align-items: center;
    margin-bottom: var(--spacing);
}

.title {
    font-size: 32px;
    color: var(--text-color);
    -unity-font-style: bold;
}

/* Content area */
.content {
    flex-grow: 1;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 20px;
}

/* Buttons */
.menu-button {
    width: 200px;
    height: 50px;
    margin: 5px;
    background-color: var(--secondary-color);
    color: var(--text-color);
    font-size: 18px;
    border-radius: 5px;
    border-width: 0;
}

.menu-button:hover {
    background-color: var(--button-hover);
    scale: 1.05;
    transition: all 0.2s;
}

.menu-button.primary {
    background-color: var(--primary-color);
}

.menu-button.primary:hover {
    background-color: var(--button-hover);
}

/* Footer */
.footer {
    height: 40px;
    justify-content: flex-end;
    align-items: center;
}

.version {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
}
```

### C# Controller

```csharp
using UnityEngine;
using UnityEngine.UIElements;

[RequireComponent(typeof(UIDocument))]
public class MainMenuController : MonoBehaviour
{
    private UIDocument _document;
    
    // Cached element references
    private Button _startButton;
    private Button _settingsButton;
    private Button _quitButton;
    private Label _versionLabel;

    private void Awake()
    {
        _document = GetComponent<UIDocument>();
    }

    private void OnEnable()
    {
        // Get root visual element
        var root = _document.rootVisualElement;
        
        // Query elements by name
        _startButton = root.Q<Button>("start-button");
        _settingsButton = root.Q<Button>("settings-button");
        _quitButton = root.Q<Button>("quit-button");
        _versionLabel = root.Q<Label>("version-label");
        
        // Register event callbacks
        _startButton?.RegisterCallback<ClickEvent>(OnStartClicked);
        _settingsButton?.RegisterCallback<ClickEvent>(OnSettingsClicked);
        _quitButton?.RegisterCallback<ClickEvent>(OnQuitClicked);
        
        // Alternative: RegisterValueChangedCallback for input fields
        // _inputField?.RegisterValueChangedCallback(OnInputChanged);
        
        // Initialize values
        if (_versionLabel != null)
        {
            _versionLabel.text = $"v{Application.version}";
        }
    }

    private void OnDisable()
    {
        // Unregister callbacks to prevent memory leaks
        _startButton?.UnregisterCallback<ClickEvent>(OnStartClicked);
        _settingsButton?.UnregisterCallback<ClickEvent>(OnSettingsClicked);
        _quitButton?.UnregisterCallback<ClickEvent>(OnQuitClicked);
    }

    private void OnStartClicked(ClickEvent evt)
    {
        Debug.Log("Start Game clicked!");
        // Load game scene
    }

    private void OnSettingsClicked(ClickEvent evt)
    {
        Debug.Log("Settings clicked!");
        // Show settings panel
    }

    private void OnQuitClicked(ClickEvent evt)
    {
        Debug.Log("Quit clicked!");
        Application.Quit();
    }
}
```

### Advanced Query Patterns

```csharp
public class HUDController : MonoBehaviour
{
    private UIDocument _document;

    private void OnEnable()
    {
        var root = _document.rootVisualElement;
        
        // Query by class
        var allButtons = root.Query<Button>(className: "menu-button").ToList();
        
        // Query with hierarchy
        var contentButtons = root.Query<VisualElement>("content")
                                 .Children<Button>()
                                 .ToList();
        
        // Query by type only
        var allLabels = root.Query<Label>().ToList();
        
        // Query with index
        var firstButton = root.Query<Button>().AtIndex(0);
        
        // Query first match
        var healthBar = root.Q<ProgressBar>("health-bar");
        
        // Name contains pattern
        var buttons = root.Query<Button>().Where(btn => btn.name.Contains("menu-")).ToList();
    }
}
```

<!-- unity:6000.0+ -->

### Data Binding (Unity 6+)

```csharp
using UnityEngine;
using UnityEngine.UIElements;

public class BindingExample : MonoBehaviour
{
    [SerializeField] private PlayerData _playerData;
    private UIDocument _document;

    private void OnEnable()
    {
        var root = _document.rootVisualElement;
        
        // Get elements
        var healthLabel = root.Q<Label>("health-value");
        var healthBar = root.Q<ProgressBar>("health-bar");
        
        // Create binding
        healthLabel.dataSource = _playerData;
        healthLabel.dataSourcePath = new PropertyPath("Health");
        
        healthBar.dataSource = _playerData;
        healthBar.dataSourcePath = new PropertyPath("Health");
        healthBar.lowValue = 0;
        healthBar.highValue = _playerData.MaxHealth;
    }
}

// Data source class
public class PlayerData : MonoBehaviour, INotifyBindablePropertyChanged
{
    private float _health;
    
    public float Health
    {
        get => _health;
        set
        {
            if (_health != value)
            {
                _health = value;
                PropertyChanged?.Invoke(this, 
                    new BindablePropertyChangedEventArgs(nameof(Health)));
            }
        }
    }
    
    public float MaxHealth { get; set; } = 100f;
    
    public event System.EventHandler<BindablePropertyChangedEventArgs> PropertyChanged;
}
```

<!-- /unity -->

### Dynamic Element Creation

```csharp
public class DynamicListController : MonoBehaviour
{
    [SerializeField] private VisualTreeAsset _listItemTemplate;
    private UIDocument _document;
    private VisualElement _listContainer;

    private void OnEnable()
    {
        var root = _document.rootVisualElement;
        _listContainer = root.Q<VisualElement>("list-container");
        
        // Populate list dynamically
        PopulateList(new[] { "Item 1", "Item 2", "Item 3" });
    }

    private void PopulateList(string[] items)
    {
        _listContainer.Clear();
        
        foreach (var item in items)
        {
            // Instantiate from template
            var listItem = _listItemTemplate.Instantiate();
            
            // Get and set elements
            var label = listItem.Q<Label>("item-label");
            if (label != null)
            {
                label.text = item;
            }
            
            var button = listItem.Q<Button>("item-button");
            if (button != null)
            {
                var capturedItem = item; // Capture for closure
                button.clicked += () => OnItemClicked(capturedItem);
            }
            
            _listContainer.Add(listItem);
        }
    }

    private void OnItemClicked(string item)
    {
        Debug.Log($"Clicked: {item}");
    }
}
```

## Best Practices

- **Separate UXML/USS/C#**: Keep layout, styling, and logic in separate files.
- **Use BEM naming**: Block-Element-Modifier convention for class names (`.menu-button--primary`).
- **Q<T>() for queries**: Use generic `Query<T>("name")` for type-safe element access.
- **Cache queries**: Query elements once in OnEnable, not every frame.
- **Unregister callbacks**: Always unregister in OnDisable to prevent memory leaks.
- **Use USS variables**: Define colors/sizes in `:root` for consistent theming.

## Common Mistakes

| Mistake | Problem | Solution |
|---------|---------|----------|
| Querying before attached | Null reference | Query in OnEnable or after document is ready |
| Not unregistering callbacks | Memory leaks | Always unregister in OnDisable |
| USS specificity issues | Styles not applying | Use more specific selectors or `!important` |
| Not using classes for styling | Inline styles hard to maintain | Use USS classes |
| Forgetting UIDocument | UI doesn't render | Add UIDocument component to GameObject |
| Modifying elements after disable | Changes don't persist | Modify before disabling |

## UI Toolkit vs uGUI

| Feature | UI Toolkit | uGUI |
|---------|------------|------|
| Performance | Better for complex UIs | Fine for simple UIs |
| Learning curve | Web tech knowledge helps | Unity-specific |
| Runtime support | 2021.1+ (stable 2022.2+) | All versions |
| World space | Limited | Full support |
| Asset Store | Growing | Extensive |
| Animation | USS transitions | Animator |
