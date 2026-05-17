[![Build](https://github.com/vpetrigo/publish-crate/actions/workflows/test.yml/badge.svg)](https://github.com/vpetrigo/publish-crate/actions/workflows/test.yml)
![GitHub package.json version](https://img.shields.io/github/package-json/v/vpetrigo/publish-crate)
![GitHub License](https://img.shields.io/github/license/vpetrigo/publish-crate)
[![Bun Compatible](https://img.shields.io/badge/Bun-Compatible-F472B6?style=flat&logo=bun&logoColor=white)](https://bun.sh)

# Publish Crates

A GitHub Action to publish Rust crates using [`cargo-workspaces`](https://github.com/pksunkara/cargo-workspaces).

## Features

- Automatically installs `cargo-workspaces` if not already available
- Publishes all changed crates in a workspace via `cargo workspaces publish --from-git`
- Detects which packages have changed since their last publish and optionally skips if there are none
- Configures `git user` as `github-actions[bot]` for automated commits
- Sets `GITHUB_TOKEN` environment variable for authenticated operations
- Supports dry-run, no-verify, and publish delay between crates
- Accepts extra arbitrary arguments for the publish command

## Inputs

| Name                         | Required | Default | Description                                                                 |
| ---------------------------- | -------- | ------- | --------------------------------------------------------------------------- |
| `token`                      | Yes      | -       | GitHub API token                                                            |
| `path`                       | No       | `.`     | Path to crate or workspace                                                  |
| `registry-token`             | Yes      | —       | Cargo registry token for authentication                                     |
| `args`                       | No       | -       | Extra arguments passed to `cargo publish`                                   |
| `dry-run`                    | No       | `false` | If `true`, performs a dry run without publishing                            |
| `check-repo`                 | No       | `true`  | If `true`, checks whether packages have changed since last publish          |
| `publish-delay`              | No       | —       | Delay in milliseconds between publishing each crate                         |
| `no-verify`                  | No       | `false` | If `true`, passes `--no-verify` to skip packaging verification              |
| `ignore-unpublished-changes` | No       | `false` | If `true`, exits gracefully when no changes are detected instead of failing |

## Usage

```yaml
name: Publish

on:
  push:
    branches: [main]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions-rust-lang/setup-rust-toolchain@v1
      - uses: vpetrigo/publish-crate@v1
        with:
          registry-token: ${{ secrets.CARGO_REGISTRY_TOKEN }}
```

### Checking for changes

By default the action checks whether packages have changed since their last
published version. When no changes are detected the workflow fails. To exit
gracefully instead, set `ignore-unpublished-changes: true`:

```yaml
- uses: vpetrigo/publish-crate@v1
  with:
    registry-token: ${{ secrets.CARGO_REGISTRY_TOKEN }}
    ignore-unpublished-changes: true
```

To skip the change check entirely:

```yaml
- uses: vpetrigo/publish-crate@v1
  with:
    registry-token: ${{ secrets.CARGO_REGISTRY_TOKEN }}
    check-repo: false
```

### Dry run

```yaml
- uses: vpetrigo/publish-crate@v1
  with:
    dry-run: true
```

### With extra arguments

```yaml
- uses: vpetrigo/publish-crate@v1
  with:
    registry-token: ${{ secrets.CARGO_REGISTRY_TOKEN }}
    args: "--allow-dirty --no-git-push"
```

### Custom workspace path

```yaml
- uses: vpetrigo/publish-crate@v1
  with:
    path: ./my-crate
    registry-token: ${{ secrets.CARGO_REGISTRY_TOKEN }}
```

### With publish delay

```yaml
- uses: vpetrigo/publish-crate@v1
  with:
    registry-token: ${{ secrets.CARGO_REGISTRY_TOKEN }}
    publish-delay: 5000 # 5 seconds between each crate
```
