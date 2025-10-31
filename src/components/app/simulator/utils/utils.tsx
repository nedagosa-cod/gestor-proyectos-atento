interface SheetCell {
  v: string | number | null;
  f?: string;
}

interface SheetRow {
  c: (SheetCell | null)[];
}

interface SheetColumn {
  label: string;
  type: string;
}

interface SheetData {
  table: {
    rows: SheetRow[];
    cols: SheetColumn[];
  };
}

// Tipo para los datos del Excel
export interface TrainingRecord {
  campana: string | null;
  coordinador: string | null;
  aplicativo: string | null;
  nombreProceso: string | null;
  estado: string | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  fechaReal: string | null;
  desarrollador: string | null;
  notas: string | null;
}

export interface FestivoRecord {
  festivo: string | null;
  festividad: string | null;
}

export const fetchGoogleSheetData = async (): Promise<TrainingRecord[]> => {
  try {
    // ID de tu Google Sheet
    const sheetId = "1iU_X2DpMN2wmPE0-V69NvATwQX7PE_q15IYMcj5EYXY";

    // Usar la API pública de Google Sheets (la hoja debe estar compartida públicamente)
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`;

    const response = await fetch(url);
    const text = await response.text();

    // Google retorna JSONP, necesitamos extraer el JSON
    const jsonString = text.match(
      /google\.visualization\.Query\.setResponse\(([\s\S\w]+)\);/
    );

    if (jsonString && jsonString[1]) {
      const data: SheetData = JSON.parse(jsonString[1]);
      console.log(jsonString[1]);
      // Extraer las filas y columnas
      const rows = data.table.rows;

      // Convertir a formato TrainingRecord
      const formattedData: TrainingRecord[] = rows
        .slice(0)
        .map((row: SheetRow) => {
          return {
            campana: row.c[0] ? String(row.c[0].v) : null,
            coordinador: row.c[1] ? String(row.c[1].v) : null,
            aplicativo: row.c[2] ? String(row.c[2].v) : null,
            nombreProceso: row.c[3] ? String(row.c[3].v) : null,
            estado: row.c[4] ? String(row.c[4].v) : null,
            fechaInicio: row.c[5] ? String(row.c[5].v) : null,
            fechaFin: row.c[6] ? String(row.c[6].v) : null,
            fechaReal: row.c[7] ? String(row.c[7].v) : null,
            desarrollador: row.c[8] ? String(row.c[8].v) : null,
            notas: row.c[9] ? String(row.c[9].v) : null,
          };
        });

      console.log("📊 Datos de Google Sheets:");
      console.log("Total de filas:", formattedData.length);
      console.table(formattedData);

      return formattedData;
    }

    return [];
  } catch (error) {
    console.error("Error al cargar datos de Google Sheets:", error);
    console.log(
      "Asegúrate de que la hoja esté compartida públicamente (cualquier persona con el enlace puede ver)"
    );
    return [];
  }
};

export const fetchSheetFestivosData = async (): Promise<FestivoRecord[]> => {
  try {
    const sheetId = "1iU_X2DpMN2wmPE0-V69NvATwQX7PE_q15IYMcj5EYXY";
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=DATA`;
    const response = await fetch(url);
    const text = await response.text();
    // Google retorna JSONP, necesitamos extraer el JSON
    const jsonString = text.match(
      /google\.visualization\.Query\.setResponse\(([\s\S\w]+)\);/
    );

    if (jsonString && jsonString[1]) {
      const data: SheetData = JSON.parse(jsonString[1]);
      console.log(jsonString[1]);
      // Extraer las filas y columnas
      const rows = data.table.rows;

      // Convertir a formato TrainingRecord
      const formattedData: FestivoRecord[] = rows
        .slice(0)
        .map((row: SheetRow) => {
          return {
            festivo: row.c[3] ? String(row.c[3].v) : null,
            festividad: row.c[4] ? String(row.c[4].v) : null,
          };
        });

      console.log("📊 Datos de Google Sheets:");
      console.log("Total de filas:", formattedData.length);
      console.table(formattedData);

      return formattedData;
    }

    return [];
  } catch (error) {
    console.error("Error al cargar datos de Google Sheets:", error);
    return [];
  }
};
