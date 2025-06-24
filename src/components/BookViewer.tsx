
import { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Document, Page, pdfjs } from 'react-pdf';
import NotesEditor from '@/components/NotesEditor';
import { useToast } from '@/hooks/use-toast';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const BookViewer = ({ book, onBack, onUpdate }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setLoading(false);
  };

  const onDocumentLoadError = (error) => {
    console.error('Error loading PDF:', error);
    setLoading(false);
    toast({
      title: "Error",
      description: "Failed to load PDF. Please check the file.",
      variant: "destructive"
    });
  };

  const goToPrevPage = () => {
    setPageNumber(pageNumber > 1 ? pageNumber - 1 : 1);
  };

  const goToNextPage = () => {
    setPageNumber(pageNumber < numPages ? pageNumber + 1 : numPages);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Library
              </Button>
              <div>
                <h1 className="text-xl font-bold">{book.title}</h1>
                <p className="text-sm text-gray-400">{book.topic}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-blue-500" />
              <span className="text-sm">Book</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Book Info & Notes */}
          <div className="lg:col-span-1 space-y-6">
            {/* Book Details */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Book Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-white">{book.title}</h3>
                  {book.topic && (
                    <p className="text-sm text-gray-400 mt-1">{book.topic}</p>
                  )}
                </div>
                
                {book.summary && (
                  <div>
                    <h4 className="font-medium text-gray-300 mb-2">Summary</h4>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      {book.summary}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes Editor */}
            <NotesEditor
              bookId={book.id}
              initialNotes={book.notes || ''}
              onSave={(notes) => {
                // Update book notes in parent component
                onUpdate();
              }}
              placeholder="Add your notes about this book..."
            />
          </div>

          {/* PDF Viewer */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    PDF Viewer
                  </CardTitle>
                  {numPages && (
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-400">
                        Page {pageNumber} of {numPages}
                      </span>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={goToPrevPage}
                          disabled={pageNumber <= 1}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={goToNextPage}
                          disabled={pageNumber >= numPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {book.pdf_url ? (
                  <div className="bg-white rounded-lg p-4 min-h-[600px] flex items-center justify-center">
                    {loading && (
                      <div className="text-gray-600">Loading PDF...</div>
                    )}
                    <Document
                      file={book.pdf_url}
                      onLoadSuccess={onDocumentLoadSuccess}
                      onLoadError={onDocumentLoadError}
                      loading=""
                    >
                      <Page
                        pageNumber={pageNumber}
                        width={Math.min(800, window.innerWidth - 100)}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                      />
                    </Document>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-400 mb-2">No PDF uploaded</h3>
                    <p className="text-gray-500">This book doesn't have a PDF file attached.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookViewer;
