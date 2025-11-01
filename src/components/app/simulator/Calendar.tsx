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
import type {
  TrainingRecord,
  FestivoRecord,
  NovedadesRecord,
} from "./utils/utils";
import { ChevronLeft, ChevronRight, Play, Flag } from "lucide-react";

interface CalendarProps {
  data: TrainingRecord[];
  festivos: FestivoRecord[];
  novedades: NovedadesRecord[];
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
  selectedDay: Date | null;
  setSelectedDay: (date: Date | null) => void;
}

export default function Calendar({
  data,
  festivos,
  currentMonth,
  setCurrentMonth,
  selectedDay,
  setSelectedDay,
  novedades,
}: CalendarProps) {
  const [selectedEvent, setSelectedEvent] = useState<TrainingRecord | null>(
    null
  );
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);

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

  // Función para verificar si un día es festivo
  const isHoliday = (
    date: Date
  ): { isHoliday: boolean; name: string | null } => {
    for (const festivo of festivos) {
      if (!festivo.festivo) continue;

      try {
        let festivoDate: Date;

        // Si la fecha viene en formato "Date(año, mes, día)"
        if (festivo.festivo.includes("Date(")) {
          const match = festivo.festivo.match(/Date\((\d+),(\d+),(\d+)\)/);
          if (match) {
            festivoDate = new Date(
              parseInt(match[1]),
              parseInt(match[2]),
              parseInt(match[3])
            );
          } else {
            continue;
          }
        } else {
          // Intentar parsear como fecha normal
          festivoDate = parseISO(festivo.festivo);
        }

        // Comparar solo año, mes y día
        if (
          festivoDate.getFullYear() === date.getFullYear() &&
          festivoDate.getMonth() === date.getMonth() &&
          festivoDate.getDate() === date.getDate()
        ) {
          return { isHoliday: true, name: festivo.festividad };
        }
      } catch (error) {
        console.error("Error parseando fecha de festivo:", error, festivo);
      }
    }

    return { isHoliday: false, name: null };
  };

  // Función para obtener novedades activas en una fecha específica
  const getNovedadesForDate = (date: Date): NovedadesRecord[] => {
    return novedades.filter((novedad) => {
      if (!novedad.fechaInicio || !novedad.fechaFin) return false;

      try {
        let startDate: Date;
        let endDate: Date;

        // Si la fecha viene en formato "Date(año, mes, día)"
        if (novedad.fechaInicio.includes("Date(")) {
          const startMatch = novedad.fechaInicio.match(
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
          startDate = parseISO(novedad.fechaInicio);
        }

        if (novedad.fechaFin.includes("Date(")) {
          const endMatch = novedad.fechaFin.match(/Date\((\d+),(\d+),(\d+)\)/);
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
          endDate = parseISO(novedad.fechaFin);
        }

        // Verificar si la fecha está dentro del rango
        return isWithinInterval(date, { start: startDate, end: endDate });
      } catch (error) {
        console.error("Error parseando fecha de novedad:", error, novedad);
        return false;
      }
    });
  };

  // Paleta de colores para desarrolladores
  const developerColors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-red-500",
    "bg-purple-500",
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

  // Función para verificar si una fecha es inicio o fin de un evento
  const isDateStartOrEnd = (
    date: Date,
    event: TrainingRecord
  ): { isStart: boolean; isEnd: boolean } => {
    if (!event.fechaInicio || !event.fechaFin)
      return { isStart: false, isEnd: false };

    try {
      let startDate: Date;
      let endDate: Date;

      // Parsear fecha de inicio
      if (event.fechaInicio.includes("Date(")) {
        const startMatch = event.fechaInicio.match(/Date\((\d+),(\d+),(\d+)\)/);
        if (startMatch) {
          startDate = new Date(
            parseInt(startMatch[1]),
            parseInt(startMatch[2]),
            parseInt(startMatch[3])
          );
        } else {
          return { isStart: false, isEnd: false };
        }
      } else {
        startDate = parseISO(event.fechaInicio);
      }

      // Parsear fecha de fin
      if (event.fechaFin.includes("Date(")) {
        const endMatch = event.fechaFin.match(/Date\((\d+),(\d+),(\d+)\)/);
        if (endMatch) {
          endDate = new Date(
            parseInt(endMatch[1]),
            parseInt(endMatch[2]),
            parseInt(endMatch[3])
          );
        } else {
          return { isStart: false, isEnd: false };
        }
      } else {
        endDate = parseISO(event.fechaFin);
      }

      // Comparar solo año, mes y día
      const isStart =
        startDate.getFullYear() === date.getFullYear() &&
        startDate.getMonth() === date.getMonth() &&
        startDate.getDate() === date.getDate();

      const isEnd =
        endDate.getFullYear() === date.getFullYear() &&
        endDate.getMonth() === date.getMonth() &&
        endDate.getDate() === date.getDate();

      return { isStart, isEnd };
    } catch (error) {
      console.error("Error parseando fechas:", error, event);
      return { isStart: false, isEnd: false };
    }
  };

  // Función para formatear fechas del formato Date(año, mes, día) a día/mes/año
  const formatDateString = (dateString: string | null): string => {
    if (!dateString) return "";

    // Si la fecha viene en formato "Date(año, mes, día)"
    if (dateString.includes("Date(")) {
      const match = dateString.match(/Date\((\d+),(\d+),(\d+)\)/);
      if (match) {
        const year = match[1];
        const month = parseInt(match[2]) + 1; // Los meses en JavaScript empiezan en 0
        const day = match[3];
        return `${day}/${month}/${year}`;
      }
    }

    // Si ya viene en otro formato, intentar parsearlo
    try {
      const date = parseISO(dateString);
      return format(date, "d/M/yyyy");
    } catch {
      return dateString; // Si no se puede parsear, devolver tal cual
    }
  };

  // Obtener lista única de desarrolladores
  const uniqueDevelopers = Array.from(
    new Set(
      data
        .map((record) => record.desarrollador)
        .filter((dev): dev is string => !!dev)
    )
  ).sort();

  // Obtener campañas activas del mes actual
  const getActiveCampaigns = (): string[] => {
    const campaignsInMonth = data.filter((record) => {
      if (!record.fechaInicio || !record.fechaFin || !record.campana)
        return false;

      try {
        let startDate: Date;
        let endDate: Date;

        // Parsear fecha de inicio
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
          startDate = parseISO(record.fechaInicio);
        }

        // Parsear fecha de fin
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

        // Verificar si hay algún día del mes dentro del rango
        const monthStartDate = startOfMonth(currentMonth);
        const monthEndDate = endOfMonth(currentMonth);

        return startDate <= monthEndDate && endDate >= monthStartDate;
      } catch (error) {
        console.error("Error parseando fechas:", error, record);
        return false;
      }
    });

    // Obtener campañas únicas
    const uniqueCampaigns = Array.from(
      new Set(
        campaignsInMonth
          .map((record) => record.campana)
          .filter((c): c is string => !!c)
      )
    ).sort();

    return uniqueCampaigns;
  };

  const activeCampaigns = getActiveCampaigns();

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header del calendario */}
      <div className="flex flex-col gap-4 mb-8 px-4">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent capitalize">
            {format(currentMonth, "MMMM yyyy", { locale: es })}
          </h2>

          {/* Leyenda de colores */}
          <div className="bg-white rounded-lg shadow-md px-4 py-2 border border-gray-200">
            <div className="flex items-center gap-6">
              <span className="text-xs font-bold text-gray-600">Estados:</span>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm"></div>
                  <span className="text-xs text-gray-700">Finalizada</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm"></div>
                  <span className="text-xs text-gray-700">En Proceso</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-800 shadow-sm"></div>
                  <span className="text-xs text-gray-700">Pendiente</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-gray-500 shadow-sm"></div>
                  <span className="text-xs text-gray-700">Sin Iniciar</span>
                </div>
              </div>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-600">
                  Desarrolladores:
                </span>
                <div className="flex items-center gap-2 flex-wrap max-h-8 overflow-y-auto">
                  {uniqueDevelopers.map((developer) => (
                    <div
                      key={developer}
                      className="flex items-center gap-1.5 bg-gray-50 px-2 py-0.5 rounded-full"
                    >
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${getDeveloperColor(
                          developer
                        )} shadow-sm`}
                      ></div>
                      <span className="text-xs text-gray-700 font-medium">
                        {developer}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="h-6 w-px bg-gray-300"></div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Play className="w-4 h-4 text-gray-700" />
                  <span className="text-xs text-gray-700">Inicio</span>
                </div>
                <div className="flex items-center gap-1">
                  <Flag className="w-4 h-4 text-gray-700" />
                  <span className="text-xs text-gray-700">Fin</span>
                </div>
              </div>
            </div>
            {/* Campañas activas del mes */}
            {activeCampaigns.length > 0 && (
              <div className="bg-blue-500 rounded-lg shadow-md px-4 py-3 border border-gray-200 mt-2 flex items-center justify-center">
                <div className="flex items-center gap-2 flex-wrap">
                  {activeCampaigns.map((campaign) => (
                    <button
                      key={campaign}
                      onClick={() =>
                        setSelectedCampaign(
                          selectedCampaign === campaign ? null : campaign
                        )
                      }
                      className={`px-3 rounded shadow-sm hover:shadow-md transition-all transform hover:scale-105 cursor-pointer ${
                        selectedCampaign === campaign
                          ? "bg-linear-to-r from-purple-600 to-pink-600 text-white ring-2 ring-purple-400"
                          : "ring-1 ring-gray-300 bg-white"
                      }`}
                      title={
                        selectedCampaign === campaign
                          ? "Clic para quitar filtro"
                          : "Clic para filtrar por esta campaña"
                      }
                    >
                      <span className="text-xs font-medium">{campaign}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Cambia mes */}
          <div className="flex gap-3">
            <button
              onClick={prevMonth}
              className="p-3 bg-linear-to-r from-blue-500 to-indigo-600 text-white rounded-lg transition-all hover:shadow-lg transform hover:scale-105"
              aria-label="Mes anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentMonth(new Date())}
              className="px-6 py-3 bg-linear-to-r from-purple-500 to-pink-600 text-white rounded-lg transition-all hover:shadow-lg transform hover:scale-105 font-bold"
            >
              Hoy
            </button>
            <button
              onClick={nextMonth}
              className="p-3 bg-linear-to-r from-blue-500 to-indigo-600 text-white rounded-lg transition-all hover:shadow-lg transform hover:scale-105"
              aria-label="Mes siguiente"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid del calendario */}
      <div className="flex-1 flex flex-col">
        {/* Días de la semana */}
        <div className="grid grid-cols-6 gap-2 mb-4">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center font-bold text-sm text-white bg-linear-to-r from-blue-500 to-indigo-600 py-3 rounded-lg shadow-md"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Días del mes */}
        <div className="grid grid-cols-6 gap-3 flex-1">
          {days.map((day) => {
            const eventsForDay = getEventsForDate(day);
            const novedadesForDay = getNovedadesForDate(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isCurrentDay = isToday(day);
            const holidayInfo = isHoliday(day);
            return (
              <div
                key={day.toString()}
                onClick={() => setSelectedDay(day)}
                className={`
                  border-2 rounded-xl p-3 min-h-[100px] flex flex-col cursor-pointer
                  transition-all hover:shadow-xl transform hover:scale-105
                  ${
                    holidayInfo.isHoliday
                      ? "bg-red-100 border-red-400"
                      : isCurrentMonth
                      ? "bg-white border-gray-200"
                      : "bg-gray-100 border-gray-300"
                  }
                  ${isCurrentDay ? "ring-4 ring-blue-400 shadow-lg" : ""}
                  ${
                    selectedDay &&
                    format(selectedDay, "yyyy-MM-dd") ===
                      format(day, "yyyy-MM-dd")
                      ? "ring-4 ring-purple-400 shadow-lg"
                      : ""
                  }
                `}
              >
                <div className="flex-1 flex">
                  <div
                    className={`
                    text-sm font-bold mb-2 flex items-center justify-center w-7 h-7 rounded-full
                    ${isCurrentMonth ? "text-gray-900" : "text-gray-500"}
                    ${
                      isCurrentDay
                        ? "bg-linear-to-r from-blue-500 to-indigo-600 text-white"
                        : holidayInfo.isHoliday
                        ? "bg-red-600 text-white"
                        : ""
                    }
                  `}
                  >
                    {format(day, "d")}
                  </div>
                  <div className="flex items-center gap-3 ml-1">
                    {novedadesForDay.map((novedad, idx) => (
                      <div
                        key={idx}
                        className={`w-2 h-2 transform rotate-45 shadow-sm mb-2 ring-2 ring-red-800 ${getDeveloperColor(
                          novedad.desarrollador
                        )}`}
                        title={`${
                          novedad.desarrollador || "Sin desarrollador"
                        }: ${novedad.novedad || "Sin descripción"}`}
                      ></div>
                    ))}
                  </div>
                </div>

                {/* Eventos del día */}
                <div className="flex-1">
                  {holidayInfo.isHoliday ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <p className="text-xs font-bold text-red-700">
                          🎉 Festivo
                        </p>
                        {holidayInfo.name && (
                          <p className="text-[10px] text-red-600 mt-1">
                            {holidayInfo.name}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-1 px-2">
                        {eventsForDay.slice(0, 6).map((event, idx) => {
                          const dateStatus = isDateStartOrEnd(day, event);
                          const isFiltered =
                            selectedCampaign &&
                            event.campana !== selectedCampaign;
                          const shouldSpanTwoColumns =
                            eventsForDay.length === 3 && idx === 2;
                          return (
                            <button
                              key={idx}
                              onClick={() => setSelectedEvent(event)}
                              className={`
                              text-left text-[10px] px-2 py-1.5 rounded-lg flex justify-between items-center gap-1
                              ${getDeveloperColor(
                                event.desarrollador
                              )} text-white
                              hover:opacity-90 transition-all shadow-md hover:shadow-lg transform hover:scale-105 
                              truncate
                              ${
                                isFiltered
                                  ? "opacity-30 grayscale saturate-0"
                                  : ""
                              }
                              ${shouldSpanTwoColumns ? "xl:col-span-2" : ""}
                            `}
                              title={`${event.campana || "Sin campaña"} - ${
                                event.nombreProceso || "Sin proceso"
                              }`}
                            >
                              <p className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-semibold">
                                {event.campana || "Sin dev"}
                              </p>
                              <div className="flex items-center gap-1">
                                {dateStatus.isStart && (
                                  <Play className="w-3 h-3 text-white" />
                                )}
                                {dateStatus.isEnd && (
                                  <Flag className="w-3 h-3 text-white" />
                                )}
                                <div
                                  className={`rounded-full ring-2 ring-white ${getStatusColor(
                                    event.estado
                                  )} w-2 h-2 shadow-sm`}
                                ></div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      {eventsForDay.length > 6 && (
                        <div className="text-xs font-bold text-gray-700 text-center mt-2 bg-gray-100 rounded py-1">
                          +{eventsForDay.length - 6} más
                        </div>
                      )}
                    </>
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
          className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="bg-white rounded-2xl p-8 max-w-3xl w-full max-h-[80vh] overflow-y-auto shadow-2xl border-2 border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-3xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {selectedEvent.nombreProceso || "Sin nombre"}
              </h3>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full w-10 h-10 flex items-center justify-center transition-all text-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {selectedEvent.campana && (
                <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                  <span className="font-bold text-blue-900 text-sm uppercase tracking-wide">
                    Campaña
                  </span>
                  <p className="text-gray-800 font-semibold text-lg mt-1">
                    {selectedEvent.campana}
                  </p>
                </div>
              )}
              {selectedEvent.coordinador && (
                <div className="bg-linear-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                  <span className="font-bold text-purple-900 text-sm uppercase tracking-wide">
                    Coordinador
                  </span>
                  <p className="text-gray-800 font-semibold text-lg mt-1">
                    {selectedEvent.coordinador}
                  </p>
                </div>
              )}
              {selectedEvent.desarrollador && (
                <div className="bg-linear-to-r from-green-50 to-teal-50 rounded-xl p-4 border border-green-200">
                  <span className="font-bold text-green-900 text-sm uppercase tracking-wide mb-2 block">
                    Desarrollador
                  </span>
                  <span
                    className={`inline-block px-4 py-2 rounded-lg text-white font-bold text-base shadow-md ${getDeveloperColor(
                      selectedEvent.desarrollador
                    )}`}
                  >
                    {selectedEvent.desarrollador}
                  </span>
                </div>
              )}
              {selectedEvent.aplicativo && (
                <div className="bg-linear-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200">
                  <span className="font-bold text-yellow-900 text-sm uppercase tracking-wide">
                    Aplicativo
                  </span>
                  <p className="text-gray-800 font-semibold text-lg mt-1">
                    {selectedEvent.aplicativo}
                  </p>
                </div>
              )}
              {selectedEvent.estado && (
                <div className="bg-linear-to-r from-gray-50 to-slate-50 rounded-xl p-4 border border-gray-200">
                  <span className="font-bold text-gray-900 text-sm uppercase tracking-wide mb-2 block">
                    Estado
                  </span>
                  <span
                    className={`inline-block px-4 py-2 rounded-lg text-white font-bold text-base shadow-md ${getStatusColor(
                      selectedEvent.estado
                    )}`}
                  >
                    {selectedEvent.estado}
                  </span>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {selectedEvent.fechaInicio && (
                  <div className="bg-white rounded-xl p-4 border-2 border-blue-300 shadow-md">
                    <span className="font-bold text-blue-900 text-xs uppercase tracking-wide block mb-2">
                      📅 Fecha Inicio
                    </span>
                    <p className="text-gray-800 font-semibold">
                      {formatDateString(selectedEvent.fechaInicio)}
                    </p>
                  </div>
                )}
                {selectedEvent.fechaFin && (
                  <div className="bg-white rounded-xl p-4 border-2 border-red-300 shadow-md">
                    <span className="font-bold text-red-900 text-xs uppercase tracking-wide block mb-2">
                      📅 Fecha Fin
                    </span>
                    <p className="text-gray-800 font-semibold">
                      {formatDateString(selectedEvent.fechaFin)}
                    </p>
                  </div>
                )}
                {selectedEvent.fechaReal && (
                  <div className="bg-white rounded-xl p-4 border-2 border-green-300 shadow-md">
                    <span className="font-bold text-green-900 text-xs uppercase tracking-wide block mb-2">
                      📅 Fecha Real
                    </span>
                    <p className="text-gray-800 font-semibold">
                      {formatDateString(selectedEvent.fechaReal)}
                    </p>
                  </div>
                )}
              </div>
              {selectedEvent.notas && (
                <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200 w-full">
                  <span className="font-bold text-blue-900 text-sm uppercase tracking-wide">
                    Notas
                  </span>
                  <p className="text-gray-800 font-semibold text-lg mt-1 w-full wrap-break-word whitespace-normal">
                    {selectedEvent.notas}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
