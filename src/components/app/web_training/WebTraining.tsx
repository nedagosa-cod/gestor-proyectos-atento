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
import CalendarTab from "./components/CalendarTab";
import CampaignsTab from "./components/CampaignsTab";
import ReportsTab from "./components/ReportsTab";

type Tab = "calendar" | "campaigns" | "reports";

export default function WebTraining() {
  const [data, setData] = useState<TrainingRecord[]>([]);
  const [festivos, setFestivos] = useState<FestivoRecord[]>([]);
  const [novedades, setNovedades] = useState<NovedadesRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("calendar");

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

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-blue-50 to-indigo-50 p-8 flex flex-col">
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
          <button
            onClick={() => setActiveTab("reports")}
            className={`${
              activeTab === "reports"
                ? "bg-linear-to-r from-blue-500 to-indigo-600 text-white shadow-lg"
                : "text-gray-600 hover:bg-gray-100"
            } flex-1 py-3 px-6 rounded-lg font-semibold text-sm transition-all duration-200 transform hover:scale-105`}
          >
            📈 Reportes
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
            <CalendarTab
              data={data}
              festivos={festivos}
              novedades={novedades}
            />
          )}

          {/* Pestaña de Consulta de Campañas */}
          {activeTab === "campaigns" && <CampaignsTab data={data} />}

          {/* Pestaña de Reportes */}
          {activeTab === "reports" && <ReportsTab data={data} />}
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
