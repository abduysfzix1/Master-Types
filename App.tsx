import { useEffect, useMemo, useRef, useState } from 'react'
import { Activity, ArrowDownRight, ArrowRight, Award, BarChart3, ChevronDown, CircleHelp, Clock3, Command, Crown, Gauge, Keyboard, Menu, Play, RotateCcw, Settings2, ShieldCheck, Sparkles, Target, Trophy, UserRound, X, Zap } from 'lucide-react'
import { motion } from 'motion/react'

type Page = 'home' | 'test' | 'practice' | 'leaderboard' | 'dashboard'
type Result = { wpm: number; accuracy: number; errors: number; duration: number; date: string }
const passages = [
  'Great things are done by a series of small things brought together.',
  'The secret of getting ahead is getting started. Focus on progress, not perfection.',
  'Practice is the quiet engine behind every remarkable skill. Show up and improve.',
  'Technology is best when it brings people together and makes difficult things simple.',
]
const savedResults = (): Result[] => { try { return JSON.parse(localStorage.getItem('mt-results') || '[]') } catch { return [] } }

function App() {
  const [page, setPage] = useState<Page>('home')
  const [mobileNav, setMobileNav] = useState(false)
  const [duration, setDuration] = useState(30)
  const [text, setText] = useState(passages[0])
  const [typed, setTyped] = useState('')
  const [remaining, setRemaining] = useState(30)
  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)
  const [results, setResults] = useState<Result[]>(savedResults)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const startedAt = useRef<number | null>(null)
  const correct = useMemo(() => [...typed].filter((c, i) => c === text[i]).length, [typed, text])
  const errors = Math.max(0, typed.length - correct)
  const accuracy = typed.length ? Math.round(correct / typed.length * 100) : 100
  const elapsed = duration - remaining
  const wpm = elapsed > 0 ? Math.round((correct / 5) / (elapsed / 60)) : 0
  const best = results.length ? Math.max(...results.map(r => r.wpm)) : 0
  const avg = results.length ? Math.round(results.reduce((a, r) => a + r.wpm, 0) / results.length) : 0

  useEffect(() => { if (!running) return; const id = window.setInterval(() => setRemaining(v => { if (v <= 1) { window.clearInterval(id); setRunning(false); setFinished(true); return 0 } return v - 1 }), 1000); return () => window.clearInterval(id) }, [running])
  useEffect(() => { if (running && typed.length >= text.length) { setRunning(false); setFinished(true) } }, [typed, text, running])
  useEffect(() => { if (finished) { const seconds = Math.max(1, duration - remaining); const score = { wpm: Math.round((correct / 5) / (seconds / 60)), accuracy, errors, duration, date: new Date().toISOString() }; setResults(prev => { const next = [score, ...prev].slice(0, 30); localStorage.setItem('mt-results', JSON.stringify(next)); return next }) } // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished])
  const begin = (target: Page = 'test') => { setPage(target); setTyped(''); setRemaining(duration); setRunning(false); setFinished(false); setText(passages[Math.floor(Math.random() * passages.length)]); startedAt.current = null; window.setTimeout(() => inputRef.current?.focus(), 100) }
  const changePage = (p: Page) => { setPage(p); setMobileNav(false) }
  const onType = (value: string) => { if (finished || value.length > text.length) return; if (!running && value.length) setRunning(true); setTyped(value) }
  const navItems: { id: Page; label: string }[] = [{ id: 'home', label: 'Home' }, { id: 'test', label: 'Typing test' }, { id: 'practice', label: 'Practice' }, { id: 'leaderboard', label: 'Leaderboard' }]
  return <div className="app-shell">
    <div className="ambient ambient-one" /><div className="ambient ambient-two" />
    <header className="topbar">
      <button className="brand" onClick={() => changePage('home')} aria-label="Master Typing home"><span className="brand-mark"><Keyboard size={20}/></span><span>MASTER<span className="green">TYPING</span><small>TYPE WITH INTENTION</small></span></button>
      <nav className={mobileNav ? 'nav-links open' : 'nav-links'}>{navItems.map(n => <button key={n.id} className={page === n.id ? 'nav-link active' : 'nav-link'} onClick={() => n.id === 'test' ? begin('test') : changePage(n.id)}>{n.label}</button>)}</nav>
      <div className="nav-actions"><button className="icon-button" title="Dashboard" onClick={() => changePage('dashboard')}><BarChart3 size={18}/></button><button className="profile-button" onClick={() => changePage('dashboard')}><span className="avatar">G</span><span>Guest</span><ChevronDown size={14}/></button><button className="mobile-menu" onClick={() => setMobileNav(!mobileNav)}>{mobileNav ? <X/> : <Menu/>}</button></div>
    </header>
    <main>
      {page === 'home' && <Home onStart={() => begin('test')} onPractice={() => begin('practice')} onLeaderboard={() => changePage('leaderboard')} best={best} />}
      {(page === 'test' || page === 'practice') && <section className="page-wrap test-page">
        <div className="eyebrow"><span className="pulse-dot"/> {page === 'practice' ? 'PRACTICE ARENA' : 'SPEED CHALLENGE'}</div>
        <h1 className="page-title">{page === 'practice' ? <>Build your <em>rhythm.</em></> : <>Find your <em>flow state.</em></>}</h1>
        <p className="page-subtitle">Focus on the text. Let your fingers do the work.</p>
        <div className="test-toolbar">
          <div className="duration-select"><span className="muted-label">DURATION</span>{[15,30,60,120].map(d => <button key={d} onClick={() => {setDuration(d);setRemaining(d);setTyped('');setRunning(false);setFinished(false)}} className={duration === d ? 'duration active' : 'duration'}>{d}s</button>)}</div>
          <button className="subtle-button" onClick={() => begin(page)}><RotateCcw size={15}/> Restart</button>
        </div>
        <div className="metrics-row"><Metric icon={<Clock3/>} label="TIME LEFT" value={`${remaining}s`}/><Metric icon={<Gauge/>} label="LIVE WPM" value={String(wpm).padStart(2,'0')}/><Metric icon={<Target/>} label="ACCURACY" value={`${accuracy}%`}/><Metric icon={<Activity/>} label="ERRORS" value={String(errors).padStart(2,'0')}/></div>
        <div className="typing-card">
          <div className="typing-card-head"><span><span className="live-indicator"/> LIVE SESSION</span><span className="mono">ENGLISH · GENERAL</span></div>
          {!finished ? <><div className="passage" onClick={() => inputRef.current?.focus()}>{[...text].map((char, i) => <span key={i} className={i < typed.length ? (typed[i] === char ? 'char correct' : 'char wrong') : i === typed.length ? 'char cursor' : 'char'}>{char}</span>)}</div><textarea ref={inputRef} value={typed} onChange={e => onType(e.target.value)} onPaste={e => e.preventDefault()} placeholder="Start typing here…" className="typing-input" spellCheck={false} autoCapitalize="off" autoComplete="off" aria-label="Type the passage above"/><div className="typing-hint"><span> <kbd>tab</kbd> + <kbd>enter</kbd> restart</span><span>{typed.length} / {text.length} characters</span></div></> : <div className="result-panel"><div className="result-icon"><Trophy size={28}/></div><h2>Session complete.</h2><p>Every keystroke is a step forward.</p><div className="result-stats"><div><strong>{wpm}</strong><small>WPM</small></div><div><strong>{accuracy}%</strong><small>ACCURACY</small></div><div><strong>{errors}</strong><small>ERRORS</small></div></div><button className="primary-button" onClick={() => begin(page)}>Try again <ArrowRight size={17}/></button></div>}
        </div>
        <div className="test-bottom"><span><ShieldCheck size={15}/> Your practice stats are saved on this device.</span><span>Tip: Accuracy first. Speed follows.</span></div>
      </section>}
      {page === 'dashboard' && <section className="page-wrap"><div className="eyebrow"><span className="pulse-dot"/> YOUR PERFORMANCE</div><h1 className="page-title">Your progress, <em>in focus.</em></h1><p className="page-subtitle">A clear picture of the work you're putting in.</p><div className="dashboard-grid"><div className="dash-card"><span className="muted-label">PERSONAL BEST</span><strong className="big-number">{best}<small> WPM</small></strong><span className="green-note"><Zap size={14}/> {results.length ? 'Your fastest recorded session' : 'Complete a test to set your record'}</span></div><div className="dash-card"><span className="muted-label">AVERAGE SPEED</span><strong className="big-number">{avg}<small> WPM</small></strong><span className="green-note">Across {results.length} sessions</span></div><div className="dash-card"><span className="muted-label">TESTS COMPLETED</span><strong className="big-number">{results.length}</strong><span className="green-note">Keep building consistency</span></div></div><div className="section-heading"><div><span className="eyebrow">SESSION LOG</span><h2>Recent activity</h2></div><button className="text-button" onClick={() => begin('test')}>New test <ArrowRight size={15}/></button></div><div className="table-card">{results.length ? <table><thead><tr><th>DATE</th><th>WPM</th><th>ACCURACY</th><th>ERRORS</th><th>TIME</th></tr></thead><tbody>{results.map((r,i)=><tr key={i}><td>{new Date(r.date).toLocaleString()}</td><td className="green">{r.wpm}</td><td>{r.accuracy}%</td><td>{r.errors}</td><td>{r.duration}s</td></tr>)}</tbody></table> : <Empty icon={<BarChart3/>} title="Your story starts here" text="Complete your first typing test and your results will appear here." action={() => begin('test')}/>}</div></section>}
      {page === 'leaderboard' && <section className="page-wrap"><div className="eyebrow"><span className="pulse-dot"/> THE GLOBAL GRID</div><h1 className="page-title">A little friendly <em>competition.</em></h1><p className="page-subtitle">The leaderboard will come alive when player accounts and verified scores are connected.</p><div className="leaderboard-empty"><div className="leader-art"><Trophy size={44}/><span className="orbit orbit-a"/><span className="orbit orbit-b"/></div><span className="eyebrow">COMING ONLINE</span><h2>Make your mark.</h2><p>We're preparing the competitive arena. Your personal results are saved locally for now; global rankings require the live database.</p><button className="primary-button" onClick={() => begin('test')}>Set your first score <ArrowRight size={16}/></button></div></section>}
    </main>
    <footer className="footer"><div className="footer-brand"><span className="brand-mark"><Keyboard size={17}/></span><strong>MASTER<span className="green">TYPING</span></strong></div><span>Type faster. Think sharper. Master every keystroke.</span><span className="footer-right">BUILT FOR THE NEXT KEYSTROKE <span className="green">↗</span></span></footer>
  </div>
}

function Home({onStart,onPractice,onLeaderboard,best}:{onStart:()=>void;onPractice:()=>void;onLeaderboard:()=>void;best:number}) {
  return <><section className="hero page-wrap"><div className="hero-copy"><div className="eyebrow"><span className="pulse-dot"/> THE NEXT LEVEL OF TYPING</div><h1>Master your<br/>typing <em>speed.</em></h1><p className="hero-description">A focused space to sharpen your accuracy, build your rhythm, and push beyond your personal best.</p><div className="hero-buttons"><button className="primary-button" onClick={onStart}><Play size={16} fill="currentColor"/> Start typing test <ArrowRight size={16}/></button><button className="secondary-button" onClick={onPractice}>Explore practice <ArrowDownRight size={16}/></button></div><div className="hero-proof"><div className="proof-avatars"><span>⌘</span><span>⌁</span><span>✳</span></div><span><strong>One keystroke at a time.</strong><small>Your next best starts now.</small></span></div></div><KeyboardVisual/></section>
  <section className="ticker"><div className="ticker-track">{['PRECISION','CONSISTENCY','MOMENTUM','PROGRESS','PRECISION','CONSISTENCY','MOMENTUM','PROGRESS'].map((x,i)=><span key={i}>{x}<b>✳</b></span>)}</div></section>
  <section className="page-wrap stats-strip"><div><strong>15<span>s</span></strong><small>QUICK SPRINT</small></div><div><strong>120<span>s</span></strong><small>DEEP FOCUS</small></div><div><strong>{best || '—'}<span> WPM</span></strong><small>YOUR PERSONAL BEST</small></div><div><strong>∞</strong><small>ROOM TO IMPROVE</small></div></section>
  <section className="page-wrap features-section"><div className="section-heading"><div><span className="eyebrow">THE TOOLKIT</span><h2>Small details. <em>Big progress.</em></h2></div><span className="section-note">Everything you need to make<br/>every keystroke count.</span></div><div className="feature-grid"><Feature icon={<Gauge/>} number="01" title="Measure your pace" text="Track words per minute, accuracy, and errors as you type."/><Feature icon={<Target/>} number="02" title="Train with purpose" text="Choose your session length and build a practice habit that sticks."/><Feature icon={<Trophy/>} number="03" title="Beat your best" text="Keep your session history and turn small wins into lasting progress."/></div></section>
  <section className="page-wrap challenge-banner"><div><span className="eyebrow">YOUR NEXT CHALLENGE</span><h2>Ready when <em>you are.</em></h2><p>Thirty seconds. One passage. A chance to get a little better.</p><button className="primary-button" onClick={onStart}>Take the challenge <ArrowRight size={16}/></button></div><div className="challenge-glyph"><Command size={100}/><span>30 SEC<br/>CHALLENGE</span></div></section>
  <section className="page-wrap leaderboard-tease"><div><span className="eyebrow">COMPETE & CONNECT</span><h2>The global grid is <em>coming.</em></h2><p>Verified scores and player profiles will arrive with account and database setup.</p></div><button className="secondary-button" onClick={onLeaderboard}>Explore leaderboard <ArrowRight size={16}/></button></section></>
}
function KeyboardVisual() {
  const rows = ['1234567890','QWERTYUIOP','ASDFGHJKL','ZXCVBNM']
  return <motion.div className="keyboard-stage" initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{duration:.8,delay:.15}}><div className="stage-glow"/><div className="floating-tag tag-top"><span className="pulse-dot"/> LIVE PRACTICE</div><div className="floating-tag tag-bottom"><Zap size={13}/> PRECISION MODE</div><motion.div className="keyboard-3d" animate={{rotateX:[10,13,10],rotateZ:[-8,-6,-8],y:[0,-7,0]}} transition={{duration:7,repeat:Infinity,ease:'easeInOut'}}><div className="keyboard-top"><div className="keyboard-brand">MT<span> / </span>01</div>{rows.map((row,ri)=><div className="key-row" key={row}>{[...row].map((key,i)=><span className={`keycap ${(ri===1&&i===1)||(ri===2&&i===3)||(ri===3&&i===2)||(ri===0&&i===4)?'key-green':''}`} key={key}>{key}</span>)}</div>)}<div className="key-row bottom-row"><span className="keycap wide">CTRL</span><span className="keycap">⌘</span><span className="keycap spacebar"/><span className="keycap">ALT</span><span className="keycap wide">↵</span></div></div><div className="keyboard-front"/></motion.div><div className="stage-caption"><span>01 / INTERACTIVE PRACTICE</span><span>DESIGNED TO FOCUS <span className="green">✳</span></span></div></motion.div>
}
function Metric({icon,label,value}:{icon:React.ReactNode;label:string;value:string}) { return <div className="metric"><span className="metric-icon">{icon}</span><span className="muted-label">{label}</span><strong>{value}</strong></div> }
function Feature({icon,number,title,text}:{icon:React.ReactNode;number:string;title:string;text:string}) { return <article className="feature-card"><div className="feature-top"><span className="feature-icon">{icon}</span><span className="mono">{number} / 03</span></div><h3>{title}</h3><p>{text}</p><span className="feature-arrow"><ArrowDownRight size={18}/></span></article> }
function Empty({icon,title,text,action}:{icon:React.ReactNode;title:string;text:string;action:()=>void}) { return <div className="empty-state"><span className="empty-icon">{icon}</span><h3>{title}</h3><p>{text}</p><button className="text-button" onClick={action}>Start a test <ArrowRight size={15}/></button></div> }

export default App
