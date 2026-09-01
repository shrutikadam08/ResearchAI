import axios from "axios";

import {
  getToken,
} from "./authService";

import {
  API_URL,
} from "./apiConfig";


// ============================================================
// AUTH HEADERS
// ============================================================

const getHeaders = () => {

  const token = getToken();

  if (!token) {
    throw new Error(
      "No authentication token found."
    );
  }

  return {
    Authorization: `Bearer ${token}`,
  };

};


// ============================================================
// GET ALL PROJECTS
// ============================================================

export const getProjects = async () => {

  const response = await axios.get(
    `${API_URL}/projects`,
    {
      headers: getHeaders(),
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

export const getProject = async (
  projectId
) => {

  if (!projectId) {
    throw new Error(
      "Project ID is required."
    );
  }

  const response = await axios.get(
    `${API_URL}/projects/${projectId}`,
    {
      headers: getHeaders(),
    }
  );

  return response.data;

};


// ============================================================
// GET PAPERS IN PROJECT
// ============================================================

export const getProjectPapers = async (
  projectId
) => {

  if (!projectId) {
    throw new Error(
      "Project ID is required."
    );
  }

  const response = await axios.get(
    `${API_URL}/projects/${projectId}/papers`,
    {
      headers: getHeaders(),
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

export const addPaperToProject = async (
  projectId,
  savedPaperId
) => {

  if (!projectId) {
    throw new Error(
      "Project ID is required."
    );
  }

  if (!savedPaperId) {
    throw new Error(
      "Saved paper ID is required."
    );
  }

  const response = await axios.post(

    `${API_URL}/projects/${projectId}/papers`,

    {
      saved_paper_id:
        Number(savedPaperId),
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
    "POST /projects/:id/papers response:",
    response.data
  );

  return response.data;

};


// ============================================================
// REMOVE PAPER FROM PROJECT
// ============================================================

export const removePaperFromProject = async (
  projectId,
  savedPaperId
) => {

  if (!projectId) {
    throw new Error(
      "Project ID is required."
    );
  }

  if (!savedPaperId) {
    throw new Error(
      "Saved paper ID is required."
    );
  }

  const response = await axios.delete(

    `${API_URL}/projects/${projectId}/papers/${savedPaperId}`,

    {
      headers: getHeaders(),
    }

  );

  return response.data;

};


// ============================================================
// UPDATE PROJECT
// ============================================================

export const updateProject = async (
  projectId,
  data
) => {

  if (!projectId) {
    throw new Error(
      "Project ID is required."
    );
  }

  const response = await axios.put(

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

export const deleteProject = async (
  projectId
) => {

  if (!projectId) {
    throw new Error(
      "Project ID is required."
    );
  }

  const response = await axios.delete(

    `${API_URL}/projects/${projectId}`,

    {
      headers: getHeaders(),
    }

  );

  return response.data;

};


// ============================================================
// ASK PROJECT RESEARCH AGENT
// ============================================================
//
// Normal question:
//
//   askProject(projectId, question)
//
// Comparison:
//
//   askProject(
//     projectId,
//     question,
//     selectedPaperIds
//   )
//
// ============================================================

export const askProject = async (
  projectId,
  question,
  paperIds = []
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


  const normalizedPaperIds =
    Array.isArray(paperIds)

      ? paperIds
          .map(
            (id) => Number(id)
          )
          .filter(
            (id) =>
              Number.isInteger(id) &&
              id > 0
          )

      : [];


  console.log(
    "ASK PROJECT REQUEST:",
    {
      projectId:
        Number(projectId),

      question:
        question.trim(),

      paperIds:
        normalizedPaperIds,
    }
  );


  const response =
    await axios.post(

      `${API_URL}/projects/${projectId}/ask`,

      {
        question:
          question.trim(),

        paper_ids:
          normalizedPaperIds,
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

export const createConversation = async (
  projectId,
  title = "Research Chat"
) => {

  if (!projectId) {
    throw new Error(
      "Project ID is required."
    );
  }

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

export const getConversations = async (
  projectId
) => {

  if (!projectId) {
    throw new Error(
      "Project ID is required."
    );
  }

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
// GET CONVERSATION
// ============================================================

export const getConversation = async (
  projectId,
  conversationId
) => {

  if (!projectId) {
    throw new Error(
      "Project ID is required."
    );
  }

  if (!conversationId) {
    throw new Error(
      "Conversation ID is required."
    );
  }

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

export const deleteConversation = async (
  projectId,
  conversationId
) => {

  if (!projectId) {
    throw new Error(
      "Project ID is required."
    );
  }

  if (!conversationId) {
    throw new Error(
      "Conversation ID is required."
    );
  }

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

export const getConversationMessages = async (
  projectId,
  conversationId
) => {

  if (!projectId) {
    throw new Error(
      "Project ID is required."
    );
  }

  if (!conversationId) {
    throw new Error(
      "Conversation ID is required."
    );
  }

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
// SEND CHAT MESSAGE
// ============================================================

export const sendChatMessage = async (
  projectId,
  conversationId,
  content
) => {

  if (!projectId) {
    throw new Error(
      "Project ID is required."
    );
  }

  if (!conversationId) {
    throw new Error(
      "Conversation ID is required."
    );
  }

  if (
    !content ||
    !content.trim()
  ) {
    throw new Error(
      "Message content is required."
    );
  }

  const response =
    await axios.post(

      `${API_URL}/projects/${projectId}/conversations/${conversationId}/chat`,

      {
        content:
          content.trim(),
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
// GET PROJECT DOCUMENTS
// ============================================================

export const getProjectDocuments = async (
  projectId
) => {

  if (!projectId) {
    throw new Error(
      "Project ID is required."
    );
  }

  const response =
    await axios.get(

      `${API_URL}/projects/${projectId}/documents`,

      {
        headers:
          getHeaders(),
      }

    );

  console.log(
    "GET /projects/:id/documents response:",
    response.data
  );

  return response.data;

};


// ============================================================
// UPLOAD DOCUMENT
// ============================================================

export const uploadDocument = async (
  projectId,
  file
) => {

  if (!projectId) {
    throw new Error(
      "Project ID is required."
    );
  }

  if (!file) {
    throw new Error(
      "PDF file is required."
    );
  }


  const formData =
    new FormData();


  formData.append(
    "file",
    file
  );


  const response =
    await axios.post(

      `${API_URL}/projects/${projectId}/documents`,

      formData,

      {
        headers: {
          ...getHeaders(),
        },
      }

    );


  console.log(
    "POST /projects/:id/documents response:",
    response.data
  );


  return response.data;

};


// ============================================================
// PROCESS DOCUMENT
// ============================================================

export const processDocument = async (
  projectId,
  documentId
) => {

  if (!projectId) {
    throw new Error(
      "Project ID is required."
    );
  }

  if (!documentId) {
    throw new Error(
      "Document ID is required."
    );
  }


  const response =
    await axios.post(

      `${API_URL}/projects/${projectId}/document/${documentId}/process`,

      {},

      {
        headers:
          getHeaders(),
      }

    );


  console.log(
    "POST /projects/:id/document/:documentId/process response:",
    response.data
  );


  return response.data;

};


// ============================================================
// DEFAULT EXPORT
// ============================================================

export default {

  getProjects,

  getProject,

  getProjectPapers,

  addPaperToProject,

  removePaperFromProject,

  updateProject,

  deleteProject,

  askProject,

  createConversation,

  getConversations,

  getConversation,

  deleteConversation,

  getConversationMessages,

  sendChatMessage,

  getProjectDocuments,

};