import { useState } from 'react';
import { CheckCircle, AlertCircle, Copy, FileJson } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { BillData } from '@/lib/types';
import { validateBillData, DEMO_BILL } from '@/lib/calculations';
import { toast } from 'sonner';

interface JsonEditorProps {
  onCalculate: (data: BillData) => void;
}

const DEMO_JSON = JSON.stringify(DEMO_BILL, null, 2);

export function JsonEditor({ onCalculate }: JsonEditorProps) {
  const [jsonValue, setJsonValue] = useState(DEMO_JSON);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; errors: string[] } | null>(null);

  const handleValidate = () => {
    try {
      const parsed = JSON.parse(jsonValue);
      const result = validateBillData(parsed);
      setValidationResult(result);
      
      if (result.valid) {
        toast.success('JSON έγκυρο!');
      } else {
        toast.error('Σφάλματα στο JSON');
      }
    } catch (e) {
      setValidationResult({ valid: false, errors: ['Μη έγκυρη σύνταξη JSON'] });
      toast.error('Μη έγκυρη σύνταξη JSON');
    }
  };

  const handleCalculate = () => {
    try {
      const parsed = JSON.parse(jsonValue);
      const result = validateBillData(parsed);
      
      if (result.valid) {
        onCalculate(parsed as BillData);
      } else {
        setValidationResult(result);
        toast.error('Διορθώστε τα σφάλματα πρώτα');
      }
    } catch (e) {
      setValidationResult({ valid: false, errors: ['Μη έγκυρη σύνταξη JSON'] });
      toast.error('Μη έγκυρη σύνταξη JSON');
    }
  };

  const handleLoadDemo = () => {
    setJsonValue(DEMO_JSON);
    setValidationResult(null);
    toast.success('Φορτώθηκε το demo JSON');
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(jsonValue);
    toast.success('Αντιγράφηκε στο clipboard');
  };

  return (
    <div className="space-y-4">
      <div className="card-elevated p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <FileJson className="h-5 w-5 text-primary" />
            <h3 className="font-display text-lg font-semibold">JSON Editor</h3>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleLoadDemo}>
              Φόρτωση Demo
            </Button>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              <Copy className="mr-1 h-4 w-4" />
              Αντιγραφή
            </Button>
          </div>
        </div>

        <Textarea
          value={jsonValue}
          onChange={(e) => {
            setJsonValue(e.target.value);
            setValidationResult(null);
          }}
          className="min-h-[400px] font-mono text-sm"
          placeholder="Επικολλήστε το JSON εδώ..."
        />

        {validationResult && (
          <div className={`mt-4 rounded-lg p-4 ${
            validationResult.valid 
              ? 'bg-dei-green/10 border border-dei-green/30' 
              : 'bg-destructive/10 border border-destructive/30'
          }`}>
            <div className="flex items-start gap-2">
              {validationResult.valid ? (
                <CheckCircle className="h-5 w-5 text-dei-green shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
              )}
              <div>
                {validationResult.valid ? (
                  <p className="font-medium text-dei-green">JSON έγκυρο!</p>
                ) : (
                  <>
                    <p className="font-medium text-destructive">Σφάλματα:</p>
                    <ul className="mt-1 list-inside list-disc text-sm text-destructive">
                      {validationResult.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 flex gap-3">
          <Button variant="outline" onClick={handleValidate} className="flex-1">
            Validate
          </Button>
          <Button onClick={handleCalculate} className="flex-1 btn-primary">
            Υπολογισμός
          </Button>
        </div>
      </div>

      <div className="card-elevated p-6">
        <h4 className="mb-3 font-display font-semibold">JSON Schema Reference</h4>
        <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-xs">
{`{
  "period": {"from":"YYYY-MM-DD","to":"YYYY-MM-DD","billNumber":"..."},
  "kwh": {"matina": number, "katerina": number},
  "sqm": {"matina":53, "katerina":207},
  "charges": {
     "energy_supply": number,
     "fixed_fee": number,
     "regulated": number,
     "misc": number,
     "municipal_fees_dt": number,
     "municipal_tax_df": number,
     "tap": number,
     "ert": number,
     "vat": {"mode":"amount"|"rate", "value": number},
     "credit": {"enabled": boolean, "amount": number, "split":"kwh"|"half"}
  },
  "vat_includes": {...}
}`}
        </pre>
      </div>
    </div>
  );
}
