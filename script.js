export default async function handler(req, res) {
  try {
    const { type, city, lat, lon } = req.query;
    const key = process.env.OPENWEATHER_API_KEY;

    let url = "";

    if (type === "current") {
      url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${key}`;
    }

    if (type === "forecast") {
      url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${key}`;
    }

    if (type === "aqi") {
      url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${key}`;
    }

    if (type === "geocode") {
      url = `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${key}`;
    }

    if (type === "reverse") {
      url = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${key}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
}
