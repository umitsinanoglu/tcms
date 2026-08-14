#!/usr/bin/env python3
"""
TCMS Vector Context Generator for AI Agents / RAG Stores

This script inspects the TCMS codebase (Backend NestJS + Prisma & Frontend Next.js),
slices key modules, models, endpoints, and components into structured, vectorizable text chunks,
and generates `project_vector_context.json`.

Usage:
  python3 scripts/generate_vector_context.py
"""

import os
import re
import json
import glob
from datetime import datetime

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_FILE = os.path.join(ROOT_DIR, "project_vector_context.json")

def estimate_tokens(text: str) -> int:
    # Rough approximation for code/text tokens
    return max(1, len(text) // 4)

def parse_prisma_schema(schema_path: str):
    chunks = []
    if not os.path.exists(schema_path):
        return chunks

    with open(schema_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Match models and enums
    model_matches = re.finditer(r'(enum|model)\s+([A-Za-z0-9_]+)\s*\{([^}]+)\}', content)
    for match in model_matches:
        kind = match.group(1)
        name = match.group(2)
        body = match.group(3).strip()
        full_code = f"{kind} {name} {{\n{body}\n}}"
        
        chunk = {
            "id": f"prisma-{kind}-{name.lower()}",
            "file": "backend/prisma/schema.prisma",
            "type": "database_model" if kind == "model" else "database_enum",
            "symbol": name,
            "title": f"Prisma {kind.capitalize()}: {name}",
            "content": full_code,
            "tokens": estimate_tokens(full_code),
            "metadata": {
                "layer": "database",
                "kind": kind,
                "name": name
            }
        }
        chunks.append(chunk)
    return chunks

def parse_typescript_file(file_path: str, rel_path: str, layer: str):
    chunks = []
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    lines = content.splitlines()

    # Identify exports (classes, interfaces, types, functions, components)
    export_regex = re.compile(r'export\s+(class|interface|type|function|const|enum)\s+([A-Za-z0-9_]+)')
    
    current_chunk = []
    current_symbol = None
    current_type = None
    start_line = 1

    for idx, line in enumerate(lines, 1):
        match = export_regex.search(line)
        if match:
            # Save previous chunk if large enough
            if current_chunk and current_symbol:
                code_text = "\n".join(current_chunk)
                if len(code_text.strip()) > 30:
                    chunks.append({
                        "id": f"{layer}-{current_symbol.lower()}-{start_line}",
                        "file": rel_path,
                        "type": current_type,
                        "symbol": current_symbol,
                        "title": f"{layer.upper()} {current_type}: {current_symbol}",
                        "content": code_text,
                        "tokens": estimate_tokens(code_text),
                        "metadata": {
                            "layer": layer,
                            "file": rel_path,
                            "symbol": current_symbol,
                            "start_line": start_line,
                            "end_line": idx - 1
                        }
                    })
            current_symbol = match.group(2)
            current_type = match.group(1)
            current_chunk = [line]
            start_line = idx
        else:
            if current_symbol:
                current_chunk.append(line)

    # Final chunk
    if current_chunk and current_symbol:
        code_text = "\n".join(current_chunk)
        if len(code_text.strip()) > 30:
            chunks.append({
                "id": f"{layer}-{current_symbol.lower()}-{start_line}",
                "file": rel_path,
                "type": current_type,
                "symbol": current_symbol,
                "title": f"{layer.upper()} {current_type}: {current_symbol}",
                "content": code_text,
                "tokens": estimate_tokens(code_text),
                "metadata": {
                    "layer": layer,
                    "file": rel_path,
                    "symbol": current_symbol,
                    "start_line": start_line,
                    "end_line": len(lines)
                }
            })

    return chunks

def scan_directory(base_dir: str, pattern: str, layer: str):
    all_chunks = []
    search_path = os.path.join(base_dir, pattern)
    for file_path in glob.glob(search_path, recursive=True):
        if "node_modules" in file_path or ".next" in file_path or "dist" in file_path:
            continue
        rel_path = os.path.relpath(file_path, ROOT_DIR)
        chunks = parse_typescript_file(file_path, rel_path, layer)
        all_chunks.extend(chunks)
    return all_chunks

def generate_vector_context():
    print("🔍 Scanning TCMS codebase for vector context generation...")
    all_chunks = []

    # 1. Prisma Schema
    prisma_path = os.path.join(ROOT_DIR, "backend", "prisma", "schema.prisma")
    prisma_chunks = parse_prisma_schema(prisma_path)
    all_chunks.extend(prisma_chunks)
    print(f"  • Extracted {len(prisma_chunks)} Prisma database chunks")

    # 2. Backend TypeScript files
    backend_dir = os.path.join(ROOT_DIR, "backend", "src")
    backend_chunks = scan_directory(backend_dir, "**/*.ts", "backend")
    all_chunks.extend(backend_chunks)
    print(f"  • Extracted {len(backend_chunks)} Backend TypeScript chunks")

    # 3. Frontend TypeScript/React files
    frontend_dir = os.path.join(ROOT_DIR, "frontend", "src")
    frontend_chunks = scan_directory(frontend_dir, "**/*.ts*", "frontend")
    all_chunks.extend(frontend_chunks)
    print(f"  • Extracted {len(frontend_chunks)} Frontend React/TypeScript chunks")

    total_tokens = sum(c["tokens"] for c in all_chunks)

    vector_dataset = {
        "project": "TCMS",
        "generatedAt": datetime.now().isoformat(),
        "totalChunks": len(all_chunks),
        "totalTokensEstimate": total_tokens,
        "chunks": all_chunks
    }

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(vector_dataset, f, indent=2)

    print(f"✅ Generated vector context index with {len(all_chunks)} chunks (~{total_tokens} tokens) -> {OUTPUT_FILE}")

if __name__ == "__main__":
    generate_vector_context()
