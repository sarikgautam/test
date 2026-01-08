import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseKey);

async function setTeamBudgets() {
  try {
    const { data, error } = await supabase
      .from("teams")
      .update({
        budget: 2500,
        remaining_budget: 2500,
      })
      .select();

    if (error) {
      console.error("Error updating budgets:", error);
      process.exit(1);
    }

    console.log(`✓ Successfully updated ${data?.length || 0} teams:`);
    data?.forEach((team) => {
      console.log(`  - ${team.name}: Budget = $${team.budget}, Remaining = $${team.remaining_budget}`);
    });
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

setTeamBudgets();
