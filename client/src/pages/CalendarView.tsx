import { useState, useMemo } from "react";
import { 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  format 
} from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Briefcase } from "lucide-react";
import { useWorkHours } from "@/hooks/use-work-hours";
import { CalendarDay } from "@/components/CalendarDay";
import { WorkHourDialog } from "@/components/WorkHourDialog";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Format for API querying
  const currentMonthStr = format(currentDate, "yyyy-MM");
  
  // Fetch data
  const { data: workHoursData, isLoading } = useWorkHours(currentMonthStr);
  
  // Create a map for O(1) lookups
  const workHoursMap = useMemo(() => {
    const map = new Map();
    workHoursData?.forEach((entry) => {
      map.set(entry.date, entry);
    });
    return map;
  }, [workHoursData]);

  // Calculate total hours for the month
  const totalMonthHours = useMemo(() => {
    return workHoursData?.reduce((total, entry) => total + entry.hours, 0) || 0;
  }, [workHoursData]);

  // Calendar grid logic
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setIsDialogOpen(true);
  };

  const getSelectedDayData = () => {
    if (!selectedDate) return undefined;
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    return workHoursMap.get(dateStr);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 lg:p-12 pb-24 max-w-[1400px] mx-auto">
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold tracking-wide mb-3">
            <Briefcase className="w-4 h-4" />
            Workspace
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground tracking-tight">
            Schedule
          </h1>
          <p className="text-muted-foreground text-lg">
            Manage and track your monthly working hours.
          </p>
        </div>

        <div className="glass-card px-6 py-4 rounded-2xl flex items-center gap-6">
          <div>
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Total Hours
            </p>
            <div className="flex items-baseline gap-1 mt-1">
              {isLoading ? (
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              ) : (
                <>
                  <span className="text-3xl font-display font-bold text-foreground">
                    {totalMonthHours}
                  </span>
                  <span className="text-muted-foreground font-medium">hrs</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-[2rem] overflow-hidden shadow-xl shadow-primary/5">
        {/* Calendar Header */}
        <div className="p-6 md:px-8 border-b border-border/50 flex items-center justify-between bg-white/50">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-display font-bold min-w-[180px]">
              {format(currentDate, "MMMM yyyy")}
            </h2>
            <button
              onClick={goToToday}
              className="hidden sm:block px-4 py-1.5 rounded-full bg-muted/50 hover:bg-muted text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              Today
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              className="p-2.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-all hover:scale-105 active:scale-95"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextMonth}
              className="p-2.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-all hover:scale-105 active:scale-95"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Calendar Body */}
        <div className="p-6 md:p-8 bg-white/30">
          <div className="grid grid-cols-7 gap-4 mb-4">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-bold uppercase tracking-widest text-muted-foreground/70"
              >
                {day}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentMonthStr}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="grid grid-cols-7 gap-2 md:gap-4 group"
            >
              {calendarDays.map((day) => {
                const dateStr = format(day, "yyyy-MM-dd");
                const data = workHoursMap.get(dateStr);
                return (
                  <CalendarDay
                    key={day.toISOString()}
                    day={day}
                    currentMonth={currentDate}
                    data={data}
                    onClick={handleDayClick}
                  />
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <WorkHourDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        date={selectedDate}
        initialData={getSelectedDayData()}
      />
    </div>
  );
}
