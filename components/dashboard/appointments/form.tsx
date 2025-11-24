"use client";

import { useState } from "react";
import { ButtonGroup } from "@/components/ui/button-group";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { MoonIcon, BriefcaseIcon, CalendarIcon, CalendarPlusIcon, PlusIcon, LightbulbIcon } from "lucide-react";

export default function AppointmentsForm() {
  // Stato per gestire la categoria selezionata (default: "Altro")
  const [selectedCategory, setSelectedCategory] = useState<"sleep" | "work" | "other">("other");
  // Stato per gestire gli orari di inizio e fine
  const [startTime, setStartTime] = useState<string>("00:00");
  const [endTime, setEndTime] = useState<string>("00:00");
  const [isRepeating, setIsRepeating] = useState<boolean>(false);
  const [repeatInterval, setRepeatInterval] = useState<string>("1");
  const [repeatDays, setRepeatDays] = useState<string[]>([]);

  return (
    <>
      <div className="w-full flex flex-col gap-4 p-4 border-1 border-gray-200 rounded-lg">

        <span className="text-base font-bold text-slate-800 flex items-center gap-2">
          <CalendarPlusIcon className="w-4 h-4 text-indigo-600" />
          Aggiungi un impegno
        </span>

        <ButtonGroup className="w-full overflow-x-auto">
          <Button
            className="flex-1 gap-2 cursor-pointer"
            variant={selectedCategory === "other" ? "default" : "outline"}
            onClick={() => setSelectedCategory("other")}
          >
            <CalendarIcon className="w-4 h-4" />
            Altro
          </Button>
          <Button
            className="flex-1 gap-2 cursor-pointer"
            variant={selectedCategory === "sleep" ? "default" : "outline"}
            onClick={() => setSelectedCategory("sleep")}
          >
            <MoonIcon className="w-4 h-4" />
            Sonno
          </Button>
          <Button
            className="flex-1 gap-2 cursor-pointer"
            variant={selectedCategory === "work" ? "default" : "outline"}
            onClick={() => setSelectedCategory("work")}
          >
            <BriefcaseIcon className="w-4 h-4" />
            Lavoro
          </Button>
        </ButtonGroup>

        <div className="flex gap-2">
          {/* Time picker per l'orario di inizio */}
          <div className="flex flex-col gap-2 w-full">
            <Label htmlFor="start-time" className="text-gray-500 uppercase text-xs font-bold">Inizio</Label>
            <Input
              id="start-time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full"
            />
          </div>
          {/* Time picker per l'orario di fine */}
          <div className="flex flex-col gap-2 w-full">
            <Label htmlFor="end-time" className="text-gray-500 uppercase text-xs font-bold">Fine</Label>
            <Input
              id="end-time"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        {selectedCategory === "other" && (
        <div className="flex flex-col gap-2">
            <Label htmlFor="description" className="text-gray-500 uppercase text-xs font-bold">Descrizione</Label>
            <Input type="text" placeholder="Impegno, sonno, lavoro, etc." />
          </div>
        )}

        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Switch className="cursor-pointer" id="airplane-mode" checked={isRepeating} onCheckedChange={setIsRepeating} />
            <Label htmlFor="airplane-mode" className="cursor-pointer text-gray-500 uppercase text-xs font-bold">Ripeti impegno</Label>
          </div>

          {isRepeating && (
            <ToggleGroup type="multiple" value={repeatDays} onValueChange={setRepeatDays} className="overflow-x-auto w-full border-1 border-gray-200">
              <ToggleGroupItem className="uppercase text-xs text-gray-400 flex-1 " value="1">l</ToggleGroupItem>
              <ToggleGroupItem className="uppercase text-xs text-gray-400 flex-1 " value="2">m</ToggleGroupItem>
              <ToggleGroupItem className="uppercase text-xs text-gray-400 flex-1 " value="3">m</ToggleGroupItem>
              <ToggleGroupItem className="uppercase text-xs text-gray-400 flex-1 " value="4">g</ToggleGroupItem>
              <ToggleGroupItem className="uppercase text-xs text-gray-400 flex-1 " value="5">v</ToggleGroupItem>
              <ToggleGroupItem className="uppercase text-xs text-gray-400 flex-1 " value="6">s</ToggleGroupItem>
              <ToggleGroupItem className="uppercase text-xs text-gray-400 flex-1 " value="7">d</ToggleGroupItem>
            </ToggleGroup>
          )}
        </section>

        <Button className="w-full cursor-pointer" variant="default"><PlusIcon className="w-4 h-4" /> Aggiungi impegno</Button>
      </div>

      {/* Tip box con informazioni utili */}
      <p className="text-gray-500 text-sm pt-4 select-none">Gli orari di sonno e lavoro aiutano a calcolare meglio le disponibilità.</p>
    </>
  );
}