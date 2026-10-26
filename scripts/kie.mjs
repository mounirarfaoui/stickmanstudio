// Minimal kie.ai client: submit a market task, poll it, download results.
// Reads KIE_API_KEY from the environment or from the git-ignored .env file.
import fs from "node:fs";

const loadKey = () => {
  if (process.env.KIE_API_KEY) return process.env.KIE_API_KEY;
  const env = new URL("../.env", import.meta.url);
  if (fs.existsSync(env)) {
    const m = fs.readFileSync(env, "utf8").match(/^KIE_API_KEY=(.+)$/m);
    if (m) return m[1].trim();
  }
  throw new Error("Set KIE_API_KEY in the environment or in .env");
};

const KEY = loadKey();
const BASE = "https://api.kie.ai";

const call = async (method, path, body) => {
  const res = await fetch(BASE + path, {
    method,
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (json.code !== 200) throw new Error(`${path} -> ${JSON.stringify(json)}`);
  return json.data;
};

export const createTask = async (model, input) => {
  const data = await call("POST", "/api/v1/jobs/createTask", { model, input });
  console.log(`submitted ${model}: taskId ${data.taskId}`);
  return data.taskId;
};

export const waitForTask = async (taskId, { intervalMs = 5000, timeoutMs = 15 * 60 * 1000 } = {}) => {
  const start = Date.now();
  for (;;) {
    const data = await call("GET", `/api/v1/jobs/recordInfo?taskId=${taskId}`);
    if (data.state === "success") return data;
    if (data.state === "fail") throw new Error(`task ${taskId} failed: ${data.failMsg}`);
    if (Date.now() - start > timeoutMs) throw new Error(`task ${taskId} timed out in state ${data.state}`);
    await new Promise((r) => setTimeout(r, intervalMs));
  }
};

export const download = async (url, dest) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download ${url} -> ${res.status}`);
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  console.log(`saved ${dest.pathname ?? dest}`);
};

export const credits = () => call("GET", "/api/v1/chat/credit");
