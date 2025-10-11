declare module '@google-analytics/data' {
  export interface PropertyResource {
    name?: string;
  }

  export interface DimensionFilter {
    dimensionName?: string;
    stringFilter?: {
      matchType?: string;
      value?: string;
    };
  }

  export interface FilterExpression {
    filter?: DimensionFilter;
    andGroup?: {
      expressions?: FilterExpression[];
    };
    orGroup?: {
      expressions?: FilterExpression[];
    };
  }

  export interface Dimension {
    name?: string;
  }

  export interface Metric {
    name?: string;
  }

  export interface RunReportRequest {
    property?: string;
    dimensions?: Dimension[];
    metrics?: Metric[];
    dateRanges?: Array<{
      startDate?: string;
      endDate?: string;
    }>;
    dimensionFilter?: FilterExpression;
    metricFilter?: FilterExpression;
    orderBys?: Array<{
      dimension?: { dimensionName?: string };
      metric?: { metricName?: string };
      desc?: boolean;
    }>;
    limit?: number;
    offset?: number;
  }

  export interface RunReportResponse {
    dimensionHeaders?: Array<{ name?: string }>;
    metricHeaders?: Array<{ name?: string; type?: string }>;
    rows?: Array<{
      dimensionValues?: Array<{ value?: string }>;
      metricValues?: Array<{ value?: string }>;
    }>;
    rowCount?: number;
    metadata?: any;
  }

  export class BetaAnalyticsDataClient {
    constructor(options?: any);
    runReport(request: {
      property: string;
      [key: string]: any;
    }): Promise<[RunReportResponse]>;
    runRealtimeReport(request: {
      property: string;
      [key: string]: any;
    }): Promise<[RunReportResponse]>;
  }
}