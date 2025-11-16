const API_KEY = "5c61b6a469a8e66b54f1031f2def5023";

const input = document.getElementById("city-input");
const suggestions = document.getElementById("suggestions");

/* -------------------- AUTO SUGGEST -------------------- */
input.addEventListener("input", () => {
    const q = input.value.trim();
    if (q.length < 2) {
        suggestions.innerHTML = "";
        return;
    }
    fetchCitySuggestions(q);
});

async function fetchCitySuggestions(q) {
    const url = `https://api.openweathermap.org/geo/1.0/direct?q=${q}&limit=5&appid=${API_KEY}`;

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch city suggestions");
        const data = await res.json();

        suggestions.innerHTML = "";

        if (data.length === 0) {
            const item = document.createElement("div");
            item.className = "suggest-item";
            item.textContent = "No cities found";
            suggestions.appendChild(item);
            return;
        }

        data.forEach(city => {
            const item = document.createElement("div");
            item.className = "suggest-item";
            item.textContent = `${city.name}${city.state ? ", " + city.state : ""}, ${city.country}`;
            item.onclick = () => {
                input.value = city.name;
                suggestions.innerHTML = "";
                getCurrentWeather(city.name);
                getForecast(city.name);
            };
            suggestions.appendChild(item);
        });

    } catch (err) {
        console.error(err);
        alert("Error fetching city suggestions. Please try again later.");
    }
}

// Hide suggestions on outside click
document.addEventListener("click", e => {
    if (!suggestions.contains(e.target) && e.target !== input)
        suggestions.innerHTML = "";
});

/* -------------------- SEARCH BUTTON -------------------- */
document.getElementById("search-btn").addEventListener("click", () => {
    const city = input.value.trim();
    if (!city) return alert("Enter city name!");
    getCurrentWeather(city);
    getForecast(city);
});

/* -------------------- CURRENT WEATHER -------------------- */
async function getCurrentWeather(city) {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("City not found");
        const data = await res.json();
        displayCurrentWeather(data);
    } catch (err) {
        console.error(err);
        alert(`Error fetching weather: ${err.message}`);
        document.getElementById("weather-display").innerHTML =
            `<p class="placeholder error">⚠️ ${err.message}</p>`;
    }
}

function displayCurrentWeather(d) {
    const container = document.getElementById("weather-display");
    container.innerHTML = `
        <h3>${d.name}, ${d.sys.country}</h3>
        <img src="https://openweathermap.org/img/wn/${d.weather[0].icon}@2x.png" />
        <h2>${Math.round(d.main.temp)}°C</h2>
        <p class="description">${d.weather[0].description}</p>
        <div class="weather-details">
            <p><strong>Humidity:</strong> ${d.main.humidity}%</p>
            <p><strong>Wind:</strong> ${d.wind.speed} m/s</p>
            <p><strong>Feels Like:</strong> ${Math.round(d.main.feels_like)}°C</p>
        </div>
    `;
}

/* -------------------- FORECAST (5-DAY) -------------------- */
async function getForecast(city) {
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`;

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Forecast not available");
        const data = await res.json();
        displayForecast(data.list);
    } catch (err) {
        console.error(err);
        alert(`Error fetching forecast: ${err.message}`);
        document.getElementById("forecast-display").innerHTML =
            `<p class="placeholder error">⚠️ ${err.message}</p>`;
    }
}

function displayForecast(list) {
    const container = document.getElementById("forecast-display");
    container.innerHTML = "";

    let days = {};
    list.forEach(item => {
        const date = item.dt_txt.split(" ")[0];
        if (!days[date]) days[date] = item; // first available block of the day
    });

    const dayKeys = Object.keys(days).slice(0, 5);

    dayKeys.forEach(date => {
        const d = days[date];
        const readable = new Date(date).toLocaleDateString("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric"
        });

        container.innerHTML += `
            <div class="forecast-card">
                <h4>${readable}</h4>
                <img src="https://openweathermap.org/img/wn/${d.weather[0].icon}@2x.png">
                <p class="temp">${Math.round(d.main.temp)}°C</p>
                <p>${d.weather[0].description}</p>
                <p>Humidity: ${d.main.humidity}%</p>
                <p>Wind: ${d.wind.speed} m/s</p>
            </div>
        `;
    });
}

/* -------------------- DARK MODE -------------------- */
document.getElementById("theme-toggle").onclick = () => {
    document.body.classList.toggle("dark");
};

/* -------------------- AUTO LOAD CURRENT LOCATION WEATHER -------------------- */
window.addEventListener("load", () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(successLocation, errorLocation);
    } else {
        alert("Geolocation not supported by your browser.");
        console.error("Geolocation not supported.");
        loadDefaultCity();
    }
});

async function successLocation(pos) {
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;

    const url = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`;

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to get city from coordinates");
        const data = await res.json();

        if (data && data.length > 0) {
            const city = data[0].name;
            input.value = city;
            getCurrentWeather(city);
            getForecast(city);
        } else {
            alert("Unable to determine your city from location.");
            loadDefaultCity();
        }
    } catch (err) {
        console.error(err);
        alert(`Error fetching your location: ${err.message}`);
        loadDefaultCity();
    }
}

function errorLocation() {
    alert("Location access denied. Loading default city.");
    loadDefaultCity();
}

function loadDefaultCity() {
    const defaultCity = "Hyderabad"; // Change default city as needed
    input.value = defaultCity;
    getCurrentWeather(defaultCity);
    getForecast(defaultCity);
}
