
import { useState, useEffect } from 'react';
import { Calendar, BookOpen, Play, TrendingUp, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';

const Dashboard = ({ courses, books }) => {
  const [streak, setStreak] = useState(0);
  const [todayProgress, setTodayProgress] = useState(0);
  const [courseProgress, setCourseProgress] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, [courses]);

  const fetchDashboardData = async () => {
    try {
      // Get current streak
      const { data: streakData } = await supabase
        .from('daily_streaks')
        .select('*')
        .order('date', { ascending: false })
        .limit(30);

      if (streakData) {
        calculateStreak(streakData);
      }

      // Get course progress
      if (courses.length > 0) {
        const progressPromises = courses.map(async (course) => {
          const { data: lessons } = await supabase
            .from('lessons')
            .select('id')
            .eq('course_id', course.id);

          const { data: completed } = await supabase
            .from('lesson_progress')
            .select('lesson_id')
            .in('lesson_id', lessons?.map(l => l.id) || []);

          const totalLessons = lessons?.length || 0;
          const completedLessons = completed?.length || 0;
          const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

          return {
            ...course,
            totalLessons,
            completedLessons,
            progressPercentage
          };
        });

        const progressData = await Promise.all(progressPromises);
        setCourseProgress(progressData);
      }

      // Get recent activity
      const { data: recentProgress } = await supabase
        .from('lesson_progress')
        .select(`
          *,
          lessons!inner(
            title,
            courses!inner(title)
          )
        `)
        .order('completed_at', { ascending: false })
        .limit(5);

      setRecentActivity(recentProgress || []);

      // Get today's progress
      const today = new Date().toISOString().split('T')[0];
      const { data: todayData } = await supabase
        .from('daily_streaks')
        .select('lessons_completed')
        .eq('date', today)
        .single();

      setTodayProgress(todayData?.lessons_completed || 0);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const calculateStreak = (streakData) => {
    if (!streakData || streakData.length === 0) {
      setStreak(0);
      return;
    }

    let currentStreak = 0;
    const today = new Date();
    
    for (let i = 0; i < streakData.length; i++) {
      const streakDate = new Date(streakData[i].date);
      const daysDiff = Math.floor((today - streakDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === i && streakData[i].lessons_completed > 0) {
        currentStreak++;
      } else {
        break;
      }
    }
    
    setStreak(currentStreak);
  };

  const totalCourses = courses.length;
  const totalBooks = books.length;
  const activeCourses = courseProgress.filter(c => c.progressPercentage > 0 && c.progressPercentage < 100).length;

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Welcome back!</h2>
        <p className="text-gray-400">Continue your learning journey</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Current Streak</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{streak}</div>
            <p className="text-xs text-gray-400">
              {streak === 1 ? 'day' : 'days'} in a row
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Today's Progress</CardTitle>
            <Target className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{todayProgress}</div>
            <p className="text-xs text-gray-400">
              lessons completed today
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Active Courses</CardTitle>
            <Play className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{activeCourses}</div>
            <p className="text-xs text-gray-400">
              of {totalCourses} total courses
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Library</CardTitle>
            <BookOpen className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalBooks}</div>
            <p className="text-xs text-gray-400">
              books uploaded
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Course Progress */}
      {courseProgress.length > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Course Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {courseProgress.slice(0, 5).map((course) => (
              <div key={course.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-white">{course.title}</h3>
                  <span className="text-sm text-gray-400">
                    {course.completedLessons}/{course.totalLessons} lessons
                  </span>
                </div>
                <Progress 
                  value={course.progressPercentage} 
                  className="h-2 bg-gray-700"
                />
                <p className="text-xs text-gray-500">{Math.round(course.progressPercentage)}% complete</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div key={activity.id} className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-white">
                      Completed "{activity.lessons.title}"
                    </p>
                    <p className="text-xs text-gray-400">
                      in {activity.lessons.courses.title}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(activity.completed_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
