
import CreateQuizClient from "./CreateQuizClient";
import { getUserInfo } from "../lib/data";

// Fetch user info if needed for the quiz creator

export default async function CreateQuizPage() {
  const user = await getUserInfo();

  return <CreateQuizClient user={user} />;
}