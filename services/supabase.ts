
import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = 'https://ibuekmzgwioscvgjptyw.supabase.co';
export const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlidWVrbXpnd2lvc2N2Z2pwdHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2Njk0NTYsImV4cCI6MjA4NjI0NTQ1Nn0.C0YeAKvAc041u12JWBdaHo6qH_5vhdNQWWfqg6Jg0_w';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
