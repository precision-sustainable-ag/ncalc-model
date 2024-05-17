/* eslint-disable camelcase */
import React, { useEffect, useState } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

// const API = 'https://api.covercrop-ncalc.org';
// const API = 'http://localhost';

const Graph = () => {
  const [weather, setWeather] = useState([]);
  const [parm, setParm] = useState('MinNfromFOM');

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
    const sdata = surfaceModelNew(inputs).map((row) => (
      [
        new Date(row.Date),
        row[parm],
      ]
    ));

    const options = {
      chart: {
        type: 'line',
        animation: false,
      },
      title: {
        text: parm,
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
      series: {
        name: 'new',
        data: sdata,
        animation: false,
      },
    };

    return (
      <>
        <select
          onChange={(e) => {
            setParm(e.currentTarget.value);
          }}
          value={parm}
        >
          <option>MinNfromFOM</option>
          <option>CarbN</option>
        </select>

        <HighchartsReact
          highcharts={Highcharts}
          options={options}
        />
      </>
    );
  }

  return <div>Loading&hellip;</div>;
};

let src = await (await fetch('http://localhost/source')).text();
[src] = src.split('module');
src = src.replace(/[\n\r]const (\w+) = ([^=]+) =>/g, '\nfunction $1 $2');
// eslint-disable-next-line no-eval
window.eval(src);

export default Graph;
