import { useCallback, useEffect, useRef, useState } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────

interface Segment {
  icon: string;
  name: string;
  pct: number;
  color: string;
}

interface Shop {
  name: string;
  emoji: string;
  priority: 'high' | 'medium' | 'low';
  products: string[];
  revenue: number;
  desc: string;
}

interface Profile {
  name: string;
  icon: string;
  color: string;
  desc: string;
  segments: Segment[];
  count: [number, number];
  density: [number, number];
  power: string;
  items: string[];
  eta: string;
  shops: Shop[];
}

interface AlertCard {
  id: string;
  shop: Shop;
  profile: Profile;
  timeStr: string;
  acked: boolean;
}

interface TrafficSlot {
  h: number;
  label: string;
  idx: number;
  speed: number;
  level: 'clear' | 'slow' | 'heavy';
}

interface TrafficState {
  condition: string;
  condLevel: 'clear' | 'slow' | 'heavy';
  speed: number;
  delay: number;
  eta: number;
  trend: string;
}

type SignalPhase = 'green' | 'yellow' | 'red';

// ── Data ───────────────────────────────────────────────────────────────────

const PROFILES: Profile[] = [
  {
    name: 'Office Commuters',
    icon: '👔',
    color: '#58a6ff',
    desc: 'Working professionals heading to or from offices. Time-pressed, prefer quick purchases.',
    segments: [
      { icon: '👔', name: 'Office Workers', pct: 55, color: '#58a6ff' },
      { icon: '🎒', name: 'Students',       pct: 20, color: '#bc8cff' },
      { icon: '🛍️', name: 'Shoppers',       pct: 15, color: '#ffa657' },
      { icon: '👨‍👩‍👧', name: 'Families',      pct: 10, color: '#3fb950' },
    ],
    count: [180, 260],
    density: [60, 80],
    power: 'Medium–High',
    items: ['Coffee & snacks', 'Quick lunch', 'Stationery', 'Phone accessories'],
    eta: '4–6 min',
    shops: [
      { name: 'Café & Snack Corner',  emoji: '☕', priority: 'high',   products: ['Espresso', 'Sandwiches', 'Energy bars'], revenue: 4200, desc: 'High footfall of office workers. Pre-brew coffee and prep grab-and-go sandwiches.' },
      { name: 'Mobile Accessories',   emoji: '📱', priority: 'medium', products: ['Earphones', 'Chargers', 'Screen guards'], revenue: 3100, desc: 'Office commuters frequently need accessories. Keep fast-moving items at counter.' },
      { name: 'Stationery & Books',   emoji: '📚', priority: 'low',    products: ['Notebooks', 'Pens', 'Planners'], revenue: 1500, desc: 'Moderate demand. Display new arrivals at storefront.' },
    ],
  },
  {
    name: 'School Students',
    icon: '🎒',
    color: '#bc8cff',
    desc: 'School and college students. High appetite for snacks, stationery, and low-cost items.',
    segments: [
      { icon: '🎒', name: 'Students',       pct: 65, color: '#bc8cff' },
      { icon: '👨‍👩‍👧', name: 'Families',      pct: 20, color: '#3fb950' },
      { icon: '👔', name: 'Office Workers', pct: 10, color: '#58a6ff' },
      { icon: '🧓', name: 'Seniors',        pct: 5,  color: '#ffa657' },
    ],
    count: [120, 200],
    density: [40, 65],
    power: 'Low–Medium',
    items: ['Snacks & chips', 'Stationery', 'Beverages', 'Books'],
    eta: '3–5 min',
    shops: [
      { name: 'Snack & Juice Stall',  emoji: '🥤', priority: 'high',   products: ['Chips', 'Juices', 'Ice cream', 'Candy'], revenue: 3600, desc: 'Students are hungry after school! Stock up on affordable snacks and cold drinks.' },
      { name: 'Stationery Shop',      emoji: '✏️', priority: 'high',   products: ['Notebooks', 'Pens', 'Rulers', 'Bags'], revenue: 2800, desc: 'High demand for school supplies. Place discounted combos near entrance.' },
      { name: 'Bookstore',            emoji: '📖', priority: 'medium', products: ['Textbooks', 'Comics', 'Guides'], revenue: 1900, desc: 'Students browse for guides and supplementary books. Create a visible display.' },
    ],
  },
  {
    name: 'Weekend Shoppers',
    icon: '🛍️',
    color: '#ffa657',
    desc: 'Families and leisure shoppers on a weekend outing. High spending intent, browsing mode.',
    segments: [
      { icon: '🛍️', name: 'Shoppers',  pct: 40, color: '#ffa657' },
      { icon: '👨‍👩‍👧', name: 'Families', pct: 35, color: '#3fb950' },
      { icon: '💑',  name: 'Couples',  pct: 15, color: '#39d353' },
      { icon: '🎒', name: 'Students',  pct: 10, color: '#bc8cff' },
    ],
    count: [220, 320],
    density: [70, 90],
    power: 'High',
    items: ['Fashion', 'Toys & gifts', 'Food & beverages', 'Electronics'],
    eta: '5–8 min',
    shops: [
      { name: 'Clothing Boutique', emoji: '👗', priority: 'high',   products: ['Casual wear', 'Kids clothes', 'Accessories'], revenue: 8500, desc: 'Weekend shoppers are in buying mode. Set up fresh arrivals and offer family combos.' },
      { name: 'Toy & Gift Shop',   emoji: '🎁', priority: 'high',   products: ['Toys', 'Board games', 'Gift wrap'], revenue: 5200, desc: 'Families with kids are prime buyers. Display popular items at eye-level for children.' },
      { name: 'Food Court Stalls', emoji: '🍔', priority: 'medium', products: ['Burgers', 'Ice cream', 'Fresh juice'], revenue: 4700, desc: 'High appetite for food during leisure shopping. Extend seating and prep large batches.' },
    ],
  },
  {
    name: 'Morning Walkers',
    icon: '🏃',
    color: '#39d353',
    desc: 'Early risers out for a walk or exercise. Health-conscious, low purchasing urgency.',
    segments: [
      { icon: '🏃', name: 'Fitness crowd', pct: 50, color: '#39d353' },
      { icon: '🧓', name: 'Seniors',       pct: 30, color: '#ffa657' },
      { icon: '👔', name: 'Professionals', pct: 15, color: '#58a6ff' },
      { icon: '👨‍👩‍👧', name: 'Families',    pct: 5,  color: '#3fb950' },
    ],
    count: [80, 140],
    density: [25, 45],
    power: 'Medium',
    items: ['Health drinks', 'Fruits', 'Newspapers', 'Yogurt'],
    eta: '2–4 min',
    shops: [
      { name: 'Fresh Fruits & Juices', emoji: '🍎', priority: 'high',   products: ['Seasonal fruits', 'Fresh juice', 'Coconut water'], revenue: 2800, desc: 'Morning walkers prioritize healthy food. Keep fresh stock available from early morning.' },
      { name: 'Pharmacy & Health',     emoji: '💊', priority: 'medium', products: ['Vitamins', 'Protein bars', 'First aid'], revenue: 1800, desc: 'Health-conscious crowd looks for supplements. Create a wellness corner display.' },
      { name: 'Newspaper & Books',     emoji: '📰', priority: 'low',    products: ['Newspapers', 'Magazines', 'Light reads'], revenue: 900,  desc: 'Seniors especially enjoy morning reads. Keep popular titles at the front.' },
    ],
  },
  {
    name: 'Evening Rush',
    icon: '🌆',
    color: '#f85149',
    desc: 'Dense evening rush of mixed crowd heading home. High volume, varied needs, time-sensitive.',
    segments: [
      { icon: '👔', name: 'Office Workers', pct: 45, color: '#58a6ff' },
      { icon: '🎒', name: 'Students',       pct: 25, color: '#bc8cff' },
      { icon: '🛍️', name: 'Shoppers',       pct: 20, color: '#ffa657' },
      { icon: '👨‍👩‍👧', name: 'Families',     pct: 10, color: '#3fb950' },
    ],
    count: [300, 450],
    density: [85, 100],
    power: 'Medium–High',
    items: ['Groceries', 'Ready meals', 'Beverages', 'Household items'],
    eta: '6–9 min',
    shops: [
      { name: 'Grocery & Essentials', emoji: '🛒', priority: 'high',   products: ['Vegetables', 'Packaged goods', 'Dairy'], revenue: 9200, desc: 'PEAK DEMAND! Evening shoppers stock up on daily needs. Max staff and inventory now.' },
      { name: 'Ready Meals & Diner',  emoji: '🍱', priority: 'high',   products: ['Dabbas', 'Rotis', 'Curries', 'Sweets'], revenue: 7800, desc: 'Exhausted commuters want ready food. Pre-pack meals and keep warmers on.' },
      { name: 'Beverages & Pan Shop', emoji: '🥤', priority: 'medium', products: ['Tea', 'Cold drinks', 'Paan', 'Cigarettes'], revenue: 3400, desc: 'High turnover items. Keep the counter stocked and assistants ready.' },
    ],
  },
];

