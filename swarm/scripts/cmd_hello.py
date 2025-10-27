import argparse
import json

from ._util import add_common_flags, log


def add_parser(sp: argparse._SubParsersAction[argparse.ArgumentParser]) -> None:
    p = sp.add_parser("hello", help="Print 'hello world' with output-format control")
    add_common_flags(p)
    p.set_defaults(_run=run)


def run(ns: argparse.Namespace) -> int:
    log(ns, "[info] running hello")
    if ns.output_format == "jsonl":
        print(json.dumps({"message": "hello world"}, separators=(",", ":")))
    else:
        print("hello world")
    return 0
"""
Hello subcommand example for Swarm; shows output-format and diagnostics.
Use `--output-format jsonl` for jq-friendly pipelines.
"""
