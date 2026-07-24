const searchForm = document.getElementById("searchForm");
const cityInput = document.getElementById("cityInput");
const suggestionsList = document.getElementById("suggestions");
const errorMsg = document.getElementById("errorMsg");
const loading = document.getElementById("loading");
const currentWeather = document.getElementById("currentWeather");
const forecastDiv = document.getElementById("forecast");
const themeToggle = document.getElementById("themeToggle");
const titleCity = document.getElementById("titleCity");

const US_STATE_ABBR = {
  Alabama: "AL", Alaska: "AK", Arizona: "AZ", Arkansas: "AR", California: "CA",
  Colorado: "CO", Connecticut: "CT", Delaware: "DE", Florida: "FL", Georgia: "GA",
  Hawaii: "HI", Idaho: "ID", Illinois: "IL", Indiana: "IN", Iowa: "IA",
  Kansas: "KS", Kentucky: "KY", Louisiana: "LA", Maine: "ME", Maryland: "MD",
  Massachusetts: "MA", Michigan: "MI", Minnesota: "MN", Mississippi: "MS",
  Missouri: "MO", Montana: "MT", Nebraska: "NE", Nevada: "NV",
  "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY",
  "North Carolina": "NC", "North Dakota": "ND", Ohio: "OH", Oklahoma: "OK",
  Oregon: "OR", Pennsylvania: "PA", "Rhode Island": "RI", "South Carolina": "SC",
  "South Dakota": "SD", Tennessee: "TN", Texas: "TX", Utah: "UT", Vermont: "VT",
  Virginia: "VA", Washington: "WA", "West Virginia": "WV", Wisconsin: "WI",
  Wyoming: "WY", "District of Columbia": "DC",
};

function getWeatherInfo(code) {
  const map = {
    0: { text: "Clear sky", icon: "☀️", theme: "sunny" },
    1: { text: "Mainly clear", icon: "🌤️", theme: "sunny" },
    2: { text: "Partly cloudy", icon: "⛅", theme: "cloudy" },
    3: { text: "Overcast", icon: "☁️", theme: "cloudy" },
    45: { text: "Fog", icon: "🌫️", theme: "cloudy" },
    48: { text: "Fog", icon: "🌫️", theme: "cloudy" },
    51: { text: "Light drizzle", icon: "🌦️", theme: "rain" },
    53: { text: "Drizzle", icon: "🌦️", theme: "rain" },
    55: { text: "Heavy drizzle", icon: "🌧️", theme: "rain" },
    61: { text: "Light rain", icon: "🌧️", theme: "rain" },
    63: { text: "Rain", icon: "🌧️", theme: "rain" },
    65: { text: "Heavy rain", icon: "🌧️", theme: "rain" },
    71: { text: "Light snow", icon: "🌨️", theme: "snow" },
    73: { text: "Snow", icon: "❄️", theme: "snow" },
    75: { text: "Heavy snow", icon: "❄️", theme: "snow" },
    80: { text: "Rain showers", icon: "🌦️", theme: "rain" },
    81: { text: "Rain showers", icon: "🌧️", theme: "rain" },
    82: { text: "Violent showers", icon: "⛈️", theme: "storm" },
    95: { text: "Thunderstorm", icon: "⛈️", theme: "storm" },
    96: { text: "Thunderstorm w/ hail", icon: "⛈️", theme: "storm" },
    99: { text: "Thunderstorm w/ hail", icon: "⛈️", theme: "storm" },
  };

  return map[code] || { text: "Unknown", icon: "❓", theme: "cloudy" };
}

function getDayName(dateString) {
  const date = new Date(dateString + "T00:00:00");
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

// here i set the format to be like "Brentwood, CA"
function formatLocation(place) {
  if (place.country_code === "US" && place.admin1) {
    const abbr = US_STATE_ABBR[place.admin1] || place.admin1;
    return place.name + ", " + abbr;
  }
  return place.name + ", " + place.country;
}

async function searchPlaces(query, count) {
  const url = "https://geocoding-api.open-meteo.com/v1/search?name=" + encodeURIComponent(query) + "&count=" + count;
  const res = await fetch(url);
  const data = await res.json();
  return data.results || [];
}

async function getWeather(lat, lon) {
  const url =
    "https://api.open-meteo.com/v1/forecast?latitude=" + lat + "&longitude=" + lon +
    "&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,is_day" +
    "&daily=weather_code,temperature_2m_max,temperature_2m_min" +
    "&temperature_unit=fahrenheit&wind_speed_unit=mph" +
    "&timezone=auto";

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Weather service isn't responding right now.");
  }
  return res.json();
}

function showError(message) {
  errorMsg.textContent = message;
  errorMsg.classList.remove("hidden");
}

function clearError() {
  errorMsg.classList.add("hidden");
  errorMsg.textContent = "";
}

