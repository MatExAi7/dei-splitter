import { FileText, Code } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModeToggleProps {
  mode: 'form' | 'json';
  onChange: (mode: 'form' | 'json') => void;
}

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="inline-flex rounded-lg bg-muted p-1">
      <button
        onClick={() => onChange('form')}
        className={cn(
          'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all duration-200',
          mode === 'form'
            ? 'bg-card text-foreground shadow-md'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <FileText className="h-4 w-4" />
        Φόρμα
      </button>
      <button
        onClick={() => onChange('json')}
        className={cn(
          'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all duration-200',
          mode === 'json'
            ? 'bg-card text-foreground shadow-md'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <Code className="h-4 w-4" />
        JSON Mode
      </button>
    </div>
  );
}
