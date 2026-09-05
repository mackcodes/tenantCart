const BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_API_URL ||
  "http://localhost:8080/api/v1";

const request = async (
  path,
  {
    method = "GET",
    body,
    token,
  } = {}
) => {
  const isFormData = body instanceof FormData;
  const cleanPath = path.startsWith("/")
    ? path
    : `/${path}`;

  const url = `${BASE_URL}${cleanPath}`;

  const headers = {
    Accept: "application/json",
  };

  if (body !== undefined && !isFormData) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    credentials: "include",
    body: body === undefined
      ? undefined
      : isFormData
        ? body
        : JSON.stringify(body),
  });

  let data = {};

  try {
    data = await response.json();
  } catch (parseError) {
    data = {
      message: `Server returned HTTP ${response.status}`,
    };
  }

  if (!response.ok) {
    const error = new Error(
      data.message ||
        `Request failed with status ${response.status}`
    );

    error.status = response.status;

    throw error;
  }

  return data;
};

export default request;
