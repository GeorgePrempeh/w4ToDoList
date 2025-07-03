// Global variables
let tasks = JSON.parse(localStorage.getItem('todoTasks')) || [];
let currentFilter = 'all';
let editingTaskId = null;

// DOM elements
const taskInput = document.getElementById('taskInput');
const taskList = document.getElementById('taskList');
const addBtn = document.getElementById('addBtn');
const emptyState = document.getElementById('emptyState');
const totalTasksSpan = document.getElementById('totalTasks');
const completedTasksSpan = document.getElementById('completedTasks');
const pendingTasksSpan = document.getElementById('pendingTasks');

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    renderTasks();
    updateStats();
    
    // Add event listener for Enter key on input
    taskInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addTask();
        }
    });
    
    // Auto-focus on input
    taskInput.focus();
});

// Task class
class Task {
    constructor(text) {
        this.id = Date.now() + Math.random(); // Simple unique ID
        this.text = text.trim();
        this.completed = false;
        this.createdAt = new Date();
    }
}

// Add new task
function addTask() {
    const text = taskInput.value.trim();
    
    if (text === '') {
        showError('Please enter a task!');
        return;
    }
    
    if (text.length > 100) {
        showError('Task is too long! Maximum 100 characters.');
        return;
    }
    
    const newTask = new Task(text);
    tasks.unshift(newTask); // Add to beginning of array
    
    taskInput.value = '';
    saveToLocalStorage();
    renderTasks();
    updateStats();
    
    // Show success animation
    showSuccess('Task added successfully!');
}

// Delete task
function deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        tasks = tasks.filter(task => task.id !== taskId);
        saveToLocalStorage();
        renderTasks();
        updateStats();
        showSuccess('Task deleted successfully!');
    }
}

// Toggle task completion
function toggleTask(taskId) {
    const task = tasks.find(task => task.id === taskId);
    if (task) {
        task.completed = !task.completed;
        saveToLocalStorage();
        renderTasks();
        updateStats();
    }
}

// Start editing task
function editTask(taskId) {
    editingTaskId = taskId;
    renderTasks();
}

// Save edited task
function saveEdit(taskId, newText) {
    const text = newText.trim();
    
    if (text === '') {
        showError('Task cannot be empty!');
        return;
    }
    
    if (text.length > 100) {
        showError('Task is too long! Maximum 100 characters.');
        return;
    }
    
    const task = tasks.find(task => task.id === taskId);
    if (task) {
        task.text = text;
        editingTaskId = null;
        saveToLocalStorage();
        renderTasks();
        showSuccess('Task updated successfully!');
    }
}

// Cancel editing
function cancelEdit() {
    editingTaskId = null;
    renderTasks();
}

// Filter tasks
function filterTasks(filter) {
    currentFilter = filter;
    
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    renderTasks();
}

// Clear completed tasks
function clearCompleted() {
    const completedCount = tasks.filter(task => task.completed).length;
    
    if (completedCount === 0) {
        showError('No completed tasks to clear!');
        return;
    }
    
    if (confirm(`Are you sure you want to delete ${completedCount} completed task(s)?`)) {
        tasks = tasks.filter(task => !task.completed);
        saveToLocalStorage();
        renderTasks();
        updateStats();
        showSuccess(`${completedCount} completed task(s) cleared!`);
    }
}

// Render tasks
function renderTasks() {
    // Filter tasks based on current filter
    let filteredTasks = tasks;
    
    switch (currentFilter) {
        case 'pending':
            filteredTasks = tasks.filter(task => !task.completed);
            break;
        case 'completed':
            filteredTasks = tasks.filter(task => task.completed);
            break;
        default:
            filteredTasks = tasks;
    }
    
    // Clear task list
    taskList.innerHTML = '';
    
    // Show empty state if no tasks
    if (filteredTasks.length === 0) {
        emptyState.classList.add('show');
        taskList.classList.add('hidden');
        return;
    } else {
        emptyState.classList.remove('show');
        taskList.classList.remove('hidden');
    }
    
    // Render each task
    filteredTasks.forEach(task => {
        const taskElement = createTaskElement(task);
        taskList.appendChild(taskElement);
    });
}

