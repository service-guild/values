import React from 'react';

interface StatementInputProps {
  valueName: string;
  cardId: number;
  statement: string; // Controlled component value
  onChange: (cardId: number, value: string) => void;
}

export function StatementInput({ valueName, cardId, statement, onChange }: StatementInputProps) {
  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(cardId, event.target.value);
  };

  const inputId = `statement-input-${cardId}`;

  return (
    <div className="mb-4 p-3 border rounded bg-gray-50">
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
        Why is "<span className="font-semibold">{valueName}</span>" a core value for you?
      </label>
      <textarea
        id={inputId}
        rows={3}
        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
        placeholder="Write your statement here..."
        value={statement}
        onChange={handleChange}
      />
    </div>
  );
}