const HOURLY_CONGESTION: TrafficSlot[] = [
  { h: 0,  label: '12am', idx: 5,  speed: 48, level: 'clear' },
  { h: 1,  label: '1am',  idx: 3,  speed: 50, level: 'clear' },
  { h: 2,  label: '2am',  idx: 2,  speed: 52, level: 'clear' },
  { h: 3,  label: '3am',  idx: 2,  speed: 52, level: 'clear' },
  { h: 4,  label: '4am',  idx: 5,  speed: 48, level: 'clear' },
  { h: 5,  label: '5am',  idx: 12, speed: 42, level: 'clear' },
  { h: 6,  label: '6am',  idx: 28, speed: 32, level: 'slow'  },
  { h: 7,  label: '7am',  idx: 72, speed: 14, level: 'heavy' },
  { h: 8,  label: '8am',  idx: 91, speed: 7,  level: 'heavy' },
  { h: 9,  label: '9am',  idx: 85, speed: 9,  level: 'heavy' },
  { h: 10, label: '10am', idx: 48, speed: 24, level: 'slow'  },
  { h: 11, label: '11am', idx: 38, speed: 28, level: 'slow'  },
  { h: 12, label: '12pm', idx: 55, speed: 19, level: 'slow'  },
  { h: 13, label: '1pm',  idx: 50, speed: 22, level: 'slow'  },
  { h: 14, label: '2pm',  idx: 35, speed: 30, level: 'slow'  },
  { h: 15, label: '3pm',  idx: 42, speed: 26, level: 'slow'  },
  { h: 16, label: '4pm',  idx: 65, speed: 16, level: 'heavy' },
  { h: 17, label: '5pm',  idx: 88, speed: 8,  level: 'heavy' },
  { h: 18, label: '6pm',  idx: 95, speed: 5,  level: 'heavy' },
  { h: 19, label: '7pm',  idx: 90, speed: 7,  level: 'heavy' },
  { h: 20, label: '8pm',  idx: 70, speed: 14, level: 'heavy' },
  { h: 21, label: '9pm',  idx: 45, speed: 25, level: 'slow'  },
  { h: 22, label: '10pm', idx: 22, speed: 38, level: 'clear' },
  { h: 23, label: '11pm', idx: 10, speed: 46, level: 'clear' },
];

const NORMAL_SPEED = 40;
const NUM_CARS = 5;
const AUTO_INTERVAL = 30;
const ANALYSIS_STEPS = [
  'Detecting people...',
  'Classifying age groups...',
  'Analysing attire & context...',
  'Profiling demographics...',
  'Estimating purchasing intent...',
  'Generating crowd intelligence...',
];
const SIGNAL_CYCLE: Record<SignalPhase, number> = { green: 30000, yellow: 4000, red: 28000 };

// ── Helpers ────────────────────────────────────────────────────────────────

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min) + min);
}

function computeTraffic(): TrafficState {
  const hour = new Date().getHours();
  const slot = HOURLY_CONGESTION[hour];
  const noise = 1 + (Math.random() * 0.3 - 0.15);
  const speed = Math.max(3, Math.round(slot.speed * noise));
  const idx   = Math.min(100, Math.round(slot.idx * noise));
  const level: 'clear' | 'slow' | 'heavy' = idx > 70 ? 'heavy' : idx > 35 ? 'slow' : 'clear';
  const eta   = Math.round((1.2 / speed) * 60);
  const delay = Math.round(((1.2 / speed) - (1.2 / NORMAL_SPEED)) * 60);
  const trend = idx > slot.idx ? '▲ Worsening' : '▼ Easing';
  const condition = level === 'heavy' ? '🔴 Heavy' : level === 'slow' ? '🟡 Slow' : '🟢 Clear';
  return { condition, condLevel: level, speed, delay, eta, trend };
}

// ── Sub-components ─────────────────────────────────────────────────────────

function SignalBulbStack({ phase }: { phase: SignalPhase }) {
  const bulbStyle = (color: SignalPhase): React.CSSProperties => ({
    width: 10,
    height: 10,
    borderRadius: '50%',
    background: color === 'red' ? '#f85149' : color === 'yellow' ? '#d29922' : '#3fb950',
    opacity: phase === color ? 1 : 0.18,
    boxShadow: phase === color
      ? `0 0 8px ${color === 'red' ? '#f85149' : color === 'yellow' ? '#d29922' : '#3fb950'}`
      : 'none',
    transition: 'all 0.3s',
  });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center',
      background: '#0d1117', border: '1px solid #30363d', borderRadius: 6, padding: '5px 4px' }}>
      {(['red', 'yellow', 'green'] as SignalPhase[]).map(c => (
        <div key={c} style={bulbStyle(c)} />
      ))}
    </div>
  );
}

