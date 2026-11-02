import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Alert, Button, Paper, Progress, Stack, Text, Title } from '@mantine/core';
import { startQuizRound, QuizAnswerResult, QuizRound, submitAnswer } from '../api/quizApi';
import { RoundCompletion } from '../api/progressApi';
import MultipleChoiceQuestion from '../components/MultipleChoiceQuestion';
import TypedAnswerQuestion from '../components/TypedAnswerQuestion';
import { QuizQuestion } from '../types';

const feedbackMessages = {
  correct: ['Rätt! Snyggt jobbat!', 'Precis rätt! Du har koll!', 'Fullträff! Bra kämpat!', 'Helt rätt! Ett ord till på plats.'],
  incorrect: ['Inte riktigt rätt den här gången. Fortsätt öva!', 'Det stämde inte riktigt. Nästa ord är en ny chans!', 'Fel den här gången, men varje försök hjälper dig framåt!'],
  capitalization: [
    'Nästan! Tänk på stora och små bokstäver. I tyskan är de viktiga!',
    'Du kan ordet! Men kontrollera stora och små bokstäver.',
    'Så nära! Bara stora och små bokstäver skiljer. Tyska substantiv börjar med stor bokstav!',
  ],
};

const QuizPage = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const typed = searchParams.get('mode') === 'typed';
  const difficultOnly = searchParams.get('practice') === 'difficult';

  return <QuizSession key={`${id}-${typed}-${difficultOnly}`} wordSetId={Number(id)} typed={typed} difficultOnly={difficultOnly} />;
};

const QuizSession = ({ wordSetId, typed, difficultOnly }: { wordSetId: number; typed: boolean; difficultOnly: boolean }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [failedQuestions, setFailedQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [roundId, setRoundId] = useState('');
  const [completion, setCompletion] = useState<RoundCompletion | null>(null);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [result, setResult] = useState<QuizAnswerResult | null>(null);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submissionPending = useRef(false);
  const initialRound = useRef<Promise<QuizRound> | null>(null);
  const retryPending = useRef(false);

  useEffect(() => {
    let active = true;
    if (!initialRound.current) initialRound.current = startQuizRound(wordSetId, typed, undefined, difficultOnly);
    initialRound.current
      .then((round) => {
        if (active) {
          setRoundId(round.roundId);
          setQuestions(round.questions);
        }
      })
      .catch(() => {
        if (active) setError(difficultOnly
          ? 'Kunde inte starta förhöret. Det kanske inte finns några svåra ord kvar. Gå tillbaka till Mina läxor.'
          : 'Kunde inte starta förhöret. Läxan kan ha ändrats. Gå tillbaka till Mina läxor och försök igen.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [wordSetId, typed, difficultOnly]);

  const handleAnswer = async (answer: string) => {
    if (submissionPending.current || result !== null || !answer.trim() || !questions[index]) return;
    submissionPending.current = true;
    setSubmitting(true);
    setError(null);
    try {
      const answerResult = await submitAnswer(roundId, questions[index].id, answer);
      setResult(answerResult);
      if (answerResult.completion) setCompletion(answerResult.completion);
      const messages = feedbackMessages[answerResult.isCorrect ? 'correct' : answerResult.capitalizationOnly ? 'capitalization' : 'incorrect'];
      setFeedback((previous) => {
        const alternatives = messages.filter((message) => message !== previous);
        return alternatives[Math.floor(Math.random() * alternatives.length)];
      });
      if (answerResult.isCorrect) setScore((s) => s + 1);
      else setFailedQuestions((failed) => [...failed, questions[index]]);
    } catch {
      setError('Kunde inte kontrollera svaret. Försök igen.');
    } finally {
      submissionPending.current = false;
      setSubmitting(false);
    }
  };

  const next = () => {
    if (result === null) return;
    setResult(null);
    setIndex((i) => i + 1);
  };

  const retryFailed = async () => {
    if (retryPending.current) return;
    retryPending.current = true;
    setLoading(true);
    setError(null);
    try {
      const round = await startQuizRound(wordSetId, typed, roundId);
      setQuestions(round.questions);
      setRoundId(round.roundId);
      setFailedQuestions([]);
      setIndex(0);
      setScore(0);
      setResult(null);
      setCompletion(null);
      setFeedback('');
    } catch {
      setError('Kunde inte starta omgången. Läxan kan ha ändrats. Försök igen eller gå tillbaka till Mina läxor.');
    } finally {
      retryPending.current = false;
      setLoading(false);
    }
  };

  const finished = questions.length > 0 && index >= questions.length;
  const question = questions[index];

  return (
    <Paper className="surface quiz-panel" p={{ base: 'lg', sm: 40 }}>
    <Stack gap="lg">
      <Text c="indigo" size="xs" fw={700} className="eyebrow">Ett ord i taget</Text>
      <Title order={1} size="h2">Ditt nästa framsteg</Title>
      <Text c="dimmed">Ta det i din egen takt. Varje försök räknas.</Text>
      <Text fw={600}>{typed ? 'Skrivförhör' : 'Flervalsförhör'}</Text>
      {difficultOnly && <Text c="orange.8">Svåra ord: öva på upp till 10 ord som ofta blivit fel.</Text>}
      <Text size="sm" c="dimmed">Stora och små bokstäver måste stämma.{typed && ' Tryck Enter eller Svara när du skriver svaret själv.'}</Text>
      <Progress value={questions.length ? index / questions.length * 100 : 0} radius="xl" size="sm" aria-label="Förhörets framsteg" />
      {error && <Alert color="red">{error}</Alert>}
      {loading && <Text c="dimmed">Laddar frågor...</Text>}
      {!loading && !error && questions.length === 0 && <Text>Det finns inga ord att öva på i den här läxan.</Text>}
      {finished && (
        <Stack>
          <Text size="xl">Klart! Resultat: {score} / {questions.length}</Text>
          {completion && (
            <Alert color="grape" title={`+${completion.earnedXp} XP! Bra kämpat!`}>
              <Stack gap="xs">
                <Text>{completion.leveledUp ? `Ny nivå! Du är nu på nivå ${completion.level}. Fortsätt glänsa!` : `Varje övning tar dig framåt. Du är på nivå ${completion.level}.`}</Text>
                {completion.newAchievements.map((achievement) => (
                  <Text key={achievement.id} fw={700}>Ny utmärkelse: {achievement.title} · Nivå {achievement.tier} — {achievement.description}</Text>
                ))}
              </Stack>
            </Alert>
          )}
          {failedQuestions.length > 0 && (
            <Button onClick={retryFailed} loading={loading}>Öva igen på felaktiga svar ({failedQuestions.length})</Button>
          )}
        </Stack>
      )}
      {question && !finished && (
        <>
          <Text c="dimmed">Fråga {index + 1} av {questions.length}</Text>
          {typed ? (
            <TypedAnswerQuestion key={question.id} question={question.swedishWord}
              onAnswer={handleAnswer} disabled={result !== null || submitting} />
          ) : (
            <MultipleChoiceQuestion question={question.swedishWord} options={question.germanOptions}
              onAnswer={handleAnswer} disabled={result !== null || submitting} />
          )}
          {result !== null && (
            <>
              <Alert role="status" color={result.isCorrect ? 'green' : result.capitalizationOnly ? 'yellow' : 'red'}>{feedback}</Alert>
              <Button onClick={next}>Nästa</Button>
            </>
          )}
        </>
      )}
      <Button component={Link} to="/word-sets" variant="subtle">Till Mina läxor</Button>
    </Stack>
    </Paper>
  );
};

export default QuizPage;
