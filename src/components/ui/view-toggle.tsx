import { LayoutGrid, LayoutList } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ViewToggleProps {
  view: 'grid' | 'table';
  onViewChange: (view: 'grid' | 'table') => void;
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-1" role="group" aria-label="View options">
      <Button
        variant={view === 'table' ? 'default' : 'ghost'}
        size="icon"
        onClick={() => onViewChange('table')}
        aria-label="Table view"
        aria-pressed={view === 'table'}
      >
        <LayoutList className="h-4 w-4" aria-hidden="true" />
      </Button>
      <Button
        variant={view === 'grid' ? 'default' : 'ghost'}
        size="icon"
        onClick={() => onViewChange('grid')}
        aria-label="Grid view"
        aria-pressed={view === 'grid'}
      >
        <LayoutGrid className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  );
}
