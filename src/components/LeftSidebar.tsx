import { ChecklistPanel } from './ChecklistPanel';
import { DrawingToolbar } from '../drawing/DrawingToolbar';

export function LeftSidebar() {
  return (
    <aside className="w-72 shrink-0 overflow-y-auto border-r border-slate-800 bg-slate-950 p-3">
      <div className="space-y-6">
        <ChecklistPanel />
        <div className="border-t border-slate-800 pt-4">
          <DrawingToolbar />
        </div>
      </div>
    </aside>
  );
}
