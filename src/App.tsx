import React, { useState } from 'react';
import './style.css';

type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue }
  | JsonValue[];

interface JsonDiffResult {
  type: 'added' | 'removed' | 'modified' | 'unchanged' | 'object';
  value?: JsonValue | { [key: string]: JsonDiffResult };
  original?: JsonValue;
  new?: JsonValue;
}

function compareJson(
  obj1: { [key: string]: JsonValue },
  obj2: { [key: string]: JsonValue }
): { [key: string]: JsonDiffResult } {
  const result: { [key: string]: JsonDiffResult } = {};

  for (const key in obj1) {
    if (!(key in obj2)) {
      result[key] = { type: 'removed', value: obj1[key] };
    } else if (JSON.stringify(obj1[key]) !== JSON.stringify(obj2[key])) {
      if (typeof obj1[key] === 'object' && typeof obj2[key] === 'object') {
        const nestedDiff = compareJson(
          obj1[key] as { [key: string]: JsonValue },
          obj2[key] as { [key: string]: JsonValue }
        );
        result[key] = { type: 'object', value: nestedDiff };
      } else {
        result[key] = {
          type: 'modified',
          original: obj1[key],
          new: obj2[key],
        };
      }
    } else {
      result[key] = { type: 'unchanged', value: obj1[key] };
    }
  }

  for (const key in obj2) {
    if (!(key in obj1)) {
      result[key] = { type: 'added', value: obj2[key] };
    }
  }

  return result;
}
const handleCompare = (
  json1: string,
  json2: string,
  callback: (diff: { [key: string]: JsonDiffResult } | null) => void
) => {
  try {
    const obj1 = JSON.parse(json1 || '{}');
    const obj2 = JSON.parse(json2 || '{}');
    callback(compareJson(obj1, obj2));
  } catch (error) {
    alert('Error al analizar JSON: ');
  }
};

export const App: React.FC = () => {
  const [json1, setJson1] = useState<string>('');
  const [json2, setJson2] = useState<string>('');
  const [difference, setDifference] = useState<{
    [key: string]: JsonDiffResult;
  } | null>(null);

  const renderDifference = (diff: {
    [key: string]: JsonDiffResult;
  }): JSX.Element[] => {
    return Object.entries(diff).map(([key, value]) => {
      let className = 'json-diff ';

      switch (value.type) {
        case 'added':
          className += 'json-diff-added';
          break;
        case 'removed':
          className += 'json-diff-removed';
          break;
        case 'modified':
          className += 'json-diff-modified';
          break;
        case 'object':
          return (
            <div key={key} className="json-diff-object">
              <strong>{key}:</strong>
              <div>
                {renderDifference(
                  value.value as { [key: string]: JsonDiffResult }
                )}
              </div>
            </div>
          );
        default:
          className += 'json-diff-unchanged';
      }

      return (
        <div key={key} className={className}>
          <strong>{key}:</strong>{' '}
          {JSON.stringify(value.value || value.original)}
          {value.type === 'modified' && (
            <>
              {' -> '}
              {JSON.stringify(value.new)}
            </>
          )}
        </div>
      );
    });
  };

  return (
    <div className="json-comparator-container">
      <div className="json-comparator-textareas">
        <textarea
          className="json-comparator-textarea"
          placeholder="Primer JSON"
          value={json1}
          onChange={(e) => setJson1(e.target.value)}
        />
        <textarea
          className="json-comparator-textarea"
          placeholder="Segundo JSON"
          value={json2}
          onChange={(e) => setJson2(e.target.value)}
        />
      </div>
      <button
        className="json-comparator-button"
        onClick={() => handleCompare(json1, json2, setDifference)}
      >
        Comparar
      </button>
      {difference && (
        <div className="json-comparator-difference">
          <h3 className="json-diff-title">Diferencias</h3>
          <div>{renderDifference(difference)}</div>
        </div>
      )}
    </div>
  );
};
