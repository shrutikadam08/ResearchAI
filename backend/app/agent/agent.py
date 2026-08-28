from app.agent.tools.search_tool import (
    search_papers,
    search_papers_for_literature_review,
)
from app.agent.tools.comparison_tool import compare_papers
from app.agent.tools.gap_tool import find_research_gaps
from app.agent.tools.summary_tool import summarize_paper

from app.services.llm_service import generate_answer
from app.services.citation_service import (
    build_citations,
    format_citations 
)

def _format_evidence(result):
    """
    Convert research tool output into text
    that can be provided to the LLM.
    """

    result_type = result.get("type")

    # ==================================================
    # SEARCH
    # ==================================================

    if result_type == "search":

        evidence = result.get("evidence", [])

        parts = []

        for item in evidence:

            parts.append(
                f"""
Document ID: {item.get("document_id")}
Title: {item.get("title")}
Authors: {item.get("authors")}
Publication Year: {item.get("publication_year")}
Journal: {item.get("journal")}
Page: {item.get("page_number")}

Text:
{item.get("text")}
"""
            )

        return "\n".join(parts)

    # ==================================================
    # LITERATURE REVIEW
    # ==================================================

    if result_type == "literature_review":

        evidence = result.get("evidence", [])
        parts = []

        for item in evidence:

            parts.append(
                f"""
Paper ID: {item.get("document_id")}
Paper Title: {item.get("title") or item.get("original_filename")}
Authors: {item.get("authors")}
Publication Year: {item.get("publication_year")}
Journal: {item.get("journal")}
Page: {item.get("page_number")}

Evidence:
{item.get("text")}
"""
            )

        return "\n".join(parts)

    # ==================================================
    # SUMMARY
    # ==================================================

    if result_type == "summary":

        evidence = result.get("evidence", [])

        parts = []

        for item in evidence:

            parts.append(
                f"""
Document ID: {item.get("document_id")}
Page: {item.get("page_number")}

Text:
{item.get("text")}
"""
            )

        return "\n".join(parts)

    # ==================================================
    # COMPARISON
    # ==================================================

    if result_type == "comparison":

        documents = result.get("documents", [])

        parts = []

        for paper in documents:

            parts.append(
                f"""
Document ID: {paper.get("document_id")}
Title: {paper.get("title")}
Authors: {paper.get("authors")}
Publication Year: {paper.get("publication_year")}
Journal: {paper.get("journal")}

Evidence:
"""
            )

            for evidence in paper.get("evidence", []):

                parts.append(
                    f"""
Page: {evidence.get("page_number")}

Text:
{evidence.get("text")}
"""
                )

        return "\n".join(parts)

    # ==================================================
    # RESEARCH GAP
    # ==================================================

    if result_type == "research_gap":

        documents = result.get("documents", [])

        parts = []

        for paper in documents:

            parts.append(
                f"""
Document ID: {paper.get("document_id")}
Title: {paper.get("title")}
Authors: {paper.get("authors")}
Publication Year: {paper.get("publication_year")}
Journal: {paper.get("journal")}

Evidence:
"""
            )

            for evidence in paper.get("evidence", []):

                parts.append(
                    f"""
Page: {evidence.get("page_number")}
Query: {evidence.get("query")}

Text:
{evidence.get("text")}
"""
                )

        return "\n".join(parts)

    # ==================================================
    # FALLBACK
    # ==================================================

    return str(result)

def _collect_sources(result):
    """
    Collect citation sources from tool results.
    """

    sources=[]

    result_type=result.get("type")

    if result_type=="search":
        for item in result.get("evidence",[]):
            sources.append({
                "document_id":item["document_id"],
                "page_number":item["page_number"],
                "title":item.get("title"),
                "authors":item.get("authors"),
                "publication_year":item.get(
                    "publication_year"
                ),
                "journal":item.get("journal")
            })

    if result_type=="literature_review":
        for item in result.get("evidence",[]):
            sources.append({
                "document_id":item["document_id"],
                "page_number":item["page_number"],
                "title":item.get("title"),
                "authors":item.get("authors"),
                "publication_year":item.get("publication_year"),
                "journal":item.get("journal")
            })

    elif result_type=="summary":
        for item in result.get("evidence",[]):
            sources.append({
                "document_id":item["document_id"],
                "page_number":item["page_number"],
                "title":item.get("title"),
                "authors":item.get("authors"),
                "publication_year":item.get(
                    "publication_year"
                ),
                "journal":item.get("journal")
            })

    elif result_type=="comparison":
        for paper in result.get("documents",[]):
            for evidence in paper.get(
                "evidence",
                []
            ):
                sources.append({
                    "document_id":paper["document_id"],
                    "page_number":evidence[
                        "page_number"
                    ],
                    "title":paper.get("title"),
                    "authors":paper.get("authors"),
                    "publication_year":paper.get(
                        "publication_year"
                    ),
                    "journal":paper.get("journal")
                })

    elif result_type=="research_gap":
        for paper in result.get("documents",[]):
            for evidence in paper.get(
                "evidence",
                []
            
            ):
                sources.append({
                    "document_id":paper["document_id"],
                    "page_number":evidence[
                        "page_number"
                    ],
                    "title":paper.get("title"),
                    "authors":paper.get("authors"),
                    "publication_year":paper.get(
                        "publication_year"
                    ),
                    "journal":paper.get("journal")
                })

    return sources



def _format_citation_evidence(
    result,
    citations
):
    """
    Add citation numbers to research evidence.
    """

    citation_map = {
        (
            citation["document_id"],
            citation["page_number"]
        ): citation["id"]
        for citation in citations
    }

    result_type = result.get("type")

    parts = []

    if result_type in ["search", "summary", "literature_review"]:

        evidence = result.get(
            "evidence",
            []
        )

        for item in evidence:

            key = (
                item["document_id"],
                item["page_number"]
            )

            citation_number = citation_map.get(key)

            parts.append(
                f"""
[{citation_number}]
Document ID: {item["document_id"]}
Page: {item["page_number"]}

Text:
{item["text"]}
"""
            )

    elif result_type in [
        "comparison",
        "research_gap"
    ]:

        for paper in result.get(
            "documents",
            []
        ):

            for item in paper.get(
                "evidence",
                []
            ):

                key = (
                    paper["document_id"],
                    item["page_number"]
                )

                citation_number = citation_map.get(
                    key
                )

                parts.append(
                    f"""
[{citation_number}]
Document ID: {paper["document_id"]}
Title: {paper.get("title")}
Page: {item["page_number"]}

Text:
{item["text"]}
"""
                )

    return "\n".join(parts)

def run_agent(
    project_id: int,
    query: str,
    conversation_history: str = ""
):
    """
    Main ResearchAI agent.

    Selects the appropriate research tool,
    retrieves evidence, builds citations,
    generates an LLM answer,
    and returns the final result.
    """

    query_lower = query.lower()

    print(
        f"ResearchAI agent query: {query!r}"
    )

    # ==================================================
    # 1. LITERATURE REVIEW
    # ==================================================

    literature_keywords = [
        "literature review",
        "literature survey",
        "review the literature",
        "generate literature",
        "write a literature review",
        "literature synthesis",
        "literature",
    ]

    gap_keywords = [
        "research gap",
        "research gaps",
        "future work",
        "future research",
        "limitations",
        "limitation",
        "drawbacks",
        "challenges",
        "possible improvements"
    ]

    if any(
        keyword in query_lower
        for keyword in literature_keywords
    ):

        print(
            "LITERATURE REVIEW ROUTE SELECTED"
        )

        review_evidence = search_papers_for_literature_review(
            project_id=project_id,
            n_results_per_paper=4,
            max_total=12,
        )

        print(
            "Literature review evidence count:",
            len(review_evidence)
        )
        print(
            "Literature review document IDs:",
            sorted({
                item.get("document_id")
                for item in review_evidence
                if item.get("document_id") is not None
            })
        )

        tool_result = {
            "type": "literature_review",
            "query": query,
            "evidence": review_evidence,
        }

        # A normal gap/comparison query must never overwrite
        # a literature-review result.
        selected_query = (
            "Write a concise academic literature review using ONLY "
            "the provided research evidence. Cover the major themes, "
            "methods, findings, similarities, differences, limitations, "
            "and research gaps across the papers. Mention paper titles "
            "when comparing studies. Put citation markers like [1] "
            "immediately after claims supported by the matching evidence. "
            "Do not invent information or use outside knowledge."
        )

    elif any(
        keyword in query_lower
        for keyword in gap_keywords
    ):

        tool_result = find_research_gaps(
            project_id=project_id
        )

    # ==================================================
    # 2. COMPARISON
    # ==================================================

    elif any(
        keyword in query_lower
        for keyword in [
            "compare",
            "comparison",
            "differences",
            "difference",
            "similarities",
            "similar",
            "versus",
            "vs"
        ]
    ):

        tool_result = compare_papers(
            project_id=project_id,
            query=query
        )

    # ==================================================
    # 3. SUMMARY
    # ==================================================

    elif any(
        keyword in query_lower
        for keyword in [
            "summarize",
            "summary",
            "summarise",
            "overview",
            "what is this paper about",
            "main idea",
            "key findings"
        ]
    ):

        tool_result = summarize_paper(
            project_id=project_id,
            query=query
        )

    # ==================================================
    # 4. DEFAULT SEARCH
    # ==================================================

    else:

        evidence = search_papers(
            project_id=project_id,
            query=query
        )

        tool_result = {
            "type": "search",
            "query": query,
            "evidence": evidence
        }

    # ==================================================
    # 5. FORMAT RESEARCH EVIDENCE
    # ==================================================


    sources=_collect_sources(
        tool_result
    )
    citations=build_citations(
        sources 
    )

    formatted_evidence=_format_citation_evidence(
        tool_result,
        citations
    )



    # ==================================================
    # 6. GENERATE LLM ANSWER
    # ==================================================

    answer = generate_answer(
        question=(
            selected_query
            if "selected_query" in locals()
            else query
        ),
        evidence=formatted_evidence,
        conversation_history=conversation_history
    )

    citation_text=format_citations(
        citations 
    )

    if citation_text:
        answer=(
            answer.rstrip()
            +"\n\n"
            +citation_text 
        )

    # ==================================================
    # 7. RETURN RESULT
    # ==================================================

    return {
        "query": query,
        "tool": tool_result.get("type"),
        "answer": answer,
        "citations":citations,
        "evidence": tool_result
    }