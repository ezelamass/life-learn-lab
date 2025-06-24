
import { useState, useEffect } from 'react';
import { Plus, Search, Calendar, BookOpen, Play, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Dashboard from '@/components/Dashboard';
import CourseCreator from '@/components/CourseCreator';
import BookUploader from '@/components/BookUploader';
import CoursePlayer from '@/components/CoursePlayer';
import BookViewer from '@/components/BookViewer';
import CalendarView from '@/components/CalendarView';
import LibraryFilters from '@/components/LibraryFilters';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [courses, setCourses] = useState([]);
  const [books, setBooks] = useState([]);
  const [filteredContent, setFilteredContent] = useState([]);
  const [selectedFilters, setSelectedFilters] = useState({
    type: 'all',
    topic: 'all'
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchContent();
    
    // Global shortcut for new course
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'N') {
        e.preventDefault();
        setCurrentView('create-course');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    filterContent();
  }, [courses, books, searchTerm, selectedFilters]);

  const fetchContent = async () => {
    try {
      const [coursesRes, booksRes] = await Promise.all([
        supabase.from('courses').select('*').order('created_at', { ascending: false }),
        supabase.from('books').select('*').order('created_at', { ascending: false })
      ]);

      if (coursesRes.error) throw coursesRes.error;
      if (booksRes.error) throw booksRes.error;

      setCourses(coursesRes.data || []);
      setBooks(booksRes.data || []);
    } catch (error) {
      console.error('Error fetching content:', error);
      toast({
        title: "Error",
        description: "Failed to load content",
        variant: "destructive"
      });
    }
  };

  const filterContent = () => {
    let allContent = [];
    
    if (selectedFilters.type === 'all' || selectedFilters.type === 'course') {
      allContent = [...allContent, ...courses.map(c => ({ ...c, type: 'course' }))];
    }
    
    if (selectedFilters.type === 'all' || selectedFilters.type === 'book') {
      allContent = [...allContent, ...books.map(b => ({ ...b, type: 'book' }))];
    }

    // Filter by topic
    if (selectedFilters.topic !== 'all') {
      allContent = allContent.filter(item => item.topic === selectedFilters.topic);
    }

    // Filter by search term
    if (searchTerm) {
      allContent = allContent.filter(item => 
        item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.topic?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredContent(allContent);
  };

  const getAllTopics = () => {
    const topics = new Set();
    [...courses, ...books].forEach(item => {
      if (item.topic) topics.add(item.topic);
    });
    return Array.from(topics);
  };

  if (selectedCourse) {
    return (
      <CoursePlayer 
        course={selectedCourse} 
        onBack={() => setSelectedCourse(null)}
        onUpdate={fetchContent}
      />
    );
  }

  if (selectedBook) {
    return (
      <BookViewer 
        book={selectedBook} 
        onBack={() => setSelectedBook(null)}
        onUpdate={fetchContent}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <img src="/placeholder.svg" alt="University for Real Life" className="h-8 w-8" />
              <h1 className="text-xl font-bold">University for Real Life</h1>
            </div>
            
            <nav className="flex items-center space-x-2">
              <Button
                variant={currentView === 'dashboard' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentView('dashboard')}
              >
                Dashboard
              </Button>
              <Button
                variant={currentView === 'library' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentView('library')}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Library
              </Button>
              <Button
                variant={currentView === 'calendar' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentView('calendar')}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Calendar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentView('create-course')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Course
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentView('upload-book')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Book
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'dashboard' && (
          <Dashboard courses={courses} books={books} />
        )}

        {currentView === 'library' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <LibraryFilters
                topics={getAllTopics()}
                selectedFilters={selectedFilters}
                onFiltersChange={setSelectedFilters}
              />
            </div>
            
            <div className="lg:col-span-3">
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search courses and books..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredContent.map((item) => (
                  <div
                    key={`${item.type}-${item.id}`}
                    className="bg-gray-800 rounded-lg p-6 cursor-pointer hover:bg-gray-700 transition-colors"
                    onClick={() => {
                      if (item.type === 'course') {
                        setSelectedCourse(item);
                      } else {
                        setSelectedBook(item);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-blue-400 capitalize">
                        {item.type}
                      </span>
                      {item.type === 'course' ? (
                        <Play className="h-4 w-4 text-gray-400" />
                      ) : (
                        <BookOpen className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                    {item.topic && (
                      <p className="text-sm text-gray-400 mb-2">{item.topic}</p>
                    )}
                    {item.description && (
                      <p className="text-sm text-gray-500 line-clamp-2">{item.description}</p>
                    )}
                  </div>
                ))}
              </div>

              {filteredContent.length === 0 && (
                <div className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-400 mb-2">No content found</h3>
                  <p className="text-gray-500 mb-4">Create your first course or upload a book to get started.</p>
                  <div className="flex justify-center space-x-4">
                    <Button onClick={() => setCurrentView('create-course')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Course
                    </Button>
                    <Button variant="outline" onClick={() => setCurrentView('upload-book')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Upload Book
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {currentView === 'calendar' && (
          <CalendarView />
        )}

        {currentView === 'create-course' && (
          <CourseCreator
            onSuccess={() => {
              setCurrentView('library');
              fetchContent();
              toast({
                title: "Success",
                description: "Course created successfully!"
              });
            }}
            onCancel={() => setCurrentView('library')}
          />
        )}

        {currentView === 'upload-book' && (
          <BookUploader
            onSuccess={() => {
              setCurrentView('library');
              fetchContent();
              toast({
                title: "Success",
                description: "Book uploaded successfully!"
              });
            }}
            onCancel={() => setCurrentView('library')}
          />
        )}
      </main>
    </div>
  );
};

export default Index;
