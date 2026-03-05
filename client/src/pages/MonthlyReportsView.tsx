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
import { ChevronLeft, ChevronRight, Download, FileText, Loader2, Trash2 } from "lucide-react";
import { jsPDF } from "jspdf";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useTimeSlots } from "@/hooks/use-work-hours";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { totalHoursFromSlots } from "@/lib/time-utils";
import { type Report, type TimeSlot } from "@shared/schema";

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export default function MonthlyReportsView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const currentMonthStr = format(currentDate, "yyyy-MM");
  const { data: slotsData } = useTimeSlots(currentMonthStr);

  const { data: reports, isLoading: reportsLoading } = useQuery<Report[]>({
    queryKey: ["/api/reports", currentMonthStr],
    queryFn: async () => {
      const res = await fetch(`/api/reports?month=${encodeURIComponent(currentMonthStr)}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch reports");
      return res.json();
    },
  });

  const slotsByDate = useMemo(() => {
    const map = new Map<string, TimeSlot[]>();
    slotsData?.forEach((slot) => {
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

  const handleDeleteReport = async (id: number) => {
    try {
      await apiRequest("DELETE", `/api/reports/${id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/reports", currentMonthStr] });
    } catch {
      toast({ title: "Error", description: "Failed to delete report", variant: "destructive" });
    }
  };

  const buildCalendarPdf = useCallback((doc: jsPDF, yStart: number): number => {
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 10;
    const colW = (pageW - margin * 2) / 7;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    const headerText = `${monthNumber}    ${monthName}    ${year}`;
    doc.text(headerText, pageW / 2, yStart + 6, { align: "center" });

    const hoursText = `Total Hours: ${totalMonthHours.toFixed(1)}h`;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(hoursText, pageW - margin, yStart + 6, { align: "right" });

    const headerY = yStart + 14;
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

    const rowH = 22;

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
    return gridStartY + weeks.length * rowH + 10;
  }, [calendarDays, slotsByDate, currentDate, monthNumber, monthName, year, totalMonthHours]);

  const handleGenerateFullReport = useCallback(() => {
    if (!reports || reports.length === 0) {
      toast({ title: "No reports", description: "No daily reports found for this month. Generate reports from the Tasks page first.", variant: "destructive" });
      return;
    }

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentW = pageW - margin * 2;

    let y = buildCalendarPdf(doc, margin);

    y += 5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Daily Reports", margin, y);
    y += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    reports.forEach((report) => {
      const dateLabel = format(new Date(report.date + "T00:00:00"), "EEEE, MMMM d, yyyy");

      const lines = doc.splitTextToSize(report.content, contentW - 10);
      const blockH = 8 + lines.length * 5 + 6;

      if (y + blockH > pageH - margin) {
        doc.addPage();
        y = margin;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(40);
      doc.text(dateLabel, margin, y + 5);
      y += 8;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(60);
      lines.forEach((line: string) => {
        doc.text(line, margin + 5, y);
        y += 5;
      });

      y += 4;
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, y, pageW - margin, y);
      y += 6;
    });

    doc.setTextColor(0);
    const filename = `Monthly_Report_${year}_${monthNumber}.pdf`;
    doc.save(filename);
  }, [reports, buildCalendarPdf, year, monthNumber, toast]);

  const handleDownloadSingleReport = useCallback((report: Report) => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const margin = 15;
    const contentW = doc.internal.pageSize.getWidth() - margin * 2;

    const dateLabel = format(new Date(report.date + "T00:00:00"), "EEEE, MMMM d, yyyy");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Daily Work Report", margin, margin + 8);

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80);
    doc.text(dateLabel, margin, margin + 16);

    doc.setDrawColor(200, 200, 200);
    doc.line(margin, margin + 20, margin + contentW, margin + 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(40);
    const lines = doc.splitTextToSize(report.content, contentW);
    let y = margin + 28;
    lines.forEach((line: string) => {
      doc.text(line, margin, y);
      y += 6;
    });

    doc.setTextColor(0);
    const filename = `Report_${report.date}.pdf`;
    doc.save(filename);
  }, []);

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <Button data-testid="button-prev-month-reports" size="icon" variant="ghost" onClick={prevMonth}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 data-testid="text-reports-month-header" className="text-xl md:text-2xl font-bold tracking-wide text-foreground select-none min-w-[280px] text-center">
            {monthNumber}
            <span className="mx-6">{monthName}</span>
            {year}
          </h1>
          <Button data-testid="button-next-month-reports" size="icon" variant="ghost" onClick={nextMonth}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        <Button
          data-testid="button-generate-full-report"
          onClick={handleGenerateFullReport}
          disabled={!reports || reports.length === 0}
        >
          <Download className="w-4 h-4 mr-2" />
          Generate Full Report PDF
        </Button>
      </div>

      <div className="flex-1 p-6 max-w-3xl mx-auto w-full">
        {reportsLoading ? (
          <div className="text-center text-muted-foreground py-12">Loading reports...</div>
        ) : !reports || reports.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p className="text-lg font-medium">No reports for this month</p>
            <p className="text-sm mt-1">Generate daily reports from the Tasks page first</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report.id}
                data-testid={`report-item-${report.id}`}
                className="border border-border rounded-lg bg-card overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-b border-border">
                  <h3 data-testid={`text-report-date-${report.id}`} className="text-sm font-semibold text-foreground">
                    {format(new Date(report.date + "T00:00:00"), "EEEE, MMMM d, yyyy")}
                  </h3>
                  <div className="flex items-center gap-2">
                    <Button
                      data-testid={`button-download-report-${report.id}`}
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadSingleReport(report)}
                    >
                      <Download className="w-3.5 h-3.5 mr-1" />
                      Download
                    </Button>
                    <Button
                      data-testid={`button-delete-report-${report.id}`}
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDeleteReport(report.id)}
                      className="h-8 w-8"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <div data-testid={`text-report-content-${report.id}`} className="px-4 py-3 text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {report.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
