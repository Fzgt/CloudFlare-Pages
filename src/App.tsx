import './App.css';
import { useEffect, useState } from 'react';

interface WorkerData {
  timestamp: number;
  randomData: number;
  message: string;
  memory: string;
}

function App() {

  const [data, setData] = useState<WorkerData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('https://data-api.fzgt320.workers.dev/');
        const result = await response.json();
        setData(result);
        // 保存到 localStorage 作为备份
        localStorage.setItem('lastData', JSON.stringify(result));
      } catch (error) {
        // 如果请求失败，尝试从 localStorage 读取
        const cachedData = localStorage.getItem('lastData');
        if (cachedData) {
          setData(JSON.parse(cachedData));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // 每3分钟更新一次数据
    const interval = setInterval(fetchData, 180000);
    return () => clearInterval(interval);
  }, []);


  return (
    <div className="App">
      <header className="App-header">
        {loading ? (
          <p>Loading...</p>
        ) : data ? (
          <div>
            <h1>Worker Data</h1>
            <p>Timestamp: {new Date(data.timestamp).toLocaleString()}</p>
            <p>Random Data: {data.randomData.toFixed(2)}</p>
            <p>Message: {data.message}</p>
            <p>Milestone: {data.memory}</p>
          </div>
        ) : (
          <p>No data available</p>
        )}
      </header>
    </div>
  );
}

export default App;
