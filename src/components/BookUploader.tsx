
import { useState } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const BookUploader = ({ onSuccess, onCancel }) => {
  const [bookData, setBookData] = useState({
    title: '',
    topic: '',
    summary: '',
    notes: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      // Auto-fill title from filename if empty
      if (!bookData.title) {
        const fileName = file.name.replace('.pdf', '').replace(/[-_]/g, ' ');
        setBookData({...bookData, title: fileName});
      }
    } else {
      toast({
        title: "Error",
        description: "Please select a PDF file",
        variant: "destructive"
      });
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      if (!bookData.title) {
        const fileName = file.name.replace('.pdf', '').replace(/[-_]/g, ' ');
        setBookData({...bookData, title: fileName});
      }
    } else {
      toast({
        title: "Error",
        description: "Please select a PDF file",
        variant: "destructive"
      });
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!bookData.title.trim()) {
      toast({
        title: "Error",
        description: "Book title is required",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      let pdfUrl = null;

      // Upload PDF if selected
      if (selectedFile) {
        const fileExt = 'pdf';
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `books/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('course-files')
          .upload(filePath, selectedFile);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data } = supabase.storage
          .from('course-files')
          .getPublicUrl(filePath);

        pdfUrl = data.publicUrl;
      }

      // Create book record
      const { error: bookError } = await supabase
        .from('books')
        .insert([{
          ...bookData,
          pdf_url: pdfUrl
        }]);

      if (bookError) throw bookError;

      onSuccess();
    } catch (error) {
      console.error('Error uploading book:', error);
      toast({
        title: "Error",
        description: "Failed to upload book. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Upload Book</h2>
        <p className="text-gray-400">Add a new book to your library</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Book Details */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Book Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-gray-300">Title *</Label>
              <Input
                id="title"
                value={bookData.title}
                onChange={(e) => setBookData({...bookData, title: e.target.value})}
                placeholder="Enter book title"
                className="bg-gray-700 border-gray-600 text-white mt-1"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="topic" className="text-gray-300">Topic</Label>
              <Input
                id="topic"
                value={bookData.topic}
                onChange={(e) => setBookData({...bookData, topic: e.target.value})}
                placeholder="e.g., Programming, Philosophy, Business"
                className="bg-gray-700 border-gray-600 text-white mt-1"
              />
            </div>

            <div>
              <Label htmlFor="summary" className="text-gray-300">Summary</Label>
              <textarea
                id="summary"
                value={bookData.summary}
                onChange={(e) => setBookData({...bookData, summary: e.target.value})}
                placeholder="Brief summary of the book"
                className="w-full mt-1 p-3 bg-gray-700 border border-gray-600 rounded-md text-white resize-none"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="notes" className="text-gray-300">Notes</Label>
              <textarea
                id="notes"
                value={bookData.notes}
                onChange={(e) => setBookData({...bookData, notes: e.target.value})}
                placeholder="Your notes about this book"
                className="w-full mt-1 p-3 bg-gray-700 border border-gray-600 rounded-md text-white resize-none"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* File Upload */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">PDF File</CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedFile ? (
              <div
                className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-gray-500 transition-colors"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => document.getElementById('file-input').click()}
              >
                <Upload className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-300 mb-2">Drop your PDF here or click to browse</p>
                <p className="text-sm text-gray-500">PDF files only</p>
                <input
                  id="file-input"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="bg-gray-700 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="h-8 w-8 text-red-500" />
                  <div>
                    <p className="font-medium text-white">{selectedFile.name}</p>
                    <p className="text-sm text-gray-400">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={removeFile}
                  className="text-red-400 hover:text-red-300"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isUploading}>
            {isUploading ? 'Uploading...' : 'Upload Book'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default BookUploader;
