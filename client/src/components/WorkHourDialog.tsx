import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useBulkSaveSlots } from "@/hooks/use-work-hours";
import { useToast } from "@/hooks/use-toast";
import { type TimeSlot } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface SlotRow {
  startTime: string;
  endTime: string;
}

interface WorkHourDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | null;
  existingSlots: TimeSlot[];
  clientId: number;
}

export function WorkHourDialog({ isOpen, onOpenChange, date, existingSlots, clientId }: WorkHourDialogProps) {
  const { toast } = useToast();
  const bulkSave = useBulkSaveSlots(clientId);
  const [rows, setRows] = useState<SlotRow[]>([]);

  useEffect(() => {
    if (isOpen) {
      if (existingSlots.length > 0) {
        setRows(existingSlots.map(s => ({ startTime: s.startTime, endTime: s.endTime })));
      } else {
        setRows([{ startTime: "", endTime: "" }]);
      }
    }
  }, [isOpen, existingSlots]);

  const addRow = () => {
    setRows(prev => [...prev, { startTime: "", endTime: "" }]);
  };

  const removeRow = (index: number) => {
    setRows(prev => prev.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, field: keyof SlotRow, value: string) => {
    setRows(prev => prev.map((row, i) => i === index ? { ...row, [field]: value } : row));
  };

  const handleSave = () => {
    if (!date) return;

    const validSlots = rows.filter(r => r.startTime.trim() && r.endTime.trim());

    bulkSave.mutate(
      { date: format(date, "yyyy-MM-dd"), slots: validSlots },
      {
        onSuccess: () => {
          toast({ title: "Saved", description: `Updated schedule for ${format(date, "MMM d, yyyy")}.` });
          onOpenChange(false);
        },
        onError: (err) => {
          toast({ title: "Error", description: err.message, variant: "destructive" });
        },
      }
    );
  };

  if (!date) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle data-testid="dialog-title" className="text-xl font-bold">
            {format(date, "EEEE, MMMM d, yyyy")}
          </DialogTitle>
          <DialogDescription>
            Add or edit time slots for this day. Use format like 8h30, 11h00, 16h30.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          {rows.map((row, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                data-testid={`input-start-time-${i}`}
                type="text"
                value={row.startTime}
                onChange={(e) => updateRow(i, "startTime", e.target.value)}
                placeholder="8h30"
                className="flex-1 px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <span className="text-muted-foreground font-medium">-</span>
              <input
                data-testid={`input-end-time-${i}`}
                type="text"
                value={row.endTime}
                onChange={(e) => updateRow(i, "endTime", e.target.value)}
                placeholder="16h30"
                className="flex-1 px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <Button
                data-testid={`button-remove-slot-${i}`}
                size="icon"
                variant="ghost"
                onClick={() => removeRow(i)}
                disabled={rows.length <= 1}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>

        <Button
          data-testid="button-add-slot"
          variant="outline"
          size="sm"
          onClick={addRow}
          className="mt-1 w-full"
        >
          <Plus className="w-4 h-4 mr-1" /> Add Slot
        </Button>

        <div className="flex justify-end gap-2 mt-4">
          <Button
            data-testid="button-cancel"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            data-testid="button-save"
            onClick={handleSave}
            disabled={bulkSave.isPending}
          >
            {bulkSave.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
