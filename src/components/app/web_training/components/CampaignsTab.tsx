import { useState } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import type { TrainingRecord } from "../utils/utils";

interface CampaignsTabProps {
  data: TrainingRecord[];
}

export default function CampaignsTab({ data }: CampaignsTabProps) {
  const [searchTerm, setSearchTerm] = useState("");

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

  const filteredData = data.filter((d) =>
    searchTerm
      ? Object.values(d).some((val) =>
          val?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      : true
  );

  return (
    <div className="min-h-screen space-y-6">
      {/* Estadísticas Globales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-linear-to-br from-blue-500 to-blue-600 rounded-xl p-6 shadow-lg transform hover:scale-105 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-semibold mb-1">
                Total Registros
              </p>
              <p className="text-4xl font-bold text-white">{data.length}</p>
            </div>
            <div className="text-5xl opacity-80">📊</div>
          </div>
        </div>

        <div className="bg-linear-to-br from-green-500 to-green-600 rounded-xl p-6 shadow-lg transform hover:scale-105 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-semibold mb-1">
                Campañas
              </p>
              <p className="text-4xl font-bold text-white">
                {new Set(data.map((d) => d.campana).filter(Boolean)).size}
              </p>
            </div>
            <div className="text-5xl opacity-80">🎯</div>
          </div>
        </div>

        <div className="bg-linear-to-br from-purple-500 to-purple-600 rounded-xl p-6 shadow-lg transform hover:scale-105 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-semibold mb-1">
                Desarrolladores
              </p>
              <p className="text-4xl font-bold text-white">
                {new Set(data.map((d) => d.desarrollador).filter(Boolean)).size}
              </p>
            </div>
            <div className="text-5xl opacity-80">👨‍💻</div>
          </div>
        </div>

        <div className="bg-linear-to-br from-orange-500 to-orange-600 rounded-xl p-6 shadow-lg transform hover:scale-105 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-semibold mb-1">
                Clientes
              </p>
              <p className="text-4xl font-bold text-white">
                {new Set(data.map((d) => d.cliente).filter(Boolean)).size}
              </p>
            </div>
            <div className="text-5xl opacity-80">🏢</div>
          </div>
        </div>
      </div>

      {/* Estadísticas por Estado */}
      <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-100">
        <h3 className="text-2xl font-bold mb-4 bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Distribución por Estado
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-linear-to-br from-green-50 to-green-100 rounded-lg p-4 border-2 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-700 font-semibold text-sm mb-1">
                  Completados
                </p>
                <p className="text-3xl font-bold text-green-800">
                  {
                    data.filter((d) =>
                      d.estado?.toLowerCase().includes("completado")
                    ).length
                  }
                </p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>

          <div className="bg-linear-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border-2 border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-700 font-semibold text-sm mb-1">
                  En Curso
                </p>
                <p className="text-3xl font-bold text-yellow-800">
                  {
                    data.filter((d) =>
                      d.estado?.toLowerCase().includes("curso")
                    ).length
                  }
                </p>
              </div>
              <div className="text-4xl">⏳</div>
            </div>
          </div>

          <div className="bg-linear-to-br from-gray-50 to-gray-100 rounded-lg p-4 border-2 border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-700 font-semibold text-sm mb-1">
                  Pendientes
                </p>
                <p className="text-3xl font-bold text-gray-800">
                  {
                    data.filter((d) =>
                      d.estado?.toLowerCase().includes("pendiente")
                    ).length
                  }
                </p>
              </div>
              <div className="text-4xl">📋</div>
            </div>
          </div>
        </div>
      </div>

      {/* Buscador y Filtros */}
      <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-100">
        <h3 className="text-xl font-bold mb-4 bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          🔍 Búsqueda y Filtros
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Buscar
            </label>
            <input
              type="text"
              placeholder="Buscar en todos los campos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Estado
            </label>
            <select
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              onChange={(e) => setSearchTerm(e.target.value)}
            >
              <option value="">Todos los estados</option>
              {Array.from(
                new Set(data.map((d) => d.estado).filter(Boolean))
              ).map((estado) => (
                <option key={estado} value={estado || ""}>
                  {estado}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Campaña
            </label>
            <select
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              onChange={(e) => setSearchTerm(e.target.value)}
            >
              <option value="">Todas las campañas</option>
              {Array.from(new Set(data.map((d) => d.campana).filter(Boolean)))
                .sort()
                .map((campana) => (
                  <option key={campana} value={campana || ""}>
                    {campana}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {searchTerm && (
          <div className="mt-4 flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <span className="font-bold">{filteredData.length}</span>{" "}
              resultados encontrados
            </p>
            <button
              onClick={() => setSearchTerm("")}
              className="px-4 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-all"
            >
              Limpiar
            </button>
          </div>
        )}
      </div>

      {/* Top 5 Estadísticas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Desarrolladores */}
        <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-100">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            <span className="text-2xl">👨‍💻</span>
            Top 5 Desarrolladores
          </h3>
          <div className="space-y-3">
            {Object.entries(
              data.reduce((acc, curr) => {
                if (curr.desarrollador) {
                  acc[curr.desarrollador] = (acc[curr.desarrollador] || 0) + 1;
                }
                return acc;
              }, {} as Record<string, number>)
            )
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([dev, count], idx) => (
                <div
                  key={dev}
                  className="flex items-center justify-between bg-linear-to-r from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-linear-to-br from-purple-500 to-pink-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {idx + 1}
                    </div>
                    <span className="font-semibold text-gray-800">{dev}</span>
                  </div>
                  <span className="text-2xl font-bold text-purple-600">
                    {count}
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Top Campañas */}
        <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-100">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            <span className="text-2xl">🎯</span>
            Top 5 Campañas
          </h3>
          <div className="space-y-3">
            {Object.entries(
              data.reduce((acc, curr) => {
                if (curr.campana) {
                  acc[curr.campana] = (acc[curr.campana] || 0) + 1;
                }
                return acc;
              }, {} as Record<string, number>)
            )
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([campana, count], idx) => (
                <div
                  key={campana}
                  className="flex items-center justify-between bg-linear-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-linear-to-br from-blue-500 to-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {idx + 1}
                    </div>
                    <span className="font-semibold text-gray-800">
                      {campana}
                    </span>
                  </div>
                  <span className="text-2xl font-bold text-blue-600">
                    {count}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Tabla Completa de Datos */}
      <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            📋 Tabla Completa de Registros
          </h3>
          <button
            onClick={() => {
              const csv = [
                [
                  "Fecha Solicitud",
                  "Coordinador",
                  "Cliente",
                  "Segmento",
                  "Desarrollador",
                  "Segmento Menu",
                  "Desarrollo",
                  "Nombre",
                  "Cantidad",
                  "Fecha Material",
                  "Fecha Inicio",
                  "Fecha Fin",
                  "Estado",
                  "Observaciones",
                  "Campaña",
                ].join(","),
                ...filteredData.map((d) =>
                  [
                    d.fechaSolicitud,
                    d.coordinador,
                    d.cliente,
                    d.segmento,
                    d.desarrollador,
                    d.segmentoMenu,
                    d.desarrollo,
                    d.nombre,
                    d.cantidad,
                    d.fechaMaterial,
                    d.fechaInicio,
                    d.fechaFin,
                    d.estado,
                    d.observaciones,
                    d.campana,
                  ]
                    .map((val) => `"${val || ""}"`)
                    .join(",")
                ),
              ].join("\n");

              const blob = new Blob([csv], {
                type: "text/csv;charset=utf-8;",
              });
              const link = document.createElement("a");
              link.href = URL.createObjectURL(blob);
              link.download = `training_data_${
                new Date().toISOString().split("T")[0]
              }.csv`;
              link.click();
            }}
            className="px-4 py-2 bg-linear-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all shadow-md flex items-center gap-2"
          >
            📥 Exportar CSV
          </button>
        </div>

        <div className="overflow-x-auto rounded-lg border-2 border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-linear-to-r from-blue-500 to-indigo-600">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider sticky left-0 bg-blue-500">
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Fecha Solicitud
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Coordinador
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Segmento
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Desarrollador
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Segmento Menu
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Desarrollo
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Cantidad
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Fecha Material
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Fecha Inicio
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Fecha Fin
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Observaciones
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Campaña
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((record, idx) => (
                <tr key={idx} className="hover:bg-blue-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-bold text-gray-900 sticky left-0 bg-white">
                    {idx + 1}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                    {formatDate(record.fechaSolicitud)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                    {record.coordinador || "N/A"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                    {record.cliente || "N/A"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                    {record.segmento || "N/A"}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                    {record.desarrollador || "N/A"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                    {record.segmentoMenu || "N/A"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                    {record.desarrollo || "N/A"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
                    {record.nombre || "N/A"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 text-center">
                    {record.cantidad || "N/A"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                    {formatDate(record.fechaMaterial)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                    {formatDate(record.fechaInicio)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                    {formatDate(record.fechaFin)}
                  </td>
                  <td className="px-4 py-3 text-sm whitespace-nowrap">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                        record.estado?.toLowerCase().includes("completado")
                          ? "bg-linear-to-r from-green-400 to-green-600 text-white"
                          : record.estado?.toLowerCase().includes("curso")
                          ? "bg-linear-to-r from-yellow-400 to-orange-500 text-white"
                          : "bg-linear-to-r from-gray-400 to-gray-600 text-white"
                      }`}
                    >
                      {record.estado || "N/A"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
                    {record.observaciones || "N/A"}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                    {record.campana || "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-center text-sm text-gray-600">
          Mostrando{" "}
          <span className="font-bold text-blue-600">{filteredData.length}</span>{" "}
          de <span className="font-bold text-blue-600">{data.length}</span>{" "}
          registros
        </div>
      </div>
    </div>
  );
}
