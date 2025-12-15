import { cookies } from "next/headers";
import { ApiResponse, QuizCardProps } from "../types/global";

const baseUrl: string = process.env.BACKEND_URL || "http://localhost:5004/api";
const token = (await cookies()).get("auth-token")?.value || "";

export const getQuizzes = async () => {
  //add headers for fetch request
  const data = await fetch(baseUrl + "/quiz/", {
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    //add credentials to include cookies
    credentials: "include",
  });
  const allData = await data.json();
  const quizzes: [QuizCardProps] = allData.quizzes;
  return quizzes;
};

export const bulkuploadQuiz = async (formData: FormData) => {
  try {
    const response = await fetch(`${baseUrl}/quiz/create-with-upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
      body: formData,
    });

    const data: ApiResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Upload error:", error);
    alert("Failed to upload quiz. Please try again.");
  }
};
