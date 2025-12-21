export interface BillPeriod {
  from: string;
  to: string;
  billNumber?: string;
}

export interface KwhData {
  matina: number;
  katerina: number;
}

export interface SqmData {
  matina: number;
  katerina: number;
}

export interface VatConfig {
  mode: 'amount' | 'rate';
  value: number;
}

export interface CreditConfig {
  enabled: boolean;
  amount: number;
  split: 'kwh' | 'half';
}

export interface Charges {
  energy_supply: number;
  fixed_fee: number;
  regulated: number;
  misc: number;
  municipal_fees_dt: number;
  municipal_tax_df: number;
  tap: number;
  ert: number;
  vat: VatConfig;
  credit: CreditConfig;
}

export interface VatIncludes {
  energy_supply: boolean;
  fixed_fee: boolean;
  regulated: boolean;
  misc: boolean;
  municipal_fees_dt: boolean;
  municipal_tax_df: boolean;
  tap: boolean;
  ert: boolean;
}

export interface BillData {
  period: BillPeriod;
  kwh: KwhData;
  sqm: SqmData;
  charges: Charges;
  vat_includes: VatIncludes;
}

export interface SplitResult {
  category: string;
  categoryKey: string;
  total: number;
  matina: number;
  katerina: number;
  splitBasis: 'kWh' | 'τ.μ.' | '50-50' | '100% Κατερίνα';
}

export interface CalculationResult {
  breakdown: SplitResult[];
  totals: {
    matina: number;
    katerina: number;
    total: number;
  };
  period: BillPeriod;
  kwh: KwhData;
}

export interface StoredBill {
  id: string;
  title: string;
  date: string;
  data: BillData;
  result: CalculationResult;
}

export const DEFAULT_SQM: SqmData = {
  matina: 53,
  katerina: 207
};

export const DEFAULT_VAT_INCLUDES: VatIncludes = {
  energy_supply: true,
  fixed_fee: true,
  regulated: true,
  misc: true,
  municipal_fees_dt: false,
  municipal_tax_df: false,
  tap: false,
  ert: false
};

export const CATEGORY_LABELS: Record<string, string> = {
  energy_supply: 'Προμήθεια/Χρέωση ενέργειας',
  fixed_fee: 'Πάγιο',
  regulated: 'Ρυθμιζόμενες χρεώσεις',
  misc: 'Διάφορα/Λοιπές',
  municipal_fees_dt: 'Δημοτικά Τέλη (ΔΤ)',
  municipal_tax_df: 'Δημοτικός Φόρος (ΔΦ)',
  tap: 'ΤΑΠ',
  ert: 'ΕΡΤ',
  vat: 'ΦΠΑ',
  credit: 'Έκπτωση/Πίστωση'
};
