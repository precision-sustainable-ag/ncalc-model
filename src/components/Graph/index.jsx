/* eslint-disable no-eval */

import React, { useEffect, useState } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import './styles.scss';

const API = 'https://developapi.covercrop-ncalc.org';
// const API = 'http://localhost';

const convertToObject = (d) => {
  try {
    return d.FOM.map((_, i) => {
      const o = {};
      Object.keys(d).forEach((key) => { o[key] = d[key][i]; });
      return o;
    });
  } catch (ee) {
    // console.log('already object');
    return d;
  }
};

const dailyAverage = (date, arr, parm) => {
  let total = 0;
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    if (i > 0 && i % 24 === 0) {
      result.push({
        x: +date,
        y: +(total / 24).toFixed(2),
      });
      date.setDate(date.getDate() + 1);
      total = 0;
    } else {
      total += arr[i][parm];
    }
  }
  return result;
}; // dailyAverage

const dailyTotal = (date, arr, parm) => {
  let total = 0;
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    if (i > 0 && i % 24 === 0) {
      result.push({
        x: +date,
        y: +total.toFixed(2),
      });
      date.setDate(date.getDate() + 1);
      total = 0;
    } else {
      total += arr[i][parm];
    }
  }
  return result;
}; // dailyTotal

const WeatherGraph = ({ sdatanew }) => {
  const series = [
    {
      name: 'Rainfall',
      data: dailyTotal(new Date(sdatanew[0].Date), sdatanew, 'Rain'),
      animation: false,
      color: 'green',
      type: 'column',
    },
    {
      name: 'Air temperature',
      data: dailyAverage(new Date(sdatanew[0].Date), sdatanew, 'Temp'),
      animation: false,
      color: 'blue',
    },
    {
      name: 'Relative humidity',
      data: dailyAverage(new Date(sdatanew[0].Date), sdatanew, 'RH'),
      animation: false,
      color: 'brown',
      yAxis: 1,
    },
  ];

  const options = {
    chart: {
      type: 'line',
      animation: false,
    },
    title: {
      text: 'Weather',
    },
    xAxis: {
      type: 'datetime',
    },
    yAxis: [
      {
        title: {
          text: 'Rainfall (mm)',
        },
      },
      {
        title: {
          text: 'Air temperature (&deg;C)',
        },
      },
      {
        title: {
          text: 'Relative humidity (%)',
        },
        opposite: true,
      },
    ],
    series,
  };

  return (
    <div className="chart">
      <HighchartsReact
        highcharts={Highcharts}
        options={options}
        containerProps={{ style: { height: '100%', width: '100%' } }}
      />
    </div>
  );
};

const Graph = ({
  sdataold, sdatanew, parm, desc,
}) => {
  const series = [
    {
      name: 'original',
      data: dailyAverage(new Date(sdataold[0].Date), sdataold, parm),
      animation: false,
      color: 'green',
    },
    {
      name: 'new',
      data: dailyAverage(new Date(sdatanew[0].Date), sdatanew, parm),
      animation: false,
      color: 'red',
    },
  ];

  const options = {
    chart: {
      type: 'line',
      animation: false,
    },
    title: {
      text: desc,
    },
    xAxis: {
      type: 'datetime',
    },
    yAxis: [
      {
        title: {
          text: parm,
        },
      },
    ],
    series,
  };

  return (
    <div className="chart">
      <HighchartsReact
        highcharts={Highcharts}
        options={options}
        containerProps={{ style: { height: '100%', width: '100%' } }}
      />
    </div>
  );
}; // Graph

const Graphs = () => {
  const [weather, setWeather] = useState([]);
  // const [parm, setParm] = useState('MinNfromFOM');

  const retrieve = async () => {
    const lat = 32.865389;
    const lon = -82.258361;
    const start = '2019-03-21';
    const end = '2019-07-20';
    try {
      const url = `https://weather.covercrop-data.org/hourly?lat=${lat}&lon=${lon}&start=${start}&end=${end}`
        + '&attributes=air_temperature,relative_humidity,precipitation&options=predicted,mrms';

      const w = await (await fetch(url)).json();
      setWeather(w);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    retrieve();
  }, []);

  if (weather.length && typeof surfaceModelNew === 'function') {
    const biomass = 5604;
    const N = 0.6;
    const carb = 33.45;
    const cell = 57.81;
    const lign = 8.74;
    const OM = 0.75;
    const BD = 1.62;
    const INppm = 10;
    const PMN = 10;
    const lwc = 4;

    const inputs = {
      FOMkg: biomass,
      FOMpctN: N,
      FOMpctCarb: carb,
      FOMpctCell: cell,
      FOMpctLign: lign,
      LitterWaterContent: lwc,
      OM,
      BD,
      PMN,
      INppm,
      hours: weather.length,
      stop: weather.length,
      temp: weather.map((row) => row.air_temperature),
      RH: weather.map((row) => row.relative_humidity * 100),
      rain: weather.map((row) => row.precipitation),
      start: weather[0].date.split(' ')[0],
    };

    // eslint-disable-next-line no-undef
    const sdatanew = surfaceModelNew(inputs);
    // console.log(sdatanew);

    // eslint-disable-next-line no-undef
    const sdataold = convertToObject(surfaceModel(inputs));
    // console.log(sdataold);

    return (
      <div id="Graphs">
        <h2>Fresh Organic Matter</h2>
        <Graph sdatanew={sdatanew} sdataold={sdataold} parm="Carb" desc="Carbohydrates" />
        <Graph sdatanew={sdatanew} sdataold={sdataold} parm="Cell" desc="Holo-cellulose" />
        <Graph sdatanew={sdatanew} sdataold={sdataold} parm="Lign" desc="Lignin" />

        <h2>Fresh Organic Nitrogen</h2>
        <Graph sdatanew={sdatanew} sdataold={sdataold} parm="CarbN" desc="Carbohydrates" />
        <Graph sdatanew={sdatanew} sdataold={sdataold} parm="CellN" desc="Holo-cellulose" />
        <Graph sdatanew={sdatanew} sdataold={sdataold} parm="LigninN" desc="Lignin" />

        <h2>Decay rate adjustment factors</h2>
        <Graph sdatanew={sdatanew} sdataold={sdataold} parm="RMTFAC" desc="Residue moisture-temperature reduction factor" />
        <Graph sdatanew={sdatanew} sdataold={sdataold} parm="CNRF" desc="C:N ratio factor" />
        <Graph sdatanew={sdatanew} sdataold={sdataold} parm="ContactFactor" desc="Residue contact factor" />

        <h2>Other</h2>
        <WeatherGraph sdatanew={sdatanew} />
        <Graph sdatanew={sdatanew} sdataold={sdataold} parm="LitterMPa" desc="Litter water potential" />
        <Graph sdatanew={sdatanew} sdataold={sdataold} parm="Air_MPa" desc="Air water potential" />
      </div>
    );
  }

  return <div>Loading&hellip;</div>;
};

const srcnew = await (await fetch(`${API}/sourcenew`)).text();
window.eval(srcnew);

const srcold = await (await fetch(`${API}/sourceold`)).text();
window.eval(srcold);

export default Graphs;
