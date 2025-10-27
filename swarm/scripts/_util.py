import argparse
import sys
from typing import Literal


OutputFormat = Literal["text", "jsonl"]


def add_common_flags(p: argparse.ArgumentParser) -> None:
    qv = p.add_mutually_exclusive_group()
    qv.add_argument("-q", "--quiet", action="store_true", help="Suppress diagnostics")
    qv.add_argument("-v", "--verbose", action="store_true", help="Verbose diagnostics")
    p.add_argument(
        "-o",
        "--output-format",
        choices=["text", "jsonl"],
        default="text",
        help="Select output format (default: text)",
    )


def log(ns: argparse.Namespace, *msg: str) -> None:
    if getattr(ns, "verbose", False) and not getattr(ns, "quiet", False):
        print(*msg, file=sys.stderr)
"""
Helpers shared across Swarm subcommands.

Provides:
- add_common_flags(parser): adds --quiet/--verbose (mutually exclusive) and
  --output-format {text,jsonl} with default text.
- log(ns, ...): diagnostic printing to stderr when --verbose and not --quiet.

Usage in a new subcommand file mirrors the examples in this repository's cmd_*.py files.
"""
