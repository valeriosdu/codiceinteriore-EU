import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MARKET } from '@/markets';

interface PlaceResult {
  name: string;
  lat: number;
  lng: number;
  /** Approximated lng/15 offset, kept for backward compat with edge functions still reading numeric. */
  timezone: number;
  /** IANA timezone identifier (es. "Europe/Rome"), DST-aware. Preferred by edge functions when present. */
  timezoneIana: string;
}

interface PlaceAutocompleteProps {
  value: string;
  onChange: (place: PlaceResult) => void;
  onTextChange: (text: string) => void;
  /** Called whenever the typed text diverges from the last confirmed selection. */
  onClear?: () => void;
  placeholder?: string;
}

interface GeoSuggestion {
  name: string;
  country: string;
  state: string | null;
  district: string | null;
  lat: number;
  lng: number;
  timezone: string;
  population: number;
}

interface GeoSearchResponse {
  results: GeoSuggestion[];
  count: number;
}

export interface PlaceAutocompleteHandle {
  /** Resolve the current text to coordinates. Returns the resolved short name, or null. */
  resolve: () => Promise<string | null>;
}

const buildShortName = (s: GeoSuggestion) => {
  if (s.state && s.state.toLowerCase() !== s.name.toLowerCase()) {
    return `${s.name}, ${s.state}`;
  }
  return s.name;
};

const buildDisplayName = (s: GeoSuggestion) => {
  const parts = [s.name];
  if (s.district) parts.push(s.district);
  if (s.state) parts.push(s.state);
  parts.push(s.country);
  return parts.join(', ');
};

const suggestionKey = (s: GeoSuggestion) => `${s.name}-${s.lat}-${s.lng}`;

const PlaceAutocomplete = forwardRef<PlaceAutocompleteHandle, PlaceAutocompleteProps>(
  ({ value, onChange, onTextChange, onClear, placeholder }, ref) => {
    const [suggestions, setSuggestions] = useState<GeoSuggestion[]>([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const resolvedTextRef = useRef<string>('');

    const fetchSuggestionsRaw = useCallback(async (query: string): Promise<GeoSuggestion[]> => {
      const q = query.trim();
      if (q.length < 2) return [];
      const { data, error } = await supabase.functions.invoke<GeoSearchResponse>('city-search', {
        body: { q, limit: 8, lang: MARKET.language, country: MARKET.countryCode },
      });
      if (error || !data) return [];
      return data.results ?? [];
    }, []);

    const fetchSuggestions = useCallback(async (query: string) => {
      if (query.trim().length < 2) {
        setSuggestions([]);
        return;
      }
      setLoading(true);
      try {
        const data = await fetchSuggestionsRaw(query);
        setSuggestions(data);
        setOpen(data.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, [fetchSuggestionsRaw]);

    const selectSuggestion = useCallback((suggestion: GeoSuggestion) => {
      const shortName = buildShortName(suggestion);
      const lat = suggestion.lat;
      const lng = suggestion.lng;
      const timezone = Math.round(lng / 15);
      const timezoneIana = suggestion.timezone;

      onTextChange(shortName);
      resolvedTextRef.current = shortName;
      setSuggestions([]);
      setOpen(false);
      onChange({ name: shortName, lat, lng, timezone, timezoneIana });
    }, [onChange, onTextChange]);

    const handleChange = (val: string) => {
      onTextChange(val);
      if (val.trim() !== resolvedTextRef.current.trim()) {
        if (resolvedTextRef.current !== '') {
          resolvedTextRef.current = '';
          onClear?.();
        } else {
          onClear?.();
        }
        setSuggestions([]);
        setOpen(false);
      }
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => fetchSuggestions(val), 300);
    };

    const handleSelect = (suggestion: GeoSuggestion) => {
      selectSuggestion(suggestion);
    };

    const resolve = useCallback(async (): Promise<string | null> => {
      const current = value.trim();
      if (current.length < 2) return null;
      if (resolvedTextRef.current === current) return resolvedTextRef.current;

      setLoading(true);
      try {
        const data = await fetchSuggestionsRaw(current);
        if (data.length > 0) {
          selectSuggestion(data[0]);
          return buildShortName(data[0]);
        }
        return null;
      } catch {
        return null;
      } finally {
        setLoading(false);
      }
    }, [value, selectSuggestion, fetchSuggestionsRaw]);

    useImperativeHandle(ref, () => ({ resolve }), [resolve]);

    const handleBlur = () => {
      setTimeout(() => {
        if (!wrapperRef.current) return;
        if (wrapperRef.current.contains(document.activeElement)) return;
        const current = value.trim();
        if (current.length >= 2 && resolvedTextRef.current !== current) {
          void resolve();
        }
      }, 150);
    };

    useEffect(() => {
      const handler = (e: MouseEvent) => {
        if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
          setOpen(false);
        }
      };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
      <div ref={wrapperRef} className="relative">
        <input
          type="text"
          className="h-12 w-full rounded-lg border border-input bg-background px-4 text-foreground text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:outline-none"
          placeholder={placeholder}
          value={value}
          onChange={e => handleChange(e.target.value)}
          onFocus={() => { if (suggestions.length > 0) setOpen(true); }}
          onBlur={handleBlur}
          autoComplete="off"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        )}
        {open && suggestions.length > 0 && (
          <ul className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-card shadow-lg overflow-hidden">
            {suggestions.map((s) => (
              <li
                key={suggestionKey(s)}
                className="px-4 py-3 text-sm text-foreground cursor-pointer hover:bg-accent/50 transition-colors border-b border-border last:border-b-0"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(s)}
              >
                {buildDisplayName(s)}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }
);

PlaceAutocomplete.displayName = 'PlaceAutocomplete';

export default PlaceAutocomplete;
