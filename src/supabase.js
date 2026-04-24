import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xnhevcuqktofgcyfhkao.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhuaGV2Y3Vxa3RvZmdjeWZoa2FvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNDEyMDcsImV4cCI6MjA4NjcxNzIwN30.aITnZlugpF7h0qfIOIOrMKxGsQDcwaTz9qqrXZbMhwo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
