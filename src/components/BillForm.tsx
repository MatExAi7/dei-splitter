import { useState } from 'react';
import { CalendarDays, Zap, Home, Settings2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { BillData, DEFAULT_SQM, DEFAULT_VAT_INCLUDES, CATEGORY_LABELS } from '@/lib/types';

interface BillFormProps {
  initialData?: BillData;
  onCalculate: (data: BillData) => void;
}

export function BillForm({ initialData, onCalculate }: BillFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [vatMode, setVatMode] = useState<'amount' | 'rate'>(initialData?.charges.vat.mode || 'amount');
  const [creditEnabled, setCreditEnabled] = useState(initialData?.charges.credit.enabled || false);
  const [creditSplit, setCreditSplit] = useState<'kwh' | 'half'>(initialData?.charges.credit.split || 'kwh');
  const [vatIncludes, setVatIncludes] = useState(initialData?.vat_includes || DEFAULT_VAT_INCLUDES);
  
  const [formData, setFormData] = useState({
    periodFrom: initialData?.period.from || '',
    periodTo: initialData?.period.to || '',
    billNumber: initialData?.period.billNumber || '',
    kwhMatina: initialData?.kwh.matina?.toString() || '',
    kwhKaterina: initialData?.kwh.katerina?.toString() || '',
    energySupply: initialData?.charges.energy_supply?.toString() || '',
    fixedFee: initialData?.charges.fixed_fee?.toString() || '',
    regulated: initialData?.charges.regulated?.toString() || '',
    misc: initialData?.charges.misc?.toString() || '',
    municipalFeesDt: initialData?.charges.municipal_fees_dt?.toString() || '',
    municipalTaxDf: initialData?.charges.municipal_tax_df?.toString() || '',
    tap: initialData?.charges.tap?.toString() || '',
    ert: initialData?.charges.ert?.toString() || '',
    vatValue: initialData?.charges.vat.value?.toString() || '',
    creditAmount: initialData?.charges.credit.amount?.toString() || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const billData: BillData = {
      period: {
        from: formData.periodFrom,
        to: formData.periodTo,
        billNumber: formData.billNumber || undefined,
      },
      kwh: {
        matina: parseFloat(formData.kwhMatina) || 0,
        katerina: parseFloat(formData.kwhKaterina) || 0,
      },
      sqm: DEFAULT_SQM,
      charges: {
        energy_supply: parseFloat(formData.energySupply) || 0,
        fixed_fee: parseFloat(formData.fixedFee) || 0,
        regulated: parseFloat(formData.regulated) || 0,
        misc: parseFloat(formData.misc) || 0,
        municipal_fees_dt: parseFloat(formData.municipalFeesDt) || 0,
        municipal_tax_df: parseFloat(formData.municipalTaxDf) || 0,
        tap: parseFloat(formData.tap) || 0,
        ert: parseFloat(formData.ert) || 0,
        vat: {
          mode: vatMode,
          value: parseFloat(formData.vatValue) || 0,
        },
        credit: {
          enabled: creditEnabled,
          amount: parseFloat(formData.creditAmount) || 0,
          split: creditSplit,
        },
      },
      vat_includes: vatIncludes,
    };
    
    onCalculate(billData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleVatInclude = (key: keyof typeof vatIncludes) => {
    setVatIncludes(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Period Section */}
      <div className="card-elevated p-6">
        <div className="mb-4 flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          <h3 className="font-display text-lg font-semibold">Περίοδος Λογαριασμού</h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="periodFrom">Από</Label>
            <Input
              id="periodFrom"
              type="date"
              value={formData.periodFrom}
              onChange={(e) => handleInputChange('periodFrom', e.target.value)}
              required
              className="input-styled"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="periodTo">Έως</Label>
            <Input
              id="periodTo"
              type="date"
              value={formData.periodTo}
              onChange={(e) => handleInputChange('periodTo', e.target.value)}
              required
              className="input-styled"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="billNumber">Αρ. Λογαριασμού (προαιρ.)</Label>
            <Input
              id="billNumber"
              type="text"
              value={formData.billNumber}
              onChange={(e) => handleInputChange('billNumber', e.target.value)}
              placeholder="π.χ. DEI-2025-06"
              className="input-styled"
            />
          </div>
        </div>
      </div>

      {/* kWh Section */}
      <div className="card-elevated p-6">
        <div className="mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-dei-yellow" />
          <h3 className="font-display text-lg font-semibold">Κατανάλωση (kWh)</h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="kwhMatina" className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full bg-primary"></span>
              Ματίνα
            </Label>
            <Input
              id="kwhMatina"
              type="number"
              step="0.01"
              min="0"
              value={formData.kwhMatina}
              onChange={(e) => handleInputChange('kwhMatina', e.target.value)}
              required
              placeholder="0"
              className="input-styled text-lg font-semibold"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kwhKaterina" className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full bg-accent"></span>
              Κατερίνα
            </Label>
            <Input
              id="kwhKaterina"
              type="number"
              step="0.01"
              min="0"
              value={formData.kwhKaterina}
              onChange={(e) => handleInputChange('kwhKaterina', e.target.value)}
              required
              placeholder="0"
              className="input-styled text-lg font-semibold"
            />
          </div>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          <Home className="mr-1 inline h-4 w-4" />
          Τετραγωνικά: Ματίνα {DEFAULT_SQM.matina} τ.μ. | Κατερίνα {DEFAULT_SQM.katerina} τ.μ.
        </p>
      </div>

      {/* Charges Section */}
      <div className="card-elevated p-6">
        <div className="mb-4 flex items-center gap-2">
          <span className="text-xl">💰</span>
          <h3 className="font-display text-lg font-semibold">Χρεώσεις</h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="energySupply">Προμήθεια/Ενέργεια (€)</Label>
            <Input
              id="energySupply"
              type="number"
              step="0.01"
              min="0"
              value={formData.energySupply}
              onChange={(e) => handleInputChange('energySupply', e.target.value)}
              placeholder="0.00"
              className="input-styled"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fixedFee">Πάγιο (€)</Label>
            <Input
              id="fixedFee"
              type="number"
              step="0.01"
              min="0"
              value={formData.fixedFee}
              onChange={(e) => handleInputChange('fixedFee', e.target.value)}
              placeholder="0.00"
              className="input-styled"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="regulated">Ρυθμιζόμενες (€)</Label>
            <Input
              id="regulated"
              type="number"
              step="0.01"
              min="0"
              value={formData.regulated}
              onChange={(e) => handleInputChange('regulated', e.target.value)}
              placeholder="0.00"
              className="input-styled"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="misc">Διάφορα/Λοιπές (€)</Label>
            <Input
              id="misc"
              type="number"
              step="0.01"
              min="0"
              value={formData.misc}
              onChange={(e) => handleInputChange('misc', e.target.value)}
              placeholder="0.00"
              className="input-styled"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="municipalFeesDt">Δημοτικά Τέλη ΔΤ (€)</Label>
            <Input
              id="municipalFeesDt"
              type="number"
              step="0.01"
              min="0"
              value={formData.municipalFeesDt}
              onChange={(e) => handleInputChange('municipalFeesDt', e.target.value)}
              placeholder="0.00"
              className="input-styled"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="municipalTaxDf">Δημ. Φόρος ΔΦ (€)</Label>
            <Input
              id="municipalTaxDf"
              type="number"
              step="0.01"
              min="0"
              value={formData.municipalTaxDf}
              onChange={(e) => handleInputChange('municipalTaxDf', e.target.value)}
              placeholder="0.00"
              className="input-styled"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tap">ΤΑΠ (€)</Label>
            <Input
              id="tap"
              type="number"
              step="0.01"
              min="0"
              value={formData.tap}
              onChange={(e) => handleInputChange('tap', e.target.value)}
              placeholder="0.00"
              className="input-styled"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ert">ΕΡΤ (€)</Label>
            <Input
              id="ert"
              type="number"
              step="0.01"
              min="0"
              value={formData.ert}
              onChange={(e) => handleInputChange('ert', e.target.value)}
              placeholder="0.00"
              className="input-styled"
            />
          </div>
        </div>

        {/* VAT */}
        <div className="mt-6 border-t border-border pt-6">
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <Label className="font-semibold">ΦΠΑ:</Label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setVatMode('amount')}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                  vatMode === 'amount'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                Ποσό (€)
              </button>
              <button
                type="button"
                onClick={() => setVatMode('rate')}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                  vatMode === 'rate'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                Ποσοστό (%)
              </button>
            </div>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={formData.vatValue}
              onChange={(e) => handleInputChange('vatValue', e.target.value)}
              placeholder={vatMode === 'amount' ? '0.00' : '6'}
              className="input-styled w-32"
            />
          </div>
        </div>

        {/* Credit */}
        <div className="mt-4 border-t border-border pt-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="creditEnabled"
                checked={creditEnabled}
                onCheckedChange={setCreditEnabled}
              />
              <Label htmlFor="creditEnabled">Έκπτωση/Πίστωση</Label>
            </div>
            {creditEnabled && (
              <>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.creditAmount}
                  onChange={(e) => handleInputChange('creditAmount', e.target.value)}
                  placeholder="0.00"
                  className="input-styled w-32"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCreditSplit('kwh')}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                      creditSplit === 'kwh'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Αναλογικά kWh
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreditSplit('half')}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                      creditSplit === 'half'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    50-50
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Advanced Options */}
      <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
        <CollapsibleTrigger asChild>
          <Button type="button" variant="ghost" className="w-full gap-2">
            <Settings2 className="h-4 w-4" />
            Σύνθετες Ρυθμίσεις ΦΠΑ
            {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4">
          <div className="card-elevated p-6">
            <p className="mb-4 text-sm text-muted-foreground">
              Επιλέξτε ποιες κατηγορίες συμμετέχουν στον υπολογισμό ΦΠΑ (όταν χρησιμοποιείτε ποσοστό):
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Object.entries(vatIncludes).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <Switch
                    id={`vat-${key}`}
                    checked={value}
                    onCheckedChange={() => toggleVatInclude(key as keyof typeof vatIncludes)}
                  />
                  <Label htmlFor={`vat-${key}`} className="text-sm">
                    {CATEGORY_LABELS[key]}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Button type="submit" size="lg" className="w-full btn-primary font-display text-lg">
        Υπολογισμός Επιμερισμού
      </Button>
    </form>
  );
}
