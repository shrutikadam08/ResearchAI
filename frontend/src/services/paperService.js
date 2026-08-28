import axios from "axios";

const API_URL =
  "http://127.0.0.1:8000";


export const searchPapers = async ({
  query,
  offset = 0,
  limit = 10,
  year = "",
  openAccessOnly = false,
  token,
}) => {

  const config = {

    params: {

      q: query,

      offset,

      limit,

      ...(year && {
        year,
      }),

      open_access_only:
        openAccessOnly,

    },

  };


  // Only send Authorization when
  // a real token exists.
  if (token) {

    config.headers = {
      Authorization:
        `Bearer ${token}`,
    };

  }


  const response =
    await axios.get(
      `${API_URL}/papers/search`,
      config
    );


  return response.data;
};