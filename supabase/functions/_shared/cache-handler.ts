import { createSupabaseClient } from "./supabase-client.ts";

export async function checkCacheValid(supabase: any, url: string): Promise<string | null> {
  console.log("Checking cache for URL:", url);
  try {
    const { data: cachedPage, error } = await supabase
      .from("page_cache")
      .select("html_content")
      .eq("url", url)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (error) {
      console.error("Error checking cache:", error);
      return null;
    }

    if (cachedPage?.html_content) {
      console.log("Valid cache found for URL:", url);
      return cachedPage.html_content;
    }

    console.log("No valid cache found for URL:", url);
    return null;
  } catch (error) {
    console.error("Error in checkCacheValid:", error);
    return null;
  }
}

export async function updateCache(supabase: any, url: string, htmlContent: string) {
  console.log("Updating cache for URL:", url);
  const created_at = new Date().toISOString();
  const expires_at = new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString();

  try {
    const { error } = await supabase
      .from("page_cache")
      .upsert({
        url,
        html_content: htmlContent,
        created_at,
        expires_at
      }, {
        onConflict: 'url'
      });

    if (error) {
      console.error("Error updating cache:", error);
      throw error;
    }

    console.log("Successfully updated cache for URL:", url);
  } catch (error) {
    console.error("Error in updateCache:", error);
    throw error;
  }
}