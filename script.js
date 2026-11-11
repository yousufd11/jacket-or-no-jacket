const city = document.querySelector('#city');
const refresh = document.querySelector('#refresh');
const status = document.querySelector('#status');
const result = document.querySelector('#result');
const places = {
  mosul: { latitude: 36.34, longitude: 43.13, name: 'Mosul' },
  toronto: { latitude: 43.65, longitude: -79.38, name: 'Toronto' }
};
let requestNumber = 0;

async function getWeather() {
  const thisRequest = ++requestNumber;
  const place = places[city.value];
  refresh.disabled = true;
  result.setAttribute('aria-busy', 'true');
  document.body.className = '';
  document.querySelector('#temperature').textContent = '—';
  document.querySelector('#advice').textContent = 'Checking outside…';
  document.querySelector('#detail').textContent = 'Getting the weather for ' + place.name + '.';
  document.querySelector('#symbol').textContent = '…';
  for (const id of ['feels', 'wind', 'rain']) document.getElementById(id).textContent = '—';
  status.textContent = 'Loading weather…';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + place.latitude + '&longitude=' + place.longitude + '&current=temperature_2m,apparent_temperature,precipitation,wind_speed_10m,is_day&timezone=auto';
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error('Weather unavailable');
    const data = await response.json();
    if (thisRequest !== requestNumber) return;
    const weather = data.current;
    if (!weather || !Number.isFinite(weather.apparent_temperature)) throw new Error('Missing weather');
    const feels = weather.apparent_temperature;
    let advice = 'No jacket. Finally.';
    let mood = 'warm';
    let symbol = '☀';
    if (feels < 12) {
      advice = 'Yeah, take the jacket.';
      mood = 'cold';
      symbol = '❄';
    } else if (feels < 20) {
      advice = 'A hoodie should do it.';
      mood = 'mild';
      symbol = '☁';
    }
    let detail = 'Based on how it feels outside in ' + place.name + '.';
    if (weather.precipitation > 0) {
      detail = 'Something’s falling. Bring a waterproof layer too.';
      symbol = '☂';
    } else if (weather.wind_speed_10m > 25) {
      detail = 'Pretty windy. A light layer might help.';
    }
    document.body.className = mood;
    document.querySelector('#temperature').textContent = Math.round(weather.temperature_2m) + '°C';
    document.querySelector('#advice').textContent = advice;
    document.querySelector('#detail').textContent = detail;
    document.querySelector('#symbol').textContent = symbol;
    document.querySelector('#symbol').style.animationDuration = Math.max(0.8, 5 - weather.wind_speed_10m / 10) + 's';
    document.querySelector('#feels').textContent = Math.round(feels) + '°C';
    document.querySelector('#wind').textContent = weather.wind_speed_10m + ' km/h';
    document.querySelector('#rain').textContent = weather.precipitation + ' mm';
    status.textContent = place.name + ' · Weather time: ' + weather.time.replace('T', ' at ') + ' (' + data.timezone + ') · Checked just now';
  } catch (error) {
    if (thisRequest !== requestNumber) return;
    document.querySelector('#advice').textContent = 'Couldn’t check outside.';
    document.querySelector('#detail').textContent = 'Try Check again in a moment.';
    status.textContent = 'Weather unavailable. Check your connection and try again.';
  } finally {
    clearTimeout(timeout);
    if (thisRequest === requestNumber) {
      refresh.disabled = false;
      result.setAttribute('aria-busy', 'false');
    }
  }
}
city.addEventListener('change', getWeather);
refresh.addEventListener('click', getWeather);
setInterval(getWeather, 5 * 60 * 1000);
getWeather();
