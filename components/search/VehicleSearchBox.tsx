'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, X, Clock, TrendingUp, Car, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface VehicleSearchBoxProps {
  query: string;
  suggestions: string[];
  searchHistory: string[];
  isLoading?: boolean;
  onQueryChange: (query: string) => void;
  onSearch: (query: string) => void;
  onClearHistory?: () => void;
  onShowFilters?: () => void;
  placeholder?: string;
  className?: string;
}

export default function VehicleSearchBox({
  query,
  suggestions,
  searchHistory,
  isLoading = false,
  onQueryChange,
  onSearch,
  onClearHistory,
  onShowFilters,
  placeholder,
  className
}: VehicleSearchBoxProps) {
  const { t } = useLanguage();
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const allSuggestions = [
    ...suggestions.map(s => ({ type: 'suggestion', text: s })),
    ...(query.length === 0 ? searchHistory.slice(0, 5).map(h => ({ type: 'history', text: h })) : [])
  ];

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [allSuggestions]);

  const handleInputChange = (value: string) => {
    onQueryChange(value);
    setShowSuggestions(true);
    setHighlightedIndex(-1);
  };

  const handleSuggestionClick = (suggestion: string) => {
    onQueryChange(suggestion);
    onSearch(suggestion);
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || allSuggestions.length === 0) {
      if (e.key === 'Enter') {
        onSearch(query);
        setShowSuggestions(false);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < allSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev > 0 ? prev - 1 : allSuggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleSuggestionClick(allSuggestions[highlightedIndex].text);
        } else {
          onSearch(query);
          setShowSuggestions(false);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    setShowSuggestions(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Delay hiding suggestions to allow clicks
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const clearQuery = () => {
    onQueryChange('');
    inputRef.current?.focus();
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;

    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) => (
      <span
        key={index}
        className={part.toLowerCase() === query.toLowerCase() ? 'font-semibold text-[var(--primary-orange)]' : ''}
      >
        {part}
      </span>
    ));
  };

  return (
    <div className={cn('relative w-full', className)}>
      <div className="relative">
        <div className={cn(
          'flex items-center border-2 rounded-lg transition-all duration-200',
          isFocused
            ? 'border-[var(--primary-orange)] shadow-lg'
            : 'border-gray-300 hover:border-gray-400'
        )}>
          <div className="pl-3">
            <Search className={cn(
              'h-5 w-5 transition-colors',
              isLoading ? 'animate-pulse text-[var(--primary-orange)]' : 'text-gray-400'
            )} />
          </div>

          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder || t('hero.searchPlaceholder')}
            className="border-0 focus-visible:ring-0 flex-1 text-lg"
          />

          <div className="flex items-center pr-2 gap-1">
            {query && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearQuery}
                className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </Button>
            )}

            {onShowFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onShowFilters}
                className="h-8 w-8 p-0 text-gray-400 hover:text-[var(--primary-orange)]"
              >
                <Filter className="h-4 w-4" />
              </Button>
            )}

            <Button
              onClick={() => onSearch(query)}
              className="bg-[var(--primary-orange)] hover:bg-[var(--primary-dark)] text-white px-4 ml-1"
            >
              {t('common.search')}
            </Button>
          </div>
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && allSuggestions.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-96 overflow-y-auto shadow-xl border-2 border-gray-200">
          <CardContent className="p-0">
            <div ref={suggestionsRef}>
              {allSuggestions.map((item, index) => (
                <div
                  key={`${item.type}-${item.text}-${index}`}
                  onClick={() => handleSuggestionClick(item.text)}
                  className={cn(
                    'px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors',
                    'flex items-center gap-3',
                    index === highlightedIndex
                      ? 'bg-orange-50 text-[var(--primary-orange)]'
                      : 'hover:bg-gray-50'
                  )}
                >
                  {item.type === 'history' ? (
                    <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  ) : (
                    <TrendingUp className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  )}

                  <span className="flex-1 text-left">
                    {highlightMatch(item.text, query)}
                  </span>

                  {item.type === 'history' && (
                    <Badge variant="outline" className="text-xs">
                      {t('common.recent')}
                    </Badge>
                  )}
                </div>
              ))}

              {searchHistory.length > 0 && query.length === 0 && onClearHistory && (
                <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearHistory}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    {t('common.clearHistory')}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Filters */}
      {isFocused && query.length === 0 && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-40 shadow-lg border border-gray-200">
          <CardContent className="p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Car className="h-4 w-4" />
              {t('common.popularSearches')}
            </h4>
            <div className="flex flex-wrap gap-2">
              {['BMW', 'Mercedes', 'Audi', 'SUV', 'Sedan', 'Electric'].map((term) => (
                <Badge
                  key={term}
                  variant="secondary"
                  className="cursor-pointer hover:bg-[var(--primary-orange)] hover:text-white transition-colors"
                  onClick={() => handleSuggestionClick(term)}
                >
                  {term}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}