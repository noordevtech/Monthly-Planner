import { useState } from "react";
import { format } from "date-fns";
import { Copy, X, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { type TimeSlot } from "@shared/schema";

interface CopySlotsPickerProps {
  sourceDate: string;
  slots: { startTime: string; endTime: string }[];
  calendarDays: Date[];
  slotsByDate: Map<string, TimeSlot[]>;
  bulkSave: {
    mutateAsync: (data: { date: string; slots: { startTime: string; endTime: string }[] }) => Promise<any>;
    isPending: boolean;
  };
  onClose: () => void;
}

export function CopySlotsPicker({ sourceDate, slots, calendarDays, slotsByDate, bulkSave, onClose }: CopySlotsPickerProps) {
  const { toast } = useToast();
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  const toggleDate = (dateStr: string) => {
    setSelectedDates(prev => {
      const next = new Set(prev);
      if (next.has(dateStr)) {
        next.delete(dateStr);
      } else {
        next.add(dateStr);
      }
      return next;
    });
  };

  const handleApply = async () => {
    if (selectedDates.size === 0) return;
    setIsSaving(true);
    try {
      for (const dateStr of selectedDates) {
        await bulkSave.mutateAsync({ date: dateStr, slots });
      }
      toast({
        title: "Copied",
        description: `Time slots copied to ${selectedDates.size} day${selectedDates.size > 1 ? "s" : ""}.`,
      });
      onClose();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to copy slots",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const slotsLabel = slots.map(s => `${s.startTime}–${s.endTime}`).join(", ");

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/40">
      <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Copy className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Copy Time Slots</h3>
          </div>
          <Button data-testid="button-cancel-copy" size="icon" variant="ghost" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="px-4 py-3 border-b border-border bg-muted/30">
          <p className="text-xs text-muted-foreground">
            Copying from <span className="font-medium text-foreground">{sourceDate}</span>
          </p>
          <p className="text-xs text-primary font-medium mt-1">{slotsLabel}</p>
          <p className="text-xs text-muted-foreground mt-2">
            Click the days below to select where to paste these slots. Existing slots on selected days will be replaced.
          </p>
        </div>

        <div className="px-4 py-3">
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map(day => {
              const dateStr = format(day, "yyyy-MM-dd");
              const isSource = dateStr === sourceDate;
              const isSelected = selectedDates.has(dateStr);
              const hasSlots = (slotsByDate.get(dateStr) || []).length > 0;

              return (
                <button
                  key={dateStr}
                  data-testid={`copy-day-${dateStr}`}
                  disabled={isSource}
                  onClick={() => toggleDate(dateStr)}
                  className={`
                    relative w-full aspect-square flex items-center justify-center rounded text-xs font-medium transition-colors
                    ${isSource ? "bg-primary/20 text-primary cursor-not-allowed" : ""}
                    ${isSelected ? "bg-primary text-primary-foreground" : ""}
                    ${!isSource && !isSelected ? "hover:bg-muted text-foreground" : ""}
                    ${!isSource && !isSelected && hasSlots ? "ring-1 ring-primary/30" : ""}
                  `}
                >
                  {format(day, "d")}
                  {isSelected && <Check className="w-3 h-3 absolute top-0.5 right-0.5" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <span className="text-xs text-muted-foreground">
            {selectedDates.size} day{selectedDates.size !== 1 ? "s" : ""} selected
          </span>
          <div className="flex gap-2">
            <Button data-testid="button-cancel-copy-bottom" size="sm" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              data-testid="button-apply-copy"
              size="sm"
              onClick={handleApply}
              disabled={selectedDates.size === 0 || isSaving}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
              Paste to {selectedDates.size} day{selectedDates.size !== 1 ? "s" : ""}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
