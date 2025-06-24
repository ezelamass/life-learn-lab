
-- Create tags table
CREATE TABLE public.tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create course_tags junction table for many-to-many relationship
CREATE TABLE public.course_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(course_id, tag_id)
);

-- Add video_file_url column to lessons table for uploaded videos
ALTER TABLE public.lessons ADD COLUMN video_file_url TEXT;

-- Add book_id column to lessons table to reference books
ALTER TABLE public.lessons ADD COLUMN book_id UUID REFERENCES public.books(id) ON DELETE SET NULL;

-- Add cover_image_url to books table for PDF first page extraction
ALTER TABLE public.books ADD COLUMN cover_image_url TEXT;

-- Create monthly progress tracking table
CREATE TABLE public.monthly_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  lessons_completed INTEGER NOT NULL DEFAULT 0,
  courses_started INTEGER NOT NULL DEFAULT 0,
  courses_completed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(year, month)
);

-- Create storage bucket for video files
INSERT INTO storage.buckets (id, name, public) VALUES ('course-videos', 'course-videos', true);

-- Storage policies for video files
CREATE POLICY "Anyone can view course videos" ON storage.objects FOR SELECT USING (bucket_id = 'course-videos');
CREATE POLICY "Anyone can upload course videos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'course-videos');
CREATE POLICY "Anyone can update course videos" ON storage.objects FOR UPDATE USING (bucket_id = 'course-videos');
CREATE POLICY "Anyone can delete course videos" ON storage.objects FOR DELETE USING (bucket_id = 'course-videos');

-- Enable RLS on new tables
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_progress ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for single user
CREATE POLICY "Allow all operations on tags" ON public.tags FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on course_tags" ON public.course_tags FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on monthly_progress" ON public.monthly_progress FOR ALL USING (true) WITH CHECK (true);

-- Insert some default tags
INSERT INTO public.tags (name, color) VALUES
  ('Programming', '#3B82F6'),
  ('Design', '#8B5CF6'),
  ('Business', '#10B981'),
  ('Science', '#F59E0B'),
  ('Technology', '#EF4444'),
  ('Art', '#EC4899'),
  ('Health', '#06B6D4'),
  ('Education', '#84CC16');
