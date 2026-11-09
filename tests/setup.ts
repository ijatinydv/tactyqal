import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// isolate component fixtures so one assertion cannot inherit another test's dom
 afterEach(cleanup);