function renderCurrent(place, weatherData) {
  const current = weatherData.current;
  const info = getWeatherInfo(current.weather_code);
  const locationText = formatLocation(place);

  document.getElementById("cityName").textContent = locationText;
  titleCity.textContent = locationText;

  document.getElementById("dateNow").textContent = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  document.getElementById("weatherIcon").textContent = info.icon;
  document.getElementById("temp").textContent = Math.round(current.temperature_2m) + "°F";
  document.getElementById("condition").textContent = info.text;
  document.getElementById("feelsLike").textContent = Math.round(current.apparent_temperature) + "°F";
  document.getElementById("humidity").textContent = current.relative_humidity_2m + "%";
  document.getElementById("wind").textContent = Math.round(current.wind_speed_10m) + " mph";

  const todayMax = Math.round(weatherData.daily.temperature_2m_max[0]);
  const todayMin = Math.round(weatherData.daily.temperature_2m_min[0]);
  document.getElementById("highLow").textContent = todayMax + "° / " + todayMin + "°";

  // this changes the background color depending on the weather
  let theme = info.theme;
  if (current.is_day === 0) {
    theme = "night";
  }
  applyTheme(theme);

  currentWeather.classList.remove("hidden");
}

function renderForecast(weatherData) {
  forecastDiv.innerHTML = ""; 

  const days = weatherData.daily.time;

  // showing 5 days starting from today
  for (let i = 0; i < 5 && i < days.length; i++) {
    const info = getWeatherInfo(weatherData.daily.weather_code[i]);
    const max = Math.round(weatherData.daily.temperature_2m_max[i]);
    const min = Math.round(weatherData.daily.temperature_2m_min[i]);

    const dayCard = document.createElement("div");
    dayCard.className = "forecast-day";
    dayCard.innerHTML =
      '<span class="day-name">' + (i === 0 ? "Today" : getDayName(days[i])) + "</span>" +
      '<span class="day-icon">' + info.icon + "</span>" +
      '<span class="day-temps">' + max + "° / " + min + "°</span>";
    forecastDiv.appendChild(dayCard);
  }

  forecastDiv.classList.remove("hidden");
}

function applyTheme(theme) {
  document.body.classList.remove("sunny", "cloudy", "rain", "snow", "storm", "night");

  if (!document.body.classList.contains("dark-mode")) {
    document.body.classList.add(theme);
  }
}

async function loadWeatherFor(place) {
  clearError();
  hideSuggestions();
  loading.classList.remove("hidden");
  currentWeather.classList.add("hidden");
  forecastDiv.classList.add("hidden");

  try {
    const weatherData = await getWeather(place.latitude, place.longitude);
    renderCurrent(place, weatherData);
    renderForecast(weatherData);
  } catch (err) {
    showError(err.message || "Something went wrong. Please try again.");
  } finally {
    loading.classList.add("hidden");
  }
}

// this is for when the user types a place and hits enter not from the drop down
async function handleTypedSearch(cityText) {
  clearError();
  loading.classList.remove("hidden");

  try {
    const results = await searchPlaces(cityText, 1);
    if (results.length === 0) {
      throw new Error("City not found. Try checking the spelling.");
    }
    await loadWeatherFor(results[0]);
  } catch (err) {
    loading.classList.add("hidden");
    showError(err.message || "Something went wrong. Please try again.");
  }
}

function hideSuggestions() {
  suggestionsList.innerHTML = "";
  suggestionsList.classList.add("hidden");
}

function renderSuggestions(places) {
  suggestionsList.innerHTML = "";

  if (places.length === 0) {
    hideSuggestions();
    return;
  }

  for (let i = 0; i < places.length; i++) {
    const place = places[i];
    const li = document.createElement("li");
    li.textContent = formatLocation(place);
    li.addEventListener("click", function () {
      cityInput.value = formatLocation(place);
      hideSuggestions();
      loadWeatherFor(place);
    });
    suggestionsList.appendChild(li);
  }

  suggestionsList.classList.remove("hidden");
}

// debounce timer so it doesn't keep calling the api
let debounceTimer;
cityInput.addEventListener("input", function () {
  clearTimeout(debounceTimer);
  const query = cityInput.value.trim();

  if (query.length < 2) {
    hideSuggestions();
    return;
  }

  debounceTimer = setTimeout(async function () {
    try {
      const results = await searchPlaces(query, 5);
      renderSuggestions(results);
    } catch (err) {
      hideSuggestions();
    }
  }, 300);
});

// this will close the suggested locations if clicked somewhere else on the page
document.addEventListener("click", function (e) {
  if (!e.target.closest(".input-wrapper")) {
    hideSuggestions();
  }
});

searchForm.addEventListener("submit", function (e) {
  e.preventDefault();
  const city = cityInput.value.trim();

  if (city === "") {
    showError("Please type a city name first.");
    return;
  }

  handleTypedSearch(city);
});

themeToggle.addEventListener("click", function () {
  document.body.classList.toggle("dark-mode");
  const isDark = document.body.classList.contains("dark-mode");
  themeToggle.textContent = isDark ? "☀️" : "🌙";
  localStorage.setItem("darkMode", isDark);
});

window.addEventListener("DOMContentLoaded", function () {
  if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark-mode");
    themeToggle.textContent = "☀️";
  }

  handleTypedSearch("Brentwood");
});