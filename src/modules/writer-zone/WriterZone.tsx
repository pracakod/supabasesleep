import { useState, useEffect } from 'react'
import { useProject } from '../../contexts/ProjectContext'
import { useCustomGenres } from '../../hooks/useCustomGenres'
import type { CustomGenreInput } from '../../hooks/useCustomGenres'
import { Award, ChevronDown, ChevronUp, Sparkles, Megaphone, HelpCircle, Plus, Trash2, X, Loader } from 'lucide-react'

// ─── Typy ──────────────────────────────────────────────────────────────────
interface Genre {
  name: string
  min: number
  max: number
  desc: string
  custom?: boolean
  id?: string  // tylko dla custom
}

// ─── Wbudowana lista gatunków ──────────────────────────────────────────────
const BUILT_IN_GENRES: Genre[] = [
  // Fikcja
  { name: 'Fantasy', min: 80000, max: 120000, desc: 'Światy magiczne i mityczne. Rozbudowany worldbuilding wymaga dodatkowych słów na opis reguł świata.' },
  { name: 'High Fantasy (epicki)', min: 100000, max: 200000, desc: 'Wielotomowe sagi epickie w stylu Tolkiena lub Sandersona. Maksymalna złożoność świata i fabuły.' },
  { name: 'Urban Fantasy', min: 70000, max: 100000, desc: 'Magia osadzona we współczesnym mieście. Mniej worldbuildingu niż high fantasy.' },
  { name: 'Science Fiction', min: 80000, max: 120000, desc: 'Rozbudowane koncepty naukowe i futurystyczne społeczeństwa wymagają szczegółowego opisu.' },
  { name: 'Space Opera', min: 90000, max: 150000, desc: 'Epickie przygody kosmiczne z rozbudowaną obsadą i wieloma lokacjami.' },
  { name: 'Kryminał', min: 70000, max: 90000, desc: 'Skupiony na intrydze detektywistycznej. Tempo jest kluczowe – zbyt długa powieść traci napięcie.' },
  { name: 'Thriller / Suspense', min: 70000, max: 100000, desc: 'Narracja nastawiona na napięcie. Każda scena musi pchać akcję naprzód.' },
  { name: 'Horror', min: 50000, max: 100000, desc: 'Rozpiętość duża – od krótkich atmosferycznych horrorów do rozbudowanych powieści grozy.' },
  { name: 'Romans', min: 50000, max: 90000, desc: 'Centralnym elementem jest wątek miłosny z satysfakcjonującym zakończeniem (HEA lub HFN).' },
  { name: 'Romans paranormalny', min: 60000, max: 95000, desc: 'Łączy elementy romansu z fantastyką – wampiry, wilkołaki, fae.' },
  { name: 'Powieść obyczajowa', min: 50000, max: 80000, desc: 'Skupia się na codziennym życiu i relacjach. Nie wymaga rozbudowanej fabuły zewnętrznej.' },
  { name: 'Literatura piękna (Literary Fiction)', min: 60000, max: 120000, desc: 'Nacisk na styl, język i głębię psychologiczną postaci. Normy są tu bardziej elastyczne.' },
  { name: 'Historyczna', min: 80000, max: 120000, desc: 'Realia historyczne wymagają szczegółowego opisu epoki, obyczajów i realiów.' },
  { name: 'Przygodowa', min: 60000, max: 100000, desc: 'Dynamiczna fabuła z podróżami i akcją. Tempo ważniejsze niż głęboka psychologia postaci.' },
  { name: 'Satyra / Groteska', min: 40000, max: 80000, desc: 'Forma jest celowo przerysowana. Długość zależy od ambicji i rozbudowania wątków satyrycznych.' },
  // Młodzi czytelnicy
  { name: 'Młodzieżowa (YA)', min: 50000, max: 80000, desc: 'Szybkie tempo, dopasowane do młodszych czytelników. Bohaterowie w wieku nastoletnim.' },
  { name: 'Middle Grade (dzieci 8–12 lat)', min: 20000, max: 50000, desc: 'Prostszy język, krótsze rozdziały. Fabuła skupiona na przygodzie i przyjaźni.' },
  { name: 'Picturebook / Książka ilustrowana', min: 500, max: 1000, desc: 'Bardzo krótki tekst – obraz jest równorzędnym nośnikiem narracji.' },
  // Formy krótkie
  { name: 'Opowiadanie', min: 1000, max: 10000, desc: 'Zwięzła, pojedyncza scena lub wątek. Jeden główny konflikt, ograniczona obsada.' },
  { name: 'Nowela', min: 10000, max: 40000, desc: 'Dłuższa od opowiadania, krótsza od powieści. Skupiona na jednym centralnym wątku.' },
  // Non-fiction
  { name: 'Biografia / Autobiografia', min: 60000, max: 120000, desc: 'Uzależnione od ilości materiału źródłowego i głębi życiorysu opisywanej osoby.' },
  { name: 'Reportaż / Fakt literacki', min: 50000, max: 100000, desc: 'Niefikcyjna narracja oparta na faktach. Długość zależy od tematu i zakresu badań.' },
  { name: 'Poradnik / Self-help', min: 30000, max: 70000, desc: 'Skoncentrowany na praktycznej wiedzy. Zbyt długi traci czytelnika – wartość ponad objętość.' },
  { name: 'Eseje / Zbiór esejów', min: 30000, max: 80000, desc: 'Elastyczna forma. Każdy esej powinien być kompletną myślą; zbiór spajają wspólny temat lub głos.' },
]

