import { useState } from 'react';
import { Upload, FileText, Calculator, AlertTriangle, Check, X, ChevronRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { extractTextFromPdf, parseBillText, ParsedBillData, MOCK_PDF_TEXT, parseEuropeanNumber } from '@/lib/pdfParser';
import { BillData, CalculationResult, DEFAULT_SQM, DEFAULT_VAT_INCLUDES, CATEGORY_LABELS } from '@/lib/types';
import { calculateSplit } from '@/lib/calculations';
import { ResultsDisplay } from '@/components/ResultsDisplay';
import { saveBill } from '@/lib/storage';
import { toast } from 'sonner';

type Step = 'upload' | 'kwh' | 'results';

interface UnmappedAssignment {
  lineIndex: number;
  category: string | null;
}

interface Props {
  onBack?: () => void;
}

export function QuickSplit({ onBack }: Props) {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Parsed data
  const [parsedData, setParsedData] = useState<ParsedBillData | null>(null);
  const [unmappedAssignments, setUnmappedAssignments] = useState<UnmappedAssignment[]>([]);
  
  // kWh inputs
  const [kwhMatina, setKwhMatina] = useState('');
  const [kwhKaterina, setKwhKaterina] = useState('');
  const [kwhWarning, setKwhWarning] = useState<string | null>(null);
  
  // Results
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [billData, setBillData] = useState<BillData | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type === 'application/pdf') {
      setFile(droppedFile);
      setError(null);
    } else {
      setError('Παρακαλώ επιλέξτε αρχείο PDF');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile?.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
    } else {
      setError('Παρακαλώ επιλέξτε αρχείο PDF');
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const extractResult = await extractTextFromPdf(file);
      
      if (!extractResult.success) {
        setError(extractResult.error || 'Σφάλμα ανάλυσης');
        setIsProcessing(false);
        return;
      }
      
      const parsed = parseBillText(extractResult.text);
      setParsedData(parsed);
      
      // Check if we need unmapped assignments
      const hasUnmapped = parsed.unmappedLines.length > 0 && parsed.fields.length < 5;
      if (hasUnmapped) {
        setUnmappedAssignments(parsed.unmappedLines.map((_, i) => ({ lineIndex: i, category: null })));
      }
      
      setStep('kwh');
      toast.success('PDF αναλύθηκε επιτυχώς!');
    } catch (err) {
      setError('Σφάλμα ανάλυσης PDF');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDemoMode = () => {
    const parsed = parseBillText(MOCK_PDF_TEXT);
    setParsedData(parsed);
    setStep('kwh');
    toast.info('Demo mode: Χρήση δοκιμαστικών δεδομένων');
  };

  const getFieldValue = (key: string): number => {
    // First check parsed fields
    const field = parsedData?.fields.find(f => f.key === key);
    if (field?.value !== null && field?.value !== undefined) {
      return field.value;
    }
    
    // Then check unmapped assignments
    const assignedLine = unmappedAssignments.find(a => a.category === key);
    if (assignedLine !== null && assignedLine !== undefined) {
      const line = parsedData?.unmappedLines[assignedLine.lineIndex];
      if (line?.potentialAmount !== null && line?.potentialAmount !== undefined) {
        return line.potentialAmount;
      }
    }
    
    return 0;
  };

  const handleCalculate = () => {
    const matina = parseEuropeanNumber(kwhMatina) || 0;
    const katerina = parseEuropeanNumber(kwhKaterina) || 0;
    
    // Validate kWh
    if (matina === 0 && katerina === 0) {
      setKwhWarning('Τουλάχιστον μία kWh πρέπει να είναι μεγαλύτερη από 0');
      return;
    }
    
    if (matina === 0 || katerina === 0) {
      setKwhWarning(`Προσοχή: ${matina === 0 ? 'Ματίνα' : 'Κατερίνα'} = 0 kWh`);
    } else {
      setKwhWarning(null);
    }
    
    // Build BillData
    const vatValue = getFieldValue('vat');
    
    const data: BillData = {
      period: {
        from: parsedData?.periodFrom || '',
        to: parsedData?.periodTo || '',
      },
      kwh: {
        matina,
        katerina,
      },
      sqm: DEFAULT_SQM,
      charges: {
        energy_supply: getFieldValue('energy_supply'),
        fixed_fee: getFieldValue('fixed_fee'),
        regulated: getFieldValue('regulated'),
        misc: getFieldValue('misc'),
        municipal_fees_dt: getFieldValue('municipal_fees_dt'),
        municipal_tax_df: getFieldValue('municipal_tax_df'),
        tap: getFieldValue('tap'),
        ert: getFieldValue('ert'),
        vat: {
          mode: 'amount',
          value: vatValue,
        },
        credit: {
          enabled: false,
          amount: 0,
          split: 'kwh',
        },
      },
      vat_includes: DEFAULT_VAT_INCLUDES,
    };
    
    // Warn if VAT is missing
    if (vatValue === 0) {
      toast.warning('ΦΠΑ δεν βρέθηκε - ο υπολογισμός συνεχίζει χωρίς ΦΠΑ');
    }
    
    try {
      const calcResult = calculateSplit(data);
      setResult(calcResult);
      setBillData(data);
      setStep('results');
      
      // Save to history
      saveBill(data, calcResult);
      toast.success('Υπολογισμός ολοκληρώθηκε!');
    } catch (err) {
      toast.error('Σφάλμα υπολογισμού');
    }
  };

  const handleAssignCategory = (lineIndex: number, category: string | null) => {
    setUnmappedAssignments(prev => 
      prev.map(a => a.lineIndex === lineIndex ? { ...a, category } : a)
    );
  };

  const handleReset = () => {
    setStep('upload');
    setFile(null);
    setParsedData(null);
    setUnmappedAssignments([]);
    setKwhMatina('');
    setKwhKaterina('');
    setKwhWarning(null);
    setResult(null);
    setBillData(null);
    setError(null);
  };

  const availableCategories = [
    'energy_supply', 'fixed_fee', 'regulated', 'misc',
    'municipal_fees_dt', 'municipal_tax_df', 'tap', 'ert', 'vat'
  ].filter(key => !parsedData?.fields.some(f => f.key === key));

  // Step indicator
  const StepIndicator = () => (
    <div className="mb-6 flex items-center justify-center gap-2">
      <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
        step === 'upload' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
      }`}>
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-background/20 text-xs">1</span>
        Upload PDF
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
      <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
        step === 'kwh' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
      }`}>
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-background/20 text-xs">2</span>
        kWh
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
      <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
        step === 'results' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
      }`}>
        <Check className="h-4 w-4" />
        Αποτέλεσμα
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-2xl">
      <StepIndicator />

      {/* Step 1: Upload PDF */}
      {step === 'upload' && (
        <Card className="card-elevated">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Upload className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold">Ανέβασμα PDF ΔΕΗ</h3>
                <p className="text-sm text-muted-foreground">Ανεβάστε τον λογαριασμό σας (email PDF)</p>
              </div>
            </div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-all ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : file
                  ? 'border-dei-green bg-dei-green/5'
                  : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
              }`}
            >
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="absolute inset-0 cursor-pointer opacity-0"
              />

              {file ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-dei-green/20">
                    <FileText className="h-6 w-6 text-dei-green" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="mr-1 h-4 w-4" /> Αφαίρεση
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">Σύρετε το PDF εδώ</p>
                    <p className="text-sm text-muted-foreground">ή κάντε κλικ για επιλογή</p>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <Button
                onClick={handleAnalyze}
                disabled={!file || isProcessing}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                {isProcessing ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                    Ανάλυση...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Ανάλυση PDF
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleDemoMode}>
                Demo
              </Button>
            </div>

            {onBack && (
              <Button variant="ghost" onClick={onBack} className="mt-4 w-full text-muted-foreground">
                ← Πίσω στην αρχική
              </Button>
            )}

            <p className="mt-4 text-center text-xs text-muted-foreground">
              🔒 Το PDF επεξεργάζεται τοπικά στον browser σας. Δεν αποστέλλεται πουθενά.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Step 2: kWh Input */}
      {step === 'kwh' && parsedData && (
        <Card className="card-elevated">
          <CardContent className="p-6">
            {/* Parsed Summary */}
            <div className="mb-6 rounded-xl bg-muted/50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="font-medium">Εξαγόμενα στοιχεία</h4>
                {parsedData.periodFrom && (
                  <Badge variant="secondary">
                    {parsedData.periodFrom} - {parsedData.periodTo}
                  </Badge>
                )}
              </div>
              <div className="grid gap-2 text-sm">
                {parsedData.fields.map((field) => (
                  <div key={field.key} className="flex items-center justify-between">
                    <span className="text-muted-foreground">{field.label}</span>
                    <span className="font-medium">
                      {field.value?.toFixed(2) ?? '-'} €
                      {field.confidence === 'high' && (
                        <Check className="ml-1 inline h-3 w-3 text-dei-green" />
                      )}
                    </span>
                  </div>
                ))}
                {parsedData.fields.length === 0 && (
                  <p className="text-muted-foreground">Δεν βρέθηκαν χρεώσεις</p>
                )}
              </div>
            </div>

            {/* Unmapped Lines (if any with missing categories) */}
            {unmappedAssignments.length > 0 && availableCategories.length > 0 && (
              <div className="mb-6 rounded-xl border border-dei-yellow/30 bg-dei-yellow/5 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-dei-yellow" />
                  <h4 className="font-medium">Ασαφείς γραμμές</h4>
                </div>
                <p className="mb-3 text-sm text-muted-foreground">
                  Αντιστοιχίστε τις παρακάτω γραμμές σε κατηγορίες (προαιρετικά):
                </p>
                <div className="space-y-2">
                  {parsedData.unmappedLines.slice(0, 5).map((line, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <div className="min-w-0 flex-1 truncate rounded bg-background px-2 py-1">
                        {line.text} 
                        <span className="ml-2 font-medium text-primary">
                          {line.potentialAmount?.toFixed(2)} €
                        </span>
                      </div>
                      <Select
                        value={unmappedAssignments[i]?.category || ''}
                        onValueChange={(v) => handleAssignCategory(i, v || null)}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Κατηγορία" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">— Αγνόηση —</SelectItem>
                          {availableCategories.map(cat => (
                            <SelectItem key={cat} value={cat}>
                              {CATEGORY_LABELS[cat]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* kWh Inputs */}
            <div className="mb-6">
              <h4 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold">
                <Calculator className="h-5 w-5 text-primary" />
                Κατανάλωση kWh
              </h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="kwh-matina" className="mb-2 block text-sm font-medium">
                    kWh Ματίνα
                  </Label>
                  <Input
                    id="kwh-matina"
                    type="text"
                    inputMode="decimal"
                    placeholder="π.χ. 120"
                    value={kwhMatina}
                    onChange={(e) => setKwhMatina(e.target.value)}
                    className="text-lg"
                  />
                </div>
                <div>
                  <Label htmlFor="kwh-katerina" className="mb-2 block text-sm font-medium">
                    kWh Κατερίνα
                  </Label>
                  <Input
                    id="kwh-katerina"
                    type="text"
                    inputMode="decimal"
                    placeholder="π.χ. 130"
                    value={kwhKaterina}
                    onChange={(e) => setKwhKaterina(e.target.value)}
                    className="text-lg"
                  />
                </div>
              </div>
              {parsedData.totalKwh && (
                <p className="mt-2 text-sm text-muted-foreground">
                  💡 Συνολική κατανάλωση από PDF: <strong>{parsedData.totalKwh} kWh</strong>
                </p>
              )}
            </div>

            {kwhWarning && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-dei-yellow/10 px-4 py-3 text-sm text-dei-yellow">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                {kwhWarning}
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('upload')}>
                ← Πίσω
              </Button>
              <Button onClick={handleCalculate} className="flex-1 bg-dei-green hover:bg-dei-green/90">
                <Calculator className="mr-2 h-4 w-4" />
                Υπολογισμός
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Results */}
      {step === 'results' && result && billData && (
        <div className="space-y-6">
          <ResultsDisplay result={result} billData={billData} onSaved={() => {}} />
          
          <div className="flex justify-center">
            <Button variant="outline" onClick={handleReset} className="gap-2">
              <Upload className="h-4 w-4" />
              Νέος Υπολογισμός
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
