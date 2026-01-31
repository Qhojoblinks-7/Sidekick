Created [`docs/DASHBOARD_REDESIGN.md`](docs/DASHBOARD_REDESIGN.md) with the complete dashboard redesign specifications:

## Document Contents

### Overview
The redesign focuses on three key areas to improve information hierarchy and rider experience:

1. **Hero Section** - Consolidated metrics with single Net Profit focus
2. **Platform Health** - Visual debt monitoring with progress rings
3. **Trip History** - Platform-branded transactions with net profit display

### Key Features Documented

| Section | Current | Proposed | Impact |
|---------|---------|----------|--------|
| Metrics Display | 6 cards | 1 large + 2 pills | -66% visual elements |
| Debt Monitoring | Text cards | Progress rings | Visual risk indication |
| Trip List | Icons + gross | Borders + net | Clearer value perception |

### Visual Mockup Included
```
+------------------------------------------+
|  Jan 31, 2026                 [Today ⌵]  |
+------------------------------------------+
|             DAILY NET PROFIT             |
|              GH₵ 140.00                  |  <-- Huge, Bold
|      Income: 205.00 | Expenses: 65.00     |
+------------------------------------------+
|  [||||||||||||| 60% of Goal |||      ]   |
+------------------------------------------+
|      PLATFORM STATUS (DEBT LIMIT)        |
|    ( 60% ) Bolt           ( 15% ) Yango  |
|    GH₵ 10.00              GH₵ 15.00      |
+------------------------------------------+
|  [B] Bolt Food  • 10:20 AM    +GH₵ 22.00 |
|  [Y] Yango Del. • 09:45 AM    +GH₵ 18.00 |
+------------------------------------------+
```

### Implementation Phases
- Phase 1: Hero Section consolidation
- Phase 2: Platform Health progress rings
- Phase 3: Trip History improvements