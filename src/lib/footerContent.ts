// src/lib/footerContent.ts

import { supabase } from "@/integrations/supabase/client";

// Fetch the latest acknowledgement text from the footer_content table
export async function fetchFooterContent(): Promise<string> {
  const { data, error } = await supabase
    .from("footer_content")
    .select("acknowledgement_text")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.acknowledgement_text || "";
}

// Update the acknowledgement text (insert new row for audit/history)
export async function updateFooterContent(newContent: string): Promise<void> {
  const { error } = await supabase
    .from("footer_content")
    .insert({ acknowledgement_text: newContent });
  if (error) throw error;
}
