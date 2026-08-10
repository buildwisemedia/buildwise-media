import importlib.util
from pathlib import Path


MODULE_PATH = Path(__file__).parents[1] / "scripts" / "legal-notify.py"
SPEC = importlib.util.spec_from_file_location("legal_notify", MODULE_PATH)
legal_notify = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(legal_notify)


def test_payload_combines_bob_sender_with_trackable_html():
    entry = {
        "version": "1.2",
        "date": "2026-08-10",
        "summary": "Clarified <notice> & timing.",
        "material": True,
    }

    payload = legal_notify.build_payload(
        entry,
        "Buildwise service terms updated — v1.2",
        ["client@example.com"],
    )

    assert payload["from"] == "Buildwise Media <bob@buildwisemedia.com>"
    assert "https://buildwisemedia.com/legal/" in payload["text"]
    assert '<a href="https://buildwisemedia.com/legal/">' in payload["html"]
    assert "Clarified &lt;notice&gt; &amp; timing." in payload["html"]
    assert "Clarified <notice> & timing." in payload["text"]


def test_non_material_notice_omits_material_change_paragraph():
    entry = {
        "version": "1.2",
        "date": "2026-08-10",
        "summary": "Formatting only.",
        "material": False,
    }

    payload = legal_notify.build_payload(entry, "Subject", ["client@example.com"])

    assert "This change is a material change." not in payload["text"]
    assert "This change is a material change." not in payload["html"]
