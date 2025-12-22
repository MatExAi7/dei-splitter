import { useState } from 'react';
import { Check, AlertCircle, Edit2, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ParsedBillData, ParsedField, UnmappedLine } from '@/lib/pdfParser';
import { CATEGORY_LABELS } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ParsedFieldsPreviewProps {
  data: ParsedBillData;
  onApply: (data: AppliedParsedData) => void;
  onCancel: () => void;
}

export interface AppliedParsedData {
  periodFrom: string;
  periodTo: string;
  totalKwh: number | null;
  energy_supply: number;
  fixed_fee: number;
  regulated: number;
  misc: number;
  municipal_fees_dt: number;
  municipal_tax_df: number;
  tap: number;
  ert: number;
  vat: number;
}

const CATEGORY_OPTIONS = [
  { key: 'energy_supply', label: 'Προμήθεια/Χρέωση ενέργειας' },
  { key: 'fixed_fee', label: 'Πάγιο' },
  { key: 'regulated', label: 'Ρυθμιζόμενες χρεώσεις' },
  { key: 'misc', label: 'Διάφορα/Λοιπές' },
  { key: 'municipal_fees_dt', label: 'Δημοτικά Τέλη (ΔΤ)' },
  { key: 'municipal_tax_df', label: 'Δημοτικός Φόρος (ΔΦ)' },
  { key: 'tap', label: 'ΤΑΠ' },
  { key: 'ert', label: 'ΕΡΤ' },
  { key: 'vat', label: 'ΦΠΑ' },
  { key: 'ignore', label: '— Αγνόηση —' },
];

