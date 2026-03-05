import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Loader2, Calendar as CalendarIcon, Clock, AlignLeft } from "lucide-react";
import { insertWorkHoursSchema } from "@shared/schema";
import { useUpsertWorkHours } from "@/hooks/use-work-hours";
import { useToast } from "@/hooks/use-toast";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// We extend the base schema to ensure client-side coercion of form inputs
const formSchema = insertWorkHoursSchema.extend({
  hours: z.coerce.number().min(0, "Hours cannot be negative").max(24, "Cannot exceed 24 hours"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface WorkHourDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | null;
  initialData?: { hours: number; notes: string | null };
}

export function WorkHourDialog({ isOpen, onOpenChange, date, initialData }: WorkHourDialogProps) {
  const { toast } = useToast();
  const upsertMutation = useUpsertWorkHours();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: "",
      hours: 0,
      notes: "",
    },
  });

  // Reset form when dialog opens with new data
  useEffect(() => {
    if (isOpen && date) {
      form.reset({
        date: format(date, "yyyy-MM-dd"),
        hours: initialData?.hours || 0,
        notes: initialData?.notes || "",
      });
    }
  }, [isOpen, date, initialData, form]);

  const onSubmit = (values: FormValues) => {
    upsertMutation.mutate(values, {
      onSuccess: () => {
        toast({
          title: "Saved successfully",
          description: `Logged ${values.hours} hours for ${format(date!, "MMM d, yyyy")}.`,
        });
        onOpenChange(false);
      },
      onError: (error) => {
        toast({
          title: "Error saving",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  if (!date) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] glass-card border-white/40 p-0 overflow-hidden rounded-3xl">
        <div className="bg-primary/5 px-6 py-6 border-b border-primary/10">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-display font-semibold">
                  {format(date, "MMMM d, yyyy")}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground mt-1 text-sm font-medium">
                  {format(date, "EEEE")}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="space-y-4">
            {/* Hours Input */}
            <div className="space-y-2">
              <label htmlFor="hours" className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                Working Hours
              </label>
              <div className="relative">
                <input
                  id="hours"
                  type="number"
                  step="0.5"
                  className={`
                    w-full px-4 py-3 rounded-xl text-lg font-medium transition-all duration-200
                    bg-muted/30 border-2 border-border
                    focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10
                    hover:border-primary/50
                    ${form.formState.errors.hours ? "border-destructive focus:border-destructive focus:ring-destructive/10" : ""}
                  `}
                  placeholder="0.0"
                  {...form.register("hours")}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium pointer-events-none">
                  hrs
                </span>
              </div>
              {form.formState.errors.hours && (
                <p className="text-sm text-destructive font-medium">
                  {form.formState.errors.hours.message}
                </p>
              )}
            </div>

            {/* Notes Input */}
            <div className="space-y-2">
              <label htmlFor="notes" className="text-sm font-semibold text-foreground flex items-center gap-2">
                <AlignLeft className="w-4 h-4 text-muted-foreground" />
                Notes <span className="text-muted-foreground font-normal">(Optional)</span>
              </label>
              <textarea
                id="notes"
                rows={3}
                className="
                  w-full px-4 py-3 rounded-xl text-base transition-all duration-200 resize-none
                  bg-muted/30 border-2 border-border
                  focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10
                  hover:border-primary/50 placeholder:text-muted-foreground/60
                "
                placeholder="What did you work on?"
                {...form.register("notes")}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-5 py-2.5 rounded-xl font-semibold text-muted-foreground hover:bg-muted/80 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={upsertMutation.isPending}
              className="
                px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2
                bg-primary text-primary-foreground shadow-lg shadow-primary/25
                hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5
                active:translate-y-0 active:shadow-md
                disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                transition-all duration-200
              "
            >
              {upsertMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Entry"
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
