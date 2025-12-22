import { useState } from 'react';
import { Zap, FileText, Settings } from 'lucide-react';
import { Header } from '@/components/Header';
import { ModeToggle } from '@/components/ModeToggle';
import { BillForm } from '@/components/BillForm';
import { JsonEditor } from '@/components/JsonEditor';
import { ResultsDisplay } from '@/components/ResultsDisplay';
import { HistoryPanel } from '@/components/HistoryPanel';
import { QuickSplit } from '@/components/QuickSplit';
import { BillData, CalculationResult } from '@/lib/types';
import { calculateSplit } from '@/lib/calculations';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

type ViewMode = 'home' | 'quick-split' | 'manual';

const Index = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('home');
  const [mode, setMode] = useState<'form' | 'json'>('form');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [currentBillData, setCurrentBillData] = useState<BillData | null>(null);
  const [formKey, setFormKey] = useState(0);

  const handleCalculate = (data: BillData) => {
    try {
      const calculationResult = calculateSplit(data);
      setResult(calculationResult);
      setCurrentBillData(data);
      toast.success('Υπολογισμός ολοκληρώθηκε!');
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Σφάλμα υπολογισμού');
      }
    }
  };

  const handleLoadFromHistory = (data: BillData) => {
    setCurrentBillData(data);
    setFormKey(prev => prev + 1);
    setViewMode('manual');
    setMode('form');
    
    try {
      const calculationResult = calculateSplit(data);
      setResult(calculationResult);
    } catch (error) {
      console.error('Error calculating loaded bill:', error);
    }
  };

  const handleReset = () => {
    setResult(null);
    setCurrentBillData(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onHistoryClick={() => setHistoryOpen(true)} />

      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl">
          {/* Home View - Quick Split CTA */}
          {viewMode === 'home' && (
            <>
              {/* Hero Section */}
              <div className="mb-8 text-center">
                <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Επιμερισμός Λογαριασμού ΔΕΗ
                </h2>
                <p className="mt-2 text-lg text-muted-foreground">
                  2 βήματα και τέλος
                </p>
              </div>

              {/* Quick Split CTA */}
              <div className="mb-8 flex flex-col items-center gap-4">
                <Button
                  onClick={() => setViewMode('quick-split')}
                  size="lg"
                  className="h-16 gap-3 bg-gradient-to-r from-primary to-dei-blue px-8 text-lg font-semibold shadow-lg transition-transform hover:scale-105"
                >
                  <Zap className="h-6 w-6" />
                  Quick Split από PDF
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setViewMode('manual')}
                  className="text-muted-foreground"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Χειροκίνητη εισαγωγή
                </Button>
              </div>

              {/* Info Section */}
              <div className="mt-12 rounded-2xl border border-border bg-card/50 p-6">
                <h4 className="mb-4 font-display text-lg font-semibold">Κανόνες Επιμερισμού</h4>
                <div className="grid gap-4 text-sm sm:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <span className="inline-block rounded-full bg-dei-yellow/20 px-2 py-0.5 text-xs font-medium text-dei-yellow">
                      kWh
                    </span>
                    <p className="text-muted-foreground">
                      Προμήθεια, Πάγιο, Ρυθμιζόμενες, Διάφορα, ΦΠΑ
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="inline-block rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
                      τ.μ.
                    </span>
                    <p className="text-muted-foreground">
                      Δημοτικά Τέλη (ΔΤ), Δημοτικός Φόρος (ΔΦ)
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="inline-block rounded-full bg-dei-green/20 px-2 py-0.5 text-xs font-medium text-dei-green">
                      50-50
                    </span>
                    <p className="text-muted-foreground">
                      ΕΡΤ
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="inline-block rounded-full bg-accent/20 px-2 py-0.5 text-xs font-medium text-accent">
                      100% Κ
                    </span>
                    <p className="text-muted-foreground">
                      ΤΑΠ (χρεώνεται μόνο στην Κατερίνα)
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  Τετραγωνικά: Ματίνα 53 τ.μ. | Κατερίνα 207 τ.μ. (σύνολο 260 τ.μ.)
                </p>
              </div>
            </>
          )}

          {/* Quick Split View */}
          {viewMode === 'quick-split' && (
            <QuickSplit onBack={() => setViewMode('home')} />
          )}

          {/* Manual View */}
          {viewMode === 'manual' && (
            <>
              <div className="mb-6 flex items-center justify-between">
                <Button variant="ghost" onClick={() => setViewMode('home')} className="text-muted-foreground">
                  ← Πίσω
                </Button>
                <ModeToggle mode={mode} onChange={setMode} />
              </div>

              {mode === 'form' ? (
                <BillForm 
                  key={formKey}
                  initialData={currentBillData || undefined} 
                  onCalculate={handleCalculate} 
                />
              ) : (
                <JsonEditor onCalculate={handleCalculate} />
              )}

              {result && currentBillData && (
                <div className="mt-8">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-display text-xl font-semibold">Αποτελέσματα</h3>
                    <button
                      onClick={handleReset}
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      Καθαρισμός
                    </button>
                  </div>
                  <ResultsDisplay 
                    result={result} 
                    billData={currentBillData}
                    onSaved={() => {}}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        <p>
          DEI Splitter{' '}
          <span className="text-primary font-medium">by MatExai</span>{' '}
          © {new Date().getFullYear()}
        </p>
      </footer>

      {/* History Panel */}
      <HistoryPanel
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onLoadBill={handleLoadFromHistory}
      />
    </div>
  );
};

export default Index;
