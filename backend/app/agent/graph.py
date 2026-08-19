from typing import Literal

from langgraph.graph import END, START, StateGraph

from app.agent.router import select_tool
from app.agent.state import AgentState
from app.agent.tools.search_tool import search_papers
from app.agent.tools.summary_tool import summarize_paper
from app.agent.tools.comparison_tool import compare_papers
from app.agent.tools.gap_tool import find_research_gaps
from app.agent.planner import create_plan
from app.services.answer_service import generate_research_answer

def answer_node(state: AgentState):
    evidence=state.get("evidence", [])

    if evidence and isinstance(evidence[0], dict):
        if "text" not in evidence[0]:
            flattened=[]

            for document in evidence:
                for item in document.get("evidence", []):
                    flattened.append({
                        "text":item["text"],
                        "document_id":document["document_id"],
                        "page_number":item["page_number"]
                    })

                evidence=flattened

        result=generate_research_answer(
            question=state["question"],
            evidence=evidence
        )

        return {
            "answer":result["answer"],
            "tool_result":result 
        }

def route_question(state: AgentState):
    plan=create_plan(state["question"])

    return {
        "selected_tool":plan.tool,
        "tool_result":{
            "planner_reason":plan.reason
        }
    }

def search_node(
        state:AgentState
):
    evidence=search_papers(
        project_id=state["project_id"],
        query=state["question"],
        n_results=5
    )

    return {
        "evidence":evidence,
        "tool_result":{
            "type":"search",
            "evidence":evidence
        }
    }

def summary_node(
        state:AgentState
):
    result=summarize_paper(
        project_id=state["project_id"]
    )

    return{
        "evidence":result["evidence"],
        "tool_result":result
    }

def comparison_node(
        state:AgentState
):
    result=compare_papers(
        project_id=state["project_id"],
        query=state["question"],
        n_results=10
    )

    return {
        "evidence":result["documents"],
        "tool_result":result
    }

def research_gap_node(
    state: AgentState
):
    result = find_research_gaps(
        project_id=state["project_id"],
        n_results=5
    )

    return {
        "evidence": result["documents"],
        "tool_result": result
    }


def choose_tool(
    state: AgentState
) -> Literal[
    "search",
    "summary",
    "comparison",
    "research_gap"
]:

    return state["selected_tool"]


graph_builder = StateGraph(AgentState)

graph_builder.add_node(
    "router",
    route_question
)

graph_builder.add_node(
    "search",
    search_node
)

graph_builder.add_node(
    "summary",
    summary_node
)

graph_builder.add_node(
    "comparison",
    comparison_node
)

graph_builder.add_node(
    "research_gap",
    research_gap_node
)


graph_builder.add_edge(
    START,
    "router"
)

graph_builder.add_conditional_edges(
    "router",
    choose_tool,
    {
        "search": "search",
        "summary": "summary",
        "comparison": "comparison",
        "research_gap": "research_gap"
    }
)

graph_builder.add_edge(
    "search",
    "answer"
)

graph_builder.add_edge(
    "summary",
    "answer"
)

graph_builder.add_edge(
    "comparison",
    "answer"
)

graph_builder.add_edge(
    "research_gap",
    "answer"
)

graph_builder.add_node(
    "answer",
    answer_node
)

graph_builder.add_edge(
    "answer",
    END 
)

research_agent = graph_builder.compile()

