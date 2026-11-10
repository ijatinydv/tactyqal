import { runCli } from "./wordpress/import.mjs";

// keep the supported migration command as a small wrapper over the testable importer
try {
  await runCli();
} catch (error) {
  console.error(error instanceof Error ? error.message : "WordPress import failed.");
  process.exitCode = 1;
}
