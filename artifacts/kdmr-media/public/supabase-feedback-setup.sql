-- Run this in Supabase SQL Editor to create the feedback table

CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  message TEXT NOT NULL,
  page TEXT DEFAULT '/',
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'valid', 'kiv', 'spam')),
  github_issue_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Allow anyone to submit feedback (no auth needed)
CREATE POLICY "anon_insert_feedback" ON public.feedback
  FOR INSERT TO anon WITH CHECK (true);

-- Allow anyone to view feedback (admin page reads with anon key)
CREATE POLICY "anon_select_feedback" ON public.feedback
  FOR SELECT TO anon USING (true);

-- Allow anyone to update feedback status and github_issue_url
CREATE POLICY "anon_update_feedback" ON public.feedback
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Allow anyone to delete feedback (admin dismiss)
CREATE POLICY "anon_delete_feedback" ON public.feedback
  FOR DELETE TO anon USING (true);
