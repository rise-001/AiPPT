"""Helpers for OpenAI-compatible endpoint configuration."""

from urllib.parse import urlsplit, urlunsplit


def normalize_openai_base_url(api_base: str | None) -> str | None:
    """Ensure OpenAI-compatible base URLs include a trailing /v1 path.

    This keeps the stored frontend value simple, for example:
    - https://yunai.chat -> https://yunai.chat/v1
    - https://yunai.chat/ -> https://yunai.chat/v1
    - https://yunai.chat/v1 -> https://yunai.chat/v1
    - https://host/proxy/openai -> https://host/proxy/openai/v1
    """
    if api_base is None:
        return None

    value = str(api_base).strip()
    if not value:
        return value

    parsed = urlsplit(value)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        return value

    path = parsed.path.rstrip("/")
    if not path:
        path = "/v1"
    elif path != "/v1" and not path.endswith("/v1"):
        path = f"{path}/v1"

    return urlunsplit((parsed.scheme, parsed.netloc, path, parsed.query, parsed.fragment))
