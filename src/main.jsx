import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowLeft, CalendarDays, CheckCircle2, ChevronRight, Clock3, Copy, Download, Dumbbell, Minus, PlayCircle, Plus, RotateCcw, Search, Star, Trash2 } from 'lucide-react';
import './styles.css';

const STORAGE_KEY = 'mi_entreno_pro_lower_upper_lower_v1';

const workoutPlan = {
  'Día 1 - Pierna fuerza': [
    { name: 'Sentadilla en multipower', muscle: 'Cuádriceps / glúteo', defaultSets: 4, repGoal: '6-8', rest: 90, videoQuery: 'sentadilla multipower tecnica' },
    { name: 'Prensa', muscle: 'Pierna completa', defaultSets: 4, repGoal: '8-12', rest: 90, videoQuery: 'prensa de piernas tecnica' },
    { name: 'Peso muerto rumano con barra', muscle: 'Femoral / glúteo', defaultSets: 3, repGoal: '8-10', rest: 90, videoQuery: 'peso muerto rumano barra tecnica' },
    { name: 'Femoral sentado', muscle: 'Femoral', defaultSets: 3, repGoal: '10-15', rest: 75, videoQuery: 'femoral sentado tecnica' },
    { name: 'Cuádriceps sentado', muscle: 'Cuádriceps', defaultSets: 3, repGoal: '12-15', rest: 75, videoQuery: 'extension cuadriceps sentado tecnica' },
    { name: 'Gemelos en prensa', muscle: 'Gemelos', defaultSets: 3, repGoal: '12-20', rest: 60, videoQuery: 'gemelos en prensa tecnica' }
  ],
  'Día 2 - Torso + core': [
    { name: 'Press banca en multipower', muscle: 'Pecho', defaultSets: 3, repGoal: '8-10', rest: 90, videoQuery: 'press banca multipower tecnica' },
    { name: 'Jalón al pecho en polea', muscle: 'Espalda', defaultSets: 3, repGoal: '8-12', rest: 90, videoQuery: 'jalon al pecho polea tecnica' },
    { name: 'Remo en polea', muscle: 'Espalda', defaultSets: 3, repGoal: '8-12', rest: 75, videoQuery: 'remo en polea tecnica' },
    { name: 'Press militar con mancuernas', muscle: 'Hombro', defaultSets: 3, repGoal: '8-10', rest: 75, videoQuery: 'press militar mancuernas tecnica' },
    { name: 'Face pull en polea', muscle: 'Hombro posterior', defaultSets: 3, repGoal: '12-15', rest: 60, videoQuery: 'face pull polea tecnica' },
    { name: 'Abdominales / core', muscle: 'Core', defaultSets: 3, repGoal: '12-20', rest: 60, videoQuery: 'abdominales maquina tecnica' }
  ],
  'Día 3 - Pierna metabólica': [
    { name: 'Jaca', muscle: 'Cuádriceps / glúteo', defaultSets: 4, repGoal: '10-12', rest: 90, videoQuery: 'sentadilla hack jaca tecnica' },
    { name: 'Zancadas con mancuernas', muscle: 'Pierna / glúteo', defaultSets: 3, repGoal: '10-12 por pierna', rest: 75, videoQuery: 'zancadas mancuernas tecnica' },
    { name: 'Hip thrust con barra', muscle: 'Glúteo', defaultSets: 4, repGoal: '8-12', rest: 90, videoQuery: 'hip thrust barra tecnica' },
    { name: 'Femoral de pie', muscle: 'Femoral', defaultSets: 3, repGoal: '12-15', rest: 75, videoQuery: 'femoral de pie maquina tecnica' },
    { name: 'Extensión de cuádriceps sentado', muscle: 'Cuádriceps', defaultSets: 3, repGoal: '12-15', rest: 60, videoQuery: 'extension cuadriceps sentado tecnica' },
    { name: 'Gemelos o core', muscle: 'Gemelos / core', defaultSets: 3, repGoal: '12-20', rest: 60, videoQuery: 'gemelos core entrenamiento tecnica' }
  ]
};

