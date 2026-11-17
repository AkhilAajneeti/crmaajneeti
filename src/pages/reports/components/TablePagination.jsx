import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import { useIsMobile } from 'hooks/useIsMobile';

const TablePagination = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange
}) => {
  const isMobile = useIsMobile();
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const itemsPerPageOptions = [
    { value: '10', label: '10 per page' },
    { value: '25', label: '25 per page' },
    { value: '50', label: '50 per page' },
    { value: '100', label: '100 per page' }
  ];

  const getVisiblePages = () => {
    // How many pages to show either side of the current one. Two neighbours
    // gives nine buttons at a mid-range page ("1 ... 498 499 500 501 502 ...
    // 1236"), which does not fit a phone. Zero gives three — first, current,
    // last — which does, so the row stays on one line instead of wrapping
    // Previous and Next onto their own.
    const delta = isMobile ? 0 : 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range?.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots?.push(1, '...');
    } else {
      rangeWithDots?.push(1);
    }

    rangeWithDots?.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots?.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots?.push(totalPages);
    }

    return rangeWithDots;
  };

  const handlePageClick = (page) => {
    if (page !== '...' && page !== currentPage) {
      onPageChange(page);
    }
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex w-full flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-card border-t border-border">
      {/* Items info and per page selector */}
      <div className="flex min-w-0 items-center justify-center gap-4 sm:justify-start">
        <div className="text-sm text-muted-foreground">
          Showing {startItem?.toLocaleString()} to {endItem?.toLocaleString()} of {totalItems?.toLocaleString()} results
        </div>
        <div className="hidden sm:block">
          <Select
            options={itemsPerPageOptions}
            value={itemsPerPage?.toString()}
            onChange={(value) => onItemsPerPageChange(parseInt(value))}
            className="w-32"
          />
        </div>
      </div>
      {/* Pagination controls.
          These wrap rather than overflow. With ~1200 pages the visible range
          is "1 ... 498 499 500 501 502 ... 1236" — nine buttons plus Previous
          and Next, far wider than a phone. A non-wrapping row made the whole
          PAGE horizontally scrollable, which shifted every heading above it
          left even though that content fit fine on its own. */}
      <div className="flex w-full items-center justify-center gap-1 sm:w-auto sm:justify-end">
        {/* Previous button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className="h-9 px-3"
        >
          <Icon name="ChevronLeft" size={16} className="mr-1" />
          <span className="hidden sm:inline">Previous</span>
        </Button>

        {/* Page numbers */}
        <div className="flex items-center justify-center gap-1">
          {getVisiblePages()?.map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="px-1 py-2 text-sm text-muted-foreground sm:px-3">...</span>
              ) : (
                <Button
                  variant={page === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageClick(page)}
                  className="h-9 w-9 p-0"
                >
                  {page}
                </Button>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Next button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className="h-9 px-3"
        >
          <span className="hidden sm:inline">Next</span>
          <Icon name="ChevronRight" size={16} className="ml-1" />
        </Button>
      </div>
      {/* Mobile items per page */}
      <div className="sm:hidden w-full">
        <Select
          label="Items per page"
          options={itemsPerPageOptions}
          value={itemsPerPage?.toString()}
          onChange={(value) => onItemsPerPageChange(parseInt(value))}
        />
      </div>
    </div>
  );
};

export default TablePagination;