import { format, isSameMonth, isToday, isSunday, isSaturday } from "date-fns";
import { type TimeSlot } from "@shared/schema";

interface CalendarDayProps {
  day: Date;
  currentMonth: Date;
  slots: TimeSlot[];
  onClick: (day: Date) => void;
}

export function CalendarDay({ day, currentMonth, slots, onClick }: CalendarDayProps) {
  const isCurrentMonth = isSameMonth(day, currentMonth);
  const isCurrentDay = isToday(day);
  const isWeekend = isSunday(day) || isSaturday(day);

  return (
    <button
      data-testid={`calendar-day-${format(day, "yyyy-MM-dd")}`}
      onClick={() => onClick(day)}
      className={`
        relative min-h-[100px] w-full p-2 flex flex-col items-start text-left
        border-b border-r border-border/60
        transition-colors duration-150
        focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-inset
        ${!isCurrentMonth ? "opacity-30 bg-muted/30" : isWeekend ? "bg-muted/20" : "bg-card"}
        ${isCurrentMonth ? "cursor-pointer hover:bg-primary/5" : "cursor-default pointer-events-none"}
      `}
    >
      <span
        className={`
          text-sm font-bold mb-1
          ${isCurrentDay ? "bg-primary text-primary-foreground w-7 h-7 rounded-full flex items-center justify-center" : ""}
          ${!isCurrentDay && isCurrentMonth ? "text-foreground" : ""}
          ${!isCurrentMonth ? "text-muted-foreground" : ""}
        `}
      >
        {format(day, "d")}
      </span>

      <div className="flex flex-col gap-0.5 w-full mt-auto">
        {slots.map((slot) => (
          <div
            key={slot.id}
            data-testid={`slot-${slot.id}`}
            className="text-xs font-medium text-primary truncate"
          >
            {slot.startTime}-{slot.endTime}
          </div>
        ))}
      </div>
    </button>
  );
}
