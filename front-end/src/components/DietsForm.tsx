import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import type { Diet, NutritionTotals } from '../types/Diet'
import type { Food } from '../types/Food'
import { apiFetch, apiGet, getErrorMessage } from '../utils/api'
import { formatNumber, formatPortion, unitLabel } from '../utils/format'

// Estado do formulário: campos como string; "key" identifica cada linha na tela
type ItemForm = { key: number; foodId: string; quantity: string }
type MealForm = { key: number; name: string; time: string; items: ItemForm[] }

let nextKey = 1
const newItem = (): ItemForm => ({ key: nextKey++, foodId: '', quantity: '' })
const newMeal = (name = '', time = ''): MealForm => ({ key: nextKey++, name, time, items: [newItem()] })

const formDefaults = () => ({
  name: '',
  notes: '',
  meals: [newMeal('Café da manhã', '07:00'), newMeal('Almoço', '12:00')],
})

const emptyTotals = (): NutritionTotals => ({ calories: 0, protein: 0, carbohydrates: 0, fat: 0, fiber: 0 })

// Valores do alimento são por porção; a quantidade informada é proporcional a ela
function itemTotals(food: Food | undefined, quantity: string): NutritionTotals {
  const amount = Number(quantity)
  if (!food || !(amount > 0)) return emptyTotals()

  const factor = amount / food.portionAmount
  return {
    calories: food.calories * factor,
    protein: food.protein * factor,
    carbohydrates: food.carbohydrates * factor,
    fat: food.fat * factor,
    fiber: food.fiber * factor,
  }
}

function sum(list: NutritionTotals[]): NutritionTotals {
  return list.reduce((total, item) => ({
    calories: total.calories + item.calories,
    protein: total.protein + item.protein,
    carbohydrates: total.carbohydrates + item.carbohydrates,
    fat: total.fat + item.fat,
    fiber: total.fiber + item.fiber,
  }), emptyTotals())
}

