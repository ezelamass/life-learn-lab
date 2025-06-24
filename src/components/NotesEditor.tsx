
import { useState, useEffect } from 'react';
import { Save, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } = from '@/hooks/use-toast';

const NotesEditor = ({ lessonId, bookId, initialNotes = '', onSave, placeholder = "Add your notes..." }) => {
  const [notes, setNotes] = useState(initialNotes);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setNotes(initialNotes);
  }, [initialNotes]);

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      if (lessonId) {
        // Update lesson notes
        const { error } = await supabase
          .from('lessons')
          .update({ notes })
          .eq('id', lessonId);
        
        if (error) throw error;
      } else if (bookId) {
        // Update book notes
        const { error } = await supabase
          .from('books')
          .update({ notes })
          .eq('id', bookId);
        
        if (error) throw error;
      }

      setIsEditing(false);
      onSave?.(notes);
      
      toast({
        title: "Saved",
        description: "Your notes have been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving notes:', error);
      toast({
        title: "Error",
        description: "Failed to save notes. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setNotes(initialNotes);
    setIsEditing(false);
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center">
            <Edit3 className="h-5 w-5 mr-2" />
            Notes
          </CardTitle>
          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={placeholder}
              className="w-full h-64 p-4 bg-gray-700 border border-gray-600 rounded-md text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  'Saving...'
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="min-h-[100px]">
            {notes ? (
              <div className="prose prose-invert max-w-none">
                <div className="whitespace-pre-wrap text-gray-300 leading-relaxed">
                  {notes}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Edit3 className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                <p>No notes yet. Click "Edit" to add your thoughts.</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NotesEditor;
