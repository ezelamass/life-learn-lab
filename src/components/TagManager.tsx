
import { useState, useEffect } from 'react';
import { Plus, X, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface TagManagerProps {
  selectedTags?: string[];
  onTagsChange?: (tagIds: string[]) => void;
  mode?: 'select' | 'manage';
}

const TagManager = ({ selectedTags = [], onTagsChange, mode = 'select' }: TagManagerProps) => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3B82F6');
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

  const colors = [
    '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', 
    '#EF4444', '#EC4899', '#06B6D4', '#84CC16'
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
      toast({
        title: "Error",
        description: "Failed to load tags",
        variant: "destructive"
      });
    }
  };

  const addTag = async () => {
    if (!newTagName.trim()) return;

    setIsAdding(true);
    try {
      const { data, error } = await supabase
        .from('tags')
        .insert([{ name: newTagName.trim(), color: newTagColor }])
        .select()
        .single();

      if (error) throw error;

      setTags([...tags, data]);
      setNewTagName('');
      setNewTagColor('#3B82F6');
      
      toast({
        title: "Success",
        description: "Tag created successfully"
      });
    } catch (error) {
      console.error('Error creating tag:', error);
      toast({
        title: "Error",
        description: "Failed to create tag",
        variant: "destructive"
      });
    } finally {
      setIsAdding(false);
    }
  };

  const deleteTag = async (tagId: string) => {
    try {
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', tagId);

      if (error) throw error;

      setTags(tags.filter(tag => tag.id !== tagId));
      
      toast({
        title: "Success",
        description: "Tag deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting tag:', error);
      toast({
        title: "Error",
        description: "Failed to delete tag",
        variant: "destructive"
      });
    }
  };

  const toggleTag = (tagId: string) => {
    if (!onTagsChange) return;
    
    const newSelected = selectedTags.includes(tagId)
      ? selectedTags.filter(id => id !== tagId)
      : [...selectedTags, tagId];
    
    onTagsChange(newSelected);
  };

  if (mode === 'manage') {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Tag className="h-5 w-5 mr-2" />
            Manage Tags
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="Tag name"
              className="bg-gray-700 border-gray-600 text-white"
              onKeyPress={(e) => e.key === 'Enter' && addTag()}
            />
            <div className="flex space-x-1">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => setNewTagColor(color)}
                  className={`w-6 h-6 rounded-full border-2 ${
                    newTagColor === color ? 'border-white' : 'border-gray-600'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <Button onClick={addTag} disabled={isAdding} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge
                key={tag.id}
                style={{ backgroundColor: tag.color }}
                className="text-white flex items-center space-x-1"
              >
                <span>{tag.name}</span>
                <button
                  onClick={() => deleteTag(tag.id)}
                  className="ml-1 hover:bg-white hover:bg-opacity-20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-300">Tags</label>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Badge
            key={tag.id}
            onClick={() => toggleTag(tag.id)}
            style={{ 
              backgroundColor: selectedTags.includes(tag.id) ? tag.color : 'transparent',
              borderColor: tag.color
            }}
            className={`cursor-pointer border text-white hover:opacity-80 ${
              selectedTags.includes(tag.id) ? '' : 'hover:bg-opacity-20'
            }`}
          >
            {tag.name}
          </Badge>
        ))}
      </div>
    </div>
  );
};

export default TagManager;