function RoadSVG({ level, carPositions }: { level: 'clear' | 'slow' | 'heavy'; carPositions: number[] }) {
  const carColor = level === 'heavy' ? '#f85149' : level === 'slow' ? '#d29922' : '#3fb950';
  return (
    <svg viewBox="0 0 420 90" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 90 }}>
      <rect x="0" y="30" width="420" height="30" rx="4" fill="#21262d" />
      {[40, 100, 160, 220, 280, 340].map(x => (
        <line key={x} x1={x} y1="45" x2={x + 40} y2="45" stroke="#30363d" strokeWidth="2" strokeDasharray="6,6" />
      ))}
      <circle cx="30" cy="45" r="10" fill="#161b22" stroke="#58a6ff" strokeWidth="2" />
      <text x="30" y="49" textAnchor="middle" fontSize="9" fill="#58a6ff" fontWeight="bold">A</text>
      <circle cx="390" cy="45" r="10" fill="#161b22" stroke="#3fb950" strokeWidth="2" />
      <text x="390" y="49" textAnchor="middle" fontSize="9" fill="#3fb950" fontWeight="bold">B</text>
      {carPositions.map((x, i) => (
        <rect key={i} x={x} y="41" width="14" height="8" rx="2" fill={carColor} />
      ))}
      <text x="210" y="80" textAnchor="middle" fontSize="9" fill="#8b949e">~1.2 km  •  Signal A to Signal B</text>
    </svg>
  );
}

