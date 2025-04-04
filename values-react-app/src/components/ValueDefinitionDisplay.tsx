import React from 'react';

interface ValueDefinitionDisplayProps {
  name: string;
  description: string;
}

export function ValueDefinitionDisplay({ name, description }: ValueDefinitionDisplayProps) {
  return (
    <li className="mb-2">
      <span className="font-semibold text-blue-700 mr-2">{name}:</span>
      <span className="text-gray-700">{description}</span>
    </li>
  );
}
