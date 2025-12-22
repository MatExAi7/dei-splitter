import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, AlertTriangle, Check, X, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { extractTextFromPdf, parseBillText, ParsedBillData, MOCK_PDF_TEXT } from '@/lib/pdfParser';
import { toast } from 'sonner';

interface PdfUploadProps {
  onParsed: (data: ParsedBillData) => void;
}

export function PdfUpload({ onParsed }: PdfUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type === 'application/pdf') {
      setFile(droppedFile);
    } else {
      setError('Παρακαλώ επιλέξτε αρχείο PDF');
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const selectedFile = e.target.files?.[0];
    if (selectedFile?.type === 'application/pdf') {
      setFile(selectedFile);
    } else if (selectedFile) {
      setError('Παρακαλώ επιλέξτε αρχείο PDF');
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      const result = await extractTextFromPdf(file);
      
      if (!result.success) {
        setError(result.error || 'Σφάλμα ανάλυσης');
        toast.error(result.error || 'Σφάλμα ανάλυσης');
        return;
      }

      const parsedData = parseBillText(result.text);
      onParsed(parsedData);
      toast.success('Το PDF αναλύθηκε επιτυχώς!');
    } catch (err) {
      setError('Σφάλμα κατά την ανάλυση του PDF');
      toast.error('Σφάλμα ανάλυσης');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUseMockData = () => {
    const parsedData = parseBillText(MOCK_PDF_TEXT);
    onParsed(parsedData);
    toast.success('Φορτώθηκαν δοκιμαστικά δεδομένα');
  };

  const handleClear = () => {
    setFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200',
          isDragging
            ? 'border-primary bg-primary/5'
            : file
            ? 'border-dei-green bg-dei-green/5'
            : 'border-border hover:border-primary/50 hover:bg-muted/50'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          className="hidden"
        />

        {file ? (
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-dei-green/20">
              <Check className="h-7 w-7 text-dei-green" />
            </div>
            <div>
              <p className="font-medium text-foreground">{file.name}</p>
              <p className="text-sm text-muted-foreground">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="mr-1 h-4 w-4" />
              Αφαίρεση
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className={cn(
              'flex h-14 w-14 items-center justify-center rounded-full transition-colors',
              isDragging ? 'bg-primary/20' : 'bg-muted'
            )}>
              <Upload className={cn(
                'h-7 w-7 transition-colors',
                isDragging ? 'text-primary' : 'text-muted-foreground'
              )} />
            </div>
            <div>
              <p className="font-medium text-foreground">
                Σύρετε το PDF εδώ ή κάντε κλικ
              </p>
              <p className="text-sm text-muted-foreground">
                Μόνο αρχεία .pdf με επιλέξιμο κείμενο
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
          <div>
            <p className="font-medium text-destructive">{error}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Χρησιμοποιήστε χειροκίνητη εισαγωγή ή JSON mode.
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={handleAnalyze}
          disabled={!file || isProcessing}
          className="flex-1 gap-2 btn-primary"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Ανάλυση...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4" />
              Ανάλυση PDF
            </>
          )}
        </Button>
        
        <Button
          variant="outline"
          onClick={handleUseMockData}
          className="gap-2"
        >
          <Sparkles className="h-4 w-4" />
          Demo Mode
        </Button>
      </div>

      {/* Info */}
      <p className="text-center text-xs text-muted-foreground">
        🔒 Η ανάλυση γίνεται τοπικά στον browser σας. Κανένα αρχείο δεν αποστέλλεται σε server.
      </p>
    </div>
  );
}
