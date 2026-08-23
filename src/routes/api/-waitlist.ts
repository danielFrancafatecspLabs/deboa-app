import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/lib/supabase/client";

interface WaitlistInput {
  name: string;
  email: string;
  phone?: string;
  purchasePain?: string;
  source?: string;
  campaign?: string;
}

export const submitWaitlist = createServerFn({ method: "POST" })
  .validator((data: WaitlistInput) => data)
  .handler(async ({ data }) => {
    const { name, email, phone, purchasePain, source, campaign } = data;

    // ── Validation ──────────────────────────────────────────────────
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return { error: "Nome deve ter pelo menos 2 caracteres." };
    }

    if (!email || typeof email !== "string") {
      return { error: "Email é obrigatório." };
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return { error: "Formato de email inválido." };
    }

    // ── Sanitization ────────────────────────────────────────────────
    const sanitizedName = name.trim().slice(0, 200);
    const sanitizedPhone = phone ? phone.trim().slice(0, 20) : null;
    const sanitizedPain = purchasePain ? purchasePain.trim().slice(0, 500) : null;
    const sanitizedSource = source ? source.trim().slice(0, 100) : "direct";
    const sanitizedCampaign = campaign ? campaign.trim().slice(0, 200) : null;

    // ── Duplicate check ─────────────────────────────────────────────
    const { data: existing } = await supabase
      .from("waitlist_leads")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (existing) {
      return { error: "Este email já está cadastrado na lista de espera." };
    }

    // ── Insert ──────────────────────────────────────────────────────
    const { error: insertError } = await supabase.from("waitlist_leads").insert({
      name: sanitizedName,
      email: normalizedEmail,
      phone: sanitizedPhone,
      purchase_pain: sanitizedPain,
      source: sanitizedSource,
      campaign: sanitizedCampaign,
      consent: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (insertError) {
      if (insertError.code === "23505") {
        return { error: "Este email já está cadastrado na lista de espera." };
      }
      console.error("[waitlist] Insert error:", insertError);
      return { error: "Erro interno. Tente novamente mais tarde." };
    }

    return { success: true };
  });