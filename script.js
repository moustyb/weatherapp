const DEFAULT_CITY = "Los Angeles";
const userName = "Explorer";

const COMPARISON_CITIES = ["Chicago", "New York", "Los Angeles", "Miami", "Seattle"];
const SUN_CITIES = ["Chicago", "New York", "Los Angeles", "Miami", "Seattle"];

const apiCache = new Map();

const qs = (sel) => document.querySelector(sel);

const fmtTime = (unix, tzOffsetSec) => {
    const date = new Date((unix + tzOffsetSec) * 1000);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const fmtDate = (date = new Date()) =>
    date.toLocaleDateString([], { weekday: "short", day: "2-digit", month: "short", year: "numeric" });

const fmtShortDay = (date) =>
    date.toLocaleDateString([], { weekday: "short" });

const kToC = (k) => (k - 273.15).toFixed(0);
const msToKmh = (ms) => (ms * 3.6).toFixed(0);

const aqiStatus = (aqi) => {
    const map = {
        1: { label: "Good", tip: "A perfect day for a walk! 🌿", color: "#22c55e" },
        2: { label: "Fair", tip: "Air quality is acceptable", color: "#84cc16" },
        3: { label: "Moderate", tip: "Sensitive groups should limit outdoor time", color: "#f59e0b" },
        4: { label: "Poor", tip: "Consider a mask if outdoors", color: "#ef4444" },
        5: { label: "Very Poor", tip: "Avoid outdoor exertion", color: "#991b1b" },
    };
    return map[aqi] || { label: "—", tip: "—", color: "#6b7280" };
};

const showToast = (msg) => {
    const toastEl = qs("#toast");
    if (toastEl) {
        toastEl.textContent = msg;
        toastEl.style.display = "block";
        setTimeout(() => toastEl.style.display = "none", 3000);
    }
};

const datetimeEl = qs(".datetime");
const greetingEl = qs(".greeting");
const cityEl = qs(".city");
const dateEl = qs(".date");
const tempEl = qs(".temp");
const descEl = qs(".desc");
const iconEl = qs(".icon");
const windEl = qs(".wind");
const humidityEl = qs(".humidity");
const pressureEl = qs(".pressure");
const forecastListEl = qs("#forecast-list");
const aqiBadgeEl = qs("#aqi-badge");
const aqiStatusEl = qs(".aqi-status");
const aqiTipEl = qs(".aqi-tip");
const aqiLocationEl = qs("#aqi-location");
const ssListEl = qs("#ss-list");
const comparisonGridEl = qs("#comparison-grid");

function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    datetimeEl.textContent = `${fmtDate(now)} • ${timeString}`;

    const hour = now.getHours();
    const greet =
        hour < 12 ? "Good morning" :
        hour < 18 ? "Good afternoon" : "Good evening";

    greetingEl.innerHTML = `☆ ${greet}, ${userName}!`;
}
setInterval(updateClock, 60_000);
updateClock();

async function fetchCurrentWeather(city) {
    const cacheKey = `cw_${city}`;
    if (apiCache.has(cacheKey)) return apiCache.get(cacheKey);

    const res = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
    if (!res.ok) throw new Error("Current weather fetch failed");

    const data = await res.json();
    apiCache.set(cacheKey, data);
    return data;
}

async function fetchForecast(city) {
    const cacheKey = `fc_${city}`;
    if (apiCache.has(cacheKey)) return apiCache.get(cacheKey);

    const res = await fetch(`/api/forecast?city=${encodeURIComponent(city)}`);
    if (!res.ok) throw new Error("Forecast fetch failed");

    const data = await res.json();
    apiCache.set(cacheKey, data);
    return data;
}

async function fetchAQI(lat, lon) {
    const res = await fetch(`/api/aqi?lat=${lat}&lon=${lon}`);
    if (!res.ok) throw new Error("AQI fetch failed");
    return res.json();
}

async function fetchReverseGeocode(lat, lon) {
    const res = await fetch(`/api/reverse?lat=${lat}&lon=${lon}`);
    if (!res.ok) throw new Error("Reverse geocode failed");
    return res.json();
}

