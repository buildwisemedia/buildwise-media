from pathlib import Path


PACKET = Path("work-item-packets/15e28c86-3048-4791-8f7a-2316f200fcb9.md")


def test_blocked_bob_message_packet_records_required_review_details():
    text = PACKET.read_text(encoding="utf-8")

    required_headings = [
        "## Action",
        "## Risk",
        "## Approval path",
        "## Verification evidence",
        "## Rollback/abort path",
        "## Work item id",
    ]
    for heading in required_headings:
        assert heading in text

    assert "Do not send the blocked Slack draft as-is." in text
    assert "/tmp/ls-qa-reports/backup-coverage-20260622T114755Z.md" in text
    assert "15e28c86-3048-4791-8f7a-2316f200fcb9" in text
    assert "Robert must approve the exact next action before any Slack send." in text
    assert "no runtime effect" in text
