import { useState, useEffect } from 'react';
import { X, Trash2, Copy, Edit, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StoredBill, BillData } from '@/lib/types';
import { getStoredBills, deleteBill } from '@/lib/storage';
import { toast } from 'sonner';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadBill: (data: BillData) => void;
}

export function HistoryPanel({ isOpen, onClose, onLoadBill }: HistoryPanelProps) {
  const [bills, setBills] = useState<StoredBill[]>([]);

  useEffect(() => {
    if (isOpen) {
      setBills(getStoredBills());
    }
  }, [isOpen]);

  const handleDelete = (id: string) => {
    deleteBill(id);
    setBills(getStoredBills());
    toast.success('Διαγράφηκε');
  };

  const handleLoad = (bill: StoredBill) => {
    onLoadBill(bill.data);
    onClose();
    toast.success('Φορτώθηκε');
  };

  const handleCopy = async (bill: StoredBill) => {
    await navigator.clipboard.writeText(JSON.stringify(bill.data, null, 2));
    toast.success('Αντιγράφηκε JSON');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('el-GR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm">
      <div className="mx-4 max-h-[80vh] w-full max-w-lg overflow-hidden rounded-2xl bg-card shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between border-b border-border bg-primary px-6 py-4">
          <h2 className="font-display text-lg font-semibold text-primary-foreground">
            Ιστορικό Λογαριασμών
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4">
          {bills.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Calendar className="mx-auto mb-3 h-12 w-12 opacity-50" />
              <p>Δεν υπάρχουν αποθηκευμένοι λογαριασμοί</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bills.map((bill) => (
                <div
                  key={bill.id}
                  className="rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-display font-semibold">{bill.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(bill.date).toLocaleDateString('el-GR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">
                        {formatCurrency(bill.result.totals.total)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2 text-xs">
                    <span className="rounded-full bg-primary/10 px-2 py-1 text-primary">
                      Μ: {formatCurrency(bill.result.totals.matina)}
                    </span>
                    <span className="rounded-full bg-accent/10 px-2 py-1 text-accent">
                      Κ: {formatCurrency(bill.result.totals.katerina)}
                    </span>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleLoad(bill)}
                      className="flex-1 gap-1"
                    >
                      <Edit className="h-3 w-3" />
                      Φόρτωση
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopy(bill)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(bill.id)}
                      className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
