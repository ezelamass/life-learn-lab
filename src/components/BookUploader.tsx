
import { useState } from 'react';
import { ArrowLeft, Upload, FileText, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const BookUploader = ({ onSuccess, onCancel }) => {
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [summary, setSummary] = useState('');
  const [notes, setNotes] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handlePdfUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please select a PDF file.",
        variant: "destructive"
      });
    }
  };

  const handleCoverUpload = (event) => {
    const file = event.target.files[0];
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/jpg')) {
      setCoverFile(file);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please select a JPG or PNG image file.",
        variant: "destructive"
      });
    }
  };

  const uploadFile = async (file, bucket, path) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file);

    if (error) throw error;
    return data;
  };

  const getPublicUrl = (bucket, path) => {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter a book title.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);

    try {
      let pdfUrl = null;
      let coverImageUrl = null;

      // Upload PDF if provided
      if (pdfFile) {
        const pdfFileName = `pdfs/${Date.now()}_${pdfFile.name}`;
        await uploadFile(pdfFile, 'books', pdfFileName);
        pdfUrl = getPublicUrl('books', pdfFileName);
      }

      // Upload cover image if provided
      if (coverFile) {
        const coverFileName = `covers/${Date.now()}_${coverFile.name}`;
        await uploadFile(coverFile, 'books', coverFileName);
        coverImageUrl = getPublicUrl('books', coverFileName);
      }

      // Save book to database
      const { error } = await supabase
        .from('books')
        .insert({
          title: title.trim(),
          topic: topic.trim() || null,
          summary: summary.trim() || null,
          notes: notes.trim() || null,
          pdf_url: pdfUrl,
          cover_image_url: coverImageUrl
        });

      if (error) throw error;

      onSuccess();
    } catch (error) {
      console.error('Error uploading book:', error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your book. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={onCancel}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-xl font-bold">Upload Book</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Book Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="title" className="text-gray-300">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter book title..."
                  className="bg-gray-700 border-gray-600 text-white"
                  required
                />
              </div>

              <div>
                <Label htmlFor="topic" className="text-gray-300">Topic</Label>
                <Input
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Enter book topic..."
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <div>
                <Label htmlFor="summary" className="text-gray-300">Summary</Label>
                <Textarea
                  id="summary"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Enter book summary..."
                  className="bg-gray-700 border-gray-600 text-white min-h-[100px]"
                />
              </div>

              <div>
                <Label htmlFor="notes" className="text-gray-300">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter your notes about this book..."
                  className="bg-gray-700 border-gray-600 text-white min-h-[100px]"
                />
              </div>

              <div>
                <Label htmlFor="cover" className="text-gray-300">Cover Image</Label>
                <div className="mt-2">
                  <Input
                    id="cover"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleCoverUpload}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                  {coverFile && (
                    <p className="text-sm text-green-400 mt-2 flex items-center">
                      <Image className="h-4 w-4 mr-2" />
                      {coverFile.name}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="pdf" className="text-gray-300">PDF File</Label>
                <div className="mt-2">
                  <Input
                    id="pdf"
                    type="file"
                    accept=".pdf"
                    onChange={handlePdfUpload}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                  {pdfFile && (
                    <p className="text-sm text-green-400 mt-2 flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      {pdfFile.name}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex space-x-4 pt-6">
                <Button
                  type="submit"
                  disabled={uploading || !title.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {uploading ? (
                    <>
                      <Upload className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Book
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default BookUploader;
