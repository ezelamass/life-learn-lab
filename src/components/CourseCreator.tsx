
import { useState } from 'react';
import { Plus, X, Link, FileText, Image, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const CourseCreator = ({ onSuccess, onCancel }) => {
  const [courseData, setCourseData] = useState({
    title: '',
    category: '',
    topic: '',
    description: '',
    notes: ''
  });
  const [lessons, setLessons] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const addLesson = (type) => {
    const newLesson = {
      id: Date.now(),
      title: '',
      content_type: type,
      content_url: '',
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

  const reorderLessons = (fromIndex, toIndex) => {
    const updatedLessons = [...lessons];
    const [movedLesson] = updatedLessons.splice(fromIndex, 1);
    updatedLessons.splice(toIndex, 0, movedLesson);
    
    // Update order indices
    updatedLessons.forEach((lesson, index) => {
      lesson.order_index = index;
    });
    
    setLessons(updatedLessons);
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
      // Create course
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .insert([courseData])
        .select()
        .single();

      if (courseError) throw courseError;

      // Create lessons
      if (lessons.length > 0) {
        const lessonsToInsert = lessons.map(lesson => ({
          course_id: course.id,
          title: lesson.title || `Lesson ${lesson.order_index + 1}`,
          content_type: lesson.content_type,
          content_url: lesson.content_url || null,
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
      console.error('Error creating course:', error);
      toast({
        title: "Error",
        description: "Failed to create course. Please try again.",
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
      default: return <Link className="h-4 w-4" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Create New Course</h2>
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
                        <Input
                          value={lesson.content_url}
                          onChange={(e) => updateLesson(lesson.id, 'content_url', e.target.value)}
                          placeholder="YouTube URL"
                          className="bg-gray-600 border-gray-500 text-white"
                        />
                      )}
                      
                      {lesson.content_type === 'image' && (
                        <Input
                          value={lesson.content_url}
                          onChange={(e) => updateLesson(lesson.id, 'content_url', e.target.value)}
                          placeholder="Image URL"
                          className="bg-gray-600 border-gray-500 text-white"
                        />
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
            {isSubmitting ? 'Creating...' : 'Create Course'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CourseCreator;
