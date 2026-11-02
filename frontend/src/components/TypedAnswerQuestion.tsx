import { useState } from 'react';
import { Button, Group, Stack, Text, TextInput } from '@mantine/core';

interface Props {
  question: string;
  onAnswer: (answer: string) => void;
  disabled: boolean;
}

const TypedAnswerQuestion = ({ question, onAnswer, disabled }: Props) => {
  const [value, setValue] = useState('');

  return (
    <Stack component="form" onSubmit={(event) => {
      event.preventDefault();
      if (!disabled && value.trim()) onAnswer(value);
    }}>
      <Text size="xl" fw={500}>{question}</Text>
      <Group>
        <TextInput
          placeholder="Skriv svaret på tyska"
          aria-label="Svar på tyska"
          autoComplete="off"
          spellCheck={false}
          value={value}
          disabled={disabled}
          onChange={(e) => setValue(e.currentTarget.value)}
        />
        <Button type="submit" disabled={disabled || value.trim() === ''}>
          Svara
        </Button>
      </Group>
    </Stack>
  );
};

export default TypedAnswerQuestion;
