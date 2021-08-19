import fs from "fs";
import path from "path";
import { parse } from "../lib";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

function fixture(...args) {
  return path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "fixtures",
    "parse",
    ...args,
  );
}

describe("parse", function () {
  it("should parse using configuration from .babelrc when a filename is provided", function () {
    const input = fs.readFileSync(
      fixture("filename-provided", "input.js"),
      "utf8",
    );
    const output = require(fixture("filename-provided", "output.json"));

    const result = parse(input, {
      filename: fixture("filename-provided", "input.js"),
      cwd: fixture(),
    });
    expect(JSON.parse(JSON.stringify(result))).toEqual(output);
  });

  it("should parse using the specified sourceFileName", function () {
    const input = fs.readFileSync(
      fixture("sourceFileName-provided", "input.js"),
      "utf8",
    );
    const output = require(fixture("sourceFileName-provided", "output.json"));

    const result = parse(input, {
      filename: fixture("sourceFileName-provided", "input.js"),
      sourceFileName: "input.js",
      cwd: fixture(),
    });
    expect(JSON.parse(JSON.stringify(result))).toEqual(output);
  });

  it("should parse using passed in configuration", function () {
    const input = fs.readFileSync(
      fixture("passed-in-configuration", "input.js"),
      "utf8",
    );
    const output = require(fixture("passed-in-configuration", "output.json"));

    const result = parse(input, {
      parserOpts: {
        plugins: [["decorators", { decoratorsBeforeExport: false }]],
      },
      cwd: fixture(),
    });
    expect(JSON.parse(JSON.stringify(result))).toEqual(output);
  });
});
