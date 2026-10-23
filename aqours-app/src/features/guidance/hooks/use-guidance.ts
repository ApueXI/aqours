import type { Guidance } from '@aqours/contracts';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useSession } from '@/features/auth/hooks/session';
import { errorText } from '@/services/http-client';

export type GuidanceAnswers = {
  needsWater?: boolean; hazard?: boolean; persistent?: boolean;
  nearbyAffected?: 'yes' | 'no' | 'unknown'; waterNeededBy?: string;
};

export function useGuidance(reportId: string) {
  const { api } = useSession();
  const [guidance, setGuidance] = useState<Guidance | null>(null);
  const [questions, setQuestions] = useState<Guidance['questions']>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const saved = useRef<Guidance | null>(null);
  const answers = useRef<GuidanceAnswers>({});
  const sequence = useRef(0);
  const evaluating = useRef(0);
  const evaluate = useCallback(async (next?: GuidanceAnswers) => {
    const run = ++sequence.current;
    evaluating.current = run;
    if (next) answers.current = next;
    setGuidance(null); saved.current = null; setError(null); setLoading(true);
    try {
      const response = await api<Guidance>(`/reports/${reportId}/guidance`, { method: 'POST', body: { answers: answers.current } });
      if (run === sequence.current) { saved.current = response.data; setGuidance(response.data); setQuestions(response.data.questions); return response.data; }
    } catch (failure) { if (run === sequence.current) setError(errorText(failure)); }
    finally { if (evaluating.current === run) { evaluating.current = 0; setLoading(false); } }
  }, [api, reportId]);

  useFocusEffect(useCallback(() => {
    void evaluate();
    async function check() {
      // A timer must never supersede the answer submission whose receipt the screen awaits.
      if (AppState.currentState !== 'active' || evaluating.current) return;
      if (!saved.current) { await evaluate(); return; }
      const run = ++sequence.current;
      const id = saved.current.id;
      setGuidance(null); setLoading(true); setError(null);
      try {
        const response = await api<Guidance>(`/guidance/${id}`);
        if (run === sequence.current) { saved.current = response.data; setGuidance(response.data); }
      } catch (failure) { if (run === sequence.current) setError(`Current guidance could not be verified. ${errorText(failure)}`); }
      finally { if (run === sequence.current) setLoading(false); }
    }
    const timer = setInterval(() => void check(), 30000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') { sequence.current += 1; setGuidance(null); }
      else void check();
    });
    return () => { sequence.current += 1; clearInterval(timer); subscription.remove(); };
  }, [api, evaluate]));

  return { guidance, questions, loading, error, evaluate };
}
