
import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Upload, Image, FileText, Video, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import TagManager from '@/components/TagManager';
import ImageUploader from '@/components/ImageUploader';
import PDFUploader from '@/components/PDFUploader';
import VideoUploader from '@/components/VideoUploader';

const CourseCreator = ({ onSuccess, onCancel, editingCourse = null }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [topic, setTopic] = useState('');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [lessons, setLessons] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [coverFile, setCoverFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (editingCourse) {
      setTitle(editingCourse.title || '');
      setDescription(editingCourse.description || '');
      setTopic(editingCourse.topic || '');
      setCategory(editingCourse.category || '');
      setNotes(editingCourse.notes || '');
      
      // Load existing lessons and tags
      loadCourseLessons(editingCourse.id);
      loadCourseTags(editingCourse.id);
    }
  }, [editingCourse]);

  const loadCourseLessons = async (courseId) => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('order');

      if (error) throw error;
      setLessons(data || []);
    } catch (error) {
      console.error('Error fetching lessons:', error);
      toast({
        title: "Error",
        description: "Failed to load lessons",
        variant: "destructive"
      });
    }
  };

  const loadCourseTags = async (courseId) => {
    try {
      const { data, error } = await supabase
        .from('course_tags')
        .select(`
          tags (
            id
          )
        `)
        .eq('course_id', courseId);

      if (error) throw error;
      
      const tagIds = data?.map(item => item.tags.id) || [];
      setSelectedTags(tagIds);
    } catch (error) {
      console.error('Error fetching course tags:', error);
      toast({
        title: "Error",
        description: "Failed to load course tags",
        variant: "destructive"
      });
    }
  };

  const addLesson = () => {
    setLessons([...lessons, { title: '', content: '', type: 'text' }]);
  };

  const removeLesson = (index) => {
    const newLessons = [...lessons];
    newLessons.splice(index, 1);
    setLessons(newLessons);
  };

  const updateLesson = (index, field, value) => {
    const newLessons = [...lessons];
    newLessons[index][field] = value;
    setLessons(newLessons);
  };

  const handleCoverUpload = (event) => {
    const file = event.target.files[0];
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/jpg')) {
      setCoverFile(file);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please select a JPG or PNG image file.",
        variant: "destructive"
      });
    }
  };

  const uploadFile = async (file, bucket, path) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file);

    if (error) throw error;
    return data;
  };

  const getPublicUrl = (bucket, path) => {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter a course title.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);

    try {
      let coverImageUrl = null;

      // Upload cover image if provided
      if (coverFile) {
        const coverFileName = `course-covers/${Date.now()}_${coverFile.name}`;
        await uploadFile(coverFile, 'courses', coverFileName);
        coverImageUrl = getPublicUrl('courses', coverFileName);
      }

      let courseData: {
        title: string;
        description: string | null;
        topic: string | null;
        category: string | null;
        notes: string | null;
        cover_image_url?: string;
      } = {
        title: title.trim(),
        description: description.trim() || null,
        topic: topic.trim() || null,
        category: category.trim() || null,
        notes: notes.trim() || null
      };

      if (coverImageUrl) {
        courseData.cover_image_url = coverImageUrl;
      }

      let courseId;
      
      if (editingCourse) {
        // Update existing course
        const { error } = await supabase
          .from('courses')
          .update(courseData)
          .eq('id', editingCourse.id);

        if (error) throw error;
        courseId = editingCourse.id;
      } else {
        // Create new course
        const { data, error } = await supabase
          .from('courses')
          .insert(courseData)
          .select()
          .single();

        if (error) throw error;
        courseId = data.id;
      }

      // Handle lessons
      if (editingCourse) {
        // Delete existing lessons
        await supabase
          .from('lessons')
          .delete()
          .eq('course_id', editingCourse.id);
      }

      // Insert new lessons
      const lessonsToInsert = lessons.map((lesson, index) => ({
        ...lesson,
        course_id: courseId,
        order: index
      }));

      if (lessonsToInsert.length > 0) {
        const { error: lessonsError } = await supabase
          .from('lessons')
          .insert(lessonsToInsert);

        if (lessonsError) throw lessonsError;
      }

      // Handle tags
      // Delete existing tags
      if (editingCourse) {
        await supabase
          .from('course_tags')
          .delete()
          .eq('course_id', editingCourse.id);
      }

      // Insert new tags
      const tagsToInsert = selectedTags.map(tagId => ({
        course_id: courseId,
        tag_id: tagId
      }));

      if (tagsToInsert.length > 0) {
        const { error: tagsError } = await supabase
          .from('course_tags')
          .insert(tagsToInsert);

        if (tagsError) throw tagsError;
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving course:', error);
      toast({
        title: "Save failed",
        description: "There was an error saving your course. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={onCancel}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-xl font-bold">
                {editingCourse ? 'Edit Course' : 'Create New Course'}
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Course Information */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Course Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="title" className="text-gray-300">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter course title..."
                  className="bg-gray-700 border-gray-600 text-white"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-gray-300">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter course description..."
                  className="bg-gray-700 border-gray-600 text-white min-h-[100px]"
                />
              </div>

              <div>
                <Label htmlFor="topic" className="text-gray-300">Topic</Label>
                <Input
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Enter course topic..."
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <div>
                <Label htmlFor="category" className="text-gray-300">Category</Label>
                <Select onValueChange={setCategory} defaultValue={category}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    <SelectItem value="Programming">Programming</SelectItem>
                    <SelectItem value="Design">Design</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Business">Business</SelectItem>
                    <SelectItem value="Personal Development">Personal Development</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes" className="text-gray-300">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter your notes about this course..."
                  className="bg-gray-700 border-gray-600 text-white min-h-[100px]"
                />
              </div>

              <div>
                <Label htmlFor="cover" className="text-gray-300">Cover Image</Label>
                <div className="mt-2">
                  <Input
                    id="cover"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleCoverUpload}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                  {coverFile && (
                    <p className="text-sm text-green-400 mt-2 flex items-center">
                      <Image className="h-4 w-4 mr-2" />
                      {coverFile.name}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <TagManager mode="select" selectedTags={selectedTags} onTagsChange={setSelectedTags} />
            </CardContent>
          </Card>

          {/* Lessons */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-white">Lessons</CardTitle>
                <Button type="button" variant="ghost" onClick={addLesson}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Lesson
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {lessons.map((lesson, index) => (
                <div key={index} className="bg-gray-700 rounded-md p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-lg font-semibold text-white">Lesson {index + 1}</h4>
                    <Button type="button" variant="ghost" onClick={() => removeLesson(index)} className="text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div>
                    <Label htmlFor={`lessonTitle-${index}`} className="text-gray-300">Title</Label>
                    <Input
                      id={`lessonTitle-${index}`}
                      value={lesson.title}
                      onChange={(e) => updateLesson(index, 'title', e.target.value)}
                      placeholder="Enter lesson title..."
                      className="bg-gray-600 border-gray-500 text-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`lessonType-${index}`} className="text-gray-300">Type</Label>
                    <Select onValueChange={(value) => updateLesson(index, 'type', value)} defaultValue={lesson.type}>
                      <SelectTrigger className="bg-gray-600 border-gray-500 text-white">
                        <SelectValue placeholder="Select lesson type" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600 text-white">
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="image">Image</SelectItem>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {lesson.type === 'text' && (
                    <div>
                      <Label htmlFor={`lessonContent-${index}`} className="text-gray-300">Content</Label>
                      <Textarea
                        id={`lessonContent-${index}`}
                        value={lesson.content}
                        onChange={(e) => updateLesson(index, 'content', e.target.value)}
                        placeholder="Enter lesson content..."
                        className="bg-gray-600 border-gray-500 text-white min-h-[100px]"
                      />
                    </div>
                  )}

                  {lesson.type === 'image' && (
                    <div>
                      <Label className="text-gray-300">Upload Image</Label>
                      <ImageUploader
                        onImageUpload={(url) => updateLesson(index, 'content', url)}
                        className="bg-gray-600 border-gray-500"
                      />
                    </div>
                  )}

                  {lesson.type === 'pdf' && (
                    <div>
                      <Label className="text-gray-300">Upload PDF</Label>
                      <PDFUploader
                        onPDFUpload={(url) => updateLesson(index, 'content', url)}
                        className="bg-gray-600 border-gray-500"
                      />
                    </div>
                  )}

                  {lesson.type === 'video' && (
                    <div>
                      <Label className="text-gray-300">Upload Video</Label>
                      <VideoUploader
                        onVideoUpload={(url) => updateLesson(index, 'content', url)}
                        className="bg-gray-600 border-gray-500"
                      />
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex space-x-4">
            <Button
              type="submit"
              disabled={uploading || !title.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {uploading ? (
                <>
                  <Upload className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Save Course
                </>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default CourseCreator;
