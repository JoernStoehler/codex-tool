import argparse
import sys

from . import cmd_echo, cmd_hello


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="swarm-cli",
        description="Swarm CLI",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    sp = p.add_subparsers(dest="cmd", required=True)
    cmd_echo.add_parser(sp)
    cmd_hello.add_parser(sp)
    return p


def main(argv: list[str] | None = None) -> int:
    ns = build_parser().parse_args(argv)
    run = getattr(ns, "_run", None)
    if run is None:
        print("no runner bound", file=sys.stderr)
        return 2
    return int(run(ns) or 0)


if __name__ == "__main__":
    raise SystemExit(main())
"""
Swarm CLI entrypoint and subcommand registry.

How to add a new subcommand:
- Create `cmd_<name>.py` in this folder with `add_parser(sp)` and `run(ns) -> int`.
- In `add_parser` create a subparser, add args, call `add_common_flags`, and bind
  handler via `p.set_defaults(_run=run)`.
- Import and register it below alongside existing commands.

Conventions: deterministic stdout, diagnostics to stderr, exit codes 0/2/>2,
and standard flags `--quiet/--verbose/--output-format text|jsonl`.
"""
