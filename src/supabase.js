import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://psmswngqyzrnhkxwexkw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzbXN3bmdxeXpybmhreHdleGt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NzU2NzcsImV4cCI6MjA5MTQ1MTY3N30.5TEhgcMrnPRQYwH_aambYIzBibonCsy2gmS_L6lOxgU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
