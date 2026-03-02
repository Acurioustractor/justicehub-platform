# JusticeHub Route and Process Diagrams (2026-02-25)

## 1) Route Domain Map
```mermaid
graph TD
  A["/"] --> B["Public Experience"]
  A --> C["Discovery"]
  A --> D["Intelligence"]
  A --> E["Narrative"]
  A --> F["Operations"]

  B --> B1["/about"]
  B --> B2["/how-it-works"]
  B --> B3["/contact"]
  B --> B4["/transparency"]

  C --> C1["/services"]
  C --> C2["/community-programs"]
  C --> C3["/community-map"]
  C --> C4["/organizations"]
  C --> C5["/people"]

  D --> D0["/intelligence"]
  D0 --> D1["/intelligence/dashboard"]
  D0 --> D2["/intelligence/interventions"]
  D0 --> D3["/intelligence/evidence"]
  D0 --> D4["/intelligence/research"]
  D0 --> D5["/intelligence/map"]
  D --> D6["/youth-justice-report"]

  E --> E1["/stories"]
  E --> E2["/blog"]
  E --> E3["/gallery"]
  E --> E4["/art-innovation"]

  F --> F1["/admin"]
  F1 --> F2["data-operations"]
  F1 --> F3["funding"]
  F1 --> F4["research"]
  F1 --> F5["signal-engine"]
  F1 --> F6["content-health"]
```

## 2) Request Lifecycle (Page -> API -> Data)
```mermaid
flowchart LR
  U["User"] --> P["Page Route"]
  P --> AP["/api/* Route"]
  AP --> S["Supabase Client"]
  S --> T["Tables/Views"]
  T --> AP
  AP --> P
  P --> U

  AP --> M["Middleware Controls"]
  M --> R1["Security Headers"]
  M --> R2["Rate Limits"]
  M --> R3["Suspicious Pattern Blocks"]
  M --> R4["Admin Access Gate"]
```

## 3) Operating Loop (Content + Evidence + Action)
```mermaid
flowchart TD
  I["Ingestion and Data Ops"] --> J["Admin QA and Curation"]
  J --> K["Public Discovery Routes"]
  J --> L["Intelligence Routes"]
  K --> M["User Action: find services, programs, support"]
  L --> N["Decision Action: funding, policy, practice"]
  M --> O["Stories and Outcomes Feedback"]
  N --> O
  O --> I
```

## 4) Key Route to API Flow Examples
```mermaid
flowchart LR
  A["/services"] --> B["/api/services"] --> C["services_complete"]
  D["/community-programs/[id]"] --> E["/api/programs/[id]"] --> F["programs_catalog_v"]
  G["/intelligence/dashboard"] --> H["/api/intelligence/global-stats"] --> I["alma_* tables"]
  J["/transparency"] --> K["/api/transparency"] --> L["detention + ecosystem tables"]
  M["/admin/data-operations"] --> N["/api/admin/data-operations/*"] --> O["ingestion + source registry tables"]
```