// ─── Ściągawka warsztatowa ─────────────────────────────────────────────────
const WORKSHOP_TIPS = [
  {
    title: 'Klasyczna Struktura 3-Aktowa',
    content: `Struktura, na której opiera się większość opowieści:
• AKT I (Wprowadzenie): 1-25% powieści. Ekspozycja świata, Incydent Inicjujący (wydarzenie, które burzy status quo), Pierwszy Punkt Zwrotny (bohater podejmuje decyzję o wejściu w nową sytuację).
• AKT II (Konfrontacja): 25-75% powieści. Przeszkody, rozwój postaci. W połowie drogi następuje Punkt Bez Powrotu (Midpoint). Kończy się Drugim Punktem Zwrotnym (najciemniejszy moment przed ostatecznym starciem).
• AKT III (Rozstrzygnięcie): 75-100% powieści. Kulminacja (Klimaks) - ostateczne starcie ze antagonistą, Rozwiązanie akcji (Rezolucja) i powrót do nowego ładu.`
  },
  {
    title: 'Metoda Płatka Śniegu (Snowflake)',
    content: `Projektowanie książki od ogółu do szczegółu:
1. Napisz jednozdaniowe streszczenie powieści (np. „Nastoletnia dziewczyna zostaje wybrana do walki na śmierć i życie w telewizyjnym show").
2. Rozwiń zdanie w pełen akapit opisujący tło, konflikt, punkt kulminacyjny i zakończenie.
3. Stwórz jednostronicowy profil każdego z głównych bohaterów (pragnienia, motywacje, kłamstwo, wada).
4. Rozwiń każdy z akapitów z kroku 2 w pełną stronę opisu fabuły.
5. Napisz kompletną listę scen, które będą potrzebne do opowiedzenia historii, a następnie opisz je w tabeli.`
  },
  {
    title: 'Budowanie Napięcia i Pacing',
    content: `Jak kontrolować tempo czytania:
• Krótkie zdania i akapity przyspieszają tempo (idealne podczas walki, ucieczki czy paniki).
• Długie, opisowe zdania spowalniają akcję (dobre przy opisach krajobrazów, przemyśleniach bohatera, po ciężkich przeżyciach).
• Cliffhangery na końcu rozdziałów: przerywaj scenę w najbardziej dramatycznym momencie, by zmusić czytelnika do rozpoczęcia kolejnego rozdziału.
• Stosuj zmienność: po dynamicznej scenie akcji daj bohaterom (i czytelnikowi) chwilę oddechu.`
  },
  {
    title: 'Zasada "Show, Don\'t Tell" (Pokazuj, nie streszczaj)',
    content: `Zamiast mówić czytelnikowi o emocjach lub cechach, pozwól mu je odczuć:
• Zamiast pisać: „Marek był wściekły" (Tell).
• Napisz: „Marek zacisnął pięści tak mocno, że zbielały mu kłykcie. Kopnął w krzesło, które z łomotem uderzyło w ścianę" (Show).
• Używaj zmysłów: opisz zapach stęchłej piwnicy, zimny dreszcz na plecach, metaliczny posmak strachu w ustach.`
  }
]

