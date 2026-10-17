import React, { useState } from 'react';
import { SWAGGER_ENDPOINTS } from '../data/swaggerEndpoints';
import { SwaggerEndpoint } from '../../types/adminTypes';

export const SwaggerApiTab: React.FC = () => {
  const [selectedServer, setSelectedServer] = useState('https://api.dokansaleem.iq/v1');
  const [bearerToken, setBearerToken] = useState('Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dokan_admin_secret');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [expandedEndpoints, setExpandedEndpoints] = useState<{ [id: string]: boolean }>({
    'get-products': true,
    'post-order-cod': true,
  });
  const [tryItOutState, setTryItOutState] = useState<{ [id: string]: boolean }>({});
  const [requestBodies, setRequestBodies] = useState<{ [id: string]: string }>({
    'post-order-cod': JSON.stringify(SWAGGER_ENDPOINTS[1].requestBodySample, null, 2),
    'post-maintenance-booking': JSON.stringify(SWAGGER_ENDPOINTS[2].requestBodySample, null, 2),
    'post-sos-emergency-dispatch': JSON.stringify(SWAGGER_ENDPOINTS[4].requestBodySample, null, 2),
  });
  const [executionResults, setExecutionResults] = useState<{ [id: string]: { status: number; durationMs: number; data: any } }>({});
  const [executingId, setExecutingId] = useState<string | null>(null);

  const toggleEndpoint = (id: string) => {
    setExpandedEndpoints((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleExecute = (endpoint: SwaggerEndpoint) => {
    setExecutingId(endpoint.id);
    setTimeout(() => {
      const defaultStatus = endpoint.method === 'POST' ? 201 : 200;
      const responseSample = endpoint.responses[defaultStatus.toString()]?.sample || { message: 'OK' };
      setExecutionResults((prev) => ({
        ...prev,
        [endpoint.id]: {
          status: defaultStatus,
          durationMs: Math.floor(45 + Math.random() * 80),
          data: responseSample,
        },
      }));
      setExecutingId(null);
    }, 450);
  };

  const getMethodBadgeClass = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-blue-900/60 text-blue-300 border-blue-500/50';
      case 'POST':
        return 'bg-emerald-900/60 text-emerald-300 border-emerald-500/50';
      case 'PUT':
        return 'bg-amber-900/60 text-amber-300 border-amber-500/50';
      case 'DELETE':
        return 'bg-rose-900/60 text-rose-300 border-rose-500/50';
      default:
        return 'bg-gray-800 text-gray-300 border-gray-600';
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans" dir="ltr">
      {/* Swagger Hero Top Bar */}
      <div className="bg-[#0d0a0b] border border-[#332f30] rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded bg-[#2c690b] text-white text-[12px] font-bold font-mono">
              OAS 3.0.3
            </span>
            <h2 className="text-[1.5rem] font-bold text-white tracking-tight">
              Dokan Saleem Core Backend API
            </h2>
            <span className="text-[12px] bg-[#332f30] text-[#ffb68b] px-2 py-0.5 rounded font-mono">
              v1.4.2
            </span>
          </div>
          <p className="text-[0.875rem] text-[#c3c6d5] leading-relaxed">
            RESTful API services powering Dokan Saleem mobile apps, Baghdad workshop dispatch, COD checkout, and multi-hub warehouse sync.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex flex-col gap-1 w-full md:w-auto">
            <label className="text-[11px] text-[#c3c6d5] font-semibold">Active Base Server:</label>
            <select
              value={selectedServer}
              onChange={(e) => setSelectedServer(e.target.value)}
              className="h-10 px-3 bg-[#1e1b1c] text-white border border-[#332f30] rounded-lg text-[0.8125rem] font-mono outline-none focus:border-[#954500]"
            >
              <option value="https://api.dokansaleem.iq/v1">https://api.dokansaleem.iq/v1 (Prod - Baghdad Cloud Run)</option>
              <option value="https://staging.dokansaleem.iq/v1">https://staging.dokansaleem.iq/v1 (Staging)</option>
              <option value="http://localhost:8080/v1">http://localhost:8080/v1 (Local Docker)</option>
            </select>
          </div>

          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="h-10 px-4 mt-4 md:mt-0 bg-[#2c690b] hover:bg-[#1d5200] text-white font-bold text-[0.8125rem] rounded-lg flex items-center gap-1.5 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">lock</span>
            <span>Authorize</span>
          </button>
        </div>
      </div>

      {/* Endpoints List */}
      <div className="space-y-4">
        {SWAGGER_ENDPOINTS.map((endpoint) => {
          const isExpanded = !!expandedEndpoints[endpoint.id];
          const isTrying = !!tryItOutState[endpoint.id];
          const result = executionResults[endpoint.id];

          return (
            <div
              key={endpoint.id}
              className="bg-[#0d0a0b] border border-[#332f30] rounded-xl overflow-hidden shadow-sm transition-all"
            >
              {/* Endpoint Header Bar */}
              <div
                onClick={() => toggleEndpoint(endpoint.id)}
                className={`p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer hover:bg-[#1e1b1c] transition-colors border-l-4 ${
                  endpoint.method === 'GET'
                    ? 'border-l-blue-500'
                    : endpoint.method === 'POST'
                    ? 'border-l-emerald-500'
                    : 'border-l-amber-500'
                }`}
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <span
                    className={`font-mono font-bold text-[13px] px-3 py-1 rounded border ${getMethodBadgeClass(
                      endpoint.method
                    )}`}
                  >
                    {endpoint.method}
                  </span>
                  <span className="font-mono font-bold text-[0.9375rem] text-white">
                    {endpoint.path}
                  </span>
                  <span className="text-[0.8125rem] text-[#c3c6d5] hidden md:inline">
                    — {endpoint.summary}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] bg-[#1e1b1c] text-[#ffb68b] px-2 py-0.5 rounded font-mono border border-[#332f30]">
                    {endpoint.tag}
                  </span>
                  <span className="material-symbols-outlined text-[#c3c6d5] text-[20px] transition-transform">
                    {isExpanded ? 'expand_less' : 'expand_more'}
                  </span>
                </div>
              </div>

              {/* Endpoint Expanded Details */}
              {isExpanded && (
                <div className="p-5 border-t border-[#332f30] bg-[#121013] space-y-5">
                  <div className="flex items-center justify-between">
                    <p className="text-[0.875rem] text-[#dfe2f1]">{endpoint.summary}</p>
                    <button
                      onClick={() =>
                        setTryItOutState((prev) => ({ ...prev, [endpoint.id]: !prev[endpoint.id] }))
                      }
                      className={`px-3 py-1.5 rounded-lg text-[0.75rem] font-bold border transition-colors ${
                        isTrying
                          ? 'bg-rose-900/40 text-rose-300 border-rose-600'
                          : 'bg-[#1e1b1c] text-[#aff589] border-[#2c690b] hover:bg-[#2c690b]/20'
                      }`}
                    >
                      {isTrying ? 'Cancel' : 'Try it out'}
                    </button>
                  </div>

                  {/* Parameters (if any) */}
                  {endpoint.parameters && endpoint.parameters.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-bold text-[0.8125rem] text-[#c3c6d5] uppercase tracking-wider">
                        Parameters
                      </h4>
                      <div className="overflow-x-auto rounded-lg border border-[#332f30]">
                        <table className="w-full text-left text-[0.8125rem]">
                          <thead className="bg-[#1e1b1c] text-[#c3c6d5] font-mono text-[11px]">
                            <tr>
                              <th className="p-2.5">Name</th>
                              <th className="p-2.5">In</th>
                              <th className="p-2.5">Type</th>
                              <th className="p-2.5">Description</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#332f30] text-[#dfe2f1]">
                            {endpoint.parameters.map((param, i) => (
                              <tr key={i}>
                                <td className="p-2.5 font-mono font-bold text-white">
                                  {param.name} {param.required && <span className="text-rose-400">*</span>}
                                </td>
                                <td className="p-2.5 font-mono text-[11px] text-[#ffb68b]">{param.in}</td>
                                <td className="p-2.5 font-mono text-[11px] text-[#aff589]">{param.type}</td>
                                <td className="p-2.5">{param.description}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Request Body Editor (for POST/PUT) */}
                  {endpoint.requestBodySample && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-[0.8125rem] text-[#c3c6d5] uppercase tracking-wider">
                          Request Body (application/json)
                        </h4>
                        <span className="text-[11px] text-[#ffb68b] font-mono">Editable</span>
                      </div>
                      <textarea
                        readOnly={!isTrying}
                        value={requestBodies[endpoint.id] || ''}
                        onChange={(e) =>
                          setRequestBodies((prev) => ({ ...prev, [endpoint.id]: e.target.value }))
                        }
                        rows={7}
                        className={`w-full p-3 rounded-lg font-mono text-[12px] bg-[#0d0a0b] text-[#aff589] border ${
                          isTrying ? 'border-[#ffb68b] focus:ring-1 focus:ring-[#ffb68b]' : 'border-[#332f30]'
                        } outline-none`}
                      />
                    </div>
                  )}

                  {/* Execute Button */}
                  {isTrying && (
                    <div className="pt-2">
                      <button
                        onClick={() => handleExecute(endpoint)}
                        disabled={executingId === endpoint.id}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-[0.875rem] flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99]"
                      >
                        {executingId === endpoint.id ? (
                          <>
                            <span className="animate-spin material-symbols-outlined text-[18px]">sync</span>
                            <span>Sending request to Baghdad Cloud Run gateway...</span>
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-[18px]">send</span>
                            <span>Execute</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Live Execution Output & Responses */}
                  {result && (
                    <div className="p-4 rounded-xl bg-[#0d0a0b] border border-[#2c690b]/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[#aff589] text-[20px]">
                            check_circle
                          </span>
                          <span className="font-bold text-white text-[0.875rem]">Server Response</span>
                        </div>
                        <div className="flex items-center gap-3 font-mono text-[12px]">
                          <span className="text-[#aff589] font-bold bg-[#2c690b]/30 px-2 py-0.5 rounded">
                            HTTP {result.status}
                          </span>
                          <span className="text-[#c3c6d5]">{result.durationMs}ms</span>
                        </div>
                      </div>

                      {/* Curl preview */}
                      <div className="space-y-1">
                        <span className="text-[11px] text-[#c3c6d5] font-mono">cURL Command:</span>
                        <div className="p-2.5 rounded bg-[#1e1b1c] font-mono text-[11px] text-[#ffb68b] overflow-x-auto whitespace-pre">
                          curl -X {endpoint.method} "{selectedServer}{endpoint.path}" \<br />
                          &nbsp;&nbsp;-H "Authorization: {bearerToken}" \<br />
                          &nbsp;&nbsp;-H "Content-Type: application/json"
                          {endpoint.requestBodySample && ' \\\n  -d \'' + JSON.stringify(endpoint.requestBodySample) + '\''}
                        </div>
                      </div>

                      {/* Response Body JSON */}
                      <div className="space-y-1">
                        <span className="text-[11px] text-[#c3c6d5] font-mono">Response Payload:</span>
                        <pre className="p-3 rounded bg-[#1e1b1c] text-[#aff589] font-mono text-[12px] overflow-x-auto border border-[#332f30] max-h-64">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Auth Modal Simulation */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0d0a0b] border border-[#332f30] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#332f30] pb-3">
              <h3 className="font-bold text-white text-[1.125rem]">Authorize with Bearer JWT</h3>
              <button
                onClick={() => setIsAuthModalOpen(false)}
                className="text-[#c3c6d5] hover:text-white"
              >
                ✕
              </button>
            </div>
            <p className="text-[0.8125rem] text-[#c3c6d5]">
              Provide an administrative access token for Dokan Saleem backend gateway services:
            </p>
            <div className="space-y-1">
              <label className="text-[11px] text-[#c3c6d5] font-mono">Bearer Token Value:</label>
              <textarea
                value={bearerToken}
                onChange={(e) => setBearerToken(e.target.value)}
                rows={3}
                className="w-full p-2.5 bg-[#1e1b1c] text-white border border-[#332f30] rounded-lg font-mono text-[12px] outline-none focus:border-[#954500]"
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setIsAuthModalOpen(false)}
                className="px-4 py-2 bg-[#2c690b] text-white rounded-lg font-bold text-[0.8125rem]"
              >
                Save & Authorize
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
