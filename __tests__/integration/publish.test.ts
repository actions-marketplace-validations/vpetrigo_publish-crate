import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { execSync } from "child_process";
import * as core from "@actions/core";
import { exec } from "@actions/exec";
import * as io from "@actions/io";
import { install, checkForModifiedPackages, run } from "../../src";

jest.mock("@actions/core");

const mockedCore = jest.mocked(core);

const tempDirs: string[] = [];

function setupFixture(fixtureName: string, tag?: string): string {
    const src = path.join(__dirname, "..", "fixtures", fixtureName);
    const dest = fs.mkdtempSync(path.join(os.tmpdir(), "publish-crates-test-"));
    tempDirs.push(dest);
    fs.cpSync(src, dest, { recursive: true });
    execSync("git init", { cwd: dest });
    execSync("git config commit.gpgsign false", { cwd: dest });
    execSync("git config user.email \"test@test.com\"", { cwd: dest });
    execSync("git config user.name \"Test\"", { cwd: dest });
    execSync("git add -A", { cwd: dest });
    execSync("git commit -m \"initial\"", { cwd: dest });
    if (tag) {
        execSync(`git tag ${tag}`, { cwd: dest });
    }
    return dest;
}

afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
        fs.rmSync(dir, { recursive: true, force: true });
    }
});

describe("install", () => {
    it("returns a valid path to the cargo binary", async () => {
        const cargoPath = await install();

        expect(typeof cargoPath).toBe("string");
        expect(cargoPath.length).toBeGreaterThan(0);
        expect(fs.existsSync(cargoPath)).toBe(true);
    });
});

describe("checkForModifiedPackages", () => {
    it("throws when cargo workspaces changed list is unsupported", async () => {
        const cargoPath = await io.which("cargo", true);
        const workdir = setupFixture("single-crate", "v0.1.0");

        await expect(
            checkForModifiedPackages(cargoPath, workdir)
        ).rejects.toThrow();
    });

    it("throws when cargo workspaces is not installed or command fails", async () => {
        await expect(
            checkForModifiedPackages("cargo", path.join(os.tmpdir(), "nonexistent-dir-xyz"))
        ).rejects.toThrow();
    });
});

describe("dry-run publish", () => {
    it("cargo publish --dry-run succeeds for standalone crate", async () => {
        const workdir = setupFixture("single-crate", "v0.1.0");
        const cargoPath = await io.which("cargo", true);

        await exec(cargoPath, ["publish", "--dry-run"], { cwd: workdir });
    });

    it("cargo publish --dry-run fails for crate with unresolvable path dependency", async () => {
        const workdir = setupFixture("workspace", "v0.1.0");
        const crateB = path.join(workdir, "crate-b");
        const cargoPath = await io.which("cargo", true);

        await expect(
            exec(cargoPath, ["publish", "--dry-run"], { cwd: crateB })
        ).rejects.toThrow();
    });
});

describe("run end-to-end", () => {
    function mockInputs(overrides: Record<string, string> = {}): void {
        const defaults: Record<string, string> = {
            token: "ghp_test_token",
            "registry-token": "",
            path: ".",
            args: "",
            "dry-run": "true",
            "check-repo": "false",
            "publish-delay": "",
            "no-verify": "false",
            "ignore-unpublished-changes": "false",
        };

        const inputs = { ...defaults, ...overrides };

        mockedCore.getInput.mockImplementation((name: string) => inputs[name] ?? "");
        mockedCore.getBooleanInput.mockImplementation((name: string) => {
            const val = inputs[name];
            if (val === "true") return true;
            if (val === "false") return false;
            throw new TypeError(`Input does not meet YAML 1.2 "Core Schema" specification: ${name}`);
        });
    }

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("run() with dry-run completes without setFailed for workspace", async () => {
        const workdir = setupFixture("workspace", "v0.1.0");
        mockInputs({ "dry-run": "true", "check-repo": "false", path: workdir });

        await run();

        expect(mockedCore.setFailed).not.toHaveBeenCalled();
        expect(mockedCore.info).toHaveBeenCalledWith("Successfully published crates");
    });

    it("run() with check-repo=true fails due to unsupported cargo workspaces changed list", async () => {
        const workdir = setupFixture("workspace", "v0.1.0");
        mockInputs({ "check-repo": "true", path: workdir });

        await run();

        expect(mockedCore.setFailed).toHaveBeenCalled();
    });
});
