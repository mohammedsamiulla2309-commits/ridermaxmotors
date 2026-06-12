import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const triggerCustomerCall = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      phone: z.string().regex(/^[6-9]\d{9}$/),
      name: z.string().min(1).max(80),
      model: z.string().min(1).max(120),
    }),
  )
  .handler(async ({ data }) => {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_FROM_NUMBER;
    if (!sid || !token || !from) {
      throw new Error("Twilio is not configured");
    }

    const to = `+91${data.phone}`;
    // Silent call — customer's phone rings; line stays open briefly then hangs up.
    const twiml = `<Response><Pause length="20"/><Hangup/></Response>`;


    const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Calls.json`;
    const body = new URLSearchParams({ To: to, From: from, Twiml: twiml });

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${sid}:${token}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Twilio call failed", res.status, errText);
      throw new Error(`Twilio call failed (${res.status})`);
    }

    const json = (await res.json()) as { sid?: string };
    return { ok: true, callSid: json.sid };
  });