function renderCurrentWeather(data) {
    const tzOffset = data.timezone;

    cityEl.textContent = data.name;
    dateEl.textContent = `Today, ${fmtDate(new Date())}`;
    tempEl.textContent = kToC(data.main.temp);
    descEl.textContent = data.weather[0].description.replace(/\b\w/g, c => c.toUpperCase());

    const iconCode = data.weather[0].icon;
    iconEl.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    iconEl.alt = data.weather[0].main;

    windEl.textContent = `${msToKmh(data.wind.speed)} km/h`;
    humidityEl.textContent = `${data.main.humidity}%`;
    pressureEl.textContent = `${data.main.pressure} hPa`;

    setDynamicBackground(data.weather[0].main);
}

function setDynamicBackground(weatherCondition) {
    const body = document.body;

    const backgrounds = {
        Clear: '#f0f9ff',
        Clouds: '#f1f5f9',
        Rain: '#e0f2fe',
        Drizzle: '#e0f2fe',
        Thunderstorm: '#f3f4f6',
        Snow: '#f5f5f5',
        Mist: '#f1f5f9',
        Smoke: '#f1f5f9',
        Haze: '#f1f5f9',
        Dust: '#f1f5f9',
        Fog: '#f1f5f9',
        Sand: '#f1f5f9',
        Ash: '#f1f5f9',
        Squall: '#f1f5f9',
        Tornado: '#f1f5f9',
    };

    const bgColor = backgrounds[weatherCondition] || '#f1f5f9';
    body.style.background = bgColor;
}

function renderForecast(data) {
    const tzOffset = data.city.timezone;
    const byDay = {};

    data.list.forEach(item => {
        const localUnix = item.dt + tzOffset;
        const date = new Date(localUnix * 1000);
        const dayKey = date.toDateString();
        const hour = date.getHours();

        if (!byDay[dayKey] || Math.abs(hour - 12) < Math.abs(byDay[dayKey].hour - 12)) {
            byDay[dayKey] = { hour, item, date };
        }
    });

    const days = Object.values(byDay).slice(0, 6);
    forecastListEl.innerHTML = "";

    days.forEach(({ item, date }) => {
        const icon = item.weather[0].icon;
        const li = document.createElement("li");
        li.className = "forecast-item";
        li.innerHTML = `
            ${fmtShortDay(date)}
            <img src="https://openweathermap.org/img/wn/${icon}.png" alt="${item.weather[0].main}">
            ${kToC(item.main.temp)}°
        `;
        forecastListEl.appendChild(li);
    });
}

function renderAQI(lat, lon, aqiData, cityName) {
    const aqi = aqiData.list?.[0]?.main?.aqi ?? null;
    const status = aqiStatus(aqi || 1);

    aqiBadgeEl.textContent = aqi ?? "—";
    aqiBadgeEl.style.background = status.color + "20";
    aqiBadgeEl.style.color = status.color;

    aqiStatusEl.textContent = status.label;
    aqiStatusEl.style.color = status.color;

    aqiTipEl.textContent = status.tip;
    aqiLocationEl.textContent = `${cityName} (${lat.toFixed(2)}, ${lon.toFixed(2)})`;
}

async function renderSunriseSunset(cities) {
    ssListEl.innerHTML = "";

    for (const city of cities) {
        try {
            const cw = await fetchCurrentWeather(city);
            const tzOffset = cw.timezone;

            const sunrise = fmtTime(cw.sys.sunrise, tzOffset);
            const sunset = fmtTime(cw.sys.sunset, tzOffset);

            const item = document.createElement("div");
            item.className = "ss-item";

            item.innerHTML = `
                <div class="city-info">
                    <i class="fa-solid fa-map-pin"></i>
                    <span class="city-name">${cw.name}</span>
                </div>
                <div class="times">
                    <div class="time-block">
                        <span class="time-label">Sunrise</span>
                        <span class="time-value">${sunrise}</span>
                    </div>
                    <div class="time-block">
                        <span class="time-label">Sunset</span>
                        <span class="time-value">${sunset}</span>
                    </div>
                </div>
            `;
            ssListEl.appendChild(item);

        } catch {
            const item = document.createElement("div");
            item.className = "ss-item";
            item.innerHTML = `
                <div class="city-info">
                    <i class="fa-solid fa-map-pin"></i>
                    <span class="city-name">${city}</span>
                </div>
                <div class="times">
                    <div class="time-block">
                        <span class="time-label">Sunrise</span>
                        <span class="time-value">—</span>
                    </div>
                    <div class="time-block">
                        <span class="time-label">Sunset</span>
                        <span class="time-value">—</span>
                    </div>
                </div>
            `;
            ssListEl.appendChild(item);
        }
    }
}

