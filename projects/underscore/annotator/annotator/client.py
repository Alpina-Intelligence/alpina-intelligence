import instructor


def get_client(model_uri: str) -> instructor.Instructor:
    if not model_uri.startswith("ollama/"):
        raise ValueError(
            f"Only ollama/* model URIs are supported for now: {model_uri!r}"
        )
    return instructor.from_provider(model_uri, mode=instructor.Mode.JSON_SCHEMA)
