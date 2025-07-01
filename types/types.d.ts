 interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'completed';
  dueDate: string;
  subtasks?: Subtask[];
}

 interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}