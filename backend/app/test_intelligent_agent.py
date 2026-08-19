from app.agent.graph import research_agent

questions=[
    "How does the system perform resume screening?",
    "Give me a simple overview of the research paper."
    "How are the approaches used in these papers different?",
    "What limitations and future research oppotunities are mentiones?"
]

print("==========INTELLIGENT RESEARCHAI AGENT============")

for question in questions:
    print("\n===================================")
    print("Question:", question)
    print("=====================================")

    result=research_agent.invoke({
        "project_id":3,
        "question":question 
    })

    print(
        "Selected Tool:",
        result.get("selected_tool")
    )

    print(
        "Evidence Available:",
        bool(result.get("evidence"))
    )

    print(
        "Tool Result Type:",
        result.get(
            "tool_result",
            {}
        ).get("type")
    )