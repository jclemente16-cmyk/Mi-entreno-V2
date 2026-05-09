import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, CalendarDays, CheckCircle2, ChevronRight, Clock3, Download, Dumbbell,
  Minus, PlayCircle, Plus, RotateCcw, Search, Star, TimerReset, Trash2
} from 'lucide-react';

const STORAGE_KEY = 'mi-entreno-pro-3-dias-v1';

const workoutPlan = {
  'Día 1 - Torso A': [
    { name: 'Press banca en multipower', muscle: 'Pecho', defaultSets: 4, repGoal: '6-8', rest: 90, videoQuery: 'press banca multipower tecnica' },
    { name: 'Jalón al pecho en polea', muscle: 'Espalda', defaultSets: 4, repGoal: '8-10', rest: 90, videoQuery: 'jalon al pecho polea tecnica' },
    { name: 'Press inclinado con mancuernas', muscle: 'Pecho superior', defaultSets: 3, repGoal: '8-10', rest: 75, videoQuery: 'press inclinado mancuernas tecnica' },
    { name: 'Remo con barra en jaula', muscle: 'Espalda', defaultSets: 3, repGoal: '8-10', rest: 90, videoQuery: 'remo con barra tecnica' },
    { name: 'Elevaciones laterales con mancuernas', muscle: 'Hombro', defaultSets: 3, repGoal: '12-15', rest: 60, videoQuery: 'elevaciones laterales mancuernas tecnica' },
    { name: 'Tríceps en polea', muscle: 'Tríceps', defaultSets: 3, repGoal: '10-15', rest: 60, videoQuery: 'triceps polea tecnica' }
  ],
  'Día 2 - Pierna': [
    { name: 'Sentadilla en multipower', muscle: 'Cuádriceps/Glúteo', defaultSets: 4, repGoal: '6-8', rest: 90, videoQuery: 'sentadilla multipower tecnica' },
    { name: 'Prensa', muscle: 'Pierna', defaultSets: 4, repGoal: '10-12', rest: 90, videoQuery: 'prensa de piernas tecnica' },
    { name: 'Peso muerto rumano con barra', muscle: 'Femoral/Glúteo', defaultSets: 3, repGoal: '8-10', rest: 90, videoQuery: 'peso muerto rumano barra tecnica' },
    { name: 'Femoral sentado', muscle: 'Femoral', defaultSets: 3, repGoal: '10-15', rest: 75, videoQuery: 'femoral sentado tecnica' },
    { name: 'Cuádriceps sentado', muscle: 'Cuádriceps', defaultSets: 3, repGoal: '12-15', rest: 75, videoQuery: 'extension cuadriceps sentado tecnica' },
    { name: 'Gemelos en prensa', muscle: 'Gemelos', defaultSets: 3, repGoal: '12-20', rest: 60, videoQuery: 'gemelos en prensa tecnica' }
  ],
  'Día 3 - Torso B': [
    { name: 'Press militar en multipower', muscle: 'Hombro', defaultSets: 4, repGoal: '6-8', rest: 90, videoQuery: 'press militar multipower tecnica' },
    { name: 'Remo unilateral con mancuerna', muscle: 'Espalda', defaultSets: 3, repGoal: '8-10', rest: 75, videoQuery: 'remo unilateral mancuerna tecnica' },
    { name: 'Jalón al pecho agarre estrecho', muscle: 'Espalda', defaultSets: 3, repGoal: '10-12', rest: 75, videoQuery: 'jalon al pecho agarre estrecho tecnica' },
    { name: 'Press plano con mancuernas', muscle: 'Pecho', defaultSets: 3, repGoal: '8-10', rest: 75, videoQuery: 'press plano mancuernas tecnica' },
    { name: 'Face pull en polea', muscle: 'Hombro posterior', defaultSets: 3, repGoal: '12-15', rest: 60, videoQuery: 'face pull polea tecnica' },
    { name: 'Curl martillo con mancuernas', muscle: 'Bíceps', defaultSets: 3, repGoal: '10-12', rest: 60, videoQuery: 'curl martillo mancuernas tecnica' }
  ]
};

