import argparse

from ._util import add_common_flags


def add_parser(sp: argparse._SubParsersAction[argparse.ArgumentParser]) -> None:
    p = sp.add_parser("echo", help="Echo text back deterministically")
    p.add_argument("text", help="Text to echo")
    add_common_flags(p)
    p.set_defaults(_run=run)


def run(ns: argparse.Namespace) -> int:
    print(ns.text)
    return 0
"""
Echo subcommand example for Swarm.

Follow the same pattern for new subcommands: define `add_parser(sp)`, call
`add_common_flags`, implement `run(ns)`, and return an int exit code.
"""
