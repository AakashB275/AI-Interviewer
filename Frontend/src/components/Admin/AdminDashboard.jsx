import React, { useEffect, useState } from 'react';

export default function AdminDashboard(){
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(()=>{
    const fetchStats = async ()=>{
      setLoading(true);
      try{
        const res = await fetch('/api/analytics/platform', { credentials: 'include' });
        if (!res.ok) {
          const d = await res.json().catch(()=>({}));
          throw new Error(d.error || 'Failed to load platform stats');
        }
        const data = await res.json();
        if (data.success) setStats(data);
        else throw new Error(data.error || 'Failed to load platform stats');
      }catch(err){
        setError(err.message);
      }finally{setLoading(false);}    };
    fetchStats();
  },[]);

  if (loading) return (<div className="p-6 bg-white rounded-lg shadow">Loading platform stats...</div>);
  if (error) return (<div className="p-6 bg-white rounded-lg shadow text-red-600">{error}</div>);

  return (
    <div className="p-6 bg-white rounded-2xl shadow">
      <h2 className="text-2xl font-bold mb-4">Platform Analytics</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border rounded-lg">
          <p className="text-sm text-gray-500">Total Users</p>
          <p className="text-3xl font-bold">{stats.totalUsers}</p>
        </div>
        <div className="p-4 border rounded-lg">
          <p className="text-sm text-gray-500">Total Sessions</p>
          <p className="text-3xl font-bold">{stats.totalSessions}</p>
        </div>
        <div className="p-4 border rounded-lg">
          <p className="text-sm text-gray-500">Total Evaluations</p>
          <p className="text-3xl font-bold">{stats.totalEvaluations}</p>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-3">Aggregate Scores</h3>
        {stats.aggregates && Object.keys(stats.aggregates.averages || {}).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {Object.entries(stats.aggregates.averages).map(([k,v])=> (
              <div key={k} className="p-3 border rounded-lg">
                <div className="text-sm text-gray-600 capitalize">{k.replace(/([A-Z])/g,' $1').trim()}</div>
                <div className="text-2xl font-bold">{(Number(v) * 10).toFixed(1)}%</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-500">No evaluation data yet</div>
        )}
      </div>
    </div>
  );
}
