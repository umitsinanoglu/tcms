#!/usr/bin/env python3
"""
TCMS Changelog Updater Script
Allows quick addition of formatted entries under [Unreleased] in CHANGELOG.md.

Usage:
  python3 scripts/update_changelog.py --type added --msg "New feature description"
  python3 scripts/update_changelog.py --type fixed --msg "Bug fix description"
  python3 scripts/update_changelog.py --interactive
"""

import os
import sys
import argparse
from datetime import datetime

CHANGELOG_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "CHANGELOG.md")

CATEGORY_MAP = {
    "added": "### Added",
    "changed": "### Changed",
    "fixed": "### Fixed",
    "deprecated": "### Deprecated",
    "removed": "### Removed",
    "security": "### Security"
}

def add_changelog_entry(category_type: str, message: str):
    category_key = category_type.lower()
    if category_key not in CATEGORY_MAP:
        print(f"❌ Invalid category '{category_type}'. Valid options: {', '.join(CATEGORY_MAP.keys())}")
        sys.exit(1)

    category_heading = CATEGORY_MAP[category_key]
    entry_line = f"- {message.strip()}\n"

    if not os.path.exists(CHANGELOG_PATH):
        print(f"❌ CHANGELOG.md not found at {CHANGELOG_PATH}")
        sys.exit(1)

    with open(CHANGELOG_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    # Find [Unreleased] section
    unreleased_idx = content.find("## [Unreleased]")
    if unreleased_idx == -1:
        print("❌ Could not find '## [Unreleased]' section in CHANGELOG.md")
        sys.exit(1)

    # Find where the next release section starts or end of unreleased
    next_section_idx = content.find("\n## [", unreleased_idx + 15)

    if next_section_idx == -1:
        unreleased_block = content[unreleased_idx:]
    else:
        unreleased_block = content[unreleased_idx:next_section_idx]

    # Check if category heading exists inside unreleased block
    if category_heading in unreleased_block:
        # Append entry right below the heading
        heading_pos = content.find(category_heading, unreleased_idx)
        line_end = content.find("\n", heading_pos)
        new_content = content[:line_end + 1] + entry_line + content[line_end + 1:]
    else:
        # Insert category heading and entry right after "## [Unreleased]\n"
        insert_pos = unreleased_idx + len("## [Unreleased]\n")
        new_block = f"\n{category_heading}\n{entry_line}"
        new_content = content[:insert_pos] + new_block + content[insert_pos:]

    with open(CHANGELOG_PATH, "w", encoding="utf-8") as f:
        f.write(new_content)

    print(f"✅ Added to CHANGELOG.md [{category_key.upper()}]: {message}")

def interactive_mode():
    print("📝 TCMS Changelog Interactive Entry Generator")
    print("Categories: 1) Added  2) Changed  3) Fixed  4) Deprecated  5) Removed  6) Security")
    choice = input("Select category (1-6): ").strip()
    cat_map = {"1": "added", "2": "changed", "3": "fixed", "4": "deprecated", "5": "removed", "6": "security"}
    cat = cat_map.get(choice)
    if not cat:
        print("❌ Invalid selection")
        return
    msg = input("Enter description: ").strip()
    if not msg:
        print("❌ Empty message")
        return
    add_changelog_entry(cat, msg)

def main():
    parser = argparse.ArgumentParser(description="TCMS Changelog Entry Generator")
    parser.add_argument("--type", "-t", choices=["added", "changed", "fixed", "deprecated", "removed", "security"], help="Entry category")
    parser.add_argument("--msg", "-m", help="Entry description")
    parser.add_argument("--interactive", "-i", action="store_true", help="Interactive prompt mode")

    args = parser.parse_args()

    if args.interactive:
        interactive_mode()
    elif args.type and args.msg:
        add_changelog_entry(args.type, args.msg)
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