async function renderComparison(cities) {
    comparisonGridEl.innerHTML = "";

    for (const city of cities) {
        try {
            const cw = await fetchCurrentWeather(city);

            const card = document.createElement("div");
            card.className = "compare-card";

            const details = `${kToC(cw.main.temp)}°C • ${msToKmh(cw.wind.speed)} km/h • ${cw.main.humidity}%`;

            card.innerHTML = `
                <div class="compare-title">${cw.name}</div>
                <div class="compare-details">${details}</div>
            `;
            comparisonGridEl.appendChild(card);

        } catch {
            const card = document.createElement("div");
            card.className = "compare-card";
            card.innerHTML = `
                <div class="compare-title">${city}</div>
                <div class="compare-details">— °C • — km/h • —%</div>
            `;
            comparisonGridEl.appendChild(card);
        }
    }
}

function renderRainChart() {
    const ctx = document.getElementById("rainChart");

    const data = {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        datasets: [
            {
                label: "Rain",
                data: [12, 30, 22, 55, 120, 180, 220, 210, 160, 90, 40, 18],
                backgroundColor: "rgba(59, 130, 246, 0.4)",
                borderColor: "rgba(59, 130, 246, 1)",
                borderWidth: 2,
                borderRadius: 8
            },
            {
                label: "Sun",
                data: [8, 7, 9, 10, 11, 12, 11, 10, 9, 8, 7, 6],
                backgroundColor: "rgba(245, 158, 11, 0.4)",
                borderColor: "rgba(245, 158, 11, 1)",
                borderWidth: 2,
                borderRadius: 8
            }
        ]
    };

    new Chart(ctx, {
        type: "bar",
        data,
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: { color: '#1f2937', font: { size: 12 } }
                }
            },
            scales: {
                x: { grid: { display: false } },
                y: { grid: { color: "rgba(0,0,0,0.05)" }, beginAtZero: true }
            }
        }
    });
}

async function loadCity(city) {
    try {
        tempEl.textContent = "Loading...";
        cityEl.textContent = city;
        descEl.textContent = "Fetching weather...";

        const [cw, fc] = await Promise.all([
            fetchCurrentWeather(city),
            fetchForecast(city)
        ]);

        renderCurrentWeather(cw);
        renderForecast(fc);

        const { coord: { lat, lon }, name } = cw;
        const aqi = await fetchAQI(lat, lon);
        renderAQI(lat, lon, aqi, name);

        await renderSunriseSunset(SUN_CITIES);
        await renderComparison(COMPARISON_CITIES);

        if (cw.weather[0].main.toLowerCase().includes("clear") &&
            Number(kToC(cw.main.temp)) >= 20 &&
            Number(kToC(cw.main.temp)) <= 30) {
            pulseCard(".current-weather");
        }

    } catch (e) {
        console.error(e);
        showToast("Failed to load weather. Please check connection or try another city.");
        tempEl.textContent = "—";
        cityEl.textContent = DEFAULT_CITY;
    }
}

function pulseCard(selector) {
    const el = qs(selector);
    if (!el) return;

    el.animate(
        [
            { transform: "scale(1)", boxShadow: "var(--shadow)" },
            { transform: "scale(1.02)", boxShadow: "0 12px 32px rgba(34,197,94,0.25)" },
            { transform: "scale(1)", boxShadow: "var(--shadow)" }
        ],
        { duration: 800 }
    );
}

document.getElementById("search-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const q = document.getElementById("search-input").value.trim();
    if (q) {
        loadCity(q);
        document.getElementById("search-input").value = "";
    }
});

document.getElementById("use-location").addEventListener("click", () => {
    if (!navigator.geolocation) {
        showToast("Geolocation not supported");
        loadCity(DEFAULT_CITY);
        return;
    }

    navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
            const { latitude, longitude } = pos.coords;

            const data = await fetchReverseGeocode(latitude, longitude);
            const city = data?.name || DEFAULT_CITY;

            loadCity(city);

        } catch {
            showToast("Geocode failed");
            loadCity(DEFAULT_CITY);
        }
    }, (err) => {
        console.error(err);
        showToast("Location access denied. Using default city.");
        loadCity(DEFAULT_CITY);
    }, { enableHighAccuracy: true, timeout: 8000 });
});

renderRainChart();
loadCity(DEFAULT_CITY);
