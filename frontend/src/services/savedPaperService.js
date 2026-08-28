import axios from "axios";

import { API_URL } from "./apiConfig";


// ============================================================
// GET AUTH TOKEN
// ============================================================

const getToken = () => {

  return localStorage.getItem(
    "access_token"
  );

};


// ============================================================
// AUTH HEADERS
// ============================================================

const getAuthHeaders = () => {

  const token =
    getToken();


  if (!token) {

    const error =
      new Error(
        "User is not logged in."
      );


    error.response = {
      status: 401,

      data: {
        detail:
          "Please login to continue.",
      },
    };


    throw error;

  }


  return {

    Authorization:
      `Bearer ${token}`,

    "Content-Type":
      "application/json",

  };

};


// ============================================================
// SAVE PAPER
// ============================================================

export const savePaper =
  async (
    paper
  ) => {

    if (!paper) {

      throw new Error(
        "Paper information is missing."
      );

    }


    const paperId =
      paper.openalex_id ||
      paper.paper_id;


    if (!paperId) {

      throw new Error(
        "OpenAlex paper ID is missing."
      );

    }


    const payload = {

      openalex_id:
        String(
          paperId
        ),

      title:
        paper.title ||
        "Untitled Paper",

      authors:
        paper.authors ||
        null,

      abstract:
        paper.abstract ||
        null,

      year:
        paper.year ||
        null,

      venue:
        paper.venue ||
        null,

      citation_count:
        Number(
          paper.citation_count ||
          0
        ),

      paper_url:
        paper.paper_url ||
        paper.url ||
        null,

      pdf_url:
        paper.pdf_url ||
        null,

      is_open_access:
        Boolean(
          paper.is_open_access
        ),

    };


    console.log(
      "Saving paper payload:",
      payload
    );


    try {

      const response =
        await axios.post(

          `${API_URL}/saved-papers`,

          payload,

          {
            headers:
              getAuthHeaders(),
          }

        );


      return response.data;

    } catch (
      error
    ) {

      console.error(
        "Save paper failed:",
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


// ============================================================
// GET SAVED PAPERS
// ============================================================

export const getSavedPapers =
  async () => {

    try {

      const response =
        await axios.get(

          `${API_URL}/saved-papers`,

          {
            headers:
              getAuthHeaders(),
          }

        );


      return response.data;

    } catch (
      error
    ) {

      console.error(
        "Get saved papers failed:",
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


// ============================================================
// DELETE SAVED PAPER
// ============================================================

export const deleteSavedPaper =
  async (
    paperId
  ) => {

    if (!paperId) {

      throw new Error(
        "Saved paper ID is required."
      );

    }


    try {

      const response =
        await axios.delete(

          `${API_URL}/saved-papers/${paperId}`,

          {
            headers:
              getAuthHeaders(),
          }

        );


      return response.data;

    } catch (
      error
    ) {

      console.error(
        "Delete saved paper failed:",
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