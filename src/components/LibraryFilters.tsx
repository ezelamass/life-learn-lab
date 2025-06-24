
import { Filter, BookOpen, Play, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const LibraryFilters = ({ topics, selectedFilters, onFiltersChange }) => {
  const contentTypes = [
    { value: 'all', label: 'All Content', icon: Filter },
    { value: 'course', label: 'Courses', icon: Play },
    { value: 'book', label: 'Books', icon: BookOpen }
  ];

  const updateFilter = (filterType, value) => {
    onFiltersChange({
      ...selectedFilters,
      [filterType]: value
    });
  };

  return (
    <div className="space-y-6">
      {/* Content Type Filter */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-sm">Content Type</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {contentTypes.map((type) => {
            const Icon = type.icon;
            return (
              <Button
                key={type.value}
                variant={selectedFilters.type === type.value ? 'default' : 'ghost'}
                size="sm"
                className="w-full justify-start"
                onClick={() => updateFilter('type', type.value)}
              >
                <Icon className="h-4 w-4 mr-2" />
                {type.label}
              </Button>
            );
          })}
        </CardContent>
      </Card>

      {/* Topic Filter */}
      {topics.length > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-sm">Topics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant={selectedFilters.topic === 'all' ? 'default' : 'ghost'}
              size="sm"
              className="w-full justify-start"
              onClick={() => updateFilter('topic', 'all')}
            >
              All Topics
            </Button>
            {topics.map((topic) => (
              <Button
                key={topic}
                variant={selectedFilters.topic === topic ? 'default' : 'ghost'}
                size="sm"
                className="w-full justify-start"
                onClick={() => updateFilter('topic', topic)}
              >
                <FileText className="h-4 w-4 mr-2" />
                {topic}
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Clear Filters */}
      {(selectedFilters.type !== 'all' || selectedFilters.topic !== 'all') && (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => onFiltersChange({ type: 'all', topic: 'all' })}
        >
          Clear Filters
        </Button>
      )}
    </div>
  );
};

export default LibraryFilters;
