from app.agent.graph import research_agent

questions=[
    "How does the system perform resume screening?",
    "Give me a summary of the research paper.",
    "What research gaps and limitations are mentioned?"
]

for question in questions:
    print("\n=====================================")
    print("QUESTION")
    print(question)
    print("=======================================")

    result=research_agent.invoke({
        "project_id":3,
        "question":question
    })

    print("\nSELECTED TOOL:")
    print(result.get("selected_tool"))

    print("\nANSWER:")
    print(result.get("answer"))

    print("\n----------------------------------------")
    