export function ParsedFieldsPreview({ data, onApply, onCancel }: ParsedFieldsPreviewProps) {
  const [showUnmapped, setShowUnmapped] = useState(false);
  const [editableFields, setEditableFields] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    data.fields.forEach(f => {
      if (f.value !== null) {
        initial[f.key] = f.value;
      }
    });
    return initial;
  });
  
  const [unmappedAssignments, setUnmappedAssignments] = useState<Record<number, string>>({});
  const [periodFrom, setPeriodFrom] = useState(data.periodFrom || '');
  const [periodTo, setPeriodTo] = useState(data.periodTo || '');

  const handleFieldChange = (key: string, value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      setEditableFields(prev => ({ ...prev, [key]: num }));
    } else if (value === '') {
      setEditableFields(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleUnmappedAssign = (index: number, category: string) => {
    setUnmappedAssignments(prev => ({ ...prev, [index]: category }));
    
    if (category !== 'ignore' && category) {
      const line = data.unmappedLines[index];
      if (line.potentialAmount !== null) {
        setEditableFields(prev => ({
          ...prev,
          [category]: (prev[category] || 0) + line.potentialAmount!
        }));
      }
    }
  };

  const handleApply = () => {
    const appliedData: AppliedParsedData = {
      periodFrom,
      periodTo,
      totalKwh: data.totalKwh,
      energy_supply: editableFields['energy_supply'] || 0,
      fixed_fee: editableFields['fixed_fee'] || 0,
      regulated: editableFields['regulated'] || 0,
      misc: editableFields['misc'] || 0,
      municipal_fees_dt: editableFields['municipal_fees_dt'] || 0,
      municipal_tax_df: editableFields['municipal_tax_df'] || 0,
      tap: editableFields['tap'] || 0,
      ert: editableFields['ert'] || 0,
      vat: editableFields['vat'] || 0,
    };
    
    onApply(appliedData);
  };

  const getConfidenceBadge = (confidence: 'high' | 'medium' | 'low') => {
    const styles = {
      high: 'bg-dei-green/20 text-dei-green',
      medium: 'bg-dei-yellow/20 text-dei-yellow',
      low: 'bg-destructive/20 text-destructive'
    };
    const labels = { high: 'Υψηλή', medium: 'Μέτρια', low: 'Χαμηλή' };
    
    return (
      <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', styles[confidence])}>
        {labels[confidence]}
      </span>
    );
  };

  const formatCurrency = (value: number | null) => {
    if (value === null) return '—';
    return new Intl.NumberFormat('el-GR', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">Αποτελέσματα Ανάλυσης PDF</h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Check className="h-4 w-4 text-dei-green" />
          {data.fields.length} πεδία αναγνωρίστηκαν
        </div>
      </div>

      {/* Period */}
      {(periodFrom || periodTo) && (
        <div className="rounded-lg bg-muted/50 p-4">
          <p className="mb-2 text-sm font-medium text-muted-foreground">Περίοδος</p>
          <div className="flex items-center gap-4">
            <Input
              type="text"
              value={periodFrom}
              onChange={(e) => setPeriodFrom(e.target.value)}
              placeholder="Από"
              className="max-w-[150px]"
            />
            <span className="text-muted-foreground">—</span>
            <Input
              type="text"
              value={periodTo}
              onChange={(e) => setPeriodTo(e.target.value)}
              placeholder="Έως"
              className="max-w-[150px]"
            />
          </div>
        </div>
      )}

      {/* kWh */}
      {data.totalKwh !== null && (
        <div className="flex items-center gap-3 rounded-lg bg-dei-yellow/10 p-4">
          <span className="text-2xl">⚡</span>
          <div>
            <p className="text-sm text-muted-foreground">Συνολική Κατανάλωση</p>
            <p className="text-xl font-bold">{data.totalKwh} kWh</p>
          </div>
          <div className="ml-auto">
            <p className="text-xs text-muted-foreground">
              Θα πρέπει να κατανείμετε τις kWh μεταξύ Ματίνας/Κατερίνας
            </p>
          </div>
        </div>
      )}

      {/* Mapped Fields */}
      <div className="card-elevated overflow-hidden">
        <div className="table-header px-4 py-3">
          <h4 className="font-semibold text-primary-foreground">Αναγνωρισμένα Πεδία</h4>
        </div>
        <div className="divide-y divide-border">
          {data.fields.map((field) => (
            <div key={field.key} className="flex items-center gap-4 p-4">
              <div className="flex-1">
                <p className="font-medium">{field.label}</p>
                <p className="text-xs text-muted-foreground line-clamp-1">{field.rawMatch}</p>
              </div>
              <div className="flex items-center gap-3">
                {getConfidenceBadge(field.confidence)}
                <div className="relative">
                  <Input
                    type="number"
                    step="0.01"
                    value={editableFields[field.key] ?? ''}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    className="w-28 pr-6 text-right font-semibold"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                </div>
              </div>
            </div>
          ))}
          
          {/* Show missing categories with empty inputs */}
          {CATEGORY_OPTIONS.filter(c => c.key !== 'ignore' && !data.fields.find(f => f.key === c.key)).map((cat) => (
            <div key={cat.key} className="flex items-center gap-4 p-4 bg-muted/30">
              <div className="flex-1">
                <p className="font-medium text-muted-foreground">{cat.label}</p>
                <p className="text-xs text-muted-foreground">Δεν βρέθηκε - συμπληρώστε χειροκίνητα</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  Χειροκίνητα
                </span>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.01"
                    value={editableFields[cat.key] ?? ''}
                    onChange={(e) => handleFieldChange(cat.key, e.target.value)}
                    className="w-28 pr-6 text-right"
                    placeholder="0.00"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Unmapped Lines */}
      {data.unmappedLines.length > 0 && (
        <div className="card-elevated overflow-hidden">
          <button
            onClick={() => setShowUnmapped(!showUnmapped)}
            className="flex w-full items-center justify-between px-4 py-3 hover:bg-muted/50"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-dei-yellow" />
              <span className="font-semibold">
                Μη αντιστοιχισμένες γραμμές ({data.unmappedLines.length})
              </span>
            </div>
            {showUnmapped ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
          
          {showUnmapped && (
            <div className="divide-y divide-border border-t">
              {data.unmappedLines.map((line, index) => (
                <div key={index} className="flex items-center gap-4 p-4">
                  <div className="flex-1">
                    <p className="text-sm line-clamp-2">{line.text}</p>
                    {line.potentialAmount !== null && (
                      <p className="mt-1 text-sm font-medium text-primary">
                        Πιθανό ποσό: {formatCurrency(line.potentialAmount)}
                      </p>
                    )}
                  </div>
                  <Select
                    value={unmappedAssignments[index] || ''}
                    onValueChange={(value) => handleUnmappedAssign(index, value)}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Αντιστοίχιση σε..." />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.key} value={opt.key}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Ακύρωση
        </Button>
        <Button onClick={handleApply} className="flex-1 btn-primary gap-2">
          <Check className="h-4 w-4" />
          Εφαρμογή στη Φόρμα
        </Button>
      </div>

      {/* Note */}
      <p className="text-center text-xs text-muted-foreground">
        <HelpCircle className="mr-1 inline h-3 w-3" />
        Ελέγξτε τα ποσά πριν την εφαρμογή. Οι kWh πρέπει να κατανεμηθούν χειροκίνητα.
      </p>
    </div>
  );
}
