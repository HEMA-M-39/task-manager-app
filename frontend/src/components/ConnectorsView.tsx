import { useState, useEffect } from 'react';

export interface Connector {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  config: string | Record<string, any>;
  last_synced_at?: string;
  created_at: string;
  updated_at: string;
}

export function ConnectorsView() {
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal / Configure state
  const [selectedConnector, setSelectedConnector] = useState<Connector | null>(null);
  const [isConfigureOpen, setIsConfigureOpen] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [repoInput, setRepoInput] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);

  const fetchConnectors = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/connectors');
      if (!res.ok) throw new Error('Failed to load connectors');
      const data = await res.json();
      setConnectors(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error fetching connectors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnectors();
  }, []);

  const handleToggleEnable = async (connector: Connector) => {
    const newEnabled = !connector.enabled;
    try {
      let configObj = connector.config;
      if (typeof configObj === 'string') {
        try {
          configObj = JSON.parse(configObj);
        } catch {
          configObj = {};
        }
      }

      // If enabling GitHub for the first time and not configured, let's upsert or patch
      const res = await fetch(`/api/connectors/${connector.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newEnabled, config: configObj }),
      });

      if (!res.ok) {
        // If 404, maybe we need to upsert first
        if (res.status === 404) {
          const upsertRes = await fetch('/api/connectors', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: connector.id,
              name: connector.name,
              type: connector.type,
              enabled: newEnabled,
              config: configObj,
            }),
          });
          if (!upsertRes.ok) throw new Error('Failed to update connector status');
        } else {
          throw new Error('Failed to update connector status');
        }
      }

      await fetchConnectors();
    } catch (err: any) {
      alert(err.message || 'Failed to update connector');
    }
  };

  const handleOpenConfigure = (connector: Connector) => {
    setSelectedConnector(connector);
    let cfg: any = {};
    try {
      cfg = typeof connector.config === 'string' ? JSON.parse(connector.config) : (connector.config || {});
    } catch {
      cfg = {};
    }
    setTokenInput(cfg.token || '');
    setRepoInput(cfg.repository || cfg.repo || '');
    setTestResult(null);
    setSyncResult(null);
    setIsConfigureOpen(true);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConnector) return;

    try {
      const configObj = {
        token: tokenInput,
        repository: repoInput,
      };

      const res = await fetch('/api/connectors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedConnector.id,
          name: selectedConnector.name,
          type: selectedConnector.type,
          enabled: true,
          config: configObj,
        }),
      });

      if (!res.ok) throw new Error('Failed to save configuration');

      await fetchConnectors();
      setIsConfigureOpen(false);
      alert('GitHub connector configuration saved and enabled successfully!');
    } catch (err: any) {
      alert(err.message || 'Error saving configuration');
    }
  };

  const handleTestConnection = async () => {
    if (!selectedConnector) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(`/api/connectors/${selectedConnector.id}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: tokenInput,
          repository: repoInput,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Connection test failed');
      setTestResult({ success: true, message: data.message || 'Connection test successful!' });
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Connection test failed' });
    } finally {
      setTesting(false);
    }
  };

  const handleSyncNow = async () => {
    if (!selectedConnector) return;
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch(`/api/connectors/${selectedConnector.id}/sync`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Sync failed');
      setSyncResult(data);
      await fetchConnectors();
    } catch (err: any) {
      alert(err.message || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2.5 text-indigo-400 font-semibold text-sm mb-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Integrations & Connectors
          </div>
          <h2 className="text-3xl font-bold tracking-tight mb-2">Connect Your Workflow</h2>
          <p className="text-slate-300 max-w-2xl text-sm leading-relaxed">
            Link external services like GitHub to automatically sync repositories, issues, and pull requests directly into your TaskMaster dashboard.
          </p>
        </div>
      </div>

      {/* Connectors Grid / List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {connectors.map((connector) => {
            let configParsed: any = {};
            try {
              configParsed = typeof connector.config === 'string' ? JSON.parse(connector.config) : (connector.config || {});
            } catch {
              configParsed = {};
            }

            return (
              <div
                key={connector.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-xl shadow-md">
                        {connector.id === 'github' ? (
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                          </svg>
                        ) : (
                          <span>🔌</span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg text-slate-800">{connector.name}</h3>
                          <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full">
                            {connector.type}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">ID: {connector.id}</p>
                      </div>
                    </div>

                    {/* Enable Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleEnable(connector)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                        connector.enabled ? 'bg-indigo-600' : 'bg-slate-300'
                      }`}
                      role="switch"
                      aria-checked={connector.enabled}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          connector.enabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="space-y-2 text-sm text-slate-600 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Status:</span>
                      <span className={`font-semibold flex items-center gap-1.5 ${connector.enabled ? 'text-emerald-600' : 'text-slate-500'}`}>
                        <span className={`w-2 h-2 rounded-full ${connector.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                        {connector.enabled ? 'Active / Enabled' : 'Disabled'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Repository:</span>
                      <span className="font-mono text-slate-700 truncate max-w-[200px]">
                        {configParsed.repository || configParsed.repo || 'Not configured'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Last Synced:</span>
                      <span className="text-slate-700">
                        {connector.last_synced_at ? new Date(connector.last_synced_at).toLocaleString() : 'Never'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleOpenConfigure(connector)}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-medium py-2 px-4 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-xs"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Configure
                  </button>

                  <button
                    onClick={() => {
                      setSelectedConnector(connector);
                      handleOpenConfigure(connector);
                    }}
                    disabled={!connector.enabled}
                    className={`py-2 px-4 rounded-xl text-sm font-medium transition-colors border flex items-center justify-center gap-1.5 ${
                      connector.enabled
                        ? 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                        : 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Sync
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Configure Modal */}
      {isConfigureOpen && selectedConnector && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-slate-100 relative">
            <div className="flex items-center justify-between pb-6 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  ⚙️
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">Configure {selectedConnector.name}</h3>
                  <p className="text-xs text-slate-500">Manage authentication and synchronization parameters</p>
                </div>
              </div>
              <button
                onClick={() => setIsConfigureOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                  Personal Access Token (PAT)
                </label>
                <input
                  type="password"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-mono"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Requires repo scope or issues read/write permissions.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                  Repository (owner/repo)
                </label>
                <input
                  type="text"
                  value={repoInput}
                  onChange={(e) => setRepoInput(e.target.value)}
                  placeholder="octocat/Hello-World"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-mono"
                  required
                />
              </div>

              {testResult && (
                <div className={`p-4 rounded-xl text-xs font-medium flex items-center gap-2 ${
                  testResult.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  <span>{testResult.success ? '✓' : '✕'}</span>
                  <span>{testResult.message}</span>
                </div>
              )}

              {syncResult && (
                <div className="bg-indigo-50 border border-indigo-200 text-indigo-900 p-4 rounded-xl text-xs space-y-2">
                  <div className="font-bold flex items-center gap-1.5">
                    <span>🚀</span> {syncResult.message}
                  </div>
                  {syncResult.mock_data && (
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-indigo-200/60 font-mono text-center">
                      <div className="bg-white/80 p-1.5 rounded-lg">
                        <div className="text-[10px] text-slate-500">Repos</div>
                        <div className="font-bold">{syncResult.mock_data.repositories_scanned}</div>
                      </div>
                      <div className="bg-white/80 p-1.5 rounded-lg">
                        <div className="text-[10px] text-slate-500">Issues</div>
                        <div className="font-bold">{syncResult.mock_data.issues_imported}</div>
                      </div>
                      <div className="bg-white/80 p-1.5 rounded-lg">
                        <div className="text-[10px] text-slate-500">PRs</div>
                        <div className="font-bold">{syncResult.mock_data.pull_requests_checked}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testing || !tokenInput}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {testing ? 'Testing...' : 'Test Connection'}
                </button>

                <button
                  type="button"
                  onClick={handleSyncNow}
                  disabled={syncing}
                  className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {syncing ? 'Syncing...' : 'Sync Now'}
                </button>

                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-4 rounded-xl text-sm font-medium transition-colors shadow-sm"
                >
                  Save & Enable
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
