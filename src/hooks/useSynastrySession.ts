import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { createSynastrySession } from '@/lib/sessionAccess';
import {
  useSynastry,
  SynastryPersonData,
  isBirthDateComplete,
  isBirthTimeComplete,
} from '@/context/SynastryContext';

// Converte birthDate parziale (nullable subfields) in oggetto completo o null.
// Il DB schema accetta JSONB; mandiamo null se la data e' incompleta cosi non
// rischiamo di salvare "{day: 5, month: null, year: null}" in produzione.
const sanitizeBirthDate = (d: SynastryPersonData['birthDate']) =>
  isBirthDateComplete(d) ? { day: d.day, month: d.month, year: d.year } : null;

const sanitizeBirthTime = (t: SynastryPersonData['birthTime']) =>
  isBirthTimeComplete(t) ? { hour: t.hour, minute: t.minute } : null;

const personInsertPayload = (prefix: 'a' | 'b', p: SynastryPersonData) => ({
  [`person_${prefix}_name`]: p.name || null,
  [`person_${prefix}_birth_date`]: sanitizeBirthDate(p.birthDate),
  [`person_${prefix}_birth_time`]: p.timeKnown ? sanitizeBirthTime(p.birthTime) : null,
  [`person_${prefix}_time_known`]: p.timeKnown,
  [`person_${prefix}_birth_place`]: p.birthPlace || null,
  [`person_${prefix}_birth_lat`]: p.birthLat,
  [`person_${prefix}_birth_lng`]: p.birthLng,
  [`person_${prefix}_birth_timezone`]: p.birthTimezone,
  [`person_${prefix}_birth_timezone_iana`]: p.birthTimezoneIana,
});

export function useSynastrySession() {
  const { data, updateData } = useSynastry();

  const createSession = useCallback(async (): Promise<string | null> => {
    const insertPayload: Record<string, unknown> = {
      funnel_slug: 'coppia',
      processing_status: 'pending',
      client_name: data.clientName || null,
      focus_relational: data.focusRelational || null,
      relationship_duration: data.relationshipDuration ?? null,
      ...personInsertPayload('a', data.personA),
      ...personInsertPayload('b', data.personB),
    };

    const id = await createSynastrySession(insertPayload);

    if (!id) {
      return null;
    }

    updateData({ sessionId: id });
    return id;
  }, [data, updateData]);

  const triggerInsights = useCallback(async (sessionId: string) => {
    return supabase.functions.invoke('process-synastry-insights', {
      body: { synastrySessionId: sessionId },
    });
  }, []);

  return { createSession, triggerInsights };
}
