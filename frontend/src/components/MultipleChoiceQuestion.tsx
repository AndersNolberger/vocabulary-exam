import { Button, Group, Stack, Text } from '@mantine/core';

interface Props {
  question: string;
  options: string[];
  onAnswer: (answer: string) => void;
  disabled: boolean;
}

const MultipleChoiceQuestion = ({ question, options, onAnswer, disabled }: Props) => (
  <Stack>
    <Text size="xl" fw={500}>{question}</Text>
    <Group>
      {options.map((option) => (
        <Button key={option} variant="light" disabled={disabled} onClick={() => onAnswer(option)}>
          {option}
        </Button>
      ))}
    </Group>
  </Stack>
);

export default MultipleChoiceQuestion;
