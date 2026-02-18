export default async function SessionPage({
  params,
}: {
  params: { sessionId: string };
}) {
  const { sessionId } = params;

  return (
    <div>
      <h1>Session Details</h1>
      <p>Session ID: {sessionId}</p>
      {/* Additional session details and attendance information can be displayed here */}
    </div>
  );
}