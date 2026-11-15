import AnalyticsClient from './AnalyticsClient';

export default function AnalyticsLoading() {
  return <AnalyticsClient submissions={[]} quizzes={[]} loading />;
}
