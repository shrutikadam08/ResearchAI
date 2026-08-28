import { useEffect, useState } from "react";

import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Lightbulb,
  AlertTriangle,
  Search,
  Rocket,
  Loader2,
  ExternalLink,
  FileText,
} from "lucide-react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import { analyzePaper } from "../services/analysisService";


// ============================================================
// PAPER ANALYSIS
// ============================================================

function PaperAnalysis() {

  const navigate =
    useNavigate();

  const location =
    useLocation();


  // ==========================================================
  // PAPER
  // ==========================================================

  const [
    paper,
    setPaper,
  ] = useState(
    location.state?.paper ||
    null
  );


  // ==========================================================
  // ANALYSIS
  // ==========================================================

  const [
    analysis,
    setAnalysis,
  ] = useState(null);


  const [
    loading,
    setLoading,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  // ==========================================================
  // LOAD PAPER
  // ==========================================================

  useEffect(() => {

    if (
      location.state?.paper
    ) {

      setPaper(
        location.state.paper
      );

      return;

    }


    const storedPaper =
      sessionStorage.getItem(
        "researchai_analysis_paper"
      );


    if (
      !storedPaper
    ) {

      setPaper(null);

      return;

    }


    try {

      const parsedPaper =
        JSON.parse(
          storedPaper
        );


      setPaper(
        parsedPaper
      );

    } catch (storageError) {

      console.error(
        "Failed to read stored analysis paper:",
        storageError
      );


      setPaper(null);

    }

  }, [
    location.state,
  ]);


  // ==========================================================
  // AUTHORS
  // ==========================================================

  const getAuthorsText =
    () => {

      if (
        !paper?.authors
      ) {

        return "Unknown authors";

      }


      if (
        typeof paper.authors ===
        "string"
      ) {

        return paper.authors;

      }


      if (
        Array.isArray(
          paper.authors
        )
      ) {

        const names =
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

            .filter(Boolean);


        return (
          names.length
            ? names.join(", ")
            : "Unknown authors"
        );

      }


      return "Unknown authors";

    };


  // ==========================================================
  // AUTH
  // ==========================================================

  const ensureLoggedIn =
    () => {

      const token =
        localStorage.getItem(
          "access_token"
        );


      if (!token) {

        localStorage.removeItem(
          "is_logged_in"
        );


        navigate(
          "/login",
          {
            replace: true,
          }
        );


        return false;

      }


      return true;

    };


  // ==========================================================
  // ERROR FORMATTER
  // ==========================================================

  const getErrorMessage =
    (requestError) => {

      const detail =
        requestError?.response?.data?.detail;


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
          messages.length
        ) {

          return messages.join(
            ", "
          );

        }

      }


      if (
        requestError?.response?.status ===
        401
      ) {

        return (
          "Your session has expired. Please log in again."
        );

      }


      if (
        requestError?.response?.status ===
        422
      ) {

        return (
          detail ||
          "This paper does not have enough readable content for analysis."
        );

      }


      if (
        requestError?.response?.status ===
        500
      ) {

        return (
          detail ||
          "AI analysis could not be generated. Please make sure Ollama is running."
        );

      }


      return (
        "Unable to analyze this paper. Please try again."
      );

    };


  // ==========================================================
  // ANALYZE PAPER
  // ==========================================================

  const handleAnalyze =
    async () => {

      if (
        !paper
      ) {

        setError(
          "Paper information is not available."
        );

        return;

      }


      if (
        !ensureLoggedIn()
      ) {

        return;

      }


      setLoading(
        true
      );

      setError(
        ""
      );

      setAnalysis(
        null
      );


      try {

        console.log(
          "Analyzing paper:",
          paper
        );


        const result =
          await analyzePaper(
            paper
          );


        console.log(
          "Paper analysis result:",
          result
        );


        setAnalysis(
          result
        );

      } catch (
        requestError
      ) {

        console.error(
          "Paper analysis failed:",
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
          getErrorMessage(
            requestError
          )
        );

      } finally {

        setLoading(
          false
        );

      }

    };


  // ==========================================================
  // BACK TO DASHBOARD
  // ==========================================================

  const handleBack =
    () => {

      sessionStorage.removeItem(
        "researchai_analysis_paper"
      );


      const returnTo =
        location.state?.returnTo ||
        "/dashboard";

      navigate(
        returnTo
      );

    };


  // ==========================================================
  // PAPER NOT AVAILABLE
  // ==========================================================

  if (
    !paper
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

          <div
            className="
              mx-auto
              flex
              h-14
              w-14
              items-center
              justify-center
              rounded-2xl
              bg-indigo-50
            "
          >

            <FileText
              size={25}
              className="
                text-indigo-600
              "
            />

          </div>


          <h2
            className="
              mt-5
              text-xl
              font-semibold
              text-slate-900
            "
          >
            Paper not found
          </h2>


          <p
            className="
              mt-2
              text-sm
              leading-6
              text-slate-500
            "
          >
            The paper information is no longer available.
            Return to the Dashboard and select a paper again.
          </p>


          <button
            type="button"
            onClick={
              handleBack
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

            <ArrowLeft
              size={17}
            />

            Back to Dashboard

          </button>

        </div>

      </div>

    );

  }


  // ==========================================================
  // PAPER ID
  // ==========================================================

  const paperId =
    paper.paper_id ||
    paper.id ||
    paper.openalex_id ||
    "";


  // ==========================================================
  // RENDER
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
          bg-white/95
          backdrop-blur
        "
      >

        <div
          className="
            mx-auto
            max-w-7xl
            px-6
            py-6
            lg:px-8
          "
        >

          <button
            type="button"
            onClick={
              handleBack
            }
            className="
              mb-6
              inline-flex
              items-center
              gap-2
              rounded-xl
              px-3
              py-2
              text-sm
              font-medium
              text-slate-500
              transition
              hover:bg-slate-100
              hover:text-slate-900
            "
          >

            <ArrowLeft
              size={17}
            />

            Back to Dashboard

          </button>


          <div
            className="
              flex
              flex-col
              gap-6
              md:flex-row
              md:items-start
              md:justify-between
            "
          >

            <div
              className="
                flex
                gap-4
              "
            >

              <div
                className="
                  hidden
                  h-12
                  w-12
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-indigo-50
                  sm:flex
                "
              >

                <BookOpen
                  size={23}
                  className="
                    text-indigo-600
                  "
                />

              </div>


              <div>

                <p
                  className="
                    text-xs
                    font-medium
                    uppercase
                    tracking-wide
                    text-indigo-600
                  "
                >
                  AI PAPER ANALYSIS
                </p>


                <h1
                  className="
                    mt-2
                    max-w-5xl
                    text-3xl
                    font-semibold
                    leading-tight
                    tracking-tight
                    lg:text-4xl
                  "
                >
                  {paper.title ||
                    "Untitled Paper"}
                </h1>


                <p
                  className="
                    mt-2
                    text-sm
                    leading-6
                    text-slate-500
                  "
                >

                  {getAuthorsText()}


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


            <div
              className="
                flex
                flex-wrap
                gap-2
              "
            >

              {paper.url && (

                <a
                  href={
                    paper.url
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    flex
                    items-center
                    gap-2
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    px-4
                    py-2.5
                    text-sm
                    font-medium
                    text-slate-700
                    shadow-sm
                    transition
                    hover:-translate-y-0.5
                    hover:bg-slate-50
                    hover:shadow-md
                  "
                >

                  <ExternalLink
                    size={16}
                  />

                  View Paper

                </a>

              )}


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
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    px-4
                    py-2.5
                    text-sm
                    font-medium
                    text-slate-700
                    hover:bg-slate-50
                  "
                >

                  <FileText
                    size={16}
                  />

                  PDF

                </a>

              )}

            </div>

          </div>

        </div>

      </header>


      {/* ======================================================
          MAIN
      ====================================================== */}

      <main
        className="
          mx-auto
          max-w-7xl
          px-6
          py-10
          lg:px-8
        "
      >

        {/* ====================================================
            PAPER INFORMATION
        ==================================================== */}

        <section
          className="
            rounded-3xl
            border
            border-slate-200
            bg-white
            p-7
            shadow-[0_10px_35px_rgba(15,23,42,0.05)]
          "
        >

          <div
            className="
              flex
              items-center
              gap-3
            "
          >

            <FileText
              size={20}
              className="
                text-slate-500
              "
            />


            <h2
              className="
                text-lg
                font-semibold
              "
            >
              Paper Information
            </h2>

          </div>


          <div
            className="
              mt-5
              grid
              gap-4
              sm:grid-cols-2
              lg:grid-cols-4
            "
          >

            <InfoItem
              label="Year"
              value={
                paper.year ||
                "Not available"
              }
            />

            <InfoItem
              label="Venue"
              value={
                paper.venue ||
                "Not available"
              }
            />

            <InfoItem
              label="Citations"
              value={
                paper.citation_count ??
                "Not available"
              }
            />

            <InfoItem
              label="Paper ID"
              value={
                paperId ||
                "Not available"
              }
            />

          </div>

        </section>


        {/* ====================================================
            ABSTRACT
        ==================================================== */}

        {paper.abstract && (

          <section
            className="
              mt-6
              rounded-3xl
              border
              border-slate-200
              bg-white
              p-7
              shadow-[0_10px_35px_rgba(15,23,42,0.05)]
            "
          >

            <h2
              className="
                text-lg
                font-semibold
              "
            >
              Abstract
            </h2>


            <p
              className="
                mt-3
                text-sm
                leading-7
                text-slate-600
              "
            >
              {paper.abstract}
            </p>

          </section>

        )}


        {/* ====================================================
            ERROR
        ==================================================== */}

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
              leading-6
              text-red-700
            "
          >
            {error}
          </div>

        )}


        {/* ====================================================
            ANALYZE CARD
        ==================================================== */}

        {!analysis && (

          <section
            className="
              mt-6
              overflow-hidden
              rounded-3xl
              border
              border-indigo-100
              bg-gradient-to-br
              from-indigo-50
              via-white
              to-violet-50
              p-8
              text-center
              shadow-[0_12px_40px_rgba(79,70,229,0.08)]
            "
          >

            <div
              className="
                mx-auto
                flex
                h-14
                w-14
                items-center
                justify-center
                rounded-2xl
                bg-indigo-100
              "
            >

              <Lightbulb
                size={25}
                className="
                  text-indigo-600
                "
              />

            </div>


            <h2
              className="
                mt-5
                text-xl
                font-semibold
              "
            >
              Analyze this research paper
            </h2>


            <p
              className="
                mx-auto
                mt-2
                max-w-lg
                text-sm
                leading-6
                text-slate-600
              "
            >
              ResearchAI will examine the available
              paper content and identify its key ideas,
              methodology, limitations, research gaps,
              and future directions.
            </p>


            {!paper.abstract &&
              !paper.pdf_url && (

                <p
                  className="
                    mx-auto
                    mt-4
                    max-w-lg
                    text-xs
                    leading-5
                    text-amber-700
                  "
                >
                  This paper currently has neither an
                  abstract nor a PDF link available.
                  Analysis may not be possible.
                </p>

              )}


            <button
              type="button"
              onClick={
                handleAnalyze
              }
              disabled={
                loading
              }
              className="
                mt-6
                inline-flex
                items-center
                gap-2
                rounded-xl
                bg-slate-900
                px-6
                py-3
                text-sm
                font-medium
                text-white
                transition
                hover:bg-slate-800
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >

              {loading ? (

                <>

                  <Loader2
                    size={17}
                    className="
                      animate-spin
                    "
                  />

                  Analyzing Paper...

                </>

              ) : (

                <>

                  <Lightbulb
                    size={17}
                  />

                  Analyze Paper

                </>

              )}

            </button>

          </section>

        )}


        {/* ====================================================
            ANALYSIS RESULTS
        ==================================================== */}

        {analysis && (

          <div
            className="
              mt-8
              grid
              grid-cols-1
              gap-5
              lg:grid-cols-2
            "
          >

            <AnalysisCard
              icon={
                <BookOpen
                  size={20}
                />
              }
              title="Summary"
              fullWidth
            >

              <p
                className="
                  text-sm
                  leading-7
                  text-slate-600
                "
              >
                {safeText(
                  analysis.summary,
                  "No summary could be generated."
                )}
              </p>

            </AnalysisCard>


            <AnalysisCard
              icon={
                <CheckCircle2
                  size={20}
                />
              }
              title="Key Contributions"
            >

              <BulletList
                items={
                  analysis.key_contributions
                }
              />

            </AnalysisCard>


            <AnalysisCard
              icon={
                <Search
                  size={20}
                />
              }
              title="Methodology"
            >

              <p
                className="
                  text-sm
                  leading-7
                  text-slate-600
                "
              >
                {safeText(
                  analysis.methodology,
                  "Methodology information was not available."
                )}
              </p>

            </AnalysisCard>


            <AnalysisCard
              icon={
                <AlertTriangle
                  size={20}
                />
              }
              title="Limitations"
            >

              <BulletList
                items={
                  analysis.limitations
                }
              />

            </AnalysisCard>


            <AnalysisCard
              icon={
                <Search
                  size={20}
                />
              }
              title="Research Gaps"
            >

              <BulletList
                items={
                  analysis.research_gaps
                }
              />

            </AnalysisCard>


            <AnalysisCard
              icon={
                <Rocket
                  size={20}
                />
              }
              title="Future Directions"
            >

              <BulletList
                items={
                  analysis.future_directions
                }
              />

            </AnalysisCard>

          </div>

        )}


        {/* ====================================================
            ANALYZE AGAIN
        ==================================================== */}

        {analysis && (

          <div
            className="
              mt-6
              flex
              justify-center
            "
          >

            <button
              type="button"
              onClick={
                handleAnalyze
              }
              disabled={
                loading
              }
              className="
                flex
                items-center
                gap-2
                rounded-xl
                border
                border-slate-200
                bg-white
                px-5
                py-2.5
                text-sm
                font-medium
                text-slate-700
                hover:bg-slate-50
                disabled:opacity-50
              "
            >

              {loading ? (

                <Loader2
                  size={16}
                  className="
                    animate-spin
                  "
                />

              ) : (

                <Lightbulb
                  size={16}
                />

              )}

              Analyze Again

            </button>

          </div>

        )}

      </main>

    </div>

  );

}


