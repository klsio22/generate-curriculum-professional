import * as React from 'react';
import { Plus, Trash2, FileText, Copy } from 'lucide-react';
import type { SavedCV } from '../types';

interface SidebarProps {
  cvs: SavedCV[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDuplicate: (id: string) => void;
  onRequestDelete: (id: string) => void;
  onRequestClear: () => void;
  isOpen: boolean;
  toggleSidebar: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  cvs,
  activeId,
  onSelect,
  onCreate,
  onDuplicate,
  onRequestDelete,
  onRequestClear,
  isOpen,
  toggleSidebar,
}) => {
  const asideRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (!isOpen) return;
      const target = e.target as Node | null;
      if (asideRef.current && target && !asideRef.current.contains(target)) {
        toggleSidebar();
      }
    }

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen, toggleSidebar]);

  // Deletion/clear requests are forwarded to the parent (App) via callbacks
  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <button
          type="button"
          aria-label="Fechar sidebar"
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Handle button visible when sidebar is closed */}
      {!isOpen && (
        <button
          onClick={toggleSidebar}
          aria-label="Abrir sidebar"
          className="fixed left-0 top-28 lg:top-6 z-40 bg-gray-900 text-white p-2 rounded-r-md shadow-md"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 512 512" className="fill-current">
            <path d="M64,384H448V341.33H64Zm0-106.67H448V234.67H64ZM64,128v42.67H448V128Z" />
          </svg>
        </button>
      )}

      <aside
        ref={asideRef}
        className={`fixed inset-y-0 left-0 bg-gray-900 text-white w-72 transform transition-transform duration-200 ease-in-out z-30 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Meus Currículos</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSidebar}
                aria-label="Fechar sidebar"
                className="p-2 rounded hover:bg-gray-800"
                title="Fechar"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 512 512"
                  className="fill-current"
                >
                  <polygon points="400 145.49 366.51 112 256 222.51 145.49 112 112 145.49 222.51 256 112 366.51 145.49 400 256 289.49 366.51 400 400 366.51 289.49 256 400 145.49" />
                </svg>
              </button>
            </div>
          </div>

          <button
            onClick={onCreate}
            className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded transition-colors mb-4"
          >
            <Plus size={20} />
            Novo Currículo
          </button>

          <button
            onClick={() => onRequestClear()}
            className="flex items-center justify-center gap-2 w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 
            rounded transition-colors mb-4"
          >
            Limpar dados
          </button>

          <div className="flex-1 overflow-y-auto space-y-2">
            {cvs.map((cv) => (
              <button
                type="button"
                key={cv.id}
                onClick={() => onSelect(cv.id)}
                className={`group flex w-full items-start justify-between gap-3 p-3 rounded text-left transition-colors ${
                  activeId === cv.id
                    ? 'bg-gray-800 border-l-4 border-indigo-500'
                    : 'hover:bg-gray-800 border-l-4 border-transparent'
                }`}
              >
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <FileText
                    size={18}
                    className={
                      `${activeId === cv.id ? 'text-indigo-400' : 'text-gray-400'} mt-0.5 shrink-0`
                    }
                  />
                  <div className="min-w-0 flex-1 flex flex-col">
                    <span className="mr-2 font-medium text-sm leading-snug wrap-break-word whitespace-normal">
                      {cv.title}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(cv.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1 self-start sm:self-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicate(cv.id);
                    }}
                    className="text-gray-500 hover:text-indigo-400 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity p-1"
                    title="Duplicar"
                  >
                    <Copy size={16} />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRequestDelete(cv.id);
                    }}
                    className="text-gray-500 hover:text-red-500 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity p-1"
                    title="Excluir"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </button>
            ))}
          </div>

          {/* Modals are rendered at app level to avoid stacking-context issues */}

          <div className="mt-auto pt-4 border-t border-gray-800 text-xs text-center text-gray-500">
            {cvs.length} currículo(s) salvo(s)
          </div>
        </div>
      </aside>
    </>
  );
};