function todayString() { return new Date().toISOString().slice(0, 10); }
function formatSeconds(total) { const m = Math.floor(total / 60); const s = total % 60; return `${m}:${String(s).padStart(2, '0')}`; }
function buildSets(n) { return Array.from({ length: n }, () => ({ weight: '', reps: '', done: false })); }
function emptyState() { return { logsByDate: {}, notesByDate: {}, favorites: {} }; }
function validRecord(exercise) { return { sets: buildSets(exercise.defaultSets), completed: false, rest: exercise.rest, notes: '' }; }

function App() {
  const [state, setState] = useState(emptyState);
  const [selectedDate, setSelectedDate] = useState(todayString());
  const [selectedDay, setSelectedDay] = useState('Día 1 - Pierna fuerza');
  const [activeExercise, setActiveExercise] = useState(null);
  const [search, setSearch] = useState('');
  const [timerSeconds, setTimerSeconds] = useState(90);
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setState({ ...emptyState(), ...JSON.parse(saved) });
    } catch {}
  }, []);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }, [state]);

  useEffect(() => {
    if (!timerRunning) return;
    const id = setInterval(() => setTimerSeconds(prev => {
      if (prev <= 1) { setTimerRunning(false); return 0; }
      return prev - 1;
    }), 1000);
    return () => clearInterval(id);
  }, [timerRunning]);

  const dayExercises = useMemo(() => {
    const base = workoutPlan[selectedDay] || [];
    const term = search.trim().toLowerCase();
    if (!term) return base;
    return base.filter(e => e.name.toLowerCase().includes(term) || e.muscle.toLowerCase().includes(term));
  }, [selectedDay, search]);

  const getRecord = (day, exercise) => state.logsByDate?.[selectedDate]?.[day]?.[exercise.name] || validRecord(exercise);

  const getLastRecord = (day, exercise) => {
    const dates = Object.keys(state.logsByDate || {}).filter(d => d < selectedDate).sort().reverse();
    for (const date of dates) {
      const rec = state.logsByDate?.[date]?.[day]?.[exercise.name];
      if (rec?.sets?.some(s => s.weight || s.reps || s.done)) return { date, ...rec };
    }
    return null;
  };

  const updateRecord = (day, exercise, updater) => {
    setState(prev => {
      const current = prev.logsByDate?.[selectedDate]?.[day]?.[exercise.name] || validRecord(exercise);
      const updated = typeof updater === 'function' ? updater(current) : updater;
      return { ...prev, logsByDate: { ...prev.logsByDate, [selectedDate]: { ...prev.logsByDate[selectedDate], [day]: { ...(prev.logsByDate[selectedDate]?.[day] || {}), [exercise.name]: updated } } } };
    });
  };

  const openExercise = (exercise) => {
    const rec = getRecord(selectedDay, exercise);
    setActiveExercise(exercise);
    setTimerRunning(false);
    setTimerSeconds(rec.rest || exercise.rest || 90);
  };

  const finishExercise = () => {
    if (!activeExercise) return;
    updateRecord(selectedDay, activeExercise, current => ({ ...current, completed: true }));
    setActiveExercise(null);
    setTimerRunning(false);
  };

  const copyLastToToday = (exercise, last) => {
    if (!last) return;
    updateRecord(selectedDay, exercise, current => ({
      ...current,
      sets: last.sets.map(s => ({ weight: s.weight || '', reps: s.reps || '', done: false })),
      rest: last.rest || exercise.rest,
      completed: false,
      notes: ''
    }));
  };

  const toggleSet = (idx) => {
    updateRecord(selectedDay, activeExercise, current => ({
      ...current,
      sets: current.sets.map((s, i) => i === idx ? { ...s, done: !s.done } : s)
    }));
    setTimerSeconds(getRecord(selectedDay, activeExercise).rest || activeExercise.rest || 90);
    setTimerRunning(true);
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'mi-entreno-pro-datos.json'; a.click(); URL.revokeObjectURL(url);
  };

  const resetAll = () => {
    const clean = emptyState();
    setState(clean); setActiveExercise(null); setTimerRunning(false); localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
  };

  const toggleFavorite = (name) => setState(prev => ({ ...prev, favorites: { ...prev.favorites, [name]: !prev.favorites[name] } }));

  const updateDayNotes = (value) => setState(prev => ({ ...prev, notesByDate: { ...prev.notesByDate, [selectedDate]: { ...prev.notesByDate[selectedDate], [selectedDay]: value } } }));
  const dayNotes = state.notesByDate?.[selectedDate]?.[selectedDay] || '';
  const completedCount = (workoutPlan[selectedDay] || []).filter(e => getRecord(selectedDay, e).completed).length;

  if (activeExercise) {
    const record = getRecord(selectedDay, activeExercise);
    const lastRecord = getLastRecord(selectedDay, activeExercise);
    return <div className="app"><div className="exercise-screen">
      <section className="hero">
        <div className="top-row">
          <button className="btn ghost" onClick={() => { setActiveExercise(null); setTimerRunning(false); }}><ArrowLeft size={18}/> Volver</button>
          <div className="right-title"><small>{selectedDay} · {selectedDate}</small><h1>{activeExercise.name}</h1></div>
        </div>
        <div className="badges"><span>{activeExercise.muscle}</span><span>Objetivo {activeExercise.repGoal}</span></div>
      </section>

      {lastRecord && <section className="panel">
        <div className="panel-head"><div><h2>Último entrenamiento</h2><p>Guardado del {lastRecord.date}</p></div><button className="btn secondary" onClick={() => copyLastToToday(activeExercise, lastRecord)}><Copy size={17}/> Copiar pesos</button></div>
        <div className="last-list">{lastRecord.sets.map((s, i) => <div className="last-row" key={i}><b>Serie {i+1}</b><span>{s.weight || '-'} kg · {s.reps || '-'} reps</span></div>)}</div>
      </section>}

      <section className="timer-card">
        <div><p>Temporizador de descanso</p><strong>{formatSeconds(timerSeconds)}</strong></div>
        <div className="timer-actions"><div><button className="icon" onClick={() => setTimerSeconds(s => Math.max(0, s - 15))}><Minus size={18}/></button><button className="icon" onClick={() => setTimerSeconds(s => s + 15)}><Plus size={18}/></button></div><div><button className="btn dark" onClick={() => setTimerRunning(v => !v)}><Clock3 size={17}/>{timerRunning ? 'Pausar' : 'Iniciar'}</button><button className="btn secondary" onClick={() => { setTimerRunning(false); setTimerSeconds(record.rest || activeExercise.rest); }}><RotateCcw size={17}/> Reset</button></div></div>
      </section>

      <section className="panel">
        <div className="panel-head"><div><h2>Series de hoy</h2><p>Marca cada serie y se inicia el descanso automáticamente.</p></div><div className="compact-actions"><button className="btn secondary" onClick={() => updateRecord(selectedDay, activeExercise, c => ({...c, sets: c.sets.length > 1 ? c.sets.slice(0,-1) : c.sets}))}><Minus size={17}/> Quitar</button><button className="btn secondary" onClick={() => updateRecord(selectedDay, activeExercise, c => ({...c, sets:[...c.sets,{weight:'',reps:'',done:false}]}))}><Plus size={17}/> Añadir</button></div></div>
        <div className="sets">{record.sets.map((s, idx) => <div className="set-card" key={idx}>
          <div className="set-head"><h3>Serie {idx+1}</h3><button className={s.done ? 'btn done' : 'btn secondary'} onClick={() => toggleSet(idx)}><CheckCircle2 size={17}/>{s.done ? 'Hecha' : 'Marcar'}</button></div>
          <div className="inputs"><label>Peso<input value={s.weight} onChange={e => updateRecord(selectedDay, activeExercise, c => ({...c, sets: c.sets.map((x,i)=> i===idx ? {...x, weight:e.target.value} : x)}))} placeholder="kg" inputMode="decimal" /></label><label>Reps<input value={s.reps} onChange={e => updateRecord(selectedDay, activeExercise, c => ({...c, sets: c.sets.map((x,i)=> i===idx ? {...x, reps:e.target.value} : x)}))} placeholder={activeExercise.repGoal} inputMode="numeric" /></label></div>
        </div>)}</div>
      </section>

      <section className="panel"><h2>Notas del ejercicio</h2><textarea value={record.notes} onChange={e => updateRecord(selectedDay, activeExercise, c => ({...c, notes:e.target.value}))} placeholder="Técnica, sensaciones, molestias, próxima subida..." />
      <div className="bottom-actions"><button className="btn secondary" onClick={() => { window.location.href = `https://m.youtube.com/results?search_query=${encodeURIComponent(activeExercise.videoQuery)}`; }}><PlayCircle size={17}/> Ver vídeo</button><button className="btn secondary" onClick={() => toggleFavorite(activeExercise.name)}><Star size={17}/> {state.favorites[activeExercise.name] ? 'Favorito' : 'Favorito'}</button><button className="btn dark" onClick={finishExercise}><CheckCircle2 size={17}/> Terminar ejercicio</button></div></section>
    </div></div>;
  }

  return <div className="app"><main className="main-screen">
    <section className="hero">
      <div className="top-row"><div><div className="brand"><Dumbbell size={24}/><h1>Mi Entreno Pro</h1></div><p>Lower / Upper / Lower · pérdida de peso + tren inferior · 45 min</p></div><div className="head-actions"><input className="date" type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} /><button className="btn secondary" onClick={exportData}><Download size={17}/> Exportar</button><button className="btn ghost" onClick={resetAll}><Trash2 size={17}/> Reset</button></div></div>
    </section>
    <div className="layout"><aside className="side"><section className="panel"><label className="search-label"><Search size={17}/> Buscar</label><input className="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="pierna, press, femoral..." /></section><section className="panel days">{Object.keys(workoutPlan).map(day => <button key={day} className={day===selectedDay ? 'day active':'day'} onClick={()=>setSelectedDay(day)}><CalendarDays size={17}/>{day}</button>)}</section><section className="mini"><p>Progreso del día</p><strong>{completedCount}/{(workoutPlan[selectedDay]||[]).length}</strong><span>ejercicios terminados</span></section></aside><section className="content"><section className="panel"><div className="list-head"><div><h2>{selectedDay}</h2><p>Pulsa un ejercicio para entrar y registrar las series.</p></div><span className="pill">{selectedDate}</span></div><div className="exercise-list">{dayExercises.map(ex => { const rec=getRecord(selectedDay,ex); const doneSets=rec.sets.filter(s=>s.done).length; const last=getLastRecord(selectedDay,ex); const lastFirst=last?.sets?.find(s=>s.weight||s.reps); return <button key={ex.name} className="exercise-item" onClick={()=>openExercise(ex)}><div><div className="ex-title"><b>{ex.name}</b><span>{ex.muscle}</span>{state.favorites[ex.name] && <Star size={15} className="star"/>}</div><div className="chips"><em>{rec.sets.length} series</em><em>objetivo {ex.repGoal}</em><em>{rec.rest||ex.rest}s descanso</em><em className={rec.completed?'green':''}>{rec.completed?'hecho':`${doneSets} series hechas`}</em>{lastFirst && <em className="blue">último: {lastFirst.weight||'-'} kg x {lastFirst.reps||'-'}</em>}</div></div><ChevronRight size={21}/></button>})}</div></section><section className="panel"><h2>Notas del día</h2><textarea value={dayNotes} onChange={e=>updateDayNotes(e.target.value)} placeholder="Cómo te has visto hoy, qué subirías, molestias, sensaciones..." /></section></section></div>
  </main></div>;
}

createRoot(document.getElementById('root')).render(<App />);
