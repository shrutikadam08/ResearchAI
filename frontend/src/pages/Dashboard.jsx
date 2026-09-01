import { useEffect, useRef, useState } from "react";

import {
  Search,
  FolderOpen,
  BookOpen,
  Sparkles,
  GitCompare,
  Lightbulb,
  LogOut,
  Plus,
  ArrowRight,
  Clock3,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  FileText,
  Calendar,
  User,
  Quote,
  Loader2,
  X,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import axios from "axios";

import {
  logoutUser,
} from "../services/authService";

import {
  getProjects,
} from "../services/projectService";

import {
  searchPapers,
} from "../services/paperService";

import {
  savePaper,
  getSavedPapers,
  deleteSavedPaper,
} from "../services/savedPaperService";


const API_URL =
  "http://127.0.0.1:8000";


function Dashboard() {

  const navigate =
    useNavigate();


  const searchSectionRef =
    useRef(null);


  // ==========================================================
  // PROJECTS
  // ==========================================================

  const [
    projects,
    setProjects,
  ] = useState([]);


  const [
    loadingProjects,
    setLoadingProjects,
  ] = useState(true);


  // ==========================================================
  // SEARCH
  // ==========================================================

  const [
    query,
    setQuery,
  ] = useState("");


  const [
    searching,
    setSearching,
  ] = useState(false);


  const [
    searched,
    setSearched,
  ] = useState(false);


  const [
    papers,
    setPapers,
  ] = useState([]);


  const [
    searchError,
    setSearchError,
  ] = useState("");

  // Open Access filter
  const [
    openAccessOnly,
    setOpenAccessOnly,
  ] = useState(false);


  // ==========================================================
  // SAVED PAPERS
  // ==========================================================

  const [
    savedPaperIds,
    setSavedPaperIds,
  ] = useState(
    new Set()
  );


  const [
    savingPaperId,
    setSavingPaperId,
  ] = useState(null);


  // ==========================================================
  // PROJECT MODAL
  // ==========================================================

  const [
    projectModalOpen,
    setProjectModalOpen,
  ] = useState(false);


  const [
    selectedProjectId,
    setSelectedProjectId,
  ] = useState("");


  const [
    pendingPaper,
    setPendingPaper,
  ] = useState(null);


  const [
    projectSaving,
    setProjectSaving,
  ] = useState(false);


  const [
    projectModalError,
    setProjectModalError,
  ] = useState("");


  // ==========================================================
  // AI TOOL PROJECT MODAL
  // ==========================================================

  const [
    aiToolModalOpen,
    setAiToolModalOpen,
  ] = useState(false);


  const [
    aiToolType,
    setAiToolType,
  ] = useState("");


  const [
    aiToolProjectId,
    setAiToolProjectId,
  ] = useState("");


  // ==========================================================
  // AI ANALYSIS
  // ==========================================================

  const [
    analyzingPaperId,
    setAnalyzingPaperId,
  ] = useState(null);


  // ==========================================================
  // AUTH
  // ==========================================================

  const isLoggedIn =
    () => {

      return Boolean(
        localStorage.getItem(
          "access_token"
        )
      );

    };


  // ==========================================================
  // LOAD PROJECTS
  // ==========================================================

  useEffect(() => {

    const loadProjects =
      async () => {

        try {

          const data =
            await getProjects();


          console.log(
            "Projects received:",
            data
          );


          setProjects(
            Array.isArray(data)
              ? data
              : []
          );

        } catch (error) {

          console.error(
            "Failed to load projects:",
            error
          );


          if (
            error?.response?.status ===
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

          }

        } finally {

          setLoadingProjects(
            false
          );

        }

      };


    loadProjects();

  }, [navigate]);


  // ==========================================================
  // LOAD SAVED PAPERS
  // ==========================================================

  useEffect(() => {

    const loadSavedPapers =
      async () => {

        if (!isLoggedIn()) {

          setSavedPaperIds(
            new Set()
          );

          return;

        }


        try {

          const saved =
            await getSavedPapers();


          if (
            !Array.isArray(saved)
          ) {

            return;

          }


          const ids =
            new Set(

              saved
                .map(
                  (paper) =>
                    paper.openalex_id ||
                    paper.paper_id
                )
                .filter(Boolean)

            );


          setSavedPaperIds(
            ids
          );

        } catch (error) {

          console.error(
            "Failed to load saved papers:",
            error
          );


          if (
            error?.response?.status ===
            401
          ) {

            localStorage.removeItem(
              "access_token"
            );

            localStorage.removeItem(
              "is_logged_in"
            );


            setSavedPaperIds(
              new Set()
            );


            navigate(
              "/login",
              {
                replace: true,
              }
            );

          }

        }

      };


    loadSavedPapers();

  }, [navigate]);


  // ==========================================================
  // ERROR FORMATTER
  // ==========================================================

  const getErrorMessage =
    (error) => {

      const detail =
        error?.response?.data?.detail;


      if (
        typeof detail ===
        "string"
      ) {

        return detail;

      }


      if (
        Array.isArray(detail)
      ) {

        const messages =
          detail

            .map(
              (item) => {

                if (
                  typeof item ===
                  "string"
                ) {

                  return item;

                }


                return (
                  item?.msg ||
                  ""
                );

              }
            )

            .filter(Boolean);


        if (
          messages.length > 0
        ) {

          return messages.join(
            ", "
          );

        }

      }


      if (
        error?.response?.status ===
        502
      ) {

        return (
          "The research paper service is temporarily unavailable. Please try again."
        );

      }


      if (
        error?.response?.status ===
        401
      ) {

        return (
          "Your session has expired. Please log in again."
        );

      }


      return (
        "Something went wrong. Please try again."
      );

    };


  // ==========================================================
  // SEARCH
  // ==========================================================

  const handleSearch =
    async (
      eventOrQuery
    ) => {

      let searchQuery =
        "";


      if (
        typeof eventOrQuery !==
        "string"
      ) {

        eventOrQuery?.preventDefault();

        searchQuery =
          query.trim();

      } else {

        searchQuery =
          eventOrQuery.trim();

        setQuery(
          searchQuery
        );

      }


      if (!searchQuery) {

        setSearchError(
          "Please enter a research topic, paper title, author, or keyword."
        );

        return;

      }


      setSearching(
        true
      );

      setSearched(
        true
      );

      setSearchError(
        ""
      );


      try {

        const token =
          localStorage.getItem(
            "access_token"
          );


        const response =
          await searchPapers({

            query:
              searchQuery,

            offset:
              0,

            limit:
              10,

            year:
              "",

            openAccessOnly:
              openAccessOnly,

            token:
              token ||
              undefined,

          });


        console.log(
          "Dashboard paper search response:",
          response
        );


        const results =
          Array.isArray(
            response?.results
          )
            ? response.results
            : [];


        setPapers(
          results
        );


        // Store previous search
        try {

          const existing =
            JSON.parse(
              localStorage.getItem(
                "researchai_search_history"
              ) ||
              "[]"
            );


          const history =
            Array.isArray(
              existing
            )
              ? existing
              : [];


          const updated =
            [
              searchQuery,
              ...history.filter(
                (item) =>
                  item !== searchQuery
              ),
            ].slice(
              0,
              10
            );


          localStorage.setItem(
            "researchai_search_history",
            JSON.stringify(
              updated
            )
          );

        } catch (historyError) {

          console.error(
            "Search history error:",
            historyError
          );

        }


        setTimeout(
          () => {

            searchSectionRef.current?.scrollIntoView(
              {
                behavior:
                  "smooth",

                block:
                  "start",
              }
            );

          },
          100
        );

      } catch (error) {

        console.error(
          "Paper search failed:",
          error
        );


        setSearchError(
          getErrorMessage(
            error
          )
        );


        setPapers([]);

      } finally {

        setSearching(
          false
        );

      }

    };


  // ==========================================================
  // QUICK SEARCH
  // ==========================================================

  const handleTopicSearch =
    (topic) => {

      handleSearch(
        topic
      );

    };


  // ==========================================================
  // CLEAR SEARCH
  // ==========================================================

  const handleClearSearch =
    () => {

      setQuery("");

      setPapers([]);

      setSearched(false);

      setSearchError("");


      window.scrollTo(
        {
          top: 0,
          behavior:
            "smooth",
        }
      );

    };


  // ==========================================================
  // AUTHORS
  // ==========================================================

  const getAuthorsText =
    (authors) => {

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
        Array.isArray(authors)
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
  // AUTH HEADERS
  // ==========================================================

  const getAuthHeaders =
    () => {

      const token =
        localStorage.getItem(
          "access_token"
        );


      return {

        Authorization:
          `Bearer ${token}`,

        "Content-Type":
          "application/json",

      };

    };


  // ==========================================================
  // OPEN PROJECT MODAL
  // ==========================================================

  const openProjectModal =
    (paper) => {

      if (
        !isLoggedIn()
      ) {

        navigate(
          "/login"
        );

        return;

      }


      if (
        projects.length === 0
      ) {

        setSearchError(
          "Create a project first, then save papers to it."
        );

        return;

      }


      setPendingPaper(
        paper
      );


      setSelectedProjectId(
        String(
          projects[0].id
        )
      );


      setProjectModalError(
        ""
      );


      setProjectModalOpen(
        true
      );

    };


  // ==========================================================
  // CLOSE PROJECT MODAL
  // ==========================================================

  const closeProjectModal =
    () => {

      if (
        projectSaving
      ) {

        return;

      }


      setProjectModalOpen(
        false
      );

      setSelectedProjectId(
        ""
      );

      setPendingPaper(
        null
      );

      setProjectModalError(
        ""
      );

    };


  // ==========================================================
  // SAVE PAPER TO PROJECT
  // ==========================================================

  const handleSavePaper =
    async (
      paper
    ) => {

      if (
        !isLoggedIn()
      ) {

        navigate(
          "/login"
        );

        return;

      }


      const paperId =
        paper?.paper_id ||
        paper?.id;


      if (!paperId) {

        setSearchError(
          "Unable to save this paper."
        );

        return;

      }


      openProjectModal(
        paper
      );

    };


  // ==========================================================
  // CONFIRM SAVE TO PROJECT
  // ==========================================================

  const handleConfirmProjectSave =
    async () => {

      if (
        !pendingPaper
      ) {

        return;

      }


      if (
        !selectedProjectId
      ) {

        setProjectModalError(
          "Please select a project."
        );

        return;

      }


      try {

        setProjectSaving(
          true
        );

        setProjectModalError(
          ""
        );


        const paper =
          pendingPaper;


        const paperId =
          paper?.paper_id ||
          paper?.id;


        // ------------------------------------------------------
        // Get saved papers
        // ------------------------------------------------------

        let savedPapers =
          await getSavedPapers();


        if (
          !Array.isArray(
            savedPapers
          )
        ) {

          savedPapers = [];

        }


        let savedPaper =
          savedPapers.find(
            (item) => {

              const savedId =
                item.openalex_id ||
                item.paper_id;


              return (
                String(savedId) ===
                String(paperId)
              );

            }
          );


        // ------------------------------------------------------
        // Save to library if needed
        // ------------------------------------------------------

        if (
          !savedPaper
        ) {

          const payload = {

            openalex_id:
              String(
                paperId
              ),

            title:
              paper.title ||
              "Untitled Paper",

            authors:
              getAuthorsText(
                paper.authors
              ) ||
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
            "Saving paper to library:",
            payload
          );


          savedPaper =
            await savePaper(
              payload
            );


          // Some service implementations may
          // return response.data.
          if (
            savedPaper?.data?.id
          ) {

            savedPaper =
              savedPaper.data;

          }


          // Guarantee database ID.
          if (
            !savedPaper?.id
          ) {

            const refreshed =
              await getSavedPapers();


            savedPaper =
              refreshed.find(
                (item) => {

                  const savedId =
                    item.openalex_id ||
                    item.paper_id;


                  return (
                    String(savedId) ===
                    String(paperId)
                  );

                }
              );

          }

        }


        if (
          !savedPaper?.id
        ) {

          throw new Error(
            "Unable to determine the saved paper ID."
          );

        }


        // ------------------------------------------------------
        // Add to project
        // ------------------------------------------------------

        await axios.post(

          `${API_URL}/projects/${selectedProjectId}/papers`,

          {
            saved_paper_id:
              Number(
                savedPaper.id
              ),
          },

          {
            headers:
              getAuthHeaders(),
          }

        );


        // ------------------------------------------------------
        // Update UI
        // ------------------------------------------------------

        setSavedPaperIds(
          (previous) => {

            const next =
              new Set(
                previous
              );


            next.add(
              paperId
            );


            return next;

          }
        );


        const selectedProject =
          projects.find(
            (project) =>
              String(
                project.id
              ) ===
              String(
                selectedProjectId
              )
          );


        console.log(
          "Paper added to project:",
          selectedProject
        );


        closeProjectModal();

      } catch (error) {

        console.error(
          "Failed to save paper to project:",
          error
        );


        if (
          error?.response?.status ===
          401
        ) {

          localStorage.removeItem(
            "access_token"
          );

          localStorage.removeItem(
            "is_logged_in"
          );


          closeProjectModal();


          navigate(
            "/login"
          );


          return;

        }


        if (
          error?.response?.status ===
          409
        ) {

          setSavedPaperIds(
            (previous) => {

              const next =
                new Set(
                  previous
                );


              next.add(
                pendingPaper?.paper_id ||
                pendingPaper?.id
              );


              return next;

            }
          );


          closeProjectModal();

          return;

        }


        setProjectModalError(
          getErrorMessage(
            error
          )
        );

      } finally {

        setProjectSaving(
          false
        );

      }

    };


  // ==========================================================
  // AI ANALYZE
  // ==========================================================

  const handleAnalyzePaper =
    (paper) => {

      if (
        !isLoggedIn()
      ) {

        navigate(
          "/login"
        );

        return;

      }


      const paperId =
        paper?.paper_id ||
        paper?.id;


      if (!paperId) {

        setSearchError(
          "Unable to analyze this paper."
        );

        return;

      }


      setAnalyzingPaperId(
        paperId
      );


      sessionStorage.setItem(
        "researchai_analysis_paper",
        JSON.stringify(
          paper
        )
      );


      navigate(
        "/paper-analysis"
      );

    };


  // ==========================================================
  // OPEN AI TOOL
  // ==========================================================

  const openAITool =
    (toolType) => {

      if (!isLoggedIn()) {

        navigate(
          "/login"
        );

        return;

      }


      if (projects.length === 0) {

        setSearchError(
          "Create a research project first to use AI research tools."
        );

        return;

      }


      setAiToolType(
        toolType
      );


      setAiToolProjectId(
        String(
          projects[0].id
        )
      );


      setAiToolModalOpen(
        true
      );

    };


  // ==========================================================
  // CLOSE AI TOOL MODAL
  // ==========================================================

  const closeAIToolModal =
    () => {

      setAiToolModalOpen(
        false
      );

      setAiToolType(
        ""
      );

      setAiToolProjectId(
        ""
      );

    };


  // ==========================================================
  // OPEN SELECTED PROJECT
  // ==========================================================

  const handleOpenAIToolProject =
    () => {

      if (!aiToolProjectId) {

        return;

      }


      closeAIToolModal();

      navigate(
        `/projects/${aiToolProjectId}`
      );

    };


  // ==========================================================
  // AI TOOL MODAL CONTENT
  // ==========================================================

  const getAIToolModalTitle =
    () => {

      if (aiToolType === "compare") {
        return "Compare Papers";
      }

      if (aiToolType === "gaps") {
        return "Research Gaps";
      }

      return "AI Research Assistant";

    };


  const getAIToolModalDescription =
    () => {

      if (aiToolType === "compare") {
        return "Choose the project whose papers you want to compare.";
      }

      if (aiToolType === "gaps") {
        return "Choose the project whose research literature you want to analyze for gaps.";
      }

      return "Choose the project you want ResearchAI to answer questions about.";

    };


  // ==========================================================
  // LOGOUT
  // ==========================================================

  const handleLogout =
    () => {

      logoutUser();

      navigate(
        "/login",
        {
          replace: true,
        }
      );

    };


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div
      className="
        min-h-screen
        bg-slate-50
        text-slate-900
      "
    >

      {/* ======================================================
          SIDEBAR
      ====================================================== */}

      <aside
        className="
          fixed
          left-0
          top-0
          hidden
          h-screen
          w-64
          border-r
          border-slate-200
          bg-white
          lg:flex
          lg:flex-col
        "
      >

        {/* LOGO */}

        <div
          className="
            flex
            h-20
            items-center
            gap-3
            border-b
            border-slate-100
            px-6
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
              bg-slate-900
            "
          >

            <Sparkles
              size={21}
              className="
                text-white
              "
            />

          </div>


          <div>

            <h1
              className="
                text-lg
                font-semibold
              "
            >
              ResearchAI
            </h1>


            <p
              className="
                text-xs
                text-slate-400
              "
            >
              Research intelligence
            </p>

          </div>

        </div>


        {/* NAV */}

        <nav
          className="
            flex-1
            px-4
            py-6
          "
        >

          <p
            className="
              px-3
              text-xs
              font-semibold
              uppercase
              tracking-wider
              text-slate-400
            "
          >
            Workspace
          </p>


          <div
            className="
              mt-3
              space-y-1
            "
          >

            <button
              type="button"
              onClick={() =>
                window.scrollTo(
                  {
                    top: 0,
                    behavior:
                      "smooth",
                  }
                )
              }
              className="
                flex
                w-full
                items-center
                gap-3
                rounded-xl
                bg-slate-100
                px-3
                py-2.5
                text-sm
                font-medium
                text-slate-900
              "
            >

              <BookOpen
                size={18}
              />

              Dashboard

            </button>


            <button
              type="button"
              onClick={() =>
                navigate(
                  "/library"
                )
              }
              className="
                flex
                w-full
                items-center
                gap-3
                rounded-xl
                px-3
                py-2.5
                text-sm
                text-slate-500
                transition
                hover:bg-slate-50
                hover:text-slate-900
              "
            >

              <BookOpen
                size={18}
              />

              My Library

            </button>


            <button
              type="button"
              onClick={() =>
                navigate(
                  "/projects/new"
                )
              }
              className="
                flex
                w-full
                items-center
                gap-3
                rounded-xl
                px-3
                py-2.5
                text-sm
                text-slate-500
                transition
                hover:bg-slate-50
                hover:text-slate-900
              "
            >

              <FolderOpen
                size={18}
              />

              Projects

            </button>

          </div>


          <p
            className="
              mt-8
              px-3
              text-xs
              font-semibold
              uppercase
              tracking-wider
              text-slate-400
            "
          >
            AI Research
          </p>


          <div
            className="
              mt-3
              space-y-1
            "
          >

            <button
              type="button"
              className="
                flex
                w-full
                items-center
                gap-3
                rounded-xl
                px-3
                py-2.5
                text-sm
                text-slate-500
                hover:bg-slate-50
              "
            >

              <Sparkles
                size={18}
              />

              AI Assistant

            </button>


            <button
              type="button"
              className="
                flex
                w-full
                items-center
                gap-3
                rounded-xl
                px-3
                py-2.5
                text-sm
                text-slate-500
                hover:bg-slate-50
              "
            >

              <GitCompare
                size={18}
              />

              Compare Papers

            </button>


            <button
              type="button"
              className="
                flex
                w-full
                items-center
                gap-3
                rounded-xl
                px-3
                py-2.5
                text-sm
                text-slate-500
                hover:bg-slate-50
              "
            >

              <Lightbulb
                size={18}
              />

              Research Gaps

            </button>

          </div>

        </nav>


        {/* USER */}

        <div
          className="
            border-t
            border-slate-100
            p-4
          "
        >

          <div
            className="
              mb-3
              flex
              items-center
              gap-3
              rounded-xl
              bg-slate-50
              p-3
            "
          >

            <div
              className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-full
                bg-slate-900
                text-sm
                font-medium
                text-white
              "
            >
              S
            </div>


            <div>

              <p
                className="
                  text-sm
                  font-medium
                "
              >
                Shruti
              </p>

              <p
                className="
                  text-xs
                  text-slate-400
                "
              >
                Researcher
              </p>

            </div>

          </div>


          <button
            type="button"
            onClick={
              handleLogout
            }
            className="
              flex
              w-full
              items-center
              gap-3
              rounded-xl
              px-3
              py-2.5
              text-sm
              text-slate-500
              hover:bg-red-50
              hover:text-red-600
            "
          >

            <LogOut
              size={18}
            />

            Logout

          </button>

        </div>

      </aside>


      {/* ======================================================
          MAIN
      ====================================================== */}

      <main
        className="
          min-h-screen
          lg:ml-64
        "
      >

        <header
          className="
            flex
            h-20
            items-center
            justify-between
            border-b
            border-slate-200
            bg-white
            px-6
            lg:px-10
          "
        >

          <div>

            <p
              className="
                text-sm
                text-slate-400
              "
            >
              Research Workspace
            </p>


            <h2
              className="
                text-lg
                font-semibold
              "
            >
              Dashboard
            </h2>

          </div>


          <button
            type="button"
            onClick={
              handleLogout
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
              hover:bg-slate-50
              lg:hidden
            "
          >

            <LogOut
              size={17}
            />

            Logout

          </button>

        </header>


        <div
          className="
            mx-auto
            max-w-7xl
            px-6
            py-10
            lg:px-10
          "
        >

          {/* ==================================================
              SEARCH
          ================================================== */}

          <section
            ref={
              searchSectionRef
            }
            className="
              scroll-mt-24
              rounded-3xl
              bg-slate-900
              px-7
              py-9
              text-white
              shadow-sm
              lg:px-10
              lg:py-11
            "
          >

            <p
              className="
                mb-3
                text-sm
                font-medium
                text-slate-400
              "
            >
              RESEARCH DISCOVERY
            </p>


            <h1
              className="
                text-3xl
                font-semibold
                tracking-tight
                lg:text-4xl
              "
            >
              What are you researching today?
            </h1>


            <p
              className="
                mt-3
                max-w-xl
                text-sm
                leading-6
                text-slate-400
                lg:text-base
              "
            >
              Discover academic papers, explore
              research literature and use AI to
              understand your topic faster.
            </p>


            <form
              onSubmit={
                handleSearch
              }
              className="
                mt-7
              "
            >

              <div
                className="
                  flex
                  w-full
                  items-center
                  gap-3
                  rounded-2xl
                  bg-white
                  px-5
                  py-2
                  shadow-lg
                "
              >

                <Search
                  size={20}
                  className="
                    shrink-0
                    text-slate-500
                  "
                />


                <input
                  id="dashboard-paper-search"
                  type="text"
                  value={
                    query
                  }
                  onChange={(
                    event
                  ) =>
                    setQuery(
                      event.target.value
                    )
                  }
                  placeholder="Search papers, topics, authors..."
                  className="
                    min-w-0
                    flex-1
                    bg-transparent
                    py-3
                    text-sm
                    text-slate-900
                    outline-none
                    placeholder:text-slate-400
                  "
                />


                <button
                  type="submit"
                  disabled={
                    searching
                  }
                  className="
                    flex
                    shrink-0
                    items-center
                    gap-2
                    rounded-xl
                    bg-slate-100
                    px-4
                    py-2.5
                    text-sm
                    font-medium
                    text-slate-700
                    hover:bg-slate-200
                    disabled:opacity-60
                  "
                >

                  {searching ? (

                    <Loader2
                      size={17}
                      className="
                        animate-spin
                      "
                    />

                  ) : (

                    <Search
                      size={17}
                    />

                  )}

                  <span className="hidden sm:inline">
                    {searching
                      ? "Searching..."
                      : "Search"}
                  </span>

                </button>

              </div>

            </form>

            <div className="mt-4 flex items-center justify-between gap-4 flex-wrap">
              <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={openAccessOnly}
                  onChange={(event) =>
                    setOpenAccessOnly(event.target.checked)
                  }
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Open Access only</span>
              </label>

              <span className="text-xs text-slate-400">
                {openAccessOnly
                  ? "Showing papers with free full-text access when available"
                  : "Showing all matching papers"}
              </span>
            </div>


            {searchError && (

              <div
                className="
                  mt-4
                  rounded-xl
                  border
                  border-red-400/20
                  bg-red-500/10
                  px-4
                  py-3
                  text-sm
                  text-red-300
                "
              >
                {searchError}
              </div>

            )}


            <div
              className="
                mt-5
                flex
                flex-wrap
                gap-2
              "
            >

              {[
                "Large Language Models",
                "Computer Vision",
                "Medical AI",
                "Climate Research",
              ].map(
                (topic) => (

                  <button
                    key={
                      topic
                    }
                    type="button"
                    onClick={() =>
                      handleTopicSearch(
                        topic
                      )
                    }
                    disabled={
                      searching
                    }
                    className="
                      rounded-full
                      border
                      border-slate-700
                      px-3.5
                      py-1.5
                      text-xs
                      text-slate-400
                      hover:border-slate-500
                      hover:text-white
                    "
                  >
                    {topic}
                  </button>

                )
              )}

            </div>

          </section>


          {/* ==================================================
              RESULTS
          ================================================== */}

          {searched && (

            <section
              className="
                mt-10
              "
            >

              <div
                className="
                  mb-5
                  flex
                  items-center
                  justify-between
                "
              >

                <div>

                  <h2
                    className="
                      text-xl
                      font-semibold
                    "
                  >
                    Search Results
                  </h2>


                  {query && (

                    <p
                      className="
                        mt-1
                        text-sm
                        text-slate-400
                      "
                    >
                      Results for "{query}"
                    </p>

                  )}

                </div>


                <button
                  type="button"
                  onClick={
                    handleClearSearch
                  }
                  className="
                    rounded-lg
                    px-3
                    py-2
                    text-sm
                    text-slate-500
                    hover:bg-slate-100
                  "
                >
                  Clear
                </button>

              </div>


              {searching && (

                <div
                  className="
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white
                    p-12
                    text-center
                  "
                >

                  <Loader2
                    size={32}
                    className="
                      mx-auto
                      animate-spin
                      text-slate-600
                    "
                  />

                  <p
                    className="
                      mt-4
                      text-sm
                      text-slate-400
                    "
                  >
                    Searching research papers...
                  </p>

                </div>

              )}


              {!searching &&
                papers.length === 0 &&
                !searchError && (

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

                    <FileText
                      size={34}
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
                      No papers found
                    </h3>

                  </div>

                )}


              {!searching &&
                papers.length > 0 && (

                  <div
                    className="
                      space-y-5
                    "
                  >

                    {papers.map(
                      (
                        paper,
                        index
                      ) => {

                        const paperId =
                          paper?.paper_id ||
                          paper?.id ||
                          `paper-${index}`;


                        const isSaved =
                          savedPaperIds.has(
                            paperId
                          );


                        const isSaving =
                          savingPaperId ===
                          paperId;


                        const isAnalyzing =
                          analyzingPaperId ===
                          paperId;


                        return (

                          <article
                            key={
                              paperId
                            }
                            className="
                              rounded-2xl
                              border
                              border-slate-200
                              bg-white
                              p-6
                              hover:border-slate-300
                              hover:shadow-sm
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


                            {paper.abstract ? (

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

                            ) : (

                              <p
                                className="
                                  mt-4
                                  text-sm
                                  italic
                                  text-slate-400
                                "
                              >
                                Abstract not available
                                from OpenAlex.
                              </p>

                            )}


                            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                              {paper.is_open_access ? (
                                <span className="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-3 py-1 font-medium text-green-700">
                                  ✓ Open Access
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-medium text-slate-500">
                                  🔒 Not Open Access
                                </span>
                              )}
                            </div>


                            <div
                              className="
                                mt-5
                                flex
                                flex-wrap
                                items-center
                                gap-2
                              "
                            >

                              <button
                                type="button"
                                onClick={() =>
                                  handleAnalyzePaper(
                                    paper
                                  )
                                }
                                disabled={
                                  isAnalyzing
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

                                {isAnalyzing ? (

                                  <Loader2
                                    size={16}
                                    className="
                                      animate-spin
                                    "
                                  />

                                ) : (

                                  <Sparkles
                                    size={16}
                                  />

                                )}

                                AI Analyze

                              </button>


                              <button
                                type="button"
                                onClick={() =>
                                  handleSavePaper(
                                    paper
                                  )
                                }
                                disabled={
                                  isSaving
                                }
                                className={`
                                  flex
                                  items-center
                                  gap-2
                                  rounded-xl
                                  px-4
                                  py-2.5
                                  text-sm
                                  font-medium

                                  ${
                                    isSaved
                                      ? "border border-green-200 bg-green-50 text-green-700"
                                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                  }
                                `}
                              >

                                {isSaving ? (

                                  <Loader2
                                    size={16}
                                    className="
                                      animate-spin
                                    "
                                  />

                                ) : isSaved ? (

                                  <BookmarkCheck
                                    size={16}
                                  />

                                ) : (

                                  <Bookmark
                                    size={16}
                                  />

                                )}

                                {isSaved
                                  ? "Saved"
                                  : "Save Paper"}

                              </button>


                              {paper.url && (

                                <a
                                  href={
                                    paper.url
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
                                    hover:bg-slate-200
                                  "
                                >

                                  <ExternalLink
                                    size={16}
                                  />

                                  Paper

                                </a>

                              )}


                              {paper.pdf_url && (

                                <a
                                  href={
                                    paper.pdf_url
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
                                    hover:bg-slate-200
                                  "
                                >

                                  <FileText
                                    size={16}
                                  />

                                  {paper.is_open_access
                                    ? "Open Access PDF"
                                    : "PDF"}

                                </a>

                              )}

                            </div>

                          </article>

                        );

                      }
                    )}

                  </div>

                )}

            </section>

          )}


          {/* ==================================================
              OVERVIEW
          ================================================== */}

          {!searched && (

            <section
              className="
                mt-8
                grid
                grid-cols-1
                gap-4
                sm:grid-cols-3
              "
            >

              <div
                className="
                  rounded-2xl
                  border
                  border-slate-200
                  bg-white
                  p-5
                "
              >

                <FolderOpen
                  size={19}
                />

                <p
                  className="
                    mt-5
                    text-sm
                    text-slate-400
                  "
                >
                  Research projects
                </p>


                <p
                  className="
                    mt-1
                    text-2xl
                    font-semibold
                  "
                >
                  {projects.length}
                </p>

              </div>


              <div
                className="
                  rounded-2xl
                  border
                  border-slate-200
                  bg-white
                  p-5
                "
              >

                <BookOpen
                  size={19}
                />

                <p
                  className="
                    mt-5
                    text-sm
                    text-slate-400
                  "
                >
                  Saved papers
                </p>


                <p
                  className="
                    mt-1
                    text-2xl
                    font-semibold
                  "
                >
                  {savedPaperIds.size}
                </p>

              </div>


              <div
                className="
                  rounded-2xl
                  border
                  border-slate-200
                  bg-white
                  p-5
                "
              >

                <Search
                  size={19}
                />

                <p
                  className="
                    mt-5
                    text-sm
                    text-slate-400
                  "
                >
                  Recent searches
                </p>


                <p
                  className="
                    mt-1
                    text-2xl
                    font-semibold
                  "
                >
                  {(() => {

                    try {

                      const history =
                        JSON.parse(
                          localStorage.getItem(
                            "researchai_search_history"
                          ) ||
                          "[]"
                        );


                      return Array.isArray(
                        history
                      )
                        ? history.length
                        : 0;

                    } catch {

                      return 0;

                    }

                  })()}
                </p>

              </div>

            </section>

          )}


          {/* ==================================================
              PROJECTS
          ================================================== */}

          {!searched && (

            <section
              className="
                mt-12
              "
            >

              <div
                className="
                  mb-5
                  flex
                  items-center
                  justify-between
                "
              >

                <div>

                  <h2
                    className="
                      text-xl
                      font-semibold
                    "
                  >
                    Your Projects
                  </h2>


                  <p
                    className="
                      mt-1
                      text-sm
                      text-slate-400
                    "
                  >
                    Organize papers around your
                    research topics.
                  </p>

                </div>


                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/projects/new"
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

                  <Plus
                    size={17}
                  />

                  New Project

                </button>

              </div>


              {loadingProjects && (

                <div
                  className="
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white
                    p-10
                    text-center
                  "
                >

                  <Loader2
                    size={25}
                    className="
                      mx-auto
                      animate-spin
                    "
                  />

                  <p
                    className="
                      mt-3
                      text-sm
                      text-slate-400
                    "
                  >
                    Loading projects...
                  </p>

                </div>

              )}


              {!loadingProjects &&
                projects.length === 0 && (

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

                    <FolderOpen
                      size={28}
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
                      Start your first research project
                    </h3>


                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          "/projects/new"
                        )
                      }
                      className="
                        mt-5
                        rounded-xl
                        bg-slate-900
                        px-5
                        py-2.5
                        text-sm
                        font-medium
                        text-white
                      "
                    >
                      Create Project
                    </button>

                  </div>

                )}


              {!loadingProjects &&
                projects.length > 0 && (

                  <div
                    className="
                      grid
                      grid-cols-1
                      gap-4
                      md:grid-cols-2
                    "
                  >

                    {projects
                      .slice(
                        0,
                        4
                      )
                      .map(
                        (
                          project
                        ) => (

                          <button
                            key={
                              project.id
                            }
                            type="button"
                            onClick={() =>
                              navigate(
                                `/projects/${project.id}`
                              )
                            }
                            className="
                              group
                              w-full
                              rounded-2xl
                              border
                              border-slate-200
                              bg-white
                              p-5
                              text-left
                              transition
                              hover:border-slate-300
                              hover:shadow-md
                            "
                          >

                            <div
                              className="
                                flex
                                items-start
                                justify-between
                              "
                            >

                              <div
                                className="
                                  flex
                                  items-start
                                  gap-4
                                "
                              >

                                <div
                                  className="
                                    flex
                                    h-11
                                    w-11
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-xl
                                    bg-slate-100
                                  "
                                >

                                  <FolderOpen
                                    size={20}
                                    className="
                                      text-slate-700
                                    "
                                  />

                                </div>


                                <div>

                                  <h3
                                    className="
                                      font-semibold
                                      text-slate-900
                                    "
                                  >
                                    {project.title}
                                  </h3>


                                  <p
                                    className="
                                      mt-1
                                      text-xs
                                      text-slate-400
                                    "
                                  >
                                    Research Project
                                  </p>

                                </div>

                              </div>


                              <ArrowRight
                                size={18}
                                className="
                                  text-slate-300
                                  transition
                                  group-hover:translate-x-1
                                  group-hover:text-slate-700
                                "
                              />

                            </div>


                            {project.description && (

                              <p
                                className="
                                  mt-4
                                  line-clamp-2
                                  text-sm
                                  leading-6
                                  text-slate-500
                                "
                              >
                                {project.description}
                              </p>

                            )}


                            <div
                              className="
                                mt-5
                                flex
                                items-center
                                gap-2
                                text-xs
                                text-slate-400
                              "
                            >

                              <Clock3
                                size={14}
                              />

                              Created recently

                            </div>

                          </button>

                        )
                      )}

                  </div>

                )}

            </section>

          )}


          {/* ==================================================
              AI TOOLS
          ================================================== */}

          {!searched && (

            <section
              className="
                mt-12
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
                  Research with AI
                </h2>


                <p
                  className="
                    mt-1
                    text-sm
                    text-slate-400
                  "
                >
                  Turn research literature into useful
                  insights.
                </p>

              </div>


              <div
                className="
                  grid
                  grid-cols-1
                  gap-4
                  md:grid-cols-3
                "
              >

                <button
                  type="button"
                  onClick={() =>
                    openAITool(
                      "assistant"
                    )
                  }
                  className="
                    group
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white
                    p-5
                    text-left
                    hover:border-slate-300
                    hover:shadow-sm
                  "
                >

                  <Sparkles
                    size={19}
                  />

                  <h3
                    className="
                      mt-4
                      font-semibold
                    "
                  >
                    AI Research Assistant
                  </h3>


                  <p
                    className="
                      mt-2
                      text-sm
                      leading-6
                      text-slate-400
                    "
                  >
                    Ask questions about your research
                    and get answers grounded in papers.
                  </p>

                </button>


                <button
                  type="button"
                  onClick={() =>
                    openAITool(
                      "compare"
                    )
                  }
                  className="
                    group
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white
                    p-5
                    text-left
                    hover:border-slate-300
                    hover:shadow-sm
                  "
                >

                  <GitCompare
                    size={19}
                  />

                  <h3
                    className="
                      mt-4
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
                      text-slate-400
                    "
                  >
                    Compare methodologies, findings
                    and limitations across papers.
                  </p>

                </button>


                <button
                  type="button"
                  onClick={() =>
                    openAITool(
                      "gaps"
                    )
                  }
                  className="
                    group
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white
                    p-5
                    text-left
                    hover:border-slate-300
                    hover:shadow-sm
                  "
                >

                  <Lightbulb
                    size={19}
                  />

                  <h3
                    className="
                      mt-4
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
                      text-slate-400
                    "
                  >
                    Identify limitations and possible
                    directions for future research.
                  </p>

                </button>

              </div>

            </section>

          )}


          <div
            className="
              h-16
            "
          />

        </div>

      </main>


      {/* ======================================================
          AI TOOL PROJECT MODAL
      ====================================================== */}

      {aiToolModalOpen && (

        <div
          className="
            fixed
            inset-0
            z-[90]
            flex
            items-center
            justify-center
            bg-black/50
            p-4
          "
        >

          <div
            className="
              w-full
              max-w-lg
              rounded-2xl
              bg-white
              p-6
              shadow-2xl
            "
          >

            <div
              className="
                flex
                items-start
                justify-between
                gap-4
              "
            >

              <div>

                <p
                  className="
                    text-xs
                    font-semibold
                    uppercase
                    tracking-wider
                    text-indigo-600
                  "
                >
                  Research with AI
                </p>

                <h2
                  className="
                    mt-2
                    text-xl
                    font-semibold
                    text-slate-900
                  "
                >
                  {getAIToolModalTitle()}
                </h2>

                <p
                  className="
                    mt-2
                    text-sm
                    leading-6
                    text-slate-500
                  "
                >
                  {getAIToolModalDescription()}
                </p>

              </div>

              <button
                type="button"
                onClick={
                  closeAIToolModal
                }
                className="
                  flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-lg
                  text-slate-400
                  hover:bg-slate-100
                "
              >
                <X
                  size={18}
                />
              </button>

            </div>


            <div
              className="
                mt-6
                space-y-2
              "
            >

              {projects.map(
                (
                  project
                ) => {

                  const selected =
                    String(
                      project.id
                    ) ===
                    String(
                      aiToolProjectId
                    );


                  return (

                    <button
                      key={
                        project.id
                      }
                      type="button"
                      onClick={() =>
                        setAiToolProjectId(
                          String(
                            project.id
                          )
                        )
                      }
                      className={`
                        flex
                        w-full
                        items-center
                        gap-3
                        rounded-xl
                        border
                        px-4
                        py-3
                        text-left
                        transition
                        ${
                          selected
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }
                      `}
                    >

                      <FolderOpen
                        size={18}
                        className="shrink-0"
                      />

                      <div
                        className="min-w-0 flex-1"
                      >

                        <p
                          className="
                            truncate
                            text-sm
                            font-medium
                          "
                        >
                          {project.title}
                        </p>

                        {project.description && (
                          <p
                            className={`
                              mt-1
                              line-clamp-1
                              text-xs
                              ${
                                selected
                                  ? "text-slate-300"
                                  : "text-slate-400"
                              }
                            `}
                          >
                            {project.description}
                          </p>
                        )}

                      </div>

                      {selected && (
                        <span
                          className="
                            h-2.5
                            w-2.5
                            shrink-0
                            rounded-full
                            bg-white
                          "
                        />
                      )}

                    </button>

                  );

                }
              )}

            </div>


            <div
              className="
                mt-6
                flex
                justify-end
                gap-3
                border-t
                border-slate-100
                pt-5
              "
            >

              <button
                type="button"
                onClick={
                  closeAIToolModal
                }
                className="
                  rounded-xl
                  border
                  border-slate-200
                  px-4
                  py-2.5
                  text-sm
                  font-medium
                  text-slate-600
                  hover:bg-slate-50
                "
              >
                Cancel
              </button>


              <button
                type="button"
                onClick={
                  handleOpenAIToolProject
                }
                disabled={!aiToolProjectId}
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
                  disabled:opacity-50
                "
              >
                Open Project
                <ArrowRight
                  size={16}
                />
              </button>

            </div>

          </div>

        </div>

      )}


      {/* ======================================================
          SAVE TO PROJECT MODAL
      ====================================================== */}

      {projectModalOpen && (

        <div
          className="
            fixed
            inset-0
            z-[100]
            flex
            items-center
            justify-center
            bg-black/50
            p-4
          "
        >

          <div
            className="
              w-full
              max-w-md
              rounded-2xl
              bg-white
              p-6
              shadow-2xl
            "
          >

            <div
              className="
                flex
                items-start
                justify-between
              "
            >

              <div>

                <h2
                  className="
                    text-xl
                    font-semibold
                  "
                >
                  Save Paper to Project
                </h2>


                <p
                  className="
                    mt-1
                    text-sm
                    text-slate-500
                  "
                >
                  Choose where you want to organize
                  this paper.
                </p>

              </div>


              <button
                type="button"
                onClick={
                  closeProjectModal
                }
                disabled={
                  projectSaving
                }
                className="
                  rounded-lg
                  p-2
                  text-slate-400
                  hover:bg-slate-100
                "
              >

                <X
                  size={18}
                />

              </button>

            </div>


            {pendingPaper && (

              <div
                className="
                  mt-5
                  rounded-xl
                  bg-slate-50
                  p-4
                "
              >

                <p
                  className="
                    line-clamp-2
                    text-sm
                    font-medium
                  "
                >
                  {pendingPaper.title ||
                    "Untitled Paper"}
                </p>

              </div>

            )}


            {projectModalError && (

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

                {projectModalError}

              </div>

            )}


            <div
              className="
                mt-5
                max-h-64
                space-y-2
                overflow-y-auto
              "
            >

              {projects.map(
                (project) => {

                  const selected =
                    String(
                      selectedProjectId
                    ) ===
                    String(
                      project.id
                    );


                  return (

                    <button
                      key={
                        project.id
                      }
                      type="button"
                      disabled={
                        projectSaving
                      }
                      onClick={() =>
                        setSelectedProjectId(
                          String(
                            project.id
                          )
                        )
                      }
                      className={`
                        flex
                        w-full
                        items-center
                        gap-3
                        rounded-xl
                        border
                        px-4
                        py-3
                        text-left
                        transition

                        ${
                          selected
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }
                      `}
                    >

                      <FolderOpen
                        size={18}
                      />


                      <span
                        className="
                          flex-1
                          truncate
                          text-sm
                          font-medium
                        "
                      >
                        {project.title}
                      </span>


                      {selected && (

                        <span
                          className="
                            h-2.5
                            w-2.5
                            rounded-full
                            bg-white
                          "
                        />

                      )}

                    </button>

                  );

                }
              )}

            </div>


            <div
              className="
                mt-6
                flex
                justify-end
                gap-3
                border-t
                border-slate-100
                pt-5
              "
            >

              <button
                type="button"
                onClick={
                  closeProjectModal
                }
                disabled={
                  projectSaving
                }
                className="
                  rounded-xl
                  border
                  border-slate-200
                  px-4
                  py-2.5
                  text-sm
                  font-medium
                  text-slate-600
                  hover:bg-slate-50
                "
              >
                Cancel
              </button>


              <button
                type="button"
                onClick={
                  handleConfirmProjectSave
                }
                disabled={
                  projectSaving ||
                  !selectedProjectId
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
                  disabled:opacity-50
                "
              >

                {projectSaving ? (

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

                    <Bookmark
                      size={16}
                    />

                    Save to Project

                  </>

                )}

              </button>

            </div>

          </div>

        </div>

      )}

    </div>

  );

}


export default Dashboard;