import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { cp, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { strFromU8, unzipSync } from "fflate";
import { buildPackage, packageFiles, templateValues, versionFromTag } from "../scripts/package.mjs";

const clientDirectory = fileURLToPath(new URL("../", import.meta.url));
const source = new URL("../appPackage/", import.meta.url);
const configuredValues = {
  TEAMS_APP_ID: "6baf3755-a73e-43c6-bc13-56313e3c4b8d",
  APP_NAME_SUFFIX: "-dev",
  MCP_ENDPOINT: "https://demo.contoso.com/mcp",
  MCP_AUTH_CONFIG_ID: "offline-test-auth-config",
};

async function fixture(callback) {
  const directory = await mkdtemp(join(tmpdir(), "declarative-agent-"));
  try {
    await cp(source, directory, { recursive: true });
    await callback(directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

async function mutate(directory, file, callback) {
  const path = join(directory, file);
  const document = JSON.parse(await readFile(path, "utf8"));
  callback(document);
  await writeFile(path, JSON.stringify(document));
}

function cli(args, env = process.env) {
  return spawnSync(process.execPath, ["scripts/package.mjs", ...args], {
    cwd: clientDirectory, encoding: "utf8", env,
  });
}

test("release tags accept canonical numeric versions only in this client namespace", () => {
  for (const version of ["0.0.0", "1.2.3", "10.20.300"]) {
    assert.equal(versionFromTag(`releases/declarative-agent/v${version}`), version);
  }
  for (const tag of [
    "", "v1.2.3", "releases/cowork-plugin/v1.2.3", "releases/server/v1.2.3",
    "releases/declarative-agent/v1.2", "releases/declarative-agent/v1.2.3.4",
    "releases/declarative-agent/v1.2.3-beta", "releases/declarative-agent/v1.2.3+build",
    "releases/declarative-agent/v01.2.3", "releases/declarative-agent/v1.02.3",
    "releases/declarative-agent/v1.2.03", "releases/declarative-agent/v1.2.3\n",
    "releases/declarative-agent/v1.2.3/extra", "releases/declarative-agent/v$(echo unsafe)",
  ]) {
    assert.throws(() => versionFromTag(tag), /Expected a tag/);
  }
});

test("offline template links app to agent to authenticated dynamic MCP action", async () => {
  const { bytes, manifest, agent, plugin } = await buildPackage();
  const entries = unzipSync(bytes);
  assert.deepEqual(Object.keys(entries).sort(), packageFiles);
  assert.equal(manifest.copilotAgents.declarativeAgents[0].file, "declarativeAgent.json");
  assert.equal(agent.actions[0].file, "ai-plugin.json");
  assert.ok(agent.instructions.includes(`from the ${plugin.namespace} action`));
  assert.equal(agent.name, manifest.name.short);
  assert.equal(plugin.runtimes[0].auth.type, "OAuthPluginVault");
  assert.equal(plugin.runtimes[0].auth.reference_id, templateValues.MCP_AUTH_CONFIG_ID);
  assert.equal(plugin.runtimes[0].spec.url, templateValues.MCP_ENDPOINT);
  assert.deepEqual(plugin.functions, []);
  assert.deepEqual(plugin.runtimes[0].run_for_functions, ["*"]);
  assert.match(agent.instructions, /First call whoami with \{\}/);
  assert.match(agent.instructions, /Then call echo/);
  assert.match(agent.instructions, /Hello from Microsoft 365 Copilot/);
  assert.match(agent.instructions, /1-4000/);
  assert.doesNotMatch(Object.values(entries).map(strFromU8).join(""), /\$\{\{/);
  const cowork = JSON.parse(await readFile(new URL("../../cowork-plugin/appPackage/manifest.json", import.meta.url)));
  assert.notEqual(manifest.id, cowork.id);
});

test("configured rendering resolves the same source without including unrelated environment values", async () => {
  const result = await buildPackage({
    configured: true,
    values: { ...configuredValues, UNUSED_LOCAL_VALUE: "must-not-be-packaged" },
  });
  assert.equal(result.manifest.id, configuredValues.TEAMS_APP_ID);
  assert.equal(result.agent.name, "Entra Auth MCP Lab - Chat-dev");
  assert.equal(result.manifest.name.short, result.agent.name);
  assert.equal(result.manifest.name.full, "Entra Auth MCP Lab - Chat-dev");
  assert.equal(result.plugin.runtimes[0].spec.url, configuredValues.MCP_ENDPOINT);
  assert.equal(result.plugin.runtimes[0].auth.reference_id, configuredValues.MCP_AUTH_CONFIG_ID);
  const entries = unzipSync(result.bytes);
  assert.doesNotMatch(Object.values(entries).map(strFromU8).join(""), /must-not-be-packaged/);
  const template = await buildPackage();
  assert.equal(result.agent.instructions, template.agent.instructions);
});

test("ATK creates the app with the same name used by both source manifests", async () => {
  const lifecycle = await readFile(new URL("../m365agents.yml", import.meta.url), "utf8");
  const manifest = JSON.parse(await readFile(new URL("manifest.json", source), "utf8"));
  const agent = JSON.parse(await readFile(new URL("declarativeAgent.json", source), "utf8"));
  const creationName = /^\s+name: (.+)$/m.exec(lifecycle)?.[1];
  assert.equal(creationName, manifest.name.short);
  assert.equal(creationName, agent.name);
});

test("configured suffixes fit the 30-character short name without truncation", async () => {
  const suffix = "-1234";
  const result = await buildPackage({
    configured: true, values: { ...configuredValues, APP_NAME_SUFFIX: suffix },
  });
  assert.equal(result.manifest.name.short, `Entra Auth MCP Lab - Chat${suffix}`);
  assert.equal(result.agent.name, result.manifest.name.short);
  await assert.rejects(buildPackage({
    configured: true, values: { ...configuredValues, APP_NAME_SUFFIX: `${suffix}0` },
  }), /Invalid app manifest.*30 characters/);
});

test("missing, unknown, and recursively unresolved ATK variables are rejected", async () => {
  for (const key of ["TEAMS_APP_ID", "MCP_ENDPOINT", "MCP_AUTH_CONFIG_ID"]) {
    const values = { ...configuredValues };
    delete values[key];
    await assert.rejects(buildPackage({ configured: true, values }), /Missing value/);
  }
  await fixture(async (directory) => {
    await mutate(directory, "ai-plugin.json", (p) => { p.runtimes[0].spec.url = "${{UNEXPECTED}}"; });
    await assert.rejects(buildPackage({ directory }), /Unknown ATK variable/);
  });
  await assert.rejects(buildPackage({
    configured: true, values: { ...configuredValues, MCP_AUTH_CONFIG_ID: "${{OTHER}}" },
  }), /Unresolved ATK/);
});

test("configured packaging rejects the shipped template and invalid release versions", async () => {
  await assert.rejects(buildPackage({ configured: true, values: templateValues }), /Replace template/);
  for (const version of ["1.2", "01.2.3", "1.2.3-rc", "1.2.3\n"]) {
    await assert.rejects(buildPackage({ version }), /Agent package version/);
  }
  for (const [key, value] of [
    ["MCP_ENDPOINT", "https://mcp.example.com/mcp"],
    ["MCP_AUTH_CONFIG_ID", "REPLACE_WITH_REGISTRATION"],
  ]) {
    await assert.rejects(buildPackage({
      configured: true, values: { ...configuredValues, [key]: value },
    }), /Replace template/);
  }
});

test("all three schemas and cross-file references are validated", async () => {
  for (const [index, [file, change]] of [
    ["manifest.json", (m) => { m.unrecognized = true; }],
    ["declarativeAgent.json", (a) => { delete a.instructions; }],
    ["ai-plugin.json", (p) => { p.runtimes[0].auth.type = "Invalid"; }],
    ["manifest.json", (m) => { m.copilotAgents.declarativeAgents[0].file = "../outside.json"; }],
    ["manifest.json", (m) => { m.copilotAgents.declarativeAgents[0].id = "anotherAgent"; }],
    ["declarativeAgent.json", (a) => { a.actions[0].file = "missing.json"; }],
    ["declarativeAgent.json", (a) => { a.actions[0].id = "anotherAction"; }],
    ["declarativeAgent.json", (a) => { a.actions.push({ id: "another", file: "ai-plugin.json" }); }],
    ["ai-plugin.json", (p) => { p.runtimes[0].auth.type = "None"; }],
    ["ai-plugin.json", (p) => { p.namespace = "AnotherLab"; }],
    ["ai-plugin.json", (p) => { p.runtimes[0].run_for_functions = ["whoami"]; }],
    ["ai-plugin.json", (p) => { p.runtimes[0].spec.mcp_tool_description = { file: "tools.json" }; }],
  ].entries()) {
    await fixture(async (directory) => {
      await mutate(directory, file, change);
      await assert.rejects(buildPackage({ directory }), /Invalid .* manifest|Expected one/,
        `mutation ${index}: ${file}`);
    });
  }
});

test("MCP URL requires HTTPS /mcp and cannot carry credentials, query, or fragment", async () => {
  for (const url of [
    "http://demo.contoso.com/mcp", "https://demo.contoso.com/",
    "https://user:password@demo.contoso.com/mcp", "https://demo.contoso.com/mcp?token=test",
    "https://demo.contoso.com/mcp#fragment",
  ]) {
    await assert.rejects(buildPackage({
      configured: true, values: { ...configuredValues, MCP_ENDPOINT: url },
    }), /HTTPS|Invalid plugin manifest/);
  }
});

test("extra files, missing files, symlinks, and invalid icons cannot enter the package", async () => {
  await fixture(async (directory) => {
    await writeFile(join(directory, ".env"), "LOCAL_ONLY=test");
    await assert.rejects(buildPackage({ directory }), /must contain only/);
  });
  await fixture(async (directory) => {
    await rm(join(directory, "outline.png"));
    await assert.rejects(buildPackage({ directory }), /must contain only/);
    await symlink(join(directory, "color.png"), join(directory, "outline.png"));
    await assert.rejects(buildPackage({ directory }), /symlinks are not allowed/);
  });
  await fixture(async (directory) => {
    await cp(join(directory, "outline.png"), join(directory, "color.png"));
    await assert.rejects(buildPackage({ directory }), /192x192 PNG/);
  });
});

test("release stamp changes the ZIP only and leaves other client/server versions alone", async () => {
  const paths = [
    new URL("manifest.json", source),
    new URL("../package.json", import.meta.url),
    new URL("../../cowork-plugin/appPackage/manifest.json", import.meta.url),
    new URL("../../../server/package.json", import.meta.url),
  ];
  const originals = await Promise.all(paths.map((path) => readFile(path)));
  const result = await buildPackage({ version: versionFromTag("releases/declarative-agent/v2.3.4") });
  assert.equal(result.fileName, "entra-auth-mcp-lab-declarative-agent-template-2.3.4.zip");
  assert.equal(JSON.parse(strFromU8(unzipSync(result.bytes)["manifest.json"])).version, "2.3.4");
  assert.deepEqual(await Promise.all(paths.map((path) => readFile(path))), originals);
  assert.deepEqual((await buildPackage({ version: "2.3.4" })).bytes, result.bytes);
});

test("CLI rejects bad tags and conflicting options, and does not read ambient connection values", () => {
  for (const args of [
    ["--tag", "releases/cowork-plugin/v1.2.3"],
    ["--tag", "releases/declarative-agent/v1.2.3-rc"],
    ["--tag", "releases/declarative-agent/v1.2.3", "--configured"],
    ["--tag", "releases/declarative-agent/v1.2.3", "--version", "1.2.3"],
    ["--connection-file", "anything"],
  ]) {
    const result = cli(args);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Expected a tag|cannot be combined|requires --configured/);
    assert.equal(result.stdout, "");
  }
  const result = cli(["--configured", "--connection-file", "env/.env.dev.example"], {
    ...process.env, ...configuredValues,
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Missing value/);
});

test("CLI packages a tag and configured env file without modifying either", async () => {
  const output = join(clientDirectory, "build/entra-auth-mcp-lab-declarative-agent-template-9.8.7.zip");
  const configuredOutput = join(clientDirectory, "build/entra-auth-mcp-lab-declarative-agent-configured-1.0.0.zip");
  const temporary = await mkdtemp(join(tmpdir(), "agent-env-"));
  const envFile = join(temporary, "connection.env");
  const envText = Object.entries(configuredValues).map(([key, value]) => `${key}=${value}`).join("\n");
  await writeFile(envFile, `${envText}\nUNUSED_LOCAL_VALUE=excluded\n`);
  try {
    assert.equal(cli(["--tag", "releases/declarative-agent/v9.8.7"]).status, 0);
    assert.equal(JSON.parse(strFromU8(unzipSync(await readFile(output))["manifest.json"])).version, "9.8.7");
    const result = cli(["--configured", "--connection-file", envFile]);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Configured package \(not live-tested\)/);
    const entries = unzipSync(await readFile(configuredOutput));
    assert.equal(JSON.parse(strFromU8(entries["manifest.json"])).id, configuredValues.TEAMS_APP_ID);
    assert.match(await readFile(envFile, "utf8"), /UNUSED_LOCAL_VALUE=excluded/);
  } finally {
    await rm(output, { force: true });
    await rm(configuredOutput, { force: true });
    await rm(temporary, { recursive: true, force: true });
  }
});

test("ZIPs are reproducible across time zones", () => {
  const code = 'import {buildPackage} from "./scripts/package.mjs"; import {createHash} from "node:crypto"; console.log(createHash("sha256").update((await buildPackage()).bytes).digest("hex"));';
  const hashes = ["UTC", "America/Los_Angeles", "Asia/Tokyo"].map((TZ) => {
    const result = spawnSync(process.execPath, ["--input-type=module", "-e", code], {
      cwd: clientDirectory, encoding: "utf8", env: { ...process.env, TZ },
    });
    assert.equal(result.status, 0, result.stderr);
    return result.stdout.trim();
  });
  assert.equal(new Set(hashes).size, 1);
});

test("reviewed official schemas retain their checksums", async () => {
  for (const [file, expected] of [
    ["MicrosoftTeams.v1.30.schema.json", "dfc85799e94527a16a622988620c82de1f58e790f97001e5e6bbe37fcf6846df"],
    ["declarative-agent.v1.9.schema.json", "102abde77894ed0d30c5e097a1b17181a16527865fdcd2f824e2578799abd3a5"],
    ["plugin.v2.4.schema.json", "ea3016aa4917e1b714454a6a7be9444f8aa7a1923cba0a42343a6fd234a0eb00"],
  ]) {
    const bytes = await readFile(new URL(`../schema/${file}`, import.meta.url));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), expected);
  }
});
