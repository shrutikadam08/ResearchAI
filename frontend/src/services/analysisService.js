import axios from "axios";

const API_URL = "http://127.0.0.1:8000";


// ============================================================
// ANALYZE PAPER
// ============================================================

export const analyzePaper = async (paper) => {

  // ----------------------------------------------------------
  // GET AUTHENTICATION TOKEN
  // ----------------------------------------------------------

  const token =
    localStorage.getItem(
      "access_token"
    );


  if (!token) {

    const error =
      new Error(
        "Authentication required."
      );

    error.response = {
      status: 401,
      data: {
        detail:
          "Please login to analyze a paper.",
      },
    };

    throw error;

  }


  // ----------------------------------------------------------
  // VALIDATE PAPER
  // ----------------------------------------------------------

  if (!paper) {

    throw new Error(
      "Paper information is missing."
    );

  }


  // ----------------------------------------------------------
  // GET OPENALEX PAPER ID
  //
  // Priority:
  // 1. paper_id
  // 2. openalex_id
  //
  // Do NOT use the local database `id` here.
  // ----------------------------------------------------------

  const paperId =
    paper.paper_id ||
    paper.openalex_id ||
    null;


  // ----------------------------------------------------------
  // AUTHORS
  // ----------------------------------------------------------

  let authors = null;


  if (
    Array.isArray(
      paper.authors
    )
  ) {

    authors =
      paper.authors

        .map(
          (author) => {

            if (
              typeof author ===
              "string"
            ) {

              return author;

            }


            return (
              author?.name ||
              author?.display_name ||
              ""
            );

          }
        )

        .filter(Boolean)

        .join(", ");


    if (!authors) {

      authors = null;

    }

  } else if (
    typeof paper.authors ===
    "string"
  ) {

    authors =
      paper.authors.trim() ||
      null;

  }


  // ----------------------------------------------------------
  // BUILD REQUEST PAYLOAD
  // ----------------------------------------------------------

  const payload = {

    paper_id:
      paperId,

    title:
      paper.title ||
      "Untitled Paper",

    abstract:
      paper.abstract ||
      null,

    authors,

    year:
      paper.year ||
      null,

    venue:
      paper.venue ||
      null,

    pdf_url:
      paper.pdf_url ||
      null,

  };


  console.log(
    "Sending paper for AI analysis:",
    payload
  );


  // ----------------------------------------------------------
  // SEND REQUEST
  // ----------------------------------------------------------

  try {

    const response =
      await axios.post(

        `${API_URL}/analysis`,

        payload,

        {
          headers: {

            Authorization:
              `Bearer ${token}`,

            "Content-Type":
              "application/json",

          },

        }

      );


    console.log(
      "AI analysis response:",
      response.data
    );


    return response.data;

  } catch (
    error
  ) {

    console.error(
      "AI analysis request failed:",
      error
    );


    console.error(
      "Status:",
      error.response?.status
    );


    console.error(
      "Backend response:",
      error.response?.data
    );


    throw error;

  }

};