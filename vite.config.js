import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// In local dev, serve /api/* from the same handler files Vercel deploys.
function localApi() {
  return {
    name: "applyforge-local-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url.startsWith("/api/")) return next();
        const name = req.url.slice(5).split("?")[0];
        if (!/^[a-z]+$/.test(name)) return next();
        let raw = "";
        for await (const chunk of req) raw += chunk;
        req.body = raw ? JSON.parse(raw) : {};
        res.status = (code) => ((res.statusCode = code), res);
        res.json = (data) => {
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(data));
        };
        try {
          const mod = await server.ssrLoadModule(`/api/${name}.js`);
          await mod.default(req, res);
        } catch (e) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: e.message }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), ""));
  return { plugins: [react(), localApi()] };
});
