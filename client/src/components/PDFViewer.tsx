import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PDFViewerProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl?: string | null;
  fileName?: string;
}

/**
 * PDF Viewer Component
 * Visualizza file PDF in un viewer integrato con supporto per:
 * - Navigazione pagine
 * - Download
 * - Zoom
 * - Visualizzazione a schermo intero
 */
export default function PDFViewer({ isOpen, onClose, pdfUrl, fileName = 'documento.pdf' }: PDFViewerProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [scale, setScale] = useState(1);

  if (!pdfUrl) {
    return null;
  }

  const handleDownload = () => {
    try {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Download avviato');
    } catch (error) {
      toast.error('Errore nel download del file');
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleZoomIn = () => {
    setScale(Math.min(scale + 0.2, 2));
  };

  const handleZoomOut = () => {
    setScale(Math.max(scale - 0.2, 0.5));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Visualizzatore PDF - {fileName}</DialogTitle>
        </DialogHeader>

        {/* PDF Viewer Area */}
        <div className="flex-1 overflow-auto bg-gray-100 rounded-lg flex items-center justify-center">
          {isLoading && (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Caricamento PDF...</p>
            </div>
          )}
          
          {pdfUrl && (
            <iframe
              src={`${pdfUrl}#page=${currentPage}&zoom=${scale * 100}`}
              className="w-full h-full border-0"
              onLoad={() => setIsLoading(false)}
              title="PDF Viewer"
            />
          )}
        </div>

        {/* Controls */}
        <div className="flex-shrink-0 border-t pt-4 space-y-4">
          {/* Navigation Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrevPage}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <span className="text-sm text-muted-foreground px-2">
                Pagina {currentPage} di {totalPages || '?'}
              </span>
              
              <Button
                variant="outline"
                size="icon"
                onClick={handleNextPage}
                disabled={currentPage >= totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomOut}
                disabled={scale <= 0.5}
              >
                -
              </Button>
              
              <span className="text-sm text-muted-foreground px-2 min-w-[60px] text-center">
                {Math.round(scale * 100)}%
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomIn}
                disabled={scale >= 2}
              >
                +
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleDownload}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Scarica
            </Button>
            <Button
              variant="default"
              onClick={onClose}
            >
              Chiudi
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

