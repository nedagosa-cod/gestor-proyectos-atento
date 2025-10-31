import { useEffect, useState, useCallback, useRef } from "react";
import { fetchGoogleSheetData } from "./utils/utils";
import type { TrainingRecord } from "./utils/utils";
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
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";

type Tab = "calendar" | "campaigns";

export default function Simulator() {
  const [data, setData] = useState<TrainingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeTab, setActiveTab] = useState<Tab>("calendar");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef<number | null>(null);

  // Intervalo de actualización automática en milisegundos (2 minutos)
  const REFRESH_INTERVAL = useRef(2 * 60 * 1000).current;

  const loadData = useCallback(
    async (isManualRefresh = false) => {
      try {
        if (isManualRefresh) {
          setIsRefreshing(true);
          toast.info("Actualizando datos...");
        } else {
          setLoading(true);
        }

        const records = await fetchGoogleSheetData();

        // Verificar si hay cambios en los datos
        const hasChanges = JSON.stringify(data) !== JSON.stringify(records);

        setData(records);
        setError(null);
        setLastUpdate(new Date());

        if (isManualRefresh) {
          if (hasChanges && data.length > 0) {
            toast.success("¡Datos actualizados correctamente!", {
              description: `Se encontraron cambios en ${records.length} registros`,
            });
          } else if (data.length > 0) {
            toast.info("Los datos ya están actualizados", {
              description: "No se encontraron cambios nuevos",
            });
          } else {
            toast.success("Datos cargados correctamente");
          }
        } else if (hasChanges && data.length > 0) {
          // Solo notificar en actualización automática si hay cambios
          toast.success("Se detectaron cambios nuevos", {
            description: `Datos actualizados automáticamente`,
          });
        }
      } catch (err) {
        setError("Error al cargar los datos de Google Sheets");
        console.error(err);
        if (isManualRefresh) {
          toast.error("Error al actualizar datos", {
            description: "No se pudo conectar con Google Sheets",
          });
        }
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [data]
  );

  // Carga inicial
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sistema de actualización automática
  useEffect(() => {
    if (!autoRefresh) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Configurar intervalo de actualización
    intervalRef.current = setInterval(() => {
      loadData();
    }, REFRESH_INTERVAL);

    // Limpiar intervalo al desmontar
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh]);

  // Función para refrescar manualmente
  const handleManualRefresh = () => {
    loadData(true);
  };

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
      <div className="mb-8 bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-3 bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Calendario de Entrenamientos
            </h1>
            <p className="text-gray-600 text-lg">
              Visualiza los procesos organizados por sus fechas de inicio y fin
            </p>
          </div>

          {/* Panel de control de actualización */}
          <div className="flex flex-col items-end gap-3">
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className={`flex items-center gap-2 px-4 py-2 bg-linear-to-r from-blue-500 to-indigo-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                isRefreshing ? "animate-pulse" : ""
              }`}
              title="Actualizar datos manualmente"
            >
              <RefreshCw
                className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`}
              />
              <span className="font-semibold">
                {isRefreshing ? "Actualizando..." : "Actualizar"}
              </span>
            </button>

            {/* Toggle de actualización automática */}
            <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  Auto-actualizar
                </span>
              </label>
            </div>

            {/* Indicador de última actualización */}
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <span>Última actualización:</span>
              <span className="font-semibold">
                {format(lastUpdate, "HH:mm:ss", { locale: es })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sistema de pestañas */}
      <div className="mb-6 bg-white rounded-xl shadow-md border border-gray-100">
        <nav className="flex space-x-1 p-2">
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
                  currentMonth={currentMonth}
                  setCurrentMonth={setCurrentMonth}
                  selectedDay={selectedDay}
                  setSelectedDay={setSelectedDay}
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
    </div>
  );
}