// ─── Lista zadań promocyjnych ──────────────────────────────────────────────
const DEFAULT_PROMO_CHECKLIST = {
  stage1: [
    { id: '1-1', text: 'Zdefiniowanie grupy docelowej (kto najchętniej przeczyta tę książkę)', checked: false },
    { id: '1-2', text: 'Analiza rynku i konkurencji (podobne książki w tym samym gatunku)', checked: false },
    { id: '1-3', text: 'Napisanie streszczenia wydawniczego (tzw. blurb)', checked: false }
  ],
  stage2: [
    { id: '2-1', text: 'Założenie kont w mediach społecznościowych / autorskiego newslettera', checked: false },
    { id: '2-2', text: 'Publikowanie fragmentów, cytatów lub tzw. aesthetic grafik z powieści', checked: false },
    { id: '2-3', text: 'Zamówienie lub samodzielne zaprojektowanie roboczej okładki', checked: false },
    { id: '2-4', text: 'Zbudowanie grupy beta-czytelników do pierwszych opinii', checked: false }
  ],
  stage3: [
    { id: '3-1', text: 'Zlecenie profesjonalnej korekty i redakcji tekstu', checked: false },
    { id: '3-2', text: 'Wysłanie propozycji wydawniczych (tradycyjne) lub planowanie składu (self-publishing)', checked: false },
    { id: '3-3', text: 'Przygotowanie egzemplarzy recenzenckich (booktour / bookstagramerzy)', checked: false },
    { id: '3-4', text: 'Premiera i organizacja spotkania autorskiego (online lub stacjonarnie)', checked: false }
  ]
}

// ─── Pusty formularz ───────────────────────────────────────────────────────
const EMPTY_FORM: CustomGenreInput = { name: '', min_words: 0, max_words: 0, description: '' }

