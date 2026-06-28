import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/shared/ui/button";
import "./pagination.css";

type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export function Pagination({ onPageChange, page, totalPages }: PaginationProps) {
  return (
    <nav className="pagination" aria-label="Пагинация">
      <span className="pagination__label">
        Страница {page} из {totalPages}
      </span>
      <div className="pagination__actions">
        <Button
          aria-label="Предыдущая страница"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          size="icon"
          variant="outline"
        >
          <ChevronLeft size={16} />
        </Button>
        <Button
          aria-label="Следующая страница"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          size="icon"
          variant="outline"
        >
          <ChevronRight size={16} />
        </Button>
      </div>
    </nav>
  );
}
