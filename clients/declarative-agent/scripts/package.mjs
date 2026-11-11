import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { resolve, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs, parseEnv } from "node:util";
import Ajv from "ajv-draft-04";
import addFormats from "ajv-formats";
import { zipSync } from "fflate";
import appSchema from "../schema/MicrosoftTeams.v1.30.schema.json" with { type: "json" };
import agentSchema from "../schema/declarative-agent.v1.9.schema.json" with { type: "json" };
import pluginSchema from "../schema/plugin.v2.4.schema.json" with { type: "json" };

const clientDirectory = fileURLToPath(new URL("../", import.meta.url));
const appDirectory = resolve(clientDirectory, "appPackage");
export const packageFiles = [
  "ai-plugin.json",
  "color.png",
  "declarativeAgent.json",
  "manifest.json",
  "outline.png",
];
export const templateValues = {
  TEAMS_APP_ID: "a7fd7e02-32f3-4f4f-9256-38f1b287e5f2",
  APP_NAME_SUFFIX: "",
  MCP_ENDPOINT: "https://mcp.example.com/mcp",
  MCP_AUTH_CONFIG_ID: "REPLACE_WITH_OAUTH_REGISTRATION_ID",
};
const versionPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validators = [appSchema, agentSchema, pluginSchema].map((schema) => ajv.compile(schema));

export function versionFromTag(tag) {
  const prefix = "releases/declarative-agent/v";
  if (!tag.startsWith(prefix) || !versionPattern.test(tag.slice(prefix.length))) {
    throw new Error("Expected a tag in the form releases/declarative-agent/vX.Y.Z (no prerelease or leading zeros).");
  }
  return tag.slice(prefix.length);
}

async function listFiles(directory, root = directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(path, root));
    else if (entry.isFile()) files.push(relative(root, path).split(sep).join("/"));
    else throw new Error(`Unsupported package entry (symlinks are not allowed): ${path}`);
  }
  return files.sort();
}

function render(value, values) {
  if (typeof value === "string") {
    const rendered = value.replace(/\$\{\{([^}]+)\}\}/g, (_, key) => {
      if (!Object.hasOwn(templateValues, key)) throw new Error(`Unknown ATK variable: ${key}`);
      if (typeof values[key] !== "string" || (key !== "APP_NAME_SUFFIX" && !values[key].trim())) {
        throw new Error(`Missing value for ATK variable: ${key}`);
      }
      return values[key];
    });
    if (rendered.includes("${{") || rendered.includes("$[file(")) {
      throw new Error("Unresolved ATK variable or file inclusion.");
    }
    return rendered;
  }
  if (Array.isArray(value)) return value.map((item) => render(item, values));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, render(item, values)]));
  }
  return value;
}

function validateIcon(bytes, size, name) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (bytes.length < 33 || !bytes.subarray(0, 8).equals(signature)
    || bytes.toString("ascii", 12, 16) !== "IHDR"
    || bytes.readUInt32BE(16) !== size || bytes.readUInt32BE(20) !== size) {
    throw new Error(`${name} must be a ${size}x${size} PNG.`);
  }
}

