export class ImportExcelResult {
  /**
   * Indica si la transformación fue exitosa.
   */
  success: boolean;

  /**
   * Archivo Excel generado listo para importar.
   */
  excelBuffer?: Buffer;

  /**
   * Nombre sugerido para descargar el archivo.
   */
  fileName?: string;

  /**
   * Tipo MIME del archivo generado.
   */
  contentType: string =
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  /**
   * Advertencias encontradas durante el análisis.
   */
  warnings: string[] = [];

  /**
   * Errores que impidieron la generación del Excel.
   */
  errors: string[] = [];

  /**
   * Información adicional del análisis.
   */
  metadata?: {
    provider?: string;
    model?: string;
    processingTimeMs?: number;
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    estimatedCost?: number;
  };

  static success(
    excelBuffer: Buffer,
    fileName: string,
    metadata?: ImportExcelResult['metadata'],
    warnings: string[] = [],
  ): ImportExcelResult {
    return {
      success: true,
      excelBuffer,
      fileName,
      warnings,
      errors: [],
      contentType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      metadata,
    };
  }

  static failed(errors: string[]): ImportExcelResult {
    return {
      success: false,
      errors,
      warnings: [],
      contentType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }
}