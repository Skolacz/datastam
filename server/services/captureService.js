require("dotenv").config();

const BASE_URL = process.env.CAPTURE_API_URL;
const API_KEY = process.env.CAPTURE_API_KEY;

console.log("Capture URL:", BASE_URL);
console.log("Capture KEY:", API_KEY);

async function captureStory(url) {
  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY
    },
    body: JSON.stringify({ url })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Capture API failed: ${text}`);
  }

  const data = await response.json();
  return data;
}

module.exports = {
  captureStory
};
