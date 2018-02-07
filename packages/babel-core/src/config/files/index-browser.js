// @flow

export type ConfigFile = {
  filepath: string,
  dirname: string,
  options: {},
};

export type IgnoreFile = {
  filepath: string,
  dirname: string,
  ignore: Array<string>,
};

export type RelativeConfig = {
  config: ConfigFile | null,
  ignore: IgnoreFile | null,
};

export function findRelativeConfig(
  filepath: string,
  envName: string, // eslint-disable-line no-unused-vars
): RelativeConfig {
  return { config: null, ignore: null };
}

export function loadConfig(name: string, dirname: string): ConfigFile {
  throw new Error(`Cannot load ${name} relative to ${dirname} in a browser`);
}

// eslint-disable-next-line no-unused-vars
export function resolvePlugin(name: string, dirname: string): string | null {
  return null;
}

// eslint-disable-next-line no-unused-vars
export function resolvePreset(name: string, dirname: string): string | null {
  return null;
}

export function loadPlugin(
  name: string,
  dirname: string,
): { filepath: string, value: mixed } {
  throw new Error(
    `Cannot load plugin ${name} relative to ${dirname} in a browser`,
  );
}

export function loadPreset(
  name: string,
  dirname: string,
): { filepath: string, value: mixed } {
  throw new Error(
    `Cannot load preset ${name} relative to ${dirname} in a browser`,
  );
}
