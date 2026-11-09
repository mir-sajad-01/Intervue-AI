
import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import FeedbackPanel from '../components/FeedbackPanel';
import Loader from '../components/Loader';
import LiveFeedbackSidebar from '../components/LiveFeedbackSidebar';
import QuestionCard from '../components/QuestionCard';
import SpeechRecorder from '../components/SpeechRecorder';
import AppDialog from '../components/AppDialog';
import PageHeader from '../components/PageHeader';
import Timer from '../components/Timer';
import WebcamCapture from '../components/WebcamCapture';
import { useSpeech } from '../hooks/useSpeech';
import { useTimer } from '../hooks/useTimer';
import { useWebcam } from '../hooks/useWebcam';
import { useQuestionVoice } from '../hooks/useQuestionVoice';
import api from '../utils/api';
import { difficultySeconds } from '../utils/helpers';
import { getErrorMessage, getFieldErrors } from '../utils/errors';
import { queryKeys } from '../lib/queryClient';
import { answerSchema, getZodFieldErrors, interviewSetupSchema } from '../schemas/validation';

const Interview = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const webcam = useWebcam();
  const speech = useSpeech();
  const voice = useQuestionVoice();

  const [setup, setSetup] = useState({
    type: 'HR',
    difficulty: 'Medium',
    totalQuestions: 5,
    topic: ''
  });

  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [active, setActive] = useState(false);
  const [emotion, setEmotion] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [starting, setStarting] = useState(false);
  const [warming, setWarming] = useState(false);
  const [setupErrors, setSetupErrors] = useState({});
  const [transcriptError, setTranscriptError] = useState('');
  const [dialog, setDialog] = useState(null);
  const [pendingCompletion, setPendingCompletion] = useState(null);
  const [finishing, setFinishing] = useState(false);

  const emotionErrorShownRef = useRef(false);
  const emotionUnavailableRef = useRef(false);
  const emotionFailureCountRef = useRef(0);

  // Prevent multiple emotion requests from running at the same time
  const emotionAnalyzingRef = useRef(false);

  // Prevent duplicate session-start requests
  const startingSessionRef = useRef(false);

  const [startedAt, setStartedAt] = useState(null);

  const secondsPerQuestion = difficultySeconds[setup.difficulty];
  const current = questions[index];

  useEffect(() => {
    const parsed = answerSchema.safeParse({ transcript: speech.transcript });
    setTranscriptError(parsed.success ? '' : getZodFieldErrors(parsed.error).transcript || 'Review your answer.');
  }, [speech.transcript]);

  // ---------------------------------------------------------
  // SUBMIT ANSWER
  // ---------------------------------------------------------
  const submitAnswer = useCallback(async () => {
    if (!session || submitting) return;

    const parsedAnswer = answerSchema.safeParse({ transcript: speech.transcript });
    if (!parsedAnswer.success) {
      const answerErrors = getZodFieldErrors(parsedAnswer.error);
      setTranscriptError(answerErrors.transcript || 'Review your answer before submitting.');
      return;
    }

    setSubmitting(true);
    setTranscriptError('');
    speech.stop();

    try {
      const transcript = parsedAnswer.data.transcript;

      const { data } = await api.post(
        `/sessions/${session._id}/answer`,
        {
          questionId: questions[index]._id,
          transcript
        },
        { timeout: 65_000 }
      );

      setFeedback(data.feedback);
      speech.setTranscript('');

      // Last question
      if (index + 1 >= questions.length) {
        setActive(false);

        speech.stop();
        voice.stop();
        webcam.stop();

        const duration = Math.round(
          (Date.now() - startedAt) / 1000
        );

        setPendingCompletion({ sessionId: session._id, duration });
        setDialog('completion');
      } else {
        // Move to next question
        setIndex((value) => value + 1);
      }

    } catch (error) {
      const fieldErrors = getFieldErrors(error);
      if (fieldErrors.transcript) setTranscriptError(fieldErrors.transcript);
      if (!Object.keys(fieldErrors).length) toast.error(getErrorMessage(error, 'Could not submit your answer.'));
    } finally {
      setSubmitting(false);
    }
  }, [
    session,
    submitting,
    speech,
    questions,
    index,
    startedAt,
    navigate,
    queryClient,
    voice,
    webcam
  ]);

  // ---------------------------------------------------------
  // TIMER
  // ---------------------------------------------------------
  const timer = useTimer(
    secondsPerQuestion,
    active && session,
    submitAnswer
  );

  const elapsedQuestionSeconds = Math.max(
    0,
    secondsPerQuestion - timer.seconds
  );

  // ---------------------------------------------------------
  // RESET TIMER WHEN QUESTION CHANGES
  // ---------------------------------------------------------
  useEffect(() => {
    timer.reset();
  }, [index]);

  // ---------------------------------------------------------
  // READ QUESTION ALOUD
  // ---------------------------------------------------------
  useEffect(() => {
    if (active && current?.text) {
      voice.speak(current.text);
    }
  }, [active, current?.text, voice.speak]);

  // ---------------------------------------------------------
  // EMOTION ANALYSIS
  // ---------------------------------------------------------
  useEffect(() => {
    // IMPORTANT:
    // Don't start emotion analysis until:
    // 1. Session exists
    // 2. Webcam is ready
    // 3. Interview is actually active
    if (!session || !webcam.ready || !active) {
      return undefined;
    }

    // Reset emotion state for this session
    emotionUnavailableRef.current = false;
    emotionErrorShownRef.current = false;
    emotionFailureCountRef.current = 0;
    emotionAnalyzingRef.current = false;

    let first = true;

    const analyzeEmotion = async () => {
      // Don't make more requests after the limiter/API
      // has failed repeatedly.
      if (emotionUnavailableRef.current) {
        return;
      }

      // IMPORTANT:
      // Prevent overlapping requests.
      if (emotionAnalyzingRef.current) {
        return;
      }

      const frame = webcam.capture();

      if (!frame) {
        return;
      }

      emotionAnalyzingRef.current = true;

      try {
        if (first) {
          setWarming(true);
        }

        const { data } = await api.post(
          '/emotion/analyze',
          {
            imageBase64: frame,
            sessionId: session._id
          }
        );

        // Successful request
        emotionFailureCountRef.current = 0;

        setEmotion(data);

      } catch (error) {
        emotionFailureCountRef.current += 1;

        const status = error.response?.status;

        console.warn(
          'Emotion analysis error:',
          error.response?.data || error
        );

        // Show only one error toast
        if (!emotionErrorShownRef.current) {
          toast.error(getErrorMessage(error, 'Expression analysis is unavailable. Your interview can continue without it.'));

          emotionErrorShownRef.current = true;
        }

        // Stop trying after 3 consecutive failures
        if (
          emotionFailureCountRef.current >= 3
        ) {
          emotionUnavailableRef.current = true;

          if (status === 429) {
            console.warn(
              'Emotion analysis rate limit reached.'
            );
          }
        }

      } finally {
        first = false;

        setWarming(false);

        // Allow the next request
        emotionAnalyzingRef.current = false;
      }
    };

    // Run once immediately when interview starts
    analyzeEmotion();

    // Then run every 3 seconds
    const id = setInterval(
      analyzeEmotion,
      3000
    );

    // IMPORTANT:
    // Clear interval when:
    // - interview ends
    // - session changes
    // - webcam becomes unavailable
    // - component unmounts
    return () => {
      clearInterval(id);

      emotionAnalyzingRef.current = false;
    };

  }, [session, webcam.ready, active]);

  // ---------------------------------------------------------
  // COUNTDOWN
  // ---------------------------------------------------------
  useEffect(() => {
    if (countdown <= 0) {
      return undefined;
    }

    const id = setTimeout(() => {
      setCountdown((value) => value - 1);

      if (countdown === 1) {
        setActive(true);
      }
    }, 1000);

    return () => clearTimeout(id);

  }, [countdown]);

  // ---------------------------------------------------------
  // START INTERVIEW
  // ---------------------------------------------------------
  const start = async () => {

    // Prevent duplicate session-start requests
    if (startingSessionRef.current) {
      return;
    }

    const parsedSetup = interviewSetupSchema.safeParse(setup);
    if (!parsedSetup.success) {
      setSetupErrors(getZodFieldErrors(parsedSetup.error));
      return;
    }

    setSetupErrors({});
    startingSessionRef.current = true;
    setStarting(true);

    try {
      const { data } = await api.post(
        '/sessions/start',
        parsedSetup.data,
        { timeout: 65_000 }
      );

      if (data.questionSource === 'fallback') {
        toast('AI question generation is unavailable; using backup questions.', { icon: 'ℹ️' });
      }

      // Reset emotion-related state
      emotionErrorShownRef.current = false;
      emotionUnavailableRef.current = false;
      emotionFailureCountRef.current = 0;
      emotionAnalyzingRef.current = false;

      setEmotion(null);
      setFeedback(null);

      setSession(data.session);
      setQuestions(data.questions);
      setIndex(0);
      setStartedAt(Date.now());

      // 3-second countdown
      setCountdown(3);

      // Interview will become active after countdown
      setActive(false);

    } catch (error) {
      const fieldErrors = getFieldErrors(error);
      setSetupErrors(fieldErrors);
      if (!Object.keys(fieldErrors).length) toast.error(getErrorMessage(error, 'Could not start the interview. Please try again.'));

      // Allow another attempt if request failed
      startingSessionRef.current = false;
      setStarting(false);
    }
  };

  // ---------------------------------------------------------
  // STOP SESSION
  // ---------------------------------------------------------
  const stopSession = () => {
    if (!session || stopping || submitting || finishing) {
      return;
    }
    setDialog('stop');
  };

  const confirmStopSession = async () => {
    if (!session || stopping || submitting || finishing) return;
    setDialog(null);

    setStopping(true);
    setActive(false);

    try {
      const duration = startedAt
        ? Math.round(
            (Date.now() - startedAt) / 1000
          )
        : 0;

      const { data } = await api.post(
        `/sessions/${session._id}/end`,
        { duration }
      );

      speech.stop();
      voice.stop();
      webcam.stop();

      await Promise.allSettled([
        queryClient.invalidateQueries({ queryKey: queryKeys.sessions }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
        queryClient.invalidateQueries({ queryKey: queryKeys.profile })
      ]);

      toast.success('Session stopped');

      navigate(
        `/sessions/${data.session._id}`
      );

    } catch (error) {

      toast.error(getErrorMessage(error, 'Could not stop the interview. Please try again.'));

      setStopping(false);
      setActive(true);
    }
  };

  const saveCompletedSession = async () => {
    if (!pendingCompletion || finishing) return;
    setDialog(null);
    setFinishing(true);
    try {
      const { data } = await api.post(`/sessions/${pendingCompletion.sessionId}/end`, { duration: pendingCompletion.duration });
      await Promise.allSettled([
        queryClient.invalidateQueries({ queryKey: queryKeys.sessions }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
        queryClient.invalidateQueries({ queryKey: queryKeys.profile })
      ]);
      toast.success('Session saved');
      navigate(`/sessions/${data.session._id}`);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not save this interview. Please try again.'));
      setDialog('completion');
    } finally {
      setFinishing(false);
    }
  };

  const discardCompletedSession = async () => {
    if (!pendingCompletion || finishing) return;
    setDialog(null);
    setFinishing(true);
    try {
      await api.delete(`/sessions/${pendingCompletion.sessionId}`);
      toast.success('Session discarded');
      navigate('/dashboard');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not discard this interview. Please try again.'));
      setDialog('completion');
    } finally {
      setFinishing(false);
    }
  };

  // ---------------------------------------------------------
  // SETUP SCREEN
  // ---------------------------------------------------------
  if (!session) {
    const estimatedMinutes = Math.max(1, Math.round(((Number(setup.totalQuestions) || 1) * secondsPerQuestion) / 60));

    return (
      <main className="page-shell mx-auto max-w-6xl px-4 sm:px-6">
        <PageHeader eyebrow="Practice session" title="Build your interview" description="Choose a format that matches the role you’re preparing for. You can speak your answers or type them as you go." />
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(17rem,0.75fr)]">
          <section className="panel p-5 sm:p-7">
            <div className="mb-6 border-b border-slate-200 pb-5 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Session details</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Set your focus and difficulty before you begin.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Interview type
                <select className="input mt-1.5" value={setup.type} aria-invalid={Boolean(setupErrors.type)} aria-describedby={setupErrors.type ? 'interview-type-error' : undefined} onChange={(event) => {
                  setSetup((current) => ({ ...current, type: event.target.value }));
                  setSetupErrors((current) => ({ ...current, type: undefined, topic: undefined }));
                }}>
                  {['HR', 'Technical', 'Behavioural', 'Mixed', 'Custom'].map((value) => <option key={value}>{value}</option>)}
                </select>
                {setupErrors.type ? <span id="interview-type-error" role="alert" className="mt-1.5 block text-xs font-normal text-rose-600 dark:text-rose-400">{setupErrors.type}</span> : null}
              </label>

              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Difficulty
                <select className="input mt-1.5" value={setup.difficulty} aria-invalid={Boolean(setupErrors.difficulty)} aria-describedby={setupErrors.difficulty ? 'difficulty-error' : undefined} onChange={(event) => {
                  setSetup((current) => ({ ...current, difficulty: event.target.value }));
                  setSetupErrors((current) => ({ ...current, difficulty: undefined }));
                }}>
                  {['Easy', 'Medium', 'Hard'].map((value) => <option key={value}>{value}</option>)}
                </select>
                {setupErrors.difficulty ? <span id="difficulty-error" role="alert" className="mt-1.5 block text-xs font-normal text-rose-600 dark:text-rose-400">{setupErrors.difficulty}</span> : null}
              </label>

              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 sm:col-span-2">
                Number of questions
                <input className="input mt-1.5 max-w-40" type="number" step="1" value={setup.totalQuestions} aria-invalid={Boolean(setupErrors.totalQuestions)} aria-describedby={setupErrors.totalQuestions ? 'question-count-error' : 'question-count-hint'} onChange={(event) => {
                  setSetup((current) => ({ ...current, totalQuestions: event.target.value }));
                  setSetupErrors((current) => ({ ...current, totalQuestions: undefined }));
                }} />
                {setupErrors.totalQuestions ? <span id="question-count-error" role="alert" className="mt-1.5 block text-xs font-normal text-rose-600 dark:text-rose-400">{setupErrors.totalQuestions}</span> : <span id="question-count-hint" className="mt-1.5 block text-xs font-normal text-slate-500 dark:text-slate-400">Choose between 1 and 30 questions.</span>}
              </label>

              {setup.type === 'Custom' ? (
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 sm:col-span-2" htmlFor="interview-topic">
                  Interview focus
                  <input className="input mt-1.5" id="interview-topic" type="text" value={setup.topic} aria-invalid={Boolean(setupErrors.topic)} aria-describedby={setupErrors.topic ? 'interview-topic-error' : 'interview-topic-hint'} onChange={(event) => {
                    setSetup((current) => ({ ...current, topic: event.target.value }));
                    setSetupErrors((current) => ({ ...current, topic: undefined }));
                  }} placeholder="For example, product design or frontend engineering" />
                  {setupErrors.topic ? <span id="interview-topic-error" role="alert" className="mt-1.5 block text-xs font-normal text-rose-600 dark:text-rose-400">{setupErrors.topic}</span> : <span id="interview-topic-hint" className="mt-1.5 block text-xs font-normal text-slate-500 dark:text-slate-400">Describe the role or topic in 2–120 characters.</span>}
                </label>
              ) : null}
            </div>

            <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 text-sm dark:border-slate-700">
              <input type="checkbox" checked={voice.enabled} onChange={(event) => voice.setEnabled(event.target.checked)} className="mt-0.5 h-4 w-4 accent-emerald-700" />
              <span><span className="block font-semibold text-slate-800 dark:text-slate-100">Read questions aloud</span><span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">Use your browser’s voice to hear each question. You can repeat any question during the session.</span>
                {!voice.supported ? <span className="mt-1 block text-xs text-amber-700 dark:text-amber-300">Voice playback is not supported in this browser.</span> : null}
              </span>
            </label>

            <button className="btn-primary mt-6 w-full sm:w-auto" type="button" disabled={starting} onClick={start}>
              {starting ? <Loader label="Preparing your session…" /> : 'Start interview'}
            </button>
          </section>

          <aside className="panel overflow-hidden p-5 sm:p-6">
            <div className="rounded-xl bg-slate-950 p-5 text-white dark:bg-slate-900">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">Your session</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight">{setup.totalQuestions || 0} questions</p>
              <p className="mt-1 text-sm text-slate-300">About {estimatedMinutes} minutes at this pace</p>
            </div>
            <h2 className="mt-6 font-semibold text-slate-950 dark:text-white">What to expect</h2>
            <ol className="mt-4 space-y-4">
              {[
                ['Answer one question at a time', 'A timer keeps each response focused.'],
                ['Edit the transcript as you speak', 'Speech recognition is optional; typing always works.'],
                ['Review your feedback', 'Save the session to keep your scores and coaching notes.']
              ].map(([title, description], index) => (
                <li className="flex gap-3" key={title}>
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-300">{index + 1}</span>
                  <span><span className="block text-sm font-medium text-slate-800 dark:text-slate-100">{title}</span><span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">{description}</span></span>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      </main>
    );
  }

  // ---------------------------------------------------------
  // INTERVIEW SCREEN
  // ---------------------------------------------------------
  return (
    <main className="page-shell mx-auto max-w-7xl px-4 sm:px-6">
      <section className="panel mb-5 flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <p className="section-kicker">Live practice</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            <h1 className="text-lg font-semibold text-slate-950 dark:text-white">{setup.type} interview</h1>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span className="text-sm text-slate-500 dark:text-slate-400">Question {index + 1} of {questions.length}</span>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${active ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>{active ? 'In progress' : countdown > 0 ? 'Starting' : 'Paused'}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <Timer seconds={timer.seconds} />
          <button className="btn-secondary" type="button" disabled={stopping || submitting || finishing} onClick={stopSession}>{stopping ? 'Stopping…' : 'End interview'}</button>
          <button className="btn-primary" type="button" disabled={submitting || stopping || !active || finishing} onClick={submitAnswer}>
            {submitting ? <Loader label="Saving answer…" /> : 'Submit answer'}
          </button>
        </div>
      </section>

      {countdown > 0 ? <div className="panel mb-5 flex items-center justify-between gap-4 border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-300/20 dark:bg-emerald-400/5"><div><p className="font-semibold text-emerald-950 dark:text-emerald-200">Get ready</p><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Your first question starts in a moment.</p></div><span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white text-3xl font-bold tabular-nums text-emerald-800 shadow-sm dark:bg-slate-900 dark:text-emerald-300">{countdown}</span></div> : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(19rem,0.75fr)]">
        <div className="space-y-4">
          <QuestionCard
            question={current}
            index={index}
            total={questions.length}
          />
          <div className="flex flex-wrap items-center justify-between gap-3 px-1">
            <p className="text-sm text-slate-500 dark:text-slate-400">Take a moment to organize your thoughts before you answer.</p>
            <button className="btn-secondary min-h-9 px-3 py-1.5 text-xs" type="button" onClick={() => voice.speak(current?.text)} disabled={!voice.supported}>Repeat question</button>
          </div>
          <SpeechRecorder speech={speech} validationError={transcriptError} />
          <FeedbackPanel feedback={feedback} />
        </div>
        <aside className="space-y-4">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_10rem] lg:grid-cols-1 xl:grid-cols-[minmax(0,1fr)_10rem]">
            <WebcamCapture webcam={webcam} />
            <LiveFeedbackSidebar
              emotion={emotion}
              transcript={speech.transcript}
              elapsedSeconds={elapsedQuestionSeconds}
              warming={warming}
            />
          </div>
          <div className="rounded-xl border border-slate-200 bg-white/70 p-4 text-sm leading-6 text-slate-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
            Your webcam is used for optional expression feedback. You can continue the interview if camera access is unavailable.
          </div>
        </aside>
      </div>

      <AppDialog
        open={dialog === 'completion'}
        title="Save this interview?"
        description="Your answers are ready. Save the session to keep the scores and coaching feedback in your history, or discard it permanently."
        onClose={() => setDialog(null)}
        busy={finishing}
        actions={[
          { label: 'Discard session', variant: 'danger', loadingLabel: 'Discarding…', onSelect: discardCompletedSession },
          { label: 'Save session', variant: 'primary', loadingLabel: 'Saving…', onSelect: saveCompletedSession }
        ]}
      />
      <AppDialog
        open={dialog === 'stop'}
        title="Stop this interview?"
        description="Your completed answers will be saved. You can review the results in your session history."
        onClose={() => setDialog(null)}
        busy={stopping}
        actions={[
          { label: 'Continue interview', variant: 'secondary', onSelect: () => setDialog(null) },
          { label: 'Stop and save', variant: 'primary', loadingLabel: 'Saving…', onSelect: confirmStopSession }
        ]}
      />
    </main>
  );
};

export default Interview;
