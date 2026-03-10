import { useState, useMemo, useCallback } from "react";
import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  getMonth,
  getYear,
  isSameMonth,
} from "date-fns";
import { ChevronLeft, ChevronRight, Download, Clock } from "lucide-react";
import { jsPDF } from "jspdf";
import { useTimeSlots, useBulkSaveSlots } from "@/hooks/use-work-hours";
import { CalendarDay } from "@/components/CalendarDay";
import { WorkHourDialog } from "@/components/WorkHourDialog";
import { CopySlotsPicker } from "@/components/CopySlotsPicker";
import { Button } from "@/components/ui/button";
import { type TimeSlot } from "@shared/schema";
import { totalHoursFromSlots } from "@/lib/time-utils";

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

interface CalendarViewProps {
  clientId: number;
}

export default function CalendarView({ clientId }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [copyMode, setCopyMode] = useState<{ sourceDate: string; slots: { startTime: string; endTime: string }[] } | null>(null);

  const currentMonthStr = format(currentDate, "yyyy-MM");
  const { data: slotsData, isLoading } = useTimeSlots(clientId, currentMonthStr);
  const bulkSave = useBulkSaveSlots(clientId);

  const slotsByDate = useMemo(() => {
    const map = new Map<string, TimeSlot[]>();
    slotsData?.forEach((slot: TimeSlot) => {
      const key = slot.date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(slot);
    });
    return map;
  }, [slotsData]);

  const totalMonthHours = useMemo(() => {
    if (!slotsData) return 0;
    return totalHoursFromSlots(slotsData);
  }, [slotsData]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const monthNumber = (getMonth(currentDate) + 1).toString().padStart(2, "0");
  const monthName = format(currentDate, "MMMM").toUpperCase();
  const year = getYear(currentDate);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const handleDayClick = (day: Date) => {
    if (copyMode) return;
    setSelectedDate(day);
    setIsDialogOpen(true);
  };

  const handleStartCopy = (sourceDate: string, slots: { startTime: string; endTime: string }[]) => {
    setIsDialogOpen(false);
    setCopyMode({ sourceDate, slots });
  };

  const getSelectedDaySlots = (): TimeSlot[] => {
    if (!selectedDate) return [];
    return slotsByDate.get(format(selectedDate, "yyyy-MM-dd")) || [];
  };

  const exportToPdf = useCallback(() => {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 10;
    const colW = (pageW - margin * 2) / 7;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    const headerText = `${monthNumber}    ${monthName}    ${year}`;
    doc.text(headerText, pageW / 2, margin + 6, { align: "center" });

    const hoursText = `Total Hours: ${totalMonthHours.toFixed(1)}h`;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(hoursText, pageW - margin, margin + 6, { align: "right" });

    const headerY = margin + 14;
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, headerY, pageW - margin * 2, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    WEEKDAYS.forEach((day, i) => {
      const x = margin + i * colW + colW / 2;
      doc.text(day, x, headerY + 5.5, { align: "center" });
    });

    const gridStartY = headerY + 8;
    const weeks: Date[][] = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      weeks.push(calendarDays.slice(i, i + 7));
    }

    const availableH = pageH - gridStartY - margin;
    const rowH = Math.min(availableH / weeks.length, 28);

    weeks.forEach((week, wi) => {
      const y = gridStartY + wi * rowH;

      week.forEach((day, di) => {
        const x = margin + di * colW;
        const isInMonth = isSameMonth(day, currentDate);

        doc.setDrawColor(200, 200, 200);
        doc.rect(x, y, colW, rowH);

        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(isInMonth ? 30 : 180);
        doc.text(format(day, "d"), x + 2, y + 5);

        const dateStr = format(day, "yyyy-MM-dd");
        const daySlots = slotsByDate.get(dateStr) || [];
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(isInMonth ? 60 : 180);

        daySlots.forEach((slot, si) => {
          const slotY = y + 9 + si * 4;
          if (slotY + 3 < y + rowH) {
            doc.text(`${slot.startTime}-${slot.endTime}`, x + 2, slotY);
          }
        });
      });
    });

    doc.setTextColor(0);

    const filename = `Work_Calendar_${year}_${monthNumber}.pdf`;
    doc.save(filename);
  }, [calendarDays, slotsByDate, currentDate, monthNumber, monthName, year, totalMonthHours]);

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <Button data-testid="button-prev-month" size="icon" variant="ghost" onClick={prevMonth}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 data-testid="text-month-header" className="text-xl md:text-2xl font-bold tracking-wide text-foreground select-none min-w-[280px] text-center">
            {monthNumber}
            <span className="mx-6">{monthName}</span>
            {year}
          </h1>
          <Button data-testid="button-next-month" size="icon" variant="ghost" onClick={nextMonth}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div data-testid="text-total-hours" className="flex items-center gap-2 px-4 py-2 rounded-md bg-muted text-foreground">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Total:</span>
            <span className="text-lg font-bold">{isLoading ? "..." : `${totalMonthHours.toFixed(1)}h`}</span>
          </div>
          <Button data-testid="button-export-pdf" variant="outline" onClick={exportToPdf} disabled={isLoading}>
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="grid grid-cols-7 border-b border-border bg-muted/40">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="py-2 text-center text-xs font-bold tracking-widest text-muted-foreground border-r border-border/60 last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        ) : (
          <div className="grid grid-cols-7 flex-1">
            {calendarDays.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const slots = slotsByDate.get(dateStr) || [];
              return (
                <CalendarDay
                  key={day.toISOString()}
                  day={day}
                  currentMonth={currentDate}
                  slots={slots}
                  onClick={handleDayClick}
                />
              );
            })}
          </div>
        )}
      </div>

      <WorkHourDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        date={selectedDate}
        existingSlots={getSelectedDaySlots()}
        clientId={clientId}
        onStartCopy={handleStartCopy}
      />

      {copyMode && (
        <CopySlotsPicker
          sourceDate={copyMode.sourceDate}
          slots={copyMode.slots}
          calendarDays={calendarDays.filter(d => isSameMonth(d, currentDate))}
          slotsByDate={slotsByDate}
          bulkSave={bulkSave}
          onClose={() => setCopyMode(null)}
        />
      )}
    </div>
  );
}
