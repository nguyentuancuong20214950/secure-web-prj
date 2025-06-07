import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:5001",
  withCredentials: true, 
});

// Interceptor xử lý lỗi 401
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Nếu lỗi là 401 và chưa từng refresh
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const res = await axios.post(
          "http://localhost:5001/refresh-token",
          {},
          { withCredentials: true }
        );

        if (res.data.Status === "Token refreshed") {
          return axiosInstance(originalRequest); // Gửi lại request ban đầu
        }
      } catch (refreshError) {
        console.error("Refresh token failed", refreshError);
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
