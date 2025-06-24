
import { useState, useEffect } from 'react';
import { Filter, BookOpen, Play, Tag, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import TagManager from '@/components/TagManager';
import { supabase } from '@/integrations/supabase/client';

interface LibraryFiltersProps {
  selectedFilters: {
    type: string;
    tags: string[];
  };
  onFiltersChange: (filters: { type: string; tags: string[] }) => void;
}

const LibraryFilters = ({ selectedFilters, onFiltersChange }: LibraryFiltersProps) => {
  const [tags, setTags] = useState([]);
  const [showTagManager, setShowTagManager] = useState(false);

  const contentTypes = [
    { value: 'all', label: 'All Content', icon: Filter },
    { value: 'course', label: 'Courses', icon: Play },
    { value: 'book', label: 'Books', icon: BookOpen }
  ];

  useEffect(() => {
    fetchTags();
  }, []);

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

  const updateFilter = (filterType: string, value: any) => {
    onFiltersChange({
      ...selectedFilters,
      [filterType]: value
    });
  };

  const toggleTag = (tagId: string) => {
    const newTags = selectedFilters.tags.includes(tagId)
      ? selectedFilters.tags.filter(id => id !== tagId)
      : [...selectedFilters.tags, tagId];
    
    updateFilter('tags', newTags);
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

      {/* Tag Filter */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-sm flex items-center">
              <Tag className="h-4 w-4 mr-2" />
              Tags
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTagManager(!showTagManager)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {showTagManager && (
            <div className="mb-4">
              <TagManager mode="manage" />
            </div>
          )}
          
          <Button
            variant={selectedFilters.tags.length === 0 ? 'default' : 'ghost'}
            size="sm"
            className="w-full justify-start mb-2"
            onClick={() => updateFilter('tags', [])}
          >
            All Tags
          </Button>
          
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge
                key={tag.id}
                onClick={() => toggleTag(tag.id)}
                style={{ 
                  backgroundColor: selectedFilters.tags.includes(tag.id) ? tag.color : 'transparent',
                  borderColor: tag.color
                }}
                className={`cursor-pointer border text-white hover:opacity-80 ${
                  selectedFilters.tags.includes(tag.id) ? '' : 'hover:bg-opacity-20'
                }`}
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Clear Filters */}
      {(selectedFilters.type !== 'all' || selectedFilters.tags.length > 0) && (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => onFiltersChange({ type: 'all', tags: [] })}
        >
          Clear Filters
        </Button>
      )}
    </div>
  );
};

export default LibraryFilters;
