import { BillData, CalculationResult, SplitResult, CATEGORY_LABELS } from './types';

export function calculateSplit(data: BillData): CalculationResult {
  const { kwh, sqm, charges, vat_includes } = data;
  
  const totalKwh = kwh.matina + kwh.katerina;
  const totalSqm = sqm.matina + sqm.katerina;
  
  if (totalKwh === 0) {
    throw new Error('Οι kWh δεν μπορούν να είναι μηδέν');
  }
  
  const kwhRatioMatina = kwh.matina / totalKwh;
  const kwhRatioKaterina = kwh.katerina / totalKwh;
  
  const sqmRatioMatina = sqm.matina / totalSqm;
  const sqmRatioKaterina = sqm.katerina / totalSqm;
  
  const breakdown: SplitResult[] = [];
  
  // Helper function to add a split result
  const addSplit = (
    categoryKey: string,
    total: number,
    splitBasis: SplitResult['splitBasis'],
    matinaRatio: number,
    katerinaRatio: number
  ) => {
    if (total === 0 && categoryKey !== 'credit') return;
    
    breakdown.push({
      category: CATEGORY_LABELS[categoryKey] || categoryKey,
      categoryKey,
      total: Math.round(total * 100) / 100,
      matina: Math.round(total * matinaRatio * 100) / 100,
      katerina: Math.round(total * katerinaRatio * 100) / 100,
      splitBasis
    });
  };
  
  // A. kWh-proportional charges
  addSplit('energy_supply', charges.energy_supply, 'kWh', kwhRatioMatina, kwhRatioKaterina);
  addSplit('fixed_fee', charges.fixed_fee, 'kWh', kwhRatioMatina, kwhRatioKaterina);
  addSplit('regulated', charges.regulated, 'kWh', kwhRatioMatina, kwhRatioKaterina);
  addSplit('misc', charges.misc, 'kWh', kwhRatioMatina, kwhRatioKaterina);
  
  // B. sqm-proportional charges (ΔΤ, ΔΦ)
  addSplit('municipal_fees_dt', charges.municipal_fees_dt, 'τ.μ.', sqmRatioMatina, sqmRatioKaterina);
  addSplit('municipal_tax_df', charges.municipal_tax_df, 'τ.μ.', sqmRatioMatina, sqmRatioKaterina);
  
  // C. TAP - 100% Katerina
  if (charges.tap > 0) {
    breakdown.push({
      category: CATEGORY_LABELS['tap'],
      categoryKey: 'tap',
      total: Math.round(charges.tap * 100) / 100,
      matina: 0,
      katerina: Math.round(charges.tap * 100) / 100,
      splitBasis: '100% Κατερίνα'
    });
  }
  
  // D. ERT - 50-50
  addSplit('ert', charges.ert, '50-50', 0.5, 0.5);
  
  // Calculate VAT
  let vatAmount = 0;
  if (charges.vat.mode === 'amount') {
    vatAmount = charges.vat.value;
  } else {
    // Calculate taxable base
    let taxableBase = 0;
    if (vat_includes.energy_supply) taxableBase += charges.energy_supply;
    if (vat_includes.fixed_fee) taxableBase += charges.fixed_fee;
    if (vat_includes.regulated) taxableBase += charges.regulated;
    if (vat_includes.misc) taxableBase += charges.misc;
    if (vat_includes.municipal_fees_dt) taxableBase += charges.municipal_fees_dt;
    if (vat_includes.municipal_tax_df) taxableBase += charges.municipal_tax_df;
    if (vat_includes.tap) taxableBase += charges.tap;
    if (vat_includes.ert) taxableBase += charges.ert;
    
    vatAmount = taxableBase * (charges.vat.value / 100);
  }
  
  // VAT split proportionally to kWh
  addSplit('vat', vatAmount, 'kWh', kwhRatioMatina, kwhRatioKaterina);
  
  // Credit/Discount
  if (charges.credit.enabled && charges.credit.amount !== 0) {
    const creditAmount = -Math.abs(charges.credit.amount); // Always negative
    if (charges.credit.split === 'half') {
      addSplit('credit', creditAmount, '50-50', 0.5, 0.5);
    } else {
      addSplit('credit', creditAmount, 'kWh', kwhRatioMatina, kwhRatioKaterina);
    }
  }
  
  // Calculate totals
  const totals = breakdown.reduce(
    (acc, item) => ({
      matina: acc.matina + item.matina,
      katerina: acc.katerina + item.katerina,
      total: acc.total + item.total
    }),
    { matina: 0, katerina: 0, total: 0 }
  );
  
  // Round totals
  totals.matina = Math.round(totals.matina * 100) / 100;
  totals.katerina = Math.round(totals.katerina * 100) / 100;
  totals.total = Math.round(totals.total * 100) / 100;
  
  return {
    breakdown,
    totals,
    period: data.period,
    kwh: data.kwh
  };
}

export function validateBillData(data: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Μη έγκυρο JSON'] };
  }
  
  const bill = data as Partial<BillData>;
  
  // Check period
  if (!bill.period?.from || !bill.period?.to) {
    errors.push('Η περίοδος (from/to) είναι υποχρεωτική');
  }
  
  // Check kWh
  if (bill.kwh?.matina === undefined || bill.kwh?.katerina === undefined) {
    errors.push('Οι kWh για Ματίνα και Κατερίνα είναι υποχρεωτικές');
  } else if (bill.kwh.matina + bill.kwh.katerina === 0) {
    errors.push('Οι συνολικές kWh δεν μπορούν να είναι μηδέν');
  }
  
  // Check charges
  if (!bill.charges) {
    errors.push('Οι χρεώσεις είναι υποχρεωτικές');
  } else {
    if (bill.charges.vat?.mode !== 'amount' && bill.charges.vat?.mode !== 'rate') {
      errors.push('Ο τρόπος ΦΠΑ πρέπει να είναι "amount" ή "rate"');
    }
  }
  
  return { valid: errors.length === 0, errors };
}

export const DEMO_BILL: BillData = {
  period: {
    from: '2025-06-01',
    to: '2025-06-30',
    billNumber: 'DEI-2025-06-001'
  },
  kwh: {
    matina: 85,
    katerina: 165
  },
  sqm: {
    matina: 53,
    katerina: 207
  },
  charges: {
    energy_supply: 45.20,
    fixed_fee: 8.50,
    regulated: 12.30,
    misc: 3.80,
    municipal_fees_dt: 15.60,
    municipal_tax_df: 8.40,
    tap: 12.50,
    ert: 3.00,
    vat: {
      mode: 'amount',
      value: 15.82
    },
    credit: {
      enabled: true,
      amount: 7.88,
      split: 'kwh'
    }
  },
  vat_includes: {
    energy_supply: true,
    fixed_fee: true,
    regulated: true,
    misc: true,
    municipal_fees_dt: false,
    municipal_tax_df: false,
    tap: false,
    ert: false
  }
};
