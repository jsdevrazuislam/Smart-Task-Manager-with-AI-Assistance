import TaskList from '@/components/task-lists';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Smart Task Manager with AI Assistance',
  description: 'Build a task management application using React/Next.js with smart AI-powered task suggestions using Google Gemini API.'
}

export default function Home() {
 
  return (
    <main className="min-h-screen bg-gray-100 py-8">
      <TaskList />
    </main>
  );
}