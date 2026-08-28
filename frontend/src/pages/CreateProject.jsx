import { useState } from "react";
import {
  ArrowLeft,
  FolderPlus,
  Loader2,
} from "lucide-react";
import {
  useNavigate,
} from "react-router-dom";
import axios from "axios";

import {
  getToken,
} from "../services/authService";


const API_URL =
  "http://127.0.0.1:8000";


function CreateProject() {

  const navigate =
    useNavigate();


  // ==========================================================
  // FORM
  // ==========================================================

  const [
    title,
    setTitle,
  ] = useState("");


  const [
    description,
    setDescription,
  ] = useState("");


  // ==========================================================
  // STATE
  // ==========================================================

  const [
    loading,
    setLoading,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  // ==========================================================
  // CREATE PROJECT
  // ==========================================================

  const handleCreateProject =
    async (event) => {

      event.preventDefault();

      setError("");


      const trimmedTitle =
        title.trim();


      const trimmedDescription =
        description.trim();


      // ------------------------------------------------------
      // Validate title
      // ------------------------------------------------------

      if (!trimmedTitle) {

        setError(
          "Please enter a project title."
        );

        return;

      }


      if (
        trimmedTitle.length < 2
      ) {

        setError(
          "Project title must contain at least 2 characters."
        );

        return;

      }


      if (
        trimmedTitle.length > 200
      ) {

        setError(
          "Project title cannot exceed 200 characters."
        );

        return;

      }


      // ------------------------------------------------------
      // Get authentication token
      // ------------------------------------------------------

      const token =
        getToken();


      if (!token) {

        setError(
          "Your session has expired. Please login again."
        );


        setTimeout(
          () => {

            navigate(
              "/login",
              {
                replace: true,
              }
            );

          },
          800
        );


        return;

      }


      setLoading(true);


      try {

        console.log(
          "Creating project..."
        );


        const response =
          await axios.post(

            `${API_URL}/projects`,

            {
              title:
                trimmedTitle,

              description:
                trimmedDescription ||
                null,
            },

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
          "Project created successfully:",
          response.data
        );


        // ----------------------------------------------------
        // Go back to Dashboard
        //
        // Dashboard will reload projects and show
        // the newly created project.
        // ----------------------------------------------------

        navigate(
          "/dashboard",
          {
            replace: true,
          }
        );


      } catch (requestError) {

        console.error(
          "Project creation failed:",
          requestError
        );


        const status =
          requestError?.response?.status;


        const detail =
          requestError?.response?.data?.detail;


        // ----------------------------------------------------
        // Unauthorized
        // ----------------------------------------------------

        if (
          status === 401
        ) {

          localStorage.removeItem(
            "access_token"
          );

          localStorage.removeItem(
            "is_logged_in"
          );


          setError(
            "Your session has expired. Please login again."
          );


          setTimeout(
            () => {

              navigate(
                "/login",
                {
                  replace: true,
                }
              );

            },
            800
          );


          return;

        }


        // ----------------------------------------------------
        // Validation error
        // ----------------------------------------------------

        if (
          status === 422
        ) {

          if (
            Array.isArray(
              detail
            )
          ) {

            const messages =
              detail
                .map(
                  (item) =>
                    item?.msg ||
                    ""
                )
                .filter(Boolean);


            setError(
              messages.length
                ? messages.join(
                    ", "
                  )
                : "Please check the project details."
            );

          } else {

            setError(
              typeof detail ===
              "string"
                ? detail
                : "Please check the project details."
            );

          }


          return;

        }


        // ----------------------------------------------------
        // Other backend errors
        // ----------------------------------------------------

        if (
          typeof detail ===
          "string"
        ) {

          setError(
            detail
          );

        } else {

          setError(
            "Unable to create the project. Please try again."
          );

        }

      } finally {

        setLoading(false);

      }

    };


  // ==========================================================
  // CANCEL
  // ==========================================================

  const handleCancel =
    () => {

      navigate(
        "/dashboard"
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
          HEADER
      ====================================================== */}

      <header
        className="
          flex
          h-20
          items-center
          border-b
          border-slate-200
          bg-white
          px-6
          lg:px-10
        "
      >

        <button
          type="button"
          onClick={
            handleCancel
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
            transition
            hover:bg-slate-100
            hover:text-slate-900
          "
        >

          <ArrowLeft
            size={18}
          />

          Back to Dashboard

        </button>

      </header>


      {/* ======================================================
          CONTENT
      ====================================================== */}

      <main
        className="
          mx-auto
          max-w-2xl
          px-6
          py-12
        "
      >

        {/* ====================================================
            HEADER
        ==================================================== */}

        <div
          className="
            mb-8
          "
        >

          <div
            className="
              mb-5
              flex
              h-12
              w-12
              items-center
              justify-center
              rounded-xl
              bg-slate-900
            "
          >

            <FolderPlus
              size={24}
              className="
                text-white
              "
            />

          </div>


          <h1
            className="
              text-3xl
              font-semibold
              tracking-tight
            "
          >
            Create Research Project
          </h1>


          <p
            className="
              mt-2
              leading-6
              text-slate-500
            "
          >
            Create a project to organize your
            research papers and AI-powered
            analysis.
          </p>

        </div>


        {/* ====================================================
            FORM
        ==================================================== */}

        <form
          onSubmit={
            handleCreateProject
          }
          className="
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-7
            shadow-sm
            sm:p-8
          "
        >

          {/* ==================================================
              ERROR
          ================================================== */}

          {error && (

            <div
              className="
                mb-6
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


          {/* ==================================================
              TITLE
          ================================================== */}

          <div>

            <label
              htmlFor="project-title"
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
              id="project-title"
              type="text"
              value={title}
              onChange={(event) => {

                setTitle(
                  event.target.value
                );

                setError("");

              }}
              placeholder="e.g. AI in Healthcare"
              minLength={2}
              maxLength={200}
              disabled={loading}
              required
              autoFocus
              className="
                w-full
                rounded-xl
                border
                border-slate-200
                bg-white
                px-4
                py-3.5
                text-sm
                text-slate-900
                outline-none
                transition
                placeholder:text-slate-400
                focus:border-slate-500
                focus:ring-4
                focus:ring-slate-100
                disabled:cursor-not-allowed
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
              {title.length}/200 characters
            </p>

          </div>


          {/* ==================================================
              DESCRIPTION
          ================================================== */}

          <div
            className="
              mt-6
            "
          >

            <label
              htmlFor="project-description"
              className="
                mb-2
                block
                text-sm
                font-medium
                text-slate-700
              "
            >

              Description

              <span
                className="
                  font-normal
                  text-slate-400
                "
              >
                {" "}
                (Optional)
              </span>

            </label>


            <textarea
              id="project-description"
              value={description}
              onChange={(event) => {

                setDescription(
                  event.target.value
                );

                setError("");

              }}
              placeholder="Describe what you want to research..."
              maxLength={2000}
              rows={5}
              disabled={loading}
              className="
                w-full
                resize-none
                rounded-xl
                border
                border-slate-200
                bg-white
                px-4
                py-3.5
                text-sm
                leading-6
                text-slate-900
                outline-none
                transition
                placeholder:text-slate-400
                focus:border-slate-500
                focus:ring-4
                focus:ring-slate-100
                disabled:cursor-not-allowed
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
              {description.length}/2000
            </p>

          </div>


          {/* ==================================================
              BUTTONS
          ================================================== */}

          <div
            className="
              mt-8
              flex
              flex-col-reverse
              gap-3
              border-t
              border-slate-100
              pt-6
              sm:flex-row
              sm:justify-end
            "
          >

            <button
              type="button"
              onClick={
                handleCancel
              }
              disabled={loading}
              className="
                rounded-xl
                border
                border-slate-200
                px-5
                py-3
                text-sm
                font-medium
                text-slate-600
                transition
                hover:bg-slate-50
                hover:text-slate-900
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              Cancel
            </button>


            <button
              type="submit"
              disabled={
                loading ||
                !title.trim()
              }
              className="
                flex
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-slate-900
                px-5
                py-3
                text-sm
                font-medium
                text-white
                transition
                hover:bg-slate-800
                disabled:cursor-not-allowed
                disabled:opacity-50
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

                  Creating...

                </>

              ) : (

                <>

                  <FolderPlus
                    size={17}
                  />

                  Create Project

                </>

              )}

            </button>

          </div>

        </form>

      </main>

    </div>

  );

}


export default CreateProject;