function PredictChart() {
  const currentHour = new Date().getHours();
  const chartRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (chartRef.current) {
      const el = chartRef.current.querySelector('.current-hour-row');
      if (el) (el as HTMLElement).scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, []);
  return (
    <div ref={chartRef} style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
      {HOURLY_CONGESTION.map(slot => {
        const isCurrent = slot.h === currentHour;
        const pctBar = Math.max(4, slot.idx);
        const barColor = slot.level === 'heavy' ? '#f85149' : slot.level === 'slow' ? '#d29922' : '#3fb950';
        return (
          <div
            key={slot.h}
            className={isCurrent ? 'current-hour-row' : ''}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10 }}
          >
            <span style={{ width: 32, color: isCurrent ? '#58a6ff' : '#8b949e', textAlign: 'right', fontWeight: isCurrent ? 700 : 400, flexShrink: 0 }}>
              {slot.label}
            </span>
            <div style={{
              flex: 1, height: 10, background: '#21262d', borderRadius: 3, overflow: 'hidden',
              outline: isCurrent ? '1px solid #58a6ff' : 'none', outlineOffset: 1,
            }}>
              <div style={{ width: `${pctBar}%`, height: '100%', background: barColor, borderRadius: 3 }} />
            </div>
            <span style={{ width: 36, color: '#8b949e', flexShrink: 0 }}>{slot.speed}km/h</span>
            {isCurrent && (
              <span style={{
                fontSize: 9, background: '#58a6ff', color: '#0d1117', borderRadius: 10,
                padding: '1px 5px', fontWeight: 700, flexShrink: 0,
              }}>NOW</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Toast ──────────────────────────────────────────────────────────────────

function Toast({ icon, msg, visible }: { icon: string; msg: string; visible: boolean }) {
  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', zIndex: 9999,
      transform: `translateX(-50%) translateY(${visible ? 0 : 80}px)`,
      transition: 'transform 0.35s cubic-bezier(.4,0,.2,1)',
      display: 'flex', alignItems: 'center', gap: 10,
      background: '#161b22', border: '1px solid #30363d', borderRadius: 10,
      padding: '12px 20px', fontSize: 13, color: '#e6edf3',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      pointerEvents: visible ? 'auto' : 'none',
    }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span>{msg}</span>
    </div>
  );
}

// ── Main Page Component ────────────────────────────────────────────────────

export default function CrowdIntelPage() {
  // ── Camera / Sim state
  const videoRef   = useRef<HTMLVideoElement>(null);
  const streamRef  = useRef<MediaStream | null>(null);
  const [camMode, setCamMode]     = useState<'idle' | 'live' | 'sim'>('idle');
  const [showDetBoxes, setShowDetBoxes] = useState(false);

  // ── Analysis state
  const [analysisStep, setAnalysisStep] = useState(0);
  const [analysing, setAnalysing]       = useState(false);
  const [crowdCount, setCrowdCount]     = useState<number | null>(null);
  const [density, setDensity]           = useState<number | null>(null);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [camStatus, setCamStatus]       = useState<'idle' | 'analysing' | 'analysed' | 'sending' | 'broadcast'>('idle');

  // ── Auto-loop state
  const [autoLoopActive, setAutoLoopActive] = useState(false);
  const [autoPaused, setAutoPaused]         = useState(false);
  const [countdown, setCountdown]           = useState<number | null>(null);
  const [lastSync, setLastSync]             = useState('Not synced yet');
  const [autoSendLabel, setAutoSendLabel]   = useState('Start camera or simulation to begin auto-broadcasting');
  const [autoSendDotColor, setAutoSendDotColor] = useState('#8b949e');
  const [autoSendPulse, setAutoSendPulse]   = useState(false);

  // ── Signal A header
  const [sigAPhase, setSigAPhase]       = useState<SignalPhase>('green');
  const [sigABadge, setSigABadge]       = useState<{ text: string; type: 'blue' | 'green' | 'orange' }>({ text: 'Idle', type: 'blue' });
  const [hdrACrowd, setHdrACrowd]       = useState('—');
  const [hdrAProfile, setHdrAProfile]   = useState('—');
  const [hdrADensity, setHdrADensity]   = useState('—');

  // ── Signal B header
  const [sigBPhase, setSigBPhase]       = useState<SignalPhase>('red');
  const [sigBPhaseLabel, setSigBPhaseLabel] = useState('WAITING');
  const [sigBPhaseColor, setSigBPhaseColor] = useState('#8b949e');
  const [sigBBadge, setSigBBadge]       = useState<{ text: string; type: 'blue' | 'green' | 'orange' }>({ text: 'Waiting', type: 'blue' });
  const [liveFeedVisible, setLiveFeedVisible] = useState(false);

  // ── Signal B panel
  const [alerts, setAlerts]       = useState<AlertCard[]>([]);
  const [alertCount, setAlertCount] = useState(0);
  const [ackCount, setAckCount]   = useState(0);
  const [totalRev, setTotalRev]   = useState(0);

  // ── Traffic state
  const [traffic, setTraffic]     = useState<TrafficState>(computeTraffic);
  const [carPositions, setCarPositions] = useState<number[]>(() => {
    return Array.from({ length: NUM_CARS }, (_, i) => 45 + i * 70);
  });
  const [widgetOpen, setWidgetOpen] = useState(true);
  const [sigALightPhase, setSigALightPhase] = useState<SignalPhase>('green');
  const [trafficSpeedLabel, setTrafficSpeedLabel] = useState('— km/h avg');
  const [etaRoad, setEtaRoad]     = useState('—');

  // ── Toast
  const [toast, setToast] = useState({ visible: false, icon: '', msg: '' });
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Refs for loops
  const countdownRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownSecRef = useRef(0);
  const autoPausedRef   = useRef(false);
  const profileRef      = useRef<Profile | null>(null);
  const signalPhaseRef  = useRef<SignalPhase>('green');
  const signalCycleRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const carAnimRef      = useRef<number | null>(null);
  const carPosRef       = useRef<number[]>(Array.from({ length: NUM_CARS }, (_, i) => 45 + i * 70));
  const trafficLevelRef = useRef<'clear' | 'slow' | 'heavy'>('clear');
  const trafficSpeedRef = useRef(40);

  // ── Toast helper
  const showToast = useCallback((icon: string, msg: string) => {
    setToast({ visible: true, icon, msg });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), 3500);
  }, []);

  // ── Traffic: car animation
  const animateCars = useCallback((speedKmh: number) => {
    if (carAnimRef.current) cancelAnimationFrame(carAnimRef.current);
    const pxPerFrame = Math.max(0.2, (speedKmh / 50) * 2.5);
    function step() {
      carPosRef.current = carPosRef.current.map(x => {
        let nx = x + pxPerFrame;
        if (nx > 375) nx = 45;
        return nx;
      });
      setCarPositions([...carPosRef.current]);
      carAnimRef.current = requestAnimationFrame(step);
    }
    carAnimRef.current = requestAnimationFrame(step);
  }, []);

  const initCars = useCallback((level: 'clear' | 'slow' | 'heavy', speed: number) => {
    const spacing = level === 'heavy' ? 28 : level === 'slow' ? 48 : 70;
    carPosRef.current = Array.from({ length: NUM_CARS }, (_, i) => (45 + i * spacing) % 350 + 45);
    trafficLevelRef.current = level;
    trafficSpeedRef.current = speed;
    animateCars(speed);
  }, [animateCars]);

  const refreshTraffic = useCallback(() => {
    const t = computeTraffic();
    setTraffic(t);
    setTrafficSpeedLabel(`${t.speed} km/h avg`);
    setEtaRoad(`${t.eta} min`);
    initCars(t.condLevel, t.speed);
  }, [initCars]);

  // ── Signal A cycling
  const cycleSignal = useCallback(() => {
    const phases: SignalPhase[] = ['green', 'yellow', 'red'];
    let idx = phases.indexOf(signalPhaseRef.current);
    idx = (idx + 1) % phases.length;
    const next = phases[idx];
    signalPhaseRef.current = next;
    setSigALightPhase(next);
    setSigAPhase(next);
    if (signalCycleRef.current) clearTimeout(signalCycleRef.current);
    signalCycleRef.current = setTimeout(cycleSignal, SIGNAL_CYCLE[next]);
  }, []);

  // ── Analysis engine
  const runAnalysis = useCallback(() => {
    const profile = PROFILES[Math.floor(Math.random() * PROFILES.length)];
    profileRef.current = profile;
    setAnalysing(true);
    setAnalysisStep(0);
    setShowDetBoxes(true);
    setCamStatus('analysing');
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setAnalysisStep(step);
      if (step >= ANALYSIS_STEPS.length) {
        clearInterval(interval);
        setTimeout(() => finishAnalysis(profile), 400);
      }
    }, 500);
  }, []); // eslint-disable-line

  const finishAnalysis = useCallback((profile: Profile) => {
    const count   = rand(profile.count[0], profile.count[1]);
    const dens    = rand(profile.density[0], profile.density[1]);
    const densLabel = dens > 70 ? 'High' : dens > 45 ? 'Moderate' : 'Low';
    setAnalysing(false);
    setShowDetBoxes(false);
    setCrowdCount(count);
    setDensity(dens);
    setCurrentProfile(profile);
    setCamStatus('analysed');

    // Header A update
    setSigABadge({ text: 'Live ✓', type: 'green' });
    setHdrACrowd(`${count} people`);
    setHdrAProfile(`${profile.icon} ${profile.name}`);
    setHdrADensity(densLabel);

    setAutoSendLabel('Transmitting to Signal B...');
    setAutoSendDotColor('#58a6ff');
    setAutoSendPulse(true);

    showToast('🔍', `Crowd analysed: ${profile.name} (${count} people) — broadcasting...`);

    // Auto-send after short delay
    setCamStatus('sending');
    setSigBPhase('yellow');
    setSigBPhaseLabel('RECEIVING');
    setSigBPhaseColor('#d29922');
    setSigBBadge({ text: 'Receiving…', type: 'orange' });

    setTimeout(() => {
      setLastSync('Synced ' + new Date().toLocaleTimeString());
      setCamStatus('broadcast');
      setSigBPhase('green');
      setSigBPhaseLabel('ALERTED');
      setSigBPhaseColor('#3fb950');
      setSigBBadge({ text: 'Active ✓', type: 'green' });
      setLiveFeedVisible(true);

      // Add alerts
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const newAlerts: AlertCard[] = profile.shops.map((shop, i) => ({
        id: `alert-${Date.now()}-${i}`,
        shop,
        profile,
        timeStr,
        acked: false,
      }));
      setAlerts(prev => [...newAlerts, ...prev]);
      setAlertCount(prev => prev + 1);
      setTotalRev(prev => prev + profile.shops.reduce((s, sh) => s + sh.revenue, 0));

      showToast('📡', `Auto-broadcast to ${profile.shops.length} shopkeepers near Signal B`);
      setAutoSendLabel(`Auto-broadcasting every ${AUTO_INTERVAL}s — next scan in ${AUTO_INTERVAL}s`);
      setAutoSendDotColor('#3fb950');
      setAutoSendPulse(true);

      if (!autoPausedRef.current) startCountdownLoop();
    }, 900);
  }, [showToast]); // eslint-disable-line

  const startCountdownLoop = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownSecRef.current = AUTO_INTERVAL;
    setCountdown(AUTO_INTERVAL);
    countdownRef.current = setInterval(() => {
      if (autoPausedRef.current) return;
      countdownSecRef.current--;
      setCountdown(countdownSecRef.current);
      if (countdownSecRef.current <= 0) {
        if (countdownRef.current) clearInterval(countdownRef.current);
        setCountdown(null);
        setShowDetBoxes(false);
        setAutoSendLabel('Scanning crowd...');
        setAutoSendDotColor('#d29922');
        setAutoSendPulse(true);
        runAnalysis();
      }
    }, 1000);
  }, [runAnalysis]);

  const activateAutoLoop = useCallback(() => {
    setAutoLoopActive(true);
    setAutoPaused(false);
    autoPausedRef.current = false;
    setLiveFeedVisible(true);
    setAutoSendLabel('Scanning crowd...');
    setAutoSendDotColor('#d29922');
    setAutoSendPulse(true);
    runAnalysis();
  }, [runAnalysis]);

  // ── Camera start
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCamMode('live');
      setSigABadge({ text: 'Live', type: 'green' });
      activateAutoLoop();
    } catch {
      showToast('⚠️', 'Camera access denied. Switching to simulation.');
      startSimulation();
    }
  }, [activateAutoLoop, showToast]); // eslint-disable-line

  const startSimulation = useCallback(() => {
    setCamMode('sim');
    setSigABadge({ text: 'Simulated', type: 'orange' });
    activateAutoLoop();
  }, [activateAutoLoop]);

  // ── Pause / Resume
  const togglePause = useCallback(() => {
    const next = !autoPausedRef.current;
    autoPausedRef.current = next;
    setAutoPaused(next);
    if (next) {
      setAutoSendLabel('Auto-broadcast paused');
      setAutoSendDotColor('#d29922');
      setAutoSendPulse(false);
    } else {
      setAutoSendLabel(`Auto-broadcasting every ${AUTO_INTERVAL}s...`);
      setAutoSendDotColor('#3fb950');
      setAutoSendPulse(true);
      // Resume countdown
      countdownRef.current = setInterval(() => {
        countdownSecRef.current--;
        setCountdown(countdownSecRef.current);
        if (countdownSecRef.current <= 0) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          setCountdown(null);
          setShowDetBoxes(false);
          setAutoSendLabel('Scanning crowd...');
          setAutoSendDotColor('#d29922');
          setAutoSendPulse(true);
          runAnalysis();
        }
      }, 1000);
    }
  }, [runAnalysis]);

  // ── Acknowledge alert
  const ackAlert = useCallback((id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, acked: true } : a));
    setAckCount(prev => prev + 1);
  }, []);

  // ── Clear alerts
  const clearAlerts = useCallback(() => {
    setAlerts([]);
    setAlertCount(0);
    setAckCount(0);
    setTotalRev(0);
  }, []);

  // ── Init traffic on mount
  useEffect(() => {
    refreshTraffic();
    const trafficInterval = setInterval(refreshTraffic, 8000);
    cycleSignal();
    return () => {
      clearInterval(trafficInterval);
      if (signalCycleRef.current) clearTimeout(signalCycleRef.current);
      if (carAnimRef.current) cancelAnimationFrame(carAnimRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      // stop camera stream
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []); // eslint-disable-line

  // ── Derived display values
  const densLabel   = density !== null ? (density > 70 ? 'High' : density > 45 ? 'Moderate' : 'Low') : '—';
  const analysisBarPct = analysing ? Math.round((analysisStep / ANALYSIS_STEPS.length) * 100) : 100;
  const sigAPhaseLabel: Record<SignalPhase, string> = { green: 'GREEN', yellow: 'YELLOW', red: 'RED' };
  const sigAPhaseColor: Record<SignalPhase, string> = { green: '#3fb950', yellow: '#d29922', red: '#f85149' };
  const badgeStyle = (type: 'blue' | 'green' | 'orange' | 'red'): React.CSSProperties => ({
    fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 600,
    background: type === 'blue' ? 'rgba(88,166,255,0.15)' : type === 'green' ? 'rgba(63,185,80,0.15)' : type === 'orange' ? 'rgba(255,166,87,0.15)' : 'rgba(248,81,73,0.15)',
    color: type === 'blue' ? '#58a6ff' : type === 'green' ? '#3fb950' : type === 'orange' ? '#ffa657' : '#f85149',
  });
  const priorityColor: Record<string, string> = { high: '#f85149', medium: '#d29922', low: '#3fb950' };
  const condStyle: React.CSSProperties = {
    color: traffic.condLevel === 'heavy' ? '#f85149' : traffic.condLevel === 'slow' ? '#d29922' : '#3fb950',
    fontSize: 14, fontWeight: 700,
  };
  const camStatusBadge = {
    idle: { text: 'Idle', type: 'blue' as const },
    analysing: { text: 'Analysing...', type: 'blue' as const },
    analysed: { text: 'Analysed ✓', type: 'green' as const },
    sending: { text: 'Sending...', type: 'blue' as const },
    broadcast: { text: 'Broadcast ✓', type: 'green' as const },
  }[camStatus];

  // ── Styles ──

  const S = {
    page: {
      background: '#0d1117', minHeight: '100vh', color: '#e6edf3',
      fontFamily: '-apple-system, "Segoe UI", system-ui, sans-serif',
      fontSize: 14, lineHeight: 1.6,
    } as React.CSSProperties,
    header: {
      background: '#161b22', borderBottom: '1px solid #30363d',
      position: 'sticky' as const, top: 0, zIndex: 100,
    },
    signalBar: {
      display: 'flex', borderBottom: '1px solid #30363d',
    },
    signalBlock: {
      flex: 1, display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 16px', borderRight: '1px solid #30363d',
    },
    headerTop: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '8px 16px',
    },
    trafficStrip: {
      background: '#161b22', borderBottom: '1px solid #30363d',
      display: 'grid', gridTemplateColumns: 'minmax(0,2fr) minmax(0,1fr) minmax(0,1.6fr)',
      gap: 0,
    } as React.CSSProperties,
    trafficStripCollapsed: {
      gridTemplateColumns: '1fr', overflow: 'hidden',
    },
    stripCol: {
      padding: '10px 14px', borderRight: '1px solid #30363d',
    },
    stripTitle: {
      fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#8b949e',
      textTransform: 'uppercase' as const, marginBottom: 8,
    },
    panelsRow: {
      display: 'grid', gridTemplateColumns: '1fr 1fr',
    } as React.CSSProperties,
    panel: {
      borderRight: '1px solid #30363d', display: 'flex', flexDirection: 'column' as const,
      minHeight: '70vh',
    },
    panelHeader: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 16px', borderBottom: '1px solid #30363d', background: '#161b22',
      position: 'sticky' as const, top: 56, zIndex: 10,
    },
    panelTitle: {
      display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 13,
    },
    panelBody: {
      padding: 16, flex: 1, overflowY: 'auto' as const,
    },
    cameraWrap: {
      width: '100%', aspectRatio: '16/9', background: '#0d1117',
      borderRadius: 8, overflow: 'hidden', position: 'relative' as const,
      marginBottom: 14, border: '1px solid #30363d',
    },
    btn: {
      padding: '8px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600,
      cursor: 'pointer', transition: 'all 0.2s',
    },
    sectionLabel: {
      fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#8b949e',
      textTransform: 'uppercase' as const, marginBottom: 8,
    },
    divider: { border: 'none', borderTop: '1px solid #30363d', margin: '14px 0' },
    insightCard: {
      background: '#21262d', border: '1px solid #30363d', borderRadius: 8, padding: '10px 12px',
    },
    statBox: {
      flex: 1, background: '#21262d', border: '1px solid #30363d', borderRadius: 8,
      padding: '10px 12px', textAlign: 'center' as const,
    },
    alertCard: (priority: string): React.CSSProperties => ({
      background: '#161b22', border: '1px solid #30363d', borderRadius: 8,
      padding: 14, position: 'relative', overflow: 'hidden',
      animation: 'slideIn 0.3s ease',
      borderLeft: `3px solid ${priorityColor[priority] || '#30363d'}`,
    }),
    chip: (hot: boolean): React.CSSProperties => ({
      fontSize: 11, padding: '3px 9px', borderRadius: 20,
      background: hot ? 'rgba(255,166,87,0.15)' : '#21262d',
      color: hot ? '#ffa657' : '#8b949e',
      border: `1px solid ${hot ? 'rgba(255,166,87,0.3)' : '#30363d'}`,
      fontWeight: hot ? 700 : 400,
    }),
    ackBtn: (acked: boolean): React.CSSProperties => ({
      padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: acked ? 'default' : 'pointer',
      background: acked ? 'rgba(63,185,80,0.1)' : 'transparent',
      border: `1px solid ${acked ? '#3fb950' : '#30363d'}`,
      color: acked ? '#3fb950' : '#8b949e',
      transition: 'all 0.2s',
    }),
    pillStatus: {
      display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
      background: '#21262d', borderRadius: 7, marginBottom: 7, border: '1px solid #30363d',
    },
    emptyState: {
      display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 12,
      padding: '40px 20px', color: '#8b949e', textAlign: 'center' as const,
    },
  };

  return (
    <div style={S.page}>
      {/* ── HEADER ── */}
      <header style={S.header}>
        {/* Signal status bar */}
        <div style={S.signalBar}>
          {/* Signal A */}
          <div style={S.signalBlock}>
            <SignalBulbStack phase={sigAPhase} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <span style={{ fontSize: 12, fontWeight: 700 }}>Signal A — Camera</span>
                <span style={badgeStyle(sigABadge.type)}>{sigABadge.text}</span>
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: sigAPhaseColor[sigAPhase], marginBottom: 2 }}>
                {sigAPhaseLabel[sigAPhase]}
              </div>
              <div style={{ display: 'flex', gap: 10, fontSize: 11, color: '#8b949e', flexWrap: 'wrap' as const }}>
                <span>Crowd: <strong style={{ color: '#e6edf3' }}>{hdrACrowd}</strong></span>
                <span>Profile: <strong style={{ color: '#e6edf3' }}>{hdrAProfile}</strong></span>
                <span>Density: <strong style={{ color: '#e6edf3' }}>{hdrADensity}</strong></span>
              </div>
            </div>
          </div>
          {/* Signal B */}
          <div style={{ ...S.signalBlock, borderRight: 'none' }}>
            <SignalBulbStack phase={sigBPhase} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <span style={{ fontSize: 12, fontWeight: 700 }}>Signal B — Shopkeepers</span>
                <span style={badgeStyle(sigBBadge.type)}>{sigBBadge.text}</span>
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: sigBPhaseColor, marginBottom: 2 }}>
                {sigBPhaseLabel}
              </div>
              <div style={{ display: 'flex', gap: 10, fontSize: 11, color: '#8b949e', flexWrap: 'wrap' as const }}>
                <span>Broadcasts: <strong style={{ color: '#e6edf3' }}>{alertCount}</strong></span>
                <span>Ack'd: <strong style={{ color: '#e6edf3' }}>{ackCount}</strong></span>
                <span>Revenue opp: <strong style={{ color: '#e6edf3' }}>₹{(totalRev / 1000).toFixed(1)}k</strong></span>
              </div>
            </div>
          </div>
        </div>
        {/* Logo row */}
        <div style={S.headerTop}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 24, lineHeight: 1 }}>🚦</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15 }}>TrafficCrowd Intel</div>
              <div style={{ fontSize: 11, color: '#8b949e' }}>Smart Signal System</div>
            </div>
          </div>
          <div style={{ fontSize: 11, color: '#8b949e' }}>{lastSync}</div>
        </div>
      </header>

      {/* ── TRAFFIC STRIP ── */}
      <div style={{ background: '#161b22', borderBottom: '1px solid #30363d' }}>
        {/* Toggle bar */}
        <button
          onClick={() => setWidgetOpen(o => !o)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '7px 14px', background: 'transparent', border: 'none', borderBottom: widgetOpen ? '1px solid #30363d' : 'none',
            cursor: 'pointer', color: '#e6edf3',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14 }}>🚦</span>
            <span style={{ fontSize: 12, fontWeight: 700 }}>Live Traffic</span>
            <span style={{
              fontSize: 10, padding: '2px 7px', borderRadius: 20, fontWeight: 600,
              background: traffic.condLevel === 'heavy' ? 'rgba(248,81,73,0.15)' : traffic.condLevel === 'slow' ? 'rgba(210,153,34,0.15)' : 'rgba(63,185,80,0.15)',
              color: traffic.condLevel === 'heavy' ? '#f85149' : traffic.condLevel === 'slow' ? '#d29922' : '#3fb950',
            }}>
              {traffic.condition}
            </span>
          </div>
          <span style={{ fontSize: 12, color: '#8b949e' }}>{widgetOpen ? '▲' : '▼'}</span>
        </button>

        {widgetOpen && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0,2fr) minmax(0,1fr) minmax(0,1.6fr)',
          }}>
            {/* Map col */}
            <div style={{ ...S.stripCol, borderRight: '1px solid #30363d' }}>
              <div style={S.stripTitle}>🗺 Signal A → Signal B — Live Road</div>
              <RoadSVG level={traffic.condLevel} carPositions={carPositions} />
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 4 }}>
                <span style={{ fontSize: 11, color: '#8b949e' }}>Signal A:</span>
                <div style={{
                  width: 12, height: 12, borderRadius: '50%',
                  background: sigAPhaseColor[sigALightPhase],
                }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: sigAPhaseColor[sigALightPhase] }}>
                  {sigAPhaseLabel[sigALightPhase]}
                </span>
                <span style={{ fontSize: 11, color: '#8b949e', marginLeft: 10 }}>→ B in</span>
                <span style={{ fontSize: 11, fontWeight: 700 }}>{etaRoad}</span>
                <span style={{ fontSize: 11, color: '#8b949e', marginLeft: 'auto' }}>{trafficSpeedLabel}</span>
              </div>
            </div>

            {/* Status col */}
            <div style={{ ...S.stripCol, borderRight: '1px solid #30363d' }}>
              <div style={S.stripTitle}>🚦 Live Traffic Status</div>
              <div style={S.pillStatus}>
                <span style={{ fontSize: 16 }}>🛣️</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: '#8b949e' }}>Road Condition</div>
                  <div style={condStyle}>{traffic.condition}</div>
                </div>
                <span style={{ fontSize: 11, color: '#8b949e' }}>{traffic.trend}</span>
              </div>
              <div style={S.pillStatus}>
                <span style={{ fontSize: 16 }}>⚡</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: '#8b949e' }}>Avg Speed</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{traffic.speed} km/h</div>
                </div>
                <span style={{ fontSize: 11, color: '#8b949e' }}>
                  {traffic.speed < NORMAL_SPEED ? `↓ ${NORMAL_SPEED - traffic.speed} vs normal` : '↑ Normal'}
                </span>
              </div>
              <div style={S.pillStatus}>
                <span style={{ fontSize: 16 }}>⏱️</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: '#8b949e' }}>Delay vs Normal</div>
                  <div style={{
                    fontSize: 14, fontWeight: 700,
                    color: traffic.delay > 3 ? '#f85149' : traffic.delay > 1 ? '#d29922' : '#3fb950',
                  }}>
                    {traffic.delay > 0 ? `+${traffic.delay} min` : 'On time'}
                  </div>
                </div>
              </div>
            </div>

            {/* Predict col */}
            <div style={S.stripCol}>
              <div style={S.stripTitle}>📈 Predictive Traffic — Today's Forecast</div>
              <PredictChart />
            </div>
          </div>
        )}
      </div>

      {/* ── MAIN PANELS ── */}
      <div style={S.panelsRow}>

        {/* ═══ PANEL A — Camera Analysis ═══ */}
        <div style={S.panel}>
          <div style={S.panelHeader}>
            <div style={S.panelTitle}>
              <span>📷 Signal A — Camera Analysis</span>
              <span style={badgeStyle(camStatusBadge.type)}>{camStatusBadge.text}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {autoLoopActive && countdown !== null && (
                <span style={{ fontSize: 11, color: '#8b949e' }}>
                  Next scan in <strong style={{ color: '#e6edf3' }}>{countdown}</strong>s
                </span>
              )}
              {autoLoopActive && (
                <button
                  onClick={togglePause}
                  style={{
                    ...S.btn,
                    background: 'transparent', border: '1px solid #30363d', color: '#e6edf3',
                    padding: '4px 10px', fontSize: 11,
                  }}
                >
                  {autoPaused ? '▶ Resume' : '⏸ Pause'}
                </button>
              )}
            </div>
          </div>

          <div style={S.panelBody}>
            {/* Camera wrap */}
            <div style={S.cameraWrap}>
              {/* Placeholder / Sim display */}
              {camMode === 'idle' && (
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 8, color: '#8b949e',
                }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.4 }}>
                    <path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                  </svg>
                  <span style={{ fontSize: 13 }}>Camera not started</span>
                </div>
              )}
              {camMode === 'sim' && (
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 8, color: '#8b949e',
                }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.6 }}>
                    <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8m-4-4v4"/>
                  </svg>
                  <span style={{ color: '#58a6ff', fontWeight: 600, fontSize: 13 }}>Simulation Mode</span>
                  <span style={{ fontSize: 12 }}>Auto-broadcasting every 30s...</span>
                </div>
              )}
              {/* Video element for live camera */}
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                style={{ display: camMode === 'live' ? 'block' : 'none', width: '100%', height: '100%', objectFit: 'cover' }}
              />
              {/* LIVE badge */}
              {(camMode === 'live' || camMode === 'sim') && (
                <div style={{
                  position: 'absolute', top: 10, left: 10, display: 'flex', alignItems: 'center', gap: 5,
                  background: 'rgba(248,81,73,0.9)', color: '#fff', borderRadius: 20, padding: '3px 10px',
                  fontSize: 11, fontWeight: 700,
                }}>
                  <span style={{
                    width: 7, height: 7, borderRadius: '50%', background: '#fff',
                    animation: 'pulse 1.4s infinite',
                  }} />
                  LIVE
                </div>
              )}
              {/* Detection boxes */}
              {showDetBoxes && (
                <>
                  {[
                    { top: '20%', left: '15%', width: '18%', height: '30%' },
                    { top: '30%', left: '40%', width: '14%', height: '25%' },
                    { top: '25%', left: '60%', width: '20%', height: '28%' },
                  ].map((box, i) => (
                    <div key={i} style={{
                      position: 'absolute', ...box,
                      border: '1.5px solid #58a6ff', borderRadius: 3,
                      animation: 'pulse 1s infinite',
                    }} />
                  ))}
                </>
              )}
              {/* Start overlay */}
              {camMode === 'idle' && (
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 10,
                  background: 'rgba(13,17,23,0.7)', backdropFilter: 'blur(2px)',
                }}>
                  <button
                    onClick={startCamera}
                    style={{
                      ...S.btn, display: 'flex', alignItems: 'center', gap: 8,
                      background: '#58a6ff', color: '#0d1117', border: 'none', fontSize: 13, padding: '10px 20px',
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                    </svg>
                    Start Camera
                  </button>
                  <span style={{ fontSize: 12, color: '#8b949e' }}>— or —</span>
                  <button
                    onClick={startSimulation}
                    style={{
                      ...S.btn, background: 'transparent', border: '1px solid #30363d', color: '#e6edf3',
                    }}
                  >
                    Use Simulation Mode
                  </button>
                </div>
              )}
              {/* Cam label */}
              {(camMode === 'live' || camMode === 'sim') && (
                <div style={{
                  position: 'absolute', bottom: 8, left: 8, fontSize: 10, color: '#8b949e',
                  background: 'rgba(13,17,23,0.7)', borderRadius: 4, padding: '2px 7px',
                }}>
                  Signal A — Intersection Camera
                </div>
              )}
            </div>

            {/* Analysis progress */}
            {analysing && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#8b949e', marginBottom: 5 }}>
                  <span>{ANALYSIS_STEPS[Math.min(analysisStep, ANALYSIS_STEPS.length - 1)]}</span>
                  <span>{analysisBarPct}%</span>
                </div>
                <div style={{ height: 6, background: '#21262d', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${analysisBarPct}%`, background: '#58a6ff', borderRadius: 3, transition: 'width 0.5s ease' }} />
                </div>
              </div>
            )}

            {/* Crowd count row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <div style={S.sectionLabel}>Crowd at Signal</div>
                <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1 }}>
                  <span style={{ color: '#58a6ff' }}>{crowdCount ?? '—'}</span>
                  <span style={{ fontSize: 14, fontWeight: 400, color: '#8b949e', marginLeft: 6 }}>people</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' as const }}>
                <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>Density</div>
                <div style={{ width: 100, height: 8, background: '#21262d', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${density ?? 0}%`,
                    background: density !== null && density > 70 ? '#f85149' : density !== null && density > 45 ? '#d29922' : '#3fb950',
                    borderRadius: 4, transition: 'width 0.8s ease',
                  }} />
                </div>
                <div style={{ fontSize: 11, color: '#8b949e', marginTop: 3 }}>
                  {density !== null ? `${density}% — ${densLabel}` : '—'}
                </div>
              </div>
            </div>

            <hr style={S.divider} />

            {/* Demographic segments */}
            <div style={S.sectionLabel}>Demographic Segments</div>
            {!currentProfile ? (
              <div style={{ color: '#8b949e', fontSize: 13, marginBottom: 16 }}>
                Start camera or simulation to analyse
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {currentProfile.segments.map(seg => (
                  <div key={seg.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 16, width: 22, textAlign: 'center', flexShrink: 0 }}>{seg.icon}</span>
                    <span style={{ width: 110, fontSize: 13, flexShrink: 0 }}>{seg.name}</span>
                    <div style={{ flex: 1, height: 8, background: '#21262d', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${seg.pct}%`, background: seg.color, borderRadius: 4, transition: 'width 0.8s ease' }} />
                    </div>
                    <span style={{ width: 34, textAlign: 'right', fontSize: 12, color: '#8b949e', flexShrink: 0 }}>{seg.pct}%</span>
                  </div>
                ))}
              </div>
            )}

            <hr style={S.divider} />

            {/* Insight grid */}
            <div style={S.sectionLabel}>Crowd Intelligence</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              {[
                { label: 'Dominant Profile', value: currentProfile ? `${currentProfile.icon} ${currentProfile.name}` : '—' },
                { label: 'Purchasing Power', value: currentProfile?.power ?? '—' },
                { label: 'Peak Item Interest', value: currentProfile?.items[0] ?? '—' },
                { label: 'ETA at Signal B', value: currentProfile?.eta ?? '—' },
              ].map(card => (
                <div key={card.label} style={S.insightCard}>
                  <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>{card.label}</div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{card.value}</div>
                </div>
              ))}
            </div>

            <hr style={S.divider} />

            {/* Auto-send status */}
            <div style={{ background: '#21262d', border: '1px solid #30363d', borderRadius: 8, padding: '10px 14px' }}>
              <div style={{ fontSize: 12, color: '#8b949e', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%', background: autoSendDotColor,
                  display: 'inline-block', flexShrink: 0,
                  animation: autoSendPulse ? 'pulse 1.4s infinite' : 'none',
                }} />
                {autoSendLabel}
              </div>
            </div>
          </div>
        </div>

        {/* ═══ PANEL B — Shopkeeper Alerts ═══ */}
        <div style={{ ...S.panel, borderRight: 'none' }}>
          <div style={S.panelHeader}>
            <div style={S.panelTitle}>
              <span>📡 Signal B — Shopkeeper Alerts</span>
              <span style={badgeStyle(alertCount > 0 ? 'green' : 'blue')}>
                {alertCount} alert{alertCount !== 1 ? 's' : ''}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {liveFeedVisible && (
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'rgba(63,185,80,0.15)', color: '#3fb950', fontWeight: 600 }}>
                  ● LIVE FEED
                </span>
              )}
              <button
                onClick={clearAlerts}
                style={{ ...S.btn, background: 'transparent', border: '1px solid #30363d', color: '#e6edf3', padding: '4px 10px', fontSize: 11 }}
              >
                Clear
              </button>
            </div>
          </div>

          <div style={S.panelBody}>
            {/* Stats row */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <div style={S.statBox}>
                <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1 }}>{alertCount}</div>
                <div style={{ fontSize: 11, color: '#8b949e', marginTop: 3 }}>Broadcasts</div>
              </div>
              <div style={S.statBox}>
                <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1 }}>{ackCount}</div>
                <div style={{ fontSize: 11, color: '#8b949e', marginTop: 3 }}>Acknowledged</div>
              </div>
              <div style={S.statBox}>
                <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1, color: '#3fb950' }}>
                  ₹{(totalRev / 1000).toFixed(1)}k
                </div>
                <div style={{ fontSize: 11, color: '#8b949e', marginTop: 3 }}>Revenue opp.</div>
              </div>
            </div>

            {/* Alert stream */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {alerts.length === 0 ? (
                <div style={S.emptyState}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.3 }}>
                    <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
                    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
                    <line x1="6" y1="1" x2="6" y2="4"/>
                    <line x1="10" y1="1" x2="10" y2="4"/>
                    <line x1="14" y1="1" x2="14" y2="4"/>
                  </svg>
                  <p style={{ fontSize: 13, margin: 0 }}>
                    No alerts yet.<br />Start camera or simulation — alerts will auto-appear here.
                  </p>
                </div>
              ) : (
                alerts.map(alert => {
                  const priorityLabel = alert.shop.priority === 'high' ? '🔴 High Priority'
                    : alert.shop.priority === 'medium' ? '🟡 Moderate' : '🟢 Routine';
                  return (
                    <div key={alert.id} style={S.alertCard(alert.shop.priority)}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                          {alert.shop.emoji} {alert.shop.name}
                        </div>
                        <span style={{ fontSize: 11, color: '#8b949e', flexShrink: 0 }}>{alert.timeStr}</span>
                      </div>
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12,
                        background: 'rgba(88,166,255,0.1)', color: '#58a6ff',
                        borderRadius: 6, padding: '3px 10px', marginBottom: 8,
                      }}>
                        {alert.profile.icon} Incoming: <strong style={{ marginLeft: 4 }}>{alert.profile.name}</strong>
                        &nbsp;•&nbsp; {priorityLabel}
                      </div>
                      <div style={{ fontSize: 13, color: '#8b949e', marginBottom: 10, lineHeight: 1.5 }}>
                        {alert.shop.desc}
                      </div>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#8b949e', textTransform: 'uppercase', marginBottom: 6 }}>
                        Recommended to stock/prepare
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                        {alert.shop.products.map((p, pi) => (
                          <span key={pi} style={S.chip(pi === 0)}>{p}</span>
                        ))}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ fontSize: 12, color: '#8b949e', display: 'flex', alignItems: 'center', gap: 5 }}>
                          ⏱ ETA at Signal B: <strong style={{ color: '#e6edf3', marginLeft: 4 }}>{alert.profile.eta}</strong>
                          &nbsp;•&nbsp; Est. revenue: <strong style={{ color: '#3fb950', marginLeft: 4 }}>₹{alert.shop.revenue.toLocaleString('en-IN')}</strong>
                        </div>
                        <button
                          disabled={alert.acked}
                          onClick={() => ackAlert(alert.id)}
                          style={S.ackBtn(alert.acked)}
                        >
                          {alert.acked ? '✓ Acknowledged' : 'Acknowledge'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── TOAST ── */}
      <Toast icon={toast.icon} msg={toast.msg} visible={toast.visible} />

      {/* ── Keyframe styles ── */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 768px) {
          .crowd-intel-panels {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
