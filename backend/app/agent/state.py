from typing import TypedDict


class AgentState(TypedDict, total=False):

    project_id: int

    question: str

    # Selected papers for comparison
    paper_ids: list[int]

    selected_tool: str

    retrieved_documents: list

    evidence: list

    tool_result: dict

    answer: str