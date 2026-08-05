from pathlib import Path


CONSENT_PAGE = Path(__file__).parents[1] / "src/pages/sms-consent.astro"


def page_source() -> str:
    return CONSENT_PAGE.read_text(encoding="utf-8")


def test_invitation_token_is_private_and_survives_same_tab_navigation() -> None:
    source = page_source()

    assert "new URLSearchParams(window.location.search).get('i')" in source
    assert "window.sessionStorage.setItem(stateKey" in source
    assert "window.history.replaceState(null, '', window.location.pathname + window.location.hash)" in source
    assert "invite_token: inviteToken" in source


def test_verification_code_uses_mobile_otp_constraints() -> None:
    source = page_source()

    assert 'autocomplete="one-time-code"' in source
    assert 'inputmode="numeric"' in source
    assert 'pattern="[0-9]{6}"' in source
    assert "if (!/^[0-9]{6}$/.test(code))" in source
    assert "body: JSON.stringify({ invite_token: inviteToken, challenge_id: challengeId, code: code })" in source


def test_missing_code_recovery_checks_delivery_then_offers_resend_and_help() -> None:
    source = page_source()

    assert "/pilot/onboarding/status" in source
    assert "/pilot/onboarding/help" in source
    assert "setInterval(refreshDeliveryStatus, 3000)" in source
    assert "sendAgain.addEventListener('click'" in source
    assert "needHelp.addEventListener('click', requestHelp)" in source
    assert "body: JSON.stringify({ invite_token: inviteToken, challenge_id: challengeId })" in source


def test_pending_challenge_restores_only_before_expiration() -> None:
    source = page_source()

    assert "Date.parse(savedState.expires_at || '') > Date.now()" in source
    assert "challengeId = savedState.challenge_id" in source
    assert "showStep('verify')" in source
    assert "startDeliveryPolling" in source

