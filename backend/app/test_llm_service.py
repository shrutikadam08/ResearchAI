from app.services.llm_service import generate_answer

question="How does the system perform resume screening?"

evidence="""
The system transforms resumes from formats  such as PDF,
DOCX and TXT into a uniform JSON format. The preprocessing
standardizes the resume content before further analysis.

The framework uses an LLM agent for automated resume
screening and can complete the process substantially faster
than manual screening.
"""

answer=generate_answer(
    question=question,
    evidence=evidence
)

print("\n==============LLM ANSWER=============\n")
print(answer)