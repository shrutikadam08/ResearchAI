def select_tool(question:str)->str:
    question_lower=question.lower()

    if any(
        word in question_lower
        for word in [
            "compare",
            "comparison",
            "difference",
            "differences"
        ]
    ):
        return "comparison"

    if any(
        word in question_lower
        for word in [
            "research gap",
            "research gaps",
            "gap",
            "future work",
            "future research",
            "limitation",
            "limitations"
        ]
    ):
        return "research_gap"

    if any(
        word in question_lower
        for word in [
            "summarize",
            "summary",
            "summarise",
            "overview"
        ]
    ):
        return "summary"

    return "search"