// Same as fetch(), but keeps retrying while the free Render server is waking up
// (a sleeping Render server can need 30-60 seconds before it answers).
// It only gives up (and returns the last answer) after about 2 minutes.
export const fetchWithRetry = async (url, options = {}, tries = 14) => {
  let delay = 1500;
  let lastError = new Error("Server not reachable");
  for (let i = 0; i < tries; i++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);
      const type = res.headers.get("content-type") || "";
      if (res.ok && type.includes("json")) return res; // a real answer from the API
    } catch (e) {
      clearTimeout(timer);
      lastError = e;
    }
    await new Promise((resolve) => setTimeout(resolve, delay));
    delay = Math.min(delay * 1.5, 6000);
  }
  throw lastError;
};