import { useEffect, useState } from "react";

import {
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import {
  Search,
  ArrowLeft,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Brain,
  Loader2,
  FileText,
  Calendar,
  User,
  Quote,
} from "lucide-react";

import { searchPapers } from "../services/paperService";

import {
  savePaper,
  getSavedPapers,
  deleteSavedPaper,
} from "../services/savedPaperService";


// ============================================================
// FIND PAPERS
// ============================================================

function FindPapers() {

  const navigate = useNavigate();

  const location = useLocation();

  const [searchParams] =
    useSearchParams();


  // ==========================================================
  // DETERMINE WHERE USER CAME FROM
  // ==========================================================

  /*
   * There are two possible entry points:
   *
   * 1. Landing page
   *    Home -> Find Papers
   *
   * 2. Dashboard
   *    Dashboard -> Find Papers
   *
   * Dashboard sends:
   *
   * {
   *   state: {
   *     from: "/dashboard",
   *     query: "machine learning"
   *   }
   * }
   *
   * Landing page sends:
   *
   * {
   *   state: {
   *     from: "/"
   *   }
   * }
   *
   * We use "/" as the default so old links
   * still work safely.
   */

  const fromPage =
    location.state?.from || "/";


  // ==========================================================
  // INITIAL QUERY
  // ==========================================================

  /*
   * Query can come from:
   *
   * URL:
   * /find-papers?q=machine%20learning
   *
   * OR from navigation state:
   *
   * {
   *   state: {
   *     from: "/dashboard",
   *     query: "machine learning"
   *   }
   * }
   */

  const urlQuery =
    searchParams.get("q") || "";


  const stateQuery =
    location.state?.query || "";


  const initialQuery =
    stateQuery || urlQuery;


  const [query, setQuery] =
    useState(initialQuery);

  const [openAccessOnly, setOpenAccessOnly] =
  useState(false);


  const [papers, setPapers] =
    useState([]);


  const [loading, setLoading] =
    useState(false);


  const [error, setError] =
    useState("");


  const [searched, setSearched] =
    useState(
      Boolean(
        initialQuery.trim()
      )
    );


  // ==========================================================
  // SAVED PAPER STATE
  // ==========================================================

  const [savedPaperIds, setSavedPaperIds] =
    useState(new Set());


  const [savingPaperId, setSavingPaperId] =
    useState(null);


  // ==========================================================
  // AI ANALYSIS STATE
  // ==========================================================

  const [analyzingPaperId, setAnalyzingPaperId] =
    useState(null);


  // ==========================================================
  // AUTH CHECK
  // ==========================================================

  const isUserLoggedIn = () => {

    return Boolean(
      localStorage.getItem(
        "access_token"
      )
    );

  };


  // ==========================================================
  // LOAD SAVED PAPERS
  // ==========================================================

  useEffect(() => {

    const loadSavedPapers =
      async () => {

        /*
         * Guests must not call
         * /saved-papers because the
         * endpoint requires authentication.
         */

        if (!isUserLoggedIn()) {

          setSavedPaperIds(
            new Set()
          );

          return;

        }


        try {

          const saved =
            await getSavedPapers();


          if (!Array.isArray(saved)) {

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


          setSavedPaperIds(ids);

        } catch (error) {

          console.error(
            "Failed to load saved papers:",
            error
          );


          if (
            error?.response?.status ===
            401
          ) {

            setSavedPaperIds(
              new Set()
            );

          }

        }

      };


    loadSavedPapers();

  }, []);


  // ==========================================================
  // SEARCH WHEN INITIAL QUERY EXISTS
  // ==========================================================

  useEffect(() => {

    if (
      !initialQuery ||
      !initialQuery.trim()
    ) {

      return;

    }


    const trimmedQuery =
      initialQuery.trim();


    setQuery(
      trimmedQuery
    );


    /*
     * Search automatically when:
     *
     * Home sends ?q=...
     *
     * OR
     *
     * Dashboard sends state.query
     */

    handleSearch(
      trimmedQuery
    );

  }, [
    urlQuery,
    stateQuery,
  ]);


  // ==========================================================
  // SEARCH PAPERS
  // ==========================================================

  const handleSearch =
    async (
      searchQuery = query
    ) => {

      const finalQuery =
        typeof searchQuery === "string"
          ? searchQuery.trim()
          : "";


      if (!finalQuery) {

        setError(
          "Please enter something to search."
        );

        return;

      }


      setLoading(true);

      setError("");

      setSearched(true);


      try {

        const token =
          localStorage.getItem(
            "access_token"
          );


        const response =
          await searchPapers({

            query:
              finalQuery,

            offset:
              0,

            limit:
              10,

            year:
              "",

            openAccessOnly:
              openAccessOnly,

            token:
              token || undefined,

          });


        console.log(
          "Paper search response:",
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


      } catch (error) {

        console.error(
          "Paper search failed:",
          error
        );


        const detail =
          error?.response?.data?.detail;


        let message =
          "Failed to search research papers. Please try again.";


        /*
         * FastAPI string error
         */

        if (
          typeof detail ===
          "string"
        ) {

          message =
            detail;

        }


        /*
         * FastAPI validation error
         */

        else if (
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

            message =
              messages.join(
                ", "
              );

          }

        }


        /*
         * Authentication error
         *
         * Search itself can work as a guest,
         * so don't automatically redirect to login.
         */

        if (
          error?.response?.status ===
          401
        ) {

          message =
            "Please log in to continue.";

        }


        /*
         * OpenAlex / backend error
         */

        if (
          error?.response?.status ===
          502
        ) {

          message =
            detail ||
            "The research paper service is temporarily unavailable. Please try again.";

        }


        setError(
          message
        );

        setPapers([]);

      } finally {

        setLoading(false);

      }

    };


  // ==========================================================
  // SEARCH FORM
  // ==========================================================

  const handleSubmit =
    (event) => {

      event.preventDefault();


      const finalQuery =
        query.trim();


      if (!finalQuery) {

        setError(
          "Please enter something to search."
        );

        return;

      }


      /*
       * Keep the page as Find Papers.
       *
       * IMPORTANT:
       * We preserve fromPage so the Back button
       * still knows whether we came from Dashboard
       * or Landing Page.
       */

      navigate(
        `/find-papers?q=${encodeURIComponent(
          finalQuery
        )}`,
        {
          state: {
            from: fromPage,
          },
        }
      );

    };


  // ==========================================================
  // SAVE / UNSAVE PAPER
  // ==========================================================

  const handleSavePaper =
    async (paper) => {

      /*
       * Guests must login before saving.
       */

      if (!isUserLoggedIn()) {

        navigate(
          "/login",
          {
            state: {
              from: "/find-papers",
              returnTo: fromPage,
              query: query,
            },
          }
        );

        return;

      }


      const paperId =
        paper?.paper_id ||
        paper?.id;


      if (!paperId) {

        console.error(
          "Paper does not have a paper_id:",
          paper
        );


        setError(
          "Unable to save this paper."
        );

        return;

      }


      // ======================================================
      // UNSAVE
      // ======================================================

      if (
        savedPaperIds.has(
          paperId
        )
      ) {

        try {

          setSavingPaperId(
            paperId
          );


          const savedPapers =
            await getSavedPapers();


          if (
            !Array.isArray(
              savedPapers
            )
          ) {

            return;

          }


          const savedPaper =
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


          if (
            savedPaper?.id
          ) {

            await deleteSavedPaper(
              savedPaper.id
            );

          }


          setSavedPaperIds(
            (previous) => {

              const next =
                new Set(previous);


              next.delete(
                paperId
              );


              return next;

            }
          );


        } catch (error) {

          console.error(
            "Failed to remove saved paper:",
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
              "/login"
            );

          }

        } finally {

          setSavingPaperId(
            null
          );

        }


        return;

      }


      // ======================================================
      // SAVE
      // ======================================================

      try {

        setSavingPaperId(
          paperId
        );


        console.log(
          "Saving paper:",
          paper
        );


        // ----------------------------------------------------
        // AUTHORS
        // Backend expects STRING.
        // ----------------------------------------------------

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
                    ""
                  );

                }
              )

              .filter(Boolean)

              .join(", ");


          if (!authors) {

            authors =
              null;

          }

        } else if (
          typeof paper.authors ===
          "string"
        ) {

          authors =
            paper.authors;

        }


        // ----------------------------------------------------
        // SAVE PAYLOAD
        // ----------------------------------------------------

        const paperPayload = {

          openalex_id:
            String(paperId),


          title:
            paper.title ||
            "Untitled Paper",


          authors:


          authors,


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
          "Saving paper payload:",
          paperPayload
        );


        await savePaper(
          paperPayload
        );


        // ----------------------------------------------------
        // UPDATE UI
        // ----------------------------------------------------

        setSavedPaperIds(
          (previous) => {

            const next =
              new Set(previous);


            next.add(
              paperId
            );


            return next;

          }
        );


        console.log(
          "Paper saved successfully."
        );


      } catch (error) {

        console.error(
          "Failed to save paper:",
          error
        );


        // ----------------------------------------------------
        // 401
        // ----------------------------------------------------

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
              state: {
                from: "/find-papers",
                returnTo: fromPage,
                query: query,
              },
            }
          );


          return;

        }


        // ----------------------------------------------------
        // 409
        // ----------------------------------------------------

        if (
          error?.response?.status ===
          409
        ) {

          setSavedPaperIds(
            (previous) => {

              const next =
                new Set(previous);


              next.add(
                paperId
              );


              return next;

            }
          );


          return;

        }


        // ----------------------------------------------------
        // 422
        // ----------------------------------------------------

        if (
          error?.response?.status ===
          422
        ) {

          const detail =
            error?.response?.data?.detail;


          console.error(
            "Save paper validation error:",
            detail
          );


          if (
            Array.isArray(detail)
          ) {

            const messages =
              detail

                .map(
                  (item) =>
                    item?.msg ||
                    ""
                )

                .filter(Boolean);


            if (
              messages.length
            ) {

              setError(
                messages.join(
                  ", "
                )
              );

            } else {

              setError(
                "The paper data is not valid."
              );

            }

          } else if (
            typeof detail ===
            "string"
          ) {

            setError(
              detail
            );

          } else {

            setError(
              "Unable to save this paper."
            );

          }

        } else {

          setError(
            "Unable to save this paper. Please try again."
          );

        }

      } finally {

        setSavingPaperId(
          null
        );

      }

    };


  // ==========================================================
  // AI ANALYZE
  // ==========================================================

  const handleAnalyzePaper =
    (paper) => {

      console.log(
        "AI Analyze clicked:",
        paper
      );


      // ------------------------------------------------------
      // GUEST CHECK
      // ------------------------------------------------------

      if (!isUserLoggedIn()) {

        navigate(
          "/login",
          {
            state: {
              from: "/find-papers",
              returnTo: fromPage,
              query: query,
            },
          }
        );

        return;

      }


      const paperId =
        paper?.paper_id ||
        paper?.id;


      if (!paperId) {

        setError(
          "Unable to analyze this paper."
        );

        return;

      }


      setAnalyzingPaperId(
        paperId
      );


      // ------------------------------------------------------
      // STORE COMPLETE PAPER
      // ------------------------------------------------------

      sessionStorage.setItem(
        "researchai_analysis_paper",
        JSON.stringify(
          paper
        )
      );


      // ------------------------------------------------------
      // OPEN ANALYSIS PAGE
      // ------------------------------------------------------

      navigate(
        "/paper-analysis",
        {
          state: {
            from: "/find-papers",
            returnTo: fromPage,
          },
        }
      );

    };


  // ==========================================================
  // BACK BUTTON
  // ==========================================================

  const handleBack =
    () => {

      /*
       * THIS IS THE IMPORTANT FIX.
       *
       * If user came from Dashboard:
       *
       * Dashboard
       *     ↓
       * Find Papers
       *     ↓
       * Back
       *     ↓
       * Dashboard
       *
       * If user came from Landing:
       *
       * Landing
       *     ↓
       * Find Papers
       *     ↓
       * Back
       *     ↓
       * Landing
       */

      if (
        fromPage ===
        "/dashboard"
      ) {

        navigate(
          "/dashboard",
          {
            replace: true,
          }
        );

        return;

      }


      navigate(
        "/",
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
        bg-slate-950
        text-white
      "
    >


      {/* ======================================================
          NAVBAR
      ====================================================== */}

      <nav
        className="
          h-16
          border-b
          border-slate-800
          bg-slate-950
          flex
          items-center
          justify-between
          px-6
        "
      >

        {/* ==================================================
            LOGO
        ================================================== */}

        <div
          className="
            flex
            items-center
            gap-3
            cursor-pointer
          "
          onClick={() => {

            /*
             * If logged in, clicking the logo
             * goes to Dashboard.
             *
             * If guest, it goes to Landing.
             */

            if (
              isUserLoggedIn()
            ) {

              navigate(
                "/dashboard"
              );

            } else {

              navigate(
                "/"
              );

            }

          }}
        >

          <div
            className="
              w-9
              h-9
              rounded-lg
              bg-blue-600
              flex
              items-center
              justify-center
            "
          >

            <FileText
              size={20}
            />

          </div>


          <span
            className="
              text-xl
              font-bold
            "
          >
            ResearchAI
          </span>

        </div>


        {/* ==================================================
            NAVIGATION
        ================================================== */}

        <div
          className="
            flex
            items-center
            gap-3
          "
        >

          {isUserLoggedIn() ? (

            <>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/dashboard"
                  )
                }
                className="
                  px-4
                  py-2
                  text-slate-300
                  hover:text-white
                  transition
                "
              >
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
                  px-4
                  py-2
                  text-slate-300
                  hover:text-white
                  transition
                "
              >
                Library
              </button>

            </>

          ) : (

            <>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/login",
                    {
                      state: {
                        from: "/find-papers",
                        returnTo: fromPage,
                        query: query,
                      },
                    }
                  )
                }
                className="
                  px-4
                  py-2
                  text-slate-300
                  hover:text-white
                  transition
                "
              >
                Login
              </button>


              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/register",
                    {
                      state: {
                        from: "/find-papers",
                        returnTo: fromPage,
                        query: query,
                      },
                    }
                  )
                }
                className="
                  px-4
                  py-2
                  rounded-lg
                  bg-blue-600
                  hover:bg-blue-500
                  font-medium
                  transition
                "
              >
                Sign Up
              </button>

            </>

          )}

        </div>

      </nav>


      {/* ======================================================
          MAIN
      ====================================================== */}

      <main
        className="
          max-w-6xl
          mx-auto
          px-6
          py-10
        "
      >


        {/* ====================================================
            BACK
        ==================================================== */}

        <button
          type="button"
          onClick={
            handleBack
          }
          className="
            flex
            items-center
            gap-2
            text-slate-400
            hover:text-white
            transition
            mb-7
          "
        >

          <ArrowLeft
            size={18}
          />

          Back

        </button>


        {/* ====================================================
            HEADER
        ==================================================== */}

        <div
          className="
            mb-8
          "
        >

          <h1
            className="
              text-3xl
              md:text-4xl
              font-bold
            "
          >
            Find Research Papers
          </h1>


          <p
            className="
              text-slate-400
              mt-2
            "
          >
            Discover academic papers using
            OpenAlex.
          </p>

        </div>


        {/* ====================================================
            SEARCH BAR
        ==================================================== */}

        <form
          onSubmit={
            handleSubmit
          }
          className="
            mb-10
          "
        >

          <div
            className="
              flex
              items-center
              gap-3
              p-2
              rounded-2xl
              border
              border-slate-700
              bg-slate-900
              focus-within:border-blue-500
              transition
            "
          >

            <Search
              size={22}
              className="
                ml-3
                text-slate-500
              "
            />


            <input
              type="text"
              value={query}
              onChange={(
                event
              ) =>
                setQuery(
                  event.target.value
                )
              }
              placeholder="
                Search papers, topics, authors...
              "
              className="
                flex-1
                bg-transparent
                outline-none
                text-white
                placeholder:text-slate-500
                py-3
              "
            />


            <button
              type="submit"
              disabled={
                loading
              }
              className="
                flex
                items-center
                gap-2
                bg-blue-600
                hover:bg-blue-500
                disabled:opacity-60
                px-6
                py-3
                rounded-xl
                font-semibold
                transition
              "
            >

              {loading ? (

                <Loader2
                  size={18}
                  className="
                    animate-spin
                  "
                />

              ) : (

                <Search
                  size={18}
                />

              )}

              Search

            </button>

          </div>


          {/* ====================================================
              OPEN ACCESS FILTER
          ==================================================== */}

          <label className="mt-4 flex items-center gap-3 w-fit cursor-pointer">
            <input
              type="checkbox"
              checked={openAccessOnly}
              onChange={(event) =>
                setOpenAccessOnly(event.target.checked)
              }
              className="h-4 w-4 rounded border-slate-600 bg-slate-800"
            />
            <span className="text-sm text-slate-300">
              Open Access only
            </span>
          </label>

        </form>


        {/* ====================================================
            ERROR
        ==================================================== */}

        {error && (

          <div
            className="
              mb-8
              rounded-xl
              border
              border-red-900/50
              bg-red-950/30
              px-5
              py-4
              text-red-300
            "
          >

            {error}

          </div>

        )}


        {/* ====================================================
            INITIAL STATE
        ==================================================== */}

        {!loading &&
          !searched &&
          !error && (

            <div
              className="
                text-center
                py-20
              "
            >

              <div
                className="
                  w-16
                  h-16
                  mx-auto
                  rounded-2xl
                  bg-blue-600/10
                  flex
                  items-center
                  justify-center
                  mb-5
                "
              >

                <Search
                  size={30}
                  className="
                    text-blue-400
                  "
                />

              </div>


              <h2
                className="
                  text-xl
                  font-semibold
                "
              >
                Search for research
              </h2>


              <p
                className="
                  text-slate-500
                  mt-2
                "
              >
                Enter a topic, paper title,
                author, or keyword above.
              </p>

            </div>

          )}


        {/* ====================================================
            LOADING
        ==================================================== */}

        {loading && (

          <div
            className="
              py-20
              text-center
            "
          >

            <Loader2
              size={35}
              className="
                mx-auto
                animate-spin
                text-blue-500
              "
            />


            <p
              className="
                text-slate-400
                mt-4
              "
            >
              Searching research papers...
            </p>

          </div>

        )}


        {/* ====================================================
            NO RESULTS
        ==================================================== */}

        {!loading &&
          searched &&
          papers.length === 0 &&
          !error && (

            <div
              className="
                py-20
                text-center
              "
            >

              <FileText
                size={40}
                className="
                  mx-auto
                  text-slate-600
                  mb-4
                "
              />


              <h2
                className="
                  text-xl
                  font-semibold
                "
              >
                No papers found
              </h2>


              <p
                className="
                  text-slate-500
                  mt-2
                "
              >
                Try a different research
                topic or keyword.
              </p>

            </div>

          )}


        {/* ====================================================
            SEARCH RESULTS
        ==================================================== */}

        {!loading &&
          papers.length > 0 && (

            <div
              className="
                space-y-5
              "
            >


              {/* ==================================================
                  RESULTS HEADER
              ================================================== */}

              <div
                className="
                  flex
                  items-center
                  justify-between
                "
              >

                <h2
                  className="
                    text-xl
                    font-semibold
                  "
                >
                  Search Results
                </h2>


                <span
                  className="
                    text-sm
                    text-slate-500
                  "
                >
                  {papers.length} papers
                </span>

              </div>


              {/* ==================================================
                  PAPERS
              ================================================== */}

              {papers.map(
                (
                  paper,
                  index
                ) => {

                  const paperId =
                    paper.paper_id ||
                    paper.id ||
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
                        bg-slate-900
                        border
                        border-slate-800
                        rounded-2xl
                        p-6
                        hover:border-slate-700
                        transition
                      "
                    >


                      {/* =========================================
                          TITLE
                      ========================================= */}

                      <h3
                        className="
                          text-xl
                          font-semibold
                          leading-relaxed
                        "
                      >

                        {paper.title ||
                          "Untitled Paper"}

                      </h3>


                      {/* =========================================
                          AUTHORS
                      ========================================= */}

                      {paper.authors && (

                        <div
                          className="
                            flex
                            items-start
                            gap-2
                            mt-3
                            text-sm
                            text-slate-400
                          "
                        >

                          <User
                            size={16}
                            className="
                              mt-0.5
                              shrink-0
                            "
                          />


                          <span>

                            {Array.isArray(
                              paper.authors
                            )

                              ? paper.authors

                                  .map(
                                    (
                                      author
                                    ) =>
                                      typeof author ===
                                      "string"
                                        ? author
                                        : author?.name ||
                                          ""
                                  )

                                  .filter(
                                    Boolean
                                  )

                                  .join(
                                    ", "
                                  )

                              : paper.authors}

                          </span>

                        </div>

                      )}


                      {/* =========================================
                          META
                      ========================================= */}

                      <div
                        className="
                          flex
                          flex-wrap
                          items-center
                          gap-4
                          mt-4
                          text-sm
                          text-slate-500
                        "
                      >

                        {paper.year && (

                          <div
                            className="
                              flex
                              items-center
                              gap-1.5
                            "
                          >

                            <Calendar
                              size={15}
                            />

                            {paper.year}

                          </div>

                        )}


                        {paper.venue && (

                          <div>
                            {paper.venue}
                          </div>

                        )}


                        {paper.citation_count !==
                          undefined && (

                          <div
                            className="
                              flex
                              items-center
                              gap-1.5
                            "
                          >

                            <Quote
                              size={15}
                            />

                            {paper.citation_count}
                            {" "}
                            citations

                          </div>

                        )}

                      </div>

                      {/* =========================================
    ACCESS STATUS
========================================= */}

<div className="mt-4">
  {paper.is_open_access ? (
    <span
      className="
        inline-flex
        items-center
        gap-2
        rounded-lg
        border
        border-green-500/30
        bg-green-500/10
        px-3
        py-1.5
        text-sm
        font-medium
        text-green-400
      "
    >
      Open Access
    </span>
  ) : (
    <span
      className="
        inline-flex
        items-center
        gap-2
        rounded-lg
        border
        border-yellow-500/30
        bg-yellow-500/10
        px-3
        py-1.5
        text-sm
        font-medium
        text-yellow-400
      "
    >
      Not Open Access
    </span>
  )}
</div>


                      {/* =========================================
                          ABSTRACT
                      ========================================= */}

                      {paper.abstract ? (

                        <p
                          className="
                            mt-5
                            text-slate-400
                            text-sm
                            leading-7
                            line-clamp-4
                          "
                        >
                          {paper.abstract}
                        </p>

                      ) : (

                        <p
                          className="
                            mt-5
                            text-slate-600
                            text-sm
                            italic
                          "
                        >
                          Abstract not available
                          from OpenAlex.
                        </p>

                      )}


                      {/* =========================================
                          ACTION BUTTONS
                      ========================================= */}

                      <div
                        className="
                          flex
                          flex-wrap
                          items-center
                          gap-3
                          mt-6
                        "
                      >


                        {/* =====================================
                            AI ANALYZE
                        ===================================== */}

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
                            px-4
                            py-2.5
                            rounded-xl
                            bg-purple-600
                            hover:bg-purple-500
                            disabled:opacity-60
                            font-medium
                            transition
                          "
                        >

                          {isAnalyzing ? (

                            <Loader2
                              size={17}
                              className="
                                animate-spin
                              "
                            />

                          ) : (

                            <Brain
                              size={17}
                            />

                          )}

                          AI Analyze

                        </button>


                        {/* =====================================
                            SAVE / UNSAVE
                        ===================================== */}

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
                            px-4
                            py-2.5
                            rounded-xl
                            font-medium
                            transition

                            ${
                              isSaved
                                ? "bg-green-600/15 text-green-400 border border-green-500/30"
                                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                            }
                          `}
                        >

                          {isSaving ? (

                            <Loader2
                              size={17}
                              className="
                                animate-spin
                              "
                            />

                          ) : isSaved ? (

                            <BookmarkCheck
                              size={17}
                            />

                          ) : (

                            <Bookmark
                              size={17}
                            />

                          )}


                          {isSaved
                            ? "Saved"
                            : "Save Paper"}

                        </button>


                        {/* =====================================
                            PAPER LINK
                        ===================================== */}

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
                              px-4
                              py-2.5
                              rounded-xl
                              bg-slate-800
                              text-slate-300
                              hover:bg-slate-700
                              transition
                            "
                          >

                            <ExternalLink
                              size={17}
                            />

                            Paper

                          </a>

                        )}


                        {/* =====================================
                            PDF LINK
                        ===================================== */}
{paper.pdf_url && (
  <a
    href={paper.pdf_url}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-700 transition"
  >
    <FileText size={17} />
    {paper.is_open_access ? "Open Access PDF" : "PDF"}
  </a>
)}

                       
                      </div>

                    </article>

                  );

                }
              )}

            </div>

          )}

      </main>

    </div>

  );

}


export default FindPapers;
