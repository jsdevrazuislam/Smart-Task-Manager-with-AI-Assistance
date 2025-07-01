'use client';

import { useState } from 'react';
import TaskForm from '@/components/task-form';

interface TaskItemProps {
  task: Task;
  onUpdate: (task: Task) => void;
  onDelete: (id: string) => void;
}

export default function TaskItem({ task, onUpdate, onDelete }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggleStatus = () => {
    const newStatus = task.status === 'pending' ? 'completed' : 'pending';
    onUpdate({
      ...task,
      status: newStatus,
      subtasks: task.subtasks?.map(subtask => ({
        ...subtask,
        completed: newStatus === 'completed'
      }))
    });
  };

  const handleGenerateSubtasks = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskTitle: task.title,
          taskDescription: task.description,
        }),
      });

      const data = await response.json();

      if(data?.error){
        setError(data?.error ?? 'Something went wrong');
        return
      }

      if (data.subtasks) {
        const newSubtasks: Subtask[] = data.subtasks.map((title: string) => ({
          id: Math.random().toString(36).substring(2, 9),
          title,
          completed: false,
        }));

        onUpdate({
          ...task,
          subtasks: [...(task.subtasks || []), ...newSubtasks],
        });
      }
    } catch (error) {
      console.error('Error generating subtasks:', error);
      setError(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSubtask = (subtaskId: string) => {
    const updatedSubtasks = task.subtasks?.map((subtask) =>
      subtask.id === subtaskId
        ? { ...subtask, completed: !subtask.completed }
        : subtask
    );
    onUpdate({ ...task, subtasks: updatedSubtasks });
  };

  if (isEditing) {
    return (
      <TaskForm
        task={task}
        onSave={(updatedTask) => {
          onUpdate(updatedTask);
          setIsEditing(false);
        }}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <div className={`p-4 mb-4 rounded shadow ${task.status === 'completed' ? 'bg-gray-100' : 'bg-white'}`}>
      <div className="flex justify-between items-start">
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={task.status === 'completed'}
            onChange={handleToggleStatus}
            className="mr-2 h-5 w-5"
          />
          <h3 className={`text-lg font-medium ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-800'}`}>
            {task.title}
          </h3>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setIsEditing(true)}
            className="px-2 cursor-pointer py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="px-2 cursor-pointer py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </div>
      {task.description && (
        <p className="mt-2 text-gray-600">{task.description}</p>
      )}
      {task.dueDate && (
        <p className="mt-1 text-sm text-gray-500">
          Due: {new Date(task.dueDate).toLocaleDateString()}
        </p>
      )}
      <div className="mt-3">
        <button
          onClick={handleGenerateSubtasks}
          disabled={isLoading}
          className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-green-300"
        >
          {isLoading ? 'Generating...' : 'Suggest Subtasks'}
        </button>

         {error && (
          <div className="mt-2 p-2 text-sm text-red-600 bg-red-50 rounded">
            Error: {error}
            <button 
              onClick={() => setError(null)} 
              className="ml-2 text-red-800 hover:text-red-900"
            >
              ×
            </button>
          </div>
        )}
      </div>
      {task.subtasks && task.subtasks.length > 0 && (
        <div className="mt-3 pl-4">
          <h4 className="font-medium text-gray-700">Subtasks:</h4>
          <ul className="list-disc pl-5">
            {task.subtasks.map((subtask) => (
              <li key={subtask.id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={subtask.completed}
                  onChange={() => handleToggleSubtask(subtask.id)}
                  className="mr-2"
                />
                <span className={subtask.completed ? 'line-through text-gray-500' : ''}>
                  {subtask.title}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}