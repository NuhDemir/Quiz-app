const { spawn } = require("child_process");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");

const netlifyCommand =
  'npx netlify dev --functions netlify/functions --command "npm run frontend:dev" --target-port 3000 --port 8888';

console.log("➡️  Netlify dev başlatılıyor (frontend + functions)...");
console.log(
  "   • Vite dev sunucusu: http://localhost:3000 (Netlify proxy üzerinden 8888)"
);
console.log("   • Netlify proxy: http://localhost:8888");

const netlify = spawn(netlifyCommand, {
  cwd: rootDir,
  stdio: "inherit",
  shell: true,
});

netlify.on("error", (error) => {
  console.error(
    "Netlify CLI başlatılamadı. Lütfen `npm install -g netlify-cli` ile kurulu olduğundan emin olun."
  );
  console.error(error.message);
  process.exitCode = 1;
});

const shutdown = (signal) => {
  if (netlify && !netlify.killed) {
    netlify.kill("SIGINT");
  }
  process.exit();
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

netlify.on("exit", (code) => {
  if (code && code !== 0) {
    console.error(`Netlify dev süreci ${code} kodu ile kapandı.`);
  }
  process.exit(code ?? 0);
});
