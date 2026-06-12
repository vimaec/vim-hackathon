# VIM Flex Agent Index

Quick reference for choosing the right agent for the task.

## Agent Selection Guide

### By User Question

| User Says... | Use Agent |
|--------------|-----------|
| "What's in my model?" | `first-look` |
| "Show me everything" | `first-look` → `safe-query` |
| "How many doors/walls?" | `bim-analyst` |
| "What's wrong with my model?" | `model-doctor` |
| "Why is my model slow?" | `model-doctor` |
| "What about my parameters?" | `parameter-auditor` |
| "How much will this cost?" | `quick-estimator` |
| "Compare these two models" | `model-comparator` |
| "What changed since last week?" | `model-comparator` |
| "Show me the clashes" | `model-comparator` |
| "Connect to Excel/PowerBI" | `data-connector` |
| "Make me a report" | `report-designer` |
| "Build me a plugin" | `plugin-builder` |
| "Add coloring to my tables" | `matrix-fixer` |
| "Upgrade this view to TreeTable" | `matrix-fixer` |
| "I don't understand BIM" | `explainer` |
| "What is a family/workset?" | `explainer` |

### By Task Type

#### 🔍 Discovery & Exploration
| Agent | Model | Use For |
|-------|-------|---------|
| `first-look` | haiku | Quick model overview for new users |
| `safe-query` | haiku | Any query that might return large data |
| `bim-analyst` | sonnet | Deep BIM data analysis with discovery questions |

#### 🏥 Health & Quality
| Agent | Model | Use For |
|-------|-------|---------|
| `model-doctor` | sonnet | Geometry health, performance, triangle counts |
| `parameter-auditor` | sonnet | Parameter quality, empty values, bloat |

#### 💰 Estimation & Quantities
| Agent | Model | Use For |
|-------|-------|---------|
| `quick-estimator` | sonnet | Rough cost estimates with regional pricing |

#### 🔄 Comparison & Coordination
| Agent | Model | Use For |
|-------|-------|---------|
| `model-comparator` | sonnet | Clash detection, version diffs, design options |

#### 📊 Reporting & Integration
| Agent | Model | Use For |
|-------|-------|---------|
| `data-connector` | sonnet | VIM ↔ Excel ↔ PowerBI data sync |
| `report-designer` | sonnet | ASCII mockups, iterative report design |

#### 🛠️ Development
| Agent | Model | Use For |
|-------|-------|---------|
| `plugin-builder` | sonnet | Create AngelScript plugins for VIM Flex |
| `debug-loop` | sonnet | WIGGUM autonomous compile-test-fix |
| `matrix-fixer` | sonnet | Upgrade deprecated DataTree/TreeWidget tables to TreeTable with column coloring |

#### 📚 Learning & Help
| Agent | Model | Use For |
|-------|-------|---------|
| `explainer` | haiku | Explain BIM concepts to non-technical users |
| `self-learner` | sonnet | Preserve learnings before context compaction |

## Agent Details

### Tier 1: Quick Responses (haiku)
Fast, cheap, for simple tasks.

- **`first-look`** - 10-second model overview
- **`safe-query`** - Count/summarize/paginate any query
- **`explainer`** - Plain-English BIM explanations

### Tier 2: Analysis (sonnet)
Deeper reasoning required.

- **`bim-analyst`** - General BIM queries with discovery
- **`model-doctor`** - Health check, performance audit
- **`parameter-auditor`** - Parameter quality analysis
- **`quick-estimator`** - Cost estimation with web search
- **`model-comparator`** - Multi-model comparison

### Tier 3: Integration (sonnet)
Cross-system workflows.

- **`data-connector`** - Sync data between systems
- **`report-designer`** - Design reports iteratively

### Tier 4: Development (sonnet)
Code generation and autonomy.

- **`plugin-builder`** - AngelScript plugin creation
- **`debug-loop`** - Autonomous debugging (WIGGUM)
- **`matrix-fixer`** - Upgrade deprecated DataTree/TreeWidget tables to TreeTable with heatmap coloring
- **`self-learner`** - Knowledge preservation

## Common Workflows

### New User Onboarding
```
1. first-look      → Quick overview
2. explainer       → Answer "what is X?" questions
3. bim-analyst     → Deeper exploration
```

### Model Quality Audit
```
1. model-doctor    → Overall health check
2. parameter-auditor → Deep parameter analysis
3. report-designer → Create issues report
```

### Cost Estimation Workflow
```
1. first-look      → Understand model scope
2. quick-estimator → Generate rough estimate
3. data-connector  → Export to Excel for refinement
```

### Report Creation
```
1. bim-analyst     → Explore data
2. report-designer → Design layout (ASCII mockups)
3. data-connector  → Connect to PowerBI
```

### Plugin Development
```
1. plugin-builder  → Create initial code
2. debug-loop      → Fix compile errors autonomously
3. self-learner    → Save patterns for next time
```

## Scale Guidelines

| Data Size | Recommended Approach |
|-----------|---------------------|
| < 1K rows | Direct query |
| 1K-10K rows | Use `safe-query`, summarize |
| 10K-100K rows | Aggressive summarization |
| 100K-1M rows | GROUP BY everything, never raw |
| 1M-100M rows | Parameter auditor patterns, extreme caution |

## Don't Use Wrong Agent

| Wrong Choice | Why | Better Choice |
|--------------|-----|---------------|
| `bim-analyst` for overview | Too slow for quick look | `first-look` |
| `first-look` for parameters | Not specialized | `parameter-auditor` |
| `model-doctor` for cost | Wrong domain | `quick-estimator` |
| `plugin-builder` for queries | Overkill | `bim-analyst` |

*Last updated: 15 March 2026*