// Create task element
function createTaskElement(task) {
    const li = document.createElement('li');
    li.className = `task-item ${task.completed ? 'completed' : ''}`;
    li.dataset.taskId = task.id;
    li.setAttribute('role', 'listitem');
    
    if (editingTaskId === task.id) {
        // Editing mode
        li.innerHTML = `
            <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="toggleTask(${task.id})" role="checkbox" aria-checked="${task.completed}" aria-label="Mark task as ${task.completed ? 'incomplete' : 'complete'}"></div>
            <input type="text" class="edit-input" value="${task.text}" maxlength="100" onkeypress="handleEditKeypress(event, ${task.id})" onblur="cancelEdit()" autofocus aria-label="Edit task">
            <div class="task-actions">
                <button class="edit-btn" onclick="saveEdit(${task.id}, this.previousElementSibling.value)" title="Save changes" aria-label="Save changes">
                    <i class="fas fa-check"></i>
                </button>
                <button class="delete-btn" onclick="cancelEdit()" title="Cancel editing" aria-label="Cancel editing">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    } else {
        // Normal mode
        li.innerHTML = `
            <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="toggleTask(${task.id})" role="checkbox" aria-checked="${task.completed}" aria-label="Mark task as ${task.completed ? 'incomplete' : 'complete'}"></div>
            <span class="task-text" aria-label="Task: ${escapeHtml(task.text)}">${escapeHtml(task.text)}</span>
            <div class="task-actions">
                <button class="edit-btn" onclick="editTask(${task.id})" title="Edit task" aria-label="Edit task">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-btn" onclick="deleteTask(${task.id})" title="Delete task" aria-label="Delete task">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    }
    
    return li;
}

// Handle keypress in edit mode
function handleEditKeypress(event, taskId) {
    if (event.key === 'Enter') {
        saveEdit(taskId, event.target.value);
    } else if (event.key === 'Escape') {
        cancelEdit();
    }
}

// Update statistics
function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const pending = total - completed;
    
    totalTasksSpan.textContent = total;
    completedTasksSpan.textContent = completed;
    pendingTasksSpan.textContent = pending;
    
    // Update page title with task count
    document.title = `To-Do List App (${pending} pending)`;
}

// Save to localStorage
function saveToLocalStorage() {
    localStorage.setItem('todoTasks', JSON.stringify(tasks));
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showError(message) {
    showNotification(message, 'error');
}

function showSuccess(message) {
    showNotification(message, 'success');
}

function showNotification(message, type) {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Announce to screen readers
    const announcements = document.getElementById('announcements');
    if (announcements) {
        announcements.textContent = message;
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Style notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 10px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        animation: slideInRight 0.3s ease;
        max-width: 300px;
        word-wrap: break-word;
        ${type === 'error' ? 'background: #dc3545;' : 'background: #28a745;'}
    `;
    
    // Add slide-in animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                opacity: 0;
                transform: translateX(100%);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
    `;
    document.head.appendChild(style);
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideInRight 0.3s ease reverse';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, 3000);
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + Enter to add task
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        addTask();
    }
    
    // Escape to cancel editing
    if (e.key === 'Escape' && editingTaskId) {
        cancelEdit();
    }
});

// Export/Import functions (bonus features)
function exportTasks() {
    if (tasks.length === 0) {
        showError('No tasks to export!');
        return;
    }
    
    const dataStr = JSON.stringify(tasks, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `todo-tasks-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    showSuccess('Tasks exported successfully!');
}

function importTasks(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedTasks = JSON.parse(e.target.result);
            
            if (!Array.isArray(importedTasks)) {
                throw new Error('Invalid file format');
            }
            
            // Validate task structure
            const validTasks = importedTasks.filter(task => 
                task.hasOwnProperty('id') && 
                task.hasOwnProperty('text') && 
                task.hasOwnProperty('completed')
            );
            
            if (validTasks.length === 0) {
                throw new Error('No valid tasks found in file');
            }
            
            if (confirm(`Import ${validTasks.length} task(s)? This will replace your current tasks.`)) {
                tasks = validTasks;
                saveToLocalStorage();
                renderTasks();
                updateStats();
                showSuccess(`${validTasks.length} task(s) imported successfully!`);
            }
        } catch (error) {
            showError('Error importing tasks: Invalid file format');
        }
    };
    
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
}
