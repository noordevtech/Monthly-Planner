import { format, isSameMonth, isToday } from "date-fns";
import { FileText } from "lucide-react";
import { type WorkHours } from "@shared/schema";
import { motion } from "framer-motion";

interface CalendarDayProps {
  day: Date;
  currentMonth: Date;
  data?: WorkHours;
  onClick: (day: Date) => void;
}

export function CalendarDay({ day, currentMonth, data, onClick }: CalendarDayProps) {
  const isCurrentMonth = isSameMonth(day, currentMonth);
  const isCurrentDay = isToday(day);
  const hasHours = data && data.hours > 0;
  const hasNotes = data && data.notes && data.notes.trim().length > 0;

  return (
    <motion.button
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(day)}
      className={`
        relative h-32 w-full p-3 rounded-2xl flex flex-col items-start justify-between
        transition-all duration-300 border border-transparent
        focus:outline-none focus:ring-4 focus:ring-primary/20
        ${!isCurrentMonth ? "opacity-40 bg-muted/20 hover:bg-muted/40" : "bg-card hover:shadow-lg hover:shadow-black/5 hover:border-border/80"}
        ${isCurrentDay ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}
      `}
    >
      <div className="w-full flex justify-between items-start">
        <span
          className={`
            text-sm font-semibold flex items-center justify-center w-8 h-8 rounded-full
            ${isCurrentDay ? "bg-primary text-primary-foreground" : "text-muted-foreground"}
          `}
        >
          {format(day, "d")}
        </span>
        
        {hasNotes && (
          <div 
            className="text-primary/60 bg-primary/10 p-1.5 rounded-full"
            title="Has notes"
          >
            <FileText className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      <div className="w-full flex flex-col items-start gap-1 mt-auto">
        {hasHours ? (
          <div className="w-full bg-primary/10 text-primary px-2.5 py-1.5 rounded-lg flex items-baseline justify-between font-semibold border border-primary/20">
            <span className="text-lg leading-none">{data.hours}</span>
            <span className="text-xs font-medium uppercase tracking-wider opacity-70">hrs</span>
          </div>
        ) : (
          <div className="w-full bg-transparent px-2.5 py-1.5 rounded-lg flex items-center text-transparent group-hover:text-muted-foreground/40 transition-colors border border-transparent border-dashed group-hover:border-border">
            <span className="text-xs font-medium">+ Add</span>
          </div>
        )}
      </div>
    </motion.button>
  );
}
