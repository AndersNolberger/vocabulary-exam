import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ActionIcon, Alert, Badge, Button, Group, Paper, SegmentedControl, Stack, Text, Textarea, TextInput, Title, Tooltip } from '@mantine/core';
import { Trash2 } from 'lucide-react';
import { createWordSet, fetchWordSet, updateWordSet } from '../api/wordSetsApi';
import { checkWords } from '../api/spellCheckApi';
import { ColumnOrder, detectColumnOrder, parseWordList, WordColumns } from '../utils/wordList';
import { ForeignLanguage, WordPair } from '../types';

const emptyPair = (): WordPair => ({ swedishWord: '', foreignWord: '', exampleAndInflections: '' });

const WordSetEditorPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const editing = id !== undefined;
  const [name, setName] = useState('');
  const [foreignLanguage, setForeignLanguage] = useState<ForeignLanguage>('German');
  const [pairs, setPairs] = useState<WordPair[]>([emptyPair()]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(editing);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [columns, setColumns] = useState<WordColumns | null>(null);
  const [order, setOrder] = useState<ColumnOrder | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [unknownWords, setUnknownWords] = useState<string[]>([]);
  const [spellError, setSpellError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const foreignWords = JSON.stringify([...new Set(pairs.map((p) => p.foreignWord.trim()).filter(Boolean))]);

  useEffect(() => {
    const controller = new AbortController();
    const words: string[] = JSON.parse(foreignWords);
    setUnknownWords([]);
    setSpellError(null);
    setChecking(words.length > 0);
    if (!words.length) return () => controller.abort();

    const timer = setTimeout(() => {
      checkWords(words, controller.signal, false, foreignLanguage)
        .then((unknown) => {
          if (!controller.signal.aborted) setUnknownWords(unknown);
        })
        .catch(() => {
          if (!controller.signal.aborted) setSpellError('Kunde inte kontrollera stavningen. Du kan ändå spara läxan.');
        })
        .finally(() => {
          if (!controller.signal.aborted) setChecking(false);
        });
    }, 350);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [foreignLanguage, foreignWords]);

  useEffect(() => {
    let active = true;
    setError(null);
    setLoadError(null);
    setLoading(id !== undefined);
    setName('');
    setForeignLanguage('German');
    setPairs([emptyPair()]);
    setPasteText('');
    setColumns(null);
    setOrder(null);
    setImportError(null);

    if (id !== undefined) {
      fetchWordSet(Number(id))
        .then((wordSet) => {
          if (!active) return;
          setName(wordSet.name);
          setForeignLanguage(wordSet.foreignLanguage);
          setPairs(wordSet.wordPairs);
        })
        .catch(() => {
          if (active) setLoadError('Kunde inte hämta läxan. Den kanske inte finns eller tillhör dig.');
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }

    return () => { active = false; };
  }, [id]);

  const updatePair = (index: number, field: 'swedishWord' | 'foreignWord' | 'exampleAndInflections', value: string) =>
    setPairs((ps) => ps.map((p, i) => (i === index ? { ...p, [field]: value } : p)));

  const importList = (rows: WordColumns, selectedOrder: ColumnOrder) => {
    const imported = rows.map(([first, second]) => ({
      swedishWord: selectedOrder === 'foreign-first' ? second : first,
      foreignWord: selectedOrder === 'foreign-first' ? first : second,
    }));
    setPairs((current) => [...current.filter((p) => p.swedishWord.trim() || p.foreignWord.trim()), ...imported]);
    setPasteText('');
    setColumns(null);
    setOrder(null);
    setError(null);
  };

  const analyzeList = async () => {
    setImportError(null);
    setColumns(null);
    setOrder(null);
    let rows: WordColumns;
    try {
      rows = parseWordList(pasteText, foreignLanguage);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Kunde inte läsa listan.');
      return;
    }
    setImporting(true);
    try {
      const unknown = await checkWords([...new Set(rows.flat())], undefined, true, foreignLanguage);
      const detectedOrder = detectColumnOrder(rows, unknown);
      if (detectedOrder) {
        importList(rows, detectedOrder);
      } else {
        setColumns(rows);
      }
    } catch {
      setImportError(`Kunde inte kontrollera listan mot den ${foreignLanguage === 'German' ? 'tyska' : 'franska'} ordlistan. Försök igen.`);
    } finally {
      setImporting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving || loading || loadError) return;
    if (pasteText.trim()) {
      setError('Lägg till den inklistrade listan i ordparen först, eller töm rutan.');
      return;
    }
    const words = pairs.map((p) => ({
      swedishWord: p.swedishWord.trim(),
      foreignWord: p.foreignWord.trim(),
      exampleAndInflections: p.exampleAndInflections?.trim() || null,
    })).filter((p) => p.swedishWord || p.foreignWord);
    if (!name.trim() || words.length === 0) {
      setError('Ange ett namn och minst ett ordpar.');
      return;
    }
    if (words.some((p) => !p.swedishWord || !p.foreignWord)) {
      setError(`Fyll i både svenska och ${foreignLanguage === 'German' ? 'tyska' : 'franska'} för varje ordpar.`);
      return;
    }
    setError(null);
    setSaving(true);
    try {
      if (id !== undefined) {
        await updateWordSet(Number(id), name.trim(), words, foreignLanguage);
      } else {
        await createWordSet(name.trim(), words, foreignLanguage);
      }
      navigate('/word-sets');
    } catch {
      setError(editing ? 'Kunde inte spara läxan. Försök igen.' : 'Kunde inte skapa läxan.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Text>Laddar...</Text>;
  if (loadError) return (
    <Stack>
      <Alert color="red">{loadError}</Alert>
      <Button component={Link} to="/word-sets" variant="outline">Tillbaka till mina läxor</Button>
    </Stack>
  );

  return (
    <Paper className="surface" p={{ base: 'lg', sm: 36 }}>
    <form onSubmit={handleSubmit}>
      <fieldset disabled={saving} style={{ border: 0, padding: 0, margin: 0 }}>
        <Stack gap="lg">
          <div>
            <Text c="indigo" size="xs" fw={700} className="eyebrow" mb="xs">Bygg din ordsamling</Text>
            <Title order={1} size="h2">{editing ? 'Redigera läxa' : 'Skapa en ny läxa'}</Title>
            <Text c="dimmed" mt="xs">Samla orden du vill kunna. Lite övning tar dig långt.</Text>
          </div>
          <TextInput size="md" label="Namn på läxan" placeholder="Till exempel: Veckans glosor"
            value={name} onChange={(e) => setName(e.currentTarget.value)} />
          <SegmentedControl aria-label="Språk för ordlistan" value={foreignLanguage}
            onChange={(value) => setForeignLanguage(value as ForeignLanguage)}
            data={[{ value: 'German', label: 'Tyska' }, { value: 'French', label: 'Franska' }]} />
          <Paper withBorder p="lg" bg="indigo.0">
            <Stack gap="sm">
              <Title order={2} size="h4">Klistra in en hel gloslista</Title>
              <Textarea label="Ett ordpar per rad" minRows={7} autosize maxRows={16}
                description={`${foreignLanguage === 'German' ? 'Tyska' : 'Franska'} eller svenska först, med samma ordning på alla rader. Använd mellanslag när delningen är tydlig, annars tabb, semikolon, = eller ett streck med mellanrum.`}
                placeholder={foreignLanguage === 'German' ? 'das Haus hus\ndas Buch bok\ndie Sonne sol' : 'la maison hus\nle livre bok\nle soleil sol'}
                value={pasteText} disabled={importing} onChange={(e) => {
                  setPasteText(e.currentTarget.value);
                  setColumns(null);
                  setOrder(null);
                  setImportError(null);
                }} />
              <Button type="button" onClick={analyzeList} loading={importing}
                disabled={!pasteText.trim()} w="fit-content">Läs in listan</Button>
              {importError && <Alert color="red">{importError}</Alert>}
              {columns && (
                <Stack gap="sm">
                  <Text size="sm">
                    {order
                      ? `Vald ordning: ${order === 'foreign-first' ? `${foreignLanguage === 'German' ? 'tyska' : 'franska'} först` : 'svenska först'}. Kontrollera innan du lägger till.`
                      : 'Ordlistan ger inget entydigt svar. Välj vilket språk som står först.'}
                  </Text>
                  <SegmentedControl aria-label="Språkordning" fullWidth value={order ?? ''}
                    onChange={(value) => setOrder(value === 'foreign-first' ? 'foreign-first' : 'swedish-first')}
                    data={[
                      { value: 'foreign-first', label: `${foreignLanguage === 'German' ? 'Tyska' : 'Franska'} först` },
                      { value: 'swedish-first', label: 'Svenska först' },
                    ]} />
                  <Button type="button" disabled={!order} onClick={() => {
                    if (order) importList(columns, order);
                  }} w="fit-content">
                    Lägg till {columns.length} ordpar
                  </Button>
                </Stack>
              )}
            </Stack>
          </Paper>
          <Group justify="space-between">
            <Title order={2} size="h4">Dina ordpar</Title>
            <Badge variant="light">{pairs.filter((p) => p.swedishWord.trim() || p.foreignWord.trim()).length} ordpar</Badge>
          </Group>
          <Text size="sm" c="dimmed">Ta bort ett ordpar med knappen på raden. Ändringarna sparas först när du sparar läxan. Minst ett ordpar behövs.</Text>
          {checking && <Text size="sm" c="dimmed" role="status">Kontrollerar {foreignLanguage === 'German' ? 'tysk' : 'fransk'} stavning...</Text>}
          {spellError && <Alert color="yellow">{spellError}</Alert>}
          {unknownWords.length > 0 && <Alert color="yellow" title={`Kontrollera ${foreignLanguage === 'German' ? 'tysk' : 'fransk'} stavning`}>
            Finns inte i den {foreignLanguage === 'German' ? 'tyska' : 'franska'} ordlistan: {unknownWords.join(', ')}. Orden kan vara felstavade eller saknas i ordlistan. Du kan ändå spara.
          </Alert>}
          {pairs.map((pair, i) => (
            <div key={i} className="editor-row">
              <span className="row-number" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
              <TextInput label="Svenska" value={pair.swedishWord}
                onChange={(e) => updatePair(i, 'swedishWord', e.currentTarget.value)} />
              <TextInput label={foreignLanguage === 'German' ? 'Tyska' : 'Franska'} value={pair.foreignWord}
                styles={unknownWords.includes(pair.foreignWord.trim()) ? {
                  input: { backgroundColor: 'var(--mantine-color-red-0)', borderColor: 'var(--mantine-color-red-3)' },
                } : undefined}
                description={unknownWords.includes(pair.foreignWord.trim()) ? 'Finns inte i ordlistan. Kontrollera stavningen; ordet kan sparas ändå.' : undefined}
                onChange={(e) => updatePair(i, 'foreignWord', e.currentTarget.value)} />
              <Textarea label="Exempel och böjningar (valfritt)" value={pair.exampleAndInflections ?? ''}
                autosize minRows={1} maxRows={4}
                onChange={(e) => updatePair(i, 'exampleAndInflections', e.currentTarget.value)} />
              <Tooltip label="Ta bort ordpar">
                <ActionIcon type="button" color="red" variant="light" size={36}
                aria-label={`Ta bort ordpar ${i + 1}`}
                onClick={() => setPairs((ps) => ps.filter((_, j) => j !== i))}>
                  <Trash2 size={18} aria-hidden="true" />
                </ActionIcon>
              </Tooltip>
            </div>
          ))}
          <Button type="button" variant="light" onClick={() => setPairs((ps) => [...ps, emptyPair()])} w="fit-content">+ Lägg till ordpar</Button>
          <Group justify="space-between" className="editor-actions">
            <Button component={Link} to="/word-sets" variant="default">Avbryt</Button>
            <Button type="submit" size="md" loading={saving}>{editing ? 'Spara ändringar' : 'Skapa läxa'}</Button>
          </Group>
          {error && <Alert color="red">{error}</Alert>}
        </Stack>
      </fieldset>
    </form>
    </Paper>
  );
};

export default WordSetEditorPage;
