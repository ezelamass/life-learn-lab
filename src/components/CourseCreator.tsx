import { useState, useEffect } from 'react';
import { Plus, X, Link, FileText, Image, Video, Upload, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import TagManager from '@/components/TagManager';
import VideoUploader from '@/components/VideoUploader';
import ImageUploader from '@/components/ImageUploader';
import PDFUploader from '@/components/PDFUploader';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CourseCreatorProps {
  onSuccess: () => void;
  onCancel: () => void;
  editingCourse?: any;
}

const CourseCreator = ({ onSuccess, onCancel, editingCourse }: CourseCreatorProps) => {
  const [courseData, setCourseData] = useState({
    title: '',
    category: '',
    topic: '',
    description: '',
    notes: ''
  });
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [lessons, setLessons] = useState([]);
  const [books, setBooks] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState<number | null>(null);
  const [uploadingImage, setUploadingImage] = useState<number | null>(null);
  const [uploadingPDF, setUploadingPDF] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchBooks();
    if (editingCourse) {
      loadCourseData();
    }
  }, [editingCourse]);

  const fetchBooks = async () => {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('id, title')
        .order('title');

      if (error) throw error;
      setBooks(data || []);
    } catch (error) {
      console.error('Error fetching books:', error);
    }
  };

  const loadCourseData = async () => {
    if (!editingCourse) return;

    setCourseData({
      title: editingCourse.title || '',
      category: editingCourse.category || '',
      topic: editingCourse.topic || '',
      description: editingCourse.description || '',
      notes: editingCourse.notes || ''
    });

    // Load course tags
    try {
      const { data: courseTags } = await supabase
        .from('course_tags')
        .select('tag_id')
        .eq('course_id', editingCourse.id);

      if (courseTags) {
        setSelectedTags(courseTags.map(ct => ct.tag_id));
      }

      // Load course lessons
      const { data: courseLessons } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', editingCourse.id)
        .order('order_index');

      if (courseLessons) {
        setLessons(courseLessons.map(lesson => ({
          ...lesson,
          id: lesson.id || Date.now()
        })));
      }
    } catch (error) {
      console.error('Error loading course data:', error);
    }
  };

  const addLesson = (type) => {
    const newLesson = {
      id: Date.now(),
      title: '',
      content_type: type,
      content_url: '',
      video_file_url: '',
      book_id: '',
      notes: '',
      order_index: lessons.length
    };
    setLessons([...lessons, newLesson]);
  };

  const updateLesson = (id, field, value) => {
    setLessons(lessons.map(lesson => 
      lesson.id === id ? { ...lesson, [field]: value } : lesson
    ));
  };

  const removeLesson = (id) => {
    setLessons(lessons.filter(lesson => lesson.id !== id));
  };

  const handleVideoUpload = (lessonId: number, videoUrl: string) => {
    updateLesson(lessonId, 'video_file_url', videoUrl);
    setUploadingVideo(null);
  };

  const handleImageUpload = (lessonId: number, imageUrl: string) => {
    updateLesson(lessonId, 'content_url', imageUrl);
    setUploadingImage(null);
  };

  const handlePDFUpload = (lessonId: number, pdfUrl: string) => {
    updateLesson(lessonId, 'content_url', pdfUrl);
    setUploadingPDF(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!courseData.title.trim()) {
      toast({
        title: "Error",
        description: "Course title is required",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let course;
      
      if (editingCourse) {
        // Update existing course
        const { data, error } = await supabase
          .from('courses')
          .update(courseData)
          .eq('id', editingCourse.id)
          .select()
          .single();

        if (error) throw error;
        course = data;

        // Delete existing lessons for this course
        await supabase
          .from('lessons')
          .delete()
          .eq('course_id', editingCourse.id);

        // Delete existing course tags
        await supabase
          .from('course_tags')
          .delete()
          .eq('course_id', editingCourse.id);
      } else {
        // Create new course
        const { data, error } = await supabase
          .from('courses')
          .insert([courseData])
          .select()
          .single();

        if (error) throw error;
        course = data;
      }

      // Create course tags
      if (selectedTags.length > 0) {
        const tagInserts = selectedTags.map(tagId => ({
          course_id: course.id,
          tag_id: tagId
        }));

        const { error: tagsError } = await supabase
          .from('course_tags')
          .insert(tagInserts);

        if (tagsError) throw tagsError;
      }

      // Create lessons
      if (lessons.length > 0) {
        const lessonsToInsert = lessons.map(lesson => ({
          course_id: course.id,
          title: lesson.title || `Lesson ${lesson.order_index + 1}`,
          content_type: lesson.content_type,
          content_url: lesson.content_url || null,
          video_file_url: lesson.video_file_url || null,
          book_id: lesson.book_id || null,
          notes: lesson.notes || null,
          order_index: lesson.order_index
        }));

        const { error: lessonsError } = await supabase
          .from('lessons')
          .insert(lessonsToInsert);

        if (lessonsError) throw lessonsError;
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving course:', error);
      toast({
        title: "Error",
        description: "Failed to save course. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getLessonIcon = (type) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4" />;
      case 'image': return <Image className="h-4 w-4" />;
      case 'note': return <FileText className="h-4 w-4" />;
      case 'book': return <BookOpen className="h-4 w-4" />;
      default: return <Link className="h-4 w-4" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">
          {editingCourse ? 'Edit Course' : 'Create New Course'}
        </h2>
        <p className="text-gray-400">Build your learning path step by step</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Course Details */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Course Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title" className="text-gray-300">Course Title *</Label>
                <Input
                  id="title"
                  value={courseData.title}
                  onChange={(e) => setCourseData({...courseData, title: e.target.value})}
                  placeholder="Enter course title"
                  className="bg-gray-700 border-gray-600 text-white mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="category" className="text-gray-300">Category</Label>
                <Input
                  id="category"
                  value={courseData.category}
                  onChange={(e) => setCourseData({...courseData, category: e.target.value})}
                  placeholder="e.g., Programming, Design"
                  className="bg-gray-700 border-gray-600 text-white mt-1"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="topic" className="text-gray-300">Topic</Label>
              <Input
                id="topic"
                value={courseData.topic}
                onChange={(e) => setCourseData({...courseData, topic: e.target.value})}
                placeholder="e.g., React, UI/UX"
                className="bg-gray-700 border-gray-600 text-white mt-1"
              />
            </div>

            <TagManager
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
              mode="select"
            />

            <div>
              <Label htmlFor="description" className="text-gray-300">Description</Label>
              <textarea
                id="description"
                value={courseData.description}
                onChange={(e) => setCourseData({...courseData, description: e.target.value})}
                placeholder="Describe what students will learn"
                className="w-full mt-1 p-3 bg-gray-700 border border-gray-600 rounded-md text-white resize-none"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Course Content */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Course Content</CardTitle>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addLesson('video')}
                >
                  <Video className="h-4 w-4 mr-2" />
                  Video
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addLesson('note')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Note
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addLesson('image')}
                >
                  <Image className="h-4 w-4 mr-2" />
                  Image
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addLesson('book')}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Book
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {lessons.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                <p>No lessons yet. Add your first lesson above.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {lessons.map((lesson, index) => (
                  <div key={lesson.id} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        {getLessonIcon(lesson.content_type)}
                        <span className="text-sm font-medium text-gray-300 capitalize">
                          {lesson.content_type}
                        </span>
                        <span className="text-xs text-gray-500">#{index + 1}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLesson(lesson.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      <Input
                        value={lesson.title}
                        onChange={(e) => updateLesson(lesson.id, 'title', e.target.value)}
                        placeholder="Lesson title"
                        className="bg-gray-600 border-gray-500 text-white"
                      />
                      
                      {lesson.content_type === 'video' && (
                        <div className="space-y-2">
                          <Input
                            value={lesson.content_url}
                            onChange={(e) => updateLesson(lesson.id, 'content_url', e.target.value)}
                            placeholder="YouTube URL (optional)"
                            className="bg-gray-600 border-gray-500 text-white"
                          />
                          <div className="text-center text-gray-400">or</div>
                          {uploadingVideo === lesson.id ? (
                            <VideoUploader
                              onVideoUploaded={(url) => handleVideoUpload(lesson.id, url)}
                              onCancel={() => setUploadingVideo(null)}
                            />
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setUploadingVideo(lesson.id)}
                              className="w-full"
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Upload Video File
                            </Button>
                          )}
                          {lesson.video_file_url && (
                            <p className="text-sm text-green-400">✓ Video file uploaded</p>
                          )}
                        </div>
                      )}
                      
                      {lesson.content_type === 'image' && (
                        <div className="space-y-2">
                          <Input
                            value={lesson.content_url}
                            onChange={(e) => updateLesson(lesson.id, 'content_url', e.target.value)}
                            placeholder="Image URL (optional)"
                            className="bg-gray-600 border-gray-500 text-white"
                          />
                          <div className="text-center text-gray-400">or</div>
                          {uploadingImage === lesson.id ? (
                            <ImageUploader
                              onImageUploaded={(url) => handleImageUpload(lesson.id, url)}
                              onCancel={() => setUploadingImage(null)}
                            />
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setUploadingImage(lesson.id)}
                              className="w-full"
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Upload Image File
                            </Button>
                          )}
                          {lesson.content_url && lesson.content_url.includes('images/') && (
                            <p className="text-sm text-green-400">✓ Image file uploaded</p>
                          )}
                        </div>
                      )}

                      {lesson.content_type === 'note' && (
                        <div className="space-y-2">
                          {uploadingPDF === lesson.id ? (
                            <PDFUploader
                              onPDFUploaded={(url) => handlePDFUpload(lesson.id, url)}
                              onCancel={() => setUploadingPDF(null)}
                            />
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setUploadingPDF(lesson.id)}
                              className="w-full"
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Upload PDF File
                            </Button>
                          )}
                          {lesson.content_url && lesson.content_url.includes('pdfs/') && (
                            <p className="text-sm text-green-400">✓ PDF file uploaded</p>
                          )}
                        </div>
                      )}

                      {lesson.content_type === 'book' && books.length > 0 && (
                        <Select
                          value={lesson.book_id}
                          onValueChange={(value) => updateLesson(lesson.id, 'book_id', value)}
                        >
                          <SelectTrigger className="bg-gray-600 border-gray-500 text-white">
                            <SelectValue placeholder="Select a book" />
                          </SelectTrigger>
                          <SelectContent>
                            {books.map((book) => (
                              <SelectItem key={book.id} value={book.id}>
                                {book.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      
                      <textarea
                        value={lesson.notes}
                        onChange={(e) => updateLesson(lesson.id, 'notes', e.target.value)}
                        placeholder="Lesson notes or content"
                        className="w-full p-3 bg-gray-600 border border-gray-500 rounded-md text-white resize-none"
                        rows={2}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : editingCourse ? 'Update Course' : 'Create Course'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CourseCreator;