export function DietsForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'new'

  const [diet, setDiet] = useState(formDefaults)
  const [foods, setFoods] = useState<Food[]>([])
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [formModified, setFormModified] = useState(false)

  // Busca os alimentos (para as listas de escolha) e, na edição, o modelo
  async function loadData(active: boolean) {
    setLoading(true)
    setLoadFailed(false)
    setFormModified(false)
    setDiet(formDefaults())

    try {
      const foodsResult = await apiGet<Food[]>('/foods')
      if (active) setFoods(foodsResult)

      if (isNew) return

      const result = await apiGet<Diet>(`/diets/${id}`)

      if (active) {
        setDiet({
          name: result.name,
          notes: result.notes ?? '',
          meals: result.meals.map(meal => ({
            key: nextKey++,
            name: meal.name,
            time: meal.time,
            items: meal.items.map(item => ({
              key: nextKey++,
              foodId: item.foodId.toString(),
              quantity: item.quantity.toString(),
            })),
          })),
        })
      }
    }
    catch (error) {
      if (active) {
        setLoadFailed(true)
        const message = error instanceof Error ? error.message : 'Erro desconhecido.'
        window.alert(`Não foi possível carregar os dados. ${message}`)
      }
    }
    finally {
      if (active) setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    loadData(active)
    return () => {
      active = false
    }
  }, [id, isNew]) // <~ VETOR DE DEPENDÊNCIAS

  // ----- Funções que alteram o estado (sempre criando cópias, nunca mutando) -----

  function changeDiet(changes: Partial<typeof diet>) {
    setDiet(previous => ({ ...previous, ...changes }))
    setFormModified(true)
  }

  function updateMeal(mealKey: number, changes: Partial<MealForm>) {
    changeDiet({
      meals: diet.meals.map(meal => meal.key === mealKey ? { ...meal, ...changes } : meal),
    })
  }

  function updateItem(mealKey: number, itemKey: number, changes: Partial<ItemForm>) {
    const meal = diet.meals.find(m => m.key === mealKey)!
    updateMeal(mealKey, {
      items: meal.items.map(item => item.key === itemKey ? { ...item, ...changes } : item),
    })
  }

  function addMeal() {
    changeDiet({ meals: [...diet.meals, newMeal()] })
  }

  function removeMeal(mealKey: number) {
    changeDiet({ meals: diet.meals.filter(meal => meal.key !== mealKey) })
  }

  function addItem(mealKey: number) {
    const meal = diet.meals.find(m => m.key === mealKey)!
    updateMeal(mealKey, { items: [...meal.items, newItem()] })
  }

  function removeItem(mealKey: number, itemKey: number) {
    const meal = diet.meals.find(m => m.key === mealKey)!
    updateMeal(mealKey, { items: meal.items.filter(item => item.key !== itemKey) })
  }

  // ----- Totais calculados em tempo real -----

  const foodById = (foodId: string) => foods.find(food => food.id === Number(foodId))

  const mealTotals = diet.meals.map(meal =>
    sum(meal.items.map(item => itemTotals(foodById(item.foodId), item.quantity)))
  )
  const dietTotals = sum(mealTotals)

  async function handleFormSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (loading || loadFailed) return

    if (diet.meals.length === 0) {
      window.alert('Adicione pelo menos uma refeição ao modelo.')
      return
    }

    setLoading(true)

    try {
      const payload = {
        name: diet.name.trim(),
        notes: diet.notes.trim() || null,
        // Refeições em ordem de horário; linhas sem alimento escolhido são ignoradas
        meals: [...diet.meals]
          .sort((a, b) => a.time.localeCompare(b.time))
          .map(meal => ({
            name: meal.name.trim(),
            time: meal.time,
            items: meal.items
              .filter(item => item.foodId)
              .map(item => ({ foodId: Number(item.foodId), quantity: Number(item.quantity) })),
          })),
      }

      const response = await apiFetch(isNew ? '/diets' : `/diets/${id}`, {
        method: isNew ? 'POST' : 'PUT',
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(await getErrorMessage(response))
      }

      setFormModified(false)
      window.alert('Modelo de dieta salvo com sucesso.')
      navigate('/dietas')
    }
    catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido.'
      window.alert(`Não foi possível salvar o modelo. ${message}`)
    }
    finally {
      setLoading(false)
    }
  }

  function handleBackButtonClick() {
    if (formModified && !window.confirm('Há informações não salvas. Deseja realmente sair?')) {
      return
    }

    navigate('/dietas')
  }

  const macros = [
    { label: 'Proteínas', value: dietTotals.protein },
    { label: 'Carboidratos', value: dietTotals.carbohydrates },
    { label: 'Gorduras', value: dietTotals.fat },
    { label: 'Fibras', value: dietTotals.fiber },
  ]

  return (
    <>
      <div className="ns-page-header">
        <div>
          <h1>{isNew ? 'Novo modelo de dieta' : 'Editar modelo de dieta'}</h1>
          <p className="text-secondary mb-0">Monte as refeições; os totais são atualizados enquanto você edita.</p>
        </div>
      </div>

      {loading && <p role="status">Aguarde, processando...</p>}

      {loadFailed && (
        <div className="alert alert-danger" role="alert">
          Não foi possível carregar os dados. Volte à listagem e tente novamente.
        </div>
      )}

      <form onSubmit={handleFormSubmit}>
        <fieldset disabled={loading || loadFailed}>
          <legend className="visually-hidden">Dados do modelo de dieta</legend>

          <div className="row g-3">
            <div className="col-12 col-xl-8 d-flex flex-column gap-3">
              <div className="ns-card">
                <div className="row g-3">
                  <div className="col-12">
                    <label htmlFor="name" className="form-label">Nome do modelo</label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      className="form-control"
                      placeholder="Ex.: Hipertrofia"
                      required
                      maxLength={120}
                      autoFocus
                      value={diet.name}
                      onChange={event => changeDiet({ name: event.target.value })}
                    />
                  </div>
                  <div className="col-12">
                    <label htmlFor="notes" className="form-label">
                      Observações <span className="text-secondary">(opcional)</span>
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      className="form-control"
                      rows={2}
                      value={diet.notes}
                      onChange={event => changeDiet({ notes: event.target.value })}
                    />
                  </div>
                </div>
              </div>

              {diet.meals.map((meal, mealIndex) => (
                <section className="ns-card" key={meal.key} aria-label={`Refeição ${mealIndex + 1}`}>
                  <div className="row g-2 align-items-end mb-3">
                    <div className="col-4 col-md-3">
                      <label htmlFor={`meal-time-${meal.key}`} className="form-label">Horário</label>
                      <input
                        id={`meal-time-${meal.key}`}
                        type="time"
                        className="form-control"
                        required
                        value={meal.time}
                        onChange={event => updateMeal(meal.key, { time: event.target.value })}
                      />
                    </div>
                    <div className="col">
                      <label htmlFor={`meal-name-${meal.key}`} className="form-label">Refeição</label>
                      <input
                        id={`meal-name-${meal.key}`}
                        type="text"
                        className="form-control"
                        placeholder="Ex.: Lanche da tarde"
                        required
                        maxLength={60}
                        value={meal.name}
                        onChange={event => updateMeal(meal.key, { name: event.target.value })}
                      />
                    </div>
                    <div className="col-auto">
                      <button
                        type="button"
                        className="btn btn-outline-danger"
                        onClick={() => removeMeal(meal.key)}
                      >
                        Remover refeição
                      </button>
                    </div>
                  </div>

                  {meal.items.map(item => {
                    const food = foodById(item.foodId)
                    const totals = itemTotals(food, item.quantity)
                    return (
                      <div className="row g-2 align-items-center mb-2" key={item.key}>
                        <div className="col-12 col-md">
                          <label htmlFor={`food-${item.key}`} className="visually-hidden">Alimento</label>
                          <select
                            id={`food-${item.key}`}
                            className="form-select"
                            value={item.foodId}
                            onChange={event => updateItem(meal.key, item.key, { foodId: event.target.value })}
                          >
                            <option value="">Selecione o alimento...</option>
                            {foods.map(f => (
                              <option key={f.id} value={f.id}>
                                {f.name} — {formatPortion(f)}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-5 col-md-3">
                          <label htmlFor={`quantity-${item.key}`} className="visually-hidden">Quantidade</label>
                          <div className="input-group">
                            <input
                              id={`quantity-${item.key}`}
                              type="number"
                              className="form-control"
                              placeholder="Qtd."
                              min="0.01"
                              step="0.01"
                              required={item.foodId !== ''}
                              value={item.quantity}
                              onChange={event => updateItem(meal.key, item.key, { quantity: event.target.value })}
                            />
                            <span className="input-group-text">{food ? unitLabel(food.portionUnit) : 'g'}</span>
                          </div>
                        </div>
                        <div className="col-4 col-md-2 text-end small text-secondary">
                          {formatNumber(totals.calories)} kcal
                        </div>
                        <div className="col-3 col-md-auto text-end">
                          <button
                            type="button"
                            className="btn btn-sm btn-link text-danger"
                            onClick={() => removeItem(meal.key, item.key)}
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    )
                  })}

                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => addItem(meal.key)}>
                      Adicionar alimento
                    </button>
                    <span className="fw-semibold">{formatNumber(mealTotals[mealIndex].calories)} kcal</span>
                  </div>
                </section>
              ))}

              <button type="button" className="btn btn-outline-primary align-self-start" onClick={addMeal}>
                Adicionar refeição
              </button>
            </div>

            <div className="col-12 col-xl-4">
              <aside className="ns-card position-sticky" style={{ top: '1rem' }} aria-live="polite">
                <h2 className="ns-card-title mb-1">Resumo do modelo</h2>
                <p className="text-secondary mb-3">Valor energético total</p>
                <div className="ns-stat-value mb-3">{formatNumber(dietTotals.calories)} kcal</div>

                <div className="row g-2 mb-4">
                  {macros.map(macro => (
                    <div className="col-6" key={macro.label}>
                      <div className="ns-macro">
                        <div className="small text-secondary">{macro.label}</div>
                        <div className="ns-macro-value">{formatNumber(macro.value, 1)} g</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="d-grid gap-2">
                  <button type="submit" className="btn btn-primary">Salvar modelo</button>
                  <button type="button" className="btn btn-outline-secondary" onClick={handleBackButtonClick}>
                    Voltar
                  </button>
                </div>
              </aside>
            </div>
          </div>
        </fieldset>
      </form>
    </>
  )
}
