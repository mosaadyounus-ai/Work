import { OracleKernel } from '@/oracle/kernel';

const kernel = new OracleKernel('./mirror/two_peak_example.json');

export default function OraclePage() {
  const state = { phi: 4, r: 2, e: 4, mode: 'FUSION' };
  const evaluation = kernel.evaluate(state, 0, 0.25);
  
  return (
    <div>
      <h1>Oracle Engine</h1>
      <pre>{JSON.stringify(evaluation, null, 2)}</pre>
    </div>
  );
}
