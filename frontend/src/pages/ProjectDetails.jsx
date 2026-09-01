import {
  useEffect,
  useState,
} from "react";

import {
  ArrowLeft,
  BookOpen,
  Calendar,
  ExternalLink,
  FileText,
  FolderOpen,
  Loader2,
  Quote,
  Sparkles,
  Trash2,
  User,
  Send,
  Plus,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Pencil,
  X,
  Save,
  GitCompare,
  Search,
  AlertCircle,
} from "lucide-react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  getProject,
  getProjectPapers,
  getProjectDocuments,
  removePaperFromProject,
  createConversation,
  getConversations,
  getConversationMessages,
  sendChatMessage,
  deleteConversation,
  updateProject,
  deleteProject,
  askProject,
} from "../services/projectService";

import {
  getToken,
} from "../services/authService";


function ProjectDetails() {

  const navigate =
    useNavigate();

  const {
    projectId,
  } = useParams();


  // ==========================================================
  // PROJECT
  // ==========================================================

  const [
    project,
    setProject,
  ] = useState(null);


  const [
    papers,
    setPapers,
  ] = useState([]);

  const [
    documents,
    setDocuments,
  ]=useState([]);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    error,
    setError,
  ] = useState("");


  const [
    removingPaperId,
    setRemovingPaperId,
  ] = useState(null);




  // ==========================================================
  // DELETE PROJECT
  // ==========================================================

  const [
    deleteLoading,
    setDeleteLoading,
  ] = useState(false);


  // ==========================================================
  // CHAT
  // ==========================================================

  const [
    conversations,
    setConversations,
  ] = useState([]);


  const [
    activeConversation,
    setActiveConversation,
  ] = useState(null);


  const [
    messages,
    setMessages,
  ] = useState([]);


  const [
    chatInput,
    setChatInput,
  ] = useState("");


  const [
    chatLoading,
    setChatLoading,
  ] = useState(false);


  const [
    chatLoadingMessages,
    setChatLoadingMessages,
  ] = useState(false);


  const [
    chatError,
    setChatError,
  ] = useState("");


  const [
    deletingConversationId,
    setDeletingConversationId,
  ] = useState(null);


  // ==========================================================
  // EXPANDED SOURCES
  // ==========================================================

  const [
    expandedSources,
    setExpandedSources,
  ] = useState({});


  // ==========================================================
  // RESEARCH TOOLS
  // ==========================================================

  const [
    compareOpen,
    setCompareOpen,
  ] = useState(false);


  const [
    selectedPaperIds,
    setSelectedPaperIds,
  ] = useState([]);


  const [
    compareLoading,
    setCompareLoading,
  ] = useState(false);


  const [
    compareResult,
    setCompareResult,
  ] = useState(null);


  const [
    compareError,
    setCompareError,
  ] = useState("");


  const [
    gapLoading,
    setGapLoading,
  ] = useState(false);


  const [
    gapResult,
    setGapResult,
  ] = useState(null);


  const [
    gapError,
    setGapError,
  ] = useState("");


  // ==========================================================
  // AUTH
  // ==========================================================

  const isLoggedIn =
    Boolean(
      getToken()
    );


  // ==========================================================
  // LOAD PROJECT
  // ==========================================================

  useEffect(() => {

    if (!isLoggedIn) {

      navigate(
        "/login",
        {
          replace: true,
        }
      );

      return;

    }


    const loadProject =
      async () => {

        try {

          setLoading(
            true
          );

          setError("");


          const [
            projectData,
            paperData,
            documentData,
            conversationData,
          ] = await Promise.all([

            getProject(
              projectId
            ),

            getProjectPapers(
              projectId
            ),

            getProjectDocuments(
              projectId
            ),

            getConversations(projectId),

          ]);


          setProject(
            projectData
          );


          setPapers(
            Array.isArray(
              paperData
            )
              ? paperData
              : []


          );

          setDocuments(
            Array.isArray(documentData)
            ? documentData
            : []
          );

          setConversations(
            Array.isArray(conversationData)
            ? conversationData
            : []
          );


          let loadedConversations =
            Array.isArray(
              conversationData
            )
              ? conversationData
              : [];


          if (
            loadedConversations.length ===
            0
          ) {

            const newConversation =
              await createConversation(
                projectId,
                "Research Chat"
              );


            loadedConversations = [
              newConversation,
            ];

          }


          setConversations(
            loadedConversations
          );


          setActiveConversation(
            loadedConversations[0]
          );

        } catch (
          requestError
        ) {

          console.error(
            "Failed to load project:",
            requestError
          );


          if (
            requestError?.response?.status ===
            401
          ) {

            localStorage.removeItem(
              "access_token"
            );

            localStorage.removeItem(
              "is_logged_in"
            );


            navigate(
              "/login",
              {
                replace: true,
              }
            );

            return;

          }


        const detail = requestError?.response?.data?.detail;

let errorMessage = "Unable to load this project.";

if (typeof detail === "string") {
  errorMessage = detail;
} else if (Array.isArray(detail)) {
  const messages = detail
    .map((item) => {
      if (typeof item === "string") {
        return item;
      }

      return item?.msg || "";
    })
    .filter(Boolean);

  if (messages.length > 0) {
    errorMessage = messages.join(", ");
  }
}

setError(errorMessage);
        } finally {

          setLoading(
            false
          );

        }

      };


    loadProject();

  }, [
    projectId,
    navigate,
    isLoggedIn,
  ]);


  // ==========================================================
  // LOAD ACTIVE CONVERSATION
  // ==========================================================

  useEffect(() => {

    if (
      !activeConversation
    ) {

      setMessages([]);

      return;

    }


    const loadMessages =
      async () => {

        try {

          setChatLoadingMessages(
            true
          );

          setChatError("");


          const data =
            await getConversationMessages(

              projectId,

              activeConversation.id

            );


          setMessages(
            Array.isArray(
              data
            )
              ? data
              : []
          );

        } catch (
          requestError
        ) {

          console.error(
            "Failed to load messages:",
            requestError
          );


          if (
            requestError?.response?.status ===
            401
          ) {

            localStorage.removeItem(
              "access_token"
            );

            localStorage.removeItem(
              "is_logged_in"
            );


            navigate(
              "/login",
              {
                replace: true,
              }
            );

            return;

          }


          setChatError(
            requestError?.response?.data?.detail ||
            "Unable to load this conversation."
          );

        } finally {

          setChatLoadingMessages(
            false
          );

        }

      };


    loadMessages();

  }, [
    projectId,
    activeConversation,
    navigate,
  ]);


  // ==========================================================
  // AUTHORS
  // ==========================================================

  const getAuthorsText =
    (
      authors
    ) => {

      if (!authors) {

        return "";

      }


      if (
        typeof authors ===
        "string"
      ) {

        return authors;

      }


      if (
        Array.isArray(
          authors
        )
      ) {

        return authors
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

      }


      return "";

    };


  // ==========================================================
// EDIT PROJECT STATE
// ==========================================================

const [
  editOpen,
  setEditOpen,
] = useState(false);

const [
  editTitle,
  setEditTitle,
] = useState("");

const [
  editDescription,
  setEditDescription,
] = useState("");

const [
  editLoading,
  setEditLoading,
] = useState(false);

