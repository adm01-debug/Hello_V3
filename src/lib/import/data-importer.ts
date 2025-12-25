export class DataImporter {
  async importCSV(file: File): Promise<any[]> {
    const text = await file.text();
    const lines = text.split('\n');
    return lines.map(l => ({ raw: l }));
  }
}

export const dataImporter = new DataImporter();
