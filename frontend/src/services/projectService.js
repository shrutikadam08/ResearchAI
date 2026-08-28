import axios from "axios";

import {
  getToken,
} from "./authService";


const API_URL =
  "http://127.0.0.1:8000";


// ============================================================
// AUTH HEADERS
// ============================================================

const getHeaders = () => {

  const token =
    getToken();


  if (!token) {

    throw new Error(
      "No authentication token found."
    );

  }


  return {
    Authorization:
      `Bearer ${token}`,
  };

};


// ============================================================
// GET ALL PROJECTS
// ============================================================

export const getProjects =
  async () => {

    const response =
      await axios.get(
        `${API_URL}/projects`,
        {
          headers:
            getHeaders(),
        }
      );


    console.log(
      "GET /projects response:",
      response.data
    );


    return response.data;

  };


// ============================================================
// GET ONE PROJECT
// ============================================================

export const getProject =
  async (
    projectId
  ) => {

    if (!projectId) {

      throw new Error(
        "Project ID is required."
      );

    }


    const response =
      await axios.get(
        `${API_URL}/projects/${projectId}`,
        {
          headers:
            getHeaders(),
        }
      );


    return response.data;

  };


// ============================================================
// GET PAPERS IN PROJECT
// ============================================================

export const getProjectPapers =
  async (
    projectId
  ) => {

    if (!projectId) {

      throw new Error(
        "Project ID is required."
      );

    }


    const response =
      await axios.get(
        `${API_URL}/projects/${projectId}/papers`,
        {
          headers:
            getHeaders(),
        }
      );


    console.log(
      "GET /projects/:id/papers response:",
      response.data
    );


    return response.data;

  };


// ============================================================
// ADD PAPER TO PROJECT
// ============================================================

export const addPaperToProject =
  async (
    projectId,
    savedPaperId
  ) => {

    const response =
      await axios.post(
        `${API_URL}/projects/${projectId}/papers`,
        {
          saved_paper_id:
            Number(
              savedPaperId
            ),
        },
        {
          headers: {
            ...getHeaders(),

            "Content-Type":
              "application/json",
          },
        }
      );


    return response.data;

  };


// ============================================================
// REMOVE PAPER FROM PROJECT
// ============================================================

export const removePaperFromProject =
  async (
    projectId,
    savedPaperId
  ) => {

    const response =
      await axios.delete(
        `${API_URL}/projects/${projectId}/papers/${savedPaperId}`,
        {
          headers:
            getHeaders(),
        }
      );


    return response.data;

  };


// ============================================================
// UPDATE PROJECT
// ============================================================

export const updateProject =
  async (
    projectId,
    data
  ) => {

    const response =
      await axios.put(
        `${API_URL}/projects/${projectId}`,
        data,
        {
          headers: {
            ...getHeaders(),

            "Content-Type":
              "application/json",
          },
        }
      );


    return response.data;

  };


// ============================================================
// DELETE PROJECT
// ============================================================

export const deleteProject =
  async (
    projectId
  ) => {

    const response =
      await axios.delete(
        `${API_URL}/projects/${projectId}`,
        {
          headers:
            getHeaders(),
        }
      );


    return response.data;

  };


// ============================================================
// ASK PROJECT RESEARCH AGENT
// ============================================================

export const askProject =
  async (
    projectId,
    question
  ) => {

    if (!projectId) {

      throw new Error(
        "Project ID is required."
      );

    }


    if (
      !question ||
      !question.trim()
    ) {

      throw new Error(
        "Question is required."
      );

    }


    const response =
      await axios.post(
        `${API_URL}/projects/${projectId}/ask`,
        {
          question:
            question.trim(),
        },
        {
          headers: {
            ...getHeaders(),

            "Content-Type":
              "application/json",
          },
        }
      );


    console.log(
      "POST /projects/:id/ask response:",
      response.data
    );


    return response.data;

  };


// ============================================================
// CREATE CONVERSATION
// ============================================================

export const createConversation =
  async (
    projectId,
    title = "Research Chat"
  ) => {

    const response =
      await axios.post(
        `${API_URL}/projects/${projectId}/conversations`,
        {
          title,
        },
        {
          headers: {
            ...getHeaders(),

            "Content-Type":
              "application/json",
          },
        }
      );


    return response.data;

  };


// ============================================================
// GET CONVERSATIONS
// ============================================================

export const getConversations =
  async (
    projectId
  ) => {

    const response =
      await axios.get(
        `${API_URL}/projects/${projectId}/conversations`,
        {
          headers:
            getHeaders(),
        }
      );


    return response.data;

  };


// ============================================================
// GET ONE CONVERSATION
// ============================================================

export const getConversation =
  async (
    projectId,
    conversationId
  ) => {

    const response =
      await axios.get(
        `${API_URL}/projects/${projectId}/conversations/${conversationId}`,
        {
          headers:
            getHeaders(),
        }
      );


    return response.data;

  };


// ============================================================
// DELETE CONVERSATION
// ============================================================

export const deleteConversation =
  async (
    projectId,
    conversationId
  ) => {

    const response =
      await axios.delete(
        `${API_URL}/projects/${projectId}/conversations/${conversationId}`,
        {
          headers:
            getHeaders(),
        }
      );


    return response.data;

  };


// ============================================================
// GET CONVERSATION MESSAGES
// ============================================================

export const getConversationMessages =
  async (
    projectId,
    conversationId
  ) => {

    const response =
      await axios.get(
        `${API_URL}/projects/${projectId}/conversations/${conversationId}/messages`,
        {
          headers:
            getHeaders(),
        }
      );


    return response.data;

  };


// ============================================================
// CHAT
// ============================================================

export const sendChatMessage =
  async (
    projectId,
    conversationId,
    content
  ) => {

    const response =
      await axios.post(
        `${API_URL}/projects/${projectId}/conversations/${conversationId}/chat`,
        {
          content,
        },
        {
          headers: {
            ...getHeaders(),

            "Content-Type":
              "application/json",
          },
        }
      );


    return response.data;

  };