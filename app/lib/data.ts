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
export const getUserInfo = async () => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value || "";
    
    // Optional: fetch user info if needed
    const response = await fetch(`${baseUrl}/user/profile`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return data.user || null;
  } catch (error) {
    console.error('Error fetching user info:', error);
    return null;
  }
}

export const getAllQuizzes = async () => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value || "";
    
    const response = await fetch(`${baseUrl}/quiz/`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      console.error('Failed to fetch quizzes');
      return [];
    }
    
    const data = await response.json();
    return data.quizzes || [];
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    return [];
  }
}


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

export const getSubmissions = async () => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value || "";
    
    const response = await fetch(`${baseUrl}/admin/submissions`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      console.error('Failed to fetch submissions');
      return [];
    }
    
    const data = await response.json();
    return data.submissions || [];
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return [];
  }
}



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