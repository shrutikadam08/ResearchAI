from typing import Literal

from langgraph.graph import END, START, StateGraph

from app.agent.state import AgentState

from app.agent.tools.search_tool import search_papers
from app.agent.tools.summary_tool import summarize_paper
from app.agent.tools.comparison_tool import compare_papers
from app.agent.tools.gap_tool import find_research_gaps

from app.agent.planner import create_plan

from app.services.answer_service import (
    generate_research_answer,
)


# ============================================================
# ANSWER NODE
# ============================================================

def answer_node(
    state: AgentState
):

    evidence = state.get(
        "evidence",
        []
    )

    original_tool_result = state.get(
        "tool_result",
        {}
    )


    if not isinstance(
        original_tool_result,
        dict
    ):

        original_tool_result = {}


    # ========================================================
    # FLATTEN NESTED EVIDENCE
    # ========================================================

    flattened = []


    if isinstance(
        evidence,
        list
    ):

        for item in evidence:

            if not isinstance(
                item,
                dict
            ):

                continue


            # ------------------------------------------------
            # Already flat
            # ------------------------------------------------

            if "text" in item:

                flattened.append(
                    item
                )

                continue


            # ------------------------------------------------
            # Nested document evidence
            # ------------------------------------------------

            document_id = item.get(
                "document_id"
            )


            nested_evidence = item.get(
                "evidence",
                []
            )


            if not isinstance(
                nested_evidence,
                list
            ):

                continue


            for nested_item in (
                nested_evidence
            ):

                if not isinstance(
                    nested_item,
                    dict
                ):

                    continue


                text = nested_item.get(
                    "text"
                )


                page_number = nested_item.get(
                    "page_number"
                )


                if (
                    not text
                    or page_number is None
                    or document_id is None
                ):

                    continue


                flattened.append(
                    {
                        "text":
                            text,

                        "document_id":
                            document_id,

                        "page_number":
                            page_number,
                    }
                )


    # ========================================================
    # GENERATE ANSWER
    # ========================================================

    result = generate_research_answer(
        question=state["question"],
        evidence=flattened,
    )


    # ========================================================
    # PRESERVE ORIGINAL TOOL RESULT
    #
    # THIS IS THE IMPORTANT FIX.
    #
    # Do NOT replace the comparison/research-gap documents.
    # Keep them so the frontend can open evidence.
    # ========================================================

    preserved_tool_result = {
        **original_tool_result,

        "answer":
            result.get(
                "answer",
                ""
            ),

        "sources":
            result.get(
                "sources",
                []
            ),
    }


    return {

        "answer":
            result.get(
                "answer",
                "No answer generated."
            ),

        "tool_result":
            preserved_tool_result,

        "evidence":
            flattened,

    }


# ============================================================
# ROUTER
# ============================================================

def route_question(
    state: AgentState
):

    question = (
        state["question"]
        .lower()
        .strip()
    )


    # ========================================================
    # FAST ROUTING
    #
    # Obvious compare/gap requests do not need planner call.
    # ========================================================

    if any(
        keyword in question

        for keyword in [
            "compare",
            "comparison",
            "difference",
            "differences",
            "similarity",
            "similarities",
            "versus",
            " vs ",
        ]
    ):

        return {
            "selected_tool":
                "comparison",

            "tool_result": {
                "planner_reason":
                    "Direct comparison request."
            },
        }


    if any(
        keyword in question

        for keyword in [
            "research gap",
            "research gaps",
            "future work",
            "future research",
            "limitations",
            "limitation",
            "drawbacks",
            "challenges",
            "possible improvements",
        ]
    ):

        return {
            "selected_tool":
                "research_gap",

            "tool_result": {
                "planner_reason":
                    "Direct research-gap request."
            },
        }


    # ========================================================
    # NORMAL PLANNER
    # ========================================================

    plan = create_plan(
        state["question"]
    )


    return {
        "selected_tool":
            plan.tool,

        "tool_result": {
            "planner_reason":
                plan.reason
        },
    }


# ============================================================
# SEARCH
# ============================================================

def search_node(
    state: AgentState
):

    evidence = search_papers(
        project_id=
            state["project_id"],

        query=
            state["question"],

        n_results=5,
    )


    return {

        "evidence":
            evidence,

        "tool_result": {

            "type":
                "search",

            "evidence":
                evidence,

        },

    }


# ============================================================
# SUMMARY
# ============================================================

def summary_node(
    state: AgentState
):

    result = summarize_paper(
        project_id=
            state["project_id"]
    )


    return {

        "evidence":
            result.get(
                "evidence",
                []
            ),

        "tool_result":
            result,

    }


# ============================================================
# COMPARISON
# ============================================================

def comparison_node(
    state: AgentState
):

    result = compare_papers(
        project_id=
            state["project_id"],

        query=
            state["question"],

        n_results=6,
    )


    documents = result.get(
        "documents",
        []
    )


    return {

        "evidence":
            documents,

        "tool_result":
            result,

    }


# ============================================================
# RESEARCH GAPS
# ============================================================

def research_gap_node(
    state: AgentState
):

    result = find_research_gaps(
        project_id=
            state["project_id"],

        n_results=3,
    )


    documents = result.get(
        "documents",
        []
    )


    return {

        "evidence":
            documents,

        "tool_result":
            result,

    }


# ============================================================
# CHOOSE TOOL
# ============================================================

def choose_tool(
    state: AgentState
) -> Literal[
    "search",
    "summary",
    "comparison",
    "research_gap",
]:

    return state[
        "selected_tool"
    ]


# ============================================================
# GRAPH
# ============================================================

graph_builder = StateGraph(
    AgentState
)


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


graph_builder.add_node(
    "answer",
    answer_node
)


# ============================================================
# EDGES
# ============================================================

graph_builder.add_edge(
    START,
    "router"
)


graph_builder.add_conditional_edges(
    "router",
    choose_tool,
    {

        "search":
            "search",

        "summary":
            "summary",

        "comparison":
            "comparison",

        "research_gap":
            "research_gap",

    },
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


graph_builder.add_edge(
    "answer",
    END
)


# ============================================================
# COMPILE
# ============================================================

research_agent = (
    graph_builder.compile()
)