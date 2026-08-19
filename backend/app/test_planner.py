from app.agent.planner import create_plan

questions=[
    "How does the system perform resume screening?",
    "Give me a summary of this research paper.",
    "How are the methodologies of these papers different?",
    "What research gaps and limitations are present?"
]

print("===========LOCAL LLM PLANNER TEST============")

for question in questions:
    print("\nQuestion:")
    print(question)

    plan=create_plan(question)

    print("Selected Tool:")
    print(plan.tool)

    print("Reason:")
    print(plan.reason)