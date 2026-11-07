import CreateQuizClient from "../../../create-quiz/CreateQuizClient";

export default async function ExamEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CreateQuizClient quizId={id} />;
}
