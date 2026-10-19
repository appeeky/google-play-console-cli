import { createServer } from "node:http";
import { createHandler } from "./app.js";

const apiUrl = process.env.APPEEKY_API_URL;
const gatewaySecret = process.env.STORE_GATEWAY_SECRET;
if (!apiUrl || !gatewaySecret) {
  console.error("APPEEKY_API_URL and STORE_GATEWAY_SECRET are required.");
  process.exit(1);
}

const port = Number(process.env.PORT ?? 8080);
const server = createServer(createHandler({ apiUrl, gatewaySecret }));
server.listen(port, () => {
  console.log(`gps hosted server listening on :${port}`);
});

for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 10_000).unref();
  });
}