const todayString = () => new Date().toISOString().slice(0, 10);
const formatSeconds = (total) => `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
const buildSets = (n) => Array.from({ length: n }, () => ({ weight: '', reps: '', done: false }));
const createInitialState = () => ({ logsByDate: {}, notesByDate: {}, favorites: {} });

function ensureExerciseRecord(state, date, day, exercise) {
  return state.logsByDate?.[date]?.[day]?.[exercise.name] || {
    sets: buildSets(exercise.defaultSets),
    completed: false,
    rest: exercise.rest,
    notes: ''
  };
}

export default function App() {
  const [state, setState] = useState(createInitialState);
  const [selectedDate, setSelectedDate] = useState(todayString());
  const [selectedDay, setSelectedDay] = useState('Día 1 - Torso A');
  const [activeExercise, setActiveExercise] = useState(null);
  const [search, setSearch] = useState('');
  const [timerSeconds, setTimerSeconds] = useState(90);
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { setState({ ...createInitialState(), ...JSON.parse(saved) }); } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (!timerRunning) return;
    const id = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          setTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [timerRunning]);

  const dayExercises = useMemo(() => {
    const base = workoutPlan[selectedDay] || [];
    const term = search.trim().toLowerCase();
    return term ? base.filter((e) => e.name.toLowerCase().includes(term) || e.muscle.toLowerCase().includes(term)) : base;
  }, [selectedDay, search]);

  const getExerciseRecord = (day, exercise) => ensureExerciseRecord(state, selectedDate, day, exercise);

  const getLastExerciseRecord = (day, exercise) => {
    const dates = Object.keys(state.logsByDate || {})
      .filter((date) => date < selectedDate)
      .sort()
      .reverse();
    for (const date of dates) {
      const record = state.logsByDate?.[date]?.[day]?.[exercise.name];
      if (record && record.sets && record.sets.some((set) => set.weight || set.reps || set.done)) {
        return { date, ...record };
      }
    }
    return null;
  };

  const copyLastTrainingToToday = (exercise, lastRecord) => {
    if (!lastRecord) return;
    updateExerciseRecord(selectedDay, exercise, (current) => ({
      ...current,
      sets: lastRecord.sets.map((set) => ({ weight: set.weight || '', reps: set.reps || '', done: false })),
      rest: lastRecord.rest || exercise.rest,
      notes: ''
    }));
  };

  const updateExerciseRecord = (day, exercise, updater) => {
    setState((prev) => {
      const current = ensureExerciseRecord(prev, selectedDate, day, exercise);
      const updated = typeof updater === 'function' ? updater(current) : updater;
      return {
        ...prev,
        logsByDate: {
          ...prev.logsByDate,
          [selectedDate]: {
            ...prev.logsByDate[selectedDate],
            [day]: {
              ...(prev.logsByDate[selectedDate]?.[day] || {}),
              [exercise.name]: updated
            }
          }
        }
      };
    });
  };

  const openExercise = (exercise) => {
    const record = getExerciseRecord(selectedDay, exercise);
    setActiveExercise(exercise);
    setTimerRunning(false);
    setTimerSeconds(record.rest || exercise.rest || 90);
  };

  const finishExercise = () => {
    if (!activeExercise) return;
    updateExerciseRecord(selectedDay, activeExercise, (current) => ({ ...current, completed: true }));
    setActiveExercise(null);
    setTimerRunning(false);
  };

  const toggleFavorite = (name) => setState((prev) => ({ ...prev, favorites: { ...prev.favorites, [name]: !prev.favorites[name] } }));
  const dayNotes = state.notesByDate?.[selectedDate]?.[selectedDay] || '';
  const updateDayNotes = (value) => setState((prev) => ({ ...prev, notesByDate: { ...prev.notesByDate, [selectedDate]: { ...prev.notesByDate[selectedDate], [selectedDay]: value } } }));
  const completedCount = (workoutPlan[selectedDay] || []).filter((exercise) => getExerciseRecord(selectedDay, exercise).completed).length;

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mi-entreno-pro-datos.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetAll = () => {
    const clean = createInitialState();
    setState(clean);
    setActiveExercise(null);
    setTimerRunning(false);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
  };

  if (activeExercise) {
    const record = getExerciseRecord(selectedDay, activeExercise);
    const lastRecord = getLastExerciseRecord(selectedDay, activeExercise);
    return (
      <div className="app-shell"><div className="container" style={{maxWidth: 760}}>
        <div className="hero">
          <div className="screen-header">
            <button className="btn ghost" style={{width:'auto'}} onClick={() => { setActiveExercise(null); setTimerRunning(false); }}><ArrowLeft size={16} /> Volver</button>
            <div className="right">
              <div className="small" style={{color:'#9ca3af'}}>{selectedDay} · {selectedDate}</div>
              <div className="hero-title" style={{fontSize: 26}}>{activeExercise.name}</div>
            </div>
          </div>
          <div className="top-tools">
            <span className="badge dark">{activeExercise.muscle}</span>
            <span className="badge">Objetivo {activeExercise.repGoal}</span>
          </div>
        </div>

        {lastRecord && (
          <div className="card">
            <div className="exercise-top">
              <div>
                <div className="exercise-name">Último entrenamiento</div>
                <div className="small">Datos guardados del {lastRecord.date}</div>
              </div>
              <button className="btn secondary" style={{width:'auto'}} onClick={() => copyLastTrainingToToday(activeExercise, lastRecord)}>Copiar a hoy</button>
            </div>
            <div className="sets" style={{marginTop:12}}>
              {lastRecord.sets.map((set, idx) => (
                <div className="set-row last-set" key={idx}>
                  <strong>Serie {idx + 1}</strong>
                  <span>{set.weight || '-'} kg · {set.reps || '-'} reps</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card">
          <div className="exercise-top">
            <div className="timer-box">
              <div className="small">Temporizador</div>
              <div className="timer-number">{formatSeconds(timerSeconds)}</div>
            </div>
            <div>
              <div className="actions" style={{justifyContent:'flex-end', marginBottom:8}}>
                <button className="btn icon-btn" onClick={() => setTimerSeconds((s) => Math.max(0, s - 15))}><Minus size={16} /></button>
                <button className="btn icon-btn" onClick={() => setTimerSeconds((s) => s + 15)}><Plus size={16} /></button>
              </div>
              <div className="actions">
                <button className="btn primary" style={{width:'auto'}} onClick={() => setTimerRunning((v) => !v)}><Clock3 size={16} /> {timerRunning ? 'Pausar' : 'Iniciar'}</button>
                <button className="btn secondary" style={{width:'auto'}} onClick={() => { setTimerRunning(false); setTimerSeconds(record.rest || activeExercise.rest); }}><RotateCcw size={16} /> Reset</button>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="exercise-top">
            <div>
              <div className="exercise-name">Series</div>
              <div className="small">Añade o quita series. El registro se queda guardado al volver a entrar.</div>
            </div>
            <div className="actions">
              <button className="btn secondary" style={{width:'auto'}} onClick={() => updateExerciseRecord(selectedDay, activeExercise, (current) => ({ ...current, sets: current.sets.length > 1 ? current.sets.slice(0, -1) : current.sets }))}><Minus size={16} /> Quitar</button>
              <button className="btn secondary" style={{width:'auto'}} onClick={() => updateExerciseRecord(selectedDay, activeExercise, (current) => ({ ...current, sets: [...current.sets, { weight: '', reps: '', done: false }] }))}><Plus size={16} /> Añadir</button>
            </div>
          </div>
          <div className="sets">
            {record.sets.map((setItem, idx) => (
              <div className="set-card" key={idx}>
                <div className="set-row">
                  <div className="exercise-name" style={{fontSize: 18}}>Serie {idx + 1}</div>
                  <button
                    className={`btn ${setItem.done ? 'success' : 'secondary'}`}
                    style={{width:'auto'}}
                    onClick={() => updateExerciseRecord(selectedDay, activeExercise, (current) => ({
                      ...current,
                      sets: current.sets.map((s, i) => i === idx ? { ...s, done: !s.done } : s)
                    }))}
                  >
                    <CheckCircle2 size={16} /> {setItem.done ? 'Hecha' : 'Marcar'}
                  </button>
                </div>
                <div className="fields">
                  <div>
                    <div className="small">Peso</div>
                    <input className="input" value={setItem.weight} placeholder="60" onChange={(e) => updateExerciseRecord(selectedDay, activeExercise, (current) => ({ ...current, sets: current.sets.map((s, i) => i === idx ? { ...s, weight: e.target.value } : s) }))} />
                  </div>
                  <div>
                    <div className="small">Reps</div>
                    <input className="input" value={setItem.reps} placeholder={activeExercise.repGoal} onChange={(e) => updateExerciseRecord(selectedDay, activeExercise, (current) => ({ ...current, sets: current.sets.map((s, i) => i === idx ? { ...s, reps: e.target.value } : s) }))} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="exercise-name" style={{marginBottom: 10}}>Notas del ejercicio</div>
          <textarea className="textarea" value={record.notes} placeholder="Técnica, sensaciones, molestias..." onChange={(e) => updateExerciseRecord(selectedDay, activeExercise, (current) => ({ ...current, notes: e.target.value }))} />
          <div className="footer-grid" style={{marginTop: 12}}>
            <button className="btn secondary" onClick={() => { window.location.href = `https://m.youtube.com/results?search_query=${encodeURIComponent(activeExercise.videoQuery)}`; }}><PlayCircle size={16} /> Ver vídeo</button>
            <button className="btn secondary" onClick={() => toggleFavorite(activeExercise.name)}><Star size={16} /> {state.favorites[activeExercise.name] ? 'Favorito' : 'Marcar favorito'}</button>
            <button className="btn primary" onClick={finishExercise}><CheckCircle2 size={16} /> Terminar ejercicio</button>
          </div>
        </div>
      </div></div>
    );
  }

  return (
    <div className="app-shell"><div className="container">
      <div className="hero">
        <div className="hero-top">
          <div>
            <div style={{display:'flex', alignItems:'center', gap:8}}><Dumbbell size={20} color="#a3e635" /><h1 className="hero-title">Mi Entreno Pro</h1></div>
            <div className="hero-sub">Rutina 3 días: 1 pierna + 2 torso · 45 min · descansos hasta 90 s.</div>
          </div>
          <div className="header-actions">
            <input className="input" style={{width:170, background:'#111827', color:'white', borderColor:'#374151'}} type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
            <button className="btn secondary" style={{width:'auto'}} onClick={exportData}><Download size={16} /> Exportar</button>
            <button className="btn ghost" style={{width:'auto'}} onClick={resetAll}><Trash2 size={16} /> Reset</button>
          </div>
        </div>
      </div>

      <div className="sidebar-layout">
        <div style={{display:'grid', gap:16}}>
          <div className="card">
            <div className="small" style={{marginBottom:10, fontWeight:600, color:'#111827'}}><Search size={14} style={{verticalAlign:'middle', marginRight:6}} /> Buscar</div>
            <input className="input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="press, espalda, bíceps..." />
          </div>
          <div className="card">
            <div style={{display:'grid', gap:8}}>
              {Object.keys(workoutPlan).map((day) => (
                <button key={day} className={`day-button ${selectedDay === day ? 'active' : ''}`} onClick={() => setSelectedDay(day)}><CalendarDays size={16} style={{verticalAlign:'middle', marginRight:8}} /> {day}</button>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="small">Progreso del día</div>
            <div className="metric">{completedCount}/{(workoutPlan[selectedDay] || []).length}</div>
            <div className="small">ejercicios terminados</div>
          </div>
        </div>

        <div style={{display:'grid', gap:16}}>
          <div className="card">
            <div className="exercise-top">
              <div>
                <div className="hero-title" style={{fontSize: 26, color:'#111827'}}>{selectedDay}</div>
                <div className="small">Pulsa un ejercicio para entrar en su pantalla.</div>
              </div>
              <span className="badge dark">{selectedDate}</span>
            </div>
            <div className="exercise-list" style={{marginTop:16}}>
              {dayExercises.map((exercise) => {
                const record = getExerciseRecord(selectedDay, exercise);
                const lastRecord = getLastExerciseRecord(selectedDay, exercise);
                const lastFirstSet = lastRecord?.sets?.find((s) => s.weight || s.reps);
                const doneSets = record.sets.filter((s) => s.done).length;
                return (
                  <button className="exercise-item" key={exercise.name} onClick={() => openExercise(exercise)}>
                    <div className="exercise-top">
                      <div style={{flex:1, minWidth:0}}>
                        <div style={{display:'flex', gap:8, alignItems:'center', flexWrap:'wrap'}}>
                          <div className="exercise-name">{exercise.name}</div>
                          <span className="badge">{exercise.muscle}</span>
                          {state.favorites[exercise.name] ? <Star size={14} className="star" fill="currentColor" /> : null}
                        </div>
                        <div className="chips" style={{marginTop:10}}>
                          <span className="chip">{record.sets.length} series</span>
                          <span className="chip">objetivo {exercise.repGoal}</span>
                          <span className="chip">descanso {record.rest || exercise.rest}s</span>
                          <span className={`chip ${record.completed ? 'done' : ''}`}>{record.completed ? 'hecho' : `${doneSets} series hechas`}</span>
                          {lastFirstSet ? <span className="chip previous">último: {lastFirstSet.weight || '-'} kg x {lastFirstSet.reps || '-'}</span> : null}
                        </div>
                      </div>
                      <ChevronRight size={20} color="#9ca3af" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="card">
            <div className="exercise-name" style={{fontSize:22, marginBottom:10}}>Notas del día</div>
            <textarea className="textarea" value={dayNotes} onChange={(e) => updateDayNotes(e.target.value)} placeholder="Cómo te has visto hoy, qué subirías, molestias, sensaciones..." />
          </div>
        </div>
      </div>
    </div></div>
  );
}