const [
  editError,
  setEditError,
] = useState("");

  // ==========================================================
  // EDIT PROJECT
  // ==========================================================

  const handleOpenEdit =
    () => {

      if (!project) {

        return;

      }


      setEditTitle(
        project.title || ""
      );


      setEditDescription(
        project.description || ""
      );


      setEditError("");

      setEditOpen(true);

    };


  const handleCloseEdit =
    () => {

      if (
        editLoading
      ) {

        return;

      }


      setEditOpen(false);

      setEditError("");

    };


  const handleUpdateProject =
    async (
      event
    ) => {

      event.preventDefault();


      if (
        editLoading
      ) {

        return;

      }


      setEditError("");


      const trimmedTitle =
        editTitle.trim();


      const trimmedDescription =
        editDescription.trim();


      if (
        !trimmedTitle
      ) {

        setEditError(
          "Please enter a project title."
        );

        return;

      }


      if (
        trimmedTitle.length < 2
      ) {

        setEditError(
          "Project title must contain at least 2 characters."
        );

        return;

      }


      if (
        trimmedTitle.length > 200
      ) {

        setEditError(
          "Project title cannot exceed 200 characters."
        );

        return;

      }


      if (
        trimmedDescription.length > 2000
      ) {

        setEditError(
          "Project description cannot exceed 2000 characters."
        );

        return;

      }


      try {

        setEditLoading(
          true
        );


        const updatedProject =
          await updateProject(
            projectId,
            {
              title:
                trimmedTitle,

              description:
                trimmedDescription ||
                null,
            }
          );


        setProject(
          updatedProject
        );


        setEditOpen(
          false
        );

      } catch (
        requestError
      ) {

        console.error(
          "Failed to update project:",
          requestError
        );


        if (
          requestError?.response?.status ===
          401
        ) {

          localStorage.removeItem(
            "access_token"
          );

          localStorage.removeItem(
            "is_logged_in"
          );


          navigate(
            "/login",
            {
              replace: true,
            }
          );

          return;

        }


        setEditError(
          requestError?.response?.data?.detail ||
          "Unable to update the project."
        );

      } finally {

        setEditLoading(
          false
        );

      }

    };


  // ==========================================================
  // DELETE PROJECT
  // ==========================================================

  const handleDeleteProject =
    async () => {

      if (
        deleteLoading ||
        !project
      ) {

        return;

      }


      const confirmed =
        window.confirm(
          `Delete "${project.title}"?

This will permanently delete the project, its project papers, and its research conversations.

Your saved papers in My Library will NOT be deleted.

This action cannot be undone.`
        );


      if (!confirmed) {

        return;

      }


      try {

        setDeleteLoading(
          true
        );

        setError("");


        await deleteProject(
          projectId
        );


        navigate(
          "/dashboard",
          {
            replace: true,
          }
        );

      } catch (
        requestError
      ) {

        console.error(
          "Failed to delete project:",
          requestError
        );


        if (
          requestError?.response?.status ===
          401
        ) {

          localStorage.removeItem(
            "access_token"
          );

          localStorage.removeItem(
            "is_logged_in"
          );


          navigate(
            "/login",
            {
              replace: true,
            }
          );

          return;

        }


        setError(
          requestError?.response?.data?.detail ||
          "Unable to delete the project."
        );

      } finally {

        setDeleteLoading(
          false
        );

      }

    };



  // ==========================================================
  // REMOVE PAPER
  // ==========================================================

  const handleRemovePaper =
    async (
      paper
    ) => {

      const confirmed =
        window.confirm(
          "Remove this paper from the project?"
        );


      if (!confirmed) {

        return;

      }


      try {

        setRemovingPaperId(
          paper.id
        );


        await removePaperFromProject(
          projectId,
          paper.id
        );


        setPapers(
          (previous) =>
            previous.filter(
              (item) =>
                item.id !==
                paper.id
            )
        );

      } catch (
        requestError
      ) {

        console.error(
          "Failed to remove paper:",
          requestError
        );


        setError(
          requestError?.response?.data?.detail ||
          "Unable to remove the paper."
        );

      } finally {

        setRemovingPaperId(
          null
        );

      }

    };


  // ==========================================================
  // AI ANALYZE
  // ==========================================================

  const handleAnalyze =
    (
      paper
    ) => {

      sessionStorage.setItem(
        "researchai_analysis_paper",
        JSON.stringify(
          paper
        )
      );


      navigate(
        "/paper-analysis",
        {
          state: {
            paper,
            returnTo: `/projects/${projectId}`,
          },
        }
      );

    };


  // ==========================================================
  // COMPARE PAPER SELECTION
  // ==========================================================

  const togglePaperSelection =
    (
      paperId
    ) => {

      setSelectedPaperIds(
        (previous) => {

          if (
            previous.includes(
              paperId
            )
          ) {

            return previous.filter(
              (id) =>
                id !== paperId
            );

          }


          if (
            previous.length >= 2
          ) {

            return previous;

          }


          return [
            ...previous,
            paperId,
          ];

        }
      );

    };


  // ==========================================================
  // OPEN COMPARE
  // ==========================================================

  const handleOpenCompare =
    () => {

      if (
        papers.length < 2
      ) {

        setCompareError(
          "Add at least two papers to this project before comparing them."
        );

        setCompareOpen(
          true
        );

        return;

      }


      setCompareError("");

      setCompareResult(null);

      setSelectedPaperIds([]);

      setCompareOpen(
        true
      );

    };


  // ==========================================================
  // CLOSE COMPARE
  // ==========================================================

  const handleCloseCompare =
    () => {

      if (
        compareLoading
      ) {

        return;

      }


      setCompareOpen(
        false
      );

      setCompareError("");

      setCompareResult(
        null
      );

      setSelectedPaperIds([]);

    };


  // ==========================================================
  // COMPARE PAPERS
  // ==========================================================

  const handleComparePapers =
    async () => {

      if (
        selectedPaperIds.length !==
        2
      ) {

        setCompareError(
          "Please select exactly two papers to compare."
        );

        return;

      }


      const selectedPapers =
        papers.filter(
          (paper) =>
            selectedPaperIds.includes(
              paper.id
            )
        );


      if (
        selectedPapers.length !==
        2
      ) {

        setCompareError(
          "The selected papers could not be found."
        );

        return;

      }


      const firstPaper =
        selectedPapers[0];


      const secondPaper =
        selectedPapers[1];


      const question = `
Compare these two research papers.

Paper 1:
${firstPaper.title}

Paper 2:
${secondPaper.title}

Compare their:
- research objectives
- methodology
- datasets or experimental setup
- main findings
- strengths
- limitations
- similarities
- differences

Use only evidence from the papers in this project.
Clearly identify which paper each point belongs to.
`;

      try {

        setCompareLoading(
          true
        );

        setCompareError("");

        setCompareResult(
          null
        );


        const response =
          await askProject(
            projectId,
            question,
            selectedPaperIds
          );


        setCompareResult(
          response
        );

      } catch (
        requestError
      ) {

        console.error(
          "Paper comparison failed:",
          requestError
        );


        if (
          requestError?.response?.status ===
          401
        ) {

          localStorage.removeItem(
            "access_token"
          );

          localStorage.removeItem(
            "is_logged_in"
          );


          navigate(
            "/login",
            {
              replace: true,
            }
          );

          return;

        }


        setCompareError(
          requestError?.response?.data?.detail ||
          "Unable to compare the selected papers."
        );

      } finally {

        setCompareLoading(
          false
        );

      }

    };


  // ==========================================================
  // FIND RESEARCH GAPS
  // ==========================================================

  const handleFindResearchGaps =
    async () => {

      if (
        papers.length ===
        0
      ) {

        setGapError(
          "Add at least one paper to this project before finding research gaps."
        );

        return;

      }


      try {

        setGapLoading(
          true
        );

        setGapError("");

        setGapResult(
          null
        );


        const response =
          await askProject(

            projectId,

            `
Identify the key research gaps across the research papers in this project.

Analyze the papers collectively and identify:
- areas that are insufficiently studied
- conflicting or incomplete findings
- methodological limitations that create opportunities for research
- datasets, populations, or scenarios that are missing
- promising future research directions

Use only evidence from the papers in this project.
For every major research gap, explain the evidence supporting it.
`

          );


        setGapResult(
          response
        );

      } catch (
        requestError
      ) {

        console.error(
          "Research gap analysis failed:",
          requestError
        );


        if (
          requestError?.response?.status ===
          401
        ) {

          localStorage.removeItem(
            "access_token"
          );

          localStorage.removeItem(
            "is_logged_in"
          );


          navigate(
            "/login",
            {
              replace: true,
            }
          );

          return;

        }


        setGapError(
          requestError?.response?.data?.detail ||
          "Unable to identify research gaps."
        );

      } finally {

        setGapLoading(
          false
        );

      }

    };


  // ==========================================================
  // NEW CONVERSATION
  // ==========================================================

  const handleNewConversation =
    async () => {

      if (
        chatLoading
      ) {

        return;

      }


      try {

        setChatError("");


        const conversation =
          await createConversation(
            projectId,
            `Research Chat ${
              conversations.length + 1
            }`
          );


        setConversations(
          (previous) => [
            conversation,
            ...previous,
          ]
        );


        setActiveConversation(
          conversation
        );


        setMessages([]);

        setChatInput("");

        setExpandedSources({});

      } catch (
        requestError
      ) {

        console.error(
          "Failed to create conversation:",
          requestError
        );


        setChatError(
          requestError?.response?.data?.detail ||
          "Unable to create a new conversation."
        );

      }

    };


  // ==========================================================
  // SELECT CONVERSATION
  // ==========================================================

  const handleSelectConversation =
    (
      conversation
    ) => {

      if (
        chatLoading
      ) {

        return;

      }


      if (
        conversation.id ===
        activeConversation?.id
      ) {

        return;

      }


      setActiveConversation(
        conversation
      );

      setChatError("");

      setChatInput("");

      setExpandedSources({});

    };


  // ==========================================================
  // DELETE CONVERSATION
  // ==========================================================

  const handleDeleteConversation =
    async (
      conversation
    ) => {

      if (
        !conversation ||
        chatLoading
      ) {

        return;

      }


      const confirmed =
        window.confirm(
          `Delete "${
            conversation.title ||
            "Research Chat"
          }"?

This will permanently delete this conversation and its messages. Your project and papers will not be deleted.`
        );


      if (!confirmed) {

        return;

      }


      try {

        setDeletingConversationId(
          conversation.id
        );

        setChatError("");


        await deleteConversation(
          projectId,
          conversation.id
        );


        const remaining =
          conversations.filter(
            (item) =>
              item.id !==
              conversation.id
          );


        if (
          activeConversation?.id ===
          conversation.id
        ) {

          setMessages([]);

          setExpandedSources({});

          setActiveConversation(
            null
          );


          if (
            remaining.length > 0
          ) {

            setConversations(
              remaining
            );


            setActiveConversation(
              remaining[0]
            );

          } else {

            const newConversation =
              await createConversation(
                projectId,
                "Research Chat"
              );


            setConversations([
              newConversation,
            ]);


            setActiveConversation(
              newConversation
            );

          }

        } else {

          setConversations(
            remaining
          );

        }

      } catch (
        requestError
      ) {

        console.error(
          "Failed to delete conversation:",
          requestError
        );


        setChatError(
          requestError?.response?.data?.detail ||
          "Unable to delete this conversation."
        );

      } finally {

        setDeletingConversationId(
          null
        );

      }

    };


  // ==========================================================
  // SEND CHAT
  // ==========================================================

  const handleSendMessage =
    async (
      event
    ) => {

      event.preventDefault();


      if (
        chatLoading
      ) {

        return;

      }


      if (
        !activeConversation
      ) {

        setChatError(
          "Please select a conversation."
        );

        return;

      }


      const content =
        chatInput.trim();


      if (!content) {

        return;

      }


      setChatLoading(
        true
      );

      setChatError("");

      setChatInput("");


      const temporaryId =
        `temp-${Date.now()}`;


      const temporaryUserMessage = {

        id:
          temporaryId,

        conversation_id:
          activeConversation.id,

        role:
          "USER",

        content,

        created_at:
          new Date().toISOString(),

      };


      setMessages(
        (previous) => [
          ...previous,
          temporaryUserMessage,
        ]
      );


      try {

        const response =
          await sendChatMessage(
            projectId,
            activeConversation.id,
            content
          );


        const assistantMessage = {

          id:
            response.message_id ||
            `assistant-${Date.now()}`,

          conversation_id:
            activeConversation.id,

          role:
            "ASSISTANT",

          content:
            response.answer ||
            "No answer generated.",

          created_at:
            new Date().toISOString(),

          citations:
            Array.isArray(
              response.citations
            )
              ? response.citations
              : [],

          evidence:
            response.evidence ||
            null,

          tool:
            response.tool ||
            null,

        };


        setMessages(
          (previous) => [
            ...previous,
            assistantMessage,
          ]
        );


        setConversations(
          (previous) =>
            previous.map(
              (
                conversation
              ) =>
                conversation.id ===
                activeConversation.id
                  ? {
                      ...conversation,
                      updated_at:
                        new Date().toISOString(),
                    }
                  : conversation
            )
        );

      } catch (
        requestError
      ) {

        console.error(
          "Chat request failed:",
          requestError
        );


        setMessages(
          (previous) =>
            previous.filter(
              (message) =>
                message.id !==
                temporaryId
            )
        );


        if (
          requestError?.response?.status ===
          401
        ) {

          localStorage.removeItem(
            "access_token"
          );

          localStorage.removeItem(
            "is_logged_in"
          );


          navigate(
            "/login",
            {
              replace: true,
            }
          );

          return;

        }


        setChatError(
          requestError?.response?.data?.detail ||
          "ResearchAI could not answer your question."
        );

      } finally {

        setChatLoading(
          false
        );

      }

    };


  // ==========================================================
  // TOGGLE SOURCE
  // ==========================================================

  const toggleSource =
    (
      messageId,
      sourceKey
    ) => {

      const key =
        `${messageId}-${sourceKey}`;


      setExpandedSources(
        (previous) => ({
          ...previous,
          [key]:
            !previous[key],
        })
      );

    };


  // ==========================================================
  // FIND EVIDENCE FOR CHAT CITATION
  // ==========================================================

  const getEvidenceForCitation =
    (
      message,
      citation
    ) => {

      const result =
        message?.evidence;


      if (
        !result ||
        typeof result !==
        "object"
      ) {

        return "";

      }


      const resultType =
        result.type;


      if (
        resultType === "search" ||
        resultType === "summary"
      ) {

        const evidence =
          Array.isArray(
            result.evidence
          )
            ? result.evidence
            : [];


        const matchingItem =
          evidence.find(
            (
              item
            ) =>
              String(
                item?.document_id
              ) ===
              String(
                citation?.document_id
              ) &&
              String(
                item?.page_number
              ) ===
              String(
                citation?.page_number
              )
          );


        return (
          matchingItem?.text ||
          ""
        );

      }


      if (
        resultType ===
          "comparison" ||
        resultType ===
          "research_gap"
      ) {

        const documents =
          Array.isArray(
            result.documents
          )
            ? result.documents
            : [];


        for (
          const document
          of documents
        ) {

          if (
            String(
              document?.document_id
            ) !==
            String(
              citation?.document_id
            )
          ) {

            continue;

          }


          const evidence =
            Array.isArray(
              document?.evidence
            )
              ? document.evidence
              : [];


          const matchingItem =
            evidence.find(
              (
                item
              ) =>
                String(
                  item?.page_number
                ) ===
                String(
                  citation?.page_number
                )
            );


          if (
            matchingItem?.text
          ) {

            return matchingItem.text;

          }

        }

      }


      return "";

    };


  // ==========================================================
  // SOURCE TITLE
  // ==========================================================

  const getSourceTitle =
    (
      citation
    ) => {

      if (
        citation?.title
      ) {

        return citation.title;

      }


      return (
        `Document ${
          citation?.document_id ??
          "Unknown"
        }`
      );

    };


  // ==========================================================
  // RENDER CITATIONS
  // ==========================================================

  const renderCitations =
    (
      message
    ) => {

      const citations =
        Array.isArray(
          message?.citations
        )
          ? message.citations
          : [];


      if (
        citations.length ===
        0
      ) {

        return null;

      }


      return (

        <div
          className="
            mt-4
            border-t
            border-slate-100
            pt-3
          "
        >

          <div
            className="
              flex
              items-center
              gap-2
            "
          >

            <BookOpen
              size={14}
              className="
                text-indigo-600
              "
            />


            <span
              className="
                text-xs
                font-semibold
                text-slate-600
              "
            >
              Sources
            </span>

          </div>


          <div
            className="
              mt-2
              space-y-2
            "
          >

            {citations.map(
              (
                citation,
                index
              ) => {

                const sourceKey =
                  `${citation.document_id}-${citation.page_number}-${index}`;


                const expanded =
                  Boolean(
                    expandedSources[
                      `${message.id}-${sourceKey}`
                    ]
                  );


                const evidenceText =
                  getEvidenceForCitation(
                    message,
                    citation
                  );


                return (

                  <div
                    key={
                      sourceKey
                    }
                    className="
                      overflow-hidden
                      rounded-xl
                      border
                      border-slate-200
                      bg-slate-50
                    "
                  >

                    <button
                      type="button"
                      onClick={() =>
                        toggleSource(
                          message.id,
                          sourceKey
                        )
                      }
                      className="
                        flex
                        w-full
                        items-center
                        gap-3
                        px-3
                        py-3
                        text-left
                        hover:bg-slate-100
                      "
                    >

                      <span
                        className="
                          flex
                          h-6
                          w-6
                          shrink-0
                          items-center
                          justify-center
                          rounded-full
                          bg-indigo-100
                          text-[10px]
                          font-bold
                          text-indigo-700
                        "
                      >
                        {citation.id ??
                          index + 1}
                      </span>


                      <div
                        className="
                          min-w-0
                          flex-1
                        "
                      >

                        <p
                          className="
                            truncate
                            text-xs
                            font-medium
                            text-slate-700
                          "
                        >
                          {getSourceTitle(
                            citation
                          )}
                        </p>


                        <p
                          className="
                            mt-0.5
                            text-[11px]
                            text-slate-400
                          "
                        >

                          Document{" "}
                          {citation.document_id ??
                            "Unknown"}

                          {" • Page "}

                          {citation.page_number ??
                            "Unknown"}

                          {citation.publication_year && (
                            <>
                              {" • "}
                              {
                                citation.publication_year
                              }
                            </>
                          )}

                        </p>

                      </div>


                      {evidenceText ? (

                        expanded ? (

                          <ChevronUp
                            size={16}
                            className="
                              shrink-0
                              text-slate-400
                            "
                          />

                        ) : (

                          <ChevronDown
                            size={16}
                            className="
                              shrink-0
                              text-slate-400
                            "
                          />

                        )

                      ) : (

                        <span
                          className="
                            shrink-0
                            text-[10px]
                            text-slate-400
                          "
                        >
                          No excerpt
                        </span>

                      )}

                    </button>


                    {expanded &&
                      evidenceText && (

                        <div
                          className="
                            border-t
                            border-slate-200
                            bg-white
                            px-4
                            py-3
                          "
                        >

                          <p
                            className="
                              text-[11px]
                              font-semibold
                              uppercase
                              tracking-wide
                              text-slate-400
                            "
                          >
                            Evidence used
                          </p>


                          <p
                            className="
                              mt-2
                              whitespace-pre-wrap
                              text-xs
                              leading-6
                              text-slate-600
                            "
                          >
                            {evidenceText}
                          </p>

                        </div>

                      )}

                  </div>

                );

              }
            )}

          </div>

        </div>

      );

    };


  // ==========================================================
  // RESEARCH TOOL RESULT SOURCES
  // ==========================================================

  const renderToolSources =
  (
    result
  ) => {

    if (
      !result
    ) {

      return null;

    }


    const sources =
      Array.isArray(
        result.sources
      )
        ? result.sources
        : [];


    const evidence =
      Array.isArray(
        result.evidence
      )
        ? result.evidence
        : [];


    if (
      sources.length === 0
      &&
      evidence.length === 0
    ) {

      return null;

    }


    return (

      <div
        className="
          mt-6
          border-t
          border-slate-200
          pt-5
        "
      >

        <div
          className="
            flex
            items-center
            gap-2
          "
        >

          <BookOpen
            size={16}
            className="
              text-indigo-600
            "
          />

          <p
            className="
              text-sm
              font-semibold
              text-slate-700
            "
          >
            Sources
          </p>

        </div>


        <div
          className="
            mt-3
            space-y-2
          "
        >

          {sources.map(
            (
              source,
              index
            ) => {

              const matchingEvidence =
                evidence.find(
                  (
                    item
                  ) =>

                    String(
                      item.document_id
                    ) ===
                    String(
                      source.document_id
                    )

                    &&

                    String(
                      item.page_number
                    ) ===
                    String(
                      source.page_number
                    )
                );


              const sourceKey =
                `tool-${source.document_id}-${source.page_number}-${index}`;


              const expanded =
                Boolean(
                  expandedSources[
                    sourceKey
                  ]
                );


              return (

                <div
                  id={`tool-source-${source.document_id}-${source.page_number}`}
                  key={
                    sourceKey
                  }
                  className="
                    overflow-hidden
                    rounded-xl
                    border
                    border-slate-200
                    bg-slate-50
                  "
                >

                  <button
                    type="button"
                    onClick={() => {

                      if (
                        !matchingEvidence?.text
                      ) {

                        return;

                      }


                      setExpandedSources(
                        (previous) => ({
                          ...previous,

                          [sourceKey]:
                            !previous[
                              sourceKey
                            ],
                        })
                      );

                    }}
                    className="
                      flex
                      w-full
                      items-center
                      gap-3
                      px-3
                      py-3
                      text-left
                      hover:bg-slate-100
                    "
                  >

                    <span
                      className="
                        flex
                        h-6
                        w-6
                        shrink-0
                        items-center
                        justify-center
                        rounded-full
                        bg-indigo-100
                        text-[10px]
                        font-bold
                        text-indigo-700
                      "
                    >
                      {source.id ??
                        index + 1}
                    </span>


                    <div
                      className="
                        min-w-0
                        flex-1
                      "
                    >

                      <p
                        className="
                          truncate
                          text-xs
                          font-medium
                          text-slate-700
                        "
                        title={
                          source.title ||
                          `Document ${source.document_id}`
                        }
                      >
                        {source.title ||
                          `Document ${source.document_id}`}
                      </p>


                      <p
                        className="
                          mt-0.5
                          text-[11px]
                          text-slate-400
                        "
                      >
                        {source.authors && (
                          <>{source.authors} · </>
                        )}
                        {source.publication_year && (
                          <>{source.publication_year} · </>
                        )}
                        Page{" "}
                        {source.page_number}
                      </p>

                    </div>


                    {matchingEvidence?.text ? (

                      expanded ? (

                        <ChevronUp
                          size={16}
                          className="
                            shrink-0
                            text-slate-400
                          "
                        />

                      ) : (

                        <ChevronDown
                          size={16}
                          className="
                            shrink-0
                            text-slate-400
                          "
                        />

                      )

                    ) : (

                      <span
                        className="
                          text-[10px]
                          text-slate-400
                        "
                      >
                        No excerpt
                      </span>

                    )}

                  </button>


                  {expanded &&
                    matchingEvidence?.text && (

                      <div
                        className="
                          border-t
                          border-slate-200
                          bg-white
                          px-4
                          py-3
                        "
                      >

                        <p
                          className="
                            text-[11px]
                            font-semibold
                            uppercase
                            tracking-wide
                            text-slate-400
                          "
                        >
                          Evidence used
                        </p>


                        <p
                          className="
                            mt-2
                            whitespace-pre-wrap
                            text-xs
                            leading-6
                            text-slate-600
                          "
                        >
                          {matchingEvidence.text}
                        </p>

                      </div>

                    )}

                </div>

              );

            }
          )}

        </div>

      </div>

    );

  };


  // ==========================================================
  // COMPARISON TABLE HELPERS
  // ==========================================================

  const getComparisonPapers = () => {

    return papers.filter(
      (paper) =>
        selectedPaperIds.includes(
          paper.id
        )
    );

  };


  const getComparisonTable = () => {

    const selected =
      papers.filter(
        (paper) =>
          selectedPaperIds.includes(
            paper.id
          )
      );


    if (
      selected.length !== 2
    ) {

      return [];

    }


    return [
      {
        label: "Authors",
        getValue: (paper) =>
          getAuthorsText(paper.authors) ||
          "Not available",
      },
      {
        label: "Year",
        getValue: (paper) =>
          paper.year ||
          "Not available",
      },
      {
        label: "Venue",
        getValue: (paper) =>
          paper.venue ||
          "Not available",
      },
      {
        label: "Citations",
        getValue: (paper) =>
          paper.citation_count ||
          0,
      },
      {
        label: "Open access",
        getValue: (paper) =>
          paper.is_open_access
            ? "Yes"
            : "No",
      },
      {
        label: "Abstract",
        getValue: (paper) =>
          paper.abstract ||
          "Abstract not available",
      },
    ];

  };


  // ==========================================================
  // LOADING
  // ==========================================================

  if (
    loading
  ) {

    return (

      <div
        className="
          flex
          min-h-screen
          items-center
          justify-center
          bg-slate-50
        "
      >

        <div
          className="
            text-center
          "
        >

          <Loader2
            size={32}
            className="
              mx-auto
              animate-spin
              text-slate-700
            "
          />


          <p
            className="
              mt-3
              text-sm
              text-slate-500
            "
          >
            Loading project...
          </p>

        </div>

      </div>

    );

  }


  // ==========================================================
  // PROJECT NOT FOUND
  // ==========================================================

  if (
    !project
  ) {

    return (

      <div
        className="
          flex
          min-h-screen
          items-center
          justify-center
          bg-slate-50
          px-6
        "
      >

        <div
          className="
            max-w-md
            text-center
          "
        >

          <FolderOpen
            size={40}
            className="
              mx-auto
              text-slate-400
            "
          />


          <h1
            className="
              mt-4
              text-xl
              font-semibold
            "
          >
            Project not found
          </h1>


          <p
            className="
              mt-2
              text-sm
              leading-6
              text-slate-500
            "
          >
            {error ||
              "This project could not be found."}
          </p>


          <button
            type="button"
            onClick={() =>
              navigate(
                "/dashboard"
              )
            }
            className="
              mt-6
              rounded-xl
              bg-slate-900
              px-5
              py-3
              text-sm
              font-medium
              text-white
            "
          >
            Back to Dashboard
          </button>

        </div>

      </div>

    );

  }


  // ==========================================================
  // MAIN
  // ==========================================================

  return (

    <div
      className="
        min-h-screen
        bg-[#f6f7fb]
        text-slate-900
      "
    >

      {/* ======================================================
          HEADER
      ====================================================== */}

      <header
        className="
          border-b
          border-slate-200
          bg-white
        "
      >

        <div
          className="
            mx-auto
            flex
            max-w-7xl
            items-center
            justify-between
            px-6
            py-5
          "
        >

          <button
            type="button"
            onClick={() =>
              navigate(
                "/dashboard"
              )
            }
            className="
              flex
              items-center
              gap-2
              rounded-lg
              px-3
              py-2
              text-sm
              text-slate-500
              hover:bg-slate-100
              hover:text-slate-900
            "
          >

            <ArrowLeft
              size={18}
            />

            Dashboard

          </button>


          <div
            className="
              flex
              items-center
              gap-2
              text-sm
              text-slate-400
            "
          >

            <FolderOpen
              size={17}
            />

            Research Project

          </div>

        </div>

      </header>


      <main
        className="
          mx-auto
          max-w-7xl
          px-6
          py-10
        "
      >

        {/* ====================================================
            PROJECT HEADER
        ==================================================== */}

        <section
          className="
            relative
            overflow-hidden
            rounded-[28px]
            bg-gradient-to-br
            from-slate-950
            via-slate-900
            to-indigo-950
            p-7
            text-white
            shadow-[0_20px_60px_rgba(15,23,42,0.12)]
          "
        >

          <div
            className="
              flex
              flex-col
              gap-6
              lg:flex-row
              lg:items-start
              lg:justify-between
            "
          >

            <div>

              <div
                className="
                  flex
                  items-center
                  gap-3
                "
              >

                <div
                  className="
                    flex
                    h-11
                    w-11
                    items-center
                    justify-center
                    rounded-xl
                    bg-white/10
                  "
                >

                  <FolderOpen
                    size={21}
                  />

                </div>


                <span
                  className="
                    text-sm
                    text-slate-400
                  "
                >
                  RESEARCH WORKSPACE
                </span>

              </div>


              <h1
                className="
                  mt-5
                  text-3xl
                  font-semibold
                  tracking-tight
                "
              >
                {project.title}
              </h1>


              {project.description && (

                <p
                  className="
                    mt-3
                    max-w-2xl
                    text-sm
                    leading-6
                    text-slate-400
                  "
                >
                  {project.description}
                </p>

              )}

            </div>


            <div
              className="
                flex
                flex-col
                gap-3
                sm:flex-row
                lg:flex-col
                xl:flex-row
                xl:items-center
              "
            >

              <div
                className="
                  rounded-2xl
                  bg-white/10
                  px-5
                  py-4
                "
              >

                <p
                  className="
                    text-xs
                    text-slate-400
                  "
                >
                  Papers in project
                </p>


                <p
                  className="
                    mt-1
                    text-3xl
                    font-semibold
                  "
                >
                  {papers.length}
                </p>

              </div>


              <div
                className="
                  flex
                  gap-2
                "
              >

                <button
                  type="button"
                  onClick={
                    handleOpenEdit
                  }
                  disabled={
                    deleteLoading
                  }
                  className="
                    flex
                    items-center
                    gap-2
                    rounded-xl
                    border
                    border-white/15
                    bg-white/10
                    px-4
                    py-2.5
                    text-sm
                    font-medium
                    text-white
                    hover:bg-white/15
                    disabled:opacity-50
                  "
                >

                  <Pencil
                    size={16}
                  />

                  Edit

                </button>


                <button
                  type="button"
                  onClick={
                    handleDeleteProject
                  }
                  disabled={
                    deleteLoading
                  }
                  className="
                    flex
                    items-center
                    gap-2
                    rounded-xl
                    border
                    border-red-400/20
                    bg-red-500/10
                    px-4
                    py-2.5
                    text-sm
                    font-medium
                    text-red-200
                    hover:bg-red-500/20
                    disabled:opacity-50
                  "
                >

                  {deleteLoading ? (

                    <Loader2
                      size={16}
                      className="
                        animate-spin
                      "
                    />

                  ) : (

                    <Trash2
                      size={16}
                    />

                  )}

                  {deleteLoading
                    ? "Deleting..."
                    : "Delete"}

                </button>

              </div>

            </div>

          </div>

        </section>


        {/* ====================================================
            RESEARCH INTELLIGENCE PULSE
        ==================================================== */}

        <section
          className="
            mt-5
            grid
            gap-3
            sm:grid-cols-2
            lg:grid-cols-4
          "
        >

          <div
            className="
              rounded-2xl
              border
              border-slate-200
              bg-white
              p-4
              shadow-sm
            "
          >
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              <BookOpen size={14} />
              Evidence base
            </div>
            <p className="mt-2 text-xl font-semibold text-slate-900">
              {papers.length} papers
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Papers currently powering this workspace
            </p>
          </div>

          <div
            className="
              rounded-2xl
              border
              border-slate-200
              bg-white
              p-4
              shadow-sm
            "
          >
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              <MessageSquare size={14} />
              Conversations
            </div>
            <p className="mt-2 text-xl font-semibold text-slate-900">
              {conversations.length}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Research discussions saved in this project
            </p>
          </div>

          <div
            className="
              rounded-2xl
              border
              border-slate-200
              bg-white
              p-4
              shadow-sm
            "
          >
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              <GitCompare size={14} />
              Synthesis
            </div>
            <p className="mt-2 text-xl font-semibold text-slate-900">
              Compare + gaps
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Cross-paper intelligence tools are ready
            </p>
          </div>

          <div
            className="
              rounded-2xl
              border
              border-indigo-100
              bg-indigo-50/70
              p-4
              shadow-sm
            "
          >
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-500">
              <Sparkles size={14} />
              ResearchAI
            </div>
            <p className="mt-2 text-xl font-semibold text-slate-900">
              Evidence-first
            </p>
            <p className="mt-1 text-xs text-indigo-500/80">
              Answers stay grounded in project papers
            </p>
          </div>

        </section>


        {error && (

          <div
            className="
              mt-6
              rounded-xl
              border
              border-red-200
              bg-red-50
              px-4
              py-3
              text-sm
              text-red-700
            "
          >
            {error}
          </div>

        )}


        {/* ====================================================
            RESEARCH TOOLS
        ==================================================== */}

        <section
          className="
            mt-10
          "
        >

          <div
            className="
              mb-5
            "
          >

            <div
              className="
                flex
                items-center
                gap-2
              "
            >

              <Sparkles
                size={20}
                className="
                  text-indigo-600
                "
              />


              <h2
                className="
                  text-xl
                  font-semibold
                "
              >
                Research Tools
              </h2>

            </div>


            <p
              className="
                mt-1
                text-sm
                text-slate-400
              "
            >
              Turn your paper collection into structured research insight.
            </p>

          </div>


          <div
            className="
              grid
              gap-5
              md:grid-cols-2
            "
          >

            {/* ==================================================
                COMPARE
            ================================================== */}

            <div
              className="
                group
                relative
                overflow-hidden
                rounded-3xl
                border
                border-slate-200
                bg-white
                p-6
                shadow-[0_8px_30px_rgba(15,23,42,0.06)]
                transition
                duration-200
                hover:-translate-y-0.5
                hover:shadow-[0_16px_40px_rgba(15,23,42,0.10)]
              "
            >

              <div
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-2xl
                  bg-indigo-50
                  transition
                  group-hover:scale-105
                "
              >

                <GitCompare
                  size={21}
                  className="
                    text-indigo-600
                  "
                />

              </div>


              <h3
                className="
                  mt-4
                  text-lg
                  font-semibold
                "
              >
                Compare Papers
              </h3>


              <p
                className="
                  mt-2
                  text-sm
                  leading-6
                  text-slate-500
                "
              >
                Compare two papers by their objectives,
                methodology, findings, strengths, and limitations.
              </p>


              <button
                type="button"
                onClick={
                  handleOpenCompare
                }
                className="
                  mt-5
                  flex
                  items-center
                  gap-2
                  rounded-xl
                  bg-slate-900
                  px-4
                  py-2.5
                  text-sm
                  font-medium
                  text-white
                  hover:bg-slate-800
                "
              >

                <GitCompare
                  size={16}
                />

                Compare Papers

              </button>

            </div>


            {/* ==================================================
                RESEARCH GAPS
            ================================================== */}

            <div
              className="
                group
                relative
                overflow-hidden
                rounded-3xl
                border
                border-slate-200
                bg-white
                p-6
                shadow-[0_8px_30px_rgba(15,23,42,0.06)]
                transition
                duration-200
                hover:-translate-y-0.5
                hover:shadow-[0_16px_40px_rgba(15,23,42,0.10)]
              "
            >

              <div
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-2xl
                  bg-amber-50
                  transition
                  group-hover:scale-105
                "
              >

                <Search
                  size={21}
                  className="
                    text-amber-600
                  "
                />

              </div>


              <h3
                className="
                  mt-4
                  text-lg
                  font-semibold
                "
              >
                Research Gaps
              </h3>


              <p
                className="
                  mt-2
                  text-sm
                  leading-6
                  text-slate-500
                "
              >
                Analyze the papers in this project to discover
                missing areas, limitations, and future opportunities.
              </p>


              <button
                type="button"
                onClick={
                  handleFindResearchGaps
                }
                disabled={
                  gapLoading
                }
                className="
                  mt-5
                  flex
                  items-center
                  gap-2
                  rounded-xl
                  bg-slate-900
                  px-4
                  py-2.5
                  text-sm
                  font-medium
                  text-white
                  hover:bg-slate-800
                  disabled:opacity-50
                "
              >

                {gapLoading ? (

                  <Loader2
                    size={16}
                    className="
                      animate-spin
                    "
                  />

                ) : (

                  <Search
                    size={16}
                  />

                )}

                {gapLoading
                  ? "Finding Gaps..."
                  : "Find Research Gaps"}

              </button>

            </div>

          </div>


          {/* ====================================================
              COMPARE ERROR
          ==================================================== */}

          {compareError && !compareOpen && (

            <div
              className="
                mt-4
                rounded-xl
                border
                border-red-200
                bg-red-50
                px-4
                py-3
                text-sm
                text-red-700
              "
            >
              {compareError}
            </div>

          )}


          {/* ====================================================
              RESEARCH GAP ERROR
          ==================================================== */}

          {gapError && (

            <div
              className="
                mt-4
                rounded-xl
                border
                border-red-200
                bg-red-50
                px-4
                py-3
                text-sm
                text-red-700
              "
            >
              {gapError}
            </div>

          )}


          {/* ====================================================
              RESEARCH GAP RESULT
          ==================================================== */}

          {gapResult && (

            <div
              className="
                mt-6
                rounded-2xl
                border
                border-amber-200
                bg-white
                p-6
                shadow-sm
              "
            >

              <div
                className="
                  flex
                  items-center
                  gap-2
                "
              >

                <Search
                  size={19}
                  className="
                    text-amber-600
                  "
                />


                <h3
                  className="
                    text-lg
                    font-semibold
                  "
                >
                  Research Gap Analysis
                </h3>

              </div>


              <div
                className="
                  mt-5
                  rounded-xl
                  bg-slate-50
                  p-5
                "
              >

                <p
                  className="
                    whitespace-pre-wrap
                    text-sm
                    leading-7
                    text-slate-700
                  "
                >
                  {gapResult.answer ||
                    "No research gap analysis was generated."}
                </p>

              </div>


              {renderToolSources(
                gapResult
              )}

            </div>

          )}





        </section>

        {/* ====================================================
            PROJECT PAPERS
        ==================================================== */}

        <section
          className="
            mt-10
          "
        >

          <div
            className="
              mb-5
            "
          >

            <h2
              className="
                text-xl
                font-semibold
              "
            >
              Project Papers
            </h2>


            <p
              className="
                mt-1
                text-sm
                text-slate-400
              "
            >
              Papers organized under this research project.
            </p>

          </div>


          {papers.length === 0 ? (

            <div
              className="
                rounded-2xl
                border
                border-dashed
                border-slate-300
                bg-white
                p-12
                text-center
              "
            >

              <BookOpen
                size={30}
                className="
                  mx-auto
                  text-slate-400
                "
              />


              <h3
                className="
                  mt-4
                  font-semibold
              "
              >
                No papers in this project yet
              </h3>


              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/dashboard"
                  )
                }
                className="
                  mt-6
                  rounded-xl
                  bg-slate-900
                  px-5
                  py-2.5
                  text-sm
                  font-medium
                  text-white
                "
              >
                Search Papers
              </button>

            </div>

          ) : (

            <div
              className="
                space-y-5
              "
            >

              {papers.map(
                (
                  paper
                ) => {

                  const removing =
                    removingPaperId ===
                    paper.id;


                  return (

                    <article
                      key={
                        paper.id
                      }
                      className="
                        group
                        rounded-2xl
                        border
                        border-slate-200
                        bg-white
                        p-6
                        shadow-sm
                        transition
                        duration-200
                        hover:-translate-y-0.5
                        hover:border-slate-300
                        hover:shadow-[0_14px_35px_rgba(15,23,42,0.08)]
                      "
                    >

                      <h3
                        className="
                          text-lg
                          font-semibold
                          leading-7
                        "
                      >
                        {paper.title ||
                          "Untitled Paper"}
                      </h3>


                      {paper.authors && (

                        <div
                          className="
                            mt-3
                            flex
                            items-start
                            gap-2
                            text-sm
                            text-slate-500
                          "
                        >

                          <User
                            size={16}
                          />

                          <span>
                            {getAuthorsText(
                              paper.authors
                            )}
                          </span>

                        </div>

                      )}


                      <div
                        className="
                          mt-3
                          flex
                          flex-wrap
                          items-center
                          gap-4
                          text-xs
                          text-slate-400
                        "
                      >

                        {paper.year && (

                          <span
                            className="
                              flex
                              items-center
                              gap-1.5
                            "
                          >

                            <Calendar
                              size={14}
                            />

                            {paper.year}

                          </span>

                        )}


                        {paper.venue && (

                          <span>
                            {paper.venue}
                          </span>

                        )}


                        <span
                          className="
                            flex
                            items-center
                            gap-1.5
                          "
                        >

                          <Quote
                            size={14}
                          />

                          {paper.citation_count || 0}
                          {" "}
                          citations

                        </span>

                      </div>


                      {paper.abstract && (

                        <p
                          className="
                            mt-4
                            line-clamp-4
                            text-sm
                            leading-6
                            text-slate-500
                          "
                        >
                          {paper.abstract}
                        </p>

                      )}


                      <div
                        className="
                          mt-5
                          flex
                          flex-wrap
                          gap-2
                        "
                      >

                        <button
                          type="button"
                          onClick={() =>
                            handleAnalyze(
                              paper
                            )
                          }
                          className="
                            flex
                            items-center
                            gap-2
                            rounded-xl
                            bg-slate-900
                            px-4
                            py-2.5
                            text-sm
                            font-medium
                            text-white
                            hover:bg-slate-800
                          "
                        >

                          <Sparkles
                            size={16}
                          />

                          AI Analyze

                        </button>


                        {paper.paper_url && (

                          <a
                            href={
                              paper.paper_url
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="
                              flex
                              items-center
                              gap-2
                              rounded-xl
                              bg-slate-100
                              px-4
                              py-2.5
                              text-sm
                              font-medium
                              text-slate-700
                            "
                          >

                            <ExternalLink
                              size={16}
                            />

                            Paper

                          </a>

                        )}



                        <button
                          type="button"
                          onClick={() =>
                            handleRemovePaper(
                              paper
                            )
                          }
                          disabled={
                            removing
                          }
                          className="
                            flex
                            items-center
                            gap-2
                            rounded-xl
                            bg-red-50
                            px-4
                            py-2.5
                            text-sm
                            font-medium
                            text-red-600
                            hover:bg-red-100
                            disabled:opacity-50
                          "
                        >

                          {removing ? (

                            <Loader2
                              size={16}
                              className="
                                animate-spin
                              "
                            />

                          ) : (

                            <Trash2
                              size={16}
                            />

                          )}

                          Remove

                        </button>

                      </div>

                    </article>

                  );

                }
              )}

            </div>

          )}

        </section>


        {/* ====================================================
            RESEARCH CHAT
        ==================================================== */}

        <section
          className="
            mt-12
            overflow-hidden
            rounded-[28px]
            border
            border-slate-200
            bg-white
            shadow-[0_18px_55px_rgba(15,23,42,0.08)]
          "
        >

          <div
            className="
              flex
              flex-col
              lg:flex-row
            "
          >

            {/* ==================================================
                CONVERSATIONS
            ================================================== */}

            <aside
              className="
                w-full
                border-b
                border-slate-200
                bg-slate-50
                lg:w-80
                lg:border-b-0
                lg:border-r
              "
            >

              <div
                className="
                  flex
                  items-center
                  justify-between
                  p-4
                "
              >

                <div
                  className="
                    flex
                    items-center
                    gap-2
                  "
                >

                  <MessageSquare
                    size={18}
                  />

                  <span
                    className="
                      text-sm
                      font-semibold
                    "
                  >
                    Research Chat
                  </span>

                </div>


                <button
                  type="button"
                  onClick={
                    handleNewConversation
                  }
                  disabled={
                    chatLoading ||
                    deletingConversationId !==
                    null
                  }
                  className="
                    flex
                    h-8
                    w-8
                    items-center
                    justify-center
                    rounded-lg
                    bg-slate-900
                    text-white
                    hover:bg-slate-800
                    disabled:opacity-50
                  "
                >

                  <Plus
                    size={16}
                  />

                </button>

              </div>


              <div
                className="
                  max-h-96
                  overflow-y-auto
                  p-2
                "
              >

                {conversations.map(
                  (
                    conversation
                  ) => {

                    const active =
                      activeConversation?.id ===
                      conversation.id;


                    const deleting =
                      deletingConversationId ===
                      conversation.id;


                    return (

                      <div
                        key={
                          conversation.id
                        }
                        className={`
                          mb-1
                          flex
                          items-center
                          gap-1
                          rounded-xl

                          ${
                            active
                              ? "bg-slate-900"
                              : "bg-transparent hover:bg-white"
                          }
                        `}
                      >

                        <button
                          type="button"
                          onClick={() =>
                            handleSelectConversation(
                              conversation
                            )
                          }
                          disabled={
                            chatLoading ||
                            deleting
                          }
                          className={`
                            flex
                            min-w-0
                            flex-1
                            items-center
                            gap-3
                            px-3
                            py-3
                            text-left

                            ${
                              active
                                ? "text-white"
                                : "text-slate-600"
                            }
                          `}
                        >

                          <MessageSquare
                            size={15}
                          />


                          <span
                            className="
                              truncate
                              text-sm
                              font-medium
                            "
                          >
                            {conversation.title ||
                              "Research Chat"}
                          </span>

                        </button>


                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteConversation(
                              conversation
                            )
                          }
                          disabled={
                            chatLoading ||
                            deleting
                          }
                          className={`
                            mr-2
                            flex
                            h-8
                            w-8
                            shrink-0
                            items-center
                            justify-center
                            rounded-lg

                            ${
                              active
                                ? "text-slate-300 hover:bg-white/10 hover:text-white"
                                : "text-slate-400 hover:bg-red-50 hover:text-red-600"
                            }

                            disabled:opacity-50
                          `}
                          title="Delete conversation"
                        >

                          {deleting ? (

                            <Loader2
                              size={15}
                              className="
                                animate-spin
                              "
                            />

                          ) : (

                            <Trash2
                              size={15}
                            />

                          )}

                        </button>

                      </div>

                    );

                  }
                )}

              </div>

            </aside>


            {/* ==================================================
                CHAT AREA
            ================================================== */}

            <div
              className="
                flex
                min-h-[620px]
                min-w-0
                flex-1
                flex-col
              "
            >

              <div
                className="
                  border-b
                  border-slate-200
                  bg-white/90
                  px-6
                  py-5
                "
              >

                <h3
                  className="
                    text-sm
                    font-semibold
                  "
                >
                  {activeConversation?.title ||
                    "Research Chat"}
                </h3>


                <p
                  className="
                    mt-1
                    text-xs
                    text-slate-400
                  "
                >
                  Ask questions about this project's research.
                </p>

              </div>


              {chatError && (

                <div
                  className="
                    mx-4
                    mt-4
                    rounded-xl
                    border
                    border-red-200
                    bg-red-50
                    px-4
                    py-3
                    text-sm
                    text-red-700
                  "
                >
                  {chatError}
                </div>

              )}


              <div
                className="
                  flex-1
                  space-y-4
                  overflow-y-auto
                  bg-slate-50
                  p-5
                "
              >

                {chatLoadingMessages ? (

                  <div
                    className="
                      flex
                      h-full
                      items-center
                      justify-center
                    "
                  >

                    <div
                      className="
                        text-center
                      "
                    >

                      <Loader2
                        size={26}
                        className="
                          mx-auto
                          animate-spin
                          text-slate-500
                        "
                      />


                      <p
                        className="
                          mt-3
                          text-xs
                          text-slate-400
                        "
                      >
                        Loading conversation...
                      </p>

                    </div>

                  </div>

                ) : messages.length === 0 ? (

                  <div
                    className="
                      flex
                      h-full
                      flex-col
                      items-center
                      justify-center
                      px-6
                      text-center
                    "
                  >

                    <div
                      className="
                        flex
                        h-12
                        w-12
                        items-center
                        justify-center
                        rounded-2xl
                        bg-indigo-50
                      "
                    >

                      <Sparkles
                        size={21}
                        className="
                          text-indigo-600
                        "
                      />

                    </div>


                    <h4
                      className="
                        mt-4
                        font-semibold
                      "
                    >
                      Ask ResearchAI
                    </h4>


                    <p
                      className="
                        mt-2
                        max-w-md
                        text-sm
                        leading-6
                        text-slate-400
                      "
                    >
                      Ask about methodologies, findings,
                      limitations, research gaps, or other
                      questions about your project papers.
                    </p>

                  </div>

                ) : (

                  messages.map(
                    (
                      message
                    ) => {

                      const isUser =
                        String(
                          message.role
                        ).toUpperCase() ===
                        "USER";


                      return (

                        <div
                          key={
                            message.id
                          }
                          className={`
                            flex
                            ${
                              isUser
                                ? "justify-end"
                                : "justify-start"
                            }
                          `}
                        >

                          <div
                            className={`
                              max-w-[88%]
                              rounded-2xl
                              px-4
                              py-3
                              text-sm
                              leading-6

                              ${
                                isUser
                                  ? "bg-slate-900 text-white"
                                  : "border border-slate-200 bg-white text-slate-700"
                              }
                            `}
                          >

                            {!isUser && (

                              <div
                                className="
                                  mb-2
                                  flex
                                  items-center
                                  gap-2
                                  text-xs
                                  font-semibold
                                  text-indigo-600
                                "
                              >

                                <Sparkles
                                  size={14}
                                />

                                ResearchAI

                              </div>

                            )}


                            <div
                              className="
                                whitespace-pre-wrap
                              "
                            >
                              {message.content}
                            </div>


                            {!isUser &&
                              renderCitations(
                                message
                              )}

                          </div>

                        </div>

                      );

                    }
                  )

                )}


                {chatLoading && (

                  <div
                    className="
                      flex
                      justify-start
                    "
                  >

                    <div
                      className="
                        flex
                        items-center
                        gap-2
                        rounded-2xl
                        border
                        border-slate-200
                        bg-white
                        px-4
                        py-3
                        text-sm
                        text-slate-500
                      "
                    >

                      <Loader2
                        size={16}
                        className="
                          animate-spin
                        "
                      />

                      ResearchAI is thinking...

                    </div>

                  </div>

                )}

              </div>


              <form
                onSubmit={
                  handleSendMessage
                }
                className="
                  border-t
                  border-slate-200
                  bg-white
                  p-4
                "
              >

                <div
                  className="
                    flex
                    items-end
                    gap-3
                    rounded-2xl
                    border
                    border-slate-200
                    bg-slate-50
                    p-2
                    shadow-inner
                  "
                >

                  <textarea
                    value={
                      chatInput
                    }
                    onChange={(
                      event
                    ) =>
                      setChatInput(
                        event.target.value
                      )
                    }
                    placeholder="
                      Ask something about this project's research...
                    "
                    rows={2}
                    disabled={
                      chatLoading ||
                      !activeConversation
                    }
                    className="
                      min-h-[52px]
                      flex-1
                      resize-none
                      bg-transparent
                      px-3
                      py-2
                      text-sm
                      text-slate-900
                      outline-none
                      placeholder:text-slate-400
                    "
                  />


                  <button
                    type="submit"
                    disabled={
                      chatLoading ||
                      !chatInput.trim() ||
                      !activeConversation
                    }
                    className="
                      flex
                      h-11
                      w-11
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      bg-slate-900
                      text-white
                      hover:bg-slate-800
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    "
                  >

                    {chatLoading ? (

                      <Loader2
                        size={18}
                        className="
                          animate-spin
                        "
                      />

                    ) : (

                      <Send
                        size={18}
                      />

                    )}

                  </button>

                </div>


                <p
                  className="
                    mt-2
                    text-[11px]
                    text-slate-400
                  "
                >
                  Enter to send. Shift + Enter for a new line.
                </p>

              </form>

            </div>

          </div>

        </section>

      </main>


      {/* ======================================================
          EDIT PROJECT MODAL
      ====================================================== */}

      {editOpen && (

        <div
          className="
            fixed
            inset-0
            z-50
            flex
            items-center
            justify-center
            bg-slate-950/50
            px-4
            backdrop-blur-sm
          "
        >

          <div
            className="
              w-full
              max-w-lg
              rounded-2xl
              border
              border-slate-200
              bg-white
              shadow-2xl
            "
          >

            <div
              className="
                flex
                items-center
                justify-between
                border-b
                border-slate-100
                px-6
                py-5
              "
            >

              <div>

                <h2
                  className="
                    text-lg
                    font-semibold
                    text-slate-900
                  "
                >
                  Edit Project
                </h2>


                <p
                  className="
                    mt-1
                    text-xs
                    text-slate-500
                  "
                >
                  Update your project's title and description.
                </p>

              </div>


              <button
                type="button"
                onClick={
                  handleCloseEdit
                }
                disabled={
                  editLoading
                }
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-lg
                  text-slate-400
                  hover:bg-slate-100
                  hover:text-slate-700
                  disabled:opacity-50
                "
              >

                <X
                  size={18}
                />

              </button>

            </div>


            <form
              onSubmit={
                handleUpdateProject
              }
              className="
                p-6
              "
            >

              {editError && (

                <div
                  className="
                    mb-5
                    rounded-xl
                    border
                    border-red-200
                    bg-red-50
                    px-4
                    py-3
                    text-sm
                    leading-6
                    text-red-700
                  "
                >
                  {editError}
                </div>

              )}


              <div>

                <label
                  htmlFor="edit-project-title"
                  className="
                    mb-2
                    block
                    text-sm
                    font-medium
                    text-slate-700
                  "
                >
                  Project Title
                </label>


                <input
                  id="edit-project-title"
                  type="text"
                  value={
                    editTitle
                  }
                  onChange={(
                    event
                  ) => {

                    setEditTitle(
                      event.target.value
                    );

                    setEditError("");

                  }}
                  minLength={2}
                  maxLength={200}
                  required
                  disabled={
                    editLoading
                  }
                  className="
                    w-full
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    px-4
                    py-3
                    text-sm
                    text-slate-900
                    outline-none
                    focus:border-slate-500
                    focus:ring-4
                    focus:ring-slate-100
                    disabled:bg-slate-50
                  "
                />


                <p
                  className="
                    mt-2
                    text-xs
                    text-slate-400
                  "
                >
                  {editTitle.length}/200 characters
                </p>

              </div>


              <div
                className="
                  mt-5
                "
              >

                <label
                  htmlFor="edit-project-description"
                  className="
                    mb-2
                    block
                    text-sm
                    font-medium
                    text-slate-700
                  "
                >
                  Description
                </label>


                <textarea
                  id="edit-project-description"
                  value={
                    editDescription
                  }
                  onChange={(
                    event
                  ) => {

                    setEditDescription(
                      event.target.value
                    );

                    setEditError("");

                  }}
                  maxLength={2000}
                  rows={5}
                  disabled={
                    editLoading
                  }
                  className="
                    w-full
                    resize-none
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    px-4
                    py-3
                    text-sm
                    leading-6
                    text-slate-900
                    outline-none
                    focus:border-slate-500
                    focus:ring-4
                    focus:ring-slate-100
                    disabled:bg-slate-50
                  "
                />


                <p
                  className="
                    mt-2
                    text-right
                    text-xs
                    text-slate-400
                  "
                >
                  {editDescription.length}/2000
                </p>

              </div>


              <div
                className="
                  mt-7
                  flex
                  flex-col-reverse
                  gap-3
                  border-t
                  border-slate-100
                  pt-5
                  sm:flex-row
                  sm:justify-end
                "
              >

                <button
                  type="button"
                  onClick={
                    handleCloseEdit
                  }
                  disabled={
                    editLoading
                  }
                  className="
                    rounded-xl
                    border
                    border-slate-200
                    px-5
                    py-2.5
                    text-sm
                    font-medium
                    text-slate-600
                    hover:bg-slate-50
                    disabled:opacity-50
                  "
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  disabled={
                    editLoading ||
                    !editTitle.trim()
                  }
                  className="
                    flex
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    bg-slate-900
                    px-5
                    py-2.5
                    text-sm
                    font-medium
                    text-white
                    hover:bg-slate-800
                    disabled:opacity-50
                  "
                >

                  {editLoading ? (

                    <>

                      <Loader2
                        size={16}
                        className="
                          animate-spin
                        "
                      />

                      Saving...

                    </>

                  ) : (

                    <>

                      <Save
                        size={16}
                      />

                      Save Changes

                    </>

                  )}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* ======================================================
          COMPARE PAPERS MODAL
      ====================================================== */}

      {compareOpen && (

        <div
          className="
            fixed
            inset-0
            z-50
            flex
            items-center
            justify-center
            bg-slate-950/50
            px-4
            py-6
            backdrop-blur-sm
          "
        >

          <div
            className="
              flex
              max-h-[90vh]
              w-full
              max-w-4xl
              flex-col
              overflow-hidden
              rounded-2xl
              border
              border-slate-200
              bg-white
              shadow-2xl
            "
          >

            {/* HEADER */}

            <div
              className="
                flex
                items-center
                justify-between
                border-b
                border-slate-100
                px-6
                py-5
              "
            >

              <div
                className="
                  flex
                  items-center
                  gap-3
                "
              >

                <div
                  className="
                    flex
                    h-10
                    w-10
                    items-center
                    justify-center
                    rounded-xl
                    bg-indigo-50
                  "
                >

                  <GitCompare
                    size={19}
                    className="
                      text-indigo-600
                    "
                  />

                </div>


                <div>

                  <h2
                    className="
                      text-lg
                      font-semibold
                    "
                  >
                    Compare Papers
                  </h2>


                  <p
                    className="
                      mt-1
                      text-xs
                      text-slate-500
                    "
                  >
                    Select exactly two papers.
                  </p>

                </div>

              </div>


              <button
                type="button"
                onClick={
                  handleCloseCompare
                }
                disabled={
                  compareLoading
                }
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-lg
                  text-slate-400
                  hover:bg-slate-100
                  disabled:opacity-50
                "
              >

                <X
                  size={18}
                />

              </button>

            </div>


            <div
              className="
                overflow-y-auto
                p-6
              "
            >

              {compareError && (

                <div
                  className="
                    mb-5
                    rounded-xl
                    border
                    border-red-200
                    bg-red-50
                    px-4
                    py-3
                    text-sm
                    text-red-700
                  "
                >
                  {compareError}
                </div>

              )}


              {papers.length < 2 ? (

                <div
                  className="
                    rounded-2xl
                    border
                    border-dashed
                    border-slate-300
                    bg-slate-50
                    p-10
                    text-center
                  "
                >

                  <AlertCircle
                    size={30}
                    className="
                      mx-auto
                      text-slate-400
                    "
                  />


                  <p
                    className="
                      mt-4
                      text-sm
                      text-slate-600
                    "
                  >
                    You need at least two papers in
                    this project to use comparison.
                  </p>

                </div>

              ) : (

                <>

                  <div
                    className="
                      grid
                      gap-4
                      md:grid-cols-2
                    "
                  >

                    {papers.map(
                      (
                        paper
                      ) => {

                        const selected =
                          selectedPaperIds.includes(
                            paper.id
                          );


                        const disabled =
                          !selected &&
                          selectedPaperIds.length >=
                          2;


                        return (

                          <button
                            key={
                              paper.id
                            }
                            type="button"
                            onClick={() =>
                              togglePaperSelection(
                                paper.id
                              )
                            }
                            disabled={
                              disabled ||
                              compareLoading
                            }
                            className={`
                              rounded-2xl
                              border
                              p-5
                              text-left
                              transition

                              ${
                                selected
                                  ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100"
                                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                              }

                              ${
                                disabled
                                  ? "cursor-not-allowed opacity-40"
                                  : ""
                              }
                            `}
                          >

                            <div
                              className="
                                flex
                                items-start
                                gap-3
                              "
                            >

                              <span
                                className={`
                                  mt-0.5
                                  flex
                                  h-5
                                  w-5
                                  shrink-0
                                  items-center
                                  justify-center
                                  rounded-md
                                  border

                                  ${
                                    selected
                                      ? "border-indigo-600 bg-indigo-600 text-white"
                                      : "border-slate-300 bg-white"
                                  }
                                `}
                              >

                                {selected
                                  ? "✓"
                                  : ""}

                              </span>


                              <div
                                className="
                                  min-w-0
                                "
                              >

                                <p
                                  className="
                                    text-sm
                                    font-semibold
                                    leading-6
                                    text-slate-800
                                  "
                                >
                                  {paper.title ||
                                    "Untitled Paper"}
                                </p>


                                {paper.year && (

                                  <p
                                    className="
                                      mt-2
                                      text-xs
                                      text-slate-400
                                    "
                                  >
                                    {paper.year}
                                  </p>

                                )}

                              </div>

                            </div>

                          </button>

                        );

                      }
                    )}

                  </div>


                  <div
                    className="
                      mt-6
                      flex
                      items-center
                      justify-between
                      border-t
                      border-slate-100
                      pt-5
                    "
                  >

                    <p
                      className="
                        text-xs
                        text-slate-400
                      "
                    >
                      {selectedPaperIds.length}
                      {" "}
                      of 2 papers selected
                    </p>


                    <button
                      type="button"
                      onClick={
                        handleComparePapers
                      }
                      disabled={
                        compareLoading ||
                        selectedPaperIds.length !==
                        2
                      }
                      className="
                        flex
                        items-center
                        gap-2
                        rounded-xl
                        bg-slate-900
                        px-5
                        py-2.5
                        text-sm
                        font-medium
                        text-white
                        hover:bg-slate-800
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                      "
                    >

                      {compareLoading ? (

                        <>

                          <Loader2
                            size={16}
                            className="
                              animate-spin
                            "
                          />

                          Comparing...

                        </>

                      ) : (

                        <>

                          <GitCompare
                            size={16}
                          />

                          Compare Selected Papers

                        </>

                      )}

                    </button>

                  </div>


                  {compareResult && (

                    <div
                      className="
                        mt-7
                        rounded-2xl
                        border
                        border-indigo-100
                        bg-slate-50
                        p-5
                      "
                    >

                      <div
                        className="
                          flex
                          items-center
                          justify-between
                          gap-3
                        "
                      >

                        <div
                          className="
                            flex
                            items-center
                            gap-2
                          "
                        >

                          <Sparkles
                            size={18}
                            className="
                              text-indigo-600
                            "
                          />


                          <div>

                            <h3
                              className="
                                text-base
                                font-semibold
                                text-slate-800
                              "
                            >
                              Comparison Table
                            </h3>

                            <p
                              className="
                                mt-0.5
                                text-xs
                                text-slate-400
                              "
                            >
                              Structured overview of the two selected papers.
                            </p>

                          </div>

                        </div>

                      </div>


                      {getComparisonPapers().length === 2 && (

                        <div
                          className="
                            mt-5
                            overflow-x-auto
                            rounded-xl
                            border
                            border-slate-200
                            bg-white
                          "
                        >

                          <table
                            className="
                              min-w-[760px]
                              w-full
                              border-collapse
                              text-left
                            "
                          >

                            <thead>

                              <tr
                                className="
                                  border-b
                                  border-slate-200
                                  bg-slate-50
                                "
                              >

                                <th
                                  className="
                                    w-44
                                    px-4
                                    py-3
                                    text-xs
                                    font-semibold
                                    uppercase
                                    tracking-wide
                                    text-slate-400
                                  "
                                >
                                  Aspect
                                </th>

                                {getComparisonPapers().map(
                                  (paper) => (

                                    <th
                                      key={paper.id}
                                      className="
                                        px-4
                                        py-3
                                        align-top
                                      "
                                    >
                                      <p
                                        className="
                                          text-sm
                                          font-semibold
                                          leading-5
                                          text-slate-800
                                        "
                                      >
                                        {paper.title ||
                                          "Untitled Paper"}
                                      </p>

                                      <p
                                        className="
                                          mt-1
                                          text-[11px]
                                          font-normal
                                          text-slate-400
                                        "
                                      >
                                        {paper.year ||
                                          "Year unavailable"}
                                        {paper.venue
                                          ? ` • ${paper.venue}`
                                          : ""}
                                      </p>
                                    </th>

                                  )
                                )}

                              </tr>

                            </thead>

                            <tbody>

                              {getComparisonTable().map(
                                (row) => (

                                  <tr
                                    key={row.label}
                                    className="
                                      border-b
                                      border-slate-100
                                      last:border-b-0
                                      align-top
                                    "
                                  >

                                    <td
                                      className="
                                        bg-slate-50/70
                                        px-4
                                        py-4
                                        text-xs
                                        font-semibold
                                        text-slate-600
                                      "
                                    >
                                      {row.label}
                                    </td>

                                    {getComparisonPapers().map(
                                      (paper) => (
                                        <td
                                          key={`${paper.id}-${row.label}`}
                                          className="
                                            px-4
                                            py-4
                                            text-sm
                                            leading-6
                                            text-slate-600
                                          "
                                        >
                                          {row.getValue(paper)}
                                        </td>
                                      )
                                    )}

                                  </tr>

                                )
                              )}

                            </tbody>

                          </table>

                        </div>

                      )}


                      <div
                        className="
                          mt-5
                          rounded-xl
                          bg-white
                          p-5
                        "
                      >

                        <div
                          className="
                            flex
                            items-center
                            gap-2
                          "
                        >
                          <Sparkles
                            size={15}
                            className="text-indigo-600"
                          />

                          <p
                            className="
                              text-xs
                              font-semibold
                              uppercase
                              tracking-wide
                              text-slate-400
                            "
                          >
                            AI synthesis
                          </p>

                        </div>

                        <p
                          className="
                            mt-3
                            whitespace-pre-wrap
                            text-sm
                            leading-7
                            text-slate-700
                          "
                        >
                          {compareResult.answer ||
                            "No comparison was generated."}
                        </p>

                      </div>


                      {renderToolSources(
                        compareResult
                      )}

                    </div>

                  )}

                </>

              )}

            </div>

          </div>

        </div>

      )}

    </div>

  );

}


export default ProjectDetails;