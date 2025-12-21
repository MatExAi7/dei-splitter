import { Zap, History } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onHistoryClick: () => void;
}

export function Header({ onHistoryClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-card/80 backdrop-blur-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-lg">
              <Zap className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
                DEI Splitter
              </h1>
              <span className="text-xs font-medium text-muted-foreground">
                by <span className="text-primary">MatExai</span>
              </span>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onHistoryClick}
            className="gap-2"
          >
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">Ιστορικό</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
