#!/usr/bin/env python3
# ProjectTracker - PreToolUse guvenlik kancasi.
# Claude Code, Write / Edit / MultiEdit araclarini calistirmadan ONCE bu betigi
# calistirir. Betik stdin'den bir JSON alir ve hedef dosya yoluna bakarak
# yazma iznini verir ya da reddeder.
#
# Kural: hedef yol, proje kokunun (cwd) DOGRUDAN altinda ve ".md" uzantili
# olmalidir. Alt klasor, baska uzanti, kok disina cikan mutlak yol ya da ".."
# ile kacis denemesi reddedilir.
#
# Karar cikti bicimi: stdout'a PreToolUse hook sozlesmesine uygun JSON yazilir
# (hookSpecificOutput.permissionDecision = "allow" | "deny"). Reddedilen
# durumlarda ayrica stderr'e Turkce sebep yazilir ve exit kodu 2 kullanilir.

import json
import os
import sys


def _decision(decision, reason):
    payload = {
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": decision,
            "permissionDecisionReason": reason,
        }
    }
    print(json.dumps(payload, ensure_ascii=False))


def allow(reason):
    _decision("allow", reason)
    sys.exit(0)


def deny(reason):
    _decision("deny", reason)
    sys.stderr.write(reason + "\n")
    sys.exit(2)


def main():
    raw = sys.stdin.read()
    try:
        event = json.loads(raw) if raw.strip() else {}
    except json.JSONDecodeError:
        deny("Kanca girdisi cozumlenemedi (gecersiz JSON).")
        return

    tool_input = event.get("tool_input") or {}
    file_path = tool_input.get("file_path") or tool_input.get("filePath")
    if not file_path:
        deny("Yazma hedefi belirlenemedi: tool_input.file_path yok.")
        return

    project_root = event.get("cwd") or os.getcwd()
    project_root = os.path.realpath(project_root)

    if not os.path.isabs(file_path):
        file_path = os.path.join(project_root, file_path)
    target = os.path.realpath(file_path)

    parent = os.path.dirname(target)
    name = os.path.basename(target)

    if parent != project_root:
        deny(
            "Yazma reddedildi: yalnizca proje kokune yazilabilir. "
            "Hedef proje koku disinda ya da bir alt klasorde: " + target
        )
        return

    root, ext = os.path.splitext(name)
    if ext.lower() != ".md" or not root:
        deny(
            "Yazma reddedildi: yalnizca proje kokundeki '*.md' dosyalari "
            "olusturulabilir. Hedef: " + name
        )
        return

    allow("Proje kokundeki Markdown dosyasi, yazmaya izin verildi: " + name)


if __name__ == "__main__":
    main()
