def test_package_imports():
    from annotator import bake_off, client, prompts, schema  # noqa: F401

    assert schema.PassageAnnotation is not None
    assert callable(client.get_client)
    assert isinstance(prompts.ANNOTATION_RUBRIC_SYSTEM_PROMPT, str)
    assert prompts.ANNOTATION_RUBRIC_SYSTEM_PROMPT.strip()


def test_schema_validates_a_minimal_annotation():
    from annotator.schema import PassageAnnotation

    a = PassageAnnotation(mood="tense", tension=7, genre="thriller", pace="brisk")
    assert a.mood == "tense"
    assert a.tension == 7
    assert a.secondary_mood is None