// ============================================================
// INFO ITEM
// ============================================================

function InfoItem({
  label,
  value,
}) {

  return (

    <div
      className="
        rounded-2xl
        border
        border-slate-100
        bg-slate-50/80
        p-4
        transition
        hover:bg-white
        hover:shadow-sm
      "
    >

      <p
        className="
          text-xs
          font-medium
          uppercase
          tracking-wide
          text-slate-400
        "
      >
        {label}
      </p>


      <p
        className="
          mt-1
          break-words
          text-sm
          font-medium
          text-slate-700
        "
      >
        {value}
      </p>

    </div>

  );

}


// ============================================================
// ANALYSIS CARD
// ============================================================

function AnalysisCard({
  icon,
  title,
  children,
  fullWidth = false,
}) {

  const theme =
    title === "Limitations"
      ? {
          icon: "bg-amber-50 text-amber-600",
          line: "border-t-amber-400",
        }
      : title === "Research Gaps"
        ? {
            icon: "bg-violet-50 text-violet-600",
            line: "border-t-violet-400",
          }
        : title === "Future Directions"
          ? {
              icon: "bg-emerald-50 text-emerald-600",
              line: "border-t-emerald-400",
            }
          : title === "Key Contributions"
            ? {
                icon: "bg-sky-50 text-sky-600",
                line: "border-t-sky-400",
              }
            : {
                icon: "bg-indigo-50 text-indigo-600",
                line: "border-t-indigo-400",
              };

  return (

    <section
      className={`
        overflow-hidden
        rounded-3xl
        border
        border-slate-200
        border-t-4
        ${theme.line}
        bg-white
        p-7
        shadow-[0_10px_35px_rgba(15,23,42,0.05)]
        transition
        hover:-translate-y-0.5
        hover:shadow-[0_16px_40px_rgba(15,23,42,0.08)]

        ${
          fullWidth
            ? "lg:col-span-2"
            : ""
        }
      `}
    >

      <div
        className="
          flex
          items-center
          gap-3
        "
      >

        <div
          className={`
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-xl
            ${theme.icon}
          `}
        >
          {icon}
        </div>

        <div>
          <h2
            className="
              text-base
              font-semibold
              text-slate-900
            "
          >
            {title}
          </h2>

          <p
            className="
              mt-0.5
              text-[11px]
              uppercase
              tracking-wide
              text-slate-400
            "
          >
            Research insight
          </p>
        </div>

      </div>

      <div
        className="
          mt-5
        "
      >
        {children}
      </div>

    </section>

  );

}


// ============================================================
// BULLET LIST
// ============================================================

function BulletList({
  items,
}) {

  if (
    !Array.isArray(
      items
    ) ||
    items.length === 0
  ) {

    return (

      <p
        className="
          text-sm
          leading-6
          text-slate-500
        "
      >
        No information was available
        from the paper.
      </p>

    );

  }


  return (

    <ul
      className="
        space-y-3
      "
    >

      {items.map(
        (
          item,
          index
        ) => {

          const text =
            typeof item ===
            "string"
              ? item
              : JSON.stringify(
                  item
                );


          return (

            <li
              key={
                index
              }
              className="
                flex
                gap-3
                rounded-xl
                px-2
                py-1
                text-sm
                leading-6
                text-slate-600
              "
            >

              <span
                className="
                  mt-2
                  h-1.5
                  w-1.5
                  shrink-0
                  rounded-full
                  bg-indigo-500
                "
              />


              <span>
                {text}
              </span>

            </li>

          );

        }
      )}

    </ul>

  );

}


// ============================================================
// SAFE TEXT
// ============================================================

function safeText(
  value,
  fallback
) {

  if (
    typeof value ===
    "string" &&
    value.trim()
  ) {

    return value;

  }


  return fallback;

}


export default PaperAnalysis;