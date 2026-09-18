# How The System Is Working?

AI's role (LLM Interpreter)
- **Job**: Convert 1-3 free-text operator notes → structured directives (`solar_reduction`, `no_charge_window`, etc.) or `no_op`.
- **Where**: `McpInterpretationService` calls an MCP tool (`interpret_operator_notes`) which internally runs the LLM.
- **Why it's isolated**: LLM output is treated as **untrusted** — it never touches the optimizer directly. It's parsed, then validated against `DirectiveInterpretationArraySchema` (Zod) before use. This matches the spec's guardrail requirement (Section 08): "LLM output must be treated as untrusted structured data until deterministic validation passes."
- **What it does NOT do**: touch demand/tariff/battery numbers, decide the schedule, or compute cost. Pure language → structured-directive translation only.

## Deterministic systems (non-AI)

| System | Role |
|---|---|
| **Zod validators** (`ScenarioInputValidators`, `DirectiveInterpretationArraySchema`) | Reject malformed HTTP input and malformed LLM output before either reaches business logic |
| **OptimizerService** (LP solver via `javascript-lp-solver`) | Takes base scenario + validated directives → builds a linear program (grid/solar/charge/discharge variables per hour, energy-balance & battery constraints) → minimizes total grid cost |
| **ScenarioRepository** (Drizzle/Postgres) | Persists scenario, battery, hourly inputs, notes, interpretations, plan, and result — one row set per stage of the pipeline |
| **ScenarioService** | Orchestrates: validate → persist input → call LLM → persist interpretation → run optimizer → persist plan → return response |
| **ScenarioController** | HTTP boundary — maps service output/errors to status codes (`400`/`422`/`500`) |

## End-to-end flow
```
HTTP request → Zod validate → DB save (scenario/battery/hours/notes)
   → LLM interprets notes (MCP tool)
   → Zod validate LLM output (guardrail)
   → OptimizerService builds LP model + solves
   → DB save (interpretation, hourly_plan, result)
   → Return JSON response
```

**Core idea from the spec, reflected in code**: AI handles *language understanding only*; every number in the final schedule comes from the deterministic LP solver, and every directive shape is checked by Zod before it can influence that solver. This is why a hallucinated directive type or malformed hours array fails validation instead of corrupting the schedule.

## Getting Started

### Api Server
```
docker run -d \
  --name bupapi-server \
  -p 5000:5000 \
  -e PORT=5000 \
  -e NODE_ENV=production \
  -e DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres" \
  -e REDIS_USERNAME=default \
  -e REDIS_PASSWORD=default \
  -e REDIS_HOST=localhost \
  -e REDIS_PORT=6379 \
  dockermahin/bupapi-server
```

### MCP Server

```
docker run -d \
  --name bupapi-mcp \
  -p 3000:3000 \
  -e PORT=3000 \
  -e GROQ_API_KEY='YOUR_GROQ_API_KEY' \
  dockermahin/bupapi-mcp
```