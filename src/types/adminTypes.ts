export interface SwaggerEndpoint {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  summary: string;
  tag: string;
  parameters?: { name: string; in: 'query' | 'path' | 'body'; required: boolean; type: string; description: string }[];
  requestBodySample?: object;
  responses: {
    [statusCode: string]: {
      description: string;
      sample: object;
    };
  };
}

export interface FlutterAppModule {
  id: string;
  name: string;
  packageName: string;
  version: string;
  buildNumber: number;
  flutterVersion: string;
  targetPlatform: string;
  activeUsersBaghdad: number;
  crashFreeRate: string;
  status: 'production' | 'beta' | 'building';
  description: string;
  lastRelease: string;
}

export interface GrafanaMetric {
  title: string;
  value: string | number;
  unit?: string;
  change?: string;
  status: 'normal' | 'warning' | 'critical';
  graphData: number[];
}
