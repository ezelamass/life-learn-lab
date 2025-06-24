
import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, Circle, Play, FileText, Image, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import ReactPlayer from 'react-player';
import NotesEditor from '@/components/NotesEditor';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const CoursePlayer = ({ course, onBack, onUpdate }) => {
  const [lessons, setLessons] = useState([]);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [completedLessons, setCompletedLessons] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchLessons();
  }, [course.id]);

  const fetchLessons = async () => {
    try {
      // Get lessons
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', course.id)
        .order('order_index', { ascending: true });

      if (lessonsError) throw lessonsError;

      setLessons(lessonsData || []);

      // Get progress
      const { data: progressData, error: progressError } = await supabase
        .from('lesson_progress')
        .select('lesson_id')
        .in('lesson_id', (lessonsData || []).map(l => l.id));

      if (progressError) throw progressError;

      const completed = new Set(progressData?.map(p => p.lesson_id) || []);
      setCompletedLessons(completed);

      // Set first lesson as current
      if (lessonsData && lessonsData.length > 0) {
        setCurrentLesson(lessonsData[0]);
      }

    } catch (error) {
      console.error('Error fetching lessons:', error);
      toast({
        title: "Error",
        description: "Failed to load course content",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleLessonComplete = async (lessonId) => {
    try {
      const isCompleted = completedLessons.has(lessonId);
      
      if (isCompleted) {
        // Remove completion
        await supabase
          .from('lesson_progress')
          .delete()
          .eq('lesson_id', lessonId);
        
        setCompletedLessons(prev => {
          const newSet = new Set(prev);
          newSet.delete(lessonId);
          return newSet;
        });
      } else {
        // Mark as complete
        await supabase
          .from('lesson_progress')
          .insert([{ lesson_id: lessonId }]);
        
        setCompletedLessons(prev => new Set([...prev, lessonId]));
        
        // Update daily streak
        const today = new Date().toISOString().split('T')[0];
        const { data: existingStreak, error: fetchError } = await supabase
          .from('daily_streaks')
          .select('lessons_completed')
          .eq('date', today)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          throw fetchError;
        }

        if (existingStreak) {
          await supabase
            .from('daily_streaks')
            .update({ lessons_completed: existingStreak.lessons_completed + 1 })
            .eq('date', today);
        } else {
          await supabase
            .from('daily_streaks')
            .insert([{ date: today, lessons_completed: 1 }]);
        }

        toast({
          title: "Lesson Complete!",
          description: "Great progress! Keep it up!",
        });
      }
      
      onUpdate();
    } catch (error) {
      console.error('Error updating lesson progress:', error);
      toast({
        title: "Error",
        description: "Failed to update progress",
        variant: "destructive"
      });
    }
  };

  const getLessonIcon = (type) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4" />;
      case 'image': return <Image className="h-4 w-4" />;
      case 'note': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const progressPercentage = lessons.length > 0 ? (completedLessons.size / lessons.length) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading course...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Library
              </Button>
              <div>
                <h1 className="text-xl font-bold">{course.title}</h1>
                <p className="text-sm text-gray-400">{course.topic}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Progress</p>
              <p className="font-semibold">{completedLessons.size}/{lessons.length} lessons</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <Progress value={progressPercentage} className="h-2 bg-gray-800" />
          <p className="text-sm text-gray-400 mt-2">{Math.round(progressPercentage)}% complete</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Lesson List */}
          <div className="lg:col-span-1">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4 text-white">Course Content</h3>
                <div className="space-y-2">
                  {lessons.map((lesson, index) => (
                    <div
                      key={lesson.id}
                      className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        currentLesson?.id === lesson.id
                          ? 'bg-blue-600/20 border border-blue-500'
                          : 'hover:bg-gray-700'
                      }`}
                      onClick={() => setCurrentLesson(lesson)}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLessonComplete(lesson.id);
                        }}
                        className="flex-shrink-0"
                      >
                        {completedLessons.has(lesson.id) ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <Circle className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          {getLessonIcon(lesson.content_type)}
                          <span className="text-sm text-gray-400">#{index + 1}</span>
                        </div>
                        <p className="text-sm font-medium text-white truncate">
                          {lesson.title}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {currentLesson ? (
              <div className="space-y-6">
                {/* Lesson Header */}
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">{currentLesson.title}</h2>
                  <div className="flex items-center space-x-2 text-gray-400">
                    {getLessonIcon(currentLesson.content_type)}
                    <span className="text-sm capitalize">{currentLesson.content_type}</span>
                  </div>
                </div>

                {/* Lesson Content */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6">
                    {currentLesson.content_type === 'video' && currentLesson.content_url && (
                      <div className="mb-6">
                        <ReactPlayer
                          url={currentLesson.content_url}
                          controls
                          width="100%"
                          height="400px"
                          className="rounded-lg overflow-hidden"
                        />
                      </div>
                    )}

                    {currentLesson.content_type === 'image' && currentLesson.content_url && (
                      <div className="mb-6">
                        <img
                          src={currentLesson.content_url}
                          alt={currentLesson.title}
                          className="w-full rounded-lg"
                        />
                      </div>
                    )}

                    {currentLesson.notes && (
                      <div className="prose prose-invert max-w-none">
                        <div className="whitespace-pre-wrap text-gray-300">
                          {currentLesson.notes}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Notes Editor */}
                <NotesEditor
                  lessonId={currentLesson.id}
                  initialNotes={currentLesson.notes || ''}
                  onSave={(notes) => {
                    setCurrentLesson({...currentLesson, notes});
                  }}
                />
              </div>
            ) : (
              <div className="text-center py-12">
                <Play className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-400 mb-2">No lesson selected</h3>
                <p className="text-gray-500">Choose a lesson from the sidebar to get started.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoursePlayer;
