export default async function handler(req, res) {
  try {
    const { type, city, lat, lon } = req.query;
    const key = process.env.OPENWEATHER_API_KEY;

    if (!key) {
      return res.status(500).json({ error: "Missing API key" });
    }

    let url = "";

    switch (type) {
      case "current":
        url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${key}`;
        break;

      case "forecast":
        url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${key}`;
        break;

      case "aqi":
        url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${key}`;
        break;

      case "geocode":
        url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${key}`;
        break;

      case "reverse":
        url = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${key}`;
        break;

      default:
        return res.status(400).json({ error: "Invalid type parameter" });
    }

    const response = await fetch(url);
    const data = await response.json();

    return res.status(200).json(data);

  } catch (err) {
    console.error("API Error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
