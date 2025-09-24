import { useState, useEffect, createContext, useContext } from "react";

// Theme Context
const ThemeContext = createContext<{
  isDark: boolean;
  toggleTheme: () => void;
}>({
  isDark: false,
  toggleTheme: () => {}
});

const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Type definitions
interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
  priority: 'low' | 'medium' | 'high';
  category?: string;
  dueDate?: Date;
}

type FilterType = 'all' | 'active' | 'completed';
type SortType = 'newest' | 'oldest' | 'priority' | 'alphabetical';

export function Welcome() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('newest');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTodos, setSelectedTodos] = useState<Set<string>>(new Set());
  const [newTodoPriority, setNewTodoPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newTodoCategory, setNewTodoCategory] = useState('');
  const [newTodoDueDate, setNewTodoDueDate] = useState('');
  const [isAddingTodo, setIsAddingTodo] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [advancedSearchVisible, setAdvancedSearchVisible] = useState(false);

  // Predefined category colors
  const categoryColors = {
    'งาน': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-700',
    'ส่วนตัว': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-700',
    'การเรียน': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-purple-200 dark:border-purple-700',
    'ครอบครัว': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200 border-pink-200 dark:border-pink-700',
    'การออกกำลังกาย': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-200 dark:border-orange-700',
    'ช็อปปิ้ง': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-200 dark:border-yellow-700',
    'สุขภาพ': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200 dark:border-red-700',
    'เดินทาง': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 border-indigo-200 dark:border-indigo-700',
    'ความบันเทิง': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200 border-teal-200 dark:border-teal-700',
  };

  const getCategoryColor = (category?: string) => {
    if (!category) return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600';
    return categoryColors[category as keyof typeof categoryColors] || 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200 border-cyan-200 dark:border-cyan-700';
  };

  // Load theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    } else {
      // ตรวจสอบระบบ preference
      setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
  }, []);

  // Save theme to localStorage และอัพเดท HTML class
  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Progress calculation
  const getProgressStats = () => {
    const total = todos.length;
    const completed = todos.filter(todo => todo.completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    const overdue = todos.filter(todo => {
      if (!todo.dueDate || todo.completed) return false;
      return todo.dueDate.getTime() < new Date().getTime();
    }).length;
    
    const upcoming = todos.filter(todo => {
      if (!todo.dueDate || todo.completed) return false;
      const timeDiff = todo.dueDate.getTime() - new Date().getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      return daysDiff <= 3 && daysDiff >= 0;
    }).length;

    return { total, completed, percentage, overdue, upcoming };
  };

  // Focus mode filter
  const getFocusedTodos = () => {
    if (!isFocusMode) return getFilteredAndSortedTodos();
    
    return getFilteredAndSortedTodos().filter(todo => {
      if (todo.completed) return false;
      
      // ความสำคัญสูง
      if (todo.priority === 'high') return true;
      
      // งานที่ใกล้ครบกำหนดหรือเลยกำหนด
      if (todo.dueDate) {
        const timeDiff = todo.dueDate.getTime() - new Date().getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
        return daysDiff <= 1; // วันนี้หรือพรุ่งนี้หรือเลยกำหนด
      }
      
      return false;
    });
  };

  // Load todos from localStorage on component mount
  useEffect(() => {
    const savedTodos = localStorage.getItem('todos');
    if (savedTodos) {
      const parsedTodos = JSON.parse(savedTodos).map((todo: any) => ({
        ...todo,
        createdAt: new Date(todo.createdAt),
        dueDate: todo.dueDate ? new Date(todo.dueDate) : undefined
      }));
      setTodos(parsedTodos);
    }
  }, []);

  // Check for due date notifications
  useEffect(() => {
    const checkNotifications = () => {
      const now = new Date();
      const upcomingTodos = todos.filter(todo => {
        if (!todo.dueDate || todo.completed) return false;
        const timeDiff = todo.dueDate.getTime() - now.getTime();
        const hoursDiff = timeDiff / (1000 * 3600);
        return hoursDiff <= 24 && hoursDiff > 0; // แจ้งเตือนก่อน 24 ชั่วโมง
      });

      const overdueTodos = todos.filter(todo => {
        if (!todo.dueDate || todo.completed) return false;
        return todo.dueDate.getTime() < now.getTime();
      });

      const newNotifications: string[] = [];
      
      if (overdueTodos.length > 0) {
        newNotifications.push(`🚨 มี ${overdueTodos.length} งานที่เลยกำหนดแล้ว!`);
      }
      
      if (upcomingTodos.length > 0) {
        newNotifications.push(`⏰ มี ${upcomingTodos.length} งานที่ใกล้ครบกำหนดใน 24 ชั่วโมง!`);
      }

      setNotifications(newNotifications);
    };

    checkNotifications();
    const interval = setInterval(checkNotifications, 60000); // เช็คทุก 1 นาที
    return () => clearInterval(interval);
  }, [todos]);

  // Save todos to localStorage whenever todos change
  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  const addTodo = () => {
    if (newTodo.trim()) {
      const todo: Todo = {
        id: Date.now().toString(),
        text: newTodo.trim(),
        completed: false,
        createdAt: new Date(),
        priority: newTodoPriority,
        category: newTodoCategory.trim() || undefined,
        dueDate: newTodoDueDate ? new Date(newTodoDueDate) : undefined
      };
      setTodos([todo, ...todos]);
      setNewTodo('');
      setNewTodoCategory('');
      setNewTodoDueDate('');
      setIsAddingTodo(false);
    }
  };

  const toggleTodo = (id: string) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(todo => todo.id !== id));
    setSelectedTodos(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  const editTodo = (id: string, newText: string) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, text: newText } : todo
    ));
  };

  const toggleSelectTodo = (id: string) => {
    setSelectedTodos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAllVisible = () => {
    const visibleTodoIds = getFilteredAndSortedTodos().map(todo => todo.id);
    setSelectedTodos(new Set(visibleTodoIds));
  };

  const clearSelection = () => {
    setSelectedTodos(new Set());
  };

  const bulkDelete = () => {
    setTodos(todos.filter(todo => !selectedTodos.has(todo.id)));
    setSelectedTodos(new Set());
  };

  const bulkComplete = () => {
    setTodos(todos.map(todo => 
      selectedTodos.has(todo.id) ? { ...todo, completed: true } : todo
    ));
    setSelectedTodos(new Set());
  };

  const bulkUncomplete = () => {
    setTodos(todos.map(todo => 
      selectedTodos.has(todo.id) ? { ...todo, completed: false } : todo
    ));
    setSelectedTodos(new Set());
  };

  const clearCompleted = () => {
    setTodos(todos.filter(todo => !todo.completed));
    setSelectedTodos(new Set());
  };

  const getFilteredAndSortedTodos = () => {
    let filtered = todos.filter(todo => {
      // Filter by completion status
      const matchesFilter = 
        filter === 'all' || 
        (filter === 'active' && !todo.completed) ||
        (filter === 'completed' && todo.completed);
      
      // Enhanced search term with advanced search
      let matchesSearch = true;
      if (searchTerm) {
        const searchTermLower = searchTerm.toLowerCase();
        
        // Check for special keywords
        if (searchTermLower.includes('priority:high')) {
          matchesSearch = matchesSearch && todo.priority === 'high';
        }
        if (searchTermLower.includes('priority:medium')) {
          matchesSearch = matchesSearch && todo.priority === 'medium';
        }
        if (searchTermLower.includes('priority:low')) {
          matchesSearch = matchesSearch && todo.priority === 'low';
        }
        
        // Due date keywords
        if (searchTermLower.includes('due:overdue') && todo.dueDate) {
          const isOverdue = todo.dueDate.getTime() < new Date().getTime();
          matchesSearch = matchesSearch && isOverdue;
        }
        if (searchTermLower.includes('due:today') && todo.dueDate) {
          const today = new Date();
          const isToday = todo.dueDate.toDateString() === today.toDateString();
          matchesSearch = matchesSearch && isToday;
        }
        if (searchTermLower.includes('due:upcoming') && todo.dueDate) {
          const timeDiff = todo.dueDate.getTime() - new Date().getTime();
          const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
          matchesSearch = matchesSearch && (daysDiff <= 7 && daysDiff > 0);
        }
        
        // Regular text search (excluding special keywords)
        const regularSearchTerms = searchTermLower
          .replace(/priority:(high|medium|low)/g, '')
          .replace(/due:(overdue|today|upcoming)/g, '')
          .trim();
          
        if (regularSearchTerms) {
          const textMatch = todo.text.toLowerCase().includes(regularSearchTerms) ||
            (todo.category && todo.category.toLowerCase().includes(regularSearchTerms));
          matchesSearch = matchesSearch && Boolean(textMatch);
        }
      }
      
      // Filter by category
      const matchesCategory = 
        selectedCategory === 'all' ||
        (selectedCategory === 'no-category' && !todo.category) ||
        (todo.category && todo.category === selectedCategory);
      
      return matchesFilter && matchesSearch && matchesCategory;
    });

    // Sort todos
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return a.createdAt.getTime() - b.createdAt.getTime();
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'alphabetical':
          return a.text.localeCompare(b.text, 'th');
        default: // newest
          return b.createdAt.getTime() - a.createdAt.getTime();
      }
    });
  };

  const filteredTodos = getFilteredAndSortedTodos();
  const displayTodos = isFocusMode ? getFocusedTodos() : filteredTodos;
  const completedCount = todos.filter(todo => todo.completed).length;
  const activeCount = todos.filter(todo => !todo.completed).length;
  const categories = Array.from(new Set(todos.map(todo => todo.category).filter(Boolean)));
  const noCategotyCount = todos.filter(todo => !todo.category).length;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600';
    }
  };

  const getDueDateStatus = (dueDate?: Date) => {
    if (!dueDate) return null;
    const now = new Date();
    const timeDiff = dueDate.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (daysDiff < 0) {
      return { status: 'overdue', text: `เลยกำหนด ${Math.abs(daysDiff)} วัน`, color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' };
    } else if (daysDiff === 0) {
      return { status: 'today', text: 'วันนี้', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' };
    } else if (daysDiff === 1) {
      return { status: 'tomorrow', text: 'พรุ่งนี้', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' };
    } else if (daysDiff <= 7) {
      return { status: 'upcoming', text: `อีก ${daysDiff} วัน`, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' };
    } else {
      return { status: 'future', text: `อีก ${daysDiff} วัน`, color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' };
    }
  };

  // Export/Import Functions
  const exportToJSON = () => {
    const dataStr = JSON.stringify(todos, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `todos-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Text', 'Completed', 'Priority', 'Category', 'Created Date', 'Due Date'];
    const csvData = todos.map(todo => [
      todo.id,
      `"${todo.text.replace(/"/g, '""')}"`,
      todo.completed ? 'Yes' : 'No',
      todo.priority,
      todo.category || '',
      todo.createdAt.toISOString(),
      todo.dueDate ? todo.dueDate.toISOString() : ''
    ]);
    
    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const dataBlob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `todos-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importFromJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedTodos = JSON.parse(content).map((todo: any) => ({
          ...todo,
          createdAt: new Date(todo.createdAt),
          dueDate: todo.dueDate ? new Date(todo.dueDate) : undefined
        }));
        
        // Validate imported data
        const validTodos = importedTodos.filter((todo: any) => 
          todo.id && todo.text && typeof todo.completed === 'boolean'
        );
        
        if (validTodos.length > 0) {
          setTodos(validTodos);
          setNotifications([`✅ นำเข้าข้อมูลสำเร็จ ${validTodos.length} รายการ`]);
        } else {
          setNotifications(['❌ ไม่พบข้อมูลที่ถูกต้องในไฟล์']);
        }
      } catch (error) {
        setNotifications(['❌ ไฟล์ไม่ถูกต้อง กรุณาเลือกไฟล์ JSON ที่ถูกต้อง']);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      <div className="container mx-auto max-w-7xl px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8 relative">
          <button
            onClick={toggleTheme}
            className="absolute top-0 right-0 sm:right-2 p-2 sm:p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 group hover:scale-110 hover:-translate-y-1 hover:rotate-12"
            title={isDarkMode ? 'เปลี่ยนเป็นโหมดสว่าง' : 'เปลี่ยนเป็นโหมดมืด'}
          >
            <div className="relative w-5 h-5 sm:w-6 sm:h-6 overflow-hidden">
              <span className={`absolute inset-0 text-xl sm:text-2xl transition-transform duration-500 group-hover:scale-110 ${isDarkMode ? 'translate-y-0' : 'translate-y-8'}`}>
                🌙
              </span>
              <span className={`absolute inset-0 text-xl sm:text-2xl transition-transform duration-500 group-hover:scale-110 ${isDarkMode ? '-translate-y-8' : 'translate-y-0'}`}>
                ☀️
              </span>
            </div>
          </button>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2 pr-12 sm:pr-16 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 transition-all duration-500 cursor-default hover:scale-105 transform">
            ✅ Todo List Pro
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg px-4">
            จัดการงานของคุณอย่างมีประสิทธิภาพและเป็นระบบ
          </p>
        </div>

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="mb-6 sm:mb-8 space-y-2">
            {notifications.map((notification, index) => (
              <div key={index} className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900 dark:to-orange-900 border border-red-200 dark:border-red-700 rounded-xl p-3 sm:p-4 hover:shadow-lg hover:shadow-red-500/20 transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-1 animate-pulse">
                <div className="flex items-center justify-between">
                  <span className="text-red-800 dark:text-red-200 font-medium text-sm sm:text-base pr-2">
                    {notification}
                  </span>
                  <button
                    onClick={() => setNotifications(notifications.filter((_, i) => i !== index))}
                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 transition-all duration-200 flex-shrink-0 p-1 hover:scale-125 hover:rotate-90 rounded-full hover:bg-red-100 dark:hover:bg-red-800"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Progress Bar */}
        {todos.length > 0 && (
          <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-2xl hover:shadow-blue-500/10 border border-gray-100 dark:border-gray-700 mb-6 sm:mb-8 transition-all duration-300 transform hover:scale-[1.01] hover:-translate-y-1">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 space-y-3 sm:space-y-0">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200">📈 ความคืบหน้าโดยรวม</h3>
              <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
                <span className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400 hover:scale-110 transition-transform duration-200">
                  {getProgressStats().percentage}%
                </span>
                <button
                  onClick={() => setIsFocusMode(!isFocusMode)}
                  className={`px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-all duration-300 flex-1 sm:flex-initial transform hover:scale-105 hover:shadow-lg ${
                    isFocusMode 
                      ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-purple-500/30' 
                      : 'bg-gradient-to-r from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800 text-purple-800 dark:text-purple-200 hover:from-purple-200 hover:to-purple-300 dark:hover:from-purple-800 dark:hover:to-purple-700'
                  }`}
                  title="แสดงเฉพาะงานสำคัญและเร่งด่วน"
                >
                  <span className="hidden sm:inline">🎯 {isFocusMode ? 'ออกจากโฟกัส' : 'โหมดโฟกัส'}</span>
                  <span className="sm:hidden">🎯 {isFocusMode ? 'ปกติ' : 'โฟกัส'}</span>
                </button>
              </div>
            </div>
            
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 sm:h-4 mb-4 overflow-hidden shadow-inner hover:shadow-lg transition-shadow duration-300">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-1000 ease-out relative shadow-lg"
                style={{ width: `${getProgressStats().percentage}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent animate-pulse"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_ease-in-out_infinite]"></div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm">
              <div className="text-center group cursor-default">
                <div className="font-semibold text-blue-600 dark:text-blue-400 text-lg sm:text-xl group-hover:scale-110 transition-transform duration-200">{getProgressStats().completed}</div>
                <div className="text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">เสร็จแล้ว</div>
              </div>
              <div className="text-center group cursor-default">
                <div className="font-semibold text-orange-600 dark:text-orange-400 text-lg sm:text-xl group-hover:scale-110 transition-transform duration-200">{getProgressStats().total - getProgressStats().completed}</div>
                <div className="text-gray-600 dark:text-gray-400 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors duration-200">เหลือ</div>
              </div>
              <div className="text-center group cursor-default">
                <div className="font-semibold text-red-600 dark:text-red-400 text-lg sm:text-xl group-hover:scale-110 transition-transform duration-200">{getProgressStats().overdue}</div>
                <div className="text-gray-600 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors duration-200">เลยกำหนด</div>
              </div>
              <div className="text-center group cursor-default">
                <div className="font-semibold text-yellow-600 dark:text-yellow-400 text-lg sm:text-xl group-hover:scale-110 transition-transform duration-200">{getProgressStats().upcoming}</div>
                <div className="text-gray-600 dark:text-gray-400 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors duration-200">ใกล้ครบกำหนด</div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 rounded-full bg-blue-100 dark:bg-blue-900 mr-3 sm:mr-4">
                <span className="text-lg sm:text-2xl">📋</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {displayTodos.length}/{todos.length}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                  {isFocusMode ? 'โฟกัส/ทั้งหมด' : 'แสดง/ทั้งหมด'}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 rounded-full bg-orange-100 dark:bg-orange-900 mr-3 sm:mr-4">
                <span className="text-lg sm:text-2xl">🕒</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-lg sm:text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {displayTodos.filter(todo => !todo.completed).length}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">รอดำเนินการ</div>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 rounded-full bg-green-100 dark:bg-green-900 mr-3 sm:mr-4">
                <span className="text-lg sm:text-2xl">✅</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400">
                  {displayTodos.filter(todo => todo.completed).length}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">เสร็จแล้ว</div>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900 mr-4">
                <span className="text-2xl">
                  {selectedCategory === 'all' ? '📂' : selectedCategory === 'no-category' ? '📄' : '📁'}
                </span>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {selectedCategory === 'all' 
                    ? categories.length 
                    : selectedCategory === 'no-category'
                      ? filteredTodos.length
                      : filteredTodos.length
                  }
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedCategory === 'all' 
                    ? 'หมวดหมู่ทั้งหมด' 
                    : selectedCategory === 'no-category'
                      ? 'ไม่มีหมวดหมู่'
                      : `หมวด: ${selectedCategory}`
                  }
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Add Todo Section */}
        <div className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-2xl hover:shadow-blue-500/10 border border-gray-100 dark:border-gray-700 mb-6 sm:mb-8 transition-all duration-300 transform hover:scale-[1.01] hover:-translate-y-1">
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
              <input
                type="text"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTodo()}
                placeholder="เพิ่มงานใหม่..."
                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-base sm:text-lg hover:shadow-md focus:shadow-lg transition-shadow duration-300"
              />
              <div className="flex space-x-2">
                <button
                  onClick={() => setIsAddingTodo(!isAddingTodo)}
                  className={`px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-all duration-300 flex-shrink-0 transform hover:scale-105 hover:shadow-lg ${
                    isAddingTodo 
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-blue-500/30' 
                      : 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white shadow-gray-500/30'
                  }`}
                >
                  ⚙️
                </button>
                <button
                  onClick={addTodo}
                  disabled={!newTodo.trim()}
                  className="px-4 sm:px-8 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-lg transition-all duration-300 disabled:cursor-not-allowed font-medium text-sm sm:text-base flex-shrink-0 transform hover:scale-105 hover:shadow-lg shadow-blue-500/30 disabled:shadow-none disabled:transform-none"
                >
                  <span className="hidden sm:inline">เพิ่ม ✨</span>
                  <span className="sm:hidden">เพิ่ม</span>
                </button>
              </div>
            </div>
            
            {isAddingTodo && (
              <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4 p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    หมวดหมู่
                  </label>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <input
                      type="text"
                      value={newTodoCategory}
                      onChange={(e) => setNewTodoCategory(e.target.value)}
                      placeholder="กรอกหมวดหมู่ใหม่..."
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm"
                    />
                    <select
                      value=""
                      onChange={(e) => e.target.value && setNewTodoCategory(e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:text-white text-sm sm:min-w-0 sm:w-auto"
                    >
                      <option value="">เลือก...</option>
                      {Object.keys(categoryColors).map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    ลำดับความสำคัญ
                  </label>
                  <select
                    value={newTodoPriority}
                    onChange={(e) => setNewTodoPriority(e.target.value as 'low' | 'medium' | 'high')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:text-white text-sm"
                  >
                    <option value="low">🟢 ต่ำ</option>
                    <option value="medium">🟡 ปานกลาง</option>
                    <option value="high">🔴 สูง</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    วันที่ครบกำหนด
                  </label>
                  <input
                    type="datetime-local"
                    value={newTodoDueDate}
                    onChange={(e) => setNewTodoDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="bg-gradient-to-br from-white to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-2xl hover:shadow-purple-500/10 border border-gray-100 dark:border-gray-700 mb-6 sm:mb-8 transition-all duration-300 transform hover:scale-[1.01] hover:-translate-y-1">
          <div className="flex flex-col space-y-4">
            {/* Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ค้นหางาน..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm sm:text-base hover:shadow-md focus:shadow-lg transition-shadow duration-300"
                />
                <span className="absolute left-3 top-2.5 text-gray-400 hover:text-blue-500 transition-colors duration-200">🔍</span>
              </div>
              <button
                onClick={() => setAdvancedSearchVisible(!advancedSearchVisible)}
                className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-300 text-sm sm:text-base transform hover:scale-105 hover:shadow-lg ${
                  advancedSearchVisible 
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-blue-500/30' 
                    : 'bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-300 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-500 shadow-gray-500/20'
                }`}
              >
                <span className="hidden sm:inline">🔧 ขั้นสูง</span>
                <span className="sm:hidden">🔧</span>
              </button>
            </div>

            {/* Advanced Search */}
            {advancedSearchVisible && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-4">
                <h4 className="font-medium text-gray-800 dark:text-white mb-3">🔍 การค้นหาขั้นสูง</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Search by Priority */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      ค้นหาตามความสำคัญ
                    </label>
                    <div className="space-y-2">
                      {['high', 'medium', 'low'].map((priority) => (
                        <label key={priority} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={searchTerm.includes(`priority:${priority}`)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSearchTerm(prev => prev + ` priority:${priority}`)
                              } else {
                                setSearchTerm(prev => prev.replace(`priority:${priority}`, '').trim())
                              }
                            }}
                            className="mr-2"
                          />
                          <span className={`px-2 py-1 text-xs rounded ${getPriorityColor(priority)}`}>
                            {priority === 'high' ? '🔴 สูง' : priority === 'medium' ? '🟡 ปานกลาง' : '🟢 ต่ำ'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Search by Due Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      ค้นหาตามกำหนดเวลา
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={searchTerm.includes('due:overdue')}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSearchTerm(prev => prev + ' due:overdue')
                            } else {
                              setSearchTerm(prev => prev.replace('due:overdue', '').trim())
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-red-600 dark:text-red-400">🚨 เลยกำหนด</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={searchTerm.includes('due:today')}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSearchTerm(prev => prev + ' due:today')
                            } else {
                              setSearchTerm(prev => prev.replace('due:today', '').trim())
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-orange-600 dark:text-orange-400">📅 วันนี้</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={searchTerm.includes('due:upcoming')}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSearchTerm(prev => prev + ' due:upcoming')
                            } else {
                              setSearchTerm(prev => prev.replace('due:upcoming', '').trim())
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-blue-600 dark:text-blue-400">⏰ ใกล้ครบกำหนด</span>
                      </label>
                    </div>
                  </div>

                  {/* Quick Category Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      หมวดหมู่ยอดนิยม
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {Object.keys(categoryColors).slice(0, 6).map((category) => (
                        <button
                          key={category}
                          onClick={() => setSelectedCategory(category)}
                          className={`px-2 py-1 text-xs rounded border font-medium transition-all hover:scale-105 ${getCategoryColor(category)}`}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-600">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    💡 เคล็ดลับ: ใช้คีย์เวิร์ด เช่น "priority:high", "due:today" ในช่องค้นหา
                  </div>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('all');
                      setFilter('all');
                      setSortBy('newest');
                    }}
                    className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                  >
                    ล้างทั้งหมด
                  </button>
                </div>
              </div>
            )}

            {/* Filter and Sort Controls */}
            <div className="flex flex-col space-y-4">
              {/* Status Filter Buttons */}
              <div className="flex flex-wrap gap-2">
                {(['all', 'active', 'completed'] as FilterType[]).map((filterType) => (
                  <button
                    key={filterType}
                    onClick={() => setFilter(filterType)}
                    className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-300 text-sm sm:text-base transform hover:scale-105 hover:shadow-lg ${
                      filter === filterType
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-blue-500/30'
                        : 'bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-300 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-500 shadow-gray-500/20'
                    }`}
                  >
                    <span className="hidden sm:inline">
                      {filterType === 'all' ? '📋 ทั้งหมด' : filterType === 'active' ? '⏳ รอดำเนินการ' : '✅ เสร็จแล้ว'}
                    </span>
                    <span className="sm:hidden">
                      {filterType === 'all' ? '📋 ทั้งหมด' : filterType === 'active' ? '⏳ รอ' : '✅ เสร็จ'}
                    </span>
                  </button>
                ))}
              </div>

              {/* Category and Sort Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm sm:text-base"
                >
                  <option value="all">📂 หมวดหมู่ทั้งหมด</option>
                  <option value="no-category">📄 ไม่มีหมวดหมู่</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      📁 {category}
                    </option>
                  ))}
                </select>

                {/* Sort Dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortType)}
                  className="px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm sm:text-base"
                >
                  <option value="newest">🕒 ใหม่ที่สุด</option>
                  <option value="oldest">⏰ เก่าที่สุด</option>
                  <option value="priority">⭐ ความสำคัญ</option>
                  <option value="alphabetical">🔤 ตัวอักษร</option>
                </select>
              </div>

              {/* Clear Filters Button */}
              {(searchTerm || selectedCategory !== 'all' || filter !== 'all' || sortBy !== 'newest') && (
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('all');
                      setFilter('all');
                      setSortBy('newest');
                    }}
                    className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm sm:text-base"
                  >
                    🗑️ ล้างตัวกรอง
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedTodos.size > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-xl p-3 sm:p-4 mb-6 sm:mb-8">
            <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-blue-800 dark:text-blue-200 font-medium text-sm sm:text-base text-center sm:text-left">
                เลือกแล้ว {selectedTodos.size} รายการ
              </span>
              <div className="grid grid-cols-2 sm:flex gap-2 sm:space-x-2">
                <button
                  onClick={bulkComplete}
                  className="px-3 sm:px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-xs sm:text-sm"
                >
                  <span className="hidden sm:inline">✅ ทำเสร็จ</span>
                  <span className="sm:hidden">✅ เสร็จ</span>
                </button>
                <button
                  onClick={bulkUncomplete}
                  className="px-3 sm:px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors text-xs sm:text-sm"
                >
                  <span className="hidden sm:inline">↩️ ยกเลิก</span>
                  <span className="sm:hidden">↩️ ยกเลิก</span>
                </button>
                <button
                  onClick={bulkDelete}
                  className="px-3 sm:px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-xs sm:text-sm"
                >
                  <span className="hidden sm:inline">🗑️ ลบ</span>
                  <span className="sm:hidden">🗑️</span>
                </button>
                <button
                  onClick={clearSelection}
                  className="px-3 sm:px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-xs sm:text-sm col-span-2 sm:col-span-1"
                >
                  <span className="hidden sm:inline">✖️ ยกเลิกการเลือก</span>
                  <span className="sm:hidden">✖️ ยกเลิก</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 sm:p-4 mb-6 sm:mb-8">
          <div className="flex flex-col space-y-3">
            {/* Selection Actions */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={selectAllVisible}
                className="px-3 sm:px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors text-xs sm:text-sm"
              >
                <span className="hidden sm:inline">✅ เลือกทั้งหมด</span>
                <span className="sm:hidden">✅ เลือกทั้งหมด</span>
              </button>
              <button
                onClick={clearSelection}
                className="px-3 sm:px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-xs sm:text-sm"
              >
                <span className="hidden sm:inline">✖️ ยกเลิกการเลือก</span>
                <span className="sm:hidden">✖️ ยกเลิก</span>
              </button>
              
              {completedCount > 0 && (
                <button
                  onClick={clearCompleted}
                  className="px-3 sm:px-4 py-2 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors text-xs sm:text-sm"
                >
                  <span className="hidden sm:inline">🧹 ลบงานที่เสร็จแล้ว ({completedCount})</span>
                  <span className="sm:hidden">🧹 ลบเสร็จ ({completedCount})</span>
                </button>
              )}
            </div>
            
            {/* Export/Import Actions */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={exportToJSON}
                className="px-3 sm:px-4 py-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 transition-colors text-xs sm:text-sm"
                title="ส่งออกเป็น JSON"
              >
                📤 JSON
              </button>
              <button
                onClick={exportToCSV}
                className="px-3 sm:px-4 py-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-800 transition-colors text-xs sm:text-sm"
                title="ส่งออกเป็น CSV"
              >
                📊 CSV
              </button>
              <label className="px-3 sm:px-4 py-2 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors text-xs sm:text-sm cursor-pointer">
                📥 นำเข้า
                <input
                  type="file"
                  accept=".json"
                  onChange={importFromJSON}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Todo List */}
        <div className="space-y-2 sm:space-y-3">
          {isFocusMode && (
            <div className="bg-purple-50 dark:bg-purple-900 border border-purple-200 dark:border-purple-700 rounded-xl p-3 sm:p-4 mb-3 sm:mb-4">
              <div className="flex items-center space-x-2">
                <span className="text-xl sm:text-2xl">🎯</span>
                <div>
                  <h3 className="font-semibold text-purple-800 dark:text-purple-200 text-sm sm:text-base">โหมดโฟกัส</h3>
                  <p className="text-sm text-purple-600 dark:text-purple-300">
                    แสดงเฉพาะงานสำคัญ (ความสำคัญสูง) และงานเร่งด่วน (ใกล้ครบกำหนดหรือเลยกำหนด)
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {displayTodos.length === 0 ? (
            <div className="text-center py-12 sm:py-16 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg hover:shadow-2xl hover:shadow-blue-500/10 border border-gray-100 dark:border-gray-700 transition-all duration-300 transform hover:scale-[1.01] hover:-translate-y-1">
              <div className="text-5xl sm:text-6xl lg:text-8xl mb-4 sm:mb-6 float-animation">
                {isFocusMode ? '🎯' : searchTerm ? '🔍' : selectedCategory !== 'all' ? '📂' : filter === 'all' ? '📝' : filter === 'active' ? '⏳' : '🎉'}
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg lg:text-xl mb-2 px-4">
                {isFocusMode 
                  ? 'ไม่มีงานสำคัญหรือเร่งด่วนในขณะนี้ 🎉'
                  : searchTerm 
                    ? `ไม่พบงานที่ตรงกับ "${searchTerm}"` 
                    : selectedCategory !== 'all'
                      ? selectedCategory === 'no-category'
                        ? 'ไม่มีงานที่ไม่มีหมวดหมู่'
                        : `ไม่มีงานในหมวดหมู่ "${selectedCategory}"`
                      : filter === 'all' 
                        ? 'ยังไม่มีงานในรายการ' 
                        : filter === 'active' 
                          ? 'ไม่มีงานที่รอดำเนินการ' 
                          : 'ไม่มีงานที่เสร็จแล้ว'
                }
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-sm sm:text-base px-4">
                {isFocusMode 
                  ? 'คุณจัดการงานได้ดีมาก! ลองปิดโหมดโฟกัสเพื่อดูงานทั้งหมด'
                  : searchTerm || selectedCategory !== 'all' ? 'ลองเปลี่ยนเงื่อนไขการค้นหา' : 'เพิ่มงานใหม่เพื่อเริ่มต้น'
                }
              </p>
            </div>
          ) : (
            displayTodos.map((todo, index) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                isSelected={selectedTodos.has(todo.id)}
                onToggle={toggleTodo}
                onDelete={deleteTodo}
                onEdit={editTodo}
                onSelect={toggleSelectTodo}
                getPriorityColor={getPriorityColor}
                getCategoryColor={getCategoryColor}
                getDueDateStatus={getDueDateStatus}
                index={index}
              />
            ))
          )}
        </div>

        {/* Footer */}
        {todos.length > 0 && (
          <div className="mt-12 text-center text-gray-500 dark:text-gray-400 space-y-2">
            <p className="text-sm">
              💡 เคล็ดลับ: คลิกปุ่มวงกลมเพื่อทำเครื่องหมายเสร็จ หรือ Ctrl+Click (Cmd+Click บน Mac) เพื่อเลือกหลายรายการ
            </p>
            <p className="text-xs">
              🔍 ใช้ช่องค้นหา, เลือกหมวดหมู่, กรองตามสถานะ และเรียงลำดับเพื่อจัดการงานได้อย่างมีประสิทธิภาพ
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Todo Item Component
interface TodoItemProps {
  todo: Todo;
  isSelected: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, newText: string) => void;
  onSelect: (id: string) => void;
  getPriorityColor: (priority: string) => string;
  getCategoryColor: (category?: string) => string;
  getDueDateStatus: (dueDate?: Date) => any;
  index: number;
}

function TodoItem({ todo, isSelected, onToggle, onDelete, onEdit, onSelect, getPriorityColor, getCategoryColor, getDueDateStatus, index }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);

  const handleEdit = () => {
    if (editText.trim() && editText !== todo.text) {
      onEdit(todo.id, editText.trim());
    }
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEdit();
    } else if (e.key === 'Escape') {
      setEditText(todo.text);
      setIsEditing(false);
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  return (
    <div className={`group bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-3 sm:p-4 lg:p-5 shadow-lg border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20 hover:scale-[1.02] hover:-translate-y-1 ${
      todo.completed ? 'opacity-75 hover:opacity-90' : ''
    } ${isSelected ? 'ring-2 ring-blue-500 dark:ring-blue-400 shadow-blue-500/30' : ''}`}
    style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start sm:items-center space-x-3 sm:space-x-4">
        {/* Completion Toggle (with multi-select on Ctrl/Cmd click) */}
        <button
          onClick={(e) => {
            if (e.ctrlKey || e.metaKey) {
              onSelect(todo.id);
            } else {
              onToggle(todo.id);
            }
          }}
          className={`w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 relative shrink-0 transform hover:scale-110 ${
            todo.completed
              ? 'bg-gradient-to-r from-green-500 to-green-600 border-green-500 text-white shadow-lg shadow-green-500/30'
              : isSelected
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/30'
                : 'border-gray-300 dark:border-gray-600 hover:border-green-500 dark:hover:border-green-400 hover:shadow-lg hover:shadow-green-500/20'
          }`}
          title={isSelected ? 'เลือกแล้ว (Ctrl+Click เพื่อยกเลิก)' : 'คลิกเพื่อทำเครื่องหมายเสร็จ, Ctrl+Click เพื่อเลือก'}
        >
          {todo.completed && <span className="text-xs sm:text-sm">✓</span>}
          {isSelected && !todo.completed && <span className="text-xs sm:text-sm">✓</span>}
          {isSelected && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full border-2 border-white dark:border-gray-800"></div>
          )}
        </button>

        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onBlur={handleEdit}
              onKeyDown={handleKeyPress}
              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm sm:text-base lg:text-lg"
              autoFocus
            />
          ) : (
            <div className="space-y-2 sm:space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                <span
                  className={`flex-1 cursor-pointer text-sm sm:text-base lg:text-lg ${
                    todo.completed
                      ? 'line-through text-gray-500 dark:text-gray-400'
                      : 'text-gray-800 dark:text-white'
                  }`}
                  onClick={() => setIsEditing(true)}
                >
                  {todo.text}
                </span>
                
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  {todo.category && (
                    <span className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-full border font-medium ${getCategoryColor(todo.category)}`}>
                      <span className="hidden sm:inline">📁 </span>{todo.category}
                    </span>
                  )}
                  <span className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-full border font-medium ${getPriorityColor(todo.priority)}`}>
                    {getPriorityIcon(todo.priority)} <span className="hidden sm:inline">{todo.priority === 'high' ? 'สูง' : todo.priority === 'medium' ? 'ปานกลาง' : 'ต่ำ'}</span>
                  </span>
                  {todo.dueDate && (
                    <span className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-full border font-medium ${getDueDateStatus(todo.dueDate)?.color}`}>
                      🗓️ <span className="hidden sm:inline">{getDueDateStatus(todo.dueDate)?.text}</span>
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0 text-xs text-gray-500 dark:text-gray-400">
                <span className="text-xs sm:text-sm">
                  📅 {todo.createdAt.toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {todo.dueDate && (
                    <span className={`px-2 py-1 text-xs rounded ${getDueDateStatus(todo.dueDate)?.color} font-medium`}>
                      ⏰ <span className="hidden sm:inline">ครบกำหนด: </span>{todo.dueDate.toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  )}
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-xs">
                    ID: {todo.id.slice(-6)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all duration-300 shrink-0">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-1.5 sm:p-2 text-gray-400 hover:text-blue-600 dark:text-gray-500 dark:hover:text-blue-400 transition-all duration-300 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900 transform hover:scale-110 hover:shadow-lg hover:shadow-blue-500/20"
            title="แก้ไข"
          >
            <span className="text-sm sm:text-base lg:text-lg">✏️</span>
          </button>
          <button
            onClick={() => onDelete(todo.id)}
            className="p-1.5 sm:p-2 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400 transition-all duration-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900 transform hover:scale-110 hover:shadow-lg hover:shadow-red-500/20"
            title="ลบ"
          >
            <span className="text-sm sm:text-base lg:text-lg">🗑️</span>
          </button>
        </div>
      </div>
    </div>
  );
}