export async function buildPackage({
  directory = appDirectory,
  version,
  configured = false,
  values = {},
} = {}) {
  const files = await listFiles(directory);
  if (JSON.stringify(files) !== JSON.stringify(packageFiles)) {
    throw new Error(`Package must contain only: ${packageFiles.join(", ")}`);
  }
  const entries = Object.fromEntries(await Promise.all(
    files.map(async (name) => [name, await readFile(resolve(directory, name))]),
  ));
  const documents = ["manifest.json", "declarativeAgent.json", "ai-plugin.json"].map(
    (name) => render(JSON.parse(entries[name].toString("utf8")),
      configured ? { APP_NAME_SUFFIX: "", ...values } : templateValues),
  );
  const [manifest, agent, plugin] = documents;
  if (version !== undefined) manifest.version = version;
  if (!versionPattern.test(manifest.version)) {
    throw new Error("Agent package version must be X.Y.Z (no prerelease or leading zeros).");
  }
  for (const [index, document] of documents.entries()) {
    if (!validators[index](document)) {
      throw new Error(`Invalid ${["app", "agent", "plugin"][index]} manifest: ${ajv.errorsText(validators[index].errors)}`);
    }
  }
  const agents = manifest.copilotAgents?.declarativeAgents;
  if (manifest.manifestVersion !== "1.30" || agents?.length !== 1
    || agents[0].id !== "entraMcpAgent" || agents[0].file !== "declarativeAgent.json"
    || manifest.agentConnectors !== undefined || manifest.agentSkills !== undefined
    || agent.version !== "v1.9" || agent.actions?.length !== 1
    || agent.actions[0].id !== "entraMcp" || agent.actions[0].file !== "ai-plugin.json"
    || !agent.instructions?.trim()
    || agent.capabilities !== undefined || agent.agent_skills !== undefined) {
    throw new Error("Expected one declarative agent referencing one MCP action, with no extra capabilities.");
  }
  const runtime = plugin.runtimes?.[0];
  if (plugin.schema_version !== "v2.4" || plugin.namespace !== "EntraMcp"
    || plugin.functions?.length !== 0 || plugin.runtimes?.length !== 1
    || runtime?.type !== "RemoteMCPServer"
    || runtime.auth?.type !== "OAuthPluginVault" || !runtime.auth.reference_id?.trim()
    || JSON.stringify(runtime.run_for_functions) !== '["*"]'
    || runtime.spec?.mcp_tool_description !== undefined) {
    throw new Error("Expected one OAuthPluginVault RemoteMCPServer action with dynamic tool discovery.");
  }
  const endpoint = new URL(runtime.spec.url);
  if (endpoint.protocol !== "https:" || endpoint.pathname !== "/mcp"
    || endpoint.username || endpoint.password || endpoint.search || endpoint.hash) {
    throw new Error("MCP endpoint must be an HTTPS URL ending in /mcp without credentials, query, or fragment.");
  }
  if (manifest.icons.color !== "color.png" || manifest.icons.outline !== "outline.png") {
    throw new Error("Manifest icons must reference color.png and outline.png.");
  }
  validateIcon(entries["color.png"], 192, "color.png");
  validateIcon(entries["outline.png"], 32, "outline.png");
  if (configured) {
    const serialized = JSON.stringify(documents);
    if (serialized.includes("REPLACE_") || manifest.id === templateValues.TEAMS_APP_ID
      || /(^|\.)example\.(com|net|org)$/.test(endpoint.hostname)
      || endpoint.hostname.endsWith(".invalid")) {
      throw new Error("Replace template app ID, placeholders, and reserved-domain MCP endpoints before configured packaging.");
    }
  }
  for (const [index, name] of ["manifest.json", "declarativeAgent.json", "ai-plugin.json"].entries()) {
    entries[name] = Buffer.from(`${JSON.stringify(documents[index], null, 2)}\n`);
  }
  // A fixed ZIP timestamp makes the release independent of build time and timezone.
  const zippedEntries = Object.fromEntries(Object.entries(entries).map(
    ([name, bytes]) => [name, [bytes, { mtime: new Date(2020, 0, 1) }]],
  ));
  return {
    manifest,
    agent,
    plugin,
    fileName: `entra-mcp-declarative-agent-${configured ? "configured" : "template"}-${manifest.version}.zip`,
    bytes: zipSync(zippedEntries),
  };
}

async function main() {
  const { values } = parseArgs({
    options: {
      tag: { type: "string" },
      version: { type: "string" },
      configured: { type: "boolean", default: false },
      "connection-file": { type: "string" },
    },
  });
  if (values.tag && (values.version || values.configured || values["connection-file"])) {
    throw new Error("--tag cannot be combined with --version, --configured, or --connection-file.");
  }
  if (values["connection-file"] && !values.configured) {
    throw new Error("--connection-file requires --configured.");
  }
  const result = await buildPackage({
    version: values.tag ? versionFromTag(values.tag) : values.version,
    configured: values.configured,
    values: values.configured
      ? parseEnv(await readFile(resolve(values["connection-file"] ?? resolve(clientDirectory, "env/.env.dev")), "utf8"))
      : {},
  });
  const output = resolve(clientDirectory, "build", result.fileName);
  await mkdir(resolve(clientDirectory, "build"), { recursive: true });
  await writeFile(output, result.bytes);
  console.log(`${values.configured ? "Configured package (not live-tested)" : "Configuration template (not install-ready)"}: ${output}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
