"""Unit tests for DataMasker — consistent redaction/unmasking of PII before
sending scan context to a cloud AI provider."""
from orion.ai.data_masker import DataMasker


def test_data_masker_mask_and_unmask_round_trip():
    masker = DataMasker.create_fresh()
    masker.add_known("shop.example.com", "HOST")
    masker.add_known("http://shop.example.com/checkout?id=1", "URL")

    payload = (
        "Target: http://shop.example.com/checkout?id=1\n"
        "Host: shop.example.com\n"
        "Found issues on 10.0.0.5 and again on 10.0.0.5.\n"
        "Also found a server at 2001:0db8:85a3:0000:0000:8a2e:0370:7334.\n"
        "Contact admin@example.com for details.\n"
    )

    masked = masker.mask_text(payload)

    # Same IP gets the same placeholder every time it recurs.
    assert masked.count("[REDACTED-IP-3]") == 2
    assert "[REDACTED-IP-4]" in masked

    # Target hostname/URL and the email address are both masked.
    assert "shop.example.com" not in masked
    assert "http://shop.example.com" not in masked
    assert "admin@example.com" not in masked

    # Unmasking restores the original text exactly.
    assert masker.unmask_text(masked) == payload
