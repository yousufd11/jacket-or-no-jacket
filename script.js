const city = document.querySelector('#city');
const refresh = document.querySelector('#refresh');
const windowButton = document.querySelector('#window');
const scene = document.querySelector('#scene');
const status = document.querySelector('#status');
const places = {
  mosul: { latitude: 36.34, longitude: 43.13, name: 'Mosul' },
  toronto: { latitude: 43.65, longitude: -79.38, name: 'Toronto' }
};
let windowOpen = false;
let wind = 0;
let requestNumber = 0;

function moveSteam() {
  scene.classList.toggle('open', windowOpen);
  scene.style.setProperty('--drift', windowOpen ? Math.min(wind * 2, 65) + 'px' : '0px');
  scene.style.setProperty('--speed', windowOpen ? Math.max(1, 4 - wind / 12) + 's' : '4s');
  windowButton.textContent = windowOpen ? 'Close the window' : 'Open the window';
  windowButton.setAttribute('aria-pressed', windowOpen);
}

async function getWeather() {
  const thisRequest = ++requestNumber;
  const place = places[city.value];
  refresh.disabled = true;
  document.querySelector('#result').setAttribute('aria-busy', 'true');
  status.textContent = 'Checking ' + place.name + '…';
  document.querySelector('#thought').textContent = 'One second…';
  document.querySelector('#detail').textContent = 'Getting the view in ' + place.name + '.';
  document.querySelector('#scene-note').textContent = 'Waiting for weather…';
  for (const id of ['temperature', 'wind', 'clouds']) document.getElementById(id).textContent = '—';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + place.latitude + '&longitude=' + place.longitude + '&current=temperature_2m,precipitation,wind_speed_10m,cloud_cover,is_day&timezone=auto';
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error('Weather unavailable');
    const data = await response.json();
    if (thisRequest !== requestNumber) return;
    const weather = data.current;
    if (!weather || !Number.isFinite(weather.temperature_2m)) throw new Error('Missing weather');
    wind = weather.wind_speed_10m;
    let sky = weather.temperature_2m < 15 ? '#a9c4ce' : '#e8c49b';
    let thought = 'Tea first. Everything else later.';
    if (!weather.is_day) {
      sky = '#344253';
      thought = 'Still up. Might as well make tea.';
    } else if (weather.precipitation > 0) {
      thought = 'I’m staying right here.';
    } else if (weather.temperature_2m < 12) {
      thought = 'Cold outside. Good excuse for another glass.';
    }
    scene.style.setProperty('--sky', sky);
    scene.style.setProperty('--cloud', weather.cloud_cover / 100 * .65);
    scene.classList.toggle('night', !weather.is_day);
    scene.classList.toggle('wet', weather.precipitation > 0);
    moveSteam();
    document.querySelector('#thought').textContent = thought;
    document.querySelector('#detail').textContent = 'Open the window and let the wind in ' + place.name + ' move the steam.';
    document.querySelector('#temperature').textContent = Math.round(weather.temperature_2m) + '°C';
    document.querySelector('#wind').textContent = wind + ' km/h';
    document.querySelector('#clouds').textContent = weather.cloud_cover + '%';
    document.querySelector('#scene-note').textContent = place.name + (weather.is_day ? ' · daytime' : ' · nighttime');
    scene.setAttribute('aria-label', 'Tea beside a ' + (windowOpen ? 'open' : 'closed') + ' window in ' + place.name + '. ' + (weather.is_day ? 'Daylight' : 'Nighttime') + ', ' + weather.cloud_cover + '% cloud cover.');
    status.textContent = 'Weather time: ' + weather.time.replace('T', ' at ') + ' (' + data.timezone + ')';
  } catch (error) {
    if (thisRequest !== requestNumber) return;
    document.querySelector('#thought').textContent = 'The view will have to wait.';
    document.querySelector('#detail').textContent = 'Couldn’t get the weather. Try Check outside again.';
    status.textContent = 'Weather unavailable. The view is not current.';
  } finally {
    clearTimeout(timeout);
    if (thisRequest === requestNumber) {
      refresh.disabled = false;
      document.querySelector('#result').setAttribute('aria-busy', 'false');
    }
  }
}
windowButton.addEventListener('click', () => {
  windowOpen = !windowOpen;
  moveSteam();
  scene.setAttribute('aria-label', scene.getAttribute('aria-label').replace(windowOpen ? 'closed' : 'open', windowOpen ? 'open' : 'closed'));
});
city.addEventListener('change', getWeather);
refresh.addEventListener('click', getWeather);
setInterval(getWeather, 5 * 60 * 1000);
getWeather();
