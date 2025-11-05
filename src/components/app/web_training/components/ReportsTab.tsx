import { useState } from "react";
import { format, parseISO, startOfYear, endOfYear, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import type { TrainingRecord } from "../utils/utils";

type ReportPeriod =
  | "monthly"
  | "bimonthly"
  | "quarterly"
  | "semiannual"
  | "annual";

interface ReportsTabProps {
  data: TrainingRecord[];
}

export default function ReportsTab({ data }: ReportsTabProps) {
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>("monthly");
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);

  // Función para formatear fechas
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

  // Función para obtener el rango de fechas según el período
  const getDateRange = (
    period: ReportPeriod,
    year: number,
    month?: number
  ): { start: Date; end: Date; label: string } => {
    switch (period) {
      case "monthly": {
        const monthStart = new Date(year, (month || 1) - 1, 1);
        const monthEnd = endOfMonth(monthStart);
        return {
          start: monthStart,
          end: monthEnd,
          label: format(monthStart, "MMMM yyyy", { locale: es }),
        };
      }

      case "bimonthly": {
        const bimonthStart = new Date(year, ((month || 1) - 1) * 2, 1);
        const bimonthEnd = endOfMonth(
          new Date(year, ((month || 1) - 1) * 2 + 1, 1)
        );
        return {
          start: bimonthStart,
          end: bimonthEnd,
          label: `${format(bimonthStart, "MMM", { locale: es })} - ${format(
            bimonthEnd,
            "MMM yyyy",
            { locale: es }
          )}`,
        };
      }

      case "quarterly": {
        const quarterStart = new Date(year, ((month || 1) - 1) * 3, 1);
        const quarterEnd = endOfMonth(
          new Date(year, ((month || 1) - 1) * 3 + 2, 1)
        );
        return {
          start: quarterStart,
          end: quarterEnd,
          label: `Q${month} ${year}`,
        };
      }

      case "semiannual": {
        const semiStart = new Date(year, (month || 1) === 1 ? 0 : 6, 1);
        const semiEnd = endOfMonth(
          new Date(year, (month || 1) === 1 ? 5 : 11, 1)
        );
        return {
          start: semiStart,
          end: semiEnd,
          label: `${
            (month || 1) === 1 ? "Primer" : "Segundo"
          } Semestre ${year}`,
        };
      }

      case "annual":
        return {
          start: startOfYear(new Date(year, 0, 1)),
          end: endOfYear(new Date(year, 0, 1)),
          label: `Año ${year}`,
        };

      default:
        return {
          start: new Date(),
          end: new Date(),
          label: "",
        };
    }
  };

  // Función para filtrar datos por rango de fechas
  const filterDataByDateRange = (
    startDate: Date,
    endDate: Date
  ): TrainingRecord[] => {
    return data.filter((record) => {
      if (!record.fechaInicio || !record.fechaFin) return false;

      try {
        let recordStart: Date;
        let recordEnd: Date;

        // Parse fecha inicio
        if (record.fechaInicio.includes("Date(")) {
          const startMatch = record.fechaInicio.match(
            /Date\((\d+),(\d+),(\d+)\)/
          );
          if (startMatch) {
            recordStart = new Date(
              parseInt(startMatch[1]),
              parseInt(startMatch[2]),
              parseInt(startMatch[3])
            );
          } else {
            return false;
          }
        } else {
          recordStart = parseISO(record.fechaInicio);
        }

        // Parse fecha fin
        if (record.fechaFin.includes("Date(")) {
          const endMatch = record.fechaFin.match(/Date\((\d+),(\d+),(\d+)\)/);
          if (endMatch) {
            recordEnd = new Date(
              parseInt(endMatch[1]),
              parseInt(endMatch[2]),
              parseInt(endMatch[3])
            );
          } else {
            return false;
          }
        } else {
          recordEnd = parseISO(record.fechaFin);
        }

        // Check if record overlaps with date range
        return (
          (recordStart >= startDate && recordStart <= endDate) ||
          (recordEnd >= startDate && recordEnd <= endDate) ||
          (recordStart <= startDate && recordEnd >= endDate)
        );
      } catch (error) {
        console.error("Error filtrando por fecha:", error);
        return false;
      }
    });
  };

  const dateRange = getDateRange(reportPeriod, reportYear, reportMonth);
  const periodData = filterDataByDateRange(dateRange.start, dateRange.end);

  return (
    <div className="min-h-screen space-y-6">
      {/* Selector de Período y Filtros */}
      <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-100">
        <h2 className="text-3xl font-bold mb-6 bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
          📈 Generador de Reportes
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Selector de Tipo de Reporte */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tipo de Reporte
            </label>
            <select
              value={reportPeriod}
              onChange={(e) => setReportPeriod(e.target.value as ReportPeriod)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-semibold"
            >
              <option value="monthly">📅 Mensual</option>
              <option value="bimonthly">📊 Bimestral</option>
              <option value="quarterly">📈 Trimestral</option>
              <option value="semiannual">📉 Semestral</option>
              <option value="annual">🗓️ Anual</option>
            </select>
          </div>

          {/* Selector de Año */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Año
            </label>
            <select
              value={reportYear}
              onChange={(e) => setReportYear(parseInt(e.target.value))}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-semibold"
            >
              {Array.from(
                { length: 5 },
                (_, i) => new Date().getFullYear() - i
              ).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Selector de Período específico */}
          {reportPeriod === "monthly" && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Mes
              </label>
              <select
                value={reportMonth}
                onChange={(e) => setReportMonth(parseInt(e.target.value))}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-semibold"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                  <option key={month} value={month}>
                    {format(new Date(2024, month - 1, 1), "MMMM", {
                      locale: es,
                    })}
                  </option>
                ))}
              </select>
            </div>
          )}

          {reportPeriod === "bimonthly" && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Bimestre
              </label>
              <select
                value={reportMonth}
                onChange={(e) => setReportMonth(parseInt(e.target.value))}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-semibold"
              >
                <option value="1">Ene-Feb</option>
                <option value="2">Mar-Abr</option>
                <option value="3">May-Jun</option>
                <option value="4">Jul-Ago</option>
                <option value="5">Sep-Oct</option>
                <option value="6">Nov-Dic</option>
              </select>
            </div>
          )}

          {reportPeriod === "quarterly" && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Trimestre
              </label>
              <select
                value={reportMonth}
                onChange={(e) => setReportMonth(parseInt(e.target.value))}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-semibold"
              >
                <option value="1">Q1 (Ene-Mar)</option>
                <option value="2">Q2 (Abr-Jun)</option>
                <option value="3">Q3 (Jul-Sep)</option>
                <option value="4">Q4 (Oct-Dic)</option>
              </select>
            </div>
          )}

          {reportPeriod === "semiannual" && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Semestre
              </label>
              <select
                value={reportMonth}
                onChange={(e) => setReportMonth(parseInt(e.target.value))}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-semibold"
              >
                <option value="1">Primer Semestre (Ene-Jun)</option>
                <option value="2">Segundo Semestre (Jul-Dic)</option>
              </select>
            </div>
          )}

          {/* Botón de Exportar */}
          <div className="flex items-end">
            <button
              onClick={() => {
                const csv = [
                  [
                    "REPORTE " + dateRange.label.toUpperCase(),
                    "",
                    "",
                    "",
                    "",
                  ].join(","),
                  [
                    "Generado el: " +
                      format(new Date(), "dd/MM/yyyy HH:mm", {
                        locale: es,
                      }),
                  ].join(","),
                  [""],
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
                  ...periodData.map((d) =>
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

                const blob = new Blob(["\ufeff" + csv], {
                  type: "text/csv;charset=utf-8;",
                });
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = `reporte_${reportPeriod}_${reportYear}_${reportMonth}_${
                  new Date().toISOString().split("T")[0]
                }.csv`;
                link.click();
              }}
              className="w-full px-6 py-3 bg-linear-to-r from-green-500 to-green-600 text-white rounded-lg font-bold hover:from-green-600 hover:to-green-700 transition-all shadow-lg transform hover:scale-105 flex items-center justify-center gap-2"
            >
              📥 Exportar Reporte
            </button>
          </div>
        </div>

        {/* Información del período */}
        <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
          <p className="text-center">
            <span className="text-sm text-blue-700 font-semibold">
              Mostrando reporte de:
            </span>
            <span className="text-lg font-bold text-blue-900 ml-2">
              {dateRange.label}
            </span>
            <span className="text-sm text-blue-700 ml-4">
              ({format(dateRange.start, "dd/MM/yyyy")} -{" "}
              {format(dateRange.end, "dd/MM/yyyy")})
            </span>
          </p>
        </div>
      </div>

      {/* Estadísticas del Período */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-linear-to-br from-blue-500 to-blue-600 rounded-xl p-6 shadow-lg transform hover:scale-105 transition-all">
          <div className="flex flex-col items-center">
            <div className="text-5xl mb-3">📊</div>
            <p className="text-blue-100 text-xs font-semibold mb-1 uppercase tracking-wide">
              Total Registros
            </p>
            <p className="text-4xl font-bold text-white">{periodData.length}</p>
          </div>
        </div>

        <div className="bg-linear-to-br from-green-500 to-green-600 rounded-xl p-6 shadow-lg transform hover:scale-105 transition-all">
          <div className="flex flex-col items-center">
            <div className="text-5xl mb-3">✅</div>
            <p className="text-green-100 text-xs font-semibold mb-1 uppercase tracking-wide">
              Completados
            </p>
            <p className="text-4xl font-bold text-white">
              {
                periodData.filter((d) =>
                  d.estado?.toLowerCase().includes("completado")
                ).length
              }
            </p>
          </div>
        </div>

        <div className="bg-linear-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 shadow-lg transform hover:scale-105 transition-all">
          <div className="flex flex-col items-center">
            <div className="text-5xl mb-3">⏳</div>
            <p className="text-yellow-100 text-xs font-semibold mb-1 uppercase tracking-wide">
              En Curso
            </p>
            <p className="text-4xl font-bold text-white">
              {
                periodData.filter((d) =>
                  d.estado?.toLowerCase().includes("curso")
                ).length
              }
            </p>
          </div>
        </div>

        <div className="bg-linear-to-br from-purple-500 to-purple-600 rounded-xl p-6 shadow-lg transform hover:scale-105 transition-all">
          <div className="flex flex-col items-center">
            <div className="text-5xl mb-3">🎯</div>
            <p className="text-purple-100 text-xs font-semibold mb-1 uppercase tracking-wide">
              Campañas
            </p>
            <p className="text-4xl font-bold text-white">
              {new Set(periodData.map((d) => d.campana).filter(Boolean)).size}
            </p>
          </div>
        </div>

        <div className="bg-linear-to-br from-pink-500 to-pink-600 rounded-xl p-6 shadow-lg transform hover:scale-105 transition-all">
          <div className="flex flex-col items-center">
            <div className="text-5xl mb-3">👨‍💻</div>
            <p className="text-pink-100 text-xs font-semibold mb-1 uppercase tracking-wide">
              Desarrolladores
            </p>
            <p className="text-4xl font-bold text-white">
              {
                new Set(periodData.map((d) => d.desarrollador).filter(Boolean))
                  .size
              }
            </p>
          </div>
        </div>
      </div>

      {/* Análisis Detallado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Campañas del Período */}
        <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-100">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            <span className="text-2xl">🏆</span>
            Top Campañas del Período
          </h3>
          <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
            {Object.entries(
              periodData.reduce((acc, curr) => {
                if (curr.campana) {
                  acc[curr.campana] = (acc[curr.campana] || 0) + 1;
                }
                return acc;
              }, {} as Record<string, number>)
            )
              .sort(([, a], [, b]) => b - a)
              .slice(0, 10)
              .map(([campana, count], idx) => (
                <div
                  key={campana}
                  className="flex items-center justify-between bg-linear-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-indigo-600 text-white rounded-full flex items-center justify-center font-bold shadow-lg">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <span className="font-bold text-gray-800 block">
                        {campana}
                      </span>
                      <span className="text-xs text-gray-600">
                        {
                          new Set(
                            periodData
                              .filter((d) => d.campana === campana)
                              .map((d) => d.desarrollador)
                          ).size
                        }{" "}
                        desarrollador(es)
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-blue-600 block">
                      {count}
                    </span>
                    <span className="text-xs text-gray-500">
                      proceso{count !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              ))}
            {Object.keys(
              periodData.reduce((acc, curr) => {
                if (curr.campana) acc[curr.campana] = 1;
                return acc;
              }, {} as Record<string, number>)
            ).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No hay datos para este período
              </div>
            )}
          </div>
        </div>

        {/* Top Desarrolladores del Período */}
        <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-100">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            <span className="text-2xl">👨‍💻</span>
            Top Desarrolladores del Período
          </h3>
          <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
            {Object.entries(
              periodData.reduce((acc, curr) => {
                if (curr.desarrollador) {
                  acc[curr.desarrollador] = (acc[curr.desarrollador] || 0) + 1;
                }
                return acc;
              }, {} as Record<string, number>)
            )
              .sort(([, a], [, b]) => b - a)
              .slice(0, 10)
              .map(([dev, count], idx) => (
                <div
                  key={dev}
                  className="flex items-center justify-between bg-linear-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-100 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 bg-linear-to-br from-purple-500 to-pink-600 text-white rounded-full flex items-center justify-center font-bold shadow-lg">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <span className="font-bold text-gray-800 block">
                        {dev}
                      </span>
                      <span className="text-xs text-gray-600">
                        {
                          new Set(
                            periodData
                              .filter((d) => d.desarrollador === dev)
                              .map((d) => d.campana)
                          ).size
                        }{" "}
                        campaña(s)
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-purple-600 block">
                      {count}
                    </span>
                    <span className="text-xs text-gray-500">
                      proceso{count !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              ))}
            {Object.keys(
              periodData.reduce((acc, curr) => {
                if (curr.desarrollador) acc[curr.desarrollador] = 1;
                return acc;
              }, {} as Record<string, number>)
            ).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No hay datos para este período
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Resumen por Cliente */}
      <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-100">
        <h3 className="text-2xl font-bold mb-4 flex items-center gap-2 bg-linear-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
          <span className="text-2xl">🏢</span>
          Resumen por Cliente
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(
            periodData.reduce((acc, curr) => {
              if (curr.cliente) {
                acc[curr.cliente] = (acc[curr.cliente] || 0) + 1;
              }
              return acc;
            }, {} as Record<string, number>)
          )
            .sort(([, a], [, b]) => b - a)
            .map(([cliente, count]) => (
              <div
                key={cliente}
                className="bg-linear-to-br from-orange-50 to-red-50 rounded-lg p-4 border-2 border-orange-200 hover:shadow-lg transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-bold text-orange-900 text-sm">
                      {cliente}
                    </p>
                    <p className="text-xs text-orange-700 mt-1">
                      {
                        new Set(
                          periodData
                            .filter((d) => d.cliente === cliente)
                            .map((d) => d.campana)
                        ).size
                      }{" "}
                      campaña(s)
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-orange-600">
                      {count}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          {Object.keys(
            periodData.reduce((acc, curr) => {
              if (curr.cliente) acc[curr.cliente] = 1;
              return acc;
            }, {} as Record<string, number>)
          ).length === 0 && (
            <div className="col-span-full text-center py-8 text-gray-500">
              No hay datos para este período
            </div>
          )}
        </div>
      </div>

      {/* Tabla Detallada del Período */}
      <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            📋 Detalle Completo - {dateRange.label}
          </h3>
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
                  Cliente
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Campaña
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Desarrollador
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Nombre
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
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {periodData.map((record, idx) => (
                <tr key={idx} className="hover:bg-blue-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-bold text-gray-900 sticky left-0 bg-white">
                    {idx + 1}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                    {formatDate(record.fechaSolicitud)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                    {record.cliente || "N/A"}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                    {record.campana || "N/A"}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                    {record.desarrollador || "N/A"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
                    {record.nombre || "N/A"}
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-center text-sm text-gray-600">
          Mostrando{" "}
          <span className="font-bold text-blue-600">{periodData.length}</span>{" "}
          registros para el período seleccionado
        </div>
      </div>
    </div>
  );
}
