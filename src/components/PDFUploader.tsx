
import { useState } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PDFUploaderProps {
  onPDFUploaded: (url: string) => void;
  onCancel?: () => void;
}

const PDFUploader = ({ onPDFUploaded, onCancel }: PDFUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const uploadPDF = async (file: File) => {
    if (file.type !== 'application/pdf') {
      toast({
        title: "Error",
        description: "Please select a PDF file",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      toast({
        title: "Error",
        description: "PDF file must be less than 50MB",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);

    try {
      const fileName = `${Date.now()}.pdf`;
      const filePath = `pdfs/${fileName}`;

      const { data, error } = await supabase.storage
        .from('course-videos')
        .upload(filePath, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('course-videos')
        .getPublicUrl(data.path);

      onPDFUploaded(urlData.publicUrl);
      
      toast({
        title: "Success",
        description: "PDF uploaded successfully"
      });
    } catch (error) {
      console.error('Error uploading PDF:', error);
      toast({
        title: "Error",
        description: "Failed to upload PDF",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadPDF(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files?.[0]) {
      uploadPDF(files[0]);
    }
  };

  return (
    <Card className="bg-gray-700 border-gray-600">
      <CardContent className="p-6">
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-500 bg-opacity-10'
              : 'border-gray-500 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {uploading ? (
            <div className="space-y-4">
              <FileText className="h-8 w-8 mx-auto text-blue-500 animate-pulse" />
              <div>
                <p className="text-white mb-2">Uploading PDF...</p>
                <div className="w-full bg-gray-600 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{ width: '50%' }}></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="h-8 w-8 mx-auto text-gray-400" />
              <div>
                <p className="text-white mb-2">
                  Drag and drop a PDF here, or click to select
                </p>
                <p className="text-sm text-gray-400">
                  Supports PDF files (max 50MB)
                </p>
              </div>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
                id="pdf-upload"
                disabled={uploading}
              />
              <div className="flex justify-center space-x-2">
                <Button asChild variant="outline" disabled={uploading}>
                  <label htmlFor="pdf-upload" className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    Select PDF
                  </label>
                </Button>
                {onCancel && (
                  <Button variant="ghost" onClick={onCancel} disabled={uploading}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PDFUploader;
