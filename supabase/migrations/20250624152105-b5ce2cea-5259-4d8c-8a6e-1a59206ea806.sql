
-- Create courses table
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT,
  topic TEXT,
  description TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lessons table (for course content)
CREATE TABLE public.lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('video', 'pdf', 'image', 'note')),
  content_url TEXT,
  notes TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create books table
CREATE TABLE public.books (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  topic TEXT,
  pdf_url TEXT,
  summary TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create progress tracking table
CREATE TABLE public.lesson_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(lesson_id)
);

-- Create streak tracking table
CREATE TABLE public.daily_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  lessons_completed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(date)
);

-- Create calendar blocks table
CREATE TABLE public.calendar_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  title TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create storage bucket for PDFs and other files
INSERT INTO storage.buckets (id, name, public) VALUES ('course-files', 'course-files', true);

-- Storage policies for course files
CREATE POLICY "Anyone can view course files" ON storage.objects FOR SELECT USING (bucket_id = 'course-files');
CREATE POLICY "Anyone can upload course files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'course-files');
CREATE POLICY "Anyone can update course files" ON storage.objects FOR UPDATE USING (bucket_id = 'course-files');
CREATE POLICY "Anyone can delete course files" ON storage.objects FOR DELETE USING (bucket_id = 'course-files');

-- Enable RLS on all tables (single user app, so policies will be permissive)
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_blocks ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for single user
CREATE POLICY "Allow all operations on courses" ON public.courses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on lessons" ON public.lessons FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on books" ON public.books FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on lesson_progress" ON public.lesson_progress FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on daily_streaks" ON public.daily_streaks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on calendar_blocks" ON public.calendar_blocks FOR ALL USING (true) WITH CHECK (true);
