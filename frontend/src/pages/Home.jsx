import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Search,
  Brain,
  BookOpen,
  Lightbulb,
  ArrowRight,
  Sparkles,
  LogIn,
  UserPlus,
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

import { searchPapers } from "../services/paperService";

import {
  savePaper,
  getSavedPapers,
  deleteSavedPaper,
} from "../services/savedPaperService";


function Home() {
  const navigate = useNavigate();


  // ============================================================
  // SEARCH STATE
  // ============================================================

  const [query, setQuery] =
    useState("");

  const [searching, setSearching] =
    useState(false);

  const [searched, setSearched] =
    useState(false);

  const [papers, setPapers] =
    useState([]);

  const [searchError, setSearchError] =
    useState("");

  const [openAccessOnly, setOpenAccessOnly] =
    useState(false);


  // ============================================================
  // SEARCH HISTORY
  // ============================================================

  const [searchHistory, setSearchHistory] =
    useState([]);


  // ============================================================
  // SAVED PAPERS
  // ============================================================

  const [savedPaperIds, setSavedPaperIds] =
    useState(new Set());

  const [savingPaperId, setSavingPaperId] =
    useState(null);


  // ============================================================
  // AI ANALYSIS
  // ============================================================

  const [analyzingPaperId, setAnalyzingPaperId] =
    useState(null);


  // Prevent duplicate initial API calls in React StrictMode.
  const savedPapersLoadStarted = useRef(false);


  // ============================================================
  // AUTH
  // ============================================================

  const isLoggedIn = () => {
    return Boolean(
      localStorage.getItem(
        "access_token"
      )
    );
  };


  // ============================================================
  // LOAD SEARCH HISTORY
  // ============================================================

  useEffect(() => {

    try {

      const storedHistory =
        localStorage.getItem(
          "researchai_search_history"
        );


      if (storedHistory) {

        const parsed =
          JSON.parse(
            storedHistory
          );


        if (
          Array.isArray(parsed)
        ) {

          setSearchHistory(
            parsed
          );

        }

      }

    } catch (error) {

      console.error(
        "Failed to load search history:",
        error
      );

    }

  }, []);


  // ============================================================
  // LOAD SAVED PAPERS
  //
  // ONLY for logged-in users.
  // Guests must never call /saved-papers.
  // ============================================================

  useEffect(() => {

    if (savedPapersLoadStarted.current) {
      return;
    }

    savedPapersLoadStarted.current = true;


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

            setSavedPaperIds(
              new Set()
            );

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

          // Home is public. If the stored token is expired or invalid,
          // simply treat the visitor as having no saved papers.
          if (
            error?.response?.status ===
            401
          ) {

            setSavedPaperIds(
              new Set()
            );

            return;

          }


          console.error(
            "Failed to load saved papers:",
            error
          );

        }

      };


    loadSavedPapers();

  }, []);


  // ============================================================
  // ADD SEARCH TO HISTORY
  // ============================================================

  const addToSearchHistory =
    (searchQuery) => {

      const cleanQuery =
        searchQuery.trim();


      if (!cleanQuery) {
        return;
      }


      setSearchHistory(
        (previous) => {

          const filtered =
            previous.filter(
              (item) =>
                item.toLowerCase() !==
                cleanQuery.toLowerCase()
            );


          const updated = [
            cleanQuery,
            ...filtered,
          ].slice(0, 8);


          localStorage.setItem(
            "researchai_search_history",
            JSON.stringify(
              updated
            )
          );


          return updated;

        }
      );

    };


  // ============================================================
  // SEARCH PAPERS
  //
  // IMPORTANT:
  // NO navigation happens here.
  // Results appear on this SAME page.
  // ============================================================

  const handleSearch = async (
    eventOrQuery
  ) => {

    let searchQuery = "";


    // Search from form
    if (
      typeof eventOrQuery !==
      "string"
    ) {

      eventOrQuery?.preventDefault();

      searchQuery =
        query.trim();

    }

    // Search from history
    else {

      searchQuery =
        eventOrQuery.trim();

      setQuery(
        searchQuery
      );

    }


    if (!searchQuery) {

      setSearchError(
        "Please enter something to search."
      );

      return;
    }


    setSearching(true);

    setSearched(true);

    setSearchError("");


    try {

      const token =
        localStorage.getItem(
          "access_token"
        );


      const response =
        await searchPapers({

          query:
            searchQuery,

          offset: 0,

          limit: 10,

          year: "",

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


      addToSearchHistory(
        searchQuery
      );


    } catch (error) {

      console.error(
        "Paper search failed:",
        error
      );


      const detail =
        error?.response?.data?.detail;


      let message =
        "Unable to search papers. Please try again.";


      if (
        typeof detail ===
        "string"
      ) {

        message =
          detail;

      } else if (
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
          messages.length > 0
        ) {

          message =
            messages.join(
              ", "
            );

        }

      }


      setSearchError(
        message
      );

      setPapers([]);

    } finally {

      setSearching(false);

    }

  };


  // ============================================================
  // SEARCH FROM HISTORY
  // ============================================================

  const handleHistorySearch =
    (historyQuery) => {

      handleSearch(
        historyQuery
      );

    };


  // ============================================================
  // CLEAR SEARCH
  //
  // Returns to the landing page WITHOUT navigation.
  // ============================================================

  const handleClearSearch =
    () => {

      setQuery("");

      setPapers([]);

      setSearched(false);

      setSearchError("");

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

    };


  // ============================================================
  // CLEAR SEARCH HISTORY
  // ============================================================

  const clearSearchHistory =
    () => {

      localStorage.removeItem(
        "researchai_search_history"
      );

      setSearchHistory([]);

    };


  // ============================================================
  // SAVE / UNSAVE PAPER
  // ============================================================

  const handleSavePaper =
    async (paper) => {

      // --------------------------------------------------------
      // Guest → Login
      // --------------------------------------------------------

      if (!isLoggedIn()) {

        navigate("/login");

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


      // ========================================================
      // UNSAVE
      // ========================================================

      if (
        savedPaperIds.has(
          paperId
        )
      ) {

        try {

          setSavingPaperId(
            paperId
          );


          const saved =
            await getSavedPapers();


          const savedPaper =
            saved.find(
              (item) =>
                (
                  item.openalex_id ||
                  item.paper_id
                ) === paperId
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
            "Failed to remove paper:",
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

            navigate("/login");

          }

        } finally {

          setSavingPaperId(
            null
          );

        }


        return;
      }


      // ========================================================
      // SAVE
      // ========================================================

      try {

        setSavingPaperId(
          paperId
        );


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


        } else if (
          typeof paper.authors ===
          "string"
        ) {

          authors =
            paper.authors;

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
            authors || null,

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
          payload
        );


        await savePaper(
          payload
        );


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


          navigate("/login");

          return;
        }


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


        setSearchError(
          "Unable to save this paper. Please try again."
        );

      } finally {

        setSavingPaperId(
          null
        );

      }

    };


  // ============================================================
  // AI ANALYZE
  // ============================================================

  const handleAnalyzePaper =
    (paper) => {

      console.log(
        "AI Analyze clicked:",
        paper
      );


      // Guest → Login
      if (!isLoggedIn()) {

        navigate("/login");

        return;
      }


      const paperId =
        paper?.paper_id ||
        paper?.id;


      setAnalyzingPaperId(
        paperId
      );


      // Store complete paper
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


  // ============================================================
  // AUTHORS FORMATTER
  // ============================================================

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


  // ============================================================
  // RENDER
  // ============================================================

  return (

    <div className="min-h-screen bg-slate-950 text-white">


      {/* ======================================================
          NAVBAR
      ====================================================== */}

      <nav className="h-16 border-b border-slate-800/80 bg-slate-950/95 backdrop-blur flex items-center justify-between px-6 md:px-10 sticky top-0 z-50">

        {/* LOGO */}

        <button
          type="button"
          onClick={
            handleClearSearch
          }
          className="flex items-center gap-3"
        >

          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">

            <BookOpen
              size={20}
            />

          </div>


          <span className="text-xl font-bold tracking-tight">

            ResearchAI

          </span>

        </button>


        {/* NAVIGATION */}

        <div className="flex items-center gap-2">

          {isLoggedIn() ? (

            <>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/dashboard"
                  )
                }
                className="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
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
                className="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
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
                    "/login"
                  )
                }
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
              >

                <LogIn
                  size={17}
                />

                Login

              </button>


              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/register"
                  )
                }
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 transition font-medium"
              >

                <UserPlus
                  size={17}
                />

                Sign Up

              </button>

            </>

          )}

        </div>

      </nav>


      {/* ======================================================
          MAIN
      ====================================================== */}

      <main>


        {/* ====================================================
            HERO / SEARCH
        ==================================================== */}

        {!searched && (

          <section className="relative overflow-hidden">

            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />


            <div className="relative max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">


              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-800 bg-slate-900/70 text-slate-300 text-sm mb-8">

                <Sparkles
                  size={15}
                  className="text-blue-400"
                />

                AI-powered research assistant

              </div>


              <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight">

                Research smarter.

                <br />

                <span className="text-blue-500">
                  Discover faster.
                </span>

              </h1>


              <p className="max-w-2xl mx-auto mt-7 text-lg md:text-xl text-slate-400 leading-relaxed">

                Discover research papers,
                understand complex ideas,
                analyze methodologies, and
                uncover research gaps with
                ResearchAI.

              </p>


              {/* ==================================================
                  SEARCH
              ================================================== */}

              <form
                onSubmit={
                  handleSearch
                }
                className="max-w-3xl mx-auto mt-10"
              >

                <div className="flex items-center gap-3 p-2 rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/30 focus-within:border-blue-500 transition">

                  <Search
                    size={23}
                    className="ml-3 text-slate-500 shrink-0"
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
                    placeholder="Search research papers, topics, authors..."
                    className="flex-1 bg-transparent outline-none text-white placeholder:text-slate-500 py-3 text-base"
                  />


                  <button
                    type="submit"
                    disabled={
                      searching
                    }
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 px-5 py-3 rounded-xl font-semibold transition shrink-0"
                  >

                    {searching ? (

                      <Loader2
                        size={17}
                        className="animate-spin"
                      />

                    ) : (

                      <>

                        Search

                        <ArrowRight
                          size={17}
                        />

                      </>

                    )}

                  </button>

                </div>

              </form>

              <div className="max-w-3xl mx-auto mt-4 flex justify-center">
                <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-slate-400">
                  <input
                    type="checkbox"
                    checked={openAccessOnly}
                    onChange={(event) =>
                      setOpenAccessOnly(event.target.checked)
                    }
                    className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Open Access only</span>
                </label>
              </div>

              <p className="mt-4 text-sm text-slate-500">

                Search freely. Login is required
                only to save or analyze papers.

              </p>


              {/* SEARCH HISTORY */}

              {searchHistory.length >
                0 && (

                <div className="max-w-3xl mx-auto mt-8 text-left">

                  <div className="flex items-center justify-between mb-3">

                    <p className="text-sm font-medium text-slate-400">

                      Previous searches

                    </p>


                    <button
                      type="button"
                      onClick={
                        clearSearchHistory
                      }
                      className="text-xs text-slate-600 hover:text-slate-400"
                    >

                      Clear

                    </button>

                  </div>


                  <div className="flex flex-wrap gap-2">

                    {searchHistory.map(
                      (
                        historyItem
                      ) => (

                        <button
                          key={
                            historyItem
                          }
                          type="button"
                          onClick={() =>
                            handleHistorySearch(
                              historyItem
                            )
                          }
                          className="rounded-full border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-400 hover:border-blue-500/50 hover:text-white transition"
                        >

                          <Search
                            size={13}
                            className="inline mr-2"
                          />

                          {historyItem}

                        </button>

                      )
                    )}

                  </div>

                </div>

              )}

            </div>

          </section>

        )}


        {/* ====================================================
            SEARCH RESULTS HEADER
        ==================================================== */}

        {searched && (

          <section className="max-w-6xl mx-auto px-6 pt-10">


            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">


              <div>

                <button
                  type="button"
                  onClick={
                    handleClearSearch
                  }
                  className="flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-5"
                >

                  ← Back

                </button>


                <h1 className="text-3xl font-bold">

                  Search Results

                </h1>


                <p className="mt-2 text-slate-400">

                  Results for{" "}

                  <span className="text-white font-medium">
                    "{query}"
                  </span>

                </p>

              </div>


              <form
                onSubmit={
                  handleSearch
                }
                className="w-full md:w-[480px]"
              >

                <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 p-1.5">

                  <Search
                    size={19}
                    className="ml-3 text-slate-500"
                  />


                  <input
                    value={query}
                    onChange={(
                      event
                    ) =>
                      setQuery(
                        event.target.value
                      )
                    }
                    className="flex-1 bg-transparent outline-none py-2.5 text-sm"
                    placeholder="Search again..."
                  />


                  <button
                    type="submit"
                    disabled={
                      searching
                    }
                    className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium hover:bg-blue-500 disabled:opacity-60"
                  >

                    Search

                  </button>

                </div>

              </form>

            </div>

            <div className="mt-4 flex justify-end">
              <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-slate-400">
                <input
                  type="checkbox"
                  checked={openAccessOnly}
                  onChange={(event) =>
                    setOpenAccessOnly(event.target.checked)
                  }
                  className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-blue-500"
                />
                <span>Open Access only</span>
              </label>
            </div>


            {/* ERROR */}

            {searchError && (

              <div className="mt-7 rounded-xl border border-red-900/50 bg-red-950/30 px-5 py-4 text-sm text-red-300">

                {searchError}

              </div>

            )}


            {/* LOADING */}

            {searching && (

              <div className="py-20 text-center">

                <Loader2
                  size={35}
                  className="mx-auto animate-spin text-blue-500"
                />

                <p className="mt-4 text-slate-400">

                  Searching research
                  papers...

                </p>

              </div>

            )}


            {/* NO RESULTS */}

            {!searching &&
              papers.length === 0 &&
              !searchError && (

                <div className="py-20 text-center">

                  <FileText
                    size={42}
                    className="mx-auto text-slate-600 mb-4"
                  />


                  <h2 className="text-xl font-semibold">

                    No papers found

                  </h2>


                  <p className="mt-2 text-slate-500">

                    Try a different search
                    query.

                  </p>

                </div>

              )}


            {/* ==================================================
                RESULTS
            ================================================== */}

            {!searching &&
              papers.length > 0 && (

                <div className="mt-10 pb-20">

                  <div className="flex items-center justify-between mb-5">

                    <h2 className="text-xl font-semibold">

                      {papers.length} papers

                    </h2>

                  </div>


                  <div className="space-y-5">

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
                            className="rounded-2xl border border-slate-800 bg-slate-900 p-6 hover:border-slate-700 transition"
                          >


                            <h3 className="text-xl font-semibold leading-8">

                              {paper.title ||
                                "Untitled Paper"}

                            </h3>


                            {/* AUTHORS */}

                            {paper.authors && (

                              <div className="flex items-start gap-2 mt-3 text-sm text-slate-400">

                                <User
                                  size={16}
                                  className="mt-0.5 shrink-0"
                                />

                                <span>

                                  {getAuthorsText(
                                    paper.authors
                                  )}

                                </span>

                              </div>

                            )}


                            {/* META */}

                            <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-500">

                              {paper.year && (

                                <span className="flex items-center gap-1.5">

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


                              {paper.citation_count !==
                                undefined && (

                                <span className="flex items-center gap-1.5">

                                  <Quote
                                    size={14}
                                  />

                                  {
                                    paper.citation_count
                                  }{" "}

                                  citations

                                </span>

                              )}

                            </div>


                            {/* ABSTRACT */}

                            {paper.abstract ? (

                              <p className="mt-5 text-sm leading-7 text-slate-400 line-clamp-4">

                                {paper.abstract}

                              </p>

                            ) : (

                              <p className="mt-5 text-sm italic text-slate-600">

                                Abstract not available.

                              </p>

                            )}


                            {/* ACTIONS */}

                            <div className="flex flex-wrap gap-3 mt-6">


                              {/* AI ANALYZE */}

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
                                className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-medium hover:bg-purple-500 disabled:opacity-60 transition"
                              >

                                {isAnalyzing ? (

                                  <Loader2
                                    size={17}
                                    className="animate-spin"
                                  />

                                ) : (

                                  <Brain
                                    size={17}
                                  />

                                )}

                                AI Analyze

                              </button>


                              {/* SAVE */}

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
                                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                                  isSaved
                                    ? "bg-green-600/15 border border-green-500/30 text-green-400"
                                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                                }`}
                              >

                                {isSaving ? (

                                  <Loader2
                                    size={17}
                                    className="animate-spin"
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


                              {/* PAPER */}

                              {paper.url && (

                                <a
                                  href={
                                    paper.url
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-700 transition"
                                >

                                  <ExternalLink
                                    size={17}
                                  />

                                  Paper

                                </a>

                              )}


                              {/* PDF */}

                              {paper.pdf_url && (

                                <a
                                  href={
                                    paper.pdf_url
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-700 transition"
                                >

                                  <FileText
                                    size={17}
                                  />

                                  {paper.is_open_access
                                    ? "Open Access PDF"
                                    : "PDF"}

                                </a>

                              )}

                            </div>


                            {paper.is_open_access ? (

                              <p className="mt-4 text-sm font-medium text-green-400">

                                ✓ Open Access

                              </p>

                            ) : (

                              <p className="mt-4 text-sm font-medium text-yellow-400">

                                🔒 Not Open Access

                              </p>

                            )}

                          </article>

                        );

                      }
                    )}

                  </div>

                </div>

              )}

          </section>

        )}


        {/* ====================================================
            FEATURES
        ==================================================== */}

        {!searched && (

          <section className="max-w-6xl mx-auto px-6 py-20">

            <div className="text-center mb-12">

              <p className="text-blue-400 text-sm font-semibold uppercase tracking-wider">

                Everything you need

              </p>


              <h2 className="text-3xl md:text-4xl font-bold mt-3">

                Your research workspace

              </h2>


              <p className="text-slate-400 mt-4 max-w-xl mx-auto">

                From discovering papers to
                understanding them, ResearchAI
                brings your research workflow
                together.

              </p>

            </div>


            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">


              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

                <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center mb-5">

                  <Search
                    size={22}
                    className="text-blue-400"
                  />

                </div>


                <h3 className="font-semibold text-lg">

                  Discover Papers

                </h3>


                <p className="text-slate-400 text-sm mt-3 leading-relaxed">

                  Search academic literature
                  directly from ResearchAI.

                </p>

              </div>


              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

                <div className="w-11 h-11 rounded-xl bg-purple-500/10 flex items-center justify-center mb-5">

                  <Brain
                    size={22}
                    className="text-purple-400"
                  />

                </div>


                <h3 className="font-semibold text-lg">

                  AI Analysis

                </h3>


                <p className="text-slate-400 text-sm mt-3 leading-relaxed">

                  Understand summaries,
                  methodology, contributions
                  and limitations.

                </p>

              </div>


              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

                <div className="w-11 h-11 rounded-xl bg-yellow-500/10 flex items-center justify-center mb-5">

                  <Lightbulb
                    size={22}
                    className="text-yellow-400"
                  />

                </div>


                <h3 className="font-semibold text-lg">

                  Research Gaps

                </h3>


                <p className="text-slate-400 text-sm mt-3 leading-relaxed">

                  Identify open problems and
                  possible future research
                  directions.

                </p>

              </div>


              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

                <div className="w-11 h-11 rounded-xl bg-green-500/10 flex items-center justify-center mb-5">

                  <BookOpen
                    size={22}
                    className="text-green-400"
                  />

                </div>


                <h3 className="font-semibold text-lg">

                  Research Library

                </h3>


                <p className="text-slate-400 text-sm mt-3 leading-relaxed">

                  Save important papers and
                  organize your research in one
                  place.

                </p>

              </div>

            </div>

          </section>

        )}


        {/* ====================================================
            CTA
        ==================================================== */}

        {!searched && (

          <section className="max-w-5xl mx-auto px-6 pb-24">

            <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 p-10 md:p-14 text-center">

              <div className="relative">

                <div className="flex justify-center mb-5">

                  <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center">

                    <Sparkles
                      size={24}
                      className="text-blue-400"
                    />

                  </div>

                </div>


                <h2 className="text-3xl md:text-4xl font-bold">

                  Ready to start researching?

                </h2>


                <p className="text-slate-400 mt-4 max-w-xl mx-auto">

                  Create your free ResearchAI
                  account and build your personal
                  research workspace.

                </p>


                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/register"
                    )
                  }
                  className="mt-7 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl font-semibold transition"
                >

                  Get Started

                  <ArrowRight
                    size={18}
                  />

                </button>

              </div>

            </div>

          </section>

        )}

      </main>


      {/* ======================================================
          FOOTER
      ====================================================== */}

      <footer className="border-t border-slate-800 py-8">

        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">

          <div className="flex items-center gap-2">

            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">

              <BookOpen
                size={15}
              />

            </div>


            <span className="font-semibold">

              ResearchAI

            </span>

          </div>


          <p className="text-sm text-slate-500">

            AI-powered research discovery
            and analysis.

          </p>

        </div>

      </footer>

    </div>

  );
}


export default Home;