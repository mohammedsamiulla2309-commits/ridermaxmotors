import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const VAPI_BASE = "https://api.vapi.ai";

function normalizePhoneNumber(value: string) {
  const trimmed = value.trim();
  if (trimmed.startsWith("+")) return trimmed.replace(/\s+/g, "");
  return `+91${trimmed.replace(/\D/g, "")}`;
}

export const triggerCustomerCall = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      phone: z.string().min(10).max(16),
      name: z.string().min(1).max(80),
      model: z.string().min(1).max(120),
    }),
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.VAPI_PRIVATE_KEY;
    const assistantId = process.env.VAPI_ASSISTANT_ID;
    const phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID;

    if (!apiKey || !assistantId || !phoneNumberId) {
      throw new Error("Vapi is not configured");
    }

    const to = normalizePhoneNumber(data.phone);

    const res = await fetch(`${VAPI_BASE}/call/phone`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        assistantId,
        phoneNumberId,
        customer: { number: to, name: data.name },
        assistantOverrides: {
          variableValues: { name: data.name, model: data.model },
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Vapi call failed", res.status, errText);
      throw new Error(`Vapi call failed (${res.status})`);
    }

    const json = (await res.json()) as { id?: string };
    return { ok: true, callId: json.id };
  });
