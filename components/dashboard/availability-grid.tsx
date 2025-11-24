export default function AvailabilityGrid() {
  const slots = Array.from({ length: 48 }).map((_, i) => {
    const minutes = i * 30;
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    const timeLabel = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    
    let bgColor = "bg-emerald-400 shadow-sm shadow-emerald-200";
    if (i >= 10 && i < 14) bgColor = "bg-slate-200";
    if (i >= 20 && i < 24) bgColor = "bg-indigo-200";
    if (i >= 30 && i < 34) bgColor = "bg-slate-300";
    if (i >= 40 && i < 44) bgColor = "bg-indigo-200/70";
    
    return { timeLabel, bgColor, index: i };
  });

  return (
    
    <div className="w-full bg-white">
      <div className="flex flex-col sm:flex-row justify-between gap-2 border-b border-slate-100 pb-4 select-none">
        <h3 className="text-base font-bold text-slate-800">Timeline Disponibilità</h3>
        <div className="flex gap-4 text-xs font-medium border border-slate-200 px-3 py-1 rounded-md">
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

      <div className="relative w-full overflow-x-auto overflow-y-hidden">
        <div className="flex w-max min-w-full">
          {slots.map((slot) => (
            <div key={slot.index} className="flex flex-col items-center relative w-3 md:w-4 mx-[1px] pb-2">
              <div className={`w-full h-8 rounded-xs transition-all duration-300 ${slot.bgColor}`}></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
