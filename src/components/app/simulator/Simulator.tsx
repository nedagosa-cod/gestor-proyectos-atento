import { useEffect, useState } from "react";
import {
  fetchGoogleSheetData,
  fetchSheetFestivosData,
  fetchSheetNovedades,
} from "./utils/utils";
import type {
  TrainingRecord,
  FestivoRecord,
  NovedadesRecord,
} from "./utils/utils";
import Calendar from "./Calendar";
import {
  format,
  parseISO,
  isWithinInterval,
  isSameMonth,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";

type Tab = "calendar" | "campaigns";

export default function Simulator() {
  const [data, setData] = useState<TrainingRecord[]>([]);
  const [festivos, setFestivos] = useState<FestivoRecord[]>([]);
  const [novedades, setNovedades] = useState<NovedadesRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeTab, setActiveTab] = useState<Tab>("calendar");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [records, festivosData, novedadesData] = await Promise.all([
          fetchGoogleSheetData(),
          fetchSheetFestivosData(),
          fetchSheetNovedades(),
        ]);
        setData(records);
        setFestivos(festivosData);
        setNovedades(novedadesData);
        setError(null);
      } catch (err) {
        setError("Error al cargar los datos de Google Sheets");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Función para obtener eventos activos en una fecha específica
  const getEventsForDate = (date: Date): TrainingRecord[] => {
    return data.filter((record) => {
      if (!record.fechaInicio || !record.fechaFin) return false;

      try {
        let startDate: Date;
        let endDate: Date;

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

        return isWithinInterval(date, { start: startDate, end: endDate });
      } catch (error) {
        console.error("Error parseando fecha:", error, record);
        return false;
      }
    });
  };

  // Obtener días del mes actual
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  }).filter((day) => day.getDay() !== 0);

  // Obtener todas las campañas activas en el mes actual
  const getActiveCampaignsInMonth = (): {
    campana: string;
    count: number;
    desarrolladores: Set<string>;
  }[] => {
    const campaignsMap = new Map<
      string,
      { count: number; desarrolladores: Set<string> }
    >();

    days.forEach((day) => {
      if (isSameMonth(day, currentMonth)) {
        const events = getEventsForDate(day);
        events.forEach((event) => {
          if (event.campana) {
            if (!campaignsMap.has(event.campana)) {
              campaignsMap.set(event.campana, {
                count: 0,
                desarrolladores: new Set(),
              });
            }
            const campaignData = campaignsMap.get(event.campana)!;
            campaignData.count++;
            if (event.desarrollador) {
              campaignData.desarrolladores.add(event.desarrollador);
            }
          }
        });
      }
    });

    return Array.from(campaignsMap.entries()).map(
      ([campana, { count, desarrolladores }]) => ({
        campana,
        count,
        desarrolladores,
      })
    );
  };

  const activeCampaigns = getActiveCampaignsInMonth();

  // Funciones para la pestaña de consulta de campañas
  interface CampaignInfo {
    nombre: string;
    totalProcesos: number;
    procesosCompletados: number;
    procesosEnCurso: number;
    procesosPendientes: number;
    desarrolladores: Set<string>;
    coordinadores: Set<string>;
    aplicativos: Set<string>;
    procesos: TrainingRecord[];
  }

  const getCampaignsData = (): CampaignInfo[] => {
    const campaignsMap = new Map<string, CampaignInfo>();

    data.forEach((record) => {
      if (!record.campana) return;

      if (!campaignsMap.has(record.campana)) {
        campaignsMap.set(record.campana, {
          nombre: record.campana,
          totalProcesos: 0,
          procesosCompletados: 0,
          procesosEnCurso: 0,
          procesosPendientes: 0,
          desarrolladores: new Set(),
          coordinadores: new Set(),
          aplicativos: new Set(),
          procesos: [],
        });
      }

      const campaign = campaignsMap.get(record.campana)!;
      campaign.totalProcesos++;
      campaign.procesos.push(record);

      const estado = record.estado?.toLowerCase() || "";
      if (estado.includes("completado") || estado.includes("terminado")) {
        campaign.procesosCompletados++;
      } else if (estado.includes("curso") || estado.includes("proceso")) {
        campaign.procesosEnCurso++;
      } else if (estado.includes("pendiente")) {
        campaign.procesosPendientes++;
      }

      if (record.desarrollador)
        campaign.desarrolladores.add(record.desarrollador);
      if (record.coordinador) campaign.coordinadores.add(record.coordinador);
      if (record.aplicativo) campaign.aplicativos.add(record.aplicativo);
    });

    return Array.from(campaignsMap.values()).sort((a, b) =>
      a.nombre.localeCompare(b.nombre)
    );
  };

  const campaigns = getCampaignsData();
  const filteredCampaigns = campaigns.filter((campaign) =>
    campaign.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedCampaignData = selectedCampaign
    ? campaigns.find((c) => c.nombre === selectedCampaign)
    : null;

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "N/A";

    try {
      if (dateString.includes("Date(")) {
        const match = dateString.match(/Date\((\d+),(\d+),(\d+)\)/);
        if (match) {
          const date = new Date(
            parseInt(match[1]),
            parseInt(match[2]),
            parseInt(match[3])
          );
          return format(date, "dd/MM/yyyy", { locale: es });
        }
      } else {
        const date = parseISO(dateString);
        return format(date, "dd/MM/yyyy", { locale: es });
      }
    } catch (error) {
      console.error("Error al formatear fecha:", error);
    }

    return dateString;
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-blue-50 to-indigo-50 p-8 flex flex-col">
      {/* Sistema de pestañas */}
      <div className="mb-2 bg-white rounded-xl shadow-md border border-gray-100 flex">
        <h1 className="text-6xl font-bold mb-4 bg-linear-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent mr-10 ml-4">
          Simulator
        </h1>

        <nav className="flex space-x-1 p-2 w-full">
          <button
            onClick={() => setActiveTab("calendar")}
            className={`${
              activeTab === "calendar"
                ? "bg-linear-to-r from-blue-500 to-indigo-600 text-white shadow-lg"
                : "text-gray-600 hover:bg-gray-100"
            } flex-1 py-3 px-6 rounded-lg font-semibold text-sm transition-all duration-200 transform hover:scale-105`}
          >
            📅 Calendario
          </button>
          <button
            onClick={() => setActiveTab("campaigns")}
            className={`${
              activeTab === "campaigns"
                ? "bg-linear-to-r from-blue-500 to-indigo-600 text-white shadow-lg"
                : "text-gray-600 hover:bg-gray-100"
            } flex-1 py-3 px-6 rounded-lg font-semibold text-sm transition-all duration-200 transform hover:scale-105`}
          >
            📊 Consulta de Campañas
          </button>
        </nav>
      </div>

      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando datos...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Pestaña de Calendario */}
          {activeTab === "calendar" && (
            <>
              <div className="flex-1 bg-white rounded-xl shadow-xl p-8 overflow-hidden h-dvh border border-gray-100">
                <Calendar
                  data={data}
                  festivos={festivos}
                  currentMonth={currentMonth}
                  setCurrentMonth={setCurrentMonth}
                  selectedDay={selectedDay}
                  setSelectedDay={setSelectedDay}
                  novedades={novedades}
                />
              </div>

              {/* Panel de información */}
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Campañas activas en el mes */}
                <div className="bg-linear-to-br from-blue-500 to-indigo-600 rounded-xl p-6 shadow-xl transform hover:scale-105 transition-all duration-200">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <span className="text-2xl">📊</span>
                    Campañas Activas en{" "}
                    {format(currentMonth, "MMMM", { locale: es })}
                  </h3>
                  {activeCampaigns.length > 0 ? (
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                      {activeCampaigns.map(
                        ({ campana, count, desarrolladores }) => (
                          <div
                            key={campana}
                            className="bg-white/95 backdrop-blur rounded-lg p-4 shadow-md border border-blue-100 hover:bg-white transition-all hover:shadow-lg"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-bold text-blue-900 text-sm mb-1">
                                  {campana}
                                </p>
                                <div className="flex gap-3 text-xs text-gray-600">
                                  <span className="flex items-center gap-1">
                                    📁 {count} proceso{count !== 1 ? "s" : ""}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    👥 {desarrolladores.size} dev
                                    {desarrolladores.size !== 1 ? "s" : ""}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <div className="bg-white/90 rounded-lg p-4 text-center">
                      <p className="text-gray-600 text-sm">
                        No hay campañas activas este mes
                      </p>
                    </div>
                  )}
                </div>

                {/* Información del día seleccionado */}
                <div className="bg-linear-to-br from-purple-500 to-pink-600 rounded-xl p-6 shadow-xl transform hover:scale-105 transition-all duration-200">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <span className="text-2xl">📅</span>
                    Día Seleccionado
                  </h3>
                  {selectedDay ? (
                    <div className="space-y-3">
                      <div className="bg-white/95 backdrop-blur rounded-lg p-4 shadow-md">
                        <p className="font-bold text-purple-900 mb-3 text-lg">
                          {format(selectedDay, "EEEE, d 'de' MMMM", {
                            locale: es,
                          })}
                        </p>
                        {getEventsForDate(selectedDay).length > 0 ? (
                          <>
                            <div className="mb-3 px-3 py-2 bg-purple-100 rounded-lg">
                              <p className="text-sm font-semibold text-purple-900">
                                {getEventsForDate(selectedDay).length} proceso
                                {getEventsForDate(selectedDay).length !== 1
                                  ? "s"
                                  : ""}{" "}
                                activo
                                {getEventsForDate(selectedDay).length !== 1
                                  ? "s"
                                  : ""}
                              </p>
                            </div>
                            <div className="max-h-40 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                              {getEventsForDate(selectedDay)
                                .slice(0, 5)
                                .map((event, idx) => (
                                  <div
                                    key={idx}
                                    className="text-xs bg-linear-to-r from-purple-50 to-pink-50 rounded-lg px-3 py-2 border border-purple-100"
                                  >
                                    <span className="font-bold text-purple-900">
                                      {event.campana}
                                    </span>
                                    <span className="text-gray-600">
                                      {" "}
                                      - {event.nombreProceso}
                                    </span>
                                  </div>
                                ))}
                              {getEventsForDate(selectedDay).length > 5 && (
                                <p className="text-xs text-purple-700 text-center font-semibold bg-purple-100 rounded py-1">
                                  +{getEventsForDate(selectedDay).length - 5}{" "}
                                  más...
                                </p>
                              )}
                            </div>
                          </>
                        ) : (
                          <p className="text-sm text-gray-600 text-center py-2">
                            Sin procesos activos este día
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white/90 rounded-lg p-4 text-center">
                      <p className="text-gray-600 text-sm">
                        Haz clic en un día del calendario para ver su
                        información
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Pestaña de Consulta de Campañas */}
          {activeTab === "campaigns" && (
            <div className="min-h-screen">
              {/* Buscador */}
              <div className="mb-6">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="🔍 Buscar campaña..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-6 py-4 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-md transition-all text-lg"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center transition-all"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Lista de campañas */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-100">
                    <h2 className="text-2xl font-bold mb-4 bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      Campañas ({filteredCampaigns.length})
                    </h2>
                    <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto pr-2 custom-scrollbar">
                      {filteredCampaigns.map((campaign) => (
                        <button
                          key={campaign.nombre}
                          onClick={() => setSelectedCampaign(campaign.nombre)}
                          className={`w-full text-left p-4 rounded-xl transition-all transform  ${
                            selectedCampaign === campaign.nombre
                              ? "bg-linear-to-r from-blue-500 to-indigo-600 text-white shadow-lg"
                              : "bg-linear-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-indigo-50 text-gray-800 shadow-md"
                          }`}
                        >
                          <div className="font-bold mb-2 text-base">
                            {campaign.nombre}
                          </div>
                          <div
                            className={`text-sm flex items-center gap-1 ${
                              selectedCampaign === campaign.nombre
                                ? "text-blue-100"
                                : "text-gray-600"
                            }`}
                          >
                            <span>📁</span>
                            {campaign.totalProcesos} proceso
                            {campaign.totalProcesos !== 1 ? "s" : ""}
                          </div>
                        </button>
                      ))}
                      {filteredCampaigns.length === 0 && (
                        <div className="text-center py-8 bg-gray-50 rounded-xl">
                          <p className="text-gray-500">
                            No se encontraron campañas
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Detalles de la campaña seleccionada */}
                <div className="lg:col-span-2">
                  {selectedCampaignData ? (
                    <div className="space-y-6">
                      {/* Resumen de estadísticas */}
                      <div className="bg-white rounded-xl shadow-xl p-8 border border-gray-100">
                        <h2 className="text-3xl font-bold mb-6 bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                          {selectedCampaignData.nombre}
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-linear-to-br from-blue-500 to-blue-600 rounded-xl p-6 shadow-lg transform hover:scale-105 transition-all">
                            <div className="text-4xl font-bold text-white mb-2">
                              {selectedCampaignData.totalProcesos}
                            </div>
                            <div className="text-sm text-blue-100 font-semibold">
                              Total Procesos
                            </div>
                          </div>
                          <div className="bg-linear-to-br from-green-500 to-green-600 rounded-xl p-6 shadow-lg transform hover:scale-105 transition-all">
                            <div className="text-4xl font-bold text-white mb-2">
                              {selectedCampaignData.procesosCompletados}
                            </div>
                            <div className="text-sm text-green-100 font-semibold">
                              Completados
                            </div>
                          </div>
                          <div className="bg-linear-to-br from-yellow-500 to-orange-600 rounded-xl p-6 shadow-lg transform hover:scale-105 transition-all">
                            <div className="text-4xl font-bold text-white mb-2">
                              {selectedCampaignData.procesosEnCurso}
                            </div>
                            <div className="text-sm text-yellow-100 font-semibold">
                              En Curso
                            </div>
                          </div>
                          <div className="bg-linear-to-br from-gray-500 to-gray-600 rounded-xl p-6 shadow-lg transform hover:scale-105 transition-all">
                            <div className="text-4xl font-bold text-white mb-2">
                              {selectedCampaignData.procesosPendientes}
                            </div>
                            <div className="text-sm text-gray-100 font-semibold">
                              Pendientes
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Información adicional */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-linear-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg p-6 transform hover:scale-105 transition-all">
                          <h3 className="font-semibold text-blue-100 mb-3 text-lg flex items-center gap-2">
                            <span className="text-2xl">👥</span> Desarrolladores
                          </h3>
                          <div className="text-4xl font-bold text-white">
                            {selectedCampaignData.desarrolladores.size}
                          </div>
                        </div>
                        <div className="bg-linear-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg p-6 transform hover:scale-105 transition-all">
                          <h3 className="font-semibold text-purple-100 mb-3 text-lg flex items-center gap-2">
                            <span className="text-2xl">📋</span> Coordinadores
                          </h3>
                          <div className="text-4xl font-bold text-white">
                            {selectedCampaignData.coordinadores.size}
                          </div>
                        </div>
                        <div className="bg-linear-to-br from-green-500 to-teal-600 rounded-xl shadow-lg p-6 transform hover:scale-105 transition-all">
                          <h3 className="font-semibold text-green-100 mb-3 text-lg flex items-center gap-2">
                            <span className="text-2xl">💻</span> Aplicativos
                          </h3>
                          <div className="text-4xl font-bold text-white">
                            {selectedCampaignData.aplicativos.size}
                          </div>
                        </div>
                      </div>

                      {/* Lista detallada de procesos */}
                      <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-100">
                        <h3 className="text-2xl font-bold mb-6 bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                          Procesos de la Campaña
                        </h3>
                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-linear-to-r from-blue-500 to-indigo-600">
                              <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                                  Proceso
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                                  Estado
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                                  Desarrollador
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                                  Coordinador
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                                  Aplicativo
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                                  Fecha Inicio
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                                  Fecha Fin
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {selectedCampaignData.procesos.map(
                                (proceso, idx) => (
                                  <tr
                                    key={idx}
                                    className="hover:bg-blue-50 transition-colors"
                                  >
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                      {proceso.nombreProceso || "N/A"}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                      <span
                                        className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${
                                          proceso.estado
                                            ?.toLowerCase()
                                            .includes("completado")
                                            ? "bg-linear-to-r from-green-400 to-green-600 text-white"
                                            : proceso.estado
                                                ?.toLowerCase()
                                                .includes("curso")
                                            ? "bg-linear-to-r from-yellow-400 to-orange-500 text-white"
                                            : "bg-linear-to-r from-gray-400 to-gray-600 text-white"
                                        }`}
                                      >
                                        {proceso.estado || "N/A"}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                                      {proceso.desarrollador || "N/A"}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-700">
                                      {proceso.coordinador || "N/A"}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-700">
                                      {proceso.aplicativo || "N/A"}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-700">
                                      {formatDate(proceso.fechaInicio)}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-700">
                                      {formatDate(proceso.fechaFin)}
                                    </td>
                                  </tr>
                                )
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl shadow-xl p-16 text-center border border-gray-100">
                      <div className="text-8xl mb-6">📊</div>
                      <h3 className="text-3xl font-bold mb-4 bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Selecciona una campaña
                      </h3>
                      <p className="text-gray-600 text-lg">
                        Haz clic en una campaña de la lista para ver su
                        información detallada
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {!loading && !error && data.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">No hay datos disponibles</p>
        </div>
      )}

      {/* Botón de ayuda flotante */}
      <button
        onClick={() => setShowHelp(true)}
        className="fixed bottom-8 right-8 bg-linear-to-r from-blue-500 to-indigo-600 text-white rounded-full w-16 h-16 shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-300 flex items-center justify-center font-bold text-2xl z-50 border-4 border-white"
        title="Ayuda e Instrucciones"
      >
        ?
      </button>

      {/* Modal de ayuda */}
      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Encabezado */}
            <div className="sticky top-0 bg-linear-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-t-2xl flex justify-between items-center shadow-lg z-10">
              <div>
                <h2 className="text-3xl font-bold mb-2">📚 Guía de Uso</h2>
                <p className="text-blue-100 text-sm">
                  Aprende a usar todas las funcionalidades del sistema
                </p>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="text-white hover:bg-white hover:text-blue-600 rounded-full w-10 h-10 flex items-center justify-center transition-all text-2xl font-bold"
              >
                ✕
              </button>
            </div>

            {/* Contenido */}
            <div className="p-8 space-y-6">
              {/* Sección de Pestañas */}
              <div className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  📑 Las Dos Pestañas Principales
                </h3>

                {/* Pestaña Calendario */}
                <div className="mb-6 bg-linear-to-r from-blue-50 to-blue-100 rounded-lg p-5 border-l-4 border-blue-500">
                  <h4 className="text-lg font-bold text-blue-900 mb-3 flex items-center gap-2">
                    📅 Pestaña: Calendario
                  </h4>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold mt-1">•</span>
                      <div>
                        <strong>Vista del calendario:</strong> Muestra todos los
                        días del mes actual (excluyendo domingos).
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold mt-1">•</span>
                      <div>
                        <strong>Días con procesos:</strong> Los días con
                        procesos activos se destacan con colores y puntos
                        indicadores.
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold mt-1">•</span>
                      <div>
                        <strong>Navegación:</strong> Usa las flechas ◀ ▶ en el
                        calendario para cambiar de mes.
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold mt-1">•</span>
                      <div>
                        <strong>Selección de día:</strong> Haz clic en cualquier
                        día para ver los procesos activos en ese día en el panel
                        inferior derecho.
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold mt-1">•</span>
                      <div>
                        <strong>Campañas Activas:</strong> En el panel inferior
                        izquierdo verás un resumen de todas las campañas activas
                        en el mes actual.
                      </div>
                    </li>
                  </ul>
                </div>

                {/* Pestaña Consulta de Campañas */}
                <div className="bg-linear-to-r from-purple-50 to-pink-100 rounded-lg p-5 border-l-4 border-purple-500">
                  <h4 className="text-lg font-bold text-purple-900 mb-3 flex items-center gap-2">
                    📊 Pestaña: Consulta de Campañas
                  </h4>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 font-bold mt-1">•</span>
                      <div>
                        <strong>Buscador:</strong> Utiliza el campo de búsqueda
                        para filtrar campañas por nombre.
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 font-bold mt-1">•</span>
                      <div>
                        <strong>Lista de campañas:</strong> En la columna
                        izquierda verás todas las campañas disponibles con el
                        número de procesos.
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 font-bold mt-1">•</span>
                      <div>
                        <strong>Detalles de campaña:</strong> Al hacer clic en
                        una campaña, verás estadísticas completas: procesos
                        totales, completados, en curso, pendientes,
                        desarrolladores, coordinadores y aplicativos.
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 font-bold mt-1">•</span>
                      <div>
                        <strong>Tabla de procesos:</strong> Muestra todos los
                        procesos de la campaña seleccionada con información
                        detallada como estado, desarrollador, coordinador,
                        aplicativo y fechas.
                      </div>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Sección de Estados */}
              <div className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  🚦 Estados de los Procesos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-linear-to-br from-green-100 to-green-200 rounded-lg p-4 border-2 border-green-400">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">✅</span>
                      <span className="font-bold text-green-900">
                        Completado
                      </span>
                    </div>
                    <p className="text-sm text-green-800">
                      El proceso ha finalizado exitosamente
                    </p>
                  </div>
                  <div className="bg-linear-to-br from-yellow-100 to-orange-200 rounded-lg p-4 border-2 border-yellow-400">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">⏳</span>
                      <span className="font-bold text-orange-900">
                        En Curso
                      </span>
                    </div>
                    <p className="text-sm text-orange-800">
                      El proceso está actualmente en desarrollo
                    </p>
                  </div>
                  <div className="bg-linear-to-br from-gray-100 to-gray-200 rounded-lg p-4 border-2 border-gray-400">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">📋</span>
                      <span className="font-bold text-gray-900">Pendiente</span>
                    </div>
                    <p className="text-sm text-gray-800">
                      El proceso aún no ha comenzado
                    </p>
                  </div>
                </div>
              </div>

              {/* Consejos y Tips */}
              <div className="bg-linear-to-br from-amber-50 to-yellow-50 rounded-xl p-6 border-2 border-amber-300">
                <h3 className="text-xl font-bold text-amber-900 mb-4 flex items-center gap-2">
                  💡 Consejos Útiles
                </h3>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-3">
                    <span className="text-2xl">🎨</span>
                    <div>
                      <strong>Colores en el calendario:</strong> Los días se
                      colorean según la cantidad de procesos activos. Más
                      intenso = más procesos.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-2xl">🔄</span>
                    <div>
                      <strong>Actualización automática:</strong> Los datos se
                      cargan automáticamente desde Google Sheets al abrir la
                      página.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-2xl">📱</span>
                    <div>
                      <strong>Responsive:</strong> La interfaz se adapta a
                      diferentes tamaños de pantalla (móvil, tablet,
                      escritorio).
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-2xl">🔍</span>
                    <div>
                      <strong>Búsqueda rápida:</strong> En la pestaña de
                      campañas, puedes buscar por nombre para encontrar
                      rápidamente lo que necesitas.
                    </div>
                  </li>
                </ul>
              </div>

              {/* Atajos y funciones rápidas */}
              <div className="bg-white rounded-xl p-6 border-2 border-indigo-200 shadow-sm">
                <h3 className="text-xl font-bold text-indigo-900 mb-4 flex items-center gap-2">
                  ⚡ Funciones Rápidas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">👆</div>
                    <div>
                      <p className="font-semibold text-gray-900">Clic en día</p>
                      <p className="text-sm text-gray-600">
                        Ver procesos activos ese día
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">📅</div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        Flechas calendario
                      </p>
                      <p className="text-sm text-gray-600">
                        Navegar entre meses
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">🔍</div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        Buscar campaña
                      </p>
                      <p className="text-sm text-gray-600">
                        Filtrar por nombre en tiempo real
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">📊</div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        Clic en campaña
                      </p>
                      <p className="text-sm text-gray-600">
                        Ver estadísticas completas
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer del modal */}
            <div className="sticky bottom-0 bg-linear-to-r from-gray-100 to-gray-200 p-6 rounded-b-2xl flex justify-center border-t-2 border-gray-300">
              <button
                onClick={() => setShowHelp(false)}
                className="bg-linear-to-r from-blue-500 to-indigo-600 text-white px-8 py-3 rounded-xl font-bold text-lg hover:from-blue-600 hover:to-indigo-700 transition-all transform hover:scale-105 shadow-lg"
              >
                ¡Entendido! 🚀
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
