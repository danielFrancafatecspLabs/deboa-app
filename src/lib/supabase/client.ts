import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://hmasenjcnpajirpeushg.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtYXNlbmpjbnBhamlycGV1c2hnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczNjI2MjYsImV4cCI6MjEwMjkzODYyNn0.b6ZgcBP3DuFab1AI9Vh37-jVqUN8zQEwrtrtTOw9U4s";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);