import React from 'react';
import type { EnvelopeReport } from '../lib/oracleKernelCore';

type Evaluation = Pick<EnvelopeReport, 'inPhiAttractor' | 'attractorId' | 'lawCompliance'>;

type Props = {
  evaluation: Evaluation;
};

function Badge({ children, title }: { children: React.ReactNode; title?: string }) {
  return <span title={title}>{children}</span>;
}

function Tooltip({ children, content }: { children: React.ReactNode; content: string }) {
  return <span title={content}>{children}</span>;
}

function Icon({ name }: { name: string }) {
  return <span aria-label={name}>*</span>;
}

export default function OracleWorkbenchPage({ evaluation }: Props) {
  const attractorLabel = evaluation.attractorId ?? 'unknown';

  return (
    <section>
      {evaluation.inPhiAttractor && (
        <Badge title="Law phi-A: In G_phi attractor">
          G_phi Active - {attractorLabel}
        </Badge>
      )}

      {evaluation.lawCompliance && (
        <div>
          <Tooltip
            content={`Near-recursion: ${evaluation.lawCompliance.nearRecursion ? 'Yes' : 'No'} | Irreversible: ${evaluation.lawCompliance.irreversible ? 'Yes' : 'No'}`}
          >
            <Icon name="phi-law" />
          </Tooltip>
          <div>
            <strong>Law phi-A premises</strong>
          </div>
          <div>Near recursion: {evaluation.lawCompliance.nearRecursion ? 'Yes' : 'No'}</div>
          <div>Irreversible: {evaluation.lawCompliance.irreversible ? 'Yes' : 'No'}</div>
          <div>
            Premises satisfied: {evaluation.lawCompliance.premisesSatisfied ? 'Yes' : 'No'}
          </div>
        </div>
      )}
    </section>
  );
}
