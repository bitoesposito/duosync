"use client";

import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

dayjs.extend(customParseFormat);

type Appointment = {
  id: string;
  startTime: string;
  endTime: string;
  category: "sleep" | "work" | "other";
};

type Segment = {
  id: string;
  left: number;
  width: number;
  category: "sleep" | "work" | "other" | "available";
  startTime: string;
  endTime: string;
};

export default function AvailabilityGrid() {
  const appointments: Appointment[] = [
    { id: "1", startTime: "00:00", endTime: "06:00", category: "sleep" },
    { id: "2", startTime: "06:00", endTime: "14:00", category: "work" }
  ];

  const dayStart = dayjs("00:00", "HH:mm");
  const dayEnd = dayjs("24:00", "HH:mm");
  const dayDuration = dayEnd.diff(dayStart, "minute");

  const timeToPercent = (time: string) => {
    return (dayjs(time, "HH:mm").diff(dayStart, "minute") / dayDuration) * 100;
  };

  const getColor = (category: string) => {
    const colors = {
      sleep: "bg-indigo-200",
      work: "bg-slate-300",
      other: "bg-slate-200",
      available: "bg-emerald-400",
    };
    return colors[category as keyof typeof colors] || "bg-emerald-400";
  };

  // Genera tutti i segmenti (impegni + disponibili)
  const generateAllSegments = (): Segment[] => {
    const sorted = [...appointments].sort((a, b) =>
      dayjs(a.startTime, "HH:mm").diff(dayjs(b.startTime, "HH:mm"))
    );

    const allSegments: Segment[] = [];
    let currentTime = dayStart;

    sorted.forEach((apt) => {
      const aptStart = dayjs(apt.startTime, "HH:mm");
      const aptEnd = dayjs(apt.endTime, "HH:mm");

      // Aggiungi segmento disponibile se c'è spazio prima
      if (aptStart.isAfter(currentTime)) {
        allSegments.push({
          id: `available-${currentTime.format("HH:mm")}`,
          left: timeToPercent(currentTime.format("HH:mm")),
          width: timeToPercent(apt.startTime) - timeToPercent(currentTime.format("HH:mm")),
          category: "available",
          startTime: currentTime.format("HH:mm"),
          endTime: apt.startTime,
        });
      }

      // Aggiungi segmento impegno
      allSegments.push({
        id: apt.id,
        left: timeToPercent(apt.startTime),
        width: timeToPercent(apt.endTime) - timeToPercent(apt.startTime),
        category: apt.category,
        startTime: apt.startTime,
        endTime: apt.endTime,
      });

      currentTime = aptEnd;
    });

    // Aggiungi segmento disponibile finale se necessario
    if (currentTime.isBefore(dayEnd)) {
      allSegments.push({
        id: `available-${currentTime.format("HH:mm")}`,
        left: timeToPercent(currentTime.format("HH:mm")),
        width: timeToPercent("24:00") - timeToPercent(currentTime.format("HH:mm")),
        category: "available",
        startTime: currentTime.format("HH:mm"),
        endTime: "24:00",
      });
    }

    return allSegments;
  };

  const segments = generateAllSegments();

  return (
    <div className="w-full bg-white flex flex-col gap-2 p-4 border-1 border-gray-200 rounded-lg">
      <div className="flex flex-col sm:flex-row justify-between gap-2 select-none">
        <h3 className="text-base font-bold text-slate-800">Timeline Disponibilità</h3>
        <div className="flex gap-4 text-xs font-medium border border-slate-200 rounded-md">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-200"></span>
            Match!
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
            Occupato
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-200"></span>
            Sonno
          </div>
        </div>
      </div>

      <TooltipProvider>
        <div className="relative w-full py-2">
          <div className="relative w-full h-4 rounded-md overflow-hidden">
            {segments
              .filter((segment) => segment.width > 0)
              .map((segment) => (
                <Tooltip key={segment.id}>
                  <TooltipTrigger asChild>
                    <div
                      className={`absolute h-full ${getColor(segment.category)} transition-all hover:opacity-90 cursor-pointer`}
                      style={{
                        left: `${segment.left}%`,
                        width: `${segment.width}%`,
                        minWidth: "2px",
                      }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">
                      {segment.startTime} - {segment.endTime}
                    </p>
                  </TooltipContent>
                </Tooltip>
              ))}
          </div>
        </div>
      </TooltipProvider>
    </div>
  );
}
