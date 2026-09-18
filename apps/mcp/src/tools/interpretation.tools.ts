import { McpRegistrar } from "@/blueprints";
import { asyncToolHandler, MCPToolException, MCPToolResponse } from "@/lib";
import { InterpretNotesZSchema, type InterpretNotesInput } from "@repo/zod";
import { groqClient, GROQ_MODEL } from "@/lib";
import { DirectiveInterpretationArraySchema } from "@repo/zod";
import { extractJson } from "@/utils/validjsonparser";

const SYSTEM_PROMPT = `You are the operator-note interpretation module for a smart-campus energy optimizer.

You will be given a list of operator notes (indexed) and the current 24-hour scenario (hours + battery).
For EVERY note, produce exactly one interpretation entry.

Only these directive types are allowed:
- solar_reduction: {"hours":[...], "factor": number 0..1}   (factor = usable fraction remaining)
- minimum_battery_reserve: {"hours":[...], "minimum_energy_kwh": number}
- no_charge_window: {"hours":[...]}
- no_discharge_window: {"hours":[...]}
- max_grid_window: {"hours":[...], "max_grid_kwh": number}
- no_op: structured_adjustment must be null

Rules:
- Time windows are half-open: "1 PM to 3 PM" means hours [13,14] (end hour excluded).
- hours arrays must be unique integers 0-23 in ascending order.
- If a note does not affect the 24-hour energy schedule, use applies=false, directive_type="no_op", structured_adjustment=null.
- Every other directive must use applies=true with the exact structured_adjustment shape above.
- Do not invent demand, tariff, or battery parameter changes. Do not invent new directive types.
- Return one entry per note, in note_index order, with no missing or duplicate note_index values.

Respond with ONLY a JSON object of the form:
{"directive_interpretation": [ {"note_index":0,"applies":true,"directive_type":"...","structured_adjustment":{...},"explanation":"..."}, ... ]}

No prose, no markdown fences, no extra keys.`;

export class NoteInterpretationTools extends McpRegistrar {
  static InterpretNotesToolName: string = "interpret_operator_notes";

  registerInterpretNotes() {
    this.server.registerTool(
      NoteInterpretationTools.InterpretNotesToolName,
      {
        title: "Interpret operator notes",
        description:
          "Interprets 1-3 natural-language operator notes into structured GridWise directives via Groq.",
        inputSchema: InterpretNotesZSchema,
        annotations: {
          destructiveHint: false,
          idempotentHint: false,
          openWorldHint: true,
          readOnlyHint: true,
        },
      },
      asyncToolHandler(interpretOperatorNotesTool)
    );
  }

  init() {
    this.registerInterpretNotes();
  }
}

const interpretOperatorNotesTool = async (payload: InterpretNotesInput) => {
  const { operator_notes, hours, battery } = payload;

  const userPrompt = JSON.stringify(
    {
      operator_notes: operator_notes.map((text, note_index) => ({
        note_index,
        text,
      })),
      hours,
      battery,
    },
    null,
    2
  );

  let raw: string;
  try {
    const completion = await groqClient.chat.completions.create({
      model: GROQ_MODEL,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });
    raw = completion.choices[0]?.message?.content ?? "";
  } catch (err) {
    throw new MCPToolException(
      `Groq call failed: ${err instanceof Error ? err.message : "unknown error"}`,
      NoteInterpretationTools.InterpretNotesToolName
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJson(raw));
    console.log("haha error here: ", parsed);
  } catch {
    throw new MCPToolException(
      "Model returned non-JSON output",
      NoteInterpretationTools.InterpretNotesToolName
    );
  }

  const candidate = Array.isArray(parsed)
    ? parsed
    : (parsed as { directive_interpretation?: unknown })
        ?.directive_interpretation;

  const result = DirectiveInterpretationArraySchema.safeParse(candidate);
  if (!result.success) {
    throw new MCPToolException(
      `Interpretation failed schema validation: ${JSON.stringify(
        result.error.issues
      )}`,
      NoteInterpretationTools.InterpretNotesToolName
    );
  }

  const seen = new Set<number>();
  for (const entry of result.data) {
    if (
      entry.note_index >= operator_notes.length ||
      seen.has(entry.note_index)
    ) {
      throw new MCPToolException(
        `Invalid or duplicate note_index: ${entry.note_index}`,
        NoteInterpretationTools.InterpretNotesToolName
      );
    }
    seen.add(entry.note_index);
  }
  if (seen.size !== operator_notes.length) {
    throw new MCPToolException(
      "Not every operator note has a corresponding interpretation entry",
      NoteInterpretationTools.InterpretNotesToolName
    );
  }

  return new MCPToolResponse(
    "Operator Notes Interpreted Successfully",
    JSON.stringify(result.data),
    200
  ).toObject();
};
