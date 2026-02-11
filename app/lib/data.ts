/* eslint-disable @typescript-eslint/no-explicit-any */
import { cookies } from "next/headers";
import { ApiResponse, QuizCardProps } from "../types/global";

const baseUrl: string = process.env.BACKEND_URL || "http://localhost:5004/api";

// Helper to get auth token
const getAuthToken = async () => {
  return (await cookies()).get("auth-token")?.value || "";
};

// Helper to create auth headers
const createAuthHeaders = async () => {
  const token = await getAuthToken();
  return {
    "Content-Type": "application/json",
    Authorization: "Bearer " + token,
  };
};

export const getQuizzes = async () => {
  const token = await getAuthToken();
  const data = await fetch(baseUrl + "/quiz/", {
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    credentials: "include",
  });
  const allData = await data.json();
  const quizzes: [QuizCardProps] = allData.quizzes;
  return quizzes;
};

// Get single quiz by ID
export const getQuizById = async (id: string) => {
  const token = await getAuthToken();
  try {
    const response = await fetch(`${baseUrl}/quiz/${id}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      credentials: "include",
      cache: "no-store", // Ensure fresh data
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch quiz: ${response.statusText}`);
    }

    const data = await response.json();
    return data.quiz || data; // Adjust based on your API response structure
  } catch (error) {
    console.error("Error fetching quiz:", error);
    throw error;
  }
};

// Update quiz (for edit functionality)
export const updateQuiz = async (id: string, quizData: any) => {
  const token = await getAuthToken();
  try {
    const response = await fetch(`${baseUrl}/quiz/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      credentials: "include",
      body: JSON.stringify(quizData),
    });

    if (!response.ok) {
      throw new Error(`Failed to update quiz: ${response.statusText}`);
    }

    const data: ApiResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Error updating quiz:", error);
    throw error;
  }
};

// Delete quiz
export const deleteQuiz = async (id: string) => {
  const token = await getAuthToken();
  try {
    const response = await fetch(`${baseUrl}/quiz/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Failed to delete quiz: ${response.statusText}`);
    }

    const data: ApiResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Error deleting quiz:", error);
    throw error;
  }
};

// Toggle quiz active status
export const toggleQuizStatus = async (id: string, isActive: boolean) => {
  const token = await getAuthToken();
  try {
    const response = await fetch(`${baseUrl}/quiz/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      credentials: "include",
      body: JSON.stringify({ isActive }),
    });

    if (!response.ok) {
      throw new Error(`Failed to toggle quiz status: ${response.statusText}`);
    }

    const data: ApiResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Error toggling quiz status:", error);
    throw error;
  }
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