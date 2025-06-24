
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, BookOpen, GraduationCap, Calendar as CalendarIcon, BarChart3 } from 'lucide-react';
import Dashboard from '@/components/Dashboard';
import CourseCreator from '@/components/CourseCreator';
import CoursePlayer from '@/components/CoursePlayer';
import BookUploader from '@/components/BookUploader';
import BookViewer from '@/components/BookViewer';
import CalendarView from '@/components/CalendarView';
import LibraryFilters from '@/components/LibraryFilters';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [courses, setCourses] = useState([]);
  const [books, setBooks] = useState([]);
  const [showCourseCreator, setShowCourseCreator] = useState(false);
  const [showBookUploader, setShowBookUploader] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [editingCourse, setEditingCourse] = useState(null);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchCourses();
    fetchBooks();
  }, []);

  useEffect(() => {
    setFilteredCourses(courses);
  }, [courses]);

  useEffect(() => {
    setFilteredBooks(books);
  }, [books]);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          course_tags (
            tags (
              id,
              name,
              color
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: "Error",
        description: "Failed to load courses",
        variant: "destructive"
      });
    }
  };

  const fetchBooks = async () => {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBooks(data || []);
    } catch (error) {
      console.error('Error fetching books:', error);
      toast({
        title: "Error",
        description: "Failed to load books",
        variant: "destructive"
      });
    }
  };

  const handleCourseCreated = () => {
    setShowCourseCreator(false);
    setEditingCourse(null);
    fetchCourses();
    toast({
      title: "Success",
      description: editingCourse ? "Course updated successfully!" : "Course created successfully!",
    });
  };

  const handleBookUploaded = () => {
    setShowBookUploader(false);
    fetchBooks();
    toast({
      title: "Success",
      description: "Book uploaded successfully!",
    });
  };

  const handleEditCourse = (course) => {
    setEditingCourse(course);
    setShowCourseCreator(true);
  };

  const handleDeleteCourse = async (courseId) => {
    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;

      fetchCourses();
      toast({
        title: "Success",
        description: "Course deleted successfully!",
      });
    } catch (error) {
      console.error('Error deleting course:', error);
      toast({
        title: "Error",
        description: "Failed to delete course",
        variant: "destructive"
      });
    }
  };

  const handleDeleteBook = async (bookId) => {
    try {
      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', bookId);

      if (error) throw error;

      fetchBooks();
      toast({
        title: "Success",
        description: "Book deleted successfully!",
      });
    } catch (error) {
      console.error('Error deleting book:', error);
      toast({
        title: "Error",
        description: "Failed to delete book",
        variant: "destructive"
      });
    }
  };

  if (selectedCourse) {
    return <CoursePlayer course={selectedCourse} onBack={() => setSelectedCourse(null)} />;
  }

  if (selectedBook) {
    return <BookViewer book={selectedBook} onBack={() => setSelectedBook(null)} />;
  }

  if (showCourseCreator) {
    return (
      <CourseCreator
        onSuccess={handleCourseCreated}
        onCancel={() => {
          setShowCourseCreator(false);
          setEditingCourse(null);
        }}
        editingCourse={editingCourse}
      />
    );
  }

  if (showBookUploader) {
    return (
      <BookUploader
        onSuccess={handleBookUploaded}
        onCancel={() => setShowBookUploader(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header with blue gradient background */}
      <header className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 border-b border-gray-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-md">
                  <GraduationCap className="h-6 w-6 text-blue-600" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">My Own University</h1>
                <p className="text-blue-100 text-sm">Learn at your own pace</p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <Button 
                onClick={() => setShowCourseCreator(true)}
                className="bg-white text-blue-600 hover:bg-blue-50 font-medium shadow-md transition-all duration-200 hover:shadow-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Course
              </Button>
              <Button 
                onClick={() => setShowBookUploader(true)}
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-blue-600 transition-all duration-200"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Upload Book
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-4 bg-gray-800 border-gray-700">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-300">
              <BarChart3 className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="courses" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-300">
              <GraduationCap className="h-4 w-4 mr-2" />
              Courses
            </TabsTrigger>
            <TabsTrigger value="library" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-300">
              <BookOpen className="h-4 w-4 mr-2" />
              Library
            </TabsTrigger>
            <TabsTrigger value="calendar" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-300">
              <CalendarIcon className="h-4 w-4 mr-2" />
              Calendar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <Dashboard courses={courses} books={books} />
          </TabsContent>

          <TabsContent value="courses">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-white">My Courses</h2>
              </div>

              <LibraryFilters
                courses={courses}
                books={books}
                onCoursesFiltered={setFilteredCourses}
                onBooksFiltered={setFilteredBooks}
                activeFilter="courses"
              />

              {filteredCourses.length === 0 ? (
                <div className="text-center py-12">
                  <GraduationCap className="h-16 w-16 mx-auto text-gray-600 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-300 mb-2">No courses found</h3>
                  <p className="text-gray-500 mb-6">Create your first course to get started!</p>
                  <Button onClick={() => setShowCourseCreator(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Course
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCourses.map((course) => (
                    <div key={course.id} className="bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-all duration-200 overflow-hidden group">
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="font-semibold text-lg text-white group-hover:text-blue-400 transition-colors">
                            {course.title}
                          </h3>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditCourse(course)}
                              className="text-gray-400 hover:text-white"
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCourse(course.id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                        
                        {course.course_tags && course.course_tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {course.course_tags.map((courseTag) => (
                              <span
                                key={courseTag.tags.id}
                                className="px-2 py-1 text-xs rounded-full text-white"
                                style={{ backgroundColor: courseTag.tags.color }}
                              >
                                {courseTag.tags.name}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        {course.description && (
                          <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                            {course.description}
                          </p>
                        )}
                        
                        <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                          <span>{course.category || 'General'}</span>
                          <span>{new Date(course.created_at).toLocaleDateString()}</span>
                        </div>
                        
                        <Button 
                          onClick={() => setSelectedCourse(course)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Start Learning
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="library">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-white">Library</h2>
              </div>

              <LibraryFilters
                courses={courses}
                books={books}
                onCoursesFiltered={setFilteredCourses}
                onBooksFiltered={setFilteredBooks}
                activeFilter="books"
              />

              {filteredBooks.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="h-16 w-16 mx-auto text-gray-600 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-300 mb-2">No books found</h3>
                  <p className="text-gray-500 mb-6">Upload your first book to start building your library!</p>
                  <Button onClick={() => setShowBookUploader(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Upload Book
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredBooks.map((book) => (
                    <div key={book.id} className="bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-all duration-200 overflow-hidden group">
                      {book.cover_image_url && (
                        <div className="aspect-[3/4] overflow-hidden">
                          <img 
                            src={book.cover_image_url} 
                            alt={book.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="font-semibold text-white mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
                          {book.title}
                        </h3>
                        {book.topic && (
                          <p className="text-sm text-gray-400 mb-3">{book.topic}</p>
                        )}
                        <div className="flex justify-between items-center">
                          <Button 
                            onClick={() => setSelectedBook(book)}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            Read
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteBook(book.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="calendar">
            <CalendarView />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