// ══════════════════════════════════════════════════════════════════════════════
export default function WriterZone() {
  const { currentProject } = useProject()
  const { genres: customGenres, loading: genresLoading, error: genresError, addGenre, deleteGenre } = useCustomGenres()

  // Połączona lista: własne (z gwiazdką) + wbudowane
  const allGenres: Genre[] = [
    ...customGenres.map(g => ({
      id: g.id,
      name: `★ ${g.name}`,
      min: g.min_words,
      max: g.max_words,
      desc: g.description || 'Twój własny gatunek.',
      custom: true,
    })),
    ...BUILT_IN_GENRES,
  ]

  const [selectedGenre, setSelectedGenre] = useState<Genre>(BUILT_IN_GENRES[0])
  const [openTipIdx, setOpenTipIdx] = useState<number | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [form, setForm] = useState<CustomGenreInput>(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Checklist promocji (localStorage – powiązana z projektem, nie użytkownikiem)
  const [checklist, setChecklist] = useState(DEFAULT_PROMO_CHECKLIST)

  useEffect(() => {
    if (!currentProject) return
    const saved = localStorage.getItem(`promo_checklist_${currentProject.id}`)
    if (saved) {
      try { setChecklist(JSON.parse(saved)) }
      catch { setChecklist(DEFAULT_PROMO_CHECKLIST) }
    } else {
      setChecklist(DEFAULT_PROMO_CHECKLIST)
    }
  }, [currentProject])

  const saveChecklist = (newChecklist: typeof DEFAULT_PROMO_CHECKLIST) => {
    setChecklist(newChecklist)
    if (currentProject) {
      localStorage.setItem(`promo_checklist_${currentProject.id}`, JSON.stringify(newChecklist))
    }
  }

  const handleToggleCheck = (stage: 'stage1' | 'stage2' | 'stage3', itemId: string) => {
    const updated = {
      ...checklist,
      [stage]: checklist[stage].map(item =>
        item.id === itemId ? { ...item, checked: !item.checked } : item
      )
    }
    saveChecklist(updated)
  }

  // ── Zapis nowego gatunku ─────────────────────────────────────────────────
  const handleAddGenre = async () => {
    setFormError(null)
    if (!form.name.trim()) { setFormError('Podaj nazwę gatunku.'); return }
    if (form.min_words <= 0 || form.max_words <= 0) { setFormError('Limity słów muszą być większe od 0.'); return }
    if (form.min_words >= form.max_words) { setFormError('Minimum musi być mniejsze od maksimum.'); return }

    setSaving(true)
    const result = await addGenre(form)
    setSaving(false)

    if (result) {
      // Zaznacz nowo dodany gatunek
      setSelectedGenre({
        id: result.id, name: `★ ${result.name}`,
        min: result.min_words, max: result.max_words,
        desc: result.description || 'Twój własny gatunek.',
        custom: true,
      })
      setForm(EMPTY_FORM)
      setShowAddForm(false)
    } else if (genresError) {
      setFormError(genresError)
    }
  }

  const handleDeleteCustom = async (id: string) => {
    if (!id) return
    await deleteGenre(id)
    // Jeśli usunięty gatunek był zaznaczony → przełącz na pierwszy wbudowany
    if (selectedGenre.id === id) setSelectedGenre(BUILT_IN_GENRES[0])
  }

  if (!currentProject) return (
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
      <Sparkles size={40} style={{ margin: '0 auto 12px', display: 'block' }} />
      <p>Wybierz projekt aby wejść do Strefy Pisarza.</p>
    </div>
  )

  const currentWords = currentProject.total_words || 0
  const isBelow   = currentWords < selectedGenre.min
  const isAbove   = currentWords > selectedGenre.max
  const isInRange = currentWords >= selectedGenre.min && currentWords <= selectedGenre.max

  const allItems       = [...checklist.stage1, ...checklist.stage2, ...checklist.stage3]
  const completedItems = allItems.filter(item => item.checked).length
  const progressPercent = allItems.length > 0 ? Math.round((completedItems / allItems.length) * 100) : 0

  return (
    <div className="dashboard-container dashboard-subgrid fade-in">

      {/* LEWA KOLUMNA */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ── LIMITY GATUNKOWE ─────────────────────────────────────────── */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Award size={18} style={{ color: 'var(--accent)' }} />
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Limity Słów dla Gatunków</h2>
          </div>

          {/* Dropdown */}
          <div className="form-group">
            <label className="label">Wybierz Gatunek</label>
            <select
              className="select"
              value={selectedGenre.name}
              onChange={e => {
                const found = allGenres.find(g => g.name === e.target.value)
                if (found) setSelectedGenre(found)
              }}
            >
              {customGenres.length > 0 && (
                <optgroup label="— Moje gatunki">
                  {allGenres.filter(g => g.custom).map(g => (
                    <option key={g.name} value={g.name}>{g.name}</option>
                  ))}
                </optgroup>
              )}
              <optgroup label="— Gatunki standardowe">
                {BUILT_IN_GENRES.map(g => (
                  <option key={g.name} value={g.name}>{g.name}</option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Opis + przycisk usuń (tylko własne) */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', flex: 1 }}>
              {selectedGenre.desc}
            </p>
            {selectedGenre.custom && selectedGenre.id && (
              <button
                onClick={() => handleDeleteCustom(selectedGenre.id!)}
                title="Usuń ten gatunek"
                style={{
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                  color: '#f87171', borderRadius: 7, padding: '4px 8px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, flexShrink: 0
                }}
              >
                <Trash2 size={12} /> Usuń
              </button>
            )}
          </div>

          {/* Statystyki */}
          <div style={{ background: 'var(--bg-secondary)', padding: 14, borderRadius: 8, border: '1px solid var(--border)', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
              <span>Zalecany limit:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {selectedGenre.min.toLocaleString()} – {selectedGenre.max.toLocaleString()} słów
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
              <span>Aktualnie napisane:</span>
              <span style={{ fontWeight: 600, color: isBelow ? 'var(--text-secondary)' : isInRange ? 'var(--accent)' : '#ef4444' }}>
                {currentWords.toLocaleString()} słów
              </span>
            </div>
          </div>

          {/* Pasek postępu */}
          <div>
            <div style={{ position: 'relative', height: 16, background: 'var(--bg-hover)', borderRadius: 8, overflow: 'hidden', marginBottom: 10 }}>
              <div style={{
                position: 'absolute',
                left: `${(selectedGenre.min / selectedGenre.max) * 70}%`,
                width: `${((selectedGenre.max - selectedGenre.min) / selectedGenre.max) * 70}%`,
                height: '100%', background: 'var(--accent-glow)',
                borderLeft: '1px dashed var(--accent)', borderRight: '1px dashed var(--accent)'
              }} />
              <div style={{
                position: 'absolute', left: 0,
                width: `${Math.min((currentWords / selectedGenre.max) * 70, 100)}%`,
                height: '100%',
                background: isInRange ? 'var(--accent)' : isBelow ? 'var(--text-muted)' : '#ef4444',
                borderRadius: '8px 0 0 8px', opacity: 0.85, transition: 'width 0.4s'
              }} />
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
              {isBelow && `Brakuje Ci jeszcze ${(selectedGenre.min - currentWords).toLocaleString()} słów do minimalnego progu.`}
              {isInRange && 'Świetnie! Twój projekt mieści się w standardowym limicie dla tego gatunku.'}
              {isAbove && `Przekroczyłeś zalecaną długość o ${(currentWords - selectedGenre.max).toLocaleString()} słów. Rozważ podział na tomy lub redakcję.`}
            </div>
          </div>

          {/* ── Sekcja własnych gatunków ─────────────────────────────── */}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                Moje gatunki {genresLoading && <Loader size={11} style={{ display: 'inline', marginLeft: 4, animation: 'spin 1s linear infinite' }} />}
              </span>
              <button
                onClick={() => { setShowAddForm(f => !f); setFormError(null); setForm(EMPTY_FORM) }}
                style={{
                  background: showAddForm ? 'rgba(239,68,68,0.1)' : 'var(--accent-glow)',
                  border: `1px solid ${showAddForm ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`,
                  color: showAddForm ? '#f87171' : 'var(--accent)',
                  borderRadius: 7, padding: '5px 10px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600
                }}
              >
                {showAddForm ? <><X size={12} /> Anuluj</> : <><Plus size={12} /> Dodaj własny</>}
              </button>
            </div>

            {/* Lista własnych gatunków */}
            {customGenres.length > 0 && !showAddForm && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                {customGenres.map(g => (
                  <div key={g.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 12px', background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)', borderRadius: 8, gap: 8
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        ★ {g.name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {g.min_words.toLocaleString()} – {g.max_words.toLocaleString()} słów
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteCustom(g.id)}
                      title="Usuń gatunek"
                      style={{
                        background: 'none', border: 'none', color: 'var(--text-muted)',
                        cursor: 'pointer', padding: 4, borderRadius: 4, display: 'flex',
                        transition: 'color 0.15s'
                      }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {customGenres.length === 0 && !showAddForm && (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 8 }}>
                Nie masz jeszcze własnych gatunków. Dodaj swój!
              </p>
            )}

            {/* Formularz dodawania */}
            {showAddForm && (
              <div style={{
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 12
              }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="label">Nazwa gatunku *</label>
                  <input
                    className="input"
                    type="text"
                    placeholder="np. Solarpunk, Dark Academia..."
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    maxLength={60}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="label">Min. słów *</label>
                    <input
                      className="input"
                      type="number"
                      placeholder="np. 40000"
                      min={0}
                      value={form.min_words || ''}
                      onChange={e => setForm(f => ({ ...f, min_words: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="label">Maks. słów *</label>
                    <input
                      className="input"
                      type="number"
                      placeholder="np. 80000"
                      min={0}
                      value={form.max_words || ''}
                      onChange={e => setForm(f => ({ ...f, max_words: Number(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="label">Opis (opcjonalny)</label>
                  <input
                    className="input"
                    type="text"
                    placeholder="Krótki opis charakterystyki gatunku..."
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    maxLength={200}
                  />
                </div>

                {(formError || genresError) && (
                  <p style={{ fontSize: 12, color: '#f87171', margin: 0 }}>
                    ⚠ {formError || genresError}
                  </p>
                )}

                <button
                  onClick={handleAddGenre}
                  disabled={saving}
                  style={{
                    background: 'var(--accent)', color: '#03111e', border: 'none',
                    borderRadius: 8, padding: '10px 0', fontWeight: 700, fontSize: 13,
                    cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                  }}
                >
                  {saving ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Zapisywanie...</> : <><Plus size={14} /> Zapisz gatunek</>}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── WARSZTAT PISARZA ─────────────────────────────────────────── */}
        <div className="card" style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <HelpCircle size={18} style={{ color: 'var(--accent)' }} />
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Warsztat Pisarza</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {WORKSHOP_TIPS.map((tip, idx) => {
              const isOpen = openTipIdx === idx
              return (
                <div key={idx} style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                  <button
                    onClick={() => setOpenTipIdx(isOpen ? null : idx)}
                    style={{
                      width: '100%', padding: '12px 14px',
                      background: isOpen ? 'var(--bg-hover)' : 'var(--bg-card)',
                      border: 'none', display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', cursor: 'pointer', textAlign: 'left'
                    }}
                  >
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>{tip.title}</span>
                    {isOpen ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
                  </button>
                  {isOpen && (
                    <div style={{ padding: 14, background: 'var(--bg-secondary)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap', borderTop: '1px solid var(--border)' }}>
                      {tip.content}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

      </div>

      {/* PRAWA KOLUMNA: PLANER PROMOCJI */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Megaphone size={18} style={{ color: 'var(--accent)' }} />
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Planer Promocji Książki</h2>
          </div>
          <span className="badge badge-accent">{progressPercent}% Gotowe</span>
        </div>

        <div style={{ height: 6, background: 'var(--bg-hover)', borderRadius: 3, overflow: 'hidden', marginBottom: 24 }}>
          <div style={{ height: '100%', width: `${progressPercent}%`, background: 'var(--accent)', transition: 'width 0.3s' }} />
        </div>

        {(['stage1', 'stage2', 'stage3'] as const).map((stage, i) => {
          const labels = ['Etap 1: Przed rozpoczęciem pisania', 'Etap 2: W trakcie pisania i redakcji', 'Etap 3: Publikacja i dystrybucja']
          return (
            <div key={stage} style={{ marginBottom: i < 2 ? 20 : 0 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
                {labels[i]}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {checklist[stage].map(item => (
                  <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, cursor: 'pointer', color: item.checked ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: item.checked ? 'line-through' : 'none' }}>
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => handleToggleCheck(stage, item.id)}
                      style={{ cursor: 'pointer', width: 15, height: 15, accentColor: 'var(--accent)' }}
                    />
                    <span>{item.text}</span>
                  </label>
                ))}
              </div>
            </div>
          )
        })}
      </div>

    </div>
  )
}
