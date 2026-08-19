from app.agent.graph import research_agent


questions = [
    "How does the system perform resume screening?",
    "Summarize the research paper",
    "Compare the methodologies of the papers",
    "What research gaps are identified?"
]


for question in questions:

    print("\n===================================")
    print("QUESTION:", question)
    print("===================================")

    result = research_agent.invoke({
        "project_id": 3,
        "question": question
    })

    print(
        "Selected Tool:",
        result.get("selected_tool")
    )

    print(
        "Result Type:",
        result.get("tool_result", {}).get("type")
    )

    print(
        "Evidence Available:",
        bool(result.get("evidence"))
    )