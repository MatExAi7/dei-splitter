import { StoredBill, BillData, CalculationResult } from './types';

const STORAGE_KEY = 'dei_splitter_bills';

export function getStoredBills(): StoredBill[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveBill(data: BillData, result: CalculationResult, title?: string): StoredBill {
  const bills = getStoredBills();
  
  const periodFrom = new Date(data.period.from);
  const monthNames = ['Ιαν', 'Φεβ', 'Μαρ', 'Απρ', 'Μάι', 'Ιούν', 'Ιούλ', 'Αύγ', 'Σεπ', 'Οκτ', 'Νοε', 'Δεκ'];
  const defaultTitle = title || `${monthNames[periodFrom.getMonth()]} ${periodFrom.getFullYear()}`;
  
  const newBill: StoredBill = {
    id: crypto.randomUUID(),
    title: defaultTitle,
    date: new Date().toISOString(),
    data,
    result
  };
  
  bills.unshift(newBill);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bills));
  
  return newBill;
}

export function deleteBill(id: string): void {
  const bills = getStoredBills().filter(b => b.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bills));
}

export function getBillById(id: string): StoredBill | undefined {
  return getStoredBills().find(b => b.id === id);
}
