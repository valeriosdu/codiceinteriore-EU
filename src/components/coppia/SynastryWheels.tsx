// Le due ruote incise della tavola di sinastria: due carte natali che si
// sovrappongono, che e' letteralmente cio' che fa una sinastria. Girano in verso
// opposto (le classi `ci-syn-a/b` stanno in CoppiaLanding) cosi' le due fasce di
// glifi scorrono l'una contro l'altra invece di sembrare un unico disco.
import { ChartWheel } from '@/components/classica';

// Le due istanze condividono l'id SVG `wheel-vignette`: il browser risolve
// entrambe sulla prima definizione, ma le ruote sono identiche e la resa non
// cambia.
const SynastryWheels = () => (
  <>
    <div className="ci-syn-a absolute left-0 top-0 h-full" style={{ width: '61.7%' }}>
      <ChartWheel className="h-full w-full" />
    </div>
    <div className="ci-syn-b absolute right-0 top-0 h-full" style={{ width: '61.7%' }}>
      <ChartWheel className="h-full w-full" />
    </div>
  </>
);

export default SynastryWheels;
