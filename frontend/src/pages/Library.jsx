import { useEffect, useRef, useState } from "react";

import {
  BookOpen,
  ExternalLink,
  Trash2,
  Loader2,
  ArrowLeft,
  FolderOpen,
  Sparkles,
  Search,
  X,
  FileText,
  Filter,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import {
  getSavedPapers,
  deleteSavedPaper,
} from "../services/savedPaperService";

import {
  getProjects,
  getProjectPapers,
} from "../services/projectService";


// ============================================================
// LIBRARY
// ============================================================

function Library() {

  const navigate =
    useNavigate();


  // ==========================================================
  // STATE
  // ==========================================================

  const [
    papers,
    setPapers,
  ] = useState([]);


  const [
    projects,
    setProjects,
  ] = useState([]);


  const [
    projectPaperMap,
    setProjectPaperMap,
  ] = useState({});


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    deletingId,
    setDeletingId,
  ] = useState(null);


  const [
    error,
    setError,
  ] = useState("");


  const [
    searchText,
    setSearchText,
  ] = useState("");


  const [
    libraryFilter,
    setLibraryFilter,
  ] = useState("all");


  // Prevent duplicate initial API calls in React StrictMode
  const libraryLoadedRef =
    useRef(false);


  // ==========================================================
  // LOAD LIBRARY + PROJECT INFORMATION
  // ==========================================================

  useEffect(() => {

    if (libraryLoadedRef.current) {
      return;
    }

    libraryLoadedRef.current = true;

    loadLibrary();

  }, []);


  const loadLibrary =
    async () => {

      setLoading(true);

      setError("");


      try {

        // ------------------------------------------------------
        // Load all saved papers
        // ------------------------------------------------------

        const savedPapers =
          await getSavedPapers();


        const normalizedPapers =
          Array.isArray(
            savedPapers
          )
            ? savedPapers
            : [];


        setPapers(
          normalizedPapers
        );


        // ------------------------------------------------------
        // Load all projects
        // ------------------------------------------------------

        const projectData =
          await getProjects();


        const normalizedProjects =
          Array.isArray(
            projectData
          )
            ? projectData
            : [];


        setProjects(
          normalizedProjects
        );


        // ------------------------------------------------------
        // Load papers for each project
        // ------------------------------------------------------

        const map = {};


        await Promise.all(

          normalizedProjects.map(
            async (
              project
            ) => {

              try {

                const projectPapers =
                  await getProjectPapers(
                    project.id
                  );


                if (
                  !Array.isArray(
                    projectPapers
                  )
                ) {

                  return;

                }


                projectPapers.forEach(
                  (
                    projectPaper
                  ) => {

                    const savedPaperId =
                      projectPaper.id;


                    if (
                      !savedPaperId
                    ) {

                      return;

                    }


                    if (
                      !map[savedPaperId]
                    ) {

                      map[savedPaperId] =
                        [];

                    }


                    map[
                      savedPaperId
                    ].push(
                      project
                    );

                  }
                );

              } catch (
                projectError
              ) {

                console.error(
                  `Failed to load papers for project ${project.id}:`,
                  projectError
                );

              }

            }
          )

        );


        setProjectPaperMap(
          map
        );

      } catch (requestError) {

        console.error(
          "Failed to load library:",
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
          "Unable to load your library."
        );

      } finally {

        setLoading(
          false
        );

      }

    };


  // ==========================================================
  // DELETE PAPER
  // ==========================================================

  const handleDelete =
    async (
      paperId
    ) => {

      const confirmed =
        window.confirm(
          "Remove this paper from your library? It will also be removed from all projects."
        );


      if (!confirmed) {

        return;

      }


      setDeletingId(
        paperId
      );

      setError("");


      try {

        await deleteSavedPaper(
          paperId
        );


        setPapers(
          (previous) =>
            previous.filter(
              (paper) =>
                paper.id !==
                paperId
            )
        );


        setProjectPaperMap(
          (previous) => {

            const next = {
              ...previous,
            };


            delete next[
              paperId
            ];


            return next;

          }
        );

      } catch (requestError) {

        console.error(
          "Failed to delete paper:",
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
          "Unable to remove this paper."
        );

      } finally {

        setDeletingId(
          null
        );

      }

    };


  // ==========================================================
  // OPEN PAPER
  // ==========================================================

  const handleOpenPaper =
    (
      paper
    ) => {

      const url =
        paper?.paper_url;


      if (!url) {

        setError(
          "This paper does not have an available paper link."
        );


        return;

      }


      window.open(
        url,
        "_blank",
        "noopener,noreferrer"
      );

    };


  // ==========================================================
  // ANALYZE PAPER
  // ==========================================================

  const handleAnalyze =
    (
      paper
    ) => {

      sessionStorage.setItem(

        "researchai_analysis_paper",

        JSON.stringify({

          paper_id:
            paper.openalex_id,

          title:
            paper.title,

          abstract:
            paper.abstract,

          authors:
            paper.authors,

          year:
            paper.year,

          venue:
            paper.venue,

          pdf_url:
            paper.pdf_url,

        })

      );


      navigate(
        "/paper-analysis"
      );

    };


  // ==========================================================
  // FILTER
  // ==========================================================

  const filteredPapers =
    papers.filter(
      (paper) => {

        const text =
          [
            paper.title,
            paper.authors,
            paper.venue,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

        const matchesSearch =
          text.includes(
            searchText
              .trim()
              .toLowerCase()
          );

        const paperProjects =
          projectPaperMap[paper.id] || [];

        const matchesFilter =
          libraryFilter === "all"
            ? true
            : libraryFilter === "open_access"
              ? Boolean(paper.is_open_access)
              : libraryFilter === "assigned"
                ? paperProjects.length > 0
                : paperProjects.length === 0;

        return (
          matchesSearch &&
          matchesFilter
        );

      }
    );


  const filterCounts = {
    all: papers.length,
    open_access: papers.filter(
      (paper) => Boolean(paper.is_open_access)
    ).length,
    assigned: papers.filter(
      (paper) =>
        (projectPaperMap[paper.id] || []).length > 0
    ).length,
    unassigned: papers.filter(
      (paper) =>
        (projectPaperMap[paper.id] || []).length === 0
    ).length,
  };


  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {

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
            size={30}
            className="
              mx-auto
              animate-spin
              text-slate-700
            "
          />


          <p
            className="
              mt-4
              text-sm
              text-slate-500
            "
          >
            Loading your library...
          </p>

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
        bg-slate-50
        text-slate-900
      "
    >

      {/* ======================================================
          HEADER
      ====================================================== */}

      <header
        className="
          border-b border-slate-200 bg-white
        "
      >

        <div
          className="
            mx-auto max-w-7xl px-6 py-7 lg:px-8
          "
        >

          <div
            className="
              flex flex-col gap-6 lg:flex-row
              lg:items-end lg:justify-between
            "
          >

            <div className="flex items-start gap-4">

              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="
                  mt-1 flex h-10 w-10 shrink-0
                  items-center justify-center rounded-xl
                  border border-slate-200 bg-white
                  text-slate-500 transition
                  hover:border-slate-300 hover:bg-slate-50
                  hover:text-slate-900
                "
              >
                <ArrowLeft size={18} />
              </button>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">
                  Research Library
                </p>

                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                  My Library
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Your saved research papers, organized for quick review and analysis.
                </p>
              </div>

            </div>

            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="
                inline-flex items-center justify-center gap-2
                rounded-xl bg-slate-900 px-4 py-2.5
                text-sm font-medium text-white transition
                hover:bg-slate-800
              "
            >
              <Search size={17} />
              Search Papers
            </button>

          </div>

        </div>

      </header>


      {/* ======================================================
          MAIN
      ====================================================== */}

      <main
        className="
          mx-auto max-w-7xl px-6 py-8 lg:px-8
        "
      >

        {error && (

          <div className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              className="shrink-0 text-red-400 hover:text-red-700"
            >
              <X size={16} />
            </button>
          </div>

        )}


        <section
          className="
            rounded-3xl border border-slate-200
            bg-white p-6 shadow-sm lg:p-7
          "
        >

          <div
            className="
              flex flex-col gap-5
              lg:flex-row lg:items-center lg:justify-between
            "
          >

            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50">
                  <BookOpen size={17} className="text-indigo-600" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">Saved Papers</h2>
              </div>

              <p className="mt-2 text-sm text-slate-500">
                {papers.length} {papers.length === 1 ? "paper" : "papers"} in your library
                {searchText.trim() && ` • ${filteredPapers.length} matching`}
              </p>
            </div>

            {papers.length > 0 && (
              <div className="relative w-full lg:w-80">
                <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="Search title, author, venue..."
                  className="
                    w-full rounded-xl border border-slate-200
                    bg-slate-50 py-2.5 pl-10 pr-4 text-sm
                    outline-none transition focus:border-indigo-300
                    focus:bg-white focus:ring-4 focus:ring-indigo-50
                  "
                />
              </div>
            )}

          </div>

          {papers.length > 0 && (

            <div className="mt-6 flex flex-wrap items-center gap-2">

              <div className="mr-1 flex items-center gap-2 text-xs font-medium text-slate-400">
                <Filter size={14} />
                Filter
              </div>

              {[
                ["all", "All", filterCounts.all],
                ["open_access", "Open Access", filterCounts.open_access],
                ["assigned", "In Projects", filterCounts.assigned],
                ["unassigned", "Unassigned", filterCounts.unassigned],
              ].map(([key, label, count]) => {

                const active = libraryFilter === key;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setLibraryFilter(key)}
                    className={`
                      rounded-full border px-3.5 py-2 text-xs font-medium
                      transition
                      ${
                        active
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }
                    `}
                  >
                    {label} <span className={active ? "text-slate-300" : "text-slate-400"}>{count}</span>
                  </button>
                );
              })}

            </div>

          )}

        </section>


      {/* ====================================================
            EMPTY
        ==================================================== */}

        {papers.length === 0 && (

          <div
            className="
              flex
              min-h-[400px]
              flex-col
              items-center
              justify-center
              rounded-2xl
              border
              border-dashed
              border-slate-300
              bg-white
              px-6
              text-center
            "
          >

            <div
              className="
                flex
                h-14
                w-14
                items-center
                justify-center
                rounded-2xl
                bg-indigo-50
              "
            >

              <BookOpen
                size={25}
                className="
                  text-indigo-600
                "
              />

            </div>


            <h2
              className="
                mt-5
                text-lg
                font-semibold
              "
            >
              Your library is empty
            </h2>


            <p
              className="
                mt-2
                max-w-md
                text-sm
                leading-6
                text-slate-500
              "
            >
              Search for research papers from your Dashboard
              and save them to your library.
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
              "
            >

              <Search
                size={17}
              />

              Search Papers

            </button>

          </div>

        )}


        {/* ====================================================
            NO FILTER RESULTS
        ==================================================== */}

        {papers.length > 0 &&
          filteredPapers.length === 0 && (

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

              <Search
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
                No matching papers
              </h3>


              <p
                className="
                  mt-2
                  text-sm
                  text-slate-500
                "
              >
                Try a different title, author, or venue.
              </p>

            </div>

          )}


        {/* ====================================================
            PAPER LIST
        ==================================================== */}

        {filteredPapers.length > 0 && (

          <div
            className="
              space-y-5
            "
          >

            {filteredPapers.map(
              (
                paper
              ) => {

                const deleting =
                  deletingId ===
                  paper.id;


                const paperProjects =
                  projectPaperMap[
                    paper.id
                  ] || [];


                return (

                  <article
                    key={
                      paper.id
                    }
                    className="
                      group rounded-2xl border
                      border-slate-200 bg-white p-6
                      shadow-sm transition
                      hover:-translate-y-0.5
                      hover:border-slate-300 hover:shadow-lg
                    "
                  >

                    <div
                      className="
                        flex
                        flex-col
                        gap-5
                      "
                    >

                      {/* ==================================================
                          PAPER HEADER
                      ================================================== */}

                      <div>

                        <div
                          className="
                            flex
                            items-start
                            gap-3
                          "
                        >

                          <div
                            className="
                              hidden
                              h-11
                              w-11
                              shrink-0
                              items-center
                              justify-center
                              rounded-xl
                              bg-indigo-50
                              sm:flex
                            "
                          >

                            <BookOpen
                              size={21}
                              className="
                                text-indigo-600
                              "
                            />

                          </div>


                          <div
                            className="
                              min-w-0
                              flex-1
                            "
                          >

                            <h3
                              className="
                                text-lg
                                font-semibold
                                leading-7
                              "
                            >
                              {paper.title}
                            </h3>


                            <p
                              className="
                                mt-2
                                text-sm
                                text-slate-500
                              "
                            >

                              {paper.authors ||
                                "Unknown authors"}


                              {paper.year && (

                                <>
                                  {" "}
                                  • {paper.year}
                                </>

                              )}


                              {paper.venue && (

                                <>
                                  {" "}
                                  • {paper.venue}
                                </>

                              )}

                            </p>

                          </div>

                        </div>


                        {/* ==================================================
                            PROJECTS
                        ================================================== */}

                        <div
                          className="
                            mt-4
                            flex
                            flex-wrap
                            items-center
                            gap-2
                          "
                        >

                          {paperProjects.length > 0 ? (

                            <>

                              <span
                                className="
                                  flex
                                  items-center
                                  gap-1.5
                                  text-xs
                                  font-medium
                                  text-slate-500
                                "
                              >

                                <FolderOpen
                                  size={14}
                                />

                                Projects:

                              </span>


                              {paperProjects.map(
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
                                      rounded-full
                                      bg-slate-100
                                      px-3
                                      py-1
                                      text-xs
                                      font-medium
                                      text-slate-700
                                      transition
                                      hover:bg-slate-200
                                    "
                                  >
                                    {project.title}
                                  </button>

                                )
                              )}

                            </>

                          ) : (

                            <span
                              className="
                                rounded-full
                                bg-amber-50
                                px-3
                                py-1
                                text-xs
                                font-medium
                                text-amber-700
                              "
                            >
                              Not assigned to a project
                            </span>

                          )}

                        </div>


                        {/* ==================================================
                            BADGES
                        ================================================== */}

                        <div
                          className="
                            mt-3
                            flex
                            flex-wrap
                            gap-2
                          "
                        >

                          {paper.is_open_access && (

                            <span
                              className="
                                rounded-full
                                bg-emerald-50
                                px-3
                                py-1
                                text-xs
                                font-medium
                                text-emerald-700
                              "
                            >
                              Open Access
                            </span>

                          )}


                          <span
                            className="
                              rounded-full
                              bg-slate-100
                              px-3
                              py-1
                              text-xs
                              text-slate-600
                            "
                          >

                            {paper.citation_count || 0}
                            {" "}
                            citations

                          </span>

                        </div>

                      </div>


                      {/* ==================================================
                          ABSTRACT
                      ================================================== */}

                      {paper.abstract && (

                        <p
                          className="
                            line-clamp-3
                            text-sm
                            leading-6
                            text-slate-600
                          "
                        >
                          {paper.abstract}
                        </p>

                      )}


                      {/* ==================================================
                          ACTIONS
                      ================================================== */}

                      <div
                        className="
                          flex
                          flex-wrap
                          gap-3
                          border-t
                          border-slate-100
                          pt-5
                        "
                      >

                        {paper.paper_url && (

                          <button
                            type="button"
                            onClick={() =>
                              handleOpenPaper(
                                paper
                              )
                            }
                            className="
                              flex
                              items-center
                              gap-2
                              rounded-lg
                              bg-slate-900
                              px-4
                              py-2
                              text-sm
                              font-medium
                              text-white
                              transition
                              hover:bg-slate-800
                            "
                          >

                            <ExternalLink
                              size={16}
                            />

                            Open Paper

                          </button>

                        )}


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
                            rounded-lg
                            bg-indigo-50
                            px-4
                            py-2
                            text-sm
                            font-medium
                            text-indigo-700
                            transition
                            hover:bg-indigo-100
                          "
                        >

                          <Sparkles
                            size={16}
                          />

                          AI Analyze

                        </button>


                        {paper.pdf_url && (

                          <a
                            href={
                              paper.pdf_url
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="
                              flex
                              items-center
                              gap-2
                              rounded-lg
                              border
                              border-slate-200
                              px-4
                              py-2
                              text-sm
                              font-medium
                              text-slate-700
                              transition
                              hover:bg-slate-50
                            "
                          >

                            <FileText
                              size={16}
                            />

                            PDF

                          </a>

                        )}


                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(
                              paper.id
                            )
                          }
                          disabled={
                            deleting
                          }
                          className="
                            flex
                            items-center
                            gap-2
                            rounded-lg
                            border
                            border-red-200
                            px-4
                            py-2
                            text-sm
                            font-medium
                            text-red-600
                            transition
                            hover:bg-red-50
                            disabled:opacity-50
                          "
                        >

                          {deleting ? (

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


                          {deleting
                            ? "Removing..."
                            : "Remove"}

                        </button>

                      </div>

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


export default Library;