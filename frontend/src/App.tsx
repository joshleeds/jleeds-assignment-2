import React, { useState } from 'react';
import { Scatter } from "react-chartjs-2";
import { Chart as ChartJS, LinearScale, PointElement, Tooltip, Legend } from "chart.js";

ChartJS.register(LinearScale, PointElement, Tooltip, Legend);

const generateRandomData = (numPoints) => {
  const data = [];
  for (let i = 0; i < numPoints; i++) {
    const x = Math.floor(Math.random() * 21) - 10; 
    const y = Math.floor(Math.random() * 21) - 10; 
    data.push({ x, y });
  }
  return data;
};


const initializeCentroids = (data, k, method) => {
  if (method === "Random") {
    return data.sort(() => Math.random() - 0.5).slice(0, k);
  } else if (method === "Farthest-First") {
    let centroids = [data[Math.floor(Math.random() * data.length)]];
    while (centroids.length < k) {
      const farthest = data.reduce((farthest, point) => {
        const minDist = Math.min(...centroids.map(c => Math.hypot(c.x - point.x, c.y - point.y)));
        return minDist > farthest.dist ? { point, dist: minDist } : farthest;
      }, { dist: -Infinity, point: null }).point;
      centroids.push(farthest);
    }
    return centroids;
  } else if (method === "KMeans++") {
    const centroids = [data[Math.floor(Math.random() * data.length)]];
    while (centroids.length < k) {
      const distances = data.map(point =>
        Math.min(...centroids.map(c => Math.hypot(c.x - point.x, c.y - point.y)))
      );
      const sumDist = distances.reduce((sum, dist) => sum + dist, 0);
      const random = Math.random() * sumDist;
      let cumSum = 0;
      for (let i = 0; i < data.length; i++) {
        cumSum += distances[i];
        if (cumSum >= random) {
          centroids.push(data[i]);
          break;
        }
      }
    }
    return centroids;
  } else if (method == "Manual"){
return [];
  }else {
    return [];
  }
};

// Simulate KMeans step
const simulateKMeansStep = (data, centroids) => {
  const newClusters = Array(centroids.length).fill().map(() => []);
  data.forEach(point => {
    const distances = centroids.map(c => Math.hypot(c.x - point.x, c.y - point.y));
    const closest = distances.indexOf(Math.min(...distances));
    newClusters[closest].push(point);
  });

  const newCentroids = centroids.map((centroid, i) => {
    if (newClusters[i].length === 0) return centroid;
    const avgX = newClusters[i].reduce((sum, p) => sum + p.x, 0) / newClusters[i].length;
    const avgY = newClusters[i].reduce((sum, p) => sum + p.y, 0) / newClusters[i].length;
    return { x: avgX, y: avgY };
  });

  return { centroids: newCentroids, clusters: newClusters };
};

const App: React.FC = () => {
  const [clusters, setClusters] = useState(3); // Default to 3 clusters
  const [initializationMethod, setInitializationMethod] = useState('Random');
  const [randomData, setRandomData] = useState(generateRandomData(100)); // Initial dataset
  const [centroids, setCentroids] = useState([]);
  const [clusteredData, setClusteredData] = useState([]); // Data grouped by clusters
  const [step, setStep] = useState(0); // Tracks the step of KMeans algorithm
  const [isConverged, setIsConverged] = useState(false);

  

  // Handle cluster input change
  const handleClusterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setClusters(Number(e.target.value));
  };

  // Handle method change
  const handleMethodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setInitializationMethod(e.target.value);
  };

  // Initialize clusters
  const handleInitializeClusters = () => {
    const initialCentroids = initializeCentroids(randomData, clusters, initializationMethod);
    setCentroids(initialCentroids);
    setClusteredData(Array(clusters.length).fill().map(() => [])); // Reset clusters
    setStep(0); // Reset steps
    setIsConverged(false); // Reset convergence
  };

  // Generate a new random dataset
  const handleGenerateNewDataset = () => {
    const newClusters = []; 
    const newCentroids = []; 
    setRandomData(generateRandomData(100)); // Reset data
    setStep(0); 
    setIsConverged(false); 
    setClusteredData(newClusters); 
    setCentroids(newCentroids); 
  };

  // Step through KMeans algorithm
  const handleStepThroughKMeans = () => {
    if (!isConverged && centroids.length) {
      const { centroids: newCentroids, clusters: newClusters } = simulateKMeansStep(randomData, centroids);
      const prevCentroids = centroids;
      setCentroids(newCentroids);
      if (step === 0) {
        setClusteredData(newClusters);
      }
      setStep(step + 1);
      if (JSON.stringify(prevCentroids) === JSON.stringify(newCentroids)) {
        setIsConverged(true); // Convergence when centroids stop moving
      }
    }
  };

  const handleRunToConvergence = () => {
    console.log("Starting KMeans until convergence...");
    let iterations = 0;
    while (!isConverged && iterations < 25) { //this is setting the maximum amount of iterations to 25 to prevent crashing
      handleStepThroughKMeans();
      iterations++;
    }
    if(centroids.length){
      setIsConverged(true)
    }
    
  };

  
  const handleResetAlgorithm = () => {
    setCentroids([]);
    setClusteredData([]);
    setStep(0);
    setIsConverged(false);
    setClusters(3); 
  };

  const chartData = {
    datasets: [
      {
        label: isConverged ? "Converged Data" : "Random Dataset",
        data: randomData,
        backgroundColor: isConverged ? "rgba(255, 99, 132, 0.6)" : "rgba(75, 192, 192, 0.6)",
      },
      ...(centroids.length ? [{
        label: 'Centroids',
        data: centroids,
        backgroundColor: 'rgba(255, 99, 132, 1)',
        pointRadius: 8,
      }] : []),
    ],
  };

  const options = {
    scales: {
      x: {
        type: "linear",
        position: "bottom",
        min: -10, 
        max: 10,
      },
      y: {
        min: -10, 
        max: 10,
      },
    },
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="bg-white p-10 rounded-lg shadow-lg max-w-sm w-full">
        <h1 className="text-2xl font-bold text-center mb-6 text-blue-600">KMeans Clustering Algorithm</h1>
        
        <div className="mb-4">
          <label htmlFor="clusters" className="block text-sm font-medium text-gray-700">Number of Clusters (k):</label>
          <input
            type="number"
            id="clusters"
            value={clusters}
            onChange={handleClusterChange}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="method" className="block text-sm font-medium text-gray-700">Initialization Method:</label>
          <select
            id="method"
            value={initializationMethod}
            onChange={handleMethodChange}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="Random">Random</option>
            <option value="Farthest-First">Farthest First</option>
            <option value="KMeans++">KMeans++</option>
            <option value="Manual">Manual</option>
          </select>
        </div>

        <div className="space-y-2 mb-6">
          <button
            onClick={handleInitializeClusters}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
          >
            Initialize Clusters
          </button>

          <button
            onClick={handleStepThroughKMeans}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
            disabled={isConverged}
          >
            Step through KMeans
          </button>

          <button
            onClick={handleRunToConvergence}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
            disabled={isConverged}
          >
            Run to Convergence
          </button>

          <button
            onClick={handleResetAlgorithm}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
          >
            Reset Algorithm
          </button>

          <button
            onClick={handleGenerateNewDataset}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
          >
            Generate New Dataset
          </button>
        </div>

        <div className="mb-4">
          {isConverged && <p className="text-sm text-green-600">Converged!</p>}
        </div>
      </div>
      <div className="w-1/2 p-10">
          <Scatter data={chartData} options={options} />
      </div>
    </div>
  );
};

export default App;