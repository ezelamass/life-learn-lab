
import { useState, useEffect } from 'react';
import { Plus, Search, Calendar, BookOpen, Play, Edit, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  const [editingCourse, setEditingCourse] = useState(null);
  const [courses, setCourses] = useState([]);
  const [books, setBooks] = useState([]);
  const [filteredContent, setFilteredContent] = useState([]);
  const [selectedFilters, setSelectedFilters] = useState({
    type: 'all',
    tags: []
  });
  const [tags, setTags] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchContent();
    fetchTags();
    
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

  const fetchTags = async () => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name');

      if (error) throw error;
      setTags(data || []);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const filterContent = async () => {
    let allContent = [];
    
    if (selectedFilters.type === 'all' || selectedFilters.type === 'course') {
      // Get courses with their tags
      const coursesWithTags = await Promise.all(
        courses.map(async (course) => {
          const { data: courseTags } = await supabase
            .from('course_tags')
            .select(`
              tag_id,
              tags!inner(name, color)
            `)
            .eq('course_id', course.id);

          return {
            ...course,
            type: 'course',
            tags: courseTags || []
          };
        })
      );
      
      allContent = [...allContent, ...coursesWithTags];
    }
    
    if (selectedFilters.type === 'all' || selectedFilters.type === 'book') {
      allContent = [...allContent, ...books.map(b => ({ ...b, type: 'book', tags: [] }))];
    }

    // Filter by tags
    if (selectedFilters.tags.length > 0) {
      allContent = allContent.filter(item => {
        if (item.type === 'book') return false; // Books don't have tags yet
        return selectedFilters.tags.some(tagId => 
          item.tags.some(tag => tag.tag_id === tagId)
        );
      });
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

  const handleEditCourse = (course) => {
    setEditingCourse(course);
    setCurrentView('edit-course');
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
      {/* Enhanced Header */}
      <header className="border-b border-gray-800 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 backdrop-blur-sm relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-blue-600/5"></div>
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-blue-500/20 to-transparent"></div>
        <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-purple-500/20 to-transparent"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  University for Real Life
                </h1>
                <div className="h-px w-16 bg-gradient-to-r from-blue-500 to-purple-500 mt-1"></div>
              </div>
            </div>
            
            <nav className="flex items-center space-x-2">
              <Button
                variant={currentView === 'dashboard' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentView('dashboard')}
                className="bg-black text-white hover:bg-gray-800"
              >
                Dashboard
              </Button>
              <Button
                variant={currentView === 'library' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentView('library')}
                className="bg-black text-white hover:bg-gray-800"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Library
              </Button>
              <Button
                variant={currentView === 'calendar' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentView('calendar')}
                className="bg-black text-white hover:bg-gray-800"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Calendar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentView('create-course')}
                className="bg-black text-white hover:bg-gray-800 border-gray-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Course
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentView('upload-book')}
                className="bg-black text-white hover:bg-gray-800 border-gray-600"
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
                    className="bg-gray-800 rounded-lg p-6 cursor-pointer hover:bg-gray-700 transition-colors relative group"
                    onClick={() => {
                      if (item.type === 'course') {
                        setSelectedCourse(item);
                      } else {
                        setSelectedBook(item);
                      }
                    }}
                  >
                    {item.type === 'course' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditCourse(item);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    
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
                    
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {item.tags.slice(0, 3).map((tag) => (
                          <Badge
                            key={tag.tag_id}
                            style={{ backgroundColor: tag.tags.color }}
                            className="text-xs text-white"
                          >
                            {tag.tags.name}
                          </Badge>
                        ))}
                        {item.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{item.tags.length - 3}
                          </Badge>
                        )}
                      </div>
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

        {(currentView === 'create-course' || currentView === 'edit-course') && (
          <CourseCreator
            editingCourse={editingCourse}
            onSuccess={() => {
              setCurrentView('library');
              setEditingCourse(null);
              fetchContent();
              toast({
                title: "Success",
                description: editingCourse ? "Course updated successfully!" : "Course created successfully!"
              });
            }}
            onCancel={() => {
              setCurrentView('library');
              setEditingCourse(null);
            }}
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
