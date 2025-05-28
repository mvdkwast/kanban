import { ref, readonly } from 'vue';

// Initialize current path from hash
const getInitialPath = () => {
  const hash = window.location.hash;
  return hash.startsWith('#/') ? hash.slice(2) : 'kanban-board';
};

const currentPath = ref(getInitialPath());

const navigate = (path: string) => {
  window.location.hash = `#/${path}`;
};

const handleHashChange = () => {
  const hash = window.location.hash;
  const path = hash.startsWith('#/') ? hash.slice(2) : 'kanban-board';
  currentPath.value = path;
};

// Set up hash change listener
window.addEventListener('hashchange', handleHashChange);

export const useRouter = () => {
  return {
    currentPath: readonly(currentPath),
    navigate,
  };
};
