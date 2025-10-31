import { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  parseISO,
  isWithinInterval,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";
import type { TrainingRecord } from "./utils/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarProps {
  data: TrainingRecord[];
}

export default function Calendar({ data }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<TrainingRecord | null>(
    null
  );

  // Obtener todos los días del mes actual incluyendo días de semanas anteriores/posteriores
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Lunes como primer día
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  }).filter(
    (day) => day.getDay() !== 0 // Filtrar domingos (0 = domingo)
  );
  const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  // Función para obtener eventos activos en una fecha específica
  const getEventsForDate = (date: Date): TrainingRecord[] => {
    return data.filter((record) => {
      if (!record.fechaInicio || !record.fechaFin) return false;

      try {
        // Intentar parsear diferentes formatos de fecha
        let startDate: Date;
        let endDate: Date;

        // Si la fecha viene en formato "Date(año, mes, día)"
        if (record.fechaInicio.includes("Date(")) {
          const startMatch = record.fechaInicio.match(
            /Date\((\d+),(\d+),(\d+)\)/
          );
          if (startMatch) {
            startDate = new Date(
              parseInt(startMatch[1]),
              parseInt(startMatch[2]),
              parseInt(startMatch[3])
            );
          } else {
            return false;
          }
        } else {
          // Intentar parsear como fecha normal
          startDate = parseISO(record.fechaInicio);
        }

        if (record.fechaFin.includes("Date(")) {
          const endMatch = record.fechaFin.match(/Date\((\d+),(\d+),(\d+)\)/);
          if (endMatch) {
            endDate = new Date(
              parseInt(endMatch[1]),
              parseInt(endMatch[2]),
              parseInt(endMatch[3])
            );
          } else {
            return false;
          }
        } else {
          endDate = parseISO(record.fechaFin);
        }

        // Verificar si la fecha está dentro del rango
        return isWithinInterval(date, { start: startDate, end: endDate });
      } catch (error) {
        console.error("Error parseando fecha:", error, record);
        return false;
      }
    });
  };

  // Paleta de colores para desarrolladores
  const developerColors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-red-500",
    "bg-yellow-500",
    "bg-teal-500",
    "bg-orange-500",
    "bg-cyan-500",
    "bg-lime-500",
    "bg-amber-500",
    "bg-emerald-500",
    "bg-violet-500",
    "bg-fuchsia-500",
    "bg-rose-500",
    "bg-sky-500",
    "bg-slate-500",
  ];

  // Función para obtener un color consistente para cada desarrollador
  const getDeveloperColor = (desarrollador: string | null): string => {
    if (!desarrollador) return "bg-gray-500";

    // Generar un hash simple del nombre del desarrollador
    let hash = 0;
    for (let i = 0; i < desarrollador.length; i++) {
      hash = desarrollador.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Usar el hash para seleccionar un color de la paleta
    const index = Math.abs(hash) % developerColors.length;
    return developerColors[index];
  };

  // Obtener color según el estado (solo para el modal de detalle)
  const getStatusColor = (estado: string | null): string => {
    if (!estado) return "bg-gray-500";
    console.log(estado.toLowerCase());
    switch (estado.toLowerCase()) {
      case "finalizada":
        return "bg-green-500";
      case "en proceso":
        return "bg-blue-500";
      case "pendiente":
        return "bg-red-800";
      case "sin iniciar":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header del calendario */}
      <div className="flex items-center justify-between mb-6 px-4">
        <h2 className="text-2xl font-bold">
          {format(currentMonth, "MMMM yyyy", { locale: es })}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors font-medium"
          >
            Hoy
          </button>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Grid del calendario */}
      <div className="flex-1 flex flex-col">
        {/* Días de la semana */}
        <div className="grid grid-cols-6 gap-1 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center font-semibold text-sm text-gray-600 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Días del mes */}
        <div className="grid grid-cols-6 gap-1 flex-1">
          {days.map((day) => {
            const eventsForDay = getEventsForDate(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isCurrentDay = isToday(day);
            console.log(eventsForDay);
            return (
              <div
                key={day.toString()}
                className={`
                  border rounded-lg p-2 min-h-[100px] flex flex-col
                  ${isCurrentMonth ? "bg-white" : "bg-gray-50"}
                  ${isCurrentDay ? "ring-2 ring-blue-500" : ""}
                `}
              >
                <div
                  className={`
                    text-sm font-medium mb-1
                    ${isCurrentMonth ? "text-gray-900" : "text-gray-400"}
                    ${isCurrentDay ? "text-blue-600 font-bold" : ""}
                  `}
                >
                  {format(day, "d")}
                </div>

                {/* Eventos del día */}
                <div className="flex-1 overflow-y-auto">
                  <div className="grid grid-cols-3 gap-1">
                    {eventsForDay.slice(0, 6).map((event, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedEvent(event)}
                        className={`
                          text-left text-[10px] px-1.5 py-1 rounded flex justify-between
                          ${getDeveloperColor(event.desarrollador)} text-white
                          hover:opacity-80 transition-opacity
                          truncate
                        `}
                        title={`${event.campana || "Sin campaña"} - ${
                          event.nombreProceso || "Sin proceso"
                        }`}
                      >
                        <p className="w-4/5 overflow-hidden text-ellipsis whitespace-nowrap">
                          {event.campana || "Sin dev"}
                        </p>
                        <div
                          className={`rounded-full ring-1 ring-amber-50 ${getStatusColor(
                            event.estado
                          )} w-1 h-1`}
                        ></div>
                      </button>
                    ))}
                  </div>
                  {eventsForDay.length > 6 && (
                    <div className="text-xs text-gray-500 text-center mt-1">
                      +{eventsForDay.length - 4} más
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal de detalle del evento */}
      {selectedEvent && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold">
                {selectedEvent.nombreProceso || "Sin nombre"}
              </h3>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {selectedEvent.campana && (
                <div>
                  <span className="font-semibold">Campaña:</span>{" "}
                  {selectedEvent.campana}
                </div>
              )}
              {selectedEvent.coordinador && (
                <div>
                  <span className="font-semibold">Coordinador:</span>{" "}
                  {selectedEvent.coordinador}
                </div>
              )}
              {selectedEvent.desarrollador && (
                <div>
                  <span className="font-semibold">Desarrollador:</span>{" "}
                  <span
                    className={`inline-block px-2 py-1 rounded text-white text-sm ${getDeveloperColor(
                      selectedEvent.desarrollador
                    )}`}
                  >
                    {selectedEvent.desarrollador}
                  </span>
                </div>
              )}
              {selectedEvent.aplicativo && (
                <div>
                  <span className="font-semibold">Aplicativo:</span>{" "}
                  {selectedEvent.aplicativo}
                </div>
              )}
              {selectedEvent.estado && (
                <div>
                  <span className="font-semibold">Estado:</span>{" "}
                  <span
                    className={`inline-block px-2 py-1 rounded text-white text-sm ${getStatusColor(
                      selectedEvent.estado
                    )}`}
                  >
                    {selectedEvent.estado}
                  </span>
                </div>
              )}
              {selectedEvent.fechaInicio && (
                <div>
                  <span className="font-semibold">Fecha Inicio:</span>{" "}
                  {selectedEvent.fechaInicio}
                </div>
              )}
              {selectedEvent.fechaFin && (
                <div>
                  <span className="font-semibold">Fecha Fin:</span>{" "}
                  {selectedEvent.fechaFin}
                </div>
              )}
              {selectedEvent.fechaReal && (
                <div>
                  <span className="font-semibold">Fecha Real:</span>{" "}
                  {selectedEvent.fechaReal}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
