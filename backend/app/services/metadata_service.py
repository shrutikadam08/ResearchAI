import re


def extract_metadata(text: str) -> dict:

    metadata = {
        "title": None,
        "authors": None,
        "publication_year": None,
        "journal": None
    }

    lines = [
        line.strip()
        for line in text.splitlines()
        if line.strip()
    ]

    if not lines:
        return metadata

    # --------------------------------
    # Publication year
    # --------------------------------

    year_match = re.search(
        r"\b(19|20)\d{2}\b",
        text
    )

    if year_match:
        metadata["publication_year"] = int(
            year_match.group()
        )

    # --------------------------------
    # Journal
    # --------------------------------

    for line in lines[:30]:

        lower_line = line.lower()

        if (
            "international journal" in lower_line
            or "journal of" in lower_line
            or "conference" in lower_line
        ):
            metadata["journal"] = line
            break

    # --------------------------------
    # Title
    # --------------------------------

    journal_index = -1

    for i, line in enumerate(lines[:30]):

        lower_line = line.lower()

        if (
            "international journal" in lower_line
            or "journal of" in lower_line
            or "conference" in lower_line
        ):
            journal_index = i
            break

    if journal_index != -1:

        for line in lines[journal_index + 1:journal_index + 10]:

            lower_line = line.lower()

            if (
                "issn" in lower_line
                or "volume" in lower_line
                or "issue" in lower_line
                or "©" in line
                or "open access" in lower_line
                or "license" in lower_line
                or "published by" in lower_line
            ):
                continue

            if len(line) >= 5:
                metadata["title"] = line
                break

    # --------------------------------
    # Authors
    # --------------------------------

    for line in lines:

        lower_line = line.lower()

        # Skip journal/header/institution lines
        if (
            "journal" in lower_line
            or "issn" in lower_line
            or "volume" in lower_line
            or "issue" in lower_line
            or "published by" in lower_line
            or "open access" in lower_line
            or "license" in lower_line
            or "department" in lower_line
            or "institute" in lower_line
            or "university" in lower_line
        ):
            continue

        # Academic author formats:
        # 1Dr. Ankita Karale, 2Shruti Jagzap,
        # 3Shruti Kadam, 4Swarali Deshmukh,
        # 5Tejashree Kale

        author_matches = re.findall(
            r"(?:\d+\s*)?(?:Dr\.\s*)?"
            r"[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}",
            line
        )

        if len(author_matches) >= 2:
            metadata["authors"] = line
            break

    return metadata