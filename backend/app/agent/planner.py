from typing import Literal

from ollama import chat
from pydantic import BaseModel

class AgentPlan(BaseModel):
    tool:Literal[ 
        "search",
        "summary",
        "comparison",
        "research_gap"
    ]

    reason:str

SYSTEM_PROMPT="""
You are the planning component of ResearchAI.

Your job is to decide which tool should handle 
the user's research question.

Available tools:

search:
Use for questions asking for specific information
from research papers.

summary:
Use when the user asks for a summary, overview,
or explanation of a research paper.

comparison:
Use when the user wants to compare papers,
methods, datasets, results, approaches or differences.

research_gap:
Use when the user asks about research gaps,
limitations, future work, missing areas, or
possible improvemnets.

Return only a JSON object with:
{
"tool":"search | summary | comparison | research_gap",
"reason": "short explanation"
}
"""

def create_plan(question:str)->AgentPlan:

    response=chat(
        model="qwen3:0.6b",
        messages=[
            {
                "role":"system",
                "content":SYSTEM_PROMPT
            },
            {
                "role":"user",
                "content":question
            }
        ],
        format="json",
        options={
            "temperature":0
        }
    )

    return AgentPlan.model_validate_json(
        response.message.content
    )