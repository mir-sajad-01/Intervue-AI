import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import FeedbackPanel from '../components/FeedbackPanel';
import Loader from '../components/Loader';
import LiveFeedbackSidebar from '../components/LiveFeedbackSidebar';
import QuestionCard from '../components/QuestionCard';
import SpeechRecorder from '../components/SpeechRecorder';
import Timer from '../components/Timer';
import WebcamCapture from '../components/WebcamCapture';
import { useSpeech } from '../hooks/useSpeech';
import { useTimer } from '../hooks/useTimer';
import { useWebcam } from '../hooks/useWebcam';
import { useQuestionVoice } from '../hooks/useQuestionVoice';
import api from '../utils/api';
import { difficultySeconds } from '../utils/helpers';

const Interview = () => {
  const navigate = useNavigate();
  const webcam = useWebcam();
  const speech = useSpeech();
  const voice = useQuestionVoice();
  const [setup, setSetup] = useState({ type: 'HR', difficulty: 'Medium', totalQuestions: 5, topic: '' });
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [active, setActive] = useState(false);
  const [emotion, setEmotion] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [warming, setWarming] = useState(false);
  const emotionErrorShownRef = useRef(false);
  const emotionUnavailableRef = useRef(false);
  const emotionFailureCountRef = useRef(0);
  const [startedAt, setStartedAt] = useState(null);
  const secondsPerQuestion = difficultySeconds[setup.difficulty];
  const current = questions[index];

  const submitAnswer = useCallback(async () => {
    if (!session || submitting) return;
    setSubmitting(true);
    speech.stop();
    try {
      const transcript = speech.transcript.trim() || 'No answer provided.';
      const { data } = await api.post(`/sessions/${session._id}/answer`, {
        questionId: questions[index]._id,
        transcript
      });
      setFeedback(data.feedback);
      speech.setTranscript('');
      if (index + 1 >= questions.length) {
        setActive(false);
        speech.stop();
        voice.stop();
        webcam.stop();
        const duration = Math.round((Date.now() - startedAt) / 1000);
        const shouldSave = window.confirm('Interview complete. Do you want to save this session?');

        if (shouldSave) {
          const ended = await api.post(`/sessions/${session._id}/end`, { duration });
          toast.success('Session saved');
          navigate(`/sessions/${ended.data.session._id}`);
        } else {
          await api.delete(`/sessions/${session._id}`);
          toast.success('Session discarded');
          navigate('/dashboard');
        }
      } else {
        setIndex((value) => value + 1);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not submit answer');
    } finally {
      setSubmitting(false);
    }
  }, [session, submitting, speech, questions, index, startedAt, navigate]);

  const timer = useTimer(secondsPerQuestion, active && session, submitAnswer);
  const elapsedQuestionSeconds = Math.max(0, secondsPerQuestion - timer.seconds);

  useEffect(() => {
    timer.reset();
  }, [index]);

  useEffect(() => {
    if (active && current?.text) voice.speak(current.text);
  }, [active, current?.text, voice.speak]);

  useEffect(() => {
    if (!session || !webcam.ready) return undefined;
    let first = true;
    const id = setInterval(async () => {
      if (emotionUnavailableRef.current) return;
      const frame = webcam.capture();
      if (!frame) return;
      try {
        if (first) setWarming(true);
        const { data } = await api.post('/emotion/analyze', { imageBase64: frame, sessionId: session._id });
        emotionFailureCountRef.current = 0;
        setEmotion(data);
      } catch (error) {
        emotionFailureCountRef.current += 1;
        if (!emotionErrorShownRef.current) {
          toast.error(error.response?.data?.detail || error.response?.data?.message || 'Emotion analysis is unavailable');
          emotionErrorShownRef.current = true;
        }
        if (emotionFailureCountRef.current >= 3) {
          emotionUnavailableRef.current = true;
        }
        console.warn(error.response?.data || error);
      } finally {
        first = false;
        setWarming(false);
      }
    }, 3000);
    return () => clearInterval(id);
  }, [session, webcam.ready]);

  useEffect(() => {
    if (countdown <= 0) return undefined;
    const id = setTimeout(() => {
      setCountdown((value) => value - 1);
      if (countdown === 1) setActive(true);
    }, 1000);
    return () => clearTimeout(id);
  }, [countdown]);

  const start = async () => {
    try {
      if (setup.type === 'Custom' && setup.topic.trim().length < 2) {
        toast.error('Enter what you want to prepare for');
        return;
      }
      const { data } = await api.post('/sessions/start', setup);
      setSession(data.session);
      setQuestions(data.questions);
      setStartedAt(Date.now());
      setCountdown(3);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not start session');
    }
  };

  const stopSession = async () => {
    if (!session || stopping) return;
    const confirmStop = window.confirm('Stop this interview session now? Your completed answers will be saved.');
    if (!confirmStop) return;

    setStopping(true);
    setActive(false);
    speech.stop();
    voice.stop();
    webcam.stop();

    try {
      const duration = startedAt ? Math.round((Date.now() - startedAt) / 1000) : 0;
      const { data } = await api.post(`/sessions/${session._id}/end`, { duration });
      toast.success('Session stopped');
      navigate(`/sessions/${data.session._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not stop session');
      setStopping(false);
    }
  };

  if (!session) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="panel p-6">
          <h1 className="mb-6 text-3xl font-black text-slate-950 dark:text-white">Interview Setup</h1>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Interview type
              <select className="input mt-2" value={setup.type} onChange={(e) => setSetup({ ...setup, type: e.target.value })}>{['HR', 'Technical', 'Behavioural', 'Mixed', 'Custom'].map((v) => <option key={v}>{v}</option>)}</select>
            </label>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Difficulty
              <select className="input mt-2" value={setup.difficulty} onChange={(e) => setSetup({ ...setup, difficulty: e.target.value })}>{['Easy', 'Medium', 'Hard'].map((v) => <option key={v}>{v}</option>)}</select>
            </label>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Number of questions
              <input
                className="input mt-2"
                type="number"
                min="1"
                max="30"
                value={setup.totalQuestions}
                onChange={(e) => setSetup({ ...setup, totalQuestions: Number(e.target.value) })}
              />
            </label>
          </div>
          {setup.type === 'Custom' && (
            <input
              className="input mt-4"
              value={setup.topic}
              onChange={(e) => setSetup({ ...setup, topic: e.target.value })}
              placeholder="What do you want to prepare? Example: React hooks, data analyst SQL, AWS DevOps, nursing interview"
            />
          )}
          <label className="mt-4 flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={voice.enabled}
              onChange={(e) => voice.setEnabled(e.target.checked)}
              className="h-4 w-4 accent-[#6C63FF]"
            />
            Read questions aloud with browser voice
            {!voice.supported && <span className="text-amber-500">Voice is not supported in this browser.</span>}
          </label>
          <button className="btn-primary mt-6" onClick={start}>Start Session</button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      {countdown > 0 && <div className="mb-4 rounded-lg bg-cyan-100 p-4 text-center text-3xl font-black text-cyan-900">{countdown}</div>}
      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Timer seconds={timer.seconds} />
            <div className="flex gap-2">
              <button className="btn-secondary" disabled={stopping} onClick={stopSession}>
                {stopping ? 'Stopping...' : 'Stop Session'}
              </button>
              <button className="btn-primary" disabled={submitting || stopping || !active} onClick={submitAnswer}>{submitting ? <Loader label="Submitting..." /> : 'Submit Answer'}</button>
            </div>
          </div>
          <QuestionCard question={current} index={index} total={questions.length} />
          <button className="btn-secondary" onClick={() => voice.speak(current?.text)} disabled={!voice.supported}>
            Repeat Question
          </button>
          <SpeechRecorder speech={speech} />
          <FeedbackPanel feedback={feedback} />
        </div>
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_10rem]">
            <WebcamCapture webcam={webcam} />
            <LiveFeedbackSidebar
              emotion={emotion}
              transcript={speech.transcript}
              elapsedSeconds={elapsedQuestionSeconds}
              warming={warming}
            />
          </div>
        </div>
      </div>
    </main>
  );
};

export default Interview;
