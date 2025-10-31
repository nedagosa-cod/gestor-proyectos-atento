import { useEffect, useState } from "react";
import { fetchGoogleSheetData } from "./utils/utils";
import type { TrainingRecord } from "./utils/utils";
import Calendar from "./Calendar";

export default function Simulator() {
  const [data, setData] = useState<TrainingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const records = await fetchGoogleSheetData();
        setData(records);
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
    <div className="p-8 h-screen flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">
          Calendario de Entrenamientos
        </h1>
        <p className="text-gray-600">
          Visualiza los procesos organizados por sus fechas de inicio y fin
        </p>
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
        <div className="flex-1 bg-white rounded-lg shadow-lg p-6 overflow-hidden">
          <Calendar data={data} />
        </div>
      )}

      {!loading && !error && data.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">No hay datos disponibles</p>
        </div>
      )}
    </div>
  );
}
