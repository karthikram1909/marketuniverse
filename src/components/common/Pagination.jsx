import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ currentPage, totalPages, onPageChange }) {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
        if (
            i === 1 ||
            i === totalPages ||
            (i >= currentPage - 1 && i <= currentPage + 1)
        ) {
            pages.push(i);
        } else if (pages[pages.length - 1] !== '...') {
            pages.push('...');
        }
    }

    return (
        <div className="flex flex-col items-center gap-3 mt-4">
            <div className="text-gray-400 text-sm">
                Page {currentPage} of {totalPages}
            </div>
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <Button
                        size="sm"
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="bg-black/80 hover:bg-red-500/20 text-white border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed backdrop-blur-xl"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    
                    {pages.map((page, idx) => (
                        page === '...' ? (
                            <span key={`ellipsis-${idx}`} className="text-gray-400 px-2">...</span>
                        ) : (
                            <Button
                                key={page}
                                size="sm"
                                onClick={() => onPageChange(page)}
                                className={
                                    currentPage === page
                                        ? 'bg-red-500 hover:bg-red-600 text-white border-0'
                                        : 'bg-black/80 hover:bg-red-500/20 text-white border border-white/10 backdrop-blur-xl'
                                }
                            >
                                {page}
                            </Button>
                        )
                    ))}
                    
                    <Button
                        size="sm"
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="bg-black/80 hover:bg-red-500/20 text-white border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed backdrop-blur-xl"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}