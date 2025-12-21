import { Download, Image, Copy, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CalculationResult, BillData } from '@/lib/types';
import { toast } from 'sonner';
import { saveBill } from '@/lib/storage';

interface ResultsDisplayProps {
  result: CalculationResult;
  billData: BillData;
  onSaved?: () => void;
}

export function ResultsDisplay({ result, billData, onSaved }: ResultsDisplayProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('el-GR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('el-GR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleSave = () => {
    saveBill(billData, result);
    toast.success('Αποθηκεύτηκε στο ιστορικό');
    onSaved?.();
  };

  const handleCopyJson = async () => {
    const exportData = {
      billData,
      result: {
        totals: result.totals,
        breakdown: result.breakdown,
      },
    };
    await navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
    toast.success('Αντιγράφηκε ως JSON');
  };

  const handleExportPdf = () => {
    toast.info('Η εξαγωγή PDF θα είναι διαθέσιμη σύντομα');
  };

  const handleExportImage = () => {
    toast.info('Η εξαγωγή εικόνας θα είναι διαθέσιμη σύντομα');
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="payment-card payment-card-matina" id="card-matina">
          <div className="mb-2 flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full bg-white/30"></span>
            <span className="text-sm font-medium opacity-90">Ματίνα πληρώνει</span>
          </div>
          <div className="number-display text-4xl">
            {formatCurrency(result.totals.matina)}
          </div>
          <div className="mt-3 text-sm opacity-75">
            {result.kwh.matina} kWh ({((result.kwh.matina / (result.kwh.matina + result.kwh.katerina)) * 100).toFixed(1)}%)
          </div>
        </div>

        <div className="payment-card payment-card-katerina" id="card-katerina">
          <div className="mb-2 flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full bg-white/30"></span>
            <span className="text-sm font-medium opacity-90">Κατερίνα πληρώνει</span>
          </div>
          <div className="number-display text-4xl">
            {formatCurrency(result.totals.katerina)}
          </div>
          <div className="mt-3 text-sm opacity-75">
            {result.kwh.katerina} kWh ({((result.kwh.katerina / (result.kwh.matina + result.kwh.katerina)) * 100).toFixed(1)}%)
          </div>
        </div>
      </div>

      {/* Period Info */}
      <div className="rounded-lg bg-muted/50 p-4 text-center">
        <p className="text-sm text-muted-foreground">
          Περίοδος: {formatDate(result.period.from)} - {formatDate(result.period.to)}
          {result.period.billNumber && (
            <span className="ml-2">| Αρ. {result.period.billNumber}</span>
          )}
        </p>
        <p className="mt-1 font-display text-lg font-semibold">
          Σύνολο: {formatCurrency(result.totals.total)}
        </p>
      </div>

      {/* Detailed Breakdown Table */}
      <div className="card-elevated overflow-hidden">
        <div className="table-header px-4 py-3">
          <h3 className="font-display font-semibold">Αναλυτικός Επιμερισμός</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-sm">
                <th className="px-4 py-3 font-semibold">Κατηγορία</th>
                <th className="px-4 py-3 text-right font-semibold">Σύνολο</th>
                <th className="px-4 py-3 text-right font-semibold">Ματίνα</th>
                <th className="px-4 py-3 text-right font-semibold">Κατερίνα</th>
                <th className="px-4 py-3 text-center font-semibold">Βάση</th>
              </tr>
            </thead>
            <tbody>
              {result.breakdown.map((item, index) => (
                <tr 
                  key={item.categoryKey} 
                  className={`border-b border-border/50 ${index % 2 === 0 ? 'bg-card' : 'bg-muted/20'}`}
                >
                  <td className="px-4 py-3 font-medium">{item.category}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatCurrency(item.total)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-primary font-medium">
                    {formatCurrency(item.matina)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-accent font-medium">
                    {formatCurrency(item.katerina)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      item.splitBasis === 'kWh' 
                        ? 'bg-dei-yellow/20 text-dei-yellow' 
                        : item.splitBasis === 'τ.μ.'
                        ? 'bg-primary/20 text-primary'
                        : item.splitBasis === '50-50'
                        ? 'bg-dei-green/20 text-dei-green'
                        : 'bg-accent/20 text-accent'
                    }`}>
                      {item.splitBasis}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-primary/5 font-semibold">
                <td className="px-4 py-3">ΣΥΝΟΛΟ</td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatCurrency(result.totals.total)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-primary">
                  {formatCurrency(result.totals.matina)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-accent">
                  {formatCurrency(result.totals.katerina)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Export Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={handleSave} className="gap-2 flex-1 sm:flex-none">
          <Save className="h-4 w-4" />
          Αποθήκευση
        </Button>
        <Button variant="outline" onClick={handleExportPdf} className="gap-2 flex-1 sm:flex-none">
          <Download className="h-4 w-4" />
          Εξαγωγή PDF
        </Button>
        <Button variant="outline" onClick={handleExportImage} className="gap-2 flex-1 sm:flex-none">
          <Image className="h-4 w-4" />
          Εικόνα κινητού
        </Button>
        <Button variant="outline" onClick={handleCopyJson} className="gap-2 flex-1 sm:flex-none">
          <Copy className="h-4 w-4" />
          Αντιγραφή JSON
        </Button>
      </div>
    </div>
  );
}
