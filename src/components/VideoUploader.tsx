
import { useState } from 'react';
import { Upload, Video, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface VideoUploaderProps {
  onVideoUploaded: (url: string) => void;
  onCancel?: () => void;
}

const VideoUploader = ({ onVideoUploaded, onCancel }: VideoUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const uploadVideo = async (file: File) => {
    if (!file.type.startsWith('video/')) {
      toast({
        title: "Error",
        description: "Please select a video file",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 100 * 1024 * 1024) { // 100MB limit
      toast({
        title: "Error",
        description: "Video file must be less than 100MB",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `videos/${fileName}`;

      const { data, error } = await supabase.storage
        .from('course-videos')
        .upload(filePath, file, {
          onUploadProgress: (progress) => {
            setUploadProgress((progress.loaded / progress.total) * 100);
          }
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('course-videos')
        .getPublicUrl(data.path);

      onVideoUploaded(urlData.publicUrl);
      
      toast({
        title: "Success",
        description: "Video uploaded successfully"
      });
    } catch (error) {
      console.error('Error uploading video:', error);
      toast({
        title: "Error",
        description: "Failed to upload video",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadVideo(file);
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
      uploadVideo(files[0]);
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
              <Video className="h-8 w-8 mx-auto text-blue-500" />
              <div>
                <p className="text-white mb-2">Uploading video...</p>
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-sm text-gray-400 mt-1">
                  {Math.round(uploadProgress)}%
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="h-8 w-8 mx-auto text-gray-400" />
              <div>
                <p className="text-white mb-2">
                  Drag and drop a video file here, or click to select
                </p>
                <p className="text-sm text-gray-400">
                  Supports MP4, WebM, AVI (max 100MB)
                </p>
              </div>
              <input
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
                id="video-upload"
                disabled={uploading}
              />
              <div className="flex justify-center space-x-2">
                <Button asChild variant="outline" disabled={uploading}>
                  <label htmlFor="video-upload" className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    Select Video
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

export default VideoUploader